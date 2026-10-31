import mongoose from 'mongoose';
import { getEnv } from './env.js';

mongoose.set('strictQuery', true);
mongoose.set('bufferCommands', false);

let connectionStatus = {
  connected: false,
  mode: 'mongodb',
  lastError: null,
};

export async function connectDatabase() {
  const env = getEnv();
  connectionStatus.mode = env.dbMode;

  if (env.dbMode === 'local_json') {
    connectionStatus = {
      connected: true,
      mode: 'local_json',
      lastError: null,
    };
    return connectionStatus;
  }

  if (!env.mongodbUri) {
    connectionStatus = {
      connected: false,
      mode: 'mongodb',
      lastError: 'MONGODB_URI environment variable is missing.',
    };
    return connectionStatus;
  }

  try {
    await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });

    connectionStatus = {
      connected: true,
      mode: 'mongodb',
      lastError: null,
    };

    mongoose.connection.on('disconnected', () => {
      connectionStatus.connected = false;
    });

    mongoose.connection.on('reconnected', () => {
      connectionStatus.connected = true;
      connectionStatus.lastError = null;
    });

    return connectionStatus;
  } catch (error) {
    connectionStatus = {
      connected: false,
      mode: 'mongodb',
      lastError: error.message || 'Failed to connect to MongoDB.',
    };
    return connectionStatus;
  }
}

export function getDatabaseStatus() {
  const env = getEnv();
  if (env.dbMode === 'local_json') {
    return {
      connected: true,
      mode: 'local_json',
      lastError: null,
    };
  }
  return {
    connected: mongoose.connection.readyState === 1,
    mode: 'mongodb',
    lastError: connectionStatus.lastError,
  };
}
