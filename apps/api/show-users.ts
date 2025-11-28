import { createClient } from '@libsql/client';

const client = createClient({
  url: 'file:local.db',
});

const result = await client.execute('SELECT id, username, created_at FROM users');
console.log('Users in DB:');
console.log(JSON.stringify(result.rows, null, 2));
console.log(`\nTotal: ${result.rows.length} user(s)`);

process.exit(0);
