# 🚀 DegixHub - Setup Instructions

## Prerequisites

- **Node.js 20+** (for Next.js)
- **Bun** (for API runtime) - Install: `curl -fsSL https://bun.sh/install | bash`
- **pnpm** (package manager) - Install: `npm install -g pnpm`

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment Variables

```bash
# Copy example env file for API
cp apps/api/.env.example apps/api/.env

# Edit apps/api/.env and set:
# - ENCRYPTION_PASSWORD (use a strong random string in production)
# - DATABASE_URL (default: file:local.db)
```

### 3. Initialize Database

```bash
cd apps/api
bun run db:push
```

This will create the SQLite database with all tables.

### 4. Start Development

```bash
# From project root
pnpm dev
```

This starts:
- **Frontend**: http://localhost:3000 (Next.js)
- **API**: http://localhost:3001 (Bun + Hono)

## Project Structure

```
DegixHub/
├── apps/
│   ├── web/              # Next.js 15 frontend
│   │   ├── app/         # App Router pages
│   │   ├── components/  # React components
│   │   └── lib/         # Client utilities
│   │
│   └── api/              # Bun + Hono backend
│       ├── src/
│       │   ├── db/      # Drizzle schema + migrations
│       │   ├── auth/    # Lucia authentication
│       │   ├── crypto/  # AES-256-GCM encryption
│       │   └── trpc/    # tRPC routers
│       └── drizzle/     # Migration files
│
├── packages/
│   └── shared/           # Shared code
│       ├── schemas/     # Valibot validation schemas
│       └── types/       # TypeScript types
│
├── pnpm-workspace.yaml  # Monorepo config
├── biome.json           # Linter config
└── package.json         # Root scripts
```

## Tech Stack

| Component | Technology | Why? |
|-----------|-----------|------|
| Runtime | Bun | 3x faster than Node.js, native TypeScript |
| Frontend | Next.js 15 | React Server Components, Server Actions |
| Backend | Hono | Lightweight, web standards-based |
| Database | LibSQL | SQLite-compatible, scalable to remote |
| ORM | Drizzle | SQL-like syntax, type-safe |
| Auth | Lucia v3 | Modern, secure session management |
| Validation | Valibot | Lightweight, tree-shakable |
| API | tRPC | End-to-end type safety |
| Linting | Biome | Fast, all-in-one linter + formatter |

## Available Commands

### Root
```bash
pnpm dev          # Start all apps in development
pnpm build        # Build all apps for production
pnpm lint         # Check code with Biome
pnpm lint:fix     # Fix linting issues
pnpm format       # Format code with Biome
```

### API (`apps/api/`)
```bash
bun run dev       # Start API with hot reload
bun run build     # Build for production
bun run start     # Run production build
bun run db:push   # Push schema changes to DB
bun run db:studio # Open Drizzle Studio (DB GUI)
```

### Web (`apps/web/`)
```bash
pnpm dev          # Start Next.js dev server
pnpm build        # Build for production
pnpm start        # Run production build
```

## Security Features

### Day 1 Encryption
All credentials are encrypted using **AES-256-GCM** before being stored in the database.

**How it works:**
1. User saves a credential (e.g., SSH password)
2. API encrypts it with AES-256-GCM using `ENCRYPTION_PASSWORD`
3. Encrypted data + IV + Auth Tag are stored
4. Server can decrypt, but data at rest is protected

**Location:** `apps/api/src/crypto/index.ts`

### Authentication
Using **Lucia v3** for session-based authentication:
- Secure session cookies (httpOnly, secure in production)
- PBKDF2 password hashing (via `oslo` library)
- Session management in SQLite

**Location:** `apps/api/src/auth/lucia.ts`

## Database Schema

### Tables
- **users**: User accounts (username, password hash)
- **sessions**: Active sessions (managed by Lucia)
- **links**: Quick links (name, URL, category)
- **credentials**: Encrypted credentials (SSH keys, API tokens, etc.)

### Migrations
```bash
# Generate migration after schema change
cd apps/api
bun run db:generate

# Apply migrations
bun run db:push
```

## Next Steps

1. **Add tRPC Procedures**: Edit `apps/api/src/trpc/router.ts`
2. **Create UI Components**: Add components in `apps/web/components/`
3. **Add Auth Flow**: Implement login/register in API and UI
4. **Build Features**: Links dashboard, credential manager, etc.

## Troubleshooting

### "pnpm not found"
```bash
npm install -g pnpm
```

### "bun not found"
```bash
curl -fsSL https://bun.sh/install | bash
# Then restart terminal
```

### Database locked error
```bash
# Stop all running processes and delete the DB
rm apps/api/local.db*
bun run db:push
```

### Port already in use
```bash
# Kill processes on ports 3000 and 3001
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

## Contributing

1. Create a feature branch
2. Make changes
3. Run `pnpm lint` and fix issues
4. Commit with descriptive message
5. Push and create PR

---

**Built with ❤️ using the Gemini + Claude consensus stack!**
