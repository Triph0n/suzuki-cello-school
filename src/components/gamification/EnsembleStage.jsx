import { useEffect, useMemo, useRef, useState } from "react";
import {
  Armchair,
  Lock,
  Play,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import { premiere } from "../../gamification";
import { createStemPlayer, stemUrl } from "../../audio/stemPlayer";
import { stickerSrc } from "./assets";

const CONFETTI_COLORS = [
  "var(--color-primary)",
  "var(--color-rosin)",
  "var(--color-lake)",
  "var(--color-madder)",
  "var(--color-secondary)",
  "var(--color-primary-fixed-dim)"
];

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 1.2,
      duration: 2.2 + Math.random() * 1.6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 7 + Math.random() * 8,
      spin: Math.random() > 0.5 ? 1 : -1
    }))
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="gami-confetti"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--spin": p.spin
          }}
        />
      ))}
    </div>
  );
}

function ChairCard({ chair, muted, showMute, onToggleMute, playing }) {
  return (
    <div
      className={`bg-surface-container-low border rounded-3xl p-4 w-40 flex flex-col items-center gap-2 shadow-sm ${
        chair.playerChair ? "border-primary/70" : "border-outline-variant/40"
      }`}
    >
      <div className="relative w-24 h-24 flex items-center justify-center">
        {chair.playerChair ? (
          <Armchair
            size={72}
            className={`text-primary ${playing ? "" : "gami-wiggle"}`}
            strokeWidth={1.5}
          />
        ) : (
          <img
            src={stickerSrc(chair.musician)}
            alt={chair.owned ? chair.musicianInfo?.name : "Empty chair"}
            className={`w-full h-full object-contain ${
              chair.owned ? (playing ? "gami-wiggle" : "") : "grayscale opacity-25"
            }`}
          />
        )}
        {!chair.owned && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock size={22} className="text-on-surface-variant" />
          </div>
        )}
      </div>

      <div className="text-center min-w-0 w-full">
        <p className="text-sm font-bold text-on-background truncate">
          {chair.playerChair
            ? "Your chair"
            : chair.owned
              ? chair.musicianInfo?.shortName
              : "Empty chair"}
        </p>
        <p className="text-xs text-on-surface-variant truncate">
          {chair.owned || chair.playerChair ? chair.label : "Ask your teacher"}
        </p>
      </div>

      {showMute && (
        <button
          type="button"
          onClick={onToggleMute}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
            muted
              ? "bg-surface-container-highest text-on-surface-variant"
              : "bg-secondary-container text-on-secondary-container"
          }`}
          title={muted ? "Unmute this part" : "Mute this part"}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          {muted ? "Muted" : "Playing"}
        </button>
      )}
      {!showMute && chair.playerChair && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary text-on-primary px-3 py-1.5 text-xs font-bold">
          You play live!
        </span>
      )}
    </div>
  );
}

function Segmented({ value, options, onChange, disabled }) {
  return (
    <div className="inline-flex rounded-full bg-surface-container border border-outline-variant/40 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors disabled:cursor-not-allowed ${
            value === option.value
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:text-on-background"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Fullscreen stage for one ensemble: mixer over real recorded stems, the
// player's own chair (play-along with count-in), rehearsals and the premiere.
export default function EnsembleStage({ studentId, progress, onClose, onPracticeStart }) {
  const [mode, setMode] = useState("listen");
  const [tempo, setTempo] = useState("practice");
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState({});
  const [celebrating, setCelebrating] = useState(false);

  const playerRef = useRef(null);
  const getPlayer = () => {
    if (!playerRef.current) playerRef.current = createStemPlayer();
    return playerRef.current;
  };
  useEffect(() => () => playerRef.current?.dispose(), []);

  // Chairs whose stem takes part in the current mode: play-along leaves the
  // player's chair silent — that part is played live by the child.
  const activeChairs = useMemo(
    () =>
      progress.chairs.filter(
        (chair) => chair.owned && !(mode === "playalong" && chair.playerChair)
      ),
    [progress.chairs, mode]
  );

  const stopPlayback = () => {
    playerRef.current?.stop();
    setPlaying(false);
  };

  const startPlayback = async ({ chairs, playTempo, countIn }) => {
    const player = getPlayer();
    const stems = chairs.map((chair) => ({
      id: chair.part,
      url: stemUrl(chair.stem, playTempo)
    }));
    setLoading(true);
    try {
      await player.load(stems);
    } finally {
      setLoading(false);
    }
    for (const chair of chairs) {
      player.setGain(chair.part, muted[chair.part] ? 0 : 1);
    }
    player.play({
      stems,
      bpm: progress.bpm[playTempo],
      countInBeats: countIn,
      onEnded: () => setPlaying(false)
    });
    setPlaying(true);
  };

  const handlePlay = async () => {
    if (playing) {
      stopPlayback();
      return;
    }
    await startPlayback({
      chairs: activeChairs,
      playTempo: tempo,
      countIn: mode === "playalong" ? 4 : 0
    });
    // Playing along is real practicing — make sure the practice timer runs.
    if (mode === "playalong") onPracticeStart?.();
  };

  const handleToggleMute = (part) => {
    const next = !muted[part];
    setMuted((current) => ({ ...current, [part]: next }));
    playerRef.current?.setGain(part, next ? 0 : 1);
  };

  const handleModeChange = (next) => {
    stopPlayback();
    setMode(next);
  };

  const handleTempoChange = (next) => {
    stopPlayback();
    setTempo(next);
  };

  const handlePremiere = async () => {
    const result = premiere(studentId, progress.key);
    if (!result.ok) return;
    setCelebrating(true);
    setMode("listen");
    setTempo("concert");
    await startPlayback({
      chairs: progress.chairs.filter((chair) => chair.owned),
      playTempo: "concert",
      countIn: 0
    });
  };

  const rehearsalDots = Array.from(
    { length: progress.rehearsalsNeeded },
    (_, i) => i < progress.rehearsals
  );
  const canPlay = activeChairs.length > 0 && !loading;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-scrim/80 backdrop-blur-md p-4 sm:p-6">
      {celebrating && <Confetti />}
      <div className="bg-background border border-outline-variant/30 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-full overflow-y-auto shadow-2xl relative z-10 gami-pop">
        <button
          type="button"
          onClick={() => {
            stopPlayback();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
          title="Leave the stage"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <p className="text-xs uppercase font-bold tracking-widest text-primary mb-2">
            {progress.venue} · Suzuki Book {progress.piece.book}
          </p>
          <h3 className="font-headline text-3xl font-bold text-on-background">
            {progress.name}
          </h3>
          <p className="text-on-surface-variant mt-1 font-medium">
            {celebrating ? "Premiere! 🎉" : progress.piece.title}
          </p>
        </div>

        <div className="bg-surface-container-low/60 border border-outline-variant/30 rounded-3xl p-5 mb-6 flex flex-wrap items-stretch justify-center gap-4">
          {progress.chairs.map((chair) => (
            <ChairCard
              key={chair.part}
              chair={chair}
              playing={playing}
              muted={Boolean(muted[chair.part])}
              showMute={chair.owned && !(mode === "playalong" && chair.playerChair)}
              onToggleMute={() => handleToggleMute(chair.part)}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Segmented
              value={mode}
              onChange={handleModeChange}
              options={[
                { value: "listen", label: "Listen" },
                { value: "playalong", label: "Play along" }
              ]}
            />
            <Segmented
              value={tempo}
              onChange={handleTempoChange}
              options={[
                { value: "practice", label: `Practice · ${progress.bpm.practice}` },
                { value: "concert", label: `Concert · ${progress.bpm.concert}` }
              ]}
            />
          </div>

          <button
            type="button"
            onClick={handlePlay}
            disabled={!canPlay}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-on-primary px-8 py-3 font-bold hover:opacity-90 disabled:cursor-not-allowed disabled:bg-surface-container-highest disabled:text-on-surface-variant transition-opacity"
          >
            {playing ? <Square size={20} /> : <Play size={20} />}
            {loading ? "Loading…" : playing ? "Stop" : mode === "playalong" ? "Count in & play" : "Play"}
          </button>

          <p className="text-xs text-on-surface-variant font-medium text-center">
            {mode === "playalong"
              ? "Four clicks count you in — then play your part with the ensemble!"
              : "Tap a chair's button to mute or unmute that part."}
          </p>

          <div className="flex items-center gap-3 bg-surface-container-low border border-outline-variant/30 rounded-2xl px-4 py-3">
            {progress.premieredAt ? (
              <p className="text-sm font-bold text-on-secondary-container inline-flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                Premiered — the stage is yours any time.
              </p>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  {rehearsalDots.map((done, i) => (
                    <span
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full ${
                        done ? "bg-primary" : "bg-surface-container-highest border border-outline-variant/50"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-bold text-on-surface-variant">
                  {progress.rehearsals}/{progress.rehearsalsNeeded} rehearsals
                  {!progress.complete && " · fill every chair first"}
                </p>
                {progress.canPremiere && (
                  <button
                    type="button"
                    onClick={handlePremiere}
                    className="inline-flex items-center gap-2 rounded-full bg-secondary text-on-secondary px-5 py-2 text-sm font-bold hover:opacity-90 transition-opacity"
                  >
                    <Sparkles size={16} />
                    Premiere!
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
