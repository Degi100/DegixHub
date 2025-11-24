import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { parse, object, string, boolean, optional } from 'valibot';
import { ImportDataSchema } from '@hub/shared/schemas';
import { db } from '../../db';
import { links, credentials, tags, linkTags, credentialTags } from '../../db/schema';
import { router, protectedProcedure } from '../index';
import { logActivity } from '../../lib/activity-logger';

export const dataExportRouter = router({
  exportData: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    // Fetch all user data (simplified - no relations for now)
    const [userLinks, userCredentials, userTags] = await Promise.all([
      db.select().from(links).where(eq(links.userId, userId)),
      db.select().from(credentials).where(eq(credentials.userId, userId)),
      db.select().from(tags).where(eq(tags.userId, userId)),
    ]);

    // Format data for export
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        links: userLinks,
        credentials: userCredentials,
        tags: userTags,
      },
    };

    // Log activity
    await logActivity({
      userId,
      action: 'data_exported',
      resourceType: 'export',
      resourceId: null,
      metadata: {
        linksCount: userLinks.length,
        credentialsCount: userCredentials.length,
        tagsCount: userTags.length,
      },
    });

    return exportData;
  }),

  importData: protectedProcedure
    .input((raw) => {
      const schema = object({
        data: string(), // JSON string of export data
        mode: string(), // 'merge' or 'replace'
        skipDuplicates: optional(boolean()),
      });
      return parse(schema, raw);
    })
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      try {
        // Parse and validate import data
        const importData = JSON.parse(input.data);
        const validatedData = parse(ImportDataSchema, importData);

        // If replace mode, delete existing data
        if (input.mode === 'replace') {
          await Promise.all([
            db.delete(linkTags).where(eq(links.userId, userId)),
            db.delete(credentialTags).where(eq(credentials.userId, userId)),
            db.delete(links).where(eq(links.userId, userId)),
            db.delete(credentials).where(eq(credentials.userId, userId)),
            db.delete(tags).where(eq(tags.userId, userId)),
          ]);
        }

        const results = {
          linksImported: 0,
          credentialsImported: 0,
          tagsImported: 0,
          skipped: 0,
          errors: [] as string[],
        };

        // Import tags first (needed for links/credentials)
        const tagMap = new Map<string, string>(); // old tag name -> new tag id

        for (const tag of validatedData.data.tags) {
          try {
            // Check if tag already exists
            const existingTag = await db.query.tags.findFirst({
              where: (t, { and, eq }) =>
                and(eq(t.userId, userId), eq(t.name, tag.name)),
            });

            if (existingTag) {
              if (input.skipDuplicates) {
                tagMap.set(tag.name, existingTag.id);
                results.skipped++;
                continue;
              }
              tagMap.set(tag.name, existingTag.id);
            } else {
              const [newTag] = await db
                .insert(tags)
                .values({
                  userId,
                  name: tag.name,
                  color: tag.color,
                })
                .returning();
              tagMap.set(tag.name, newTag.id);
              results.tagsImported++;
            }
          } catch (error) {
            results.errors.push(`Failed to import tag: ${tag.name}`);
          }
        }

        // Import links
        for (const link of validatedData.data.links) {
          try {
            // Check for duplicates
            if (input.skipDuplicates) {
              const existing = await db.query.links.findFirst({
                where: (l, { and, eq }) =>
                  and(eq(l.userId, userId), eq(l.url, link.url)),
              });
              if (existing) {
                results.skipped++;
                continue;
              }
            }

            const [newLink] = await db
              .insert(links)
              .values({
                userId,
                title: link.title,
                url: link.url,
                description: link.description || null,
                category: link.category || null,
                favicon: link.favicon || null,
              })
              .returning();

            // Add tags
            if (link.tags && Array.isArray(link.tags)) {
              for (const tagName of link.tags) {
                const tagId = tagMap.get(tagName);
                if (tagId) {
                  await db.insert(linkTags).values({
                    linkId: newLink.id,
                    tagId,
                  });
                }
              }
            }

            results.linksImported++;
          } catch (error) {
            results.errors.push(`Failed to import link: ${link.title}`);
          }
        }

        // Import credentials
        for (const cred of validatedData.data.credentials) {
          try {
            // Check for duplicates
            if (input.skipDuplicates) {
              const existing = await db.query.credentials.findFirst({
                where: (c, { and, eq }) =>
                  and(eq(c.userId, userId), eq(c.name, cred.name)),
              });
              if (existing) {
                results.skipped++;
                continue;
              }
            }

            const [newCred] = await db
              .insert(credentials)
              .values({
                userId,
                name: cred.name,
                category: cred.category || null,
                encryptedData: cred.encryptedData,
                iv: cred.iv,
              })
              .returning();

            // Add tags
            if (cred.tags && Array.isArray(cred.tags)) {
              for (const tagName of cred.tags) {
                const tagId = tagMap.get(tagName);
                if (tagId) {
                  await db.insert(credentialTags).values({
                    credentialId: newCred.id,
                    tagId,
                  });
                }
              }
            }

            results.credentialsImported++;
          } catch (error) {
            results.errors.push(`Failed to import credential: ${cred.name}`);
          }
        }

        // Log activity
        await logActivity({
          userId,
          action: 'data_imported',
          resourceType: 'import',
          resourceId: null,
          metadata: {
            mode: input.mode,
            ...results,
          },
        });

        return {
          success: true,
          ...results,
        };
      } catch (error) {
        console.error('Import error:', error);
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Failed to import data. Please check the file format.',
        });
      }
    }),
});
