import { Gift, Moon } from "lucide-react";
import { getChestStake, getOpenableChests, getSealedChests } from "../../gamification";
import { CHEST, stickerSrc } from "./assets";

// The card sits right under the practice button and has two faces.
//
// Before practice it names what today plays for — the animals the current band
// is still missing. Naming the prize *before* the work is the whole point: the
// hard part of practising is starting, not finishing.
//
// After a session the chest is sealed, and it opens the next day. So the
// reveal — the loudest moment of the loop — happens when the child opens the
// app in the morning, never while they should be watching their fingers.
export default function ChestCard({ state, onOpenChest, revealOnly = false }) {
  const openable = getOpenableChests(state);
  const sealed = getSealedChests(state);
  const stake = getChestStake(state);

  if (openable.length > 0) {
    return (
      <button
        type="button"
        onClick={onOpenChest}
        className="club-leather w-full text-left rounded-3xl p-5 flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity"
      >
        <img
          src={CHEST.closed}
          alt=""
          className="w-20 h-20 object-contain shrink-0 rounded-xl border border-outline-variant/30 gami-wiggle"
        />
        <div className="min-w-0">
          <p className="font-headline text-xl font-bold text-on-background">
            Yesterday&apos;s chest is ready!
          </p>
          <p className="text-sm text-on-surface-variant font-medium mt-1">
            {openable.length > 1
              ? `${openable.length} chests waited the night out. Tap to open one.`
              : "It waited the whole night. Tap to open it."}
          </p>
        </div>
      </button>
    );
  }

  // With the collection screens off, the chest only ever appears as the reward
  // arriving. Naming tomorrow's prize belongs to a screen the child can browse,
  // and there is no such screen right now.
  if (revealOnly) return null;

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Gift size={18} className="text-primary shrink-0" aria-hidden="true" />
        <p className="font-headline text-lg font-bold text-on-background">
          Today you are playing for
        </p>
      </div>
      <p className="text-sm text-on-surface-variant font-medium">
        {stake.collectionComplete
          ? "Every card is on your shelf — chests now bring notes for instruments."
          : stake.candidates.length === 1
            ? `The last player ${stake.band.name} is missing:`
            : `One of these players for ${stake.band.name} — never one you already have:`}
      </p>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        {stake.candidates.map((musician) => (
          <div
            key={musician.key}
            className="w-16 h-16 rounded-2xl bg-surface-container border border-outline-variant/40 overflow-hidden flex items-center justify-center"
            title="Who comes out of the chest is a surprise"
          >
            <img
              src={stickerSrc(musician.key)}
              alt=""
              className="w-full h-full object-contain grayscale opacity-30"
            />
          </div>
        ))}
      </div>

      <p className="text-xs text-on-surface-variant mt-3 font-medium flex items-center gap-1.5">
        {sealed.length > 0 ? (
          <>
            <Moon size={14} className="text-rosin shrink-0" aria-hidden="true" />
            {sealed.length > 1
              ? `${sealed.length} chests are sealed — they open tomorrow.`
              : "Your chest is sealed — it opens tomorrow."}
          </>
        ) : stake.blocked === "recovery" ? (
          "A day was missed, so today brings your run back. Play tomorrow too and the chests are yours again."
        ) : stake.minutesToGoal > 0 ? (
          `Play ${stake.minutesToGoal} min today and a chest is sealed for you. It opens tomorrow.`
        ) : (
          "Today's goal is done — your chest is on its way."
        )}
      </p>
    </div>
  );
}
