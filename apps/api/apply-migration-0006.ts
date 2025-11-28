import { createClient } from '@libsql/client';

const client = createClient({ url: 'file:local.db' });

async function applyMigration() {
  try {
    // Add security_pin_hash column to users table
    await client.execute(`
      ALTER TABLE users ADD COLUMN security_pin_hash text
    `);
    console.log('Migration 0006 applied: Added security_pin_hash column to users');
  } catch (error: any) {
    if (error.message?.includes('duplicate column')) {
      console.log('Column already exists, skipping...');
    } else {
      console.error('Migration failed:', error);
    }
  }
}

applyMigration();
