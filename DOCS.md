# DegixHub - Vollständige Projektdokumentation

> Self-Hosted Password Manager & Link Hub mit Ende-zu-Ende Verschlüsselung

---

## Inhaltsverzeichnis

1. [Projektübersicht](#1-projektübersicht)
2. [Architektur & Struktur](#2-architektur--struktur)
3. [Features](#3-features)
4. [Database Schema](#4-database-schema)
5. [API & tRPC Router](#5-api--trpc-router)
6. [Frontend Komponenten](#6-frontend-komponenten)
7. [Authentication & Encryption](#7-authentication--encryption)
8. [Deployment & Coolify](#8-deployment--coolify)
9. [Development Setup](#9-development-setup)
10. [Bekannte Issues & Lösungen](#10-bekannte-issues--lösungen)

---

## 1. Projektübersicht

### Tech Stack

| Bereich | Technologie |
|---------|-------------|
| **Runtime** | Bun |
| **Backend** | Hono + tRPC |
| **Frontend** | Next.js 15 (App Router) |
| **Database** | SQLite + Drizzle ORM |
| **Auth** | Lucia (Session-basiert) |
| **Encryption** | AES-256-GCM |
| **Validation** | Valibot |
| **Styling** | CSS Modules + CSS Variables |
| **Deployment** | Docker + Coolify |

### Warum diese Technologien?

- **Bun**: 3x schneller als Node.js, native TypeScript
- **Hono**: Ultraschnelles Web-Framework, moderner als Express
- **tRPC**: End-to-End Type-Safety ohne GraphQL-Overhead
- **Drizzle**: Lightweight ORM, bessere Migrations als Prisma
- **SQLite**: File-based, kein Server nötig, perfekt für Self-Hosted
- **Lucia**: Modern, flexibel, kein Vendor Lock-in
- **Valibot**: Leichter als Zod, gleiche Funktionalität

---

## 2. Architektur & Struktur

### Monorepo Struktur

```
DegixHub/
├── apps/
│   ├── api/                    # Backend (Bun + Hono + tRPC)
│   │   ├── src/
│   │   │   ├── index.ts        # Haupteinstiegspunkt
│   │   │   ├── auth/           # Authentifizierung & Encryption
│   │   │   │   ├── encryption.ts
│   │   │   │   ├── lucia.ts
│   │   │   │   └── password.ts
│   │   │   ├── db/             # Datenbank
│   │   │   │   ├── index.ts
│   │   │   │   ├── init.ts
│   │   │   │   └── schema.ts
│   │   │   ├── lib/
│   │   │   │   ├── activity-logger.ts
│   │   │   │   └── meta-fetcher.ts
│   │   │   ├── routes/
│   │   │   │   └── auth.ts
│   │   │   └── trpc/
│   │   │       ├── index.ts
│   │   │       ├── router.ts
│   │   │       └── routers/    # 8 Router-Module
│   │   └── drizzle/            # SQL Migrations
│   │
│   └── web/                    # Frontend (Next.js 15)
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   ├── auth/           # Login, Register, Recovery
│       │   └── dashboard/      # Hauptanwendung
│       ├── lib/
│       │   └── trpc/           # tRPC Client
│       └── components/
│
├── packages/
│   └── shared/                 # Gemeinsame Types & Schemas
│       └── src/
│           ├── schemas/        # Valibot Validation Schemas
│           └── types/
│
├── docker-compose.yml
├── .coolify.yaml
└── CLAUDE.md                   # Session Guide
```

### Datenfluss

```
┌─────────────────────────────────────┐
│     FRONTEND (Next.js 15)           │
│  - React Query für Caching          │
│  - tRPC Client                      │
└──────────────┬──────────────────────┘
               │ tRPC + Session Cookies
               ▼
┌─────────────────────────────────────┐
│     API (Bun + Hono + tRPC)         │
│  - Session Validation               │
│  - Protected Procedures             │
│  - Valibot Validation               │
└──────────────┬──────────────────────┘
               │ Drizzle ORM
               ▼
┌─────────────────────────────────────┐
│     DATABASE (SQLite)               │
│  - Argon2 Password Hashes           │
│  - AES-256-GCM Encrypted Data       │
└─────────────────────────────────────┘
```

---

## 3. Features

### Links
- Erstellen, Bearbeiten, Löschen
- Auto-Fetch von Metadata (Title, Description, Favicon)
- Kategorisierung
- Tags zuweisen
- Pin/Unpin
- Bulk-Aktionen (Löschen, Tags zuweisen)

### Credentials (Passwort-Manager)
- Erstellen, Bearbeiten, Löschen
- **AES-256-GCM Verschlüsselung**
- Kategorisierung
- Tags zuweisen
- Pin/Unpin
- Copy to Clipboard
- Bulk-Aktionen

### Notes
- Markdown-Content
- Verlinkung zu Links und Credentials
- Kategorisierung
- Tags
- Pin/Unpin

### Categories
- 13 Default-Kategorien mit Farben
- Custom Categories erstellen
- Farbauswahl (Color Picker)

### Tags
- Erstellen mit Custom-Farbe
- Zuweisen zu Links, Credentials, Notes
- Bulk-Tag-Assignment

### Activity Log
- Alle Aktionen werden geloggt
- Filterbar nach Ressource-Typ
- Timeline-Ansicht

### Data Management
- Export als JSON
- Import mit Merge/Replace Modus
- Skip Duplicates Option

### UI Features
- Dark Mode / Light Mode
- Command Palette (Cmd/Ctrl+K)
- Responsive Design
- Toast Notifications

---

## 4. Database Schema

### Tabellen

```sql
-- USERS
users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  password_hash TEXT,      -- Argon2
  recovery_key TEXT,       -- 256-bit Base64
  created_at INTEGER
)

-- SESSIONS
sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users,
  expires_at INTEGER
)

-- LINKS
links (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users,
  name TEXT,
  url TEXT,
  category TEXT,
  description TEXT,
  favicon TEXT,            -- URL
  is_pinned INTEGER DEFAULT 0,
  created_at INTEGER
)

-- CREDENTIALS (encrypted)
credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users,
  name TEXT,
  category TEXT,
  encrypted_data TEXT,     -- AES-256-GCM ciphertext
  iv TEXT,                 -- 16 bytes hex
  auth_tag TEXT,           -- 16 bytes hex
  is_pinned INTEGER DEFAULT 0,
  created_at INTEGER
)

-- TAGS
tags (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users,
  name TEXT,
  color TEXT,              -- hex
  created_at INTEGER
)

-- NOTES
notes (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users,
  title TEXT,
  content TEXT,            -- Markdown
  category TEXT,
  is_pinned INTEGER DEFAULT 0,
  linked_link_id TEXT REFERENCES links,
  linked_credential_id TEXT REFERENCES credentials,
  created_at INTEGER,
  updated_at INTEGER
)

-- CATEGORIES
categories (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users,
  name TEXT,
  color TEXT DEFAULT '#6b7280',
  type TEXT,               -- 'link', 'credential', 'note', 'all'
  created_at INTEGER
)

-- ACTIVITY_LOGS
activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users,
  action TEXT,             -- created, updated, deleted, etc.
  resource_type TEXT,      -- credential, link, tag, note
  resource_id TEXT,
  resource_name TEXT,
  old_value TEXT,
  new_value TEXT,
  metadata TEXT,           -- JSON
  created_at INTEGER
)

-- JUNCTION TABLES
link_tags (link_id, tag_id)
credential_tags (credential_id, tag_id)
note_tags (note_id, tag_id)
```

### Migrations

```
drizzle/
├── 0000_bent_radioactive_man.sql  # Initial Schema
├── 0001_add_notes.sql
├── 0002_add_categories.sql
├── 0003_add_category_color.sql
└── 0004_add_link_favicon.sql
```

---

## 5. API & tRPC Router

### Router Übersicht

```typescript
// apps/api/src/trpc/router.ts
export const appRouter = router({
  health: publicProcedure.query(),
  auth: authRouter,
  links: linksRouter,
  credentials: credentialsRouter,
  tags: tagsRouter,
  notes: notesRouter,
  categories: categoriesRouter,
  activityLogs: activityLogsRouter,
  dataExport: dataExportRouter,
});
```

### Auth Router

```typescript
auth.register(username, password)    → sessionCookie, recoveryKey
auth.login(username, password)       → sessionCookie, user
auth.logout()                        → clears session
auth.getSession()                    → user, session
auth.getRecoveryKey()                → recoveryKey
auth.resetPassword(username, recoveryKey, newPassword)
```

### Links Router

```typescript
links.getAll()                       → alle Links + Tags
links.getByCategory(category)        → gefilterte Links
links.create(input)                  → neuer Link
links.update(input)                  → aktualisierter Link
links.delete(id)                     → gelöscht
links.fetchMetadata(url)             → { title, description, favicon }
links.togglePin(id)                  → isPinned toggled
links.bulkDelete(ids[])
links.bulkAssignTags(linkIds[], tagIds[])
links.import(LinkCreateSchema[])
```

### Credentials Router

```typescript
credentials.getAll()                 → alle Credentials (ohne decrypted data)
credentials.getById(id)              → einzelnes Credential MIT decrypted data
credentials.create(input)
credentials.update(input)
credentials.delete(id)
credentials.togglePin(id)
credentials.bulkDelete(ids[])
credentials.bulkAssignTags(credentialIds[], tagIds[])
credentials.import(CredentialCreateSchema[])
```

### Tags Router

```typescript
tags.getAll()                        → alle Tags
tags.create(name, color)
tags.update(id, name, color)
tags.delete(id)                      → cascade zu junction tables
```

### Notes Router

```typescript
notes.getAll()                       → alle Notes + Tags
notes.getById(id)
notes.create(title, content, category, ...)
notes.update(id, ...)
notes.delete(id)
notes.togglePin(id)
```

### Categories Router

```typescript
categories.getAll()                  → { categories, colorMap, customCategories }
categories.create(name, color?, type?)
categories.delete(id)
```

### Activity Logs Router

```typescript
activityLogs.getAll(limit?, resourceType?)
activityLogs.getByResource(resourceId)
```

### Data Export Router

```typescript
dataExport.exportData()              → { version, exportedAt, data }
dataExport.importData(data, mode, skipDuplicates?)
```

---

## 6. Frontend Komponenten

### Dashboard Layout

```
┌─────────────────────────────────────────────────┐
│  Sidebar          │  Main Content               │
│  - Navigation     │  - Active Section           │
│  - User Stats     │  - Search                   │
│  - Logout         │  - Cards Grid               │
└─────────────────────────────────────────────────┘
```

### Hauptkomponenten

| Datei | Beschreibung |
|-------|--------------|
| `dashboard/page.tsx` | Main Dashboard Container |
| `dashboard/simple-links-section.tsx` | Links CRUD |
| `dashboard/simple-credentials-section.tsx` | Credentials CRUD |
| `dashboard/notes-section.tsx` | Notes CRUD |
| `dashboard/category-select.tsx` | Category Dropdown |
| `dashboard/activity-log.tsx` | Activity Timeline |
| `dashboard/data-management.tsx` | Import/Export |
| `dashboard/command-palette.tsx` | Quick Search (Cmd+K) |
| `dashboard/bulk-actions-bar.tsx` | Bulk Operations |
| `components/sidebar.tsx` | Navigation Sidebar |

### State Management

```typescript
// Dashboard State
const [activeSection, setActiveSection] = useState('links')
const [searchQuery, setSearchQuery] = useState('')
const [sidebarOpen, setSidebarOpen] = useState(false)

// tRPC Queries
const { data: session } = trpc.auth.getSession.useQuery()
const { data: links } = trpc.links.getAll.useQuery()
const { data: credentials } = trpc.credentials.getAll.useQuery()
const { data: notes } = trpc.notes.getAll.useQuery()
const { data: categoriesData } = trpc.categories.getAll.useQuery()
```

---

## 7. Authentication & Encryption

### Session Management (Lucia)

```typescript
// apps/api/src/auth/lucia.ts
const lucia = new Lucia(adapter, {
  sessionCookie: {
    name: 'auth_session',
    attributes: {
      secure: false,     // HTTP (Coolify handles HTTPS)
      sameSite: 'lax',
      path: '/',
    },
  },
});
```

### Password Hashing (Argon2)

```typescript
// OWASP empfohlene Werte
memoryCost: 19456,  // ~19 MB
timeCost: 2,
outputLen: 32,
parallelism: 1
```

### Credential Encryption (AES-256-GCM)

```typescript
// apps/api/src/auth/encryption.ts
Algorithm: AES-256-GCM
IV Length: 16 bytes (random)
Auth Tag: 16 bytes

encrypt(plaintext) → { encryptedData, iv, authTag }
decrypt({ encryptedData, iv, authTag }) → plaintext
```

### Recovery Key

```typescript
// 256-bit random → Base64 → XXXX-XXXX-XXXX-... Format
generateRecoveryKey() → "ABCD-EFGH-IJKL-..."
```

### Sicherheitsmodell

1. **Passwords**: Argon2 gehasht, nie im Klartext
2. **Sessions**: Server-side, Cookie-basiert
3. **Credentials**: AES-256-GCM verschlüsselt in DB
4. **Encryption Key**: Nur in Environment Variable
5. **Recovery Key**: Einzige Möglichkeit Passwort zurückzusetzen

---

## 8. Deployment & Coolify

### Container Konfiguration

```yaml
# docker-compose.yml
services:
  app:
    ports:
      - "3002:3002"  # Frontend
      - "3003:3003"  # API
    environment:
      DATABASE_URL: file:/data/production.db
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      PORT: 3003
    volumes:
      - hub-data:/data  # SQLite Persistence
```

### Environment Variables

```env
# API
DATABASE_URL=file:/data/production.db
ENCRYPTION_KEY=<openssl rand -hex 32>
PORT=3003
NODE_ENV=production
FRONTEND_URL=http://degixhub.94.130.185.204.sslip.io

# Web
NEXT_PUBLIC_API_URL=http://degixhub.94.130.185.204.sslip.io
NODE_ENV=production
```

### Coolify Setup

1. Git Repository verbinden
2. Environment Variables setzen
3. Port 3003 (API) + 3002 (Web) konfigurieren
4. Volume für `/data` mounten
5. Deployments automatisch bei Push

### Manuelle Migration in Production

```bash
# Container ID finden
docker ps | grep degix

# Migration ausführen
docker exec CONTAINER_ID sh -c "apt-get update && apt-get install -y sqlite3 && sqlite3 /data/production.db 'ALTER TABLE tablename ADD COLUMN columnname type;'"

# Container neu starten
docker restart CONTAINER_ID
```

---

## 9. Development Setup

### Voraussetzungen

- Node.js 18+
- Bun
- pnpm

### Installation

```bash
# Clone
git clone https://github.com/your-repo/degixhub.git
cd degixhub

# Dependencies installieren
pnpm install

# Environment
cp apps/api/.env.example apps/api/.env.local
# ENCRYPTION_KEY generieren:
openssl rand -hex 32
```

### Development Server

```bash
# Beide Apps parallel starten
pnpm dev

# Oder einzeln:
cd apps/api && bun run dev    # API auf :3003
cd apps/web && pnpm dev       # Web auf :3000
```

### Database Commands

```bash
cd apps/api

# Migration generieren
bun run db:generate

# Migration ausführen
bun run db:migrate

# Drizzle Studio (DB Browser)
bun run db:studio
```

### Code Quality

```bash
# Linting
pnpm lint
pnpm lint:fix

# Formatting
pnpm format

# Type Check
pnpm type-check
```

---

## 10. Bekannte Issues & Lösungen

### Export failing mit Relation Error

**Problem**: `db.query.table.findMany({ with: {} })` funktioniert nicht

**Lösung**: Direkte Queries verwenden
```typescript
// Statt:
db.query.links.findMany({ with: { tags: true } })

// Verwende:
const links = await db.select().from(links).where(...)
const linkTagRecords = await db.select().from(linkTags).where(...)
```

### Can't scroll in Activity Log

**Problem**: Parent hat `overflow-hidden`

**Lösung**:
```css
/* Parent */
overflow: visible;

/* Child (Activity Log) */
overflow-y: auto;
max-height: 500px;
```

### Import invalidiert Queries nicht

**Problem**: Nach Import werden alte Daten angezeigt

**Lösung**:
```typescript
await Promise.all([
  utils.links.getAll.invalidate(),
  utils.credentials.getAll.invalidate(),
  utils.tags.getAll.invalidate(),
]);
```

### Production 500 Errors nach Schema-Änderung

**Problem**: Neue Spalten existieren nicht in Production DB

**Lösung**:
```bash
# Migration manuell ausführen
docker exec CONTAINER sqlite3 /data/production.db "ALTER TABLE ..."

# Container neu starten
docker restart CONTAINER
```

### fetchMetadata funktioniert nicht

**Problem**: Backend als `.query()` definiert, Frontend als `.useMutation()`

**Lösung**: Backend auf `.mutation()` ändern
```typescript
// apps/api/src/trpc/routers/links.ts
fetchMetadata: protectedProcedure
  .input(...)
  .mutation(async ({ input }) => { ... })  // Nicht .query()
```

---

## Appendix

### Default Categories

```typescript
const DEFAULT_CATEGORIES = [
  { name: 'General', color: '#6b7280' },
  { name: 'Work', color: '#3b82f6' },
  { name: 'Personal', color: '#8b5cf6' },
  { name: 'Development', color: '#10b981' },
  { name: 'Design', color: '#f59e0b' },
  { name: 'Documentation', color: '#6366f1' },
  { name: 'Social', color: '#ec4899' },
  { name: 'Entertainment', color: '#f97316' },
  { name: 'Shopping', color: '#14b8a6' },
  { name: 'News', color: '#ef4444' },
  { name: 'Ideas', color: '#a855f7' },
  { name: 'Projects', color: '#0ea5e9' },
  { name: 'Todo', color: '#84cc16' },
];
```

### Activity Log Actions

```typescript
type Action =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'viewed'
  | 'copied'
  | 'pinned'
  | 'unpinned'
  | 'bulk_deleted'
  | 'bulk_tag_assigned'
  | 'data_exported'
  | 'data_imported';
```

### Keyboard Shortcuts

| Shortcut | Aktion |
|----------|--------|
| `Cmd/Ctrl + K` | Command Palette öffnen |

---

*Letzte Aktualisierung: November 2025*
