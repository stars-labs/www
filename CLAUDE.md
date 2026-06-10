# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StarsLab public site: a Svelte SPA (frontend, repo root) plus a Cloudflare Worker API (`api/`) that serves both the JSON API and the built SPA assets. The marketing page includes an interactive blockchain visualization/explorer backed by a D1 (SQLite) database — see `BLOCKCHAIN_ARCHITECTURE.md` for the full data model and mechanics.

## Development Commands

### Frontend (repo root)

```bash
npm install
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # Production build to dist/
npm run check      # svelte-check (TypeScript + Svelte type checking)
npm run format     # Prettier
npm run deploy:cf  # Manual deploy to Cloudflare Pages (legacy path)
```

### API (`api/` — separate package, run `npm install` there first)

```bash
cd api
npm run dev          # wrangler dev src/site-worker.ts (frontend dev expects port 43251)
npm run typecheck    # tsc --noEmit
npm run db:studio    # Drizzle Studio for DB inspection
npm run deploy       # wrangler deploy --minify src/site-worker.ts
```

There are no automated tests in either package.

## Architecture

### Two packages, one deployment

- **Frontend**: Svelte 5 (components written in Svelte 4 syntax, non-runes mode; `src/main.ts` uses the Svelte 5 `mount()` API) + TypeScript + Vite + TailwindCSS v4 (via the `@tailwindcss/vite` plugin — there is no `tailwind.config.js` or `postcss.config.js`). Builds to `dist/`.
- **API**: Hono app on Cloudflare Workers with Drizzle ORM over a D1 database (`starslab-db`, binding `DB`).
- **`api/src/site-worker.ts` is the deployed entry point**. It mounts the API under `/api/*` (blockchain, transactions, health) and serves the built SPA from `../dist` via `@cloudflare/kv-asset-handler`, with SPA fallback to `index.html`. Other files in `api/src/` (`worker.ts`, `index.ts`, `combined.ts`, `index-combined.ts`) are older/alternative entry points — don't edit them by mistake.

### Frontend structure

- `src/main.ts` mounts `App.svelte`; `App.svelte` holds the nav (desktop + mobile hamburger) and switches pages.
- **Routing**: minimal custom store-based router in `src/lib/router.ts` — a `currentRoute` writable store with two routes (`home`, `explorer`) and History API push/popstate handling. No router library; add new routes there.
- **API access**: `src/services/api.ts` — singleton `APIService` with session management and typed methods. Base URL is `http://localhost:43251/api` in dev, relative `/api` in production (same-origin via the worker).
- Key components: `BlockchainViz.svelte` (~1200-line canvas mining simulation with chain forks and click-to-boost), `BlockchainExplorer.svelte` (blocks/transactions tabs, polling, search), `LiveBlockFeed.svelte`, `TransactionPanel.svelte`, `BlockchainStats.svelte` (HUD), `WebGPUParticles.svelte`.
- **Brand colors**: defined as Tailwind v4 `@theme` variables in `src/app.css` (`--color-brand-bg`, `-surface`, `-accent`, `-neon`, gradient stops → `bg-brand-accent` etc.); shared utility classes like `.gradient-text` and `.glow-border` also live there.

### Database

`api/src/db/schema.ts` matches the **actual tables in the remote D1 database**; migration `api/drizzle/0000` was rewritten from the production DDL, so a fresh local environment (`npx wrangler d1 migrations apply starslab-db --local`) gets the same schema as production. Inspect with `npm run db:studio` or `wrangler d1 execute`. Note `chain_state` is stale in production (nothing maintains it) and is not queried by any route.

The `blocks` chain is **shared**: a mining bot (external to this repo) appends real blocks, and visitor-mined blocks from the homepage viz are submitted in batches via `POST /api/blockchain/blocks`, which appends them at the current tip inside a single D1 `batch()` transaction (`INSERT OR IGNORE ... SELECT MAX(height)+1` — duplicate hashes are skipped, visitor hashes are only 32 bits). Visitor miner addresses are session-derived and must match `^0xstu[a-z0-9]{1,20}$` server-side, so the bot's namespace can't be spoofed and visitor rows are identifiable by prefix; the Explorer uses the same address (from localStorage) to highlight "You".

### Constraints

- The Cloudflare account is on the **free tier** — API call volume from the frontend is deliberately throttled (see `BlockchainViz.svelte` sync logic and 30s polling intervals); keep polling conservative when touching BlockchainViz/Explorer/Stats.

## Deployment

GitHub Actions (`.github/workflows/deploy-cloudflare.yml`) on pushes to `main`: builds the frontend, applies D1 migrations remotely, then deploys the worker (`starslab-app`, routed to `starslab.io/*` in production). Requires `CLOUDFLARE_API_TOKEN` secret; account ID `5ccbd2ab14501cd236498638428d638d`, D1 database ID `774b90d0-2ce4-4d11-95b1-6b9c29028ad0`. The root `wrangler.toml` (Pages) is the legacy deploy path; the worker config in `api/wrangler.toml` is authoritative.

`secrets.yaml` is SOPS-encrypted (PGP, rules in `.sops.yaml`) — never commit it decrypted.
