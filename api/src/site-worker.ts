import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { getAssetFromKV, serveSinglePageApp } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
import blockchain from './routes/blockchain';
import transactions from './routes/transactions';

const assetManifest = JSON.parse(manifestJSON);

type Bindings = {
  DB: D1Database;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
  __STATIC_CONTENT: KVNamespace;
};

type Variables = {
  db: DrizzleD1Database;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Enable CORS for API routes
app.use(
  "/api/*",
  cors({
    origin: (origin) => origin || "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Middleware to inject database into context
app.use("/api/*", async (c, next) => {
  const db = drizzle(c.env.DB);
  c.set("db", db);
  await next();
});

// Mount API routes
app.route('/api/blockchain', blockchain);
app.route('/api/transactions', transactions);

// Health check endpoint
app.get("/api/health", (c) => {
  return c.json({
    status: "healthy",
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

// Handle static assets
app.all("*", async (c) => {
  const { pathname } = new URL(c.req.url);

  // Unmatched API paths must fail loudly as JSON, never fall through to
  // the SPA shell (clients calling response.json() would get a cryptic
  // "Unexpected token <" instead of a real error).
  if (pathname.startsWith("/api/")) {
    return c.json({ error: "Not Found", path: pathname }, 404);
  }

  try {
    // Create event-like object for getAssetFromKV
    const event = {
      request: c.req.raw,
      waitUntil: (promise: Promise<any>) => c.executionCtx.waitUntil(promise),
      passThroughOnException: () => {},
    };

    const url = new URL(c.req.url);
    const isHashed = /\.[a-f0-9]{8,}\.\w+$/.test(url.pathname);

    const options = {
      ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
      ASSET_MANIFEST: assetManifest,
      mapRequestToAsset: serveSinglePageApp,
      cacheControl: isHashed
        ? { browserTTL: 60 * 60 * 24 * 365, edgeTTL: 60 * 60 * 24 * 30, bypassCache: false }
        : { browserTTL: 0, edgeTTL: 0, bypassCache: true },
    };

    // Try to get the asset from KV
    const response = await getAssetFromKV(event, options);
    return response;
  } catch (e: any) {
    // A missing hashed asset means a stale client is requesting a chunk
    // from a previous deploy. Serving index.html with 200 would brick the
    // app ("expected JavaScript but got text/html"); a 404 lets the
    // browser surface a load error the client can recover from.
    if (pathname.startsWith("/assets/")) {
      return c.text("Not Found", 404);
    }

    // Otherwise serve index.html for SPA routing
    try {
      const event = {
        request: new Request(new URL("/index.html", c.req.url).toString()),
        waitUntil: (promise: Promise<any>) => c.executionCtx.waitUntil(promise),
        passThroughOnException: () => {},
      };

      const response = await getAssetFromKV(event, {
        ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
      });
      return response;
    } catch (err) {
      return c.text("Not Found", 404);
    }
  }
});

export default app;
