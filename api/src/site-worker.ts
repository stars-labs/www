import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import blockchain from './routes/blockchain';
import transactions from './routes/transactions';
import mining from './routes/mining';
import rpc from './routes/rpc';
import { BlockchainBot } from './services/bot';
import * as schema from './db/schema';
// import analytics from './routes/analytics';
// import nodes from './routes/nodes';

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
  const db = drizzle(c.env.DB, { schema });
  c.set('db', db);
  await next();
});

// Initialize bot on first request (Cloudflare Workers limitation)
let botInitialized = false;
app.use('/api/*', async (c, next) => {
  if (!botInitialized) {
    botInitialized = true;
    const db = c.get('db');
    const bot = new BlockchainBot(db, c.env.ENVIRONMENT);
    
    // Initialize bot and start transaction loop
    bot.initialize().then(() => {
      console.log('Bot initialized, starting transaction loop');
      bot.startTransactionLoop();
    }).catch(error => {
      console.error('Failed to initialize bot:', error);
    });
  }
  
  await next();
});

// Mount API routes
app.route('/api/blockchain', blockchain);
app.route('/api/transactions', transactions);
app.route('/api/mining', mining);
app.route('/rpc', rpc);
// app.route('/api/analytics', analytics);
// app.route('/api/nodes', nodes);

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'healthy',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString()
  });
});

// Handle static assets - delegate to ASSETS binding
app.all('*', async (c) => {
  // The ASSETS binding automatically handles static files
  // and SPA routing (serving index.html for client-side routes)
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;