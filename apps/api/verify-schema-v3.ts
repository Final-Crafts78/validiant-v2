/* eslint-disable no-console */
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

async function verifySchemaFix() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    process.exit(1);
  }

  try {
    const sql = neon(connectionString);
    const results: any = {};

    // Check projects table
    const projectCols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name IN ('auto_dispatch_verified', 'theme_color', 'logo_url')
    `;
    results.projects = projectCols.map((c: any) => c.column_name);

    // Check verification_types table
    const vtCols = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'verification_types' 
      AND column_name = 'is_system_template'
    `;
    results.verification_types = vtCols.map((c: any) => c.column_name);

    console.log('--- SCHEMA VERIFICATION RESULTS ---');
    console.log(JSON.stringify(results, null, 2));

    const missingProjects = ['auto_dispatch_verified', 'theme_color', 'logo_url'].filter(
      c => !results.projects.includes(c)
    );
    const missingVT = !results.verification_types.includes('is_system_template');

    if (missingProjects.length === 0 && !missingVT) {
      console.log('✅ ALL COLUMNS VERIFIED!');
      process.exit(0);
    } else {
      console.log('❌ MISSING COLUMNS:', { projects: missingProjects, vt: missingVT ? ['is_system_template'] : [] });
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  }
}

verifySchemaFix();
