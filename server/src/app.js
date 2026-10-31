import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { getEnv } from './config/env.js';
import { getDatabaseStatus } from './config/db.js';
import { createGeneralRateLimiter } from './middleware/rateLimitMiddleware.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

export function createApp() {
  const app = express();
  const env = getEnv();

  app.set('trust proxy', 1);

  // Allow iframe preview embedding in sandboxed cloud IDEs while keeping safe HTTP headers
  app.use(
    helmet({
      frameguard: false,
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (env.nodeEnv !== 'production') return callback(null, true);
        const allowed = env.clientOrigin.split(',').map((o) => o.trim());
        if (allowed.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '512kb' }));
  app.use(cookieParser());
  app.use('/api', createGeneralRateLimiter());

  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      service: 'CodeAssess AI API',
      status: 'running',
      docs: '/api/health',
    });
  });

  app.get('/api/health', (_req, res) => {
    const currentEnv = getEnv();
    const dbStatus = getDatabaseStatus();
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        database: {
          connected: dbStatus.connected,
          mode: dbStatus.mode,
        },
        capabilities: {
          aiConfigured: currentEnv.isAiConfigured,
          aiProvider: currentEnv.aiProvider,
          codeExecutionConfigured: currentEnv.isCodeExecutionConfigured,
        },
      },
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/assessments', assessmentRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
