# DegixHub

> Self-hosted Password Manager & Link Hub - Secure, Fast, Modern

## Features

### Core
- **Links** - Bookmarks mit Auto-Favicon, Kategorien, verknüpften Credentials
- **Credentials** - AES-256-GCM verschlüsselt, PIN-geschützt
- **Notes** - Markdown-fähig, verknüpfbar mit Links & Credentials
- **Categories** - Custom Colors, übergreifend nutzbar

### Security
- **AES-256-GCM** Client-Side Encryption für Credentials
- **4-Digit Security PIN** mit Session-Timeout & Inactivity-Lock
- **Recovery Key** für PIN-Reset (generiert beim Onboarding)
- **bcrypt** Password Hashing
- **JWT Sessions** mit Refresh Tokens

### UX Features
- **Drag & Drop** Sortierung (Grid & Table View)
- **Command Palette** (⌘K) mit globaler Suche
- **Dark Mode** (System-aware)
- **Progressive Loading** für große Datenmengen
- **Auto-Metadata Fetch** für neue Links (Title, Description, Favicon)
- **Password Generator** (20 Zeichen, alle Zeichentypen)
- **Secure Clipboard** (Auto-Clear nach 30s)
- **Activity Log** mit Audit Trail

### Views
- **Grid View** - Cards mit Drag & Drop
- **Table View** - Kompakte Liste mit Sortierung
- **Category Filter** - Multi-Select Filter
- **Pin/Unpin** - Favoriten oben anpinnen

---

## Tech Stack

### Frontend
```
Next.js 15        App Router, React Server Components
TypeScript        Strict Mode
CSS Modules       Custom Design System, CSS Variables
tRPC Client       End-to-End Type-Safety
@dnd-kit          Drag & Drop
```

### Backend
```
Bun               Runtime (3x schneller als Node)
Hono              Web Framework
tRPC              Type-Safe API
Drizzle ORM       Type-Safe Database Access
SQLite            File-based Database
```

### Security
```
AES-256-GCM       Credential Encryption
bcrypt            Password Hashing
Lucia             Session Management
Zod               Input Validation
```

---

## Project Structure

```
DegixHub/
├── apps/
│   ├── api/                    # Backend (Bun + Hono + tRPC)
│   │   └── src/
│   │       ├── db/             # Drizzle Schema & Migrations
│   │       ├── trpc/routers/   # tRPC Routers
│   │       ├── auth/           # Auth & Encryption
│   │       └── lib/            # Utilities
│   │
│   └── web/                    # Frontend (Next.js 15)
│       └── app/
│           ├── auth/           # Login, Register, Recovery
│           └── dashboard/      # Main Application
│               ├── components/
│               │   ├── cards/      # LinkCard, CredentialCard, NoteCard
│               │   ├── dialogs/    # Form Dialogs, ViewCredentialModal
│               │   ├── pin/        # PIN Modal & Context
│               │   └── ui/         # ViewToggle, Filters, Draggables
│               ├── hooks/          # useViewMode, useCategoryFilter, usePinProtection
│               └── sections/       # LinksSection, CredentialsSection, etc.
│
└── CLAUDE.md                   # Development Guidelines
```

---

## Database Schema

```sql
users           { id, username, passwordHash, recoveryKey, securityPinHash }
sessions        { id, userId, expiresAt }
links           { id, userId, name, url, category, description, favicon, isPinned, pinOrder, linkedCredentialId }
credentials     { id, userId, name, category, encryptedData, iv, authTag, isPinned, pinOrder }
notes           { id, userId, title, content, category, isPinned, pinOrder, linkedLinkId, linkedCredentialId }
categories      { id, userId, name, color, type }
tags            { id, userId, name, color }
activityLogs    { id, userId, action, resourceType, resourceId, resourceName, metadata }
```

---

## Development

### Prerequisites
- **Bun** (v1.0+)
- **pnpm** (v8+)
- **Node.js** (v20+)

### Setup
```bash
# Install dependencies
pnpm install

# Start API (Port 3001)
cd apps/api && bun run dev

# Start Web (Port 3000)
cd apps/web && pnpm dev
```

### Build
```bash
cd apps/web && pnpm build
cd apps/api && bun build
```

---

## Deployment

### Docker (Coolify)
```yaml
Services:
  - hub-web (Next.js)      → your-domain.com
  - hub-api (Bun + SQLite) → api.your-domain.com

Networks:
  - public (Frontend)
  - internal (Frontend ↔ API)
```

### Environment Variables
```env
# API
DATABASE_URL=./data/hub.db
JWT_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key

# Web
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

---

## Security Notes

- **Zero-Knowledge**: Server kann Credentials nicht lesen (Client-Side Encryption)
- **PIN Protection**: Zusätzliche Sicherheitsebene für Credential-Zugriff
- **Session Timeout**: 5 Min PIN-Unlock, 10 Min Inactivity-Lock
- **Secure Clipboard**: Auto-Clear nach 30 Sekunden
- **Activity Logging**: Audit Trail für alle Aktionen

---

## License

Private Project - All Rights Reserved
