import * as dotenv from 'dotenv';
dotenv.config();

// Standard for our lazy-loaded db.ts
(globalThis as any).__ENV__ = {
  DATABASE_URL: process.env.DATABASE_URL,
};

import { db } from '../db/index';
import { 
  verificationTypes, 
  tasks, 
  caseFieldValues,
  projectTypes,
  typeColumns,
  records,
  projects
} from '../db/schema';
import { eq } from 'drizzle-orm';
import { uuid } from 'drizzle-orm/pg-core';
import { v4 as uuidv4 } from 'uuid';

async function migrate() {
  console.log('🚀 Starting Data Migration: Verification → Project Universe');

  try {
    // 1. Fetch all verification types (templates)
    const allVTs = await db.select().from(verificationTypes);
    console.log(`Found ${allVTs.length} verification types to migrate.`);

    for (const vt of allVTs) {
      console.log(`\nProcessing VT: ${vt.name} (${vt.code})`);

      // 2. For each VT, find all projects in its organization
      if (!vt.organizationId) {
        console.log(`Skipping system template ${vt.code}`);
        continue;
      }

      const orgProjects = await db.select()
        .from(projects)
        .where(eq(projects.organizationId, vt.organizationId));

      console.log(`Found ${orgProjects.length} projects in organization ${vt.organizationId}`);

      for (const project of orgProjects) {
        console.log(`  Migrating to Project: ${project.name} (${project.id})`);

        // Check if project_type already exists for this project/code
        // (Actually code isn't in project_types, but we'll use name or a manual check)
        const [existingType] = await db.select()
          .from(projectTypes)
          .where(eq(projectTypes.projectId, project.id))
          .limit(1); // Simplification: assume 1:1 for now if needed, or check by name

        // Since name is not necessarily unique across VTs, we'll just create it.
        // In a real migration we'd check for duplicates.
        
        const typeId = uuidv4();
        await db.insert(projectTypes).values({
          id: typeId,
          projectId: project.id,
          name: vt.name,
          description: vt.code, // Put code in description for tracking
          icon: 'ShieldCheck', // Default icon
          color: '#4F46E5', // Default color
        });

        console.log(`    Created ProjectType: ${vt.name} (ID: ${typeId})`);

        // 3. Create Type Columns from fieldSchema
        const fields = vt.fieldSchema as any[];
        const columnMap = new Map<string, string>(); // fieldKey -> columnId

        for (let i = 0; i < fields.length; i++) {
          const field = fields[i];
          const columnId = uuidv4();
          
          await db.insert(typeColumns).values({
            id: columnId,
            typeId: typeId,
            projectId: project.id,
            name: field.label || field.name || field.key,
            key: field.key,
            columnType: mapFieldType(field.type),
            order: i,
            options: field.options || null,
          });
          
          columnMap.set(field.key, columnId);
          console.log(`      Created TypeColumn: ${field.key}`);
        }

        // 4. Migrate Tasks for this VT and Project
        const projectTasks = await db.select()
          .from(tasks)
          .where(eq(tasks.projectId, project.id))
          .where(eq(tasks.verificationTypeId, vt.id));

        console.log(`    Found ${projectTasks.length} tasks to migrate.`);

        for (const task of projectTasks) {
          // Fetch case field values for this task
          const fieldValues = await db.select()
            .from(caseFieldValues)
            .where(eq(caseFieldValues.taskId, task.id));

          const recordData: Record<string, any> = {};
          for (const fv of fieldValues) {
            // Pick the non-null value based on our old EAV pattern
            const val = fv.valueText ?? fv.valueNumber ?? fv.valueDate ?? fv.valueBoolean ?? fv.valueJson;
            recordData[fv.fieldKey] = val;
          }

          // Create the record
          await db.insert(records).values({
            projectId: project.id,
            typeId: typeId,
            number: task.number || 0, // Fallback if number is null
            displayId: task.caseId || `${project.key}-${task.number}`,
            data: recordData,
            status: mapTaskStatus(task.statusKey),
            assignedTo: task.assigneeId,
            createdBy: task.createdById,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
          });
          
          console.log(`      Migrated Task ${task.id} → Record`);
        }
      }
    }

    console.log('\n✅ Data Migration completed successfully');
  } catch (error) {
    console.error('❌ Data Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

function mapFieldType(oldType: string): string {
  const map: Record<string, string> = {
    'text': 'TEXT',
    'number': 'NUMBER',
    'date': 'DATE',
    'boolean': 'BOOLEAN',
    'select': 'SELECT',
    'multi-select': 'MULTI_SELECT',
    'photo': 'PHOTO',
    'gps': 'GPS',
    'signature': 'SIGNATURE',
  };
  return map[oldType] || 'TEXT';
}

function mapTaskStatus(status: string): string {
  // Simplification: keep old status or map to new ones
  return status.toLowerCase();
}

migrate();
