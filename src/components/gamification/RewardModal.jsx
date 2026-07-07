import { useState } from "react";
import { CHEST, METRONOME, stickerSrc } from "./assets";

const CONFETTI_COLORS = ["#994100", "#C6A15B", "#722F37", "#186474", "#ff8439", "#d7e9b9"];

const RARITY_LABEL = { common: "Common", rare: "Rare ✨", legendary: "LEGENDARY 🌟" };

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
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[80]">
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

export default function RewardModal({ result, onClose }) {
  const [chestOpened, setChestOpened] = useState(false);

  if (!result) return null;

  if (result.tooShort) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-md p-6" onClick={onClose}>
        <div className="bg-surface-container-low rounded-[2rem] p-8 max-w-sm text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
      <Confetti />
      <div className="bg-surface-container-low rounded-[2rem] p-8 max-w-md w-full text-center shadow-2xl relative z-[90]">
        <h2 className="font-headline text-3xl font-bold text-primary mb-1">Bravo!</h2>
        <p className="text-on-surface-variant font-medium mb-4">
          {result.minutes} min today — pearl #{result.streak} on your necklace 📿
        </p>

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
              <img
                src={CHEST.closed}
                alt="Treasure chest — tap to open"
                className="w-44 h-44 object-contain mx-auto gami-wiggle group-hover:scale-105 transition-transform"
              />
              <p className="text-sm font-bold text-primary mt-1">Tap the chest!</p>
            </button>
          ) : (
            <div className="gami-pop">
              <div className="relative w-44 h-44 mx-auto">
                <img src={CHEST.open} alt="Open treasure chest" className="w-full h-full object-contain" />
                <img
                  src={stickerSrc(result.sticker.key)}
                  alt={result.sticker.name}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 w-28 h-28 object-contain gami-rise drop-shadow-lg"
                />
              </div>
              <p className="font-headline text-xl font-bold text-on-background mt-2">
                {result.sticker.name}
              </p>
              <p className={`text-sm font-bold ${
                result.sticker.rarity === "legendary" ? "text-primary" :
                result.sticker.rarity === "rare" ? "text-amber-600" : "text-on-surface-variant"
              }`}>
                {RARITY_LABEL[result.sticker.rarity]}
                {result.duplicate && <span className="text-on-surface-variant font-medium"> — duplicate bonus notes!</span>}
              </p>
            </div>
          )
        ) : (
          <p className="text-sm text-on-surface-variant mb-2">
            Today's chests are all opened — new ones tomorrow! 🎁
          </p>
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
