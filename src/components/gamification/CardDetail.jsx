import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import MusicianCard from "./MusicianCard";

// Full-screen look at one collected card. This is the view children hold up to
// each other, so the card is big and alone on a dark ground, and the arrows
// page through the whole collection, band by band, in shelf order.
export default function CardDetail({ cards, index, onClose, onStep }) {
  const card = cards[index];

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onStep(-1);
      if (event.key === "ArrowRight") onStep(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onStep]);

  if (!card) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-scrim/80 p-6 backdrop-blur-md"
      onClick={onClose}
      role="presentation"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-xl p-2 text-on-background transition-colors hover:bg-surface-container-high"
        aria-label="Close card"
      >
        <X size={28} />
      </button>

      <div
        className="flex items-center gap-3"
        onClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        <button
          type="button"
          onClick={() => onStep(-1)}
          disabled={cards.length < 2}
          className="rounded-full bg-surface-container-low/90 p-2 text-on-background shadow-lg transition-opacity hover:opacity-90 disabled:invisible"
          aria-label="Previous card"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="gami-pop">
          <MusicianCard musician={card} size="hero" bandName={card.bandName} />
        </div>

        <button
          type="button"
          onClick={() => onStep(1)}
          disabled={cards.length < 2}
          className="rounded-full bg-surface-container-low/90 p-2 text-on-background shadow-lg transition-opacity hover:opacity-90 disabled:invisible"
          aria-label="Next card"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <p className="text-sm font-bold text-on-background">
        {card.name}
        {cards.length > 1 && (
          <span className="ml-2 font-medium opacity-70 tabular-nums">
            {index + 1} / {cards.length}
          </span>
        )}
      </p>
    </div>
  );
}
