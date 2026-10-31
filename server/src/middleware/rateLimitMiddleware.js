import rateLimit from 'express-rate-limit';
import { getEnv } from '../config/env.js';

export function createGeneralRateLimiter() {
  const env = getEnv();
  return rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.nodeEnv === 'test' ? 10000 : env.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests from this client. Please wait before trying again.',
      },
    },
  });
}

export function createAiGenerationRateLimiter() {
  const env = getEnv();
  return rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.nodeEnv === 'test' ? 10000 : env.aiRateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'AI_GENERATION_RATE_LIMITED',
        message:
          'Assessment generation rate limit reached. Please wait a few minutes before generating another assessment.',
      },
    },
  });
}
