"use client";

import { useEffect, use, useReducer } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { decryptWithPassword } from "@/app/actions/client-crypto-actions";
import React from "react";
import { Button } from "@/components/ui/button";
import { LockPageHeader } from "../../components/lock/LockPageHeader";
import { LockInfo } from "../../components/lock/LockInfo";
import { LockCountdown } from "../../components/lock/LockCountdown";
import { LockContent } from "../../components/lock/LockContent";
import { PasswordDialog } from "../../components/lock/PasswordDialog";
import { DeleteDialog } from "../../components/lock/DeleteDialog";
import { UnlockButton } from "../../components/lock/UnlockButton";

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

interface AppState {
  // Lock data
  lock: Lock | null;
  lockContent: LockContentType | null;
  decryptedContent: string;

  // UI state
  showContent: boolean;
  isCountdownComplete: boolean;

  // Dialog state
  isPasswordDialogOpen: boolean;
  isDeleteDialogOpen: boolean;

  // Loading states
  isLoading: boolean;
  requestingAccess: boolean;
  cancelingRequest: boolean;
  fetchingContent: boolean;
  isDeleting: boolean;

  // Error state
  decryptionError: string;

  // Password state
  password: string;
}

type AppAction =
  // Lock actions
  | { type: 'SET_LOCK'; payload: Lock | null }
  | { type: 'SET_LOCK_CONTENT'; payload: LockContentType | null }
  | { type: 'SET_DECRYPTED_CONTENT'; payload: string }

  // UI actions
  | { type: 'SHOW_CONTENT'; payload: boolean }
  | { type: 'SET_COUNTDOWN_COMPLETE'; payload: boolean }
  | { type: 'TOGGLE_PASSWORD_DIALOG'; payload: boolean }
  | { type: 'TOGGLE_DELETE_DIALOG'; payload: boolean }

  // Loading actions
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REQUESTING_ACCESS'; payload: boolean }
  | { type: 'SET_CANCELING_REQUEST'; payload: boolean }
  | { type: 'SET_FETCHING_CONTENT'; payload: boolean }
  | { type: 'SET_DELETING'; payload: boolean }

  // Error actions
  | { type: 'SET_DECRYPTION_ERROR'; payload: string }

  // Password actions
  | { type: 'SET_PASSWORD'; payload: string }

  // Combined actions
  | { type: 'RE_LOCK'; payload: Lock }
  | {
    type: 'FETCH_CONTENT_SUCCESS'; payload: {
      contentData: LockContentType;
      decryptedContent?: string;
      showPasswordDialog: boolean;
    }
  }
  | { type: 'DECRYPT_SUCCESS'; payload: string };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    // Lock actions
    case 'SET_LOCK':
      return { ...state, lock: action.payload, isCountdownComplete: (!!action.payload?.accessRequestedAt && action.payload?.unlockTimeRemaining === 0) };
    case 'SET_LOCK_CONTENT':
      return { ...state, lockContent: action.payload };
    case 'SET_DECRYPTED_CONTENT':
      return { ...state, decryptedContent: action.payload };

    // UI actions
    case 'SHOW_CONTENT':
      return { ...state, showContent: action.payload };
    case 'SET_COUNTDOWN_COMPLETE':
      return { ...state, isCountdownComplete: action.payload };

    // Dialog actions
    case 'TOGGLE_PASSWORD_DIALOG':
      return { ...state, isPasswordDialogOpen: action.payload };
    case 'TOGGLE_DELETE_DIALOG':
      return { ...state, isDeleteDialogOpen: action.payload };

    // Loading actions
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_REQUESTING_ACCESS':
      return { ...state, requestingAccess: action.payload };
    case 'SET_CANCELING_REQUEST':
      return { ...state, cancelingRequest: action.payload };
    case 'SET_FETCHING_CONTENT':
      return { ...state, fetchingContent: action.payload };
    case 'SET_DELETING':
      return { ...state, isDeleting: action.payload, isDeleteDialogOpen: false };

    // Error actions
    case 'SET_DECRYPTION_ERROR':
      return { ...state, decryptionError: action.payload };

    // Password actions
    case 'SET_PASSWORD':
      return { ...state, password: action.payload };

    // Combined actions
    case 'RE_LOCK':
      return {
        ...state,
        lock: action.payload,
        showContent: false,
        isCountdownComplete: false,
        decryptedContent: ""
      };

    case 'FETCH_CONTENT_SUCCESS':
      return {
        ...state,
        lockContent: action.payload.contentData,
        isPasswordDialogOpen: action.payload.showPasswordDialog,
        decryptedContent: action.payload.decryptedContent || "",
        showContent: !action.payload.showPasswordDialog && !!action.payload.decryptedContent
      };

    case 'DECRYPT_SUCCESS':
      return {
        ...state,
        decryptedContent: action.payload,
        showContent: true,
        isPasswordDialogOpen: false,
        decryptionError: ""
      };

    default:
      return state;
  }
};

export default function LockPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();

  const [state, dispatch] = useReducer(appReducer, {
    // Lock state
    lock: null,
    lockContent: null,
    decryptedContent: "",

    // UI state
    showContent: false,
    isCountdownComplete: false,

    // Dialog state
    isPasswordDialogOpen: false,
    isDeleteDialogOpen: false,

    // Loading state
    isLoading: true,
    requestingAccess: false,
    cancelingRequest: false,
    fetchingContent: false,
    isDeleting: false,

    // Error state
    decryptionError: "",

    // Password state
    password: ""
  });

  const {
    lock, lockContent, decryptedContent,
    showContent, isCountdownComplete,
    isPasswordDialogOpen, isDeleteDialogOpen,
    isLoading, requestingAccess, cancelingRequest, fetchingContent, isDeleting,
    decryptionError, password
  } = state;

  const countdownDate = lock?.accessRequestedAt
    ? new Date(Date.now() + lock.unlockTimeRemaining!)
    : null;

  const isCountdownActive = !isCountdownComplete && !!lock?.accessRequestedAt;

  const id = params.id;

  // Initial load
  useEffect(() => {
    const fetchLock = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

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
        dispatch({ type: 'SET_LOCK', payload: data });

        // Set the page title if lock title exists
        if (data.title) {
          document.title = `${data.title} - LaterLock`;
        }
      } catch (error) {
        console.error("Error fetching lock:", error);
        toast.error("Failed to load lock data");
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
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
      dispatch({ type: 'SET_REQUESTING_ACCESS', payload: true });

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
      dispatch({ type: 'SET_LOCK', payload: updatedLock });

    } catch (error) {
      console.error("Error requesting unlock:", error);
      toast.error("Failed to request unlock");
    } finally {
      dispatch({ type: 'SET_REQUESTING_ACCESS', payload: false });
    }
  };

  const handleCancelRequest = async () => {
    try {
      dispatch({ type: 'SET_CANCELING_REQUEST', payload: true });

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
      dispatch({ type: 'SET_LOCK', payload: updatedLock });

    } catch (error) {
      console.error("Error canceling unlock:", error);
      toast.error("Failed to cancel unlock");
    } finally {
      dispatch({ type: 'SET_CANCELING_REQUEST', payload: false });
    }
  };

  const handleReLock = async () => {
    try {
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

      dispatch({ type: 'RE_LOCK', payload: updatedLock });

    } catch (error) {
      console.error("Error locking:", error);
      toast.error("Failed to lock");
    }
  };

  const handleFetchContent = async () => {
    try {
      dispatch({ type: 'SET_FETCHING_CONTENT', payload: true });

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

        // Handle the case where the timer hasn't elapsed yet
        if (response.status === 403 && errorData.error === "Wait time not elapsed") {
          const remainingSeconds = errorData.remainingSeconds || 0;

          toast.error(`${Math.ceil(remainingSeconds / 60)} minutes remaining`);

          const updatedLockResponse = await fetch(`/api/locks/${encodeURIComponent(id)}`);
          const updatedLock = await updatedLockResponse.json();
          dispatch({ type: 'SET_LOCK', payload: updatedLock });

          return;
        }

        throw new Error(errorData.error || "Failed to fetch content");
      }

      const contentData = await response.json();

      dispatch({
        type: 'FETCH_CONTENT_SUCCESS',
        payload: {
          contentData,
          decryptedContent: contentData.isEncrypted ? undefined : contentData.content,
          showPasswordDialog: contentData.isEncrypted
        }
      });
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch content");
    } finally {
      dispatch({ type: 'SET_FETCHING_CONTENT', payload: false });
    }
  };

  const handleDecrypt = async () => {
    if (!lockContent) return;

    try {
      if (!password) {
        dispatch({ type: 'SET_DECRYPTION_ERROR', payload: "Password is required" });
        return;
      }

      const result = await decryptWithPassword(
        lockContent.content,
        password,
        lockContent.salt!
      );

      if (result.success && result.data) {
        dispatch({ type: 'DECRYPT_SUCCESS', payload: result.data });
      } else {
        dispatch({ type: 'SET_DECRYPTION_ERROR', payload: result.error || "Decryption failed" });
      }
    } catch (error) {
      console.error("Decryption error:", error);
      dispatch({ type: 'SET_DECRYPTION_ERROR', payload: "An unexpected error occurred" });
    }
  };

  const handleDeleteLock = async () => {
    try {
      dispatch({ type: 'SET_DELETING', payload: true });

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

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Error deleting lock:", error);
      toast.error("Failed to delete lock");
    } finally {
      dispatch({ type: 'SET_DELETING', payload: false });
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
          onHide={() => dispatch({ type: 'SHOW_CONTENT', payload: false })}
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
            dispatch({ type: 'SET_COUNTDOWN_COMPLETE', payload: true });
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
                onClick={() => dispatch({ type: 'TOGGLE_DELETE_DIALOG', payload: true })}
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
          onOpenChange={(open) => dispatch({ type: 'TOGGLE_PASSWORD_DIALOG', payload: open })}
          password={password}
          onPasswordChange={(value) => dispatch({ type: 'SET_PASSWORD', payload: value })}
          onDecrypt={handleDecrypt}
          error={decryptionError}
        />

        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={(open) => dispatch({ type: 'TOGGLE_DELETE_DIALOG', payload: open })}
          onDelete={handleDeleteLock}
          isDeleting={isDeleting}
        />
      </main>
    </div>
  );
} 