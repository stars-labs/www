import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { timing } from 'hono/timing';
import { drizzle } from 'drizzle-orm/d1';

import blockchainRoutes from './routes/blockchain';
import transactionRoutes from './routes/transactions';
import analyticsRoutes from './routes/analytics';
import nodesRoutes from './routes/nodes';

export type Env = {
  DB: D1Database;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', timing());
app.use(
  '*',
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://starslab.pages.dev'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
);

// Database middleware
app.use('*', async (c, next) => {
  const db = drizzle(c.env.DB);
  c.set('db', db);
  await next();
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString()
  });
});

// API Info
app.get('/', (c) => {
  return c.json({
    name: 'StarsLab Blockchain API',
    version: '1.0.0',
    endpoints: {
      blockchain: '/api/blockchain',
      transactions: '/api/transactions',
      analytics: '/api/analytics',
      nodes: '/api/nodes',
      health: '/health'
    },
    documentation: 'https://starslab.io/api/docs'
  });
});

// Mount routes
app.route('/api/blockchain', blockchainRoutes);
app.route('/api/transactions', transactionRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/nodes', nodesRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      message: 'The requested endpoint does not exist',
      path: c.req.path
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred'
    },
    500
  );
});

export default app;