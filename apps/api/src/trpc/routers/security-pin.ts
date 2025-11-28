import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { parse, object, string, pipe, length, regex } from 'valibot';
import { db } from '../../db';
import { users } from '../../db/schema';
import { hashPassword, verifyPassword } from '../../auth/password';
import { router, protectedProcedure } from '../index';

// Schema for 4-digit PIN
const PinSchema = object({
  pin: pipe(
    string(),
    length(4, 'PIN must be exactly 4 digits'),
    regex(/^\d{4}$/, 'PIN must contain only digits')
  ),
});

const VerifyPinSchema = object({
  pin: string(),
});

const ChangePinSchema = object({
  oldPin: string(),
  newPin: pipe(
    string(),
    length(4, 'PIN must be exactly 4 digits'),
    regex(/^\d{4}$/, 'PIN must contain only digits')
  ),
});

const ResetPinWithRecoverySchema = object({
  recoveryKey: string(),
  newPin: pipe(
    string(),
    length(4, 'PIN must be exactly 4 digits'),
    regex(/^\d{4}$/, 'PIN must contain only digits')
  ),
});

const VerifyRecoveryKeySchema = object({
  recoveryKey: string(),
});

export const securityPinRouter = router({
  // Check if user has a PIN set
  hasPin: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });

    return {
      hasPin: !!user?.securityPinHash,
    };
  }),

  // Set or update PIN
  setPin: protectedProcedure
    .input((raw) => parse(PinSchema, raw))
    .mutation(async ({ ctx, input }) => {
      // Hash the PIN
      const pinHash = await hashPassword(input.pin);

      // Update user with new PIN hash
      await db
        .update(users)
        .set({ securityPinHash: pinHash })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
      };
    }),

  // Verify PIN
  verifyPin: protectedProcedure
    .input((raw) => parse(VerifyPinSchema, raw))
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });

      if (!user?.securityPinHash) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No PIN set for this user',
        });
      }

      const isValid = await verifyPassword(user.securityPinHash, input.pin);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid PIN',
        });
      }

      return {
        success: true,
      };
    }),

  // Remove PIN (optional - for settings)
  removePin: protectedProcedure.mutation(async ({ ctx }) => {
    await db
      .update(users)
      .set({ securityPinHash: null })
      .where(eq(users.id, ctx.user.id));

    return {
      success: true,
    };
  }),

  // Change PIN (requires old PIN)
  changePin: protectedProcedure
    .input((raw) => parse(ChangePinSchema, raw))
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });

      if (!user?.securityPinHash) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No PIN set for this user',
        });
      }

      // Verify old PIN
      const isValid = await verifyPassword(user.securityPinHash, input.oldPin);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Alter PIN ist falsch',
        });
      }

      // Hash and set new PIN
      const newPinHash = await hashPassword(input.newPin);
      await db
        .update(users)
        .set({ securityPinHash: newPinHash })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
      };
    }),

  // Verify Recovery Key
  verifyRecoveryKey: protectedProcedure
    .input((raw) => parse(VerifyRecoveryKeySchema, raw))
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      if (user.recoveryKey !== input.recoveryKey) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Ungültiger Sicherheitscode',
        });
      }

      return {
        success: true,
      };
    }),

  // Reset PIN with Recovery Key
  resetPinWithRecovery: protectedProcedure
    .input((raw) => parse(ResetPinWithRecoverySchema, raw))
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
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
          message: 'Ungültiger Sicherheitscode',
        });
      }

      // Hash and set new PIN
      const newPinHash = await hashPassword(input.newPin);
      await db
        .update(users)
        .set({ securityPinHash: newPinHash })
        .where(eq(users.id, ctx.user.id));

      return {
        success: true,
      };
    }),
});
