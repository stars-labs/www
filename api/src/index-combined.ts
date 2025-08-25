import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import blockchain from './routes/blockchain';
import transactions from './routes/transactions';
import analytics from './routes/analytics';
import nodes from './routes/nodes';

type Bindings = {
  DB: D1Database;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
  __STATIC_CONTENT: any;
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

// Serve static assets for all non-API routes
app.get('*', async (c) => {
  try {
    // Try to serve from KV storage
    const url = new URL(c.req.url);
    let pathname = url.pathname;

    // Default to index.html for root path
    if (pathname === '/') {
      pathname = '/index.html';
    }

    // For client-side routing, always serve index.html for non-asset paths
    if (!pathname.includes('.') && pathname !== '/') {
      pathname = '/index.html';
    }

    // Import the static assets from the build
    const ASSET_MANIFEST = JSON.parse(ASSET_MANIFEST_TEXT);
    const ASSET_NAMESPACE = c.env.__STATIC_CONTENT;
    
    // Check if asset exists
    const assetKey = pathname.substring(1); // Remove leading slash
    
    if (ASSET_MANIFEST[assetKey]) {
      const asset = await ASSET_NAMESPACE.get(assetKey, 'arrayBuffer');
      if (asset) {
        // Determine content type
        let contentType = 'text/plain';
        if (pathname.endsWith('.html')) contentType = 'text/html';
        else if (pathname.endsWith('.js')) contentType = 'application/javascript';
        else if (pathname.endsWith('.css')) contentType = 'text/css';
        else if (pathname.endsWith('.json')) contentType = 'application/json';
        else if (pathname.endsWith('.png')) contentType = 'image/png';
        else if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) contentType = 'image/jpeg';
        else if (pathname.endsWith('.svg')) contentType = 'image/svg+xml';
        else if (pathname.endsWith('.ico')) contentType = 'image/x-icon';

        return new Response(asset, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': pathname.includes('/assets/') ? 'public, max-age=31536000' : 'public, max-age=3600',
          },
        });
      }
    }

    // If asset not found, serve index.html for client-side routing
    const indexAsset = await ASSET_NAMESPACE.get('index.html', 'arrayBuffer');
    if (indexAsset) {
      return new Response(indexAsset, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    return c.text('Not Found', 404);
  } catch (error) {
    console.error('Error serving static asset:', error);
    return c.text('Internal Server Error', 500);
  }
});

// Export for Cloudflare Workers
export default app;

// Declare the asset manifest (will be injected by build)
declare const ASSET_MANIFEST_TEXT: string;