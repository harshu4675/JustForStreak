import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { getEnv } from './config/env.js';

async function startServer() {
  const env = getEnv();
  const dbStatus = await connectDatabase();

  if (!dbStatus.connected) {
    console.warn(
      `[Database] Warning: MongoDB connection not established (${dbStatus.lastError}). API requests requiring persistence will return 503 until MongoDB is reachable.`
    );
  } else {
    console.log(`[Database] Connected (${dbStatus.mode}).`);
  }

  if (!env.isAiConfigured) {
    console.warn(
      '[AI Engine] AI_API_KEY is not set in server/.env. Assessment generation will return a 503 configuration notice until configured.'
    );
  }

  const app = createApp();
  app.listen(env.port, env.host, () => {
    console.log(`[Server] CodeAssess AI backend listening on http://${env.host}:${env.port}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup failure:', err);
  process.exit(1);
});
