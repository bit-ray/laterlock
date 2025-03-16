import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import { locks } from "@/db/schema";
import { encryptWithSystemKey } from "@/lib/crypto";
import { ensureDbInitialized } from "@/lib/init-db";

// Define the maximum content length
const MAX_CONTENT_LENGTH = 2000;
// Define the maximum encrypted content length
// AES-256-GCM adds overhead: IV (16 bytes) + Auth Tag (16 bytes) + potential padding
// Base64 encoding increases size by ~33%
// Adding a 50% buffer to be safe
const MAX_ENCRYPTED_LENGTH = Math.ceil(MAX_CONTENT_LENGTH * 1.5) + 64;

export async function POST(request: NextRequest) {
  try {
    // Ensure the database is initialized
    await ensureDbInitialized();

    const { title, content, delayMinutes, encryptedContent, salt } = await request.json();

    if (!delayMinutes) {
      return NextResponse.json(
        { error: "Delay minutes are required" },
        { status: 400 }
      );
    }

    // Check if we either have content or pre-encrypted content
    if (!content && !encryptedContent) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Validate content length for non-encrypted content
    if (content && content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Validate encrypted content length
    if (encryptedContent && encryptedContent.length > MAX_ENCRYPTED_LENGTH) {
      return NextResponse.json(
        { error: `Encrypted content exceeds maximum allowed size` },
        { status: 400 }
      );
    }

    if (encryptedContent && salt) {
      // Store the pre-encrypted content as-is
      const newLock = await getDb().insert(locks).values({
        id: nanoid(30),
        title,
        content: encryptedContent,
        delayMinutes,
        salt,
        isEncrypted: true,
      }).returning();

      return NextResponse.json(newLock[0]);
    }
    else if (content) {
      const { encryptedContent, salt } = await encryptWithSystemKey(content);

      const newLock = await getDb().insert(locks).values({
        id: nanoid(30),
        title,
        content: encryptedContent,
        delayMinutes,
        salt,
        isEncrypted: false,
      }).returning();

      return NextResponse.json(newLock[0]);
    }
  } catch (error) {
    console.error("Error creating lock:", error);
    return NextResponse.json(
      { error: "Failed to create lock" },
      { status: 500 }
    );
  }
} 