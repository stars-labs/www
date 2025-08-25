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
  ASSETS: Fetcher;
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

// Serve static files for all non-API routes
app.all('*', async (c) => {
  // For non-API routes, serve from the static assets
  return await c.env.ASSETS.fetch(c.req.raw);
});

export default app;