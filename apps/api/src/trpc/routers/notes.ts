import { TRPCError } from '@trpc/server';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { parse, object, string, boolean, optional, array } from 'valibot';
import { generateId } from 'lucia';
import { db } from '../../db';
import { notes, noteTags, tags } from '../../db/schema';
import { router, protectedProcedure } from '../index';
import { logActivity } from '../../lib/activity-logger';

export const notesRouter = router({
  // Get all notes for the current user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const userNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(desc(notes.isPinned), desc(notes.updatedAt));

    // Get tags for each note
    const notesWithTags = await Promise.all(
      userNotes.map(async (note) => {
        const noteTagRecords = await db
          .select({ tagId: noteTags.tagId })
          .from(noteTags)
          .where(eq(noteTags.noteId, note.id));

        let noteTagsData: typeof tags.$inferSelect[] = [];
        if (noteTagRecords.length > 0) {
          const tagIds = noteTagRecords.map((nt) => nt.tagId);
          noteTagsData = await db
            .select()
            .from(tags)
            .where(inArray(tags.id, tagIds));
        }

        return {
          ...note,
          tags: noteTagsData,
          linkedLink: null,
          linkedCredential: null,
        };
      })
    );

    return notesWithTags;
  }),

  // Get a single note by ID
  getById: protectedProcedure
    .input((raw) => {
      const schema = object({
        id: string(),
      });
      return parse(schema, raw);
    })
    .query(async ({ ctx, input }) => {
      const [note] = await db
        .select()
        .from(notes)
        .where(and(eq(notes.id, input.id), eq(notes.userId, ctx.user.id)));

      if (!note) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Note not found',
        });
      }

      // Get tags
      const noteTagRecords = await db
        .select({ tagId: noteTags.tagId })
        .from(noteTags)
        .where(eq(noteTags.noteId, note.id));

      let noteTagsData: typeof tags.$inferSelect[] = [];
      if (noteTagRecords.length > 0) {
        const tagIds = noteTagRecords.map((nt) => nt.tagId);
        noteTagsData = await db
          .select()
          .from(tags)
          .where(inArray(tags.id, tagIds));
      }

      return {
        ...note,
        tags: noteTagsData,
        linkedLink: null,
        linkedCredential: null,
      };
    }),

  // Create a new note
  create: protectedProcedure
    .input((raw) => {
      const schema = object({
        title: string(),
        content: string(),
        category: string(),
        tagIds: optional(array(string())),
        linkedLinkId: optional(string()),
        linkedCredentialId: optional(string()),
      });
      return parse(schema, raw);
    })
    .mutation(async ({ ctx, input }) => {
      const noteId = generateId(15);
      const userId = ctx.user.id;

      const [note] = await db
        .insert(notes)
        .values({
          id: noteId,
          userId,
          title: input.title,
          content: input.content,
          category: input.category,
          linkedLinkId: input.linkedLinkId || null,
          linkedCredentialId: input.linkedCredentialId || null,
        })
        .returning();

      // Add tags if provided
      if (input.tagIds && Array.isArray(input.tagIds)) {
        for (const tagId of input.tagIds) {
          await db.insert(noteTags).values({
            noteId,
            tagId,
          });
        }
      }

      // Log activity
      await logActivity({
        userId,
        action: 'created',
        resourceType: 'note',
        resourceId: noteId,
        resourceName: input.title,
      });

      return note;
    }),

  // Update a note
  update: protectedProcedure
    .input((raw) => {
      const schema = object({
        id: string(),
        title: optional(string()),
        content: optional(string()),
        category: optional(string()),
        isPinned: optional(boolean()),
        tagIds: optional(array(string())),
        linkedLinkId: optional(string()),
        linkedCredentialId: optional(string()),
      });
      return parse(schema, raw);
    })
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Verify ownership
      const existingNote = await db.query.notes.findFirst({
        where: (n, { and, eq }) =>
          and(eq(n.id, input.id), eq(n.userId, userId)),
      });

      if (!existingNote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Note not found',
        });
      }

      // Update note
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (input.title !== undefined) updateData.title = input.title;
      if (input.content !== undefined) updateData.content = input.content;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.isPinned !== undefined) updateData.isPinned = input.isPinned;
      if (input.linkedLinkId !== undefined)
        updateData.linkedLinkId = input.linkedLinkId || null;
      if (input.linkedCredentialId !== undefined)
        updateData.linkedCredentialId = input.linkedCredentialId || null;

      const [updatedNote] = await db
        .update(notes)
        .set(updateData)
        .where(and(eq(notes.id, input.id), eq(notes.userId, userId)))
        .returning();

      // Update tags if provided
      if (input.tagIds && Array.isArray(input.tagIds)) {
        // Remove existing tags
        await db.delete(noteTags).where(eq(noteTags.noteId, input.id));

        // Add new tags
        for (const tagId of input.tagIds) {
          await db.insert(noteTags).values({
            noteId: input.id,
            tagId,
          });
        }
      }

      // Log activity
      await logActivity({
        userId,
        action: 'updated',
        resourceType: 'note',
        resourceId: input.id,
        resourceName: updateData.title || existingNote.title,
      });

      return updatedNote;
    }),

  // Delete a note
  delete: protectedProcedure
    .input((raw) => {
      const schema = object({
        id: string(),
      });
      return parse(schema, raw);
    })
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      // Verify ownership and get note name for logging
      const note = await db.query.notes.findFirst({
        where: (n, { and, eq }) =>
          and(eq(n.id, input.id), eq(n.userId, userId)),
      });

      if (!note) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Note not found',
        });
      }

      // Delete note (tags will be cascade deleted)
      await db
        .delete(notes)
        .where(and(eq(notes.id, input.id), eq(notes.userId, userId)));

      // Log activity
      await logActivity({
        userId,
        action: 'deleted',
        resourceType: 'note',
        resourceId: null,
        resourceName: note.title,
      });

      return { success: true };
    }),

  // Toggle pin status
  togglePin: protectedProcedure
    .input((raw) => {
      const schema = object({
        id: string(),
      });
      return parse(schema, raw);
    })
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const note = await db.query.notes.findFirst({
        where: (n, { and, eq }) =>
          and(eq(n.id, input.id), eq(n.userId, userId)),
      });

      if (!note) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Note not found',
        });
      }

      const [updated] = await db
        .update(notes)
        .set({ isPinned: !note.isPinned, updatedAt: new Date() })
        .where(and(eq(notes.id, input.id), eq(notes.userId, userId)))
        .returning();

      return updated;
    }),
});
