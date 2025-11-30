import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./local.db',
});

async function applyMigration() {
  console.log('Applying migration 0007_add_pin_order...');

  try {
    // Check if column already exists
    const tableInfo = await client.execute("PRAGMA table_info(links)");
    const hasColumn = tableInfo.rows.some((row: any) => row.name === 'pin_order');

    if (hasColumn) {
      console.log('pin_order column already exists, skipping migration');
      return;
    }

    // Add pin_order to links
    await client.execute('ALTER TABLE `links` ADD `pin_order` integer DEFAULT 0');
    console.log('Added pin_order to links');

    // Add pin_order to credentials
    await client.execute('ALTER TABLE `credentials` ADD `pin_order` integer DEFAULT 0');
    console.log('Added pin_order to credentials');

    // Add pin_order to notes
    await client.execute('ALTER TABLE `notes` ADD `pin_order` integer DEFAULT 0');
    console.log('Added pin_order to notes');

    console.log('Migration 0007 applied successfully!');

    // Verify counts
    const users = await client.execute('SELECT COUNT(*) as count FROM users');
    const links = await client.execute('SELECT COUNT(*) as count FROM links');
    const credentials = await client.execute('SELECT COUNT(*) as count FROM credentials');
    const notes = await client.execute('SELECT COUNT(*) as count FROM notes');

    console.log('\nDatabase counts:');
    console.log('Users:', users.rows[0].count);
    console.log('Links:', links.rows[0].count);
    console.log('Credentials:', credentials.rows[0].count);
    console.log('Notes:', notes.rows[0].count);

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

applyMigration();
