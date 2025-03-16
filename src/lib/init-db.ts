import { initializeDb } from "@/db";

let initialized = false;

export async function ensureDbInitialized() {
  if (initialized) return;

  try {
    await initializeDb();
    initialized = true;
  } catch (error) {
    console.log("Failed to initialize database:", error);
    throw error;
  }
} 