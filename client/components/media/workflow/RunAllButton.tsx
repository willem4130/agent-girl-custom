
import { memo } from "react";

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const StopIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="1" />
  </svg>
);

interface RunAllButtonProps {
  onRunAll: () => void;
  onStopAll: () => void;
  isExecuting: boolean;
  executingCount?: number;
}

const RunAllButton = memo(function RunAllButton({
  onRunAll,
  onStopAll,
  isExecuting,
  executingCount = 0,
}: RunAllButtonProps) {
  if (isExecuting) {
    return (
      <div className="absolute bottom-4 left-4 z-10">
        <button
          onClick={onStopAll}
          className="btn-stop"
        >
          <StopIcon />
          <span>
            Stop{executingCount > 0 ? ` (${executingCount})` : " All"}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 z-10">
      <button
        onClick={onRunAll}
        className="btn-primary"
      >
        <PlayIcon />
        <span>Run All</span>
      </button>
    </div>
  );
});

export default RunAllButton;
