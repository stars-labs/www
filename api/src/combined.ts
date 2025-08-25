import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import blockchain from './routes/blockchain';
import transactions from './routes/transactions';
import analytics from './routes/analytics';
import nodes from './routes/nodes';

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
    // Create a request object compatible with getAssetFromKV
    const url = new URL(c.req.url);
    
    // Create event-like object for getAssetFromKV
    const event = {
      request: c.req.raw,
      waitUntil: (promise: Promise<any>) => c.executionCtx.waitUntil(promise),
      passThroughOnException: () => {},
    };

    // Try to get the asset from KV
    const response = await getAssetFromKV(event, {
      ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
      ASSET_MANIFEST: ASSET_MANIFEST,
      mapRequestToAsset: (request: Request) => {
        const url = new URL(request.url);
        // For root path or paths without extension, serve index.html
        if (url.pathname === '/' || !url.pathname.includes('.')) {
          url.pathname = '/index.html';
        }
        return new Request(url.toString(), request);
      },
      cacheControl: {
        browserTTL: 60 * 60 * 24 * 365, // 1 year for assets
        edgeTTL: 60 * 60 * 24 * 30, // 30 days
        bypassCache: false,
      },
    });

    // Add cache headers for assets
    const headers = new Headers(response.headers);
    if (url.pathname.includes('/assets/')) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      headers.set('Cache-Control', 'public, max-age=3600');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (e: any) {
    // If asset not found, return 404
    if (e.status === 404) {
      return c.text('Not Found', 404);
    }
    // For other errors, pass through
    throw e;
  }
});

export default app;

// This will be injected by Wrangler during build
declare const ASSET_MANIFEST: any;