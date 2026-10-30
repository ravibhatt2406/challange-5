// ===========================================
// Express Server Entry Point
// ===========================================

import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import eventRoutes from './routes/events.js';
import planningRoutes from './routes/planning.js';
import aiRoutes from './routes/ai.js';
import ideaRoutes from './routes/ideas.js';
import exportRoutes from './routes/export.js';
import { errorHandler } from './middleware/errorHandler.js';
import { deploymentGuard } from './middleware/deploymentGuard.js';
import { resolveIdentity } from './middleware/auth.js';
import { requestContext } from './middleware/requestContext.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env['PORT'] || '3001', 10);

// ===========================================
// Security & Parsing Middleware
// ===========================================
app.use(helmet({
  contentSecurityPolicy: process.env['NODE_ENV'] === 'production' ? undefined : false,
}));
const allowedOrigins = process.env['CORS_ORIGINS']?.split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : (process.env['NODE_ENV'] === 'production' ? false : true),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(['/api', '/'], requestContext);
app.use(['/api', '/'], deploymentGuard);
app.use(['/api', '/'], resolveIdentity);

// ===========================================
// API Routes (mounted with and without /api prefix for Vercel Serverless Function compatibility)
// ===========================================
app.use('/api/events', eventRoutes);
app.use('/events', eventRoutes);

app.use('/api', planningRoutes);
app.use('/', planningRoutes);

app.use('/api', aiRoutes);
app.use('/', aiRoutes);

app.use('/api', ideaRoutes);
app.use('/', ideaRoutes);

app.use('/api', exportRoutes);
app.use('/', exportRoutes);

// Health check
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===========================================
// Static Files (Production standalone mode)
// ===========================================
if (process.env['NODE_ENV'] === 'production' && !process.env['VERCEL']) {
  const clientDist = path.join(__dirname, '../../client');
  app.use(express.static(clientDist));

  // SPA fallback — serve index.html for all non-API routes
  app.get('/{*splat}', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ===========================================
// Error Handler (must be last)
// ===========================================
app.use(errorHandler);

// ===========================================
// Start Server (only in standalone / non-serverless runtime)
// ===========================================
if (!process.env['VERCEL'] && process.env['NODE_ENV'] !== 'test') {
  app.listen(PORT, () => {
    process.stdout.write(`EventCraft AI server running on http://localhost:${PORT}\n`);
    process.stdout.write(`Environment: ${process.env['NODE_ENV'] || 'development'}\n`);
  });
}

export default app;
