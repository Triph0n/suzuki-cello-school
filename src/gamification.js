// Gamification core: practice sessions, streak (pearls), balance batons,
// reward chest with collectible musicians, and band building. Local-only for
// now, mirroring the localStorage pattern used in api.js.

export const MUSICIANS = [
  {
    key: "mouse-violin",
    name: "Mia the Violin Mouse",
    shortName: "Mia",
    rarity: "common",
    role: "Melody",
    instrument: "Violin",
    instrumentCost: 1
  },
  {
    key: "rabbit-flute",
    name: "Rosie the Flute Rabbit",
    shortName: "Rosie",
    rarity: "common",
    role: "Air",
    instrument: "Flute",
    instrumentCost: 1
  },
  {
    key: "hedgehog-drum",
    name: "Hugo the Drummer Hedgehog",
    shortName: "Hugo",
    rarity: "common",
    role: "Beat",
    instrument: "Drum",
    instrumentCost: 1
  },
  {
    key: "bear-bass",
    name: "Bruno the Bass Bear",
    shortName: "Bruno",
    rarity: "rare",
    role: "Bass",
    instrument: "Double bass",
    instrumentCost: 2
  },
  {
    key: "owl-conductor",
    name: "Maestro Owl",
    shortName: "Maestro",
    rarity: "rare",
    role: "Conductor",
    instrument: "Golden baton",
    instrumentCost: 2
  },
  {
    key: "fox-cello",
    name: "Felix the Cello Fox",
    shortName: "Felix",
    rarity: "legendary",
    role: "Cello",
    instrument: "Cello",
    instrumentCost: 3
  }
];

// Bands are ordered easiest-first: the starter duo needs only common
// musicians, the legendary cello fox first appears in the quartet. Each
// motif is the opening phrase of a tune the child already knows.
export const BANDS = [
  {
    key: "twinkle-duo",
    name: "Twinkle Duo",
    sizeLabel: "2 players",
    rehearsalHint: "Two little friends play the very first Twinkle.",
    members: ["mouse-violin", "rabbit-flute"],
    // Twinkle, Twinkle, Little Star: C C G G A A G
    motif: [262, 262, 392, 392, 440, 440, 392]
  },
  {
    key: "steady-trio",
    name: "Steady Beat Trio",
    sizeLabel: "3 players",
    rehearsalHint: "Rhythm, bass, and conductor for steady practice days.",
    members: ["hedgehog-drum", "bear-bass", "owl-conductor"],
    // Lightly Row an octave down: G E E, F D D, C D E F G G G
    motif: [196, 165, 165, 175, 147, 147, 131, 147, 165, 175, 196, 196, 196]
  },
  {
    key: "melody-quartet",
    name: "Melody Quartet",
    sizeLabel: "4 players",
    rehearsalHint: "A small concert group with melody, air, cello, and baton.",
    members: ["mouse-violin", "rabbit-flute", "fox-cello", "owl-conductor"],
    // Ode to Joy: E E F G G F E D C C D E E D D
    motif: [330, 330, 349, 392, 392, 349, 330, 294, 262, 262, 294, 330, 330, 294, 294]
  },
  {
    key: "animal-orchestra",
    name: "Animal Orchestra",
    sizeLabel: "6 players",
    rehearsalHint: "The full first band from the whole collection.",
    members: [
      "mouse-violin",
      "rabbit-flute",
      "hedgehog-drum",
      "bear-bass",
      "owl-conductor",
      "fox-cello"
    ],
    // Frère Jacques: C D E C, C D E C, E F G, E F G
    motif: [262, 294, 330, 262, 262, 294, 330, 262, 330, 349, 392, 330, 349, 392]
  }
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
  equippedInstruments: {},
  notes: 0,
  freezes: 1,
  lastFreezeGrant: dateKey(),
  chestsToday: { date: dateKey(), count: 0 }
});

export const getGamifyState = (studentId) => {
  if (!studentId) return defaultState();
  try {
    const raw = localStorage.getItem(storageKey(studentId));
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      ...defaultState(),
      ...parsed,
      stickers: parsed.stickers || {},
      equippedInstruments: parsed.equippedInstruments || {},
      chestsToday: parsed.chestsToday || defaultState().chestsToday
    };
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
  const pool = MUSICIANS.filter((s) => s.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
};

export const getMusician = (key) => MUSICIANS.find((musician) => musician.key === key);

export const isMusicianCollected = (state, key) => (state.stickers?.[key] || 0) > 0;

export const isMusicianEquipped = (state, key) =>
  Boolean(state.equippedInstruments?.[key]);

export const equipMusician = (studentId, key) => {
  const state = getGamifyState(studentId);
  const musician = getMusician(key);

  if (!musician) return { ok: false, reason: "missing_musician" };
  if (!isMusicianCollected(state, key)) return { ok: false, reason: "not_collected" };
  if (isMusicianEquipped(state, key)) return { ok: true, state };
  if ((state.notes || 0) < musician.instrumentCost) {
    return { ok: false, reason: "not_enough_notes" };
  }

  state.notes -= musician.instrumentCost;
  state.equippedInstruments = {
    ...(state.equippedInstruments || {}),
    [key]: true
  };
  saveGamifyState(studentId, state);
  return { ok: true, state };
};

export const getBandProgress = (state, band) => {
  const members = band.members.map((key) => {
    const musician = getMusician(key);
    return {
      ...musician,
      collected: isMusicianCollected(state, key),
      equipped: isMusicianEquipped(state, key),
      count: state.stickers?.[key] || 0
    };
  });
  const collectedCount = members.filter((member) => member.collected).length;
  const readyCount = members.filter((member) => member.equipped).length;
  return {
    ...band,
    members,
    collectedCount,
    readyCount,
    complete: readyCount === members.length
  };
};

export const getBandSummaries = (state) =>
  BANDS.map((band) => getBandProgress(state, band));

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
  state.notes = (state.notes || 0) + 1;

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
    notes: state.notes,
    practiceNote: true
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
