import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { resolve } from 'path';

let clientInstance: ReturnType<typeof createClient> | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getClient() {
  if (!clientInstance) {
    const DB_DIR = process.env.DB_DIR;
    if (!DB_DIR) {
      throw new Error('DB_DIR environment variable is missing');
    }

    const encryptionKey = process.env.LATERLOCK_SYSTEM_KEY;
    if (!encryptionKey || (process.env.NODE_ENV === "production" && encryptionKey === "DONOTUSE")) {
      throw new Error('LATERLOCK_SYSTEM_KEY environment variable is missing');
    }

    const dbPath = resolve(DB_DIR, 'laterlock.db');

    clientInstance = createClient({
      url: `file:${dbPath}`,
      encryptionKey: encryptionKey,
    });
  }

  return clientInstance;
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = drizzle(getClient(), { schema });
  }
  return dbInstance;
}

export async function initializeDb() {
  let client;

  try {
    client = getClient();
  } catch (error) {
    console.log('Error getting client:', error);
    throw error;
  }

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS locks (
        id TEXT PRIMARY KEY,
        title TEXT,
        content TEXT NOT NULL,
        delay_minutes INTEGER NOT NULL,
        salt TEXT,
        is_encrypted INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (CAST(strftime('%s', 'now') AS INTEGER) * 1000),
        access_requested_at INTEGER,
        last_accessed INTEGER
      );
    `);
  } catch (error) {
    console.log('Error initializing database schema:', error);
    throw error;
  }
} 