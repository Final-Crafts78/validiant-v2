/* eslint-disable no-console */
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('❌ DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  const sql = neon(url);
  console.log('Connecting to database to perform full wipe...');

  const tables = [
    'users',
    'passkey_credentials',
    'password_reset_tokens',
    'email_verification_tokens',
    'organizations',
    'org_roles',
    'organization_members',
    'organization_invitations',
    'projects',
    'project_members',
    'tasks',
    'task_assignees',
    'task_comments',
    'push_tokens',
    'activity_logs',
    'time_entries',
    'automations',
    'notifications',
    'verification_types',
    'field_schema_versions',
    'case_field_values',
    'case_document_uploads',
    'bgv_partners',
    'outbound_delivery_logs',
    'org_analytics_snapshots'
  ];

  try {
    console.log('Truncating all tables with CASCADE...');
    // We use a single query to truncate all to handle dependencies
    await sql(`TRUNCATE TABLE ${tables.join(', ')} CASCADE;`);
    console.log('✅ Database wiped successfully!');
    console.log('Now you can run "pnpm db:push" and it will work perfectly on the clean database.');
  } catch (error) {
    console.error('❌ Failed to wipe database:', error);
    process.exit(1);
  }
}

main();
