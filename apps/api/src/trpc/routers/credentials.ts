import { eq, and, desc, inArray } from 'drizzle-orm';
import { generateId } from 'lucia';
import { parse, array, object, pipe, string, minLength, number } from 'valibot';
import {
  CredentialCreateSchema,
  CredentialUpdateSchema,
  CredentialDeleteSchema,
} from '@hub/shared/schemas';
import { db } from '../../db';
import { credentials, credentialTags, tags } from '../../db/schema';
import { encrypt, decrypt } from '../../auth/encryption';
import { router, protectedProcedure } from '../index';
import { logActivity } from '../../lib/activity-logger';

export const credentialsRouter = router({
  // Get all credentials for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userCredentials = await db.query.credentials.findMany({
      where: eq(credentials.userId, ctx.user.id),
      orderBy: [desc(credentials.isPinned), desc(credentials.createdAt)],
    });

    // Get tags for each credential
    const credentialsWithTags = await Promise.all(
      userCredentials.map(async (cred) => {
        const credTagRecords = await db
          .select({ tagId: credentialTags.tagId })
          .from(credentialTags)
          .where(eq(credentialTags.credentialId, cred.id));

        if (credTagRecords.length === 0) {
          return {
            id: cred.id,
            name: cred.name,
            category: cred.category,
            isPinned: cred.isPinned,
            pinOrder: cred.pinOrder,
            createdAt: cred.createdAt,
            tags: [],
          };
        }

        const tagIds = credTagRecords.map((ct) => ct.tagId);
        const credTagsData = await db.select().from(tags).where(inArray(tags.id, tagIds));

        return {
          id: cred.id,
          name: cred.name,
          category: cred.category,
          isPinned: cred.isPinned,
          pinOrder: cred.pinOrder,
          createdAt: cred.createdAt,
          tags: credTagsData,
        };
      })
    );

    return credentialsWithTags;
  }),

  // Get a single credential by ID (with decrypted data)
  getById: protectedProcedure
    .input((raw) => parse(object({ id: pipe(string(), minLength(1)) }), raw))
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

      // Log activity - viewed credential
      await logActivity({
        userId: ctx.user.id,
        action: 'viewed',
        resourceType: 'credential',
        resourceId: credential.id,
        resourceName: credential.name,
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

      // Assign tags if provided
      if (input.tagIds && input.tagIds.length > 0) {
        const tagValues = input.tagIds.map((tagId) => ({
          credentialId,
          tagId,
        }));
        await db.insert(credentialTags).values(tagValues);
      }

      // Log activity - created credential
      await logActivity({
        userId: ctx.user.id,
        action: 'created',
        resourceType: 'credential',
        resourceId: credentialId,
        resourceName: input.name,
        newValue: encrypted.encryptedData, // Store encrypted value
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

      // Log activity - updated credential (save old value for audit)
      await logActivity({
        userId: ctx.user.id,
        action: 'updated',
        resourceType: 'credential',
        resourceId: input.id,
        resourceName: input.name,
        oldValue: credential.encryptedData, // Old encrypted value
        newValue: encrypted.encryptedData, // New encrypted value
      });

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

      // Update tags: delete existing and insert new ones
      if (input.tagIds !== undefined) {
        // Delete existing tag assignments
        await db.delete(credentialTags).where(eq(credentialTags.credentialId, input.id));

        // Insert new tag assignments
        if (input.tagIds.length > 0) {
          const tagValues = input.tagIds.map((tagId) => ({
            credentialId: input.id,
            tagId,
          }));
          await db.insert(credentialTags).values(tagValues);
        }
      }

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

      // Log activity - deleted credential (keep old value for recovery)
      await logActivity({
        userId: ctx.user.id,
        action: 'deleted',
        resourceType: 'credential',
        resourceId: input.id,
        resourceName: credential.name,
        oldValue: credential.encryptedData, // Keep encrypted value for potential recovery
      });

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

  // Bulk delete credentials
  bulkDelete: protectedProcedure
    .input((raw) => parse(object({ ids: array(string()) }), raw))
    .mutation(async ({ ctx, input }) => {
      if (input.ids.length === 0) {
        return { success: true, count: 0 };
      }

      // Verify ownership of all credentials
      const userCredentials = await db.query.credentials.findMany({
        where: and(inArray(credentials.id, input.ids), eq(credentials.userId, ctx.user.id)),
      });

      if (userCredentials.length !== input.ids.length) {
        throw new Error('Some credentials not found or unauthorized');
      }

      // Log activity for bulk delete
      await logActivity({
        userId: ctx.user.id,
        action: 'bulk_deleted',
        resourceType: 'credential',
        resourceId: null,
        metadata: { count: input.ids.length, ids: input.ids },
      });

      // Delete credential tags first (foreign key constraint)
      await db.delete(credentialTags).where(inArray(credentialTags.credentialId, input.ids));

      // Delete credentials
      await db.delete(credentials).where(inArray(credentials.id, input.ids));

      return { success: true, count: input.ids.length };
    }),

  // Bulk assign tags to credentials
  bulkAssignTags: protectedProcedure
    .input((raw) =>
      parse(
        object({
          credentialIds: array(string()),
          tagIds: array(string()),
        }),
        raw
      )
    )
    .mutation(async ({ ctx, input }) => {
      if (input.credentialIds.length === 0 || input.tagIds.length === 0) {
        return { success: true, count: 0 };
      }

      // Verify ownership of all credentials
      const userCredentials = await db.query.credentials.findMany({
        where: and(
          inArray(credentials.id, input.credentialIds),
          eq(credentials.userId, ctx.user.id)
        ),
      });

      if (userCredentials.length !== input.credentialIds.length) {
        throw new Error('Some credentials not found or unauthorized');
      }

      // Create all combinations of credentialId and tagId
      const tagValues: Array<{ credentialId: string; tagId: string }> = [];
      for (const credentialId of input.credentialIds) {
        for (const tagId of input.tagIds) {
          // Check if already exists to avoid duplicates
          const existing = await db.query.credentialTags.findFirst({
            where: and(
              eq(credentialTags.credentialId, credentialId),
              eq(credentialTags.tagId, tagId)
            ),
          });

          if (!existing) {
            tagValues.push({ credentialId, tagId });
          }
        }
      }

      if (tagValues.length > 0) {
        await db.insert(credentialTags).values(tagValues);
      }

      // Log activity
      await logActivity({
        userId: ctx.user.id,
        action: 'bulk_tag_assigned',
        resourceType: 'credential',
        resourceId: null,
        metadata: {
          credentialCount: input.credentialIds.length,
          tagCount: input.tagIds.length,
          assignedCount: tagValues.length,
        },
      });

      return { success: true, count: tagValues.length };
    }),

  // Toggle pin status
  togglePin: protectedProcedure
    .input((raw) => parse(object({ id: string() }), raw))
    .mutation(async ({ ctx, input }) => {
      // Get current credential
      const credential = await db.query.credentials.findFirst({
        where: and(eq(credentials.id, input.id), eq(credentials.userId, ctx.user.id)),
      });

      if (!credential) {
        throw new Error('Credential not found');
      }

      // Toggle pin status
      const newPinStatus = !credential.isPinned;
      await db
        .update(credentials)
        .set({ isPinned: newPinStatus })
        .where(eq(credentials.id, input.id));

      // Log activity
      await logActivity({
        userId: ctx.user.id,
        action: newPinStatus ? 'pinned' : 'unpinned',
        resourceType: 'credential',
        resourceId: input.id,
        resourceName: credential.name,
      });

      return { success: true, isPinned: newPinStatus };
    }),

  // Update pin order for drag & drop sorting
  updatePinOrder: protectedProcedure
    .input((raw) =>
      parse(
        object({
          items: array(object({ id: string(), pinOrder: number() })),
        }),
        raw
      )
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership of all credentials
      const credentialIds = input.items.map((item) => item.id);
      const userCredentials = await db.query.credentials.findMany({
        where: and(inArray(credentials.id, credentialIds), eq(credentials.userId, ctx.user.id)),
      });

      if (userCredentials.length !== credentialIds.length) {
        throw new Error('Some credentials not found or unauthorized');
      }

      // Update pin order for each credential
      for (const item of input.items) {
        await db
          .update(credentials)
          .set({ pinOrder: item.pinOrder })
          .where(eq(credentials.id, item.id));
      }

      return { success: true };
    }),
});
