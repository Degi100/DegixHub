import { createClient } from '@libsql/client';

const client = createClient({ url: 'file:local.db' });

async function applyMigration() {
  try {
    // Add favicon column to links table
    await client.execute(`
      ALTER TABLE links ADD COLUMN favicon text
    `);
    console.log('Migration 0004 applied: Added favicon column to links');
  } catch (error: any) {
    if (error.message?.includes('duplicate column')) {
      console.log('Column already exists, skipping...');
    } else {
      console.error('Migration failed:', error);
    }
  }
}

applyMigration();
