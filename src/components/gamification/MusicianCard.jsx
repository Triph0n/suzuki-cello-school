import { Lock } from "lucide-react";
import { stickerSrc } from "./assets";

// One collectible card. The same component is the tile in the collection and
// the big reveal when a chest opens, so what the child sees in the chest is
// exactly the card that lands in the shelf — and, later, the card that can be
// printed at 63 × 88 mm.
//
// The frame carries the rarity, the footer carries facts about the music: the
// part, the string it lives on and the first Suzuki piece it plays in.

const RARITY = {
  common: {
    label: "Common",
    frame: "border-outline-variant/50",
    ribbon: "bg-surface-container-highest text-on-surface-variant",
    glow: ""
  },
  rare: {
    label: "Rare",
    frame: "border-rosin/70",
    ribbon: "bg-rosin/20 text-rosin",
    glow: "shadow-[0_0_0_1px_var(--color-rosin)]"
  },
  legendary: {
    label: "Legendary",
    frame: "border-primary/80",
    ribbon: "bg-primary/15 text-primary",
    glow: "shadow-[0_0_0_1px_var(--color-primary)]"
  }
};

export default function MusicianCard({
  musician,
  owned = true,
  bandName,
  size = "compact"
}) {
  const rarity = RARITY[musician.rarity] || RARITY.common;
  const hero = size === "hero";
  const large = hero || size === "large";
  // "mini" is the shelf tile: picture and number only, so a whole collection
  // fits on one screen and the gaps are what stands out.
  const mini = size === "mini";
  const width = hero ? "w-72 sm:w-80 mx-auto" : large ? "w-56 mx-auto" : "w-full";

  return (
    <article
      className={`relative flex flex-col overflow-hidden rounded-2xl border-2 bg-surface-container-low ${
        rarity.frame
      } ${owned ? rarity.glow : "opacity-90"} ${width}`}
    >
      {/* card head: set number and rarity */}
      <div
        className={`flex items-center justify-between pt-2 pb-1 ${mini ? "px-1.5" : "px-2.5"}`}
      >
        <span className="text-[10px] font-bold tracking-widest text-on-surface-variant tabular-nums">
          №&nbsp;{String(musician.cardNo).padStart(2, "0")}
        </span>
        {!mini && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${rarity.ribbon}`}
          >
            {rarity.label}
          </span>
        )}
      </div>

      {/* artwork */}
      <div
        className={`relative aspect-square overflow-hidden rounded-xl bg-surface-container ${
          mini ? "mx-1.5" : "mx-2"
        }`}
      >
        <img
          src={stickerSrc(musician.key)}
          alt={owned ? musician.name : "Card not collected yet"}
          className={`h-full w-full object-contain ${owned ? "" : "grayscale opacity-20"}`}
        />
        {!owned && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-container/40">
            <Lock size={large ? 32 : mini ? 16 : 22} className="text-on-surface-variant" />
          </div>
        )}
      </div>

      {mini ? (
        <div className="px-1.5 pb-1.5 pt-1">
          <p className="truncate text-center text-[10px] font-bold text-on-surface-variant">
            {owned ? musician.shortName : "???"}
          </p>
        </div>
      ) : (
      /* facts */
      <div className="flex flex-col gap-0.5 px-2.5 pb-2.5 pt-2">
        <p
          className={`truncate font-headline font-bold text-on-background ${
            large ? "text-lg" : "text-sm"
          }`}
        >
          {owned ? musician.shortName : "???"}
        </p>
        <p className="truncate text-[11px] font-medium text-on-surface-variant">
          {owned ? `${musician.role} · ${musician.instrument}` : "Keep practising"}
        </p>
        {large && owned && (
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-outline-variant/40 pt-2 text-left text-[11px]">
            <dt className="font-bold text-on-surface-variant">Plays</dt>
            <dd className="truncate text-on-background">{musician.piece}</dd>
            <dt className="font-bold text-on-surface-variant">Home</dt>
            <dd className="truncate text-on-background">{musician.string}</dd>
            {bandName && (
              <>
                <dt className="font-bold text-on-surface-variant">Band</dt>
                <dd className="truncate text-on-background">{bandName}</dd>
              </>
            )}
          </dl>
        )}
      </div>
      )}
    </article>
  );
}
