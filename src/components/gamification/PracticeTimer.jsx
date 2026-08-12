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
      {/* Idle it is the polished brass knob — the one thing on the screen meant
          to be pressed. Running it sinks into dark wood, so the lit state is the
          quiet one and the child is not staring at a glowing button. */}
      <button
        onClick={running ? onStop : onStart}
        className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
          running
            ? "club-leather text-primary-fixed-dim"
            : "club-brass"
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
      {/* the groove the brass slide runs in */}
      <div className="w-28 h-2 rounded-full overflow-hidden bg-surface-dim shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)]">
        <div
          className="h-full bg-primary rounded-full transition-all duration-1000"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span className="club-plate text-[11px]">Goal {targetMin} min</span>
    </div>
  );
}
