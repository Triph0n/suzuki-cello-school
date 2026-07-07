import { useCallback, useEffect, useRef, useState } from "react";
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
import StickerAlbum from "./StickerAlbum";
import RewardModal from "./RewardModal";

export default function GamificationPanel({ studentId, mediaActive }) {
  const [state, setState] = useState(() => getGamifyState(studentId));
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState(null);
  const startedAtRef = useRef(null);

  useEffect(() => {
    const refresh = () => setState(getGamifyState(studentId));
    refresh();
    window.addEventListener("gamify_updated", refresh);
    return () => window.removeEventListener("gamify_updated", refresh);
  }, [studentId]);

  // Tick from a wall-clock anchor so the count survives throttled tabs.
  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [running]);

  const start = useCallback(() => {
    setRunning((wasRunning) => {
      if (!wasRunning) {
        startedAtRef.current = Date.now();
        setSeconds(0);
      }
      return true;
    });
  }, []);

  const stop = useCallback(() => {
    if (!startedAtRef.current) return;
    setRunning(false);
    const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
    startedAtRef.current = null;
    setSeconds(0);
    setResult(finishSession(studentId, elapsed));
  }, [studentId]);

  // Opening any assigned lesson starts the practice timer automatically.
  useEffect(() => {
    if (mediaActive) start();
  }, [mediaActive, start]);

  return (
    <div className="flex flex-col gap-6 mb-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-surface-container-low/60 border border-outline-variant/30 rounded-3xl p-5 shadow-sm">
        <CellinoWidget mood={running ? "cheering" : getCellinoMood(state)} streak={getStreak(state)} />
        <PracticeTimer
          running={running}
          seconds={seconds}
          targetMin={state.dailyTargetMin}
          onStart={start}
          onStop={stop}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BalanceWeek
          week={getWeek(state)}
          targetMin={state.dailyTargetMin}
          goldenWeek={isGoldenWeek(state)}
          notes={state.notes}
          onChangeTarget={(minutes) => setDailyTarget(studentId, minutes)}
        />
        <StickerAlbum stickers={state.stickers} />
      </div>

      {result && <RewardModal result={result} onClose={() => setResult(null)} />}
    </div>
  );
}
