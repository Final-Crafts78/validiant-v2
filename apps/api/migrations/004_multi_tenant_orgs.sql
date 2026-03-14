-- Mini-Phase 4: Multi-Tenant Organization Architecture & Role Migration

-- 1. Updates to organizations table
ALTER TABLE "organizations" RENAME COLUMN "industry" TO "industry_type";
ALTER TABLE "organizations" ALTER COLUMN "industry_type" SET DEFAULT 'bgv';
UPDATE "organizations" SET "industry_type" = 'bgv' WHERE "industry_type" IS NULL;
ALTER TABLE "organizations" ALTER COLUMN "industry_type" SET NOT NULL;
ALTER TABLE "organizations" ALTER COLUMN "slug" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "organizations_slug_idx" ON "organizations" ("slug");

-- 2. Create Organization Roles table (Phase 5 Infrastructure)
CREATE TABLE IF NOT EXISTS "org_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key" varchar(50) NOT NULL,
	"description" text,
	"inherits_from" varchar(50),
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "org_roles_org_key_unique" UNIQUE("organization_id","key")
);

-- 3. Updates to organization_members table
ALTER TABLE "organization_members" ADD COLUMN "custom_role_id" uuid;
ALTER TABLE "organization_members" ADD COLUMN "invited_by_id" uuid;

-- 4. Add constraints
DO $$ BEGIN
 ALTER TABLE "org_roles" ADD CONSTRAINT "org_roles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "org_roles" ADD CONSTRAINT "org_roles_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_custom_role_id_org_roles_id_fk" FOREIGN KEY ("custom_role_id") REFERENCES "org_roles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
