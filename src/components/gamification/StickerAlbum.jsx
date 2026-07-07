import { STICKERS } from "../../gamification";
import { stickerSrc } from "./assets";

const RARITY_STYLE = {
  common: "border-outline-variant/40",
  rare: "border-amber-400/70",
  legendary: "border-primary/70 shadow-md"
};

const RARITY_LABEL = { common: "Common", rare: "Rare", legendary: "Legendary" };

export default function StickerAlbum({ stickers }) {
  const owned = STICKERS.filter((s) => stickers[s.key]).length;

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline text-lg font-bold text-on-background">
          Animal Orchestra
        </h3>
        <span className="text-xs text-on-surface-variant font-bold">
          {owned}/{STICKERS.length}
        </span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {STICKERS.map((sticker) => {
          const count = stickers[sticker.key] || 0;
          return (
            <div
              key={sticker.key}
              className={`relative rounded-2xl border-2 p-1.5 bg-surface-container flex items-center justify-center aspect-square ${RARITY_STYLE[sticker.rarity]}`}
              title={count > 0 ? `${sticker.name} (${RARITY_LABEL[sticker.rarity]})` : "Not collected yet — keep practicing!"}
            >
              <img
                src={stickerSrc(sticker.key)}
                alt={count > 0 ? sticker.name : "Locked sticker"}
                className={`w-full h-full object-contain ${
                  count > 0 ? "" : "grayscale opacity-25"
                }`}
              />
              {count === 0 && (
                <span className="absolute inset-0 flex items-center justify-center font-headline text-2xl font-bold text-on-surface-variant/70">
                  ?
                </span>
              )}
              {count > 1 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary text-on-primary text-[10px] font-bold rounded-full px-1.5 py-0.5 shadow-sm">
                  ×{count}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
