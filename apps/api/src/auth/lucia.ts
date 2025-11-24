import { Lucia } from 'lucia';
import { LibSQLAdapter } from '@lucia-auth/adapter-sqlite';
import { db } from '../db';

// Note: Lucia v3 adapter setup for LibSQL
// We'll use a simple session table approach
export const lucia = new Lucia(
  new LibSQLAdapter(db, {
    user: 'users',
    session: 'sessions',
  }),
  {
    sessionCookie: {
      attributes: {
        secure: process.env.NODE_ENV === 'production',
      },
    },
    getUserAttributes: (attributes) => ({
      username: attributes.username,
    }),
  }
);

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      username: string;
    };
  }
}
