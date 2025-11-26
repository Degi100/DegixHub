import { Lucia } from 'lucia';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { db } from '../db';
import { sessions, users } from '../db/schema';

// Lucia adapter for Drizzle + LibSQL
const adapter = new DrizzleSQLiteAdapter(db, sessions, users);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: 'auth_session',
    attributes: {
      // Disable secure for HTTP (no HTTPS available)
      secure: false,
      sameSite: 'lax',
      path: '/',
    },
  },
  getUserAttributes: (attributes) => ({
    username: attributes.username,
  }),
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      username: string;
    };
  }
}
