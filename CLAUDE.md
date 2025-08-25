# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking (Svelte + TypeScript)
npm run check

# Format code
npm run format

# Deploy to Cloudflare Pages (manual)
npm run deploy:cf
```

## Architecture Overview

This is a Svelte SPA (Single Page Application) built with:

- **Svelte 4** with TypeScript and Vite for fast development
- **TailwindCSS** for styling with custom brand colors defined in `tailwind.config.js`
- **Component-based architecture** with all components in `src/components/`

### Key Technical Patterns

1. **Component Structure**: All Svelte components use TypeScript (`<script lang="ts">`) and follow a pattern of single-file components with script, markup, and styles together.

2. **Brand Colors**: Custom TailwindCSS theme extends with brand colors (bg, surface, accent, neon, gradients) - use these consistently throughout components.

3. **Smooth Scrolling Navigation**: The app uses `scrollIntoView` for navigation between sections (see App.svelte:8-11).

4. **Deployment**: Cloudflare Pages deployment with automatic CI/CD on `main` branch pushes to `www/` directory.

## Project Structure

- Entry point: `src/main.ts` → mounts `App.svelte` to `#app`
- Main layout: `App.svelte` contains nav and orchestrates page sections
- Page sections as components: Hero, Pillars, Showcase, CTA, Footer
- Global styles: `src/app.css` imports Tailwind directives

## Important Configuration

- **TypeScript**: Strict mode enabled, extends Svelte's base tsconfig
- **Vite**: Configured with Svelte plugin and preprocessing
- **Cloudflare Account ID**: `5ccbd2ab14501cd236498638428d638d` (used in wrangler.toml and GitHub Actions)
