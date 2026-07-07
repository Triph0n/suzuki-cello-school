import { METRONOME } from "./assets";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const dayLabel = (key) => DAY_LABELS[new Date(`${key}T12:00:00`).getDay()];

export default function BalanceWeek({ week, targetMin, goldenWeek, notes, onChangeTarget }) {
  const batons = week.filter((d) => d.baton).length;

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h3 className="font-headline text-lg font-bold text-on-background">
          Balance week {goldenWeek && <span title="Golden beat!">🏆</span>}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant font-medium" title="Notes earned from duplicate stickers">
            🎵 {notes}
          </span>
          <select
            value={targetMin}
            onChange={(e) => onChangeTarget(Number(e.target.value))}
            className="bg-surface-variant text-on-surface text-xs p-1.5 rounded-lg border-none outline-none cursor-pointer font-medium"
            title="Daily practice goal"
          >
            {[10, 15, 20, 25, 30].map((m) => (
              <option key={m} value={m}>{m} min/day</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {week.map((day) => (
          <div
            key={day.key}
            className={`flex flex-col items-center gap-1 rounded-2xl py-2 ${
              day.isToday ? "bg-secondary-container/50" : ""
            }`}
            title={`${day.minutes} min`}
          >
            <div className="w-9 h-9 flex items-center justify-center">
              {day.baton ? (
                <img src={METRONOME} alt="Steady beat earned" className="w-9 h-9 object-contain drop-shadow-sm" />
              ) : day.minutes > 0 ? (
                <span className="text-lg" title="Practiced, but under the goal">🎵</span>
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-surface-variant" />
              )}
            </div>
            <span className={`text-[10px] font-bold uppercase ${day.isToday ? "text-primary" : "text-on-surface-variant"}`}>
              {dayLabel(day.key)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-on-surface-variant mt-3 font-medium">
        {batons >= 5
          ? "Golden beat! 5+ steady days this week — a rare sticker is guaranteed."
          : `${batons}/5 steady days for the Golden beat`}
      </p>
    </div>
  );
}
