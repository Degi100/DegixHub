import Database from 'better-sqlite3';

const db = new Database('local.db');

try {
  // Add isPinned to links
  db.exec(`ALTER TABLE links ADD COLUMN is_pinned INTEGER DEFAULT 0 NOT NULL;`);
  console.log('✓ Added is_pinned to links table');
} catch (e: any) {
  if (e.message.includes('duplicate column name')) {
    console.log('✓ is_pinned already exists in links table');
  } else {
    throw e;
  }
}

try {
  // Add isPinned to credentials
  db.exec(`ALTER TABLE credentials ADD COLUMN is_pinned INTEGER DEFAULT 0 NOT NULL;`);
  console.log('✓ Added is_pinned to credentials table');
} catch (e: any) {
  if (e.message.includes('duplicate column name')) {
    console.log('✓ is_pinned already exists in credentials table');
  } else {
    throw e;
  }
}

db.close();
console.log('✓ Migration complete');
