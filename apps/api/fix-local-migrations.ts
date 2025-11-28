import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:local.db',
});

console.log('Fixing local migration tracking...\n');

// Check current state
const before = await client.execute('SELECT * FROM __drizzle_migrations');
console.log('Before:', before.rows);

// Mark migration 0000 as already applied
await client.execute({
  sql: 'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
  args: ['0000_bent_radioactive_man', Date.now()]
});

console.log('\n✅ Migration 0000 marked as applied');

const after = await client.execute('SELECT * FROM __drizzle_migrations');
console.log('\nAfter:', after.rows);
console.log('\n🎉 Jetzt kann pnpm dev die neue Migration 0001 ausführen!');

process.exit(0);
