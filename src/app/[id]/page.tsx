"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { decryptWithPassword } from "@/app/actions/client-crypto-actions";
import Countdown from "react-countdown";
import React from "react";

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
      console.log(`access requested timestamp: ${requestTime}`);

      // Add delay in milliseconds
      const delayMs = parseInt(String(lock.delayMinutes), 10) * 60000;
      const targetTime = new Date(requestTime + delayMs);

      return targetTime;
    })()
    : null;

  console.log(`requested at: ${lock?.accessRequestedAt}`);
  console.log(`countdown date: ${countdownDate}`);
  console.log(`delay minutes: ${lock?.delayMinutes}`);

  // Check if countdown has completed and update state
  useEffect(() => {
    if (countdownDate) {
      const currentTime = new Date();
      setIsCountdownComplete(currentTime >= countdownDate);
    }
  }, [countdownDate, lock]);

  const isCountdownActive = !isCountdownComplete && lock?.accessRequestedAt;

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

  const countdownRenderer = ({
    hours,
    minutes,
    seconds,
    completed,
  }: {
    hours: number;
    minutes: number;
    seconds: number;
    completed: boolean;
  }) => {
    // Calculate days and remaining hours
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (completed) {
      return (
        <div className="text-center flex flex-col gap-2">
          <Button
            onClick={handleFetchContent}
            disabled={fetchingContent}
            className="w-full"
          >
            {fetchingContent ? "Loading..." : "Show"}
          </Button>
          <Button
            variant="outline"
            onClick={handleReLock}
            className="w-full"
          >
            Lock
          </Button>
        </div>
      );
    }

    return (
      <div className="text-center">
        <p className="mb-2">Time remaining</p>
        <p className="text-8xl font-bold">
          {days > 0 ? `${days}d ` : ''}
          {remainingHours.toString().padStart(2, "0")}:
          {minutes.toString().padStart(2, "0")}:
          {seconds.toString().padStart(2, "0")}
        </p>
        <Button
          variant="outline"
          className="w-full font-semibold text-2xl py-8 mt-4"
          onClick={handleCancelRequest}
          disabled={cancelingRequest}
        >
          {cancelingRequest ? "Canceling..." : "Cancel"}
        </Button>
      </div>
    );
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
      <div className="mb-6 text-center">
        <Link href="/">
          <h1 className="text-4xl lg:text-6xl font-extrabold text-primary hover:opacity-80 transition-opacity">⏱LaterLock</h1>
        </Link>
      </div>

      <main className="flex flex-col items-center py-8 px-4 md:px-8">
        <div className="max-w-xl w-full">
          <div className="mb-8 p-6 bg-background rounded-md">
            <div className="mb-6">
              <div className="items-center">
                <h2 className="text-2xl font-semibold text-center">
                  {lock.title}
                </h2>
                <p className="text-center text-muted-foreground mt-1">
                  {isCountdownComplete ? "Unlocked" : isCountdownActive ? "Unlocking" : lock.isEncrypted ? "Locked & Encrypted" : "Locked"}
                </p>
              </div>
            </div>

            <div className="mb-6">
              {showContent ? (
                <div className="space-y-4">
                  <div className="p-4 bg-background">
                    <pre className="whitespace-pre-wrap break-words">
                      {decryptedContent}
                    </pre>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setShowContent(false)}
                      className="w-full"
                    >
                      Hide
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReLock}
                      className="w-full"
                    >
                      Lock
                    </Button>
                  </div>
                </div>
              ) : lock.accessRequestedAt ? (
                <Countdown
                  date={countdownDate}
                  renderer={countdownRenderer}
                  onComplete={() => {
                    setIsCountdownComplete(true);
                  }}
                />
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-background text-center">
                    <p className="mb-2 text-xl">Lock delay is {formatMinutes(lock.delayMinutes)}</p>
                  </div>
                  <Button
                    onClick={handleRequestAccess}
                    disabled={requestingAccess}
                    className="w-full font-semibold text-2xl py-8"
                  >
                    {requestingAccess ? "Starting..." : "Start Unlock"}
                  </Button>
                </div>
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

        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Password</DialogTitle>
              <DialogDescription>
                This content is encrypted. Enter the password to decrypt it.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleDecrypt();
            }}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter the password"
                    autoFocus
                  />
                  {decryptionError && (
                    <p className="text-sm text-red-500">{decryptionError}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Decrypt</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Lock</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this lock? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteLock}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else if (minutes < 1440) {
    const hours = minutes / 60;
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else {
    const days = minutes / 1440;
    return `${days} day${days !== 1 ? "s" : ""}`;
  }
} 