import express, { Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { prisma } from './config/prisma';
import {resolve} from 'path';
import { errorHandler, notFoundHandler } from './utils/errors';

import collegeRoutes from './routes/college.routes';
import predictorRoutes from './routes/predictor.routes';
import compareRoutes from './routes/compare.routes';
import qaRoutes from './routes/qa.routes';
import aiRoutes from './routes/ai.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config({
  path: resolve(process.cwd(),process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'),
  override: true
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(compression({
  filter: (req: Request, res: Response): boolean => {
    if (req.headers['x-no-compression']) return false;
    const contentType = String(res.getHeader('Content-Type') || '');
    if (contentType.includes('text/event-stream') || contentType.includes('application/x-ndjson')) return false;
    return compression.filter(req, res);
  },
  memLevel: 8,
  threshold: 1024
}));

app.disable('x-powered-by');

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id']?.toString() || crypto.randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://college-discovery-app-pzv7.vercel.app',
].filter(Boolean);

app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow any Vercel preview or explicit allowlist
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, origin); // echo back the actual requesting origin
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '64kb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/predictor', predictorRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/questions', qaRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// For Vercel serverless deployment
export default app;

// For local development
if (require.main === module) {
  app.listen(PORT, () => {
    if (process.env.NODE_ENV === 'production') {
      console.log(`🚀 Production Server running on port ${PORT}`);
    } else {
      console.log(`🛠️ Development Server running on http://localhost:${PORT}`);
    }
  });
}
