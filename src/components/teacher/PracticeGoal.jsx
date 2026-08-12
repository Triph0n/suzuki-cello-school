import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import {
  getGamifyState,
  setDailyTarget,
  TARGET_PRESETS
} from "../../gamification";

// The daily practice goal is set here, by the teacher (or parent) — the
// child's own screen only shows the goal, it can't change it. Mounted with
// key={studentId} like MusicianAwarder, so initial state matches the student.
export default function PracticeGoal({ studentId }) {
  const [target, setTarget] = useState(
    () => getGamifyState(studentId).dailyTargetMin
  );

  useEffect(() => {
    const refresh = () => setTarget(getGamifyState(studentId).dailyTargetMin);
    window.addEventListener("gamify_updated", refresh);
    return () => window.removeEventListener("gamify_updated", refresh);
  }, [studentId]);

  return (
    <div className="mt-8">
      <h2 className="font-headline text-2xl font-bold text-on-background mb-6">
        Daily Practice Goal
      </h2>
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 shadow-sm">
        <p className="text-sm text-on-surface-variant font-medium mb-4">
          The day earns its pearl at 75&nbsp;% of this goal. Ages 6–7 usually
          take 10–15 min, ages 8–9 take 15–20 min.
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <Timer size={18} className="text-primary shrink-0" aria-hidden="true" />
          {TARGET_PRESETS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => setDailyTarget(studentId, minutes)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-opacity hover:opacity-90 ${
                target === minutes
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container border border-outline-variant/50 text-on-surface-variant"
              }`}
            >
              {minutes} min
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
