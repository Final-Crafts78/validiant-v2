import { db } from './index';
import {
  verificationTypes,
  projects,
  projectTypes,
  typeColumns,
} from './schema';
import { eq, isNull, and } from 'drizzle-orm';

/**
 * Migration Script: VerificationTypes → ProjectTypes
 * 
 * This script migrates legacy organization-level VerificationTypes 
 * into the new Project-scoped "Data Universe" schema.
 * 
 * "Data Driven Perfection" - Phase 1.5 Induction.
 */

async function migrateVerificationTypes() {
  console.log('🚀 Starting VerificationTypes → ProjectTypes migration...');

  // 1. Fetch all active verification types
  const legacyTypes = await db.query.verificationTypes.findMany({
    where: eq(verificationTypes.isActive, true),
  });

  console.log(`Found ${legacyTypes.length} legacy types to migrate.`);

  // 2. Fetch all active projects
  const activeProjects = await db.query.projects.findMany({
    where: isNull(projects.deletedAt),
  });

  console.log(`Processing ${activeProjects.length} projects...`);

  const FIELD_TYPE_MAP: Record<string, any> = {
    text: 'text',
    number: 'number',
    date: 'date',
    boolean: 'boolean',
    select: 'select',
    multi_select: 'multi_select',
    photo_capture: 'photo_capture',
    gps_location: 'gps_location',
    signature: 'signature',
    rating: 'rating',
  };

  for (const project of activeProjects) {
    console.log(`\n📂 Project: ${project.name} (${project.id})`);

    // Filter types belonging to this project's organization (or system types)
    const projectLegacyTypes = legacyTypes.filter(
      (lt: any) => !lt.organizationId || lt.organizationId === project.organizationId
    );

    for (const vt of projectLegacyTypes) {
      // 3. Create ProjectType
      // Check if already exists to prevent duplicates
      const existing = await db.query.projectTypes.findFirst({
        where: and(
          eq(projectTypes.projectId, project.id),
          eq(projectTypes.name, vt.name)
        ),
      });

      if (existing) {
        console.log(`  - Type "${vt.name}" already exists. Skipping.`);
        continue;
      }

      const [newType] = await db.insert(projectTypes).values({
        projectId: project.id,
        name: vt.name,
        description: `Migrated from verification type: ${vt.code}`,
        settings: {
          slaHours: vt.slaOverrideHours ?? 72,
          gpsRequired: false,
        },
      }).returning();

      console.log(`  ✅ Created type "${vt.name}" (ID: ${newType.id})`);

      // 4. Convert field_schema array → type_columns rows
      // Note: We need to fetch the LATEST version of the field schema
      const versionResult = await db.execute(sql`
        SELECT field_schema FROM field_schema_versions 
        WHERE verification_type_id = ${vt.id} 
        ORDER BY version DESC LIMIT 1
      `);
      
      const fields = (versionResult.rows[0]?.field_schema as any[]) || [];

      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        const mappedType = FIELD_TYPE_MAP[f.type] || 'text';

        await db.insert(typeColumns).values({
          typeId: newType.id,
          projectId: project.id,
          name: f.label || f.fieldKey,
          key: f.fieldKey,
          columnType: mappedType,
          options: f.options ? { choices: f.options } : undefined,
          settings: {
            required: f.required ?? false,
            showInList: true,
            showInCard: true,
            showInMobile: true,
            hint: f.prompt || undefined,
            visibleTo: f.readRoles || ['admin', 'member'],
          },
          order: i,
        });
      }
      console.log(`     - Migrated ${fields.length} columns.`);
    }
  }

  console.log('\n✨ Migration complete.');
}

// Helper to handle raw SQL in migration
import { sql } from 'drizzle-orm';

migrateVerificationTypes()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
