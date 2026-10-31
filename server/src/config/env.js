import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server/.env first, falling back to repo root .env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true' || String(value) === '1';
}

export function getEnv() {
  const provider = (process.env.AI_PROVIDER || 'openai').trim().toLowerCase();
  const defaultModels = {
    openai: 'gpt-4o-mini',
    gemini: 'gemini-2.0-flash',
    anthropic: 'claude-3-5-sonnet-latest',
    openai_compatible: 'llama-3.3-70b-versatile',
  };

  const aiApiKey = (process.env.AI_API_KEY || '').trim();
  const aiBaseUrl = (process.env.AI_BASE_URL || '').trim();
  const codeExecutionUrl = (process.env.CODE_EXECUTION_URL || '').trim();

  // Local OpenAI-compatible servers (such as local Ollama) may not require a key if AI_ALLOW_KEYLESS=true
  const aiAllowKeyless = toBool(process.env.AI_ALLOW_KEYLESS, false);
  const isAiConfigured = Boolean(
    aiApiKey || (provider === 'openai_compatible' && aiBaseUrl && aiAllowKeyless)
  );

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: toInt(process.env.PORT, 5000),
    host: process.env.HOST || '0.0.0.0',
    clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

    dbMode: (process.env.DB_MODE || 'mongodb').trim().toLowerCase(),
    mongodbUri: (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codeassess_ai').trim(),
    localDbFile:
      process.env.LOCAL_DB_FILE || path.resolve(__dirname, '../../.cache/dev-database.json'),

    jwtSecret:
      process.env.JWT_SECRET || 'codeassess_dev_fallback_secret_change_in_production_2026',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    cookieSecure: toBool(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),

    aiProvider: provider,
    aiApiKey,
    aiModel: (process.env.AI_MODEL || defaultModels[provider] || 'gpt-4o-mini').trim(),
    aiBaseUrl,
    aiRequestTimeoutMs: toInt(process.env.AI_REQUEST_TIMEOUT_MS, 45000),
    isAiConfigured,

    codeExecutionProvider: (process.env.CODE_EXECUTION_PROVIDER || 'piston').trim().toLowerCase(),
    codeExecutionUrl,
    codeExecutionApiKey: (process.env.CODE_EXECUTION_API_KEY || '').trim(),
    codeExecutionTimeoutMs: toInt(process.env.CODE_EXECUTION_TIMEOUT_MS, 10000),
    isCodeExecutionConfigured: Boolean(codeExecutionUrl),

    rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    rateLimitMaxRequests: toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 150),
    aiRateLimitMaxRequests: toInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS, 20),
  };
}
