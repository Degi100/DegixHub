import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { generateId } from 'lucia';
import { parse, object, string } from 'valibot';
import { UserLoginSchema, UserRegisterSchema } from '@hub/shared/schemas';
import { db } from '../../db';
import { users, sessions } from '../../db/schema';
import { hashPassword, verifyPassword } from '../../auth/password';
import { lucia } from '../../auth/lucia';
import { router, publicProcedure } from '../index';
import { generateRecoveryKey } from '../../auth/encryption';

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

      return {
        success: true,
        sessionCookie: sessionCookie.serialize(),
        recoveryKey, // Return recovery key to display in Emergency Kit
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
    if (ctx.session) {
      await lucia.invalidateSession(ctx.session.id);
    }

    const sessionCookie = lucia.createBlankSessionCookie();

    return {
      success: true,
      sessionCookie: sessionCookie.serialize(),
    };
  }),

  getSession: publicProcedure.query(async ({ ctx }) => {
    return {
      user: ctx.user,
      session: ctx.session,
    };
  }),

  getRecoveryKey: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return {
      recoveryKey: user.recoveryKey,
    };
  }),

  resetPassword: publicProcedure
    .input((raw) => {
      const schema = object({
        username: string(),
        recoveryKey: string(),
        newPassword: string(),
      });
      return parse(schema, raw);
    })
    .mutation(async ({ input }) => {
      // Find user by username
      const user = await db.query.users.findFirst({
        where: eq(users.username, input.username),
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Verify recovery key
      if (user.recoveryKey !== input.recoveryKey) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid recovery key',
        });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(input.newPassword);

      // Update password
      await db.update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, user.id));

      // Invalidate all existing sessions for security
      await db.delete(sessions).where(eq(sessions.userId, user.id));

      // Create new session
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
});
