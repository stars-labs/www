import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import blockchain from './routes/blockchain';
import transactions from './routes/transactions';
import mining from './routes/mining';
import rpc from './routes/rpc';
import stats from './routes/stats';
import init from './routes/init';
import testMining from './routes/test-mining';
import bot from './routes/bot';
import faucet from './routes/faucet';
import wallet from './routes/wallet';
// import { BlockchainBot } from './services/bot'; // Disabled - Buffer not available in Workers
import * as schema from './db/schema';
// import analytics from './routes/analytics';
// import nodes from './routes/nodes';

// @ts-ignore
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

type Bindings = {
  DB: D1Database;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
  __STATIC_CONTENT: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for API routes (including RPC)
app.use('/api/*', cors({
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Enable CORS for RPC endpoint
app.use('/rpc', cors({
  origin: (origin) => origin || '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware to inject database into context for API routes (including RPC)
app.use('/api/*', async (c, next) => {
  const db = drizzle(c.env.DB, { schema });
  c.set('db', db);
  await next();
});

// Middleware to inject database into context for RPC
app.use('/rpc', async (c, next) => {
  const db = drizzle(c.env.DB, { schema });
  c.set('db', db);
  await next();
});

// Bot initialization disabled - Buffer not available in Cloudflare Workers
// Will be re-enabled when we implement a Workers-compatible version
/*
app.use('/api/*', async (c, next) => {
  // Bot disabled for now
  await next();
});
*/

// Mount API routes
app.route('/api/blockchain', blockchain);
app.route('/api/transactions', transactions);
app.route('/api/mining', mining);
app.route('/api/analytics', stats);
app.route('/api/init', init);
app.route('/api/test-mining', testMining);
app.route('/api/bot', bot);
app.route('/api/faucet', faucet);
app.route('/api/wallet', wallet);
app.route('/rpc', rpc);
// app.route('/api/nodes', nodes);

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'healthy',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString()
  });
});

// Handle static assets and SPA routing
app.all('*', async (c) => {
  try {
    // Try to serve the asset from KV
    const response = await getAssetFromKV(
      {
        request: c.req.raw,
        waitUntil: (promise) => c.executionCtx.waitUntil(promise),
      },
      {
        ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
        ASSET_MANIFEST: assetManifest,
      }
    );
    
    return response;
  } catch (error: any) {
    // If it's a 404 and not an API route, serve index.html for SPA routing
    if (error.status === 404 && !c.req.path.startsWith('/api') && !c.req.path.startsWith('/rpc')) {
      try {
        const indexRequest = new Request(new URL('/index.html', c.req.url));
        const indexResponse = await getAssetFromKV(
          {
            request: indexRequest,
            waitUntil: (promise) => c.executionCtx.waitUntil(promise),
          },
          {
            ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
            ASSET_MANIFEST: assetManifest,
          }
        );
        
        return indexResponse;
      } catch (indexError) {
        console.error('Failed to serve index.html:', indexError);
        return c.text('Page not found', 404);
      }
    }
    
    console.error('Error serving assets:', error);
    return c.text('Internal server error', 500);
  }
});

export default app;