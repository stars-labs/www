# StarsLab Main Site (Scaffold)

Svelte + Vite + Tailwind starter for the StarsLab public site focusing on blockchain, AI, and humanoid R&D.

## Stack

- Svelte 4 + Vite
- TailwindCSS 3
- TypeScript

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
```

## Deploy (Cloudflare Pages)

Prerequisites:

- Cloudflare Account ID: 5ccbd2ab14501cd236498638428d638d
- Create an API Token with Pages write permissions; add to repo secrets as `CLOUDFLARE_API_TOKEN`.

Manual deploy:

```bash
npm run deploy:cf
```

CI deploy happens automatically on pushes to `main` affecting `www/` via `.github/workflows/deploy-cloudflare.yml`.

## Next Ideas

- mdsvex for blog/whitepapers
- svelte-i18n for localization
- CSR/SSR migration path via SvelteKit later

## License

Internal / TBD
