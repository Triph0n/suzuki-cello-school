import mascot from "../../assets/gamification/cellino-mascot.webp";
import sleeping from "../../assets/gamification/cellino-sleeping.webp";
import cheering from "../../assets/gamification/cellino-cheering.webp";
import chestClosed from "../../assets/gamification/chest-closed.webp";
import chestOpen from "../../assets/gamification/chest-open.webp";
import metronomeGold from "../../assets/gamification/metronome-gold.webp";

export const CELLINO = { awake: mascot, sleeping, cheering };
export const CHEST = { closed: chestClosed, open: chestOpen };
export const METRONOME = metronomeGold;

const stickerModules = import.meta.glob(
  "../../assets/gamification/stickers/*.webp",
  { eager: true, import: "default" }
);

export const stickerSrc = (key) =>
  stickerModules[`../../assets/gamification/stickers/${key}.webp`];
