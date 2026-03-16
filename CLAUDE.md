# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (from `www/` root)

```bash
npm install          # Install frontend dependencies
npm run dev          # Dev server at http://localhost:5173
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run check        # Svelte + TypeScript type checking
npm run format       # Prettier formatting
npm run deploy:cf    # Deploy to Cloudflare Pages
```

### API Backend (from `api/`)

```bash
npm install          # Install API dependencies
npm run dev          # Wrangler dev server at http://localhost:43251
npm run deploy       # Deploy Cloudflare Worker
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Apply D1 migrations locally
npm run db:studio    # Open Drizzle Studio for DB inspection
```

## Architecture Overview

Two-part application: a **Svelte 4 SPA frontend** and a **Hono API backend** running on Cloudflare Workers with D1 (SQLite).

### Frontend (`src/`)

- **Svelte 4** + TypeScript + Vite + TailwindCSS
- **Client-side routing** via `src/lib/router.ts` using Svelte stores and History API. Two routes: `home` (`/`) and `explorer` (`/explorer`)
- **Entry point**: `src/main.ts` → `App.svelte` which handles navigation and conditionally renders either the home page sections (Hero, Pillars, Showcase, CTA, Footer) or the BlockchainExplorer
- **API client**: `src/services/api.ts` — singleton `APIService` class with session management (sessionStorage) and typed methods for all backend endpoints
- **Brand colors**: Custom Tailwind theme in `tailwind.config.js` (brand-bg, brand-surface, brand-accent, brand-neon) — use consistently

### Key Frontend Components

- **BlockchainViz.svelte** (~1200 lines) — Canvas-based real-time blockchain visualization with mining simulation, chain forking logic, and user activity speed multiplier
- **BlockchainExplorer.svelte** — Interactive explorer with tabs (Blocks, Transactions, Forks), real-time polling (5s), search, and pagination
- **WebGPUParticles.svelte** — WebGPU/Canvas particle effects background layer

### API Backend (`api/`)

- **Hono** web framework on Cloudflare Workers
- **Drizzle ORM** with **Cloudflare D1** (SQLite) for persistence
- **Zod** for request validation via `@hono/zod-validator`
- **Dual entry points**: `api/src/site-worker.ts` (serves API + static assets in prod) and `api/src/index.ts` (standalone API for dev)

### API Routes (`api/src/routes/`)

| Prefix | Resource | Key endpoints |
|--------|----------|---------------|
| `/api/blockchain` | Blocks & forks | GET/POST blocks, GET stats, GET/POST forks, PUT resolve fork |
| `/api/transactions` | Transactions | CRUD, GET mempool/pending, GET stats/summary |
| `/api/analytics` | User analytics | POST interactions, mining stats, GET global analytics, GET heatmap |
| `/api/nodes` | Network nodes | CRUD, POST heartbeat, GET network stats, POST deactivate-inactive |

### Database Schema (`api/src/db/schema.ts`)

7 tables: `blocks`, `transactions`, `interactions`, `miningStats`, `nodes`, `chainForks` — all with auto-increment IDs and timestamps. See schema file for column details.

## Deployment

- **CI/CD**: `.github/workflows/deploy-cloudflare.yml` — triggers on push to `main` with changes in `www/`. Builds frontend, runs D1 migrations, deploys Worker.
- **Cloudflare Account ID**: `5ccbd2ab14501cd236498638428d638d` (in wrangler.toml and GitHub Actions)
- **D1 Database ID**: `774b90d0-2ce4-4d11-95b1-6b9c29028ad0`
- Requires `CLOUDFLARE_API_TOKEN` secret in GitHub repo settings
