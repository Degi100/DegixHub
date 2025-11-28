import { createClient } from '@libsql/client';

const client = createClient({ url: 'file:local.db' });

async function applyMigration() {
  try {
    // Add linked_credential_id column to links table
    await client.execute(`
      ALTER TABLE links ADD COLUMN linked_credential_id text REFERENCES credentials(id) ON DELETE SET NULL
    `);
    console.log('Migration 0005 applied: Added linked_credential_id column to links');
  } catch (error: any) {
    if (error.message?.includes('duplicate column')) {
      console.log('Column already exists, skipping...');
    } else {
      console.error('Migration failed:', error);
    }
  }
}

applyMigration();
