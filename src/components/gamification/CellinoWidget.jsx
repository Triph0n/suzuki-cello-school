import { CELLINO } from "./assets";

const BUBBLES = {
  sleeping: ["Zzz... wake me up with your cello!", "Zzz... shall we play today?"],
  awake: ["Shall we practice together today?", "I missed the music! Ready?"],
  cheering: ["You played today — hooray!", "Bravo! Same time again tomorrow?"]
};

export default function CellinoWidget({ mood, streak }) {
  const bubble = BUBBLES[mood][streak % BUBBLES[mood].length];

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <img
          src={CELLINO[mood]}
          alt="Cellino the cello mascot"
          className={`w-28 h-28 object-contain drop-shadow-md ${
            mood === "cheering" ? "animate-bounce" : ""
          }`}
        />
        {streak > 0 && (
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-surface-container-low border border-outline-variant/40 rounded-full px-2 py-0.5 shadow-sm"
            title={`Pearl necklace: ${streak} day streak`}
          >
            <span className="text-xs">📿</span>
            <span className="text-xs font-bold text-primary">{streak}</span>
          </div>
        )}
      </div>
      <div className="relative bg-surface-container-low border border-outline-variant/30 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm max-w-52">
        <p className="text-sm font-medium text-on-surface-variant">{bubble}</p>
      </div>
    </div>
  );
}
