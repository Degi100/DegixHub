import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { generateId } from 'lucia';
import { parse } from 'valibot';
import { UserLoginSchema, UserRegisterSchema } from '@hub/shared/schemas';
import { db } from '../../db';
import { users } from '../../db/schema';
import { hashPassword, verifyPassword } from '../../auth/password';
import { lucia } from '../../auth/lucia';
import { router, publicProcedure } from '../index';

export const authRouter = router({
  register: publicProcedure
    .input((raw) => parse(UserRegisterSchema, raw))
    .mutation(async ({ input }) => {
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, input.username),
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Username already exists',
        });
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Create user
      const userId = generateId(15);
      await db.insert(users).values({
        id: userId,
        username: input.username,
        passwordHash,
      });

      // Create session
      const session = await lucia.createSession(userId, {});
      const sessionCookie = lucia.createSessionCookie(session.id);

      return {
        success: true,
        sessionCookie: sessionCookie.serialize(),
      };
    }),

  login: publicProcedure
    .input((raw) => parse(UserLoginSchema, raw))
    .mutation(async ({ input }) => {
      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.username, input.username),
      });

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid username or password',
        });
      }

      // Verify password
      const validPassword = await verifyPassword(user.passwordHash, input.password);

      if (!validPassword) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid username or password',
        });
      }

      // Create session
      const session = await lucia.createSession(user.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);

      return {
        success: true,
        sessionCookie: sessionCookie.serialize(),
        user: {
          id: user.id,
          username: user.username,
        },
      };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    // We'll implement session handling in context later
    // For now, return a blank session cookie
    const sessionCookie = lucia.createBlankSessionCookie();

    return {
      success: true,
      sessionCookie: sessionCookie.serialize(),
    };
  }),

  getSession: publicProcedure.query(async ({ ctx }) => {
    // We'll get session from context later
    // For now, return null
    return {
      user: null,
      session: null,
    };
  }),
});
