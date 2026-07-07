import { useState } from "react";
import { Check, Lock, Music2, Volume2, X } from "lucide-react";
import { equipMusician, getBandSummaries } from "../../gamification";
import { stickerSrc } from "./assets";

const RARITY_STYLE = {
  common: "border-outline-variant/40",
  rare: "border-rosin/70",
  legendary: "border-primary/80"
};

function MusicianSlot({ studentId, musician, notes }) {
  const collected = musician.collected;
  const equipped = musician.equipped;
  const canEquip = collected && !equipped && notes >= musician.instrumentCost;
  const needsNotes = Math.max(0, musician.instrumentCost - notes);

  return (
    <div className={`bg-surface-container-low border rounded-2xl p-3 min-h-[182px] flex flex-col gap-2 ${RARITY_STYLE[musician.rarity]}`}>
      <div className="relative aspect-square bg-surface-container rounded-xl flex items-center justify-center overflow-hidden">
        <img
          src={stickerSrc(musician.key)}
          alt={collected ? musician.name : "Locked musician"}
          className={`w-full h-full object-contain ${collected ? "" : "grayscale opacity-20"}`}
        />
        {!collected && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container/50">
            <Lock size={24} className="text-on-surface-variant" />
          </div>
        )}
        {equipped && (
          <div className="absolute top-2 right-2 bg-secondary text-on-secondary rounded-full p-1 shadow-sm">
            <Check size={14} />
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-bold text-on-background truncate">
          {musician.shortName}
        </p>
        <p className="text-xs text-on-surface-variant truncate">
          {collected ? musician.instrument : "Keep practicing"}
        </p>
      </div>

      {collected && !equipped && (
        <button
          type="button"
          onClick={() => equipMusician(studentId, musician.key)}
          disabled={!canEquip}
          className="mt-auto w-full rounded-xl bg-primary text-on-primary px-3 py-2 text-xs font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-surface-container-highest disabled:text-on-surface-variant"
          title={canEquip ? `Equip ${musician.instrument}` : `Needs ${needsNotes} more notes`}
        >
          Equip · {musician.instrumentCost}
        </button>
      )}

      {equipped && (
        <div className="mt-auto flex items-center justify-center gap-1 rounded-xl bg-secondary-container px-3 py-2 text-xs font-bold text-on-secondary-container">
          <Music2 size={14} />
          Ready
        </div>
      )}
    </div>
  );
}

function playBandMotif(motif) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const gain = context.createGain();
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.connect(context.destination);

  const noteLength = 0.18;
  motif.forEach((frequency, index) => {
    const start = context.currentTime + index * noteLength;
    const oscillator = context.createOscillator();
    oscillator.type = index % 2 === 0 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.connect(gain);

    gain.gain.linearRampToValueAtTime(0.09, start + 0.02);
    gain.gain.linearRampToValueAtTime(0.0001, start + noteLength);
    oscillator.start(start);
    oscillator.stop(start + noteLength + 0.03);
  });

  const closeAfter = motif.length * noteLength + 0.4;
  window.setTimeout(() => context.close(), closeAfter * 1000);
}

function ConcertOverlay({ band, onClose }) {
  if (!band) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
      <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl relative gami-pop">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors"
          title="Close concert"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <p className="text-xs uppercase font-bold tracking-widest text-primary mb-2">
            Concert unlocked
          </p>
          <h3 className="font-headline text-3xl font-bold text-on-background">
            {band.name}
          </h3>
          <p className="text-on-surface-variant mt-2">
            Every player is equipped. The band can play its song.
          </p>
        </div>

        <div className="bg-surface-container border border-outline-variant/30 rounded-3xl p-5 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 items-end">
            {band.members.map((musician, index) => (
              <div key={musician.key} className="text-center">
                <div
                  className="bg-surface-container-low rounded-2xl p-2 aspect-square flex items-center justify-center shadow-sm"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  <img
                    src={stickerSrc(musician.key)}
                    alt={musician.name}
                    className="w-full h-full object-contain gami-wiggle"
                  />
                </div>
                <p className="text-xs font-bold text-on-background mt-2 truncate">
                  {musician.shortName}
                </p>
                <p className="text-[11px] text-on-surface-variant truncate">
                  {musician.instrument}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => playBandMotif(band.motif)}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-on-primary px-6 py-3 font-bold hover:opacity-90 transition-opacity"
          >
            <Volume2 size={20} />
            Play again
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BandWorkshop({ studentId, state }) {
  const [concertBand, setConcertBand] = useState(null);
  const bands = getBandSummaries(state);

  const handlePlayBand = (band) => {
    if (!band.complete) return;
    setConcertBand(band);
    playBandMotif(band.motif);
  };

  return (
    <section className="lg:col-span-2">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <h3 className="font-headline text-2xl font-bold text-on-background">
            Band Workshop
          </h3>
          <p className="text-sm text-on-surface-variant font-medium">
            Collect players, equip instruments, and prepare each band.
          </p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl px-4 py-3 text-right shadow-sm">
          <p className="text-xs uppercase font-bold text-on-surface-variant tracking-widest">
            Notes
          </p>
          <p className="font-headline text-2xl font-bold text-primary">
            {state.notes || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {bands.map((band) => (
          <article
            key={band.key}
            className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase font-bold tracking-widest text-primary mb-1">
                  {band.sizeLabel}
                </p>
                <h4 className="font-headline text-xl font-bold text-on-background">
                  {band.name}
                </h4>
                <p className="text-sm text-on-surface-variant mt-1">
                  {band.rehearsalHint}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-headline text-2xl font-bold text-primary">
                  {band.readyCount}/{band.members.length}
                </p>
                <p className="text-xs font-bold text-on-surface-variant">
                  ready
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {band.members.map((musician) => (
                <MusicianSlot
                  key={musician.key}
                  studentId={studentId}
                  musician={musician}
                  notes={state.notes || 0}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-on-surface-variant">
                {band.complete
                  ? "All instruments are ready."
                  : `${band.members.length - band.readyCount} more player${band.members.length - band.readyCount === 1 ? "" : "s"} to prepare.`}
              </p>
              <button
                type="button"
                onClick={() => handlePlayBand(band)}
                disabled={!band.complete}
                className="inline-flex items-center gap-2 rounded-full bg-primary text-on-primary px-4 py-2 text-sm font-bold hover:opacity-90 disabled:cursor-not-allowed disabled:bg-surface-container-highest disabled:text-on-surface-variant transition-opacity"
              >
                <Volume2 size={16} />
                Play concert
              </button>
            </div>
          </article>
        ))}
      </div>

      <ConcertOverlay band={concertBand} onClose={() => setConcertBand(null)} />
    </section>
  );
}
