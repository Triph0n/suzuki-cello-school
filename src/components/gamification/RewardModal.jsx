import { useState } from "react";
import { CHEST, METRONOME } from "./assets";
import { FEATURES } from "../../features";
import MusicianCard from "./MusicianCard";

// Design 2.0 tokens — kept in sync with @theme in index.css via CSS variables.
const CONFETTI_COLORS = [
  "var(--color-primary)",
  "var(--color-rosin)",
  "var(--color-lake)",
  "var(--color-madder)",
  "var(--color-secondary)",
  "var(--color-primary-fixed-dim)"
];

const makeConfettiPieces = () =>
  Array.from({ length: 60 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 1.2,
    duration: 2.2 + Math.random() * 1.6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 7 + Math.random() * 8,
    spin: Math.random() > 0.5 ? 1 : -1
  }));

function Confetti() {
  const [pieces] = useState(makeConfettiPieces);
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

export default function RewardModal({ result, onClose, onClaimMemory }) {
  const [chestOpened, setChestOpened] = useState(false);

  if (!result) return null;

  if (result.tooShort) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-scrim/70 backdrop-blur-md p-6" onClick={onClose} role="presentation">
        <div className="bg-surface-container-low rounded-3xl p-8 max-w-sm text-center shadow-2xl" onClick={(e) => e.stopPropagation()} role="presentation">
          <p className="text-4xl mb-3">🎻</p>
          <h2 className="font-headline text-2xl font-bold text-on-background mb-2">That was quick!</h2>
          <p className="text-on-surface-variant mb-6">
            Play at least one whole minute and Cellino will bring you a treasure chest.
          </p>
          <button onClick={onClose} className="bg-primary text-on-primary font-medium py-3 px-8 rounded-full cursor-pointer hover:opacity-90">
            Keep going
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-scrim/70 backdrop-blur-md p-6">
      <Confetti />
      <div className="bg-surface-container-low rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative z-10 my-auto">
        <h2 className="font-headline text-3xl font-bold text-primary mb-1">
          {result.chestOnly ? "Good morning!" : "Bravo!"}
        </h2>
        <p className="text-on-surface-variant font-medium mb-4">
          {result.chestOnly
            ? "Your chest waited all night. Let's see who is inside."
            : `${result.minutes} min today — pearl #${result.streak} on your necklace 📿`}
        </p>

        {result.onTime && (
          <p className="text-sm text-on-surface-variant mb-4">
            Same time as always — that is how it turns into a habit. ⏰
          </p>
        )}

        {result.batonJustEarned && (
          <div className="flex items-center justify-center gap-3 bg-secondary-container/60 rounded-2xl p-3 mb-4">
            <img src={METRONOME} alt="Steady beat" className="w-12 h-12 object-contain" />
            <p className="text-sm font-bold text-on-secondary-container text-left">
              Steady beat earned!<br />
              <span className="font-medium">Right in your golden zone today.</span>
            </p>
          </div>
        )}

        {result.overTarget && (
          <p className="text-xs text-on-surface-variant mb-4">
            That's plenty for today — Cellino says: rest and come back tomorrow! 🎻
          </p>
        )}

        {FEATURES.ensembleHall && result.rehearsals?.map((rehearsal) => (
          <div
            key={rehearsal.key}
            className="bg-secondary-container/60 rounded-2xl p-3 mb-4 text-left"
          >
            <p className="text-sm font-bold text-on-secondary-container">
              🎭 Rehearsal {rehearsal.rehearsals}/{rehearsal.rehearsalsNeeded} — {rehearsal.name}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              {rehearsal.rehearsals >= rehearsal.rehearsalsNeeded
                ? "The ensemble is ready — open the stage for your premiere!"
                : "Every practice day is one rehearsal with your ensemble."}
            </p>
          </div>
        ))}

        {result.practiceNote && (
          <div className="bg-tertiary-container/70 rounded-2xl p-3 mb-4 text-left">
            <p className="text-sm font-bold text-on-tertiary-container">
              +1 practice note for your bands
            </p>
            <p className="text-xs text-on-surface-variant mt-1">
              Use notes to equip collected players with instruments. You have {result.notes} now.
            </p>
          </div>
        )}

        {result.sticker ? (
          !chestOpened ? (
            <button onClick={() => setChestOpened(true)} className="group cursor-pointer bg-transparent border-none" title="Open the chest!">
              {/* The artwork is printed on its own pale paper, so it gets the
                  same rounded frame the cards give their pictures — otherwise
                  it reads as a stray square on the white modal. */}
              <img
                src={CHEST.closed}
                alt="Treasure chest — tap to open"
                className="w-44 h-44 object-contain mx-auto rounded-2xl border border-outline-variant/30 gami-wiggle group-hover:scale-105 transition-transform"
              />
              <p className="text-sm font-bold text-primary mt-1">Tap the chest!</p>
            </button>
          ) : (
            <div className="gami-pop">
              <div className="gami-rise-block">
                <MusicianCard
                  musician={result.sticker}
                  size="large"
                  bandName={result.stickerBand?.name}
                />
              </div>
              <p className="font-headline text-lg font-bold text-on-background mt-3">
                {result.sticker.name}
              </p>
              <p className="text-sm text-on-surface-variant">
                A new card for your collection.
              </p>
              {result.chestsLeft > 0 && (
                <p className="text-xs text-on-surface-variant mt-1">
                  {result.chestsLeft === 1
                    ? "One more chest is waiting."
                    : `${result.chestsLeft} more chests are waiting.`}
                </p>
              )}
            </div>
          )
        ) : result.sealedChest ? (
          <div className="gami-pop">
            <img
              src={CHEST.closed}
              alt="A sealed treasure chest"
              className="w-40 h-40 object-contain mx-auto rounded-2xl border border-outline-variant/30"
            />
            <p className="font-headline text-xl font-bold text-on-background mt-2">
              A chest is sealed for you 🌙
            </p>
            <p className="text-sm text-on-surface-variant mt-1">
              It opens tomorrow. Inside is a card you do not have yet — which
              one is the surprise.
            </p>
          </div>
        ) : result.collectionComplete ? (
          <div className="gami-pop">
            <img
              src={CHEST.open}
              alt="An open treasure chest"
              className="w-40 h-40 object-contain mx-auto rounded-2xl border border-outline-variant/30"
            />
            <p className="font-headline text-xl font-bold text-on-background">
              Your shelf is full! 🏆
            </p>
            <p className="text-sm text-on-surface-variant mt-1">
              Every card is collected, so this chest brought notes instead. You
              have {result.notes} now.
            </p>
          </div>
        ) : result.chestBlocked === "goal" ? (
          <p className="text-sm text-on-surface-variant mb-2">
            {result.minutesToGoal} more min today and a chest is sealed for you. 🎁
          </p>
        ) : result.chestBlocked === "recovery" ? (
          <p className="text-sm text-on-surface-variant mb-2">
            Today brings your run back after the missed day. Reach the goal
            tomorrow as well and the chests are yours again. 🎁
          </p>
        ) : (
          <p className="text-sm text-on-surface-variant mb-2">
            Today&apos;s chest is sealed already — a new one tomorrow! 🎁
          </p>
        )}

        {onClaimMemory && (
          <div className="mt-5 rounded-2xl border border-outline-variant/40 p-4 text-left">
            <p className="text-sm font-bold text-on-background">
              Did you play a piece from memory today?
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              Playing without the book is what turns practice into music — it is
              worth a chest of its own.
            </p>
            <button
              type="button"
              onClick={onClaimMemory}
              className="mt-3 rounded-full bg-secondary-container px-5 py-2 text-sm font-bold text-on-secondary-container hover:opacity-90"
            >
              Yes, from memory 🎵
            </button>
          </div>
        )}

        {result.memoryClaimed && (
          <div className="mt-5 rounded-2xl bg-secondary-container/60 p-4">
            <p className="text-sm font-bold text-on-secondary-container">
              From memory — a second chest is sealed for you 🌙
            </p>
          </div>
        )}

        {(chestOpened || !result.sticker) && (
          <button onClick={onClose} className="mt-6 bg-primary text-on-primary font-medium py-3 px-10 rounded-full cursor-pointer hover:opacity-90">
            Done
          </button>
        )}
      </div>
    </div>
  );
}
