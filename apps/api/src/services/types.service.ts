import { db } from '../db';
import { projectTypes, typeColumns } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { ApiError } from '../utils/errors';
import { 
  NewProjectType 
} from '../db/schema';

/**
 * Project Types & Columns Service
 * Core logic for the Schema Architect engine.
 */

/**
 * List all types for a project, including their columns
 */
export const listProjectTypes = async (projectId: string) => {
  const types = await db.query.projectTypes.findMany({
    where: eq(projectTypes.projectId, projectId),
    orderBy: [asc(projectTypes.order)],
    with: {
      columns: {
        orderBy: [asc(typeColumns.order)],
      },
    },
  });
  return types;
};

/**
 * Create a new Project Type
 */
export const createProjectType = async (
  projectId: string,
  data: Partial<NewProjectType>
) => {
  const [newType] = await db
    .insert(projectTypes)
    .values({
      ...data,
      projectId,
      name: data.name!,
    } as NewProjectType)
    .returning();
  
  return newType;
};

/**
 * Get a specific Project Type by ID
 */
export const getProjectTypeById = async (id: string) => {
  return db.query.projectTypes.findFirst({
    where: eq(projectTypes.id, id),
    with: {
      columns: {
        orderBy: [asc(typeColumns.order)],
      },
    },
  });
};

/**
 * Update a Project Type
 */
export const updateProjectType = async (
  id: string,
  data: Partial<NewProjectType>
) => {
  const [updated] = await db
    .update(projectTypes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projectTypes.id, id))
    .returning();
  
  if (!updated) throw new ApiError(404, 'Project type not found');
  return updated;
};

/**
 * Delete a Project Type (Cascade deletes columns via DB constraint)
 */
export const deleteProjectType = async (id: string) => {
  await db.delete(projectTypes).where(eq(projectTypes.id, id));
};
