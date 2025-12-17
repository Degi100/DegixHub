import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  recoveryKey: text('recovery_key').notNull(), // Base64-encoded 256-bit recovery key
  securityPinHash: text('security_pin_hash'), // Hashed 4-digit PIN for credential access
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
});

export const links = sqliteTable('links', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  url: text('url').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  favicon: text('favicon'), // URL to the site's favicon
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
  pinOrder: integer('pin_order').default(0), // Order for drag & drop sorting of pinned items
  linkedCredentialId: text('linked_credential_id').references(() => credentials.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const credentials = sqliteTable('credentials', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  encryptedData: text('encrypted_data').notNull(),
  iv: text('iv').notNull(),
  authTag: text('auth_tag').notNull(),
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
  pinOrder: integer('pin_order').default(0), // Order for drag & drop sorting of pinned items
  linkedLinkId: text('linked_link_id'), // Can't use .references() here due to circular dependency
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const linkTags = sqliteTable('link_tags', {
  linkId: text('link_id')
    .notNull()
    .references(() => links.id, { onDelete: 'cascade' }),
  tagId: text('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
});

export const credentialTags = sqliteTable('credential_tags', {
  credentialId: text('credential_id')
    .notNull()
    .references(() => credentials.id, { onDelete: 'cascade' }),
  tagId: text('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
});

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content').notNull(), // Markdown content
  category: text('category').notNull(),
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
  pinOrder: integer('pin_order').default(0), // Order for drag & drop sorting of pinned items
  linkedLinkId: text('linked_link_id').references(() => links.id, { onDelete: 'set null' }),
  linkedCredentialId: text('linked_credential_id').references(() => credentials.id, { onDelete: 'set null' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const noteTags = sqliteTable('note_tags', {
  noteId: text('note_id')
    .notNull()
    .references(() => notes.id, { onDelete: 'cascade' }),
  tagId: text('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6b7280'), // hex color for custom categories
  type: text('type').notNull(), // 'link', 'credential', 'note', 'all'
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Projects for DevOps info tracking
export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  // Database info
  dbType: text('db_type').notNull().default('none'), // 'sqlite', 'postgresql', 'mysql', 'mariadb', 'mongodb', 'redis', 'turso', 'supabase', 'none', 'other'
  dbTypeOther: text('db_type_other'), // Custom DB type when dbType is 'other'
  dbPath: text('db_path'), // Host path for file-based DBs (e.g., /mnt/storage/.../production.db)
  // Encrypted DB connection string (for connection strings with passwords)
  encryptedDbConnection: text('encrypted_db_connection'),
  dbConnectionIv: text('db_connection_iv'),
  dbConnectionAuthTag: text('db_connection_auth_tag'),
  // Infrastructure
  containers: text('containers'), // JSON array: ["api", "web"]
  volumes: text('volumes'), // JSON array: [{"host": "/mnt/...", "container": "/data"}]
  domains: text('domains'), // JSON array: ["hub.example.com", "api.example.com"]
  // Project info
  gitRepo: text('git_repo'),
  techStack: text('tech_stack'), // e.g., "Bun, Hono, Next.js, SQLite"
  pendingMigrations: text('pending_migrations'), // SQL or commands to run
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
});

// Junction table for project-link associations (multiple links per project)
export const projectLinks = sqliteTable('project_links', {
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  linkId: text('link_id')
    .notNull()
    .references(() => links.id, { onDelete: 'cascade' }),
});

// Junction table for project-credential associations (multiple credentials per project)
export const projectCredentials = sqliteTable('project_credentials', {
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  credentialId: text('credential_id')
    .notNull()
    .references(() => credentials.id, { onDelete: 'cascade' }),
});

export const activityLogs = sqliteTable('activity_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // 'created', 'updated', 'deleted', 'viewed', 'copied'
  resourceType: text('resource_type').notNull(), // 'credential', 'link', 'tag', 'note'
  resourceId: text('resource_id'), // ID of the resource (null if deleted)
  resourceName: text('resource_name').notNull(), // Name for display
  oldValue: text('old_value'), // Encrypted old value (for updates)
  newValue: text('new_value'), // Encrypted new value (for updates)
  metadata: text('metadata'), // JSON string for additional data
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .$defaultFn(() => new Date())
    .notNull(),
});
