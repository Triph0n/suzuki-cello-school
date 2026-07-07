import mascot from "../../assets/gamification/cellino-mascot.png";
import sleeping from "../../assets/gamification/cellino-sleeping.png";
import cheering from "../../assets/gamification/cellino-cheering.png";
import chestClosed from "../../assets/gamification/chest-closed.png";
import chestOpen from "../../assets/gamification/chest-open.png";
import metronomeGold from "../../assets/gamification/metronome-gold.png";

export const CELLINO = { awake: mascot, sleeping, cheering };
export const CHEST = { closed: chestClosed, open: chestOpen };
export const METRONOME = metronomeGold;

const stickerModules = import.meta.glob(
  "../../assets/gamification/stickers/*.png",
  { eager: true, import: "default" }
);

export const stickerSrc = (key) =>
  stickerModules[`../../assets/gamification/stickers/${key}.png`];
