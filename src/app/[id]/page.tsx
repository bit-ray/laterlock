"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { decryptWithPassword } from "@/app/actions/client-crypto-actions";
import React from "react";
import { formatMinutes } from "@/utils/formatters";
import { Button } from "@/components/ui/button";

// Imported components
import { LockPageHeader } from "../../components/lock/LockPageHeader";
import { LockInfo } from "../../components/lock/LockInfo";
import { LockCountdown } from "../../components/lock/LockCountdown";
import { LockContent } from "../../components/lock/LockContent";
import { PasswordDialog } from "../../components/lock/PasswordDialog";
import { DeleteDialog } from "../../components/lock/DeleteDialog";
import { UnlockButton } from "../../components/lock/UnlockButton";

// Types - move to a separate file later if needed
interface Lock {
  id: string;
  title?: string;
  delayMinutes: number;
  isEncrypted: boolean;
  accessRequestedAt: string | null;
  createdAt: string;
}

interface LockContent {
  content: string;
  isEncrypted: boolean;
  salt?: string;
}

export default function LockPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [lock, setLock] = useState<Lock | null>(null);
  const [lockContent, setLockContent] = useState<LockContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [cancelingRequest, setCancelingRequest] = useState(false);
  const [fetchingContent, setFetchingContent] = useState(false);
  const [password, setPassword] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState("");
  const [decryptionError, setDecryptionError] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);

  // Calculate countdown target date based on accessRequestedAt and delayMinutes
  const countdownDate = lock?.accessRequestedAt
    ? (() => {
      // Use the timestamp directly (already in milliseconds since epoch)
      const requestTime = lock.accessRequestedAt;

      // Add delay in milliseconds
      const delayMs = parseInt(String(lock.delayMinutes), 10) * 60000;
      const targetTime = new Date(requestTime + delayMs);

      return targetTime;
    })()
    : null;

  // Check if countdown has completed and update state
  useEffect(() => {
    if (countdownDate) {
      const currentTime = new Date();
      setIsCountdownComplete(currentTime >= countdownDate);
    }
  }, [countdownDate, lock]);

  // Fix: Ensure isCountdownActive is always a boolean by using double negation
  const isCountdownActive = !isCountdownComplete && !!lock?.accessRequestedAt;

  // Get the ID from params
  const id = params.id;

  useEffect(() => {
    const fetchLock = async () => {
      try {
        setIsLoading(true);

        // Make sure id is available
        if (!id) {
          toast.error("Invalid lock ID");
          return;
        }

        const response = await fetch(`/api/locks/${encodeURIComponent(id)}`);

        if (!response.ok) {
          throw new Error("Failed to fetch lock");
        }

        const data = await response.json();
        setLock(data);

        // Set the page title if lock title exists
        if (data.title) {
          document.title = `${data.title} - LaterLock`;
        }

        // Check if countdown is complete on initial load
        if (data.accessRequestedAt) {
          const requestTime = data.accessRequestedAt; // Already in milliseconds
          const delayMs = parseInt(String(data.delayMinutes), 10) * 60000;
          const targetTime = new Date(requestTime + delayMs);
          const currentTime = new Date();

          setIsCountdownComplete(currentTime >= targetTime);
        }
      } catch (error) {
        console.error("Error fetching lock:", error);
        toast.error("Failed to load lock data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLock();

    // Reset the title when component unmounts
    return () => {
      document.title = "LaterLock - Time-Delayed Access";
    };
  }, [id]);

  const handleRequestAccess = async () => {
    try {
      setRequestingAccess(true);

      // Make sure id is available
      if (!id) {
        toast.error("Invalid lock ID");
        return;
      }

      const response = await fetch(`/api/locks/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "request_access" }),
      });

      if (!response.ok) {
        throw new Error("Failed to request unlock");
      }

      // Refresh lock data
      const updatedLockResponse = await fetch(`/api/locks/${encodeURIComponent(id)}`);
      const updatedLock = await updatedLockResponse.json();
      setLock(updatedLock);

      // toast.success("Access request initiated");
    } catch (error) {
      console.error("Error requesting unlock:", error);
      toast.error("Failed to request unlock");
    } finally {
      setRequestingAccess(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      setCancelingRequest(true);

      // Make sure id is available
      if (!id) {
        toast.error("Invalid lock ID");
        return;
      }

      const response = await fetch(`/api/locks/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "cancel_request" }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel request");
      }

      // Refresh lock data
      const updatedLockResponse = await fetch(`/api/locks/${encodeURIComponent(id)}`);
      const updatedLock = await updatedLockResponse.json();
      setLock(updatedLock);

      // toast.success("Access request canceled");
    } catch (error) {
      console.error("Error canceling unlock:", error);
      toast.error("Failed to cancel unlock");
    } finally {
      setCancelingRequest(false);
    }
  };

  const handleReLock = async () => {
    try {
      // Make sure id is available
      if (!id) {
        toast.error("Invalid lock ID");
        return;
      }

      const response = await fetch(`/api/locks/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "re_lock" }),
      });

      if (!response.ok) {
        throw new Error("Failed to lock");
      }

      // Refresh lock data
      const updatedLockResponse = await fetch(`/api/locks/${encodeURIComponent(id)}`);
      const updatedLock = await updatedLockResponse.json();
      setLock(updatedLock);

      // Reset countdown state
      setIsCountdownComplete(false);

      // Hide content if it was showing
      setShowContent(false);
      setDecryptedContent("");

      // toast.success("Locked");
    } catch (error) {
      console.error("Error locking:", error);
      toast.error("Failed to lock");
    }
  };

  const handleFetchContent = async () => {
    try {
      setFetchingContent(true);

      // Make sure id is available
      if (!id) {
        toast.error("Invalid lock ID");
        return;
      }

      const response = await fetch(`/api/locks/${encodeURIComponent(id)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "view_content" }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle the specific case where the timer hasn't elapsed yet
        if (response.status === 403 && errorData.error === "Wait time not elapsed") {
          const remainingSeconds = errorData.remainingSeconds || 0;

          toast.error(`Timer enforcement: ${Math.ceil(remainingSeconds / 60)} minutes remaining`);

          // Refresh the lock to sync client state with server
          const updatedLockResponse = await fetch(`/api/locks/${encodeURIComponent(id)}`);
          const updatedLock = await updatedLockResponse.json();
          setLock(updatedLock);

          return;
        }

        throw new Error(errorData.error || "Failed to fetch content");
      }

      const contentData = await response.json();
      setLockContent(contentData);

      if (contentData.isEncrypted) {
        setIsPasswordDialogOpen(true);
      } else {
        setDecryptedContent(contentData.content);
        setShowContent(true);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch content");
    } finally {
      setFetchingContent(false);
    }
  };

  const handleDecrypt = async () => {
    if (!lockContent) return;

    try {
      setDecryptionError("");

      if (!password) {
        setDecryptionError("Password is required");
        return;
      }

      const result = await decryptWithPassword(
        lockContent.content,
        password,
        lockContent.salt!
      );

      if (result.success && result.data) {
        setDecryptedContent(result.data);
        setShowContent(true);
        setIsPasswordDialogOpen(false);
      } else {
        setDecryptionError(result.error || "Decryption failed");
      }
    } catch (error) {
      console.error("Decryption error:", error);
      setDecryptionError("An unexpected error occurred");
    }
  };

  const handleDeleteLock = async () => {
    try {
      setIsDeleting(true);

      // Make sure id is available
      if (!id) {
        toast.error("Invalid lock ID");
        return;
      }

      const response = await fetch(`/api/locks/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete lock");
      }

      // toast.success("Lock deleted successfully");

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Error deleting lock:", error);
      toast.error("Failed to delete lock");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(decryptedContent);
      toast.success("Copied to clipboard");
    } catch (error) {
      console.error("Failed to copy: ", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!lock) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md w-full p-6 bg-background rounded-md">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Lock Not Found</h2>
            <p className="text-sm text-gray-500">
              This lock doesn&apos;t exist.
            </p>
          </div>
          <div className="mt-4">
            <Button onClick={() => router.push("/")} className="w-full">
              Return Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8 mx-auto">
      <LockPageHeader />

      <main className="flex flex-col items-center py-8 px-4 md:px-8">
        <div className="max-w-xl w-full">
          <div className="mb-8 p-6 bg-background rounded-md">
            <LockInfo
              title={lock.title}
              isCountdownComplete={isCountdownComplete}
              isCountdownActive={isCountdownActive}
              isEncrypted={lock.isEncrypted}
            />

            <div className="mb-6">
              {showContent ? (
                <LockContent
                  content={decryptedContent}
                  onHide={() => setShowContent(false)}
                  onLock={handleReLock}
                  onCopy={handleCopyToClipboard}
                  isCountdownComplete={isCountdownComplete}
                />
              ) : lock.accessRequestedAt ? (
                <LockCountdown
                  countdownDate={countdownDate}
                  onComplete={() => setIsCountdownComplete(true)}
                  onCancelRequest={handleCancelRequest}
                  onFetchContent={handleFetchContent}
                  onReLock={handleReLock}
                  isCountdownComplete={isCountdownComplete}
                  cancelingRequest={cancelingRequest}
                  fetchingContent={fetchingContent}
                />
              ) : (
                <UnlockButton
                  delayMinutes={lock.delayMinutes}
                  onRequestAccess={handleRequestAccess}
                  isLoading={requestingAccess}
                />
              )}
            </div>

            <div className="pt-4 flex flex-row gap-2 items-center">
              <p className="text-xs text-muted-foreground w-full">
                Created: {new Date(lock.createdAt).toLocaleString()}
              </p>
              <Button
                variant="ghost"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                Delete
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground text-center">
              Make sure to bookmark this URL.
            </p>
          </div>
        </div>

        <PasswordDialog
          isOpen={isPasswordDialogOpen}
          onOpenChange={setIsPasswordDialogOpen}
          password={password}
          onPasswordChange={setPassword}
          onDecrypt={handleDecrypt}
          error={decryptionError}
        />

        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onDelete={handleDeleteLock}
          isDeleting={isDeleting}
        />
      </main>
    </div>
  );
} 