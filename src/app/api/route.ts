import { NextResponse } from "next/server";
import { initializeDb } from "@/db";

// Initialize the database on first API call
export async function GET() {
  try {
    await initializeDb();
    return NextResponse.json({ success: true, message: "Database initialized" });
  } catch (error) {
    console.error("Error initializing database:", error);
    return NextResponse.json(
      { error: "Failed to initialize database" },
      { status: 500 }
    );
  }
} 