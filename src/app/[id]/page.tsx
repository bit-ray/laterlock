"use client";

import { useEffect, useState, use, useReducer } from "react";
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
  unlockTimeRemaining: number | null;
}

interface LockContentType {
  content: string;
  isEncrypted: boolean;
  salt?: string;
}

// Define state interfaces
interface LockState {
  lock: Lock | null;
  lockContent: LockContentType | null;
  decryptedContent: string;
}

interface UIState {
  showContent: boolean;
  isCountdownComplete: boolean;
}

interface DialogState {
  isPasswordDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
}

interface LoadingState {
  isLoading: boolean;
  requestingAccess: boolean;
  cancelingRequest: boolean;
  fetchingContent: boolean;
  isDeleting: boolean;
}

interface ErrorState {
  decryptionError: string;
}

interface PasswordState {
  password: string;
}

// Define action types
type LockAction =
  | { type: 'SET_LOCK'; payload: Lock | null }
  | { type: 'SET_LOCK_CONTENT'; payload: LockContentType | null }
  | { type: 'SET_DECRYPTED_CONTENT'; payload: string };

type UIAction =
  | { type: 'SHOW_CONTENT'; payload: boolean }
  | { type: 'SET_COUNTDOWN_COMPLETE'; payload: boolean };

type DialogAction =
  | { type: 'TOGGLE_PASSWORD_DIALOG'; payload: boolean }
  | { type: 'TOGGLE_DELETE_DIALOG'; payload: boolean };

type LoadingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REQUESTING_ACCESS'; payload: boolean }
  | { type: 'SET_CANCELING_REQUEST'; payload: boolean }
  | { type: 'SET_FETCHING_CONTENT'; payload: boolean }
  | { type: 'SET_DELETING'; payload: boolean };

type ErrorAction =
  | { type: 'SET_DECRYPTION_ERROR'; payload: string };

type PasswordAction =
  | { type: 'SET_PASSWORD'; payload: string };

// Define reducers
const lockReducer = (state: LockState, action: LockAction): LockState => {
  switch (action.type) {
    case 'SET_LOCK':
      return { ...state, lock: action.payload };
    case 'SET_LOCK_CONTENT':
      return { ...state, lockContent: action.payload };
    case 'SET_DECRYPTED_CONTENT':
      return { ...state, decryptedContent: action.payload };
    default:
      return state;
  }
};

const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'SHOW_CONTENT':
      return { ...state, showContent: action.payload };
    case 'SET_COUNTDOWN_COMPLETE':
      console.log('SET_COUNTDOWN_COMPLETE', state.isCountdownComplete, action.payload);
      return { ...state, isCountdownComplete: action.payload };
    default:
      return state;
  }
};

const dialogReducer = (state: DialogState, action: DialogAction): DialogState => {
  switch (action.type) {
    case 'TOGGLE_PASSWORD_DIALOG':
      return { ...state, isPasswordDialogOpen: action.payload };
    case 'TOGGLE_DELETE_DIALOG':
      return { ...state, isDeleteDialogOpen: action.payload };
    default:
      return state;
  }
};

const loadingReducer = (state: LoadingState, action: LoadingAction): LoadingState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_REQUESTING_ACCESS':
      return { ...state, requestingAccess: action.payload };
    case 'SET_CANCELING_REQUEST':
      return { ...state, cancelingRequest: action.payload };
    case 'SET_FETCHING_CONTENT':
      return { ...state, fetchingContent: action.payload };
    case 'SET_DELETING':
      return { ...state, isDeleting: action.payload };
    default:
      return state;
  }
};

const errorReducer = (state: ErrorState, action: ErrorAction): ErrorState => {
  switch (action.type) {
    case 'SET_DECRYPTION_ERROR':
      return { ...state, decryptionError: action.payload };
    default:
      return state;
  }
};

const passwordReducer = (state: PasswordState, action: PasswordAction): PasswordState => {
  switch (action.type) {
    case 'SET_PASSWORD':
      return { ...state, password: action.payload };
    default:
      return state;
  }
};

export default function LockPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();

  const [lockState, dispatchLock] = useReducer(lockReducer, {
    lock: null,
    lockContent: null,
    decryptedContent: ""
  });

  const [uiState, dispatchUI] = useReducer(uiReducer, {
    showContent: false,
    isCountdownComplete: false
  });

  const [dialogState, dispatchDialog] = useReducer(dialogReducer, {
    isPasswordDialogOpen: false,
    isDeleteDialogOpen: false
  });

  const [loadingState, dispatchLoading] = useReducer(loadingReducer, {
    isLoading: true,
    requestingAccess: false,
    cancelingRequest: false,
    fetchingContent: false,
    isDeleting: false
  });

  const [errorState, dispatchError] = useReducer(errorReducer, {
    decryptionError: ""
  });

  const [passwordState, dispatchPassword] = useReducer(passwordReducer, {
    password: ""
  });

  const { lock, lockContent, decryptedContent } = lockState;
  const { showContent, isCountdownComplete } = uiState;
  const { isPasswordDialogOpen, isDeleteDialogOpen } = dialogState;
  const { isLoading, requestingAccess, cancelingRequest, fetchingContent, isDeleting } = loadingState;
  const { decryptionError } = errorState;
  const { password } = passwordState;

  // Calculate countdown target date based on accessRequestedAt and delayMinutes
  const countdownDate = lock?.accessRequestedAt
    ? (() => {

      return new Date(Date.now() + lock.unlockTimeRemaining!);

      // // Use the timestamp directly (already in milliseconds since epoch)
      // const requestTime = lock.accessRequestedAt;

      // // Add delay in milliseconds
      // const delayMs = parseInt(String(lock.delayMinutes), 10) * 60000;
      // const targetTime = new Date(requestTime + delayMs);

      // return targetTime;
    })()
    : null;

  const isCountdownActive = !isCountdownComplete && !!lock?.accessRequestedAt;

  // Get the ID from params
  const id = params.id;

  // Initial load
  useEffect(() => {
    const fetchLock = async () => {
      try {
        dispatchLoading({ type: 'SET_LOADING', payload: true });

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
        dispatchLock({ type: 'SET_LOCK', payload: data });

        // Set the page title if lock title exists
        if (data.title) {
          document.title = `${data.title} - LaterLock`;
        }

        // Check if countdown is complete on initial load
        if (data.accessRequestedAt) {
          dispatchUI({ type: 'SET_COUNTDOWN_COMPLETE', payload: data.unlockTimeRemaining === 0 });
        }
      } catch (error) {
        console.error("Error fetching lock:", error);
        toast.error("Failed to load lock data");
      } finally {
        dispatchLoading({ type: 'SET_LOADING', payload: false });
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
      dispatchLoading({ type: 'SET_REQUESTING_ACCESS', payload: true });

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
      dispatchLock({ type: 'SET_LOCK', payload: updatedLock });

      // toast.success("Access request initiated");
    } catch (error) {
      console.error("Error requesting unlock:", error);
      toast.error("Failed to request unlock");
    } finally {
      dispatchLoading({ type: 'SET_REQUESTING_ACCESS', payload: false });
    }
  };

  const handleCancelRequest = async () => {
    try {
      dispatchLoading({ type: 'SET_CANCELING_REQUEST', payload: true });

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
      dispatchLock({ type: 'SET_LOCK', payload: updatedLock });

      // toast.success("Access request canceled");
    } catch (error) {
      console.error("Error canceling unlock:", error);
      toast.error("Failed to cancel unlock");
    } finally {
      dispatchLoading({ type: 'SET_CANCELING_REQUEST', payload: false });
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
      dispatchLock({ type: 'SET_LOCK', payload: updatedLock });

      // Reset countdown state
      dispatchUI({ type: 'SET_COUNTDOWN_COMPLETE', payload: false });

      // Hide content if it was showing
      dispatchUI({ type: 'SHOW_CONTENT', payload: false });
      dispatchLock({ type: 'SET_DECRYPTED_CONTENT', payload: "" });

      // toast.success("Locked");
    } catch (error) {
      console.error("Error locking:", error);
      toast.error("Failed to lock");
    }
  };

  const handleFetchContent = async () => {
    try {
      dispatchLoading({ type: 'SET_FETCHING_CONTENT', payload: true });

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
          dispatchLock({ type: 'SET_LOCK', payload: updatedLock });

          return;
        }

        throw new Error(errorData.error || "Failed to fetch content");
      }

      const contentData = await response.json();
      dispatchLock({ type: 'SET_LOCK_CONTENT', payload: contentData });

      if (contentData.isEncrypted) {
        dispatchDialog({ type: 'TOGGLE_PASSWORD_DIALOG', payload: true });
      } else {
        dispatchLock({ type: 'SET_DECRYPTED_CONTENT', payload: contentData.content });
        dispatchUI({ type: 'SHOW_CONTENT', payload: true });
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch content");
    } finally {
      dispatchLoading({ type: 'SET_FETCHING_CONTENT', payload: false });
    }
  };

  const handleDecrypt = async () => {
    if (!lockContent) return;

    try {
      dispatchError({ type: 'SET_DECRYPTION_ERROR', payload: "" });

      if (!password) {
        dispatchError({ type: 'SET_DECRYPTION_ERROR', payload: "Password is required" });
        return;
      }

      const result = await decryptWithPassword(
        lockContent.content,
        password,
        lockContent.salt!
      );

      if (result.success && result.data) {
        dispatchLock({ type: 'SET_DECRYPTED_CONTENT', payload: result.data });
        dispatchUI({ type: 'SHOW_CONTENT', payload: true });
        dispatchDialog({ type: 'TOGGLE_PASSWORD_DIALOG', payload: false });
      } else {
        dispatchError({ type: 'SET_DECRYPTION_ERROR', payload: result.error || "Decryption failed" });
      }
    } catch (error) {
      console.error("Decryption error:", error);
      dispatchError({ type: 'SET_DECRYPTION_ERROR', payload: "An unexpected error occurred" });
    }
  };

  const handleDeleteLock = async () => {
    try {
      dispatchLoading({ type: 'SET_DELETING', payload: true });

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
      dispatchLoading({ type: 'SET_DELETING', payload: false });
      dispatchDialog({ type: 'TOGGLE_DELETE_DIALOG', payload: false });
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

  let inner;

  if (isCountdownComplete) {
    if (showContent) {
      inner = (
        <LockContent
          content={decryptedContent}
          onHide={() => dispatchUI({ type: 'SHOW_CONTENT', payload: false })}
          onLock={handleReLock}
          onCopy={handleCopyToClipboard}
          isCountdownComplete={isCountdownComplete}
        />
      );
    } else {
      inner = (
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
  } else if (isCountdownActive) {
    inner = (
      <LockCountdown
        countdownDate={countdownDate}
        onComplete={() => {
          // Only dispatch if not already complete
          if (!isCountdownComplete) {
            console.log('Setting countdown complete', isCountdownComplete);
            dispatchUI({ type: 'SET_COUNTDOWN_COMPLETE', payload: true });
          }
        }}
        onCancelRequest={handleCancelRequest}
        onFetchContent={handleFetchContent}
        onReLock={handleReLock}
        isCountdownComplete={isCountdownComplete}
        cancelingRequest={cancelingRequest}
        fetchingContent={fetchingContent}
      />
    );
  } else {
    inner = (
      <UnlockButton
        delayMinutes={lock.delayMinutes}
        onRequestAccess={handleRequestAccess}
        isLoading={requestingAccess}
      />
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
              {inner}
            </div>

            <div className="pt-4 flex flex-row gap-2 items-center">
              <p className="text-xs text-muted-foreground w-full">
                Created: {new Date(lock.createdAt).toLocaleString()}
              </p>
              <Button
                variant="ghost"
                onClick={() => dispatchDialog({ type: 'TOGGLE_DELETE_DIALOG', payload: true })}
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
          onOpenChange={(open) => dispatchDialog({ type: 'TOGGLE_PASSWORD_DIALOG', payload: open })}
          password={password}
          onPasswordChange={(value) => dispatchPassword({ type: 'SET_PASSWORD', payload: value })}
          onDecrypt={handleDecrypt}
          error={decryptionError}
        />

        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={(open) => dispatchDialog({ type: 'TOGGLE_DELETE_DIALOG', payload: open })}
          onDelete={handleDeleteLock}
          isDeleting={isDeleting}
        />
      </main>
    </div>
  );
} 