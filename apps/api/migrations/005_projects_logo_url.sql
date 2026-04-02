-- Migration: Add logo_url to projects table
-- Finding #70: neon-db-error missing column

ALTER TABLE projects ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Verify the change (Informational)
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'logo_url';
