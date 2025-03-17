interface LockInfoProps {
  title?: string;
  isCountdownComplete: boolean;
  isCountdownActive: boolean;
  isEncrypted: boolean;
}

export function LockInfo({
  title,
  isCountdownComplete,
  isCountdownActive,
  isEncrypted
}: LockInfoProps) {
  return (
    <div className="mb-6">
      <div className="items-center">
        <h2 className="text-2xl font-semibold text-center">
          {title}
        </h2>
        <p className="text-center text-muted-foreground mt-1">
          {isCountdownComplete
            ? "Unlocked"
            : isCountdownActive
              ? "Unlocking"
              : isEncrypted
                ? "Locked & Encrypted"
                : "Locked"}
        </p>
      </div>
    </div>
  );
} 