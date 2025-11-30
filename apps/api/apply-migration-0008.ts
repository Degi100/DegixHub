import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./local.db',
});

async function applyMigration() {
  console.log('Applying migration 0008_add_links_updated_at...');

  try {
    // Check if column already exists
    const tableInfo = await client.execute("PRAGMA table_info(links)");
    const hasColumn = tableInfo.rows.some((row: any) => row.name === 'updated_at');

    if (hasColumn) {
      console.log('updated_at column already exists, skipping migration');
      return;
    }

    // Add updated_at to links (default to current timestamp)
    await client.execute('ALTER TABLE `links` ADD `updated_at` integer');
    console.log('Added updated_at column to links');

    // Set updated_at to created_at for existing rows
    await client.execute('UPDATE `links` SET `updated_at` = `created_at` WHERE `updated_at` IS NULL');
    console.log('Set updated_at = created_at for existing links');

    console.log('Migration 0008 applied successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

applyMigration();
