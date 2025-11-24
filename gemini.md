# 🚀 HUB - Project Concept (Gemini Edition)

> "Speed is a feature."

## 1. The Vision
Eine persönliche "Kommandozentrale" (Dashboard) als Single Point of Entry.
Kein Vendor-Lock-in, keine unnötigen Abos. Volle Datenhoheit auf eigenem Blech (Hetzner), verwaltet wie eine moderne Cloud-App (Coolify).

## 2. The Stack: "Bleeding Edge Stability"

Wir wählen Tools, die nicht nur "neu" sind, sondern spezifische Probleme von Self-Hosting und Performance besser lösen als der Standard.

| Layer | Choice | Why? |
|-------|--------|------|
| **Runtime** | **Bun** | Node.js ist Legacy für dieses Projekt. Bun ist instant. Native TypeScript Support bedeutet: kein Build-Step für das Backend nötig. |
| **Backend** | **Hono** | Express ist zu schwerfällig. Hono ist Web-Standard-basiert, ultra-leicht und läuft perfekt auf Bun. |
| **Frontend** | **Next.js 15** | React Server Components (RSC) + Server Actions reduzieren die Notwendigkeit einer komplexen API für simple CRUD-Tasks massiv. |
| **Glue** | **tRPC** | End-to-End Type Safety. Wenn du im Backend etwas änderst, schreit das Frontend sofort (Build Error). Keine Runtime-Überraschungen. |
| **Ops** | **Coolify** | Die "Vercel Experience", aber auf deinem eigenen Server. |

## 3. Architecture: The "Lean" Monorepo

Wir vermeiden Over-Engineering. Kein Nx, kein Turborepo (zu viel Overhead für den Start). Einfache `pnpm workspaces` reichen völlig.

```text
DegixHub/
├── apps/
│   ├── web/          # Next.js 15 (Frontend)
│   └── api/          # Hono + Bun (Backend)
├── packages/
│   └── shared/       # Zod schemas, TypeScript interfaces (Single Source of Truth)
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## 4. Implementation Strategy (The Battle Plan)

### Phase 1: Foundation 🏗️
1.  **Workspace Init:** `pnpm` Workspace aufsetzen.
2.  **Backend Core:** `apps/api` mit Hono und Bun initialisieren.
3.  **Frontend Core:** `apps/web` mit Next.js 15 aufsetzen.
4.  **The Link:** tRPC einrichten, um Frontend und Backend zu verbinden.

### Phase 2: Core Infrastructure 🔌
1.  **Dockerization:** Optimierte Dockerfiles für Bun (Backend) und Node/Bun (Frontend).
2.  **Coolify Setup:** Konfiguration für das Deployment via Coolify (nixpacks oder Dockerfile).
3.  **Pipeline Test:** Erstes Deployment des "Skeletons" auf `hub.reneschmidt.de`.

### Phase 3: Features ⚡
1.  **Auth:** Lightweight Authentication (z.B. via Hono Session oder Auth.js).
2.  **Dashboard UI:** Grid-Layout mit Tailwind v4.
3.  **Service Integration:** Proxy-Weiterleitungen oder API-Anbindungen an andere Self-Hosted Services.

## 5. Gemini's Take 💎
Warum dieser Ansatz gewinnt:
*   **Developer Experience (DX):** Bun macht lokale Entwicklung rasend schnell. Keine Wartezeiten beim Server-Start.
*   **Simplicity:** Wir brauchen keinen separaten Nginx. Traefik (via Coolify) regelt SSL und Routing automatisch.
*   **Efficiency:** Hono + Bun verbrauchen einen Bruchteil des RAMs im Vergleich zu NestJS oder Standard-Express Apps. Perfekt für den CX43.

Let's build this.
