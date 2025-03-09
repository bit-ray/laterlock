import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { resolve } from 'path';

// Get the database path from environment variable or use default
// This allows mounting the database directory in Docker
const DB_DIR = process.env.DB_DIR || process.cwd();
const dbPath = resolve(DB_DIR, 'laterlock.db');

// Initialize the database client
// In a production app, we would use a proper Turso/LibSQL setup
const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client, { schema });

// Helper function to initialize the database tables
export async function initializeDb() {
  console.log(`Initializing database at: ${dbPath}`);

  try {
    // Create table if it doesn't exist (with new INTEGER types)
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

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
} 