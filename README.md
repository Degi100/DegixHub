🚀 HUB - Der Ultimate Modern Self-Hosted Stack
Das Projekt:
Deine persönliche Kommandozentrale - von überall auf alles zugreifen (Web-Services, Server, Projekte, Logins)

🔥 Der Tech-Stack (State-of-the-Art 2025):
Architektur:
Self-Hosted auf deinem Hetzner CX43
└─ Alles via Coolify deployed
   └─ Kein Vercel, keine externen Services!
Monorepo Setup:
yamlStruktur: Simple Monorepo (pnpm workspace)
├── apps/
│   ├── web/          # Frontend
│   └── api/          # Backend
└── shared/           # Types (wenn nötig)

Tools:
- pnpm (Package Manager)
- KEIN Turborepo (zu viel Overhead)
- Ein Git Repo für alles
Frontend:
yamlFramework: Next.js 15 (App Router)
Features:
  - React Server Components (RSC)
  - Server Actions (kein API-Layer nötig!)
  - Streaming & Suspense

Styling: CSS Modules + Custom Design System
  - CSS Variables (Custom Properties)
  - Mobile-First Responsive Design
  - RGB-based Category Colors
  - Dark Mode Support (next-themes)
  - Zero Runtime CSS-in-JS
State: React useState/useEffect (lightweight)
Routing: Next.js App Router
Type-Safe API: tRPC Client

Deploy:
  - Docker Container
  - Coolify managed
  - Domain: hub.reneschmidt.de
  - HTTPS via Traefik (automatisch)
Backend:
yamlRuntime: Bun (statt Node.js!)
  - 3x schneller
  - Native TypeScript
  - Built-in Package Manager

Framework: Hono (statt Express)
  - Modernste Alternative
  - Ultraschnell
  - TypeScript-first

API: tRPC
  - End-to-End Type-Safety
  - Kein GraphQL-Overhead
  - Auto-completion everywhere
  - Shared Types mit Frontend

Deploy:
  - Docker Container (Bun)
  - Coolify managed
  - Domain: hub-api.reneschmidt.de
Database:
yamlDB: SQLite
  - Lightweight & Fast
  - File-based (kein Server nötig)
  - Perfect für Self-Hosted
  - Einfache Backups

ORM: Drizzle
  - Moderne Alternative zu Prisma
  - SQL-like Syntax
  - Type-safe
  - Lightweight
  - Bessere Migrations

Migrations: Drizzle Kit
Security:
yamlAuth: JWT + Refresh Tokens
Password: bcrypt (Master-Password)
Credentials: AES-256 Client-Side Encryption
  - Zero-Knowledge möglich
  - Server kann Credentials nicht lesen

Secrets: Docker Secrets / Coolify Env Vars
Networks: Docker Internal Networks (isoliert)
Desktop App (Optional - Phase 2):
yamlFramework: Tauri (statt Electron!)
  - Rust Backend (Performance!)
  - ~10MB statt ~100MB
  - Native Webview
  - System Integration

Features:
  - Lokale Programme starten
  - SSH-Connections
  - Tray-Icon
  - Hotkeys (Ctrl+Alt+H)
  - Offline SQLite Cache

Sync: tRPC zu hub-api.reneschmidt.de
DevOps & Tooling:
yamlPackage Manager: pnpm (schnell, disk-effizient)
Linting: Biome (statt ESLint/Prettier)
  - 100x schneller
  - Ein Tool für alles

Validation: Zod (überall)
  - Frontend Forms
  - API Input
  - Database Schema

Type-Safe Stack:
Frontend (TypeScript)
    ↕ tRPC (Type-Safe)
Backend (TypeScript)
    ↕ Drizzle (Type-Safe)
Database (SQLite)

= Zero Runtime Type Errors!

Design System:
CSS Modules (keine Tailwind Bloat)
    ↕ CSS Variables
    ↕ Mobile-First Media Queries
    ↕ Category-Based Colors (RGB)

= Performance + Kontrolle!
```

---

## **🎯 Was du bekommst:**

### **Core Features:**
```
✅ Master-Password Login
✅ Quick Links Dashboard
✅ Encrypted Credentials Storage
✅ Categories/Tags
✅ Search & Filter
✅ Dark Mode
✅ CRUD für alles
✅ Copy-to-Clipboard
✅ SSH Web-Terminal (xterm.js)
✅ Stats (Most Used, Recently Added)
✅ Import/Export
```

### **Nerdy Features:**
```
🔥 React Server Components (cutting-edge React)
🔥 Bun Runtime (next-gen JavaScript)
🔥 tRPC (Type-Safety ohne GraphQL)
🔥 Drizzle ORM (moderne Alternative)
🔥 CSS Modules Design System (Zero Runtime)
🔥 Client-Side Encryption (Zero-Knowledge)
🔥 Self-Hosted (volle Kontrolle)
🔥 Mobile-First Responsive Design
🔥 Optional: Tauri Desktop (Rust lernen!)
```

### **User Experience:**
```
⚡ Instant Loads (RSC)
⚡ Type-Safe (keine Runtime Errors)
⚡ Responsive (Mobile-ready)
⚡ PWA-fähig (installierbar)
⚡ Offline-capable (mit Tauri)
⚡ Dark Mode
```

---

## **📦 Deployment:**

### **Auf deinem Hetzner Server:**
```
1. Git Push → GitHub
2. Coolify detected
3. Build Docker Images:
   - hub-web (Next.js)
   - hub-api (Bun)
4. Deploy mit Traefik
5. HTTPS automatisch
6. Live in ~2 Minuten

Domains:
- hub.reneschmidt.de (Frontend)
- hub-api.reneschmidt.de (Backend)
Container Orchestration:
yamldocker-compose.yml:
  - hub-web (Next.js)
  - hub-api (Bun + tRPC + SQLite)

Networks:
  - public (Frontend)
  - internal (Frontend ↔ API)

= Isolated & Secure
= Simplified Architecture
```

---

## **⏱️ Timeline:**

### **Phase 1 - MVP (2 Wochen):**
```
Woche 1:
✅ Monorepo Setup (pnpm workspace)
✅ Next.js 15 Frontend (RSC)
✅ Bun + Hono Backend
✅ tRPC Integration
✅ Drizzle + SQLite
✅ Basic Auth (Master-PW)

Woche 2:
✅ CRUD für Links
✅ Credentials Encryption
✅ Categories & Search
✅ Dark Mode
✅ CSS Modules Design System
✅ Mobile-First Responsive Design
✅ Deploy auf Coolify

→ Voll funktionsfähiger Hub!
```

### **Phase 2 - Desktop Power (2 Wochen):**
```
✅ Tauri Desktop App
✅ Rust Backend Features
✅ Lokale Programme starten
✅ SSH-Integration
✅ Tray-Icon & Hotkeys
✅ Offline SQLite Cache

→ Native Desktop Experience!
```

### **Phase 3 - Polish (Optional):**
```
✅ Local-First (Full Offline)
✅ Browser Extension
✅ Advanced Tools
✅ Analytics
✅ Multi-User (für JOCH Band?)
```

---

## **🎓 Was du lernst:**
```
Frontend:
- React Server Components (neuestes React)
- Next.js 15 App Router
- CSS Modules Design System
- Mobile-First Responsive Design
- CSS Variables & Custom Properties

Backend:
- Bun (Node.js Nachfolger)
- tRPC (Type-Safe APIs)
- Drizzle (moderne ORM)
- SQLite (File-based DB)

Infrastructure:
- Docker Orchestration
- Self-Hosting
- Security Best Practices

Optional:
- Rust (mit Tauri)
- Desktop App Development
- Offline-First Architecture
```

---

## **💰 Kosten:**
```
✅ Hetzner Server: Bereits bezahlt
✅ Domain: ~10€/Jahr (falls neu)
✅ Alles andere: KOSTENLOS & Open Source!

Keine:
❌ Vercel Costs
❌ Cloud DB Costs  
❌ External API Costs
❌ SaaS Subscriptions
```

---

## **🔒 Security:**
```
✅ Self-Hosted (volle Kontrolle)
✅ Client-Side Encryption
✅ Docker Network Isolation
✅ HTTPS (Let's Encrypt)
✅ JWT + Refresh Tokens
✅ Rate Limiting
✅ No Third-Party Dependencies
✅ Regular Backups (/mnt/storage)

Der Stack in einem Satz:

Next.js 15 Frontend + CSS Modules Design System + Bun + tRPC Backend + Drizzle + SQLite, self-hosted auf Hetzner mit Coolify, optional Tauri Desktop-App - Full Type-Safety, moderne Tech, volle Kontrolle, mobile-first responsive.