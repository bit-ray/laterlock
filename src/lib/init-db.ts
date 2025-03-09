import { initializeDb } from "@/db";

let initialized = false;

export async function ensureDbInitialized() {
  if (initialized) return;

  try {
    await initializeDb();
    initialized = true;
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
} 