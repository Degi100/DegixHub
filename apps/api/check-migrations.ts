import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:local.db',
});

const result = await client.execute('SELECT * FROM __drizzle_migrations ORDER BY created_at');
console.log('Migrations in DB:');
console.log(JSON.stringify(result.rows, null, 2));
process.exit(0);
