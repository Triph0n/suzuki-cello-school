// Gamification core: practice sessions, streak (pearls), balance batons,
// reward chest with collectible stickers. Local-only for now, mirroring the
// localStorage pattern used in api.js. See gamification-design.md.

export const STICKERS = [
  { key: "mouse-violin", name: "Mia the Violin Mouse", rarity: "common" },
  { key: "rabbit-flute", name: "Rosie the Flute Rabbit", rarity: "common" },
  { key: "hedgehog-drum", name: "Hugo the Drummer Hedgehog", rarity: "common" },
  { key: "bear-bass", name: "Bruno the Bass Bear", rarity: "rare" },
  { key: "owl-conductor", name: "Maestro Owl", rarity: "rare" },
  { key: "fox-cello", name: "Felix the Cello Fox", rarity: "legendary" }
];

const RARITY_NOTES = { common: 1, rare: 3, legendary: 10 };
const MIN_SESSION_MINUTES = 1;
const MAX_CHESTS_PER_DAY = 2;
const FREEZE_GRANT_DAYS = 14;
const MAX_FREEZES = 2;

const storageKey = (studentId) => `gamify_${studentId}`;

export const dateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const shiftDateKey = (key, days) => {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return dateKey(date);
};

const defaultState = () => ({
  dailyTargetMin: 15,
  sessions: [],
  stickers: {},
  notes: 0,
  freezes: 1,
  lastFreezeGrant: dateKey(),
  chestsToday: { date: dateKey(), count: 0 }
});

export const getGamifyState = (studentId) => {
  if (!studentId) return defaultState();
  try {
    const raw = localStorage.getItem(storageKey(studentId));
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch {
    return defaultState();
  }
};

const saveGamifyState = (studentId, state) => {
  localStorage.setItem(storageKey(studentId), JSON.stringify(state));
  window.dispatchEvent(new Event("gamify_updated"));
};

export const setDailyTarget = (studentId, minutes) => {
  const state = getGamifyState(studentId);
  state.dailyTargetMin = minutes;
  saveGamifyState(studentId, state);
};

export const minutesOnDay = (state, key) =>
  state.sessions
    .filter((s) => s.date === key)
    .reduce((sum, s) => sum + s.minutes, 0);

// A day earns its balance baton when total practice reaches at least 75 % of
// the daily target. Practicing far beyond the target intentionally earns
// nothing extra — the game rewards rhythm, not marathons.
export const hasBaton = (state, key) =>
  minutesOnDay(state, key) >= state.dailyTargetMin * 0.75;

// Streak = consecutive practice days ending today (or yesterday, so the
// streak isn't shown as broken before today's practice happened). Up to
// `freezes` single-day gaps are bridged instead of breaking the chain.
export const getStreak = (state) => {
  const today = dateKey();
  let cursor = minutesOnDay(state, today) > 0 ? today : shiftDateKey(today, -1);
  let streak = 0;
  let freezesLeft = state.freezes;
  for (let i = 0; i < 730; i++) {
    if (minutesOnDay(state, cursor) > 0) {
      streak += 1;
    } else if (streak > 0 && freezesLeft > 0 && minutesOnDay(state, shiftDateKey(cursor, -1)) > 0) {
      freezesLeft -= 1; // magic rosin bridges a single missed day
    } else {
      break;
    }
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
};

export const getWeek = (state) => {
  const days = [];
  const today = dateKey();
  for (let i = 6; i >= 0; i--) {
    const key = shiftDateKey(today, -i);
    days.push({
      key,
      isToday: key === today,
      minutes: Math.round(minutesOnDay(state, key)),
      baton: hasBaton(state, key)
    });
  }
  return days;
};

export const isGoldenWeek = (state) =>
  getWeek(state).filter((d) => d.baton).length >= 5;

const rollSticker = (goldenWeek) => {
  const roll = Math.random();
  let rarity = roll < 0.05 ? "legendary" : roll < 0.3 ? "rare" : "common";
  if (goldenWeek) rarity = rarity === "common" ? "rare" : rarity; // Golden week upgrade
  const pool = STICKERS.filter((s) => s.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
};

// Records a finished practice session and returns everything the celebration
// screen needs. `seconds` is the measured practice time.
export const finishSession = (studentId, seconds) => {
  const state = getGamifyState(studentId);
  const minutes = Math.round((seconds / 60) * 10) / 10;
  if (minutes < MIN_SESSION_MINUTES) {
    return { tooShort: true, minutes };
  }

  const today = dateKey();
  const batonBefore = hasBaton(state, today);
  state.sessions.push({ date: today, minutes, at: new Date().toISOString() });

  // Earn a streak freeze ("magic rosin") every two weeks of use.
  const graceAge =
    (new Date(today) - new Date(state.lastFreezeGrant || today)) / 86400000;
  if (graceAge >= FREEZE_GRANT_DAYS && state.freezes < MAX_FREEZES) {
    state.freezes += 1;
    state.lastFreezeGrant = today;
  }

  // Chest with a variable reward — capped per day so restarting the timer
  // over and over doesn't farm stickers.
  if (state.chestsToday.date !== today) {
    state.chestsToday = { date: today, count: 0 };
  }
  let sticker = null;
  let duplicate = false;
  if (state.chestsToday.count < MAX_CHESTS_PER_DAY) {
    state.chestsToday.count += 1;
    sticker = rollSticker(isGoldenWeek(state));
    const owned = state.stickers[sticker.key] || 0;
    state.stickers[sticker.key] = owned + 1;
    if (owned > 0) {
      duplicate = true;
      state.notes += RARITY_NOTES[sticker.rarity];
    }
  }

  saveGamifyState(studentId, state);

  return {
    minutes,
    dayTotal: Math.round(minutesOnDay(state, today)),
    targetMin: state.dailyTargetMin,
    baton: hasBaton(state, today),
    batonJustEarned: !batonBefore && hasBaton(state, today),
    overTarget: minutesOnDay(state, today) > state.dailyTargetMin * 1.25,
    streak: getStreak(state),
    goldenWeek: isGoldenWeek(state),
    sticker,
    duplicate,
    notes: state.notes
  };
};

// Cellino's mood: cheering right after practicing today, awake if practiced
// within the last two days, otherwise asleep (never punished, just sleepy).
export const getCellinoMood = (state) => {
  const today = dateKey();
  if (minutesOnDay(state, today) > 0) return "cheering";
  if (
    minutesOnDay(state, shiftDateKey(today, -1)) > 0 ||
    minutesOnDay(state, shiftDateKey(today, -2)) > 0
  ) {
    return "awake";
  }
  return "sleeping";
};
