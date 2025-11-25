// Database initialization script
import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './index';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function initDatabase() {
  try {
    console.log('Initializing database...');

    // Run migrations
    await migrate(db, {
      migrationsFolder: path.join(__dirname, '../../drizzle'),
    });

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}