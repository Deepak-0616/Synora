import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import bureauRoutes from './routes/bureauRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:4000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in dev/demo for reliability
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    product: 'SYNORA',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_MODE || 'sqlite'
  });
});

// Mount API routes under /api/v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/bureaus', bureauRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/ai', aiRoutes);

// Centralized error handler
app.use(errorHandler);

// Server startup
async function startServer() {
  try {
    await runMigrations();
    await seedDatabase(false);

    app.listen(PORT, () => {
      logger.info(`========================================================`);
      logger.info(` SYNORA REST API Engine is active on port ${PORT}`);
      logger.info(` Base URL: http://localhost:${PORT}/api/v1`);
      logger.info(` Health Check: http://localhost:${PORT}/health`);
      logger.info(`========================================================`);
    });
  } catch (err) {
    logger.error('Failed to start SYNORA server:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
