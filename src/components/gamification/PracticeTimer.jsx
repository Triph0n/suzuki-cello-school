import { useEffect, useState } from "react";
import { Play, Square } from "lucide-react";

const format = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
};

const elapsedSince = (startedAt) =>
  startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0;

export default function PracticeTimer({ startedAt, targetMin, onStart, onStop }) {
  const running = startedAt !== null;
  const [seconds, setSeconds] = useState(() => elapsedSince(startedAt));

  // Tick from the wall-clock anchor so the count survives throttled tabs.
  // Ticking lives here so the whole panel doesn't re-render every second;
  // the parent remounts this component per session (key={startedAt}).
  useEffect(() => {
    if (!startedAt) return;
    const tick = setInterval(() => setSeconds(elapsedSince(startedAt)), 1000);
    return () => clearInterval(tick);
  }, [startedAt]);

  const progress = Math.min(seconds / (targetMin * 60), 1);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={running ? onStop : onStart}
        className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center shadow-md transition-transform hover:scale-105 cursor-pointer border-4 ${
          running
            ? "bg-primary text-on-primary border-primary-container animate-pulse"
            : "bg-secondary-container text-on-secondary-container border-outline-variant/30"
        }`}
        title={running ? "Finish practice" : "Start practice"}
      >
        {running ? (
          <>
            <span className="font-headline text-2xl font-bold tabular-nums">
              {format(seconds)}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider mt-1">
              <Square size={12} fill="currentColor" /> Done!
            </span>
          </>
        ) : (
          <>
            <Play size={36} className="ml-1" fill="currentColor" />
            <span className="text-xs font-bold uppercase tracking-wider mt-1">Practice</span>
          </>
        )}
      </button>
      <div className="w-28 h-2 bg-surface-variant rounded-full overflow-hidden">
        <div
          className="h-full bg-tertiary rounded-full transition-all duration-1000"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="text-xs text-on-surface-variant font-medium">
        Goal: {targetMin} min
      </span>
    </div>
  );
}
