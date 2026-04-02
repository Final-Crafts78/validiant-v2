-- 0003_custom_command_center.sql
-- Add Command Center customization columns to PROJECTS
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "theme_color" varchar(7) DEFAULT '#4F46E5';
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "logo_url" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "auto_dispatch_verified" boolean DEFAULT false NOT NULL;

-- Add Enterprise Automation columns to ORGANIZATIONS
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "auto_dispatch_verified" boolean DEFAULT false NOT NULL;

-- Add System Template columns to VERIFICATION_TYPES
ALTER TABLE "verification_types" ADD COLUMN IF NOT EXISTS "is_system_template" boolean DEFAULT false NOT NULL;
