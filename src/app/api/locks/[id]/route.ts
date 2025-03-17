import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { locks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ensureDbInitialized } from "@/lib/init-db";
import { decryptWithSystemKey } from "@/lib/crypto";

// Helper function to calculate unlock time remaining
function calculateUnlockTimeRemaining(lock: any): number | null {
  if (!lock.accessRequestedAt) {
    return null;
  }

  const accessRequestTime = lock.accessRequestedAt; // Already in milliseconds
  const delayMilliseconds = lock.delayMinutes * 60 * 1000;
  const targetUnlockTime = accessRequestTime + delayMilliseconds;
  const currentTime = Date.now();

  if (currentTime < targetUnlockTime) {
    return targetUnlockTime - currentTime;
  } else {
    return 0;
  }
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();

    const params = await props.params;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: "Lock ID is required" }, { status: 400 });
    }

    const result = await getDb()
      .select()
      .from(locks)
      .where(eq(locks.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Lock not found" }, { status: 404 });
    }

    const lock = result[0];

    // Calculate unlockTimeRemaining
    const unlockTimeRemaining = calculateUnlockTimeRemaining(lock);

    // Return non-sensitive data
    return NextResponse.json({
      id: lock.id,
      title: lock.title,
      delayMinutes: lock.delayMinutes,
      isEncrypted: lock.isEncrypted,
      accessRequestedAt: lock.accessRequestedAt,
      createdAt: lock.createdAt,
      unlockTimeRemaining: unlockTimeRemaining,
    });
  } catch (error) {
    console.error("Error retrieving lock:", error);
    return NextResponse.json(
      { error: "Failed to retrieve lock" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    await ensureDbInitialized();

    const params = await props.params;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: "Lock ID is required" }, { status: 400 });
    }

    const { action } = await request.json();

    if (action === "request_access") {
      // Update access requested timestamp with current time in milliseconds since epoch
      const now = Date.now();

      await getDb()
        .update(locks)
        .set({ accessRequestedAt: now })
        .where(eq(locks.id, id));

      return NextResponse.json({ message: "Access request recorded" });
    } else if (action === "cancel_request") {
      // Clear access requested timestamp
      await getDb()
        .update(locks)
        .set({ accessRequestedAt: null })
        .where(eq(locks.id, id));

      return NextResponse.json({ message: "Access request canceled" });
    } else if (action === "re_lock") {
      // Clear access requested timestamp to re-lock the content
      await getDb()
        .update(locks)
        .set({ accessRequestedAt: null })
        .where(eq(locks.id, id));

      return NextResponse.json({ message: "Content re-locked successfully" });
    } else if (action === "view_content") {
      // Retrieve the lock data to check access time
      const lockData = await getDb()
        .select()
        .from(locks)
        .where(eq(locks.id, id))
        .limit(1);

      if (lockData.length === 0) {
        return NextResponse.json({ error: "Lock not found" }, { status: 404 });
      }

      const lock = lockData[0];

      // If there's no access request timestamp, deny access
      if (!lock.accessRequestedAt) {
        return NextResponse.json(
          { error: "Access has not been requested for this lock" },
          { status: 403 }
        );
      }

      // Server-side enforcement of the delay
      const accessRequestTime = lock.accessRequestedAt; // Already in milliseconds
      const currentTime = Date.now();
      const delayMilliseconds = lock.delayMinutes * 60 * 1000;
      const timeElapsed = currentTime - accessRequestTime;

      if (timeElapsed < delayMilliseconds) {
        const remainingSeconds = Math.ceil((delayMilliseconds - timeElapsed) / 1000);
        return NextResponse.json(
          { error: "Wait time not elapsed", remainingSeconds },
          { status: 403 }
        );
      }

      // Update last accessed timestamp with current time in milliseconds
      const now = Date.now();

      await getDb()
        .update(locks)
        .set({ lastAccessed: now })
        .where(eq(locks.id, id));

      // For password-protected content, return encrypted data for client-side decryption
      if (lock.isEncrypted) {
        return NextResponse.json({
          content: lock.content,
          isEncrypted: lock.isEncrypted,
          salt: lock.salt,
        });
      } else {
        // For non-password protected content, decrypt on server with system key
        try {
          // Ensure we have the necessary decryption data
          if (!lock.salt) {
            return NextResponse.json(
              { error: "Missing encryption data" },
              { status: 500 }
            );
          }

          // Decrypt the content with the system key
          const decryptedContent = await decryptWithSystemKey(
            lock.content,
            lock.salt
          );

          // Return the decrypted content
          return NextResponse.json({
            content: decryptedContent,
            isEncrypted: false,
          });
        } catch (error) {
          console.error("Error decrypting content:", error);
          return NextResponse.json(
            { error: "Failed to decrypt content" },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "Invalid action specified" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating lock:", error);
    return NextResponse.json(
      { error: "Failed to update lock" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDbInitialized();

    const params = await props.params;
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: "Lock ID is required" }, { status: 400 });
    }

    // Check if the lock exists
    const existingLock = await getDb()
      .select()
      .from(locks)
      .where(eq(locks.id, id))
      .limit(1);

    if (existingLock.length === 0) {
      return NextResponse.json({ error: "Lock not found" }, { status: 404 });
    }

    // Delete the lock
    await getDb()
      .delete(locks)
      .where(eq(locks.id, id));

    return NextResponse.json({ message: "Lock deleted successfully" });
  } catch (error) {
    console.error("Error deleting lock:", error);
    return NextResponse.json(
      { error: "Failed to delete lock" },
      { status: 500 }
    );
  }
} 