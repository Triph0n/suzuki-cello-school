import { Trophy } from "lucide-react";

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const dayLabel = (key) => DAY_LABELS[new Date(`${key}T12:00:00`).getDay()];

// One motif in three states instead of three icons: a pearl that is full
// (steady day), half full (practiced under the goal) or empty. Today's pearl
// fills up live with the minutes practiced, so the child sees exactly how
// close today's pearl is.
function Pearl({ fraction, today, label }) {
  const size = 36;
  const fill = Math.max(0, Math.min(1, fraction));
  const clipId = `pearl-${label}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={
        fill >= 1 ? "Full pearl" : fill > 0 ? "Pearl filling up" : "Empty pearl"
      }
    >
      <defs>
        <radialGradient id={`${clipId}-g`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#f9eed6" />
          <stop offset="55%" stopColor="#dfbd7e" />
          <stop offset="100%" stopColor="#a97c35" />
        </radialGradient>
        <clipPath id={clipId}>
          <rect x="0" y={size * (1 - fill)} width={size} height={size * fill} />
        </clipPath>
      </defs>

      {/* empty shell */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 3}
        fill="var(--color-surface-container-highest)"
        stroke={today ? "var(--color-primary)" : "var(--color-outline-variant)"}
        strokeWidth={today ? 2.5 : 1.5}
      />
      {/* filled part rises from the bottom */}
      {fill > 0 && (
        <g clipPath={`url(#${clipId})`}>
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 4.5} fill={`url(#${clipId}-g)`} />
        </g>
      )}
      {/* highlight once the pearl is complete */}
      {fill >= 1 && (
        <ellipse cx={size * 0.38} cy={size * 0.32} rx={4.5} ry={3} fill="#fdf7e8" opacity="0.9" />
      )}
    </svg>
  );
}

export default function BalanceWeek({ week, targetMin, goldenWeek }) {
  const pearls = week.filter((d) => d.baton).length;
  const today = week[week.length - 1];
  // A day's pearl is complete at 75 % of the daily goal (the "steady beat").
  const pearlAt = targetMin * 0.75;
  const minutesLeft = Math.max(0, Math.ceil(pearlAt - today.minutes));

  return (
    <div className="club-leather rounded-3xl p-5">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="font-headline text-lg font-bold text-on-background flex items-center gap-2">
          My week
          {goldenWeek && <Trophy size={18} className="text-rosin" aria-label="Golden beat!" />}
        </h3>
        <span className="text-xs text-on-surface-variant font-medium">
          Goal: {targetMin} min/day
        </span>
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
            <Pearl
              label={day.key}
              today={day.isToday}
              fraction={
                day.isToday
                  ? day.minutes / pearlAt
                  : day.baton
                    ? 1
                    : day.minutes > 0
                      ? 0.5
                      : 0
              }
            />
            <span
              className={`text-xs font-bold uppercase ${
                day.isToday ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              {dayLabel(day.key)}
            </span>
          </div>
        ))}
      </div>

      <p className="text-sm font-bold text-on-background mt-3">
        {today.baton
          ? "Today's pearl is yours! 📿"
          : `${minutesLeft} more min and today's pearl is full.`}
      </p>
      <p className="text-xs text-on-surface-variant mt-1 font-medium">
        {goldenWeek
          ? "Golden beat! 5 full pearls this week — a rare treasure is guaranteed."
          : `${pearls}/5 full pearls for the Golden beat.`}
      </p>
    </div>
  );
}
