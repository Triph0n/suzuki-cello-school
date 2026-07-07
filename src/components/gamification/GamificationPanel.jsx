import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getGamifyState,
  getStreak,
  getWeek,
  getCellinoMood,
  isGoldenWeek,
  finishSession,
  setDailyTarget
} from "../../gamification";
import CellinoWidget from "./CellinoWidget";
import PracticeTimer from "./PracticeTimer";
import BalanceWeek from "./BalanceWeek";
import BandWorkshop from "./BandWorkshop";
import RewardModal from "./RewardModal";

const activeSessionKey = (studentId) => `gamify_active_${studentId}`;

// A restored session older than this is discarded — the tab was most likely
// just left open, not practiced in.
const MAX_RESTORED_SESSION_MS = 4 * 60 * 60 * 1000;

const readActiveSession = (studentId) => {
  try {
    const raw = localStorage.getItem(activeSessionKey(studentId));
    if (!raw) return null;
    const startedAt = Number(raw);
    if (!Number.isFinite(startedAt) || Date.now() - startedAt > MAX_RESTORED_SESSION_MS) {
      localStorage.removeItem(activeSessionKey(studentId));
      return null;
    }
    return startedAt;
  } catch {
    return null;
  }
};

export default function GamificationPanel({ studentId, mediaActive }) {
  const [state, setState] = useState(() => getGamifyState(studentId));
  // startedAt (ms) of the running practice session, or null. Persisted to
  // localStorage so a reload or accidental navigation doesn't lose the time.
  const [startedAt, setStartedAt] = useState(() => readActiveSession(studentId));
  const [result, setResult] = useState(null);

  // The panel is remounted per student (key={student.id} in StudentDashboard),
  // so initial state comes from the lazy useState initializers above; this
  // effect only subscribes to storage updates.
  useEffect(() => {
    const refresh = () => setState(getGamifyState(studentId));
    window.addEventListener("gamify_updated", refresh);
    return () => window.removeEventListener("gamify_updated", refresh);
  }, [studentId]);

  const start = useCallback(() => {
    setStartedAt((current) => {
      if (current) return current;
      const now = Date.now();
      try {
        localStorage.setItem(activeSessionKey(studentId), String(now));
      } catch {
        // Persisting is best-effort; the timer still runs in memory.
      }
      return now;
    });
  }, [studentId]);

  const stop = useCallback(() => {
    setStartedAt((current) => {
      if (!current) return null;
      localStorage.removeItem(activeSessionKey(studentId));
      const elapsed = Math.floor((Date.now() - current) / 1000);
      setResult(finishSession(studentId, elapsed));
      return null;
    });
  }, [studentId]);

  // Opening any assigned lesson starts the practice timer automatically;
  // closing the player finishes the session so no practice minutes are lost.
  const prevMediaActiveRef = useRef(mediaActive);
  useEffect(() => {
    if (mediaActive && !prevMediaActiveRef.current) start();
    else if (!mediaActive && prevMediaActiveRef.current) stop();
    prevMediaActiveRef.current = mediaActive;
  }, [mediaActive, start, stop]);

  const running = startedAt !== null;

  // Derived views over the whole session history — recompute only when the
  // stored state changes, not on every tick.
  const derived = useMemo(
    () => ({
      streak: getStreak(state),
      week: getWeek(state),
      goldenWeek: isGoldenWeek(state),
      mood: getCellinoMood(state)
    }),
    [state]
  );

  return (
    <div className="flex flex-col gap-6 mb-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-surface-container-low/60 border border-outline-variant/30 rounded-3xl p-5 shadow-sm">
        <CellinoWidget mood={running ? "cheering" : derived.mood} streak={derived.streak} />
        <PracticeTimer
          key={startedAt ?? "idle"}
          startedAt={startedAt}
          targetMin={state.dailyTargetMin}
          onStart={start}
          onStop={stop}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BalanceWeek
          week={derived.week}
          targetMin={state.dailyTargetMin}
          goldenWeek={derived.goldenWeek}
          notes={state.notes}
          onChangeTarget={(minutes) => setDailyTarget(studentId, minutes)}
        />
        <BandWorkshop studentId={studentId} state={state} />
      </div>

      {result && <RewardModal result={result} onClose={() => setResult(null)} />}
    </div>
  );
}
