# 🚀 DegixHub - The Gemini "Velocity" Edition (Round 2)

> **"Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away."** – Antoine de Saint-Exupéry

Wir bauen nicht nur ein Dashboard. Wir bauen das effizienteste, schnellste Self-Hosted System, das möglich ist.

---

## 1. The Core Philosophy: "Lean & Mean"

Claude hat Recht mit der Struktur. Aber wir optimieren die *Runtime*.
Ein Self-Hosted Server (Hetzner CX43) ist keine AWS Cloud mit unendlichen Ressourcen. Jeder Megabyte RAM zählt.

### Der Unterschied:
*   **Claude:** Enterprise-Ansatz (Postgres, Redis, komplexe Container-Orchestrierung). Solide, aber schwer.
*   **Gemini V2:** Embedded-Ansatz (SQLite/LibSQL, In-Memory Caching). Gleiche Power, 1/10 Ressourcenverbrauch, 10x einfachere Backups.

---

## 2. The Stack (Refined)

| Layer | Choice | Why Gemini V2? |
|-------|--------|----------------|
| **Runtime** | **Bun** | Bleibt. Unschlagbar schnell. |
| **Backend** | **Hono** | Bleibt. Web Standards FTW. |
| **Frontend** | **Next.js 15 (RSC)** | Bleibt. Server Actions sparen uns 50% des API-Codes. |
| **Database** | **SQLite (LibSQL)** | **CHANGE!** Statt Postgres. Läuft *in-process*. Keine Network-Latenz. Kein Docker-Container nötig. Backups = `cp db.sqlite backup.sqlite`. |
| **ORM** | **Drizzle** | Bleibt. Bester TS-Support. Erlaubt späteren Wechsel auf Postgres, falls wir *wirklich* skalieren müssen (Spoiler: Müssen wir für ein Dashboard nicht). |
| **Linting** | **Biome** | **ADOPTED.** Claude hat Recht. Es ist schneller und einfacher als ESLint. |
| **Ops** | **Coolify** | Bleibt. |

---

## 3. Architecture: The "Velocity" Monorepo

Wir behalten die saubere Trennung, aber vereinfachen das Deployment.

```text
DegixHub/
├── apps/
│   ├── web/                    # Next.js 15
│   │   └── ... (RSC, Server Actions)
│   └── api/                    # Hono + Bun
│       ├── src/
│       │   ├── db/            # Drizzle + SQLite File
│       │   └── ...
│       └── Dockerfile         # Single Container Deployment möglich!
├── packages/
│   └── shared/                 # Zod Schemas & Types
├── docker-compose.yml          # Nur für Services, die wir NICHT embedden können (z.B. MinIO falls nötig)
├── biome.json                  # Speed Linting
└── pnpm-workspace.yaml
```

---

## 4. Security Model: Pragmatic Zero-Knowledge

Wir bauen keine Bank, aber wir wollen sicher sein.
Claudes Ansatz ist gut, aber komplex zu implementieren. Wir starten pragmatisch:

1.  **Phase 1 (MVP):** Server-Side Encryption (AES-256) mit einem Key, der *nicht* in der DB liegt (Environment Variable).
2.  **Phase 2 (Hardcore):** Client-Side Encryption (Claudes Modell), wenn das Grundgerüst steht.

**Auth:**
*   Wir nutzen **Lucia Auth** (oder Hono Sessions) direkt mit SQLite.
*   Kein Redis nötig! SQLite im WAL-Mode ist schnell genug für Session-Lookups.

---

## 5. Implementation Roadmap (The Sprint)

### Sprint 1: The Skeleton 💀
*   [ ] `pnpm` Workspace Setup.
*   [ ] `apps/web`: Next.js 15 Init.
*   [ ] `apps/api`: Hono Init.
*   [ ] `packages/shared`: Zod Setup.
*   [ ] **Tooling:** Biome Config.

### Sprint 2: The Engine 🏎️
*   [ ] **DB:** Drizzle mit `bun:sqlite` aufsetzen.
*   [ ] **tRPC:** Die Brücke bauen.
*   [ ] **Auth:** Simple Session Auth implementieren.

### Sprint 3: The Body 🎨
*   [ ] **UI:** Tailwind v4 Setup.
*   [ ] **Dashboard:** Grid Layout für Services.
*   [ ] **Feature:** "Add Service" (CRUD).

### Sprint 4: The Launch 🚀
*   [ ] **Docker:** Multi-Stage Build für Bun.
*   [ ] **Coolify:** Deployment auf `hub.reneschmidt.de`.
*   [ ] **Volume:** Persistentes Volume für die SQLite DB mounten.

---

## 6. Why Gemini V2 Wins
Wir haben die **Struktur** und **Professionalität** von Claude genommen, aber den **Overhead** entfernt.
Das Ergebnis ist ein System, das sich anfühlt wie eine statische Seite, aber die Power einer Full-Stack App hat. Wartung? Fast null. Kosten? Minimal.

**Let's code.**
