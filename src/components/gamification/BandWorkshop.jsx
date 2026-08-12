import { useState } from "react";
import { Check, Lock, Music2, Volume2, X } from "lucide-react";
import {
  equipMusician,
  getBandSummaries,
  getCollectionShelf
} from "../../gamification";
import { playMotif } from "../../audio/ensemblePlayer";
import { stickerSrc } from "./assets";
import MusicianCard from "./MusicianCard";
import CardDetail from "./CardDetail";
import CollectionShelf from "./CollectionShelf";

function MusicianSlot({ studentId, bandKey, musician, notes, onOpenCard }) {
  const collected = musician.collected;
  const equipped = musician.equipped;
  const canEquip = collected && !equipped && notes >= musician.instrumentCost;
  const needsNotes = Math.max(0, musician.instrumentCost - notes);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        {/* A collected card can be opened full screen — that is how children
            show each other what they have. Cards not collected yet stay inert. */}
        {collected ? (
          <button
            type="button"
            onClick={() => onOpenCard(musician.key)}
            className="block w-full cursor-pointer rounded-2xl transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            title={`Look at ${musician.shortName}`}
          >
            <MusicianCard musician={musician} owned size="mini" />
          </button>
        ) : (
          <MusicianCard musician={musician} owned={false} size="mini" />
        )}
        {equipped && (
          <div className="absolute top-7 right-2.5 bg-secondary text-on-secondary rounded-full p-1 shadow-sm">
            <Check size={12} />
          </div>
        )}
      </div>

      {collected && !equipped && (
        <button
          type="button"
          onClick={() => equipMusician(studentId, bandKey, musician.key)}
          disabled={!canEquip}
          className="w-full rounded-lg bg-primary text-on-primary px-2 py-1.5 text-[11px] font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-surface-container-highest disabled:text-on-surface-variant"
          title={canEquip ? `Equip ${musician.instrument}` : `Needs ${needsNotes} more notes`}
        >
          Equip · {musician.instrumentCost}
        </button>
      )}

      {equipped && (
        <div className="flex items-center justify-center gap-1 rounded-lg bg-secondary-container px-2 py-1.5 text-[11px] font-bold text-on-secondary-container">
          <Music2 size={12} />
          Ready
        </div>
      )}
    </div>
  );
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
            onClick={() => playMotif(band.motif, { bpm: 132 })}
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
  // Index into the whole collection, so paging in the full-screen viewer runs
  // across band boundaries instead of stopping at the end of one band.
  const [openIndex, setOpenIndex] = useState(null);
  const bands = getBandSummaries(state);
  const shelf = getCollectionShelf(state);

  const handleOpenCard = (bandKey, key) => {
    const index = shelf.collected.findIndex(
      (card) => card.bandKey === bandKey && card.key === key
    );
    if (index >= 0) setOpenIndex(index);
  };

  const stepCard = (delta) =>
    setOpenIndex((current) => {
      if (current === null || !shelf.collected.length) return current;
      return (current + delta + shelf.collected.length) % shelf.collected.length;
    });

  const handlePlayBand = (band) => {
    if (!band.complete) return;
    setConcertBand(band);
    playMotif(band.motif, { bpm: 132 });
  };

  return (
    <section className="lg:col-span-2">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
        <div>
          <h3 className="font-headline text-2xl font-bold text-on-background">
            My cards
          </h3>
          <p className="text-sm text-on-surface-variant font-medium">
            One band at a time — the chest only brings cards from the band you
            are building right now.
          </p>
        </div>
        <div className="flex items-stretch gap-3">
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl px-4 py-3 text-right shadow-sm">
            <p className="text-xs uppercase font-bold text-on-surface-variant tracking-widest">
              Cards
            </p>
            <p className="font-headline text-2xl font-bold text-primary tabular-nums">
              {shelf.owned}
              <span className="text-on-surface-variant">/{shelf.total}</span>
            </p>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl px-4 py-3 text-right shadow-sm">
            <p className="text-xs uppercase font-bold text-on-surface-variant tracking-widest">
              Notes
            </p>
            <p className="font-headline text-2xl font-bold text-primary tabular-nums">
              {state.notes || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <CollectionShelf state={state} onOpenCard={handleOpenCard} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {bands.map((band) => (
          <article
            key={band.key}
            className={`bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 shadow-sm ${
              band.locked ? "opacity-70" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase font-bold tracking-widest text-primary mb-1">
                  {band.sizeLabel}
                </p>
                <h4 className="font-headline text-xl font-bold text-on-background flex items-center gap-2">
                  {band.name}
                  {band.locked && (
                    <Lock size={16} className="text-on-surface-variant shrink-0" />
                  )}
                </h4>
                <p className="text-sm text-on-surface-variant mt-1">
                  {band.locked
                    ? `Finish ${band.requires} first — one band at a time.`
                    : band.rehearsalHint}
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

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {band.members.map((musician) => (
                <MusicianSlot
                  key={musician.key}
                  studentId={studentId}
                  bandKey={band.key}
                  musician={musician}
                  notes={state.notes || 0}
                  onOpenCard={(key) => handleOpenCard(band.key, key)}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-on-surface-variant">
                {band.locked
                  ? `Locked until ${band.requires} is complete.`
                  : band.complete
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

      {openIndex !== null && shelf.collected.length > 0 && (
        <CardDetail
          cards={shelf.collected}
          index={Math.min(openIndex, shelf.collected.length - 1)}
          onClose={() => setOpenIndex(null)}
          onStep={stepCard}
        />
      )}
    </section>
  );
}
