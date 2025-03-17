import { Button } from "@/components/ui/button";
import { formatMinutes } from "@/utils/formatters";

interface UnlockButtonProps {
  delayMinutes: number;
  onRequestAccess: () => void;
  isLoading: boolean;
}

export function UnlockButton({
  delayMinutes,
  onRequestAccess,
  isLoading
}: UnlockButtonProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-background text-center">
        <p className="mb-2 text-xl">Unlock delay is {formatMinutes(delayMinutes)}</p>
      </div>
      <Button
        onClick={onRequestAccess}
        disabled={isLoading}
        className="w-full font-semibold text-xl py-4 sm:text-2xl sm:py-8 mt-4"
      >
        {isLoading ? "Starting..." : "Start Unlock"}
      </Button>
    </div>
  );
} 