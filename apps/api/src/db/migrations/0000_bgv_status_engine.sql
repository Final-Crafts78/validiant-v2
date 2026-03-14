-- Custom Migration: BGV Status Engine
-- Transforms legacy 'status' string column to the new immutable 'status_key' state machine keys.

-- 1. Add the new column
ALTER TABLE "tasks" ADD COLUMN "status_key" text DEFAULT 'UNASSIGNED' NOT NULL;

-- 2. Migrate existing values intelligently based on the legacy schema
UPDATE "tasks" SET "status_key" = 'UNASSIGNED' WHERE "status" = 'Unassigned';
UPDATE "tasks" SET "status_key" = 'PENDING_REVIEW' WHERE "status" = 'Pending';
UPDATE "tasks" SET "status_key" = 'IN_PROGRESS' WHERE "status" = 'In Progress';
-- Mapping legacy Completed to PENDING_REVIEW or VERIFIED depending on flow, but assuming COMPLETED was a valid transitional state
UPDATE "tasks" SET "status_key" = 'PENDING_REVIEW' WHERE "status" = 'Completed'; 
UPDATE "tasks" SET "status_key" = 'VERIFIED' WHERE "status" = 'Verified';

-- 3. Drop the old column
ALTER TABLE "tasks" DROP COLUMN "status";
