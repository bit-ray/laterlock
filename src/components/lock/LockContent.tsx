import { Button } from "@/components/ui/button";
import { ClipboardCopy } from "lucide-react";

interface LockContentProps {
  content: string;
  onHide: () => void;
  onLock: () => void;
  onCopy: () => void;
  isCountdownComplete: boolean;
}

export function LockContent({
  content,
  onHide,
  onLock,
  onCopy,
  isCountdownComplete
}: LockContentProps) {
  return (
    <div className="space-y-4">
      <div className="px-4 bg-background">
        <pre className="whitespace-pre-wrap break-words">
          {content}
        </pre>
      </div>

      <div className="flex justify-end">
        {isCountdownComplete && (
          <Button
            onClick={onCopy}
            variant="link"
            size="sm"
            className="text-xs text-muted-foreground cursor-pointer"
          >
            <ClipboardCopy className="h-3 w-3 mr-1" />
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          variant="secondary"
          onClick={onHide}
          className="w-full"
        >
          Hide
        </Button>
        <Button
          variant="outline"
          onClick={onLock}
          className="w-full"
        >
          Lock
        </Button>
      </div>
    </div>
  );
} 