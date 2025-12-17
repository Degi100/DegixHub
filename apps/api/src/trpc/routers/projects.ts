import { eq, and, desc, inArray } from 'drizzle-orm';
import { generateId } from 'lucia';
import { parse, object, pipe, string, minLength } from 'valibot';
import {
  ProjectCreateSchema,
  ProjectUpdateSchema,
  ProjectDeleteSchema,
  ProjectGetByIdSchema,
} from '@hub/shared/schemas';
import { db } from '../../db';
import { projects, projectLinks, projectCredentials, links, credentials } from '../../db/schema';
import { encrypt, decrypt } from '../../auth/encryption';
import { router, protectedProcedure } from '../index';
import { logActivity } from '../../lib/activity-logger';

export const projectsRouter = router({
  // Get all projects for the current user (without decrypted dbConnection)
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userProjects = await db.query.projects.findMany({
      where: eq(projects.userId, ctx.user.id),
      orderBy: [desc(projects.createdAt)],
    });

    // Get linked items for each project
    const projectsWithLinks = await Promise.all(
      userProjects.map(async (project) => {
        // Get linked link IDs
        const linkedLinkRecords = await db
          .select({ linkId: projectLinks.linkId })
          .from(projectLinks)
          .where(eq(projectLinks.projectId, project.id));
        const linkedLinkIds = linkedLinkRecords.map((r) => r.linkId);

        // Get linked credential IDs
        const linkedCredentialRecords = await db
          .select({ credentialId: projectCredentials.credentialId })
          .from(projectCredentials)
          .where(eq(projectCredentials.projectId, project.id));
        const linkedCredentialIds = linkedCredentialRecords.map((r) => r.credentialId);

        // Get linked link details
        let linkedLinks: Array<{ id: string; name: string; url: string }> = [];
        if (linkedLinkIds.length > 0) {
          const linkDetails = await db
            .select({ id: links.id, name: links.name, url: links.url })
            .from(links)
            .where(inArray(links.id, linkedLinkIds));
          linkedLinks = linkDetails;
        }

        // Get linked credential names (without decrypted data)
        let linkedCredentials: Array<{ id: string; name: string }> = [];
        if (linkedCredentialIds.length > 0) {
          const credentialDetails = await db
            .select({ id: credentials.id, name: credentials.name })
            .from(credentials)
            .where(inArray(credentials.id, linkedCredentialIds));
          linkedCredentials = credentialDetails;
        }

        // Parse JSON fields
        const parsedContainers = project.containers ? JSON.parse(project.containers) : [];
        const parsedVolumes = project.volumes ? JSON.parse(project.volumes) : [];
        const parsedDomains = project.domains ? JSON.parse(project.domains) : [];

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          dbType: project.dbType,
          dbTypeOther: project.dbTypeOther,
          dbPath: project.dbPath,
          hasDbConnection: !!(project.encryptedDbConnection), // Indicate if there's an encrypted connection
          containers: parsedContainers,
          volumes: parsedVolumes,
          domains: parsedDomains,
          gitRepo: project.gitRepo,
          techStack: project.techStack,
          pendingMigrations: project.pendingMigrations,
          notes: project.notes,
          linkedLinkIds,
          linkedCredentialIds,
          linkedLinks,
          linkedCredentials,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
      })
    );

    return projectsWithLinks;
  }),

  // Get a single project by ID (with decrypted dbConnection - PIN protected on frontend)
  getById: protectedProcedure
    .input((raw) => parse(ProjectGetByIdSchema, raw))
    .query(async ({ ctx, input }) => {
      const project = await db.query.projects.findFirst({
        where: and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)),
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Decrypt dbConnection if exists
      let decryptedDbConnection: string | null = null;
      if (project.encryptedDbConnection && project.dbConnectionIv && project.dbConnectionAuthTag) {
        decryptedDbConnection = decrypt({
          encryptedData: project.encryptedDbConnection,
          iv: project.dbConnectionIv,
          authTag: project.dbConnectionAuthTag,
        });
      }

      // Get linked items
      const linkedLinkRecords = await db
        .select({ linkId: projectLinks.linkId })
        .from(projectLinks)
        .where(eq(projectLinks.projectId, project.id));
      const linkedLinkIds = linkedLinkRecords.map((r) => r.linkId);

      const linkedCredentialRecords = await db
        .select({ credentialId: projectCredentials.credentialId })
        .from(projectCredentials)
        .where(eq(projectCredentials.projectId, project.id));
      const linkedCredentialIds = linkedCredentialRecords.map((r) => r.credentialId);

      // Parse JSON fields
      const parsedContainers = project.containers ? JSON.parse(project.containers) : [];
      const parsedVolumes = project.volumes ? JSON.parse(project.volumes) : [];
      const parsedDomains = project.domains ? JSON.parse(project.domains) : [];

      // Log activity - viewed project
      await logActivity({
        userId: ctx.user.id,
        action: 'viewed',
        resourceType: 'project',
        resourceId: project.id,
        resourceName: project.name,
      });

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        dbType: project.dbType,
        dbTypeOther: project.dbTypeOther,
        dbPath: project.dbPath,
        dbConnection: decryptedDbConnection,
        containers: parsedContainers,
        volumes: parsedVolumes,
        domains: parsedDomains,
        gitRepo: project.gitRepo,
        techStack: project.techStack,
        pendingMigrations: project.pendingMigrations,
        notes: project.notes,
        linkedLinkIds,
        linkedCredentialIds,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    }),

  // Create a new project
  create: protectedProcedure
    .input((raw) => parse(ProjectCreateSchema, raw))
    .mutation(async ({ ctx, input }) => {
      const projectId = generateId(15);

      // Encrypt dbConnection if provided
      let encryptedDbConnection: string | null = null;
      let dbConnectionIv: string | null = null;
      let dbConnectionAuthTag: string | null = null;

      if (input.dbConnection) {
        const encrypted = encrypt(input.dbConnection);
        encryptedDbConnection = encrypted.encryptedData;
        dbConnectionIv = encrypted.iv;
        dbConnectionAuthTag = encrypted.authTag;
      }

      // Serialize JSON fields
      const containersJson = input.containers ? JSON.stringify(input.containers) : null;
      const volumesJson = input.volumes ? JSON.stringify(input.volumes) : null;
      const domainsJson = input.domains ? JSON.stringify(input.domains) : null;

      await db.insert(projects).values({
        id: projectId,
        userId: ctx.user.id,
        name: input.name,
        description: input.description || null,
        dbType: input.dbType || 'none',
        dbTypeOther: input.dbTypeOther || null,
        dbPath: input.dbPath || null,
        encryptedDbConnection,
        dbConnectionIv,
        dbConnectionAuthTag,
        containers: containersJson,
        volumes: volumesJson,
        domains: domainsJson,
        gitRepo: input.gitRepo || null,
        techStack: input.techStack || null,
        pendingMigrations: input.pendingMigrations || null,
        notes: input.notes || null,
      });

      // Link to links if provided
      if (input.linkedLinkIds && input.linkedLinkIds.length > 0) {
        const linkValues = input.linkedLinkIds.map((linkId) => ({
          projectId,
          linkId,
        }));
        await db.insert(projectLinks).values(linkValues);
      }

      // Link to credentials if provided
      if (input.linkedCredentialIds && input.linkedCredentialIds.length > 0) {
        const credentialValues = input.linkedCredentialIds.map((credentialId) => ({
          projectId,
          credentialId,
        }));
        await db.insert(projectCredentials).values(credentialValues);
      }

      // Log activity
      await logActivity({
        userId: ctx.user.id,
        action: 'created',
        resourceType: 'project',
        resourceId: projectId,
        resourceName: input.name,
      });

      return { success: true, id: projectId };
    }),

  // Update a project
  update: protectedProcedure
    .input((raw) => parse(ProjectUpdateSchema, raw))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const project = await db.query.projects.findFirst({
        where: and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)),
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Handle encryption of dbConnection
      let encryptedDbConnection = project.encryptedDbConnection;
      let dbConnectionIv = project.dbConnectionIv;
      let dbConnectionAuthTag = project.dbConnectionAuthTag;

      if (input.dbConnection !== undefined) {
        if (input.dbConnection) {
          const encrypted = encrypt(input.dbConnection);
          encryptedDbConnection = encrypted.encryptedData;
          dbConnectionIv = encrypted.iv;
          dbConnectionAuthTag = encrypted.authTag;
        } else {
          // Clear the connection if empty string or null
          encryptedDbConnection = null;
          dbConnectionIv = null;
          dbConnectionAuthTag = null;
        }
      }

      // Serialize JSON fields
      const containersJson = input.containers !== undefined
        ? (input.containers ? JSON.stringify(input.containers) : null)
        : project.containers;
      const volumesJson = input.volumes !== undefined
        ? (input.volumes ? JSON.stringify(input.volumes) : null)
        : project.volumes;
      const domainsJson = input.domains !== undefined
        ? (input.domains ? JSON.stringify(input.domains) : null)
        : project.domains;

      // Log activity
      await logActivity({
        userId: ctx.user.id,
        action: 'updated',
        resourceType: 'project',
        resourceId: input.id,
        resourceName: input.name,
      });

      await db
        .update(projects)
        .set({
          name: input.name,
          description: input.description !== undefined ? input.description : project.description,
          dbType: input.dbType || project.dbType,
          dbTypeOther: input.dbTypeOther !== undefined ? input.dbTypeOther : project.dbTypeOther,
          dbPath: input.dbPath !== undefined ? input.dbPath : project.dbPath,
          encryptedDbConnection,
          dbConnectionIv,
          dbConnectionAuthTag,
          containers: containersJson,
          volumes: volumesJson,
          domains: domainsJson,
          gitRepo: input.gitRepo !== undefined ? input.gitRepo : project.gitRepo,
          techStack: input.techStack !== undefined ? input.techStack : project.techStack,
          pendingMigrations: input.pendingMigrations !== undefined ? input.pendingMigrations : project.pendingMigrations,
          notes: input.notes !== undefined ? input.notes : project.notes,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, input.id));

      // Update linked links
      if (input.linkedLinkIds !== undefined) {
        await db.delete(projectLinks).where(eq(projectLinks.projectId, input.id));
        if (input.linkedLinkIds.length > 0) {
          const linkValues = input.linkedLinkIds.map((linkId) => ({
            projectId: input.id,
            linkId,
          }));
          await db.insert(projectLinks).values(linkValues);
        }
      }

      // Update linked credentials
      if (input.linkedCredentialIds !== undefined) {
        await db.delete(projectCredentials).where(eq(projectCredentials.projectId, input.id));
        if (input.linkedCredentialIds.length > 0) {
          const credentialValues = input.linkedCredentialIds.map((credentialId) => ({
            projectId: input.id,
            credentialId,
          }));
          await db.insert(projectCredentials).values(credentialValues);
        }
      }

      return { success: true };
    }),

  // Delete a project
  delete: protectedProcedure
    .input((raw) => parse(ProjectDeleteSchema, raw))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const project = await db.query.projects.findFirst({
        where: and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)),
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Log activity
      await logActivity({
        userId: ctx.user.id,
        action: 'deleted',
        resourceType: 'project',
        resourceId: input.id,
        resourceName: project.name,
      });

      // Junction tables will be deleted automatically due to cascade
      await db.delete(projects).where(eq(projects.id, input.id));

      return { success: true };
    }),
});
