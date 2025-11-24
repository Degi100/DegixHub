# DegixHub - Claude Session Guide

## 🚫 CRITICAL RULES (READ FIRST!)

### Never Do:
1. **Start servers** - User does this manually
2. **Git commit/push** - Only write commit messages in chat
3. **Kill processes** - User manages processes

### Best Practices:
- Save tokens: Read only necessary files
- Be direct: Short responses in German
- No emojis unless requested
- Trust the user

---

## 📁 Project Overview

**Stack**: Next.js 15 + Bun + tRPC + Drizzle + SQLite
**Purpose**: Self-hosted password manager with links

### Key Directories
```
apps/web/app/dashboard/        # Frontend components
apps/api/src/trpc/routers/     # Backend routes
apps/api/src/db/schema.ts      # Database schema
```

## 🔧 Database Schema (SQLite)

```typescript
// apps/api/src/db/schema.ts
users          { id, username, passwordHash, recoveryKey, createdAt }
sessions       { id, userId, expiresAt }
links          { id, userId, name, url, category, description, isPinned, createdAt }
credentials    { id, userId, name, category, encryptedData, iv, authTag, isPinned, createdAt }
tags           { id, userId, name, color, createdAt }
linkTags       { linkId, tagId }
credentialTags { credentialId, tagId }
activityLogs   { id, userId, action, resourceType, resourceId, resourceName, oldValue, newValue, metadata, createdAt }
```

**Encryption**: Credentials use AES-256-GCM (encryptedData, iv, authTag)

---

## 🐛 Common Issues

### Export failing with relation error
**Fix**: Use direct `db.select().from(table).where()` instead of `db.query.table.findMany({ with: {} })`

### Can't scroll in activity log
**Fix**: Remove `overflow-hidden` from parent, add `overflow-y-auto` to child with `max-h-[500px]`

### Import not working after export
**Fix**: Invalidate queries after import:
```typescript
await Promise.all([
  utils.links.getAll.invalidate(),
  utils.credentials.getAll.invalidate(),
  utils.tags.getAll.invalidate(),
]);
```

---

## 📝 Development Commands

```bash
# User starts servers manually
cd apps/api && bun run dev      # API on :3001
cd apps/web && pnpm dev         # Web on :3000
```
