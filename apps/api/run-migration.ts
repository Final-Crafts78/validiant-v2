/* eslint-disable no-console */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

async function runMigrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
  }

  try {
    console.log('Initializing Neon connection...');
    const sql = neon(connectionString);
    const db = drizzle(sql as Parameters<typeof drizzle>[0]);

    console.log('Applying migrations from ./drizzle folder...');
    await migrate(db, {
      migrationsFolder: path.resolve(__dirname, './drizzle'),
    });

    console.log('✅ Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrate();
