import { createClient } from '@libsql/client';

const client = createClient({ url: 'file:local.db' });

async function applyMigration() {
  try {
    // Add color column to categories table
    await client.execute(`
      ALTER TABLE categories ADD COLUMN color text NOT NULL DEFAULT '#6b7280'
    `);
    console.log('Migration 0003 applied: Added color column to categories');
  } catch (error: any) {
    if (error.message?.includes('duplicate column')) {
      console.log('Column already exists, skipping...');
    } else {
      console.error('Migration failed:', error);
    }
  }
}

applyMigration();
