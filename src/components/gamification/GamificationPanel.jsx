import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getGamifyState,
  getStreak,
  getWeek,
  getCellinoMood,
  isGoldenWeek,
  finishSession,
  openChest,
  canClaimMemoryPlay,
  logMemoryPlay
} from "../../gamification";
import { FEATURES } from "../../features";
import CellinoWidget from "./CellinoWidget";
import PracticeTimer from "./PracticeTimer";
import ChestCard from "./ChestCard";
import BalanceWeek from "./BalanceWeek";
import BandWorkshop from "./BandWorkshop";
import EnsembleSection from "./EnsembleSection";
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

  // The running session is mirrored in a ref because starting and stopping
  // write to localStorage and record the session. A state updater must stay
  // pure — React may call it more than once for a single update (StrictMode
  // does exactly that in development), which would bank the same practice
  // twice. The ref is what actually guards the transition.
  const startedAtRef = useRef(startedAt);
  useEffect(() => {
    startedAtRef.current = startedAt;
  }, [startedAt]);

  const start = useCallback(() => {
    if (startedAtRef.current) return;
    const now = Date.now();
    startedAtRef.current = now;
    try {
      localStorage.setItem(activeSessionKey(studentId), String(now));
    } catch {
      // Persisting is best-effort; the timer still runs in memory.
    }
    setStartedAt(now);
  }, [studentId]);

  const stop = useCallback(() => {
    const current = startedAtRef.current;
    if (!current) return;
    startedAtRef.current = null;
    localStorage.removeItem(activeSessionKey(studentId));
    const elapsed = Math.floor((Date.now() - current) / 1000);
    setStartedAt(null);
    setResult(finishSession(studentId, elapsed));
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

  const handleOpenChest = useCallback(() => {
    const outcome = openChest(studentId);
    if (outcome.ok) setResult(outcome.reward);
  }, [studentId]);

  // Claimed by the child on the celebration screen, right after the session it
  // belongs to — never as a button standing around on the main screen waiting
  // to be pressed.
  const handleClaimMemory = useCallback(() => {
    const outcome = logMemoryPlay(studentId);
    if (outcome.ok) setResult((current) => ({ ...current, memoryClaimed: true }));
  }, [studentId]);

  const canClaimMemory =
    result &&
    !result.chestOnly &&
    !result.tooShort &&
    !result.memoryClaimed &&
    canClaimMemoryPlay(state);

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
    // Two things and nothing else: the cello asking to be played, and the week
    // filling up. Everything the child could tap is on this one card.
    <div className="flex flex-col gap-6">
      <div className="club-leather rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <CellinoWidget mood={running ? "cheering" : derived.mood} streak={derived.streak} />
        <PracticeTimer
          key={startedAt ?? "idle"}
          startedAt={startedAt}
          targetMin={state.dailyTargetMin}
          onStart={start}
          onStop={stop}
        />
      </div>

      {/* The chest card is the reward arriving, so it stays; its "what you are
          playing for today" face belongs to the collection screen. */}
      <ChestCard
        state={state}
        onOpenChest={handleOpenChest}
        revealOnly={!FEATURES.collectionScreen}
      />

      <BalanceWeek
        week={derived.week}
        targetMin={state.dailyTargetMin}
        goldenWeek={derived.goldenWeek}
      />

      {FEATURES.ensembleHall && (
        <EnsembleSection studentId={studentId} state={state} onPracticeStart={start} />
      )}
      {FEATURES.collectionScreen && <BandWorkshop studentId={studentId} state={state} />}

      {result && (
        <RewardModal
          result={result}
          onClose={() => setResult(null)}
          onClaimMemory={canClaimMemory ? handleClaimMemory : undefined}
        />
      )}
    </div>
  );
}
