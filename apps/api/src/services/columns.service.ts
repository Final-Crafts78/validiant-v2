import { db } from '../db';
import { typeColumns } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { ApiError } from '../utils/errors';
import { NewTypeColumn } from '../db/schema';

/**
 * Type Columns Service
 * Part of the Schema Architect engine.
 */

/**
 * List columns for a specific type
 */
export const listTypeColumns = async (typeId: string) => {
  return db.query.typeColumns.findMany({
    where: eq(typeColumns.typeId, typeId),
    orderBy: [asc(typeColumns.order)],
  });
};

/**
 * Create a new Column for a Type
 */
export const createTypeColumn = async (
  typeId: string,
  projectId: string,
  data: Partial<NewTypeColumn>
) => {
  const [newColumn] = await db
    .insert(typeColumns)
    .values({
      ...data,
      typeId,
      projectId,
      name: data.name!,
      key: data.key!,
      columnType: data.columnType!,
    } as NewTypeColumn)
    .returning();

  return newColumn;
};

/**
 * Update a Column
 */
export const updateTypeColumn = async (
  id: string,
  data: Partial<NewTypeColumn>
) => {
  const [updated] = await db
    .update(typeColumns)
    .set(data)
    .where(eq(typeColumns.id, id))
    .returning();

  if (!updated) throw new ApiError('Column not found', 404);
  return updated;
};

/**
 * Delete a Column
 */
export const deleteTypeColumn = async (id: string) => {
  await db.delete(typeColumns).where(eq(typeColumns.id, id));
};

/**
 * Reorder columns for a type
 */
export const reorderColumns = async (_typeId: string, columnIds: string[]) => {
  return await db.transaction(async (tx: any) => {
    for (let i = 0; i < columnIds.length; i++) {
      await tx
        .update(typeColumns)
        .set({ order: i })
        .where(eq(typeColumns.id, columnIds[i]));
    }
  });
};
