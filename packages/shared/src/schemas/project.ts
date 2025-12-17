import { array, minLength, nullable, object, optional, picklist, pipe, string } from 'valibot';

// Valid DB types
export const dbTypes = [
  'sqlite',
  'postgresql',
  'mysql',
  'mariadb',
  'mongodb',
  'redis',
  'turso',
  'supabase',
  'none',
  'other',
] as const;

export type DbType = (typeof dbTypes)[number];

export const ProjectCreateSchema = object({
  name: pipe(string(), minLength(1, 'Name is required')),
  description: optional(string()),
  // Database info
  dbType: optional(picklist(dbTypes)),
  dbTypeOther: optional(string()), // Custom DB type when dbType is 'other'
  dbPath: optional(string()),
  dbConnection: optional(string()), // Plain text, encrypted on server
  // Infrastructure (JSON arrays)
  containers: optional(array(string())),
  volumes: optional(array(object({
    host: string(),
    container: string(),
  }))),
  domains: optional(array(string())),
  // Project info
  gitRepo: optional(string()),
  techStack: optional(string()),
  pendingMigrations: optional(string()),
  notes: optional(string()),
  // Linked items (many-to-many)
  linkedLinkIds: optional(array(string())),
  linkedCredentialIds: optional(array(string())),
});

export const ProjectUpdateSchema = object({
  id: pipe(string(), minLength(1, 'ID is required')),
  name: pipe(string(), minLength(1, 'Name is required')),
  description: optional(nullable(string())),
  // Database info
  dbType: optional(picklist(dbTypes)),
  dbTypeOther: optional(nullable(string())),
  dbPath: optional(nullable(string())),
  dbConnection: optional(nullable(string())), // Plain text, encrypted on server
  // Infrastructure (JSON arrays)
  containers: optional(array(string())),
  volumes: optional(array(object({
    host: string(),
    container: string(),
  }))),
  domains: optional(array(string())),
  // Project info
  gitRepo: optional(nullable(string())),
  techStack: optional(nullable(string())),
  pendingMigrations: optional(nullable(string())),
  notes: optional(nullable(string())),
  // Linked items (many-to-many)
  linkedLinkIds: optional(array(string())),
  linkedCredentialIds: optional(array(string())),
});

export const ProjectDeleteSchema = object({
  id: pipe(string(), minLength(1, 'ID is required')),
});

// Schema for getting project by ID (includes decrypted dbConnection)
export const ProjectGetByIdSchema = object({
  id: pipe(string(), minLength(1, 'ID is required')),
});

// Schema for exported project data
export const ProjectSchema = object({
  id: optional(string()),
  name: string(),
  description: optional(string()),
  dbType: optional(string()),
  dbTypeOther: optional(string()),
  dbPath: optional(string()),
  // Encrypted connection (for export)
  encryptedDbConnection: optional(string()),
  dbConnectionIv: optional(string()),
  dbConnectionAuthTag: optional(string()),
  containers: optional(array(string())),
  volumes: optional(array(object({
    host: string(),
    container: string(),
  }))),
  domains: optional(array(string())),
  gitRepo: optional(string()),
  techStack: optional(string()),
  pendingMigrations: optional(string()),
  notes: optional(string()),
  linkedLinkIds: optional(array(string())),
  linkedCredentialIds: optional(array(string())),
  createdAt: optional(string()),
});
