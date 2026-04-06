import * as dotenv from 'dotenv';
dotenv.config();
import { neon } from '@neondatabase/serverless';

async function applyDDL() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('No DATABASE_URL');
  
  const sql = neon(url);
  console.log('🚀 Applying Project Universe DDL...');

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "project_types" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "description" text,
        "icon" text,
        "color" text,
        "order" integer DEFAULT 0,
        "settings" jsonb DEFAULT '{}',
        "created_by" uuid REFERENCES "users"("id"),
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        UNIQUE("project_id", "name")
      );
    `;
    console.log('✅ Created project_types');

    await sql`
      CREATE TABLE IF NOT EXISTS "type_columns" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "type_id" uuid NOT NULL REFERENCES "project_types"("id") ON DELETE CASCADE,
        "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "key" text NOT NULL,
        "column_type" text NOT NULL,
        "options" jsonb,
        "settings" jsonb DEFAULT '{}',
        "order" integer DEFAULT 0,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        UNIQUE("type_id", "key")
      );
    `;
    console.log('✅ Created type_columns');

    await sql`
      CREATE TABLE IF NOT EXISTS "records" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
        "type_id" uuid NOT NULL REFERENCES "project_types"("id"),
        "number" integer NOT NULL,
        "display_id" text,
        "data" jsonb DEFAULT '{}' NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "assigned_to" uuid REFERENCES "users"("id"),
        "created_by" uuid REFERENCES "users"("id"),
        "created_via" text DEFAULT 'web',
        "client_id" text,
        "gps_lat" real,
        "gps_lng" real,
        "gps_accuracy" real,
        "submitted_at" timestamp with time zone,
        "closed_at" timestamp with time zone,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
        "deleted_at" timestamp with time zone,
        UNIQUE("project_id", "number")
      );
    `;
    console.log('✅ Created records');

    await sql`
      CREATE TABLE IF NOT EXISTS "record_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "record_id" uuid NOT NULL REFERENCES "records"("id") ON DELETE CASCADE,
        "changed_by" uuid REFERENCES "users"("id"),
        "change_type" text NOT NULL,
        "diff" jsonb,
        "ip_address" text,
        "user_agent" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `;
    console.log('✅ Created record_history');

    console.log('🏆 All core tables created successfully');
  } catch (err: any) {
    console.error('❌ DDL Failed:', err);
  } finally {
    process.exit(0);
  }
}

applyDDL();
