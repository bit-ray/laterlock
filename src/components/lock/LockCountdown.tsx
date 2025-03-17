import Countdown from "react-countdown";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

interface LockCountdownProps {
  countdownDate: Date | null;
  onComplete: () => void;
  onCancelRequest: () => void;
  onFetchContent: () => void;
  onReLock: () => void;
  cancelingRequest: boolean;
  fetchingContent: boolean;
}

export function LockCountdown({
  countdownDate,
  onComplete,
  onCancelRequest,
  onFetchContent,
  onReLock,
  cancelingRequest,
  fetchingContent
}: LockCountdownProps) {
  const countdownRenderer = ({
    days,
    hours,
    minutes,
    seconds,
    completed,
  }: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    completed: boolean;
  }) => {
    if (completed) {
      return (
        <div className="text-center flex flex-col gap-2">
          <Button
            onClick={onFetchContent}
            disabled={fetchingContent}
            className="w-full"
          >
            {fetchingContent ? "Loading..." : "Show"}
          </Button>
          <Button
            variant="outline"
            onClick={onReLock}
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
        <p className={clsx(
          "font-bold ",
          days > 0 ? "text-7xl" : "text-6xl sm:text-8xl "
        )}>
          {days > 0 ? `${days}d ` : ''}
          {hours.toString().padStart(2, "0")}:
          {minutes.toString().padStart(2, "0")}:
          {seconds.toString().padStart(2, "0")}
        </p>
        <Button
          variant="outline"
          className="w-full font-semibold text-xl py-4 sm:text-2xl sm:py-8 mt-4"
          onClick={onCancelRequest}
          disabled={cancelingRequest}
        >
          {cancelingRequest ? "Canceling..." : "Cancel"}
        </Button>
      </div>
    );
  };

  if (!countdownDate) {
    return null;
  }

  return (
    <Countdown
      date={countdownDate}
      renderer={countdownRenderer}
      onComplete={onComplete}
      controlled={false}
      precision={3}
      daysInHours={false}
      zeroPadTime={2}
      overtime={false}
      now={() => Date.now()}
    />
  );
} 