import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { generateId } from 'lucia';
import { parse } from 'valibot';
import { UserLoginSchema, UserRegisterSchema } from '@hub/shared/schemas';
import { db } from '../db';
import { users } from '../db/schema';
import { hashPassword, verifyPassword } from '../auth/password';
import { lucia } from '../auth/lucia';
import { generateRecoveryKey } from '../auth/encryption';

const authRoutes = new Hono();

// Register endpoint
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const input = parse(UserRegisterSchema, body);

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, input.username),
    });

    if (existingUser) {
      return c.json({ error: 'Username already exists' }, 409);
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Generate recovery key
    const recoveryKey = generateRecoveryKey();

    // Create user
    const userId = generateId(15);
    await db.insert(users).values({
      id: userId,
      username: input.username,
      passwordHash,
      recoveryKey,
    });

    // Create session
    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Set cookie in response header
    c.header('Set-Cookie', sessionCookie.serialize());

    return c.json({
      result: {
        data: {
          success: true,
          user: {
            id: userId,
            username: input.username,
          },
          recoveryKey, // Return recovery key to display in Emergency Kit
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: 'Registration failed' }, 400);
  }
});

// Login endpoint
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const input = parse(UserLoginSchema, body);

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.username, input.username),
    });

    if (!user) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }

    // Verify password
    const validPassword = await verifyPassword(user.passwordHash, input.password);

    if (!validPassword) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }

    // Create session
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    // Set cookie in response header
    c.header('Set-Cookie', sessionCookie.serialize());

    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 400);
  }
});

// Logout endpoint
authRoutes.post('/logout', async (c) => {
  try {
    const sessionId = lucia.readSessionCookie(c.req.header('Cookie') ?? '');

    if (sessionId) {
      await lucia.invalidateSession(sessionId);
    }

    const sessionCookie = lucia.createBlankSessionCookie();
    c.header('Set-Cookie', sessionCookie.serialize());

    return c.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Logout failed' }, 400);
  }
});

export default authRoutes;
