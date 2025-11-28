import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';

const client = createClient({ url: 'file:local.db' });

console.log('Applying migration 0001_add_notes...\n');

// Read and execute the SQL
const sql = readFileSync('./drizzle/0001_add_notes.sql', 'utf-8');
const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

for (const stmt of statements) {
  console.log('Executing:', stmt.substring(0, 50) + '...');
  await client.execute(stmt);
}

// Mark as applied
await client.execute({
  sql: 'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
  args: ['0001_add_notes', Date.now()]
});

console.log('\n✅ Migration applied successfully!');

// Verify
const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
console.log('\nTables:', tables.rows.map(r => r.name).join(', '));

process.exit(0);
