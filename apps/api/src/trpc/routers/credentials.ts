import { eq, and, desc } from 'drizzle-orm';
import { generateId } from 'lucia';
import { parse, array } from 'valibot';
import {
  CredentialCreateSchema,
  CredentialUpdateSchema,
  CredentialDeleteSchema,
} from '@hub/shared/schemas';
import { db } from '../../db';
import { credentials } from '../../db/schema';
import { encrypt, decrypt } from '../../auth/encryption';
import { router, protectedProcedure } from '../index';

export const credentialsRouter = router({
  // Get all credentials for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userCredentials = await db.query.credentials.findMany({
      where: eq(credentials.userId, ctx.user.id),
      orderBy: [desc(credentials.createdAt)],
    });

    // Return credentials with encrypted data (not decrypted for list view)
    return userCredentials.map((cred) => ({
      id: cred.id,
      name: cred.name,
      category: cred.category,
      createdAt: cred.createdAt,
      // Don't send encrypted data in list view for security
    }));
  }),

  // Get a single credential by ID (with decrypted data)
  getById: protectedProcedure
    .input((raw) => parse({ id: raw as string }))
    .query(async ({ ctx, input }) => {
      const credential = await db.query.credentials.findFirst({
        where: and(eq(credentials.id, input.id), eq(credentials.userId, ctx.user.id)),
      });

      if (!credential) {
        throw new Error('Credential not found');
      }

      // Decrypt the data
      const decryptedData = decrypt({
        encryptedData: credential.encryptedData,
        iv: credential.iv,
        authTag: credential.authTag,
      });

      return {
        id: credential.id,
        name: credential.name,
        category: credential.category,
        data: decryptedData,
        createdAt: credential.createdAt,
      };
    }),

  // Create a new credential
  create: protectedProcedure
    .input((raw) => parse(CredentialCreateSchema, raw))
    .mutation(async ({ ctx, input }) => {
      const credentialId = generateId(15);

      // Encrypt the sensitive data
      const encrypted = encrypt(input.data);

      await db.insert(credentials).values({
        id: credentialId,
        userId: ctx.user.id,
        name: input.name,
        category: input.category,
        encryptedData: encrypted.encryptedData,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
      });

      return { success: true, id: credentialId };
    }),

  // Update a credential
  update: protectedProcedure
    .input((raw) => parse(CredentialUpdateSchema, raw))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const credential = await db.query.credentials.findFirst({
        where: and(eq(credentials.id, input.id), eq(credentials.userId, ctx.user.id)),
      });

      if (!credential) {
        throw new Error('Credential not found');
      }

      // Encrypt the new data
      const encrypted = encrypt(input.data);

      await db
        .update(credentials)
        .set({
          name: input.name,
          category: input.category,
          encryptedData: encrypted.encryptedData,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
        })
        .where(eq(credentials.id, input.id));

      return { success: true };
    }),

  // Delete a credential
  delete: protectedProcedure
    .input((raw) => parse(CredentialDeleteSchema, raw))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const credential = await db.query.credentials.findFirst({
        where: and(eq(credentials.id, input.id), eq(credentials.userId, ctx.user.id)),
      });

      if (!credential) {
        throw new Error('Credential not found');
      }

      await db.delete(credentials).where(eq(credentials.id, input.id));

      return { success: true };
    }),

  // Bulk import credentials
  import: protectedProcedure
    .input((raw) => parse(array(CredentialCreateSchema), raw))
    .mutation(async ({ ctx, input }) => {
      const credentialValues = input.map((cred) => {
        const encrypted = encrypt(cred.data);
        return {
          id: generateId(15),
          userId: ctx.user.id,
          name: cred.name,
          category: cred.category,
          encryptedData: encrypted.encryptedData,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
        };
      });

      await db.insert(credentials).values(credentialValues);

      return { success: true, count: credentialValues.length };
    }),
});
