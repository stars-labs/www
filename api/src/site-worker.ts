import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { getAssetFromKV, serveSinglePageApp } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
import blockchain from './routes/blockchain';
import transactions from './routes/transactions';
import analytics from './routes/analytics';
import nodes from './routes/nodes';

const assetManifest = JSON.parse(manifestJSON);

type Bindings = {
  DB: D1Database;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
  __STATIC_CONTENT: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for API routes
app.use('/api/*', cors({
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware to inject database into context
app.use('/api/*', async (c, next) => {
  const db = drizzle(c.env.DB);
  c.set('db', db);
  await next();
});

// Mount API routes
app.route('/api/blockchain', blockchain);
app.route('/api/transactions', transactions);
app.route('/api/analytics', analytics);
app.route('/api/nodes', nodes);

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'healthy',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString()
  });
});

// Handle static assets
app.all('*', async (c) => {
  try {
    // Create event-like object for getAssetFromKV
    const event = {
      request: c.req.raw,
      waitUntil: (promise: Promise<any>) => c.executionCtx.waitUntil(promise),
      passThroughOnException: () => {},
    };

    const options = {
      ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
      ASSET_MANIFEST: assetManifest,
      mapRequestToAsset: serveSinglePageApp,
      cacheControl: {
        browserTTL: 60 * 60 * 24 * 365, // 1 year
        edgeTTL: 60 * 60 * 24 * 30, // 30 days
        bypassCache: false,
      },
    };

    // Try to get the asset from KV
    const response = await getAssetFromKV(event, options);
    return response;
  } catch (e: any) {
    // If asset not found or error, try to serve index.html for SPA routing
    try {
      const event = {
        request: new Request(new URL('/index.html', c.req.url).toString()),
        waitUntil: (promise: Promise<any>) => c.executionCtx.waitUntil(promise),
        passThroughOnException: () => {},
      };

      const response = await getAssetFromKV(event, {
        ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
      });
      return response;
    } catch (err) {
      return c.text('Not Found', 404);
    }
  }
});

export default app;