const AVATAR_TONES = [
  "bg-primary-container text-on-primary-container",
  "bg-secondary-container text-on-secondary-container",
  "bg-lake-wash text-lake",
  "bg-rosin-wash text-rosin",
  "bg-madder-wash text-madder",
];

const avatarTone = (name = "") => {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
};

const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "?";

/** Initials avatar with a stable per-name palette tone (Design 2.0). */
export default function Avatar({ name, className = "w-12 h-12 text-lg" }) {
  return (
    <div
      className={`${avatarTone(name)} ${className} rounded-full flex items-center justify-center font-headline font-bold shrink-0`}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}
