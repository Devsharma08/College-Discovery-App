import express, { Request, Response } from 'express';
import cors from 'cors';
import compression from 'compression';
import zlib from 'zlib';
import dotenv from 'dotenv';
import { prisma } from './config/prisma';
import { CACHE_TTL_MS } from './utils/cache';

import collegeRoutes from './routes/college.routes';
import predictorRoutes from './routes/predictor.routes';
import compareRoutes from './routes/compare.routes';
import qaRoutes from './routes/qa.routes';
import aiRoutes from './routes/ai.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
  override: true
});

const app = express();
const PORT = process.env.PORT || 5000;

// Compression logic
app.use(compression({
  filter: (req: Request, res: Response): boolean => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  zlib: { level: 6 },
  memLevel: 8,
  threshold: 1024 // only compress > 1kb data
}));

const brotliOptions = {
  chunkSize: 16 * 1024,
  params: {
    [zlib.constants.BROTLI_PARAM_QUALITY]: 6,
  }
};

app.use(compression({ brotli: brotliOptions } as any));

// Caching middleware
app.use((req: Request, res: Response, next) => {
  res.set('Cache-Control', `public, max-age=${CACHE_TTL_MS / 1000}`);
  next();
});

app.disable('x-powered-by');

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://college-discovery-app-pv2yerku3-users-projects-426e2b02.vercel.app',
  'https://college-discovery-app-one.vercel.app',
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

app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  next();
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

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  if (process.env.NODE_ENV === 'production') {
    console.log(`🚀 Production Server running on port ${PORT}`);
  } else {
    console.log(`🛠️ Development Server running on http://localhost:${PORT}`);
  }
});
