// Gamification core: practice sessions, streak (pearls), balance batons,
// reward chest with collectible musicians, band building and the ensemble
// ladder. Local-only for now, mirroring the localStorage pattern used in
// api.js. Collections are scoped per group (schema 2, ported from the violin
// practice app): an animal collected for one band or awarded into one
// ensemble does not appear unlocked anywhere else.

export const DEFAULT_TARGET_MIN = 15;
export const MIN_TARGET_MIN = 5;
export const MAX_TARGET_MIN = 90;
export const TARGET_PRESETS = [10, 15, 20, 25, 30, 45];

// Every musician is a collectible card. Beyond the picture a card carries
// things that are true about music — the part it plays, the string it lives on
// and the first Suzuki piece where a child meets it — so the collection keeps
// pointing back at the instrument instead of becoming currency with faces.
export const MUSICIANS = [
  {
    key: "mouse-violin",
    cardNo: 1,
    name: "Mia the Violin Mouse",
    shortName: "Mia",
    rarity: "common",
    role: "Melody",
    instrument: "Violin",
    string: "A string",
    piece: "Twinkle Variations",
    instrumentCost: 1
  },
  {
    key: "rabbit-flute",
    cardNo: 2,
    name: "Rosie the Flute Rabbit",
    shortName: "Rosie",
    rarity: "common",
    role: "Air",
    instrument: "Flute",
    string: "Long bows",
    piece: "Lightly Row",
    instrumentCost: 1
  },
  {
    key: "hedgehog-drum",
    cardNo: 3,
    name: "Hugo the Drummer Hedgehog",
    shortName: "Hugo",
    rarity: "common",
    role: "Beat",
    instrument: "Drum",
    string: "Rhythm",
    piece: "Song of the Wind",
    instrumentCost: 1
  },
  {
    key: "bear-bass",
    cardNo: 4,
    name: "Bruno the Bass Bear",
    shortName: "Bruno",
    rarity: "rare",
    role: "Bass",
    instrument: "Double bass",
    string: "C string",
    piece: "Perpetual Motion",
    instrumentCost: 2
  },
  {
    key: "owl-conductor",
    cardNo: 5,
    name: "Maestro Owl",
    shortName: "Maestro",
    rarity: "rare",
    role: "Conductor",
    instrument: "Golden baton",
    string: "Tempo",
    piece: "Allegro",
    instrumentCost: 2
  },
  {
    key: "fox-cello",
    cardNo: 6,
    name: "Felix the Cello Fox",
    shortName: "Felix",
    rarity: "legendary",
    role: "Cello",
    instrument: "Cello",
    string: "D string",
    piece: "Twinkle Variations",
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

// Ensembles are the ladder of groups playing real recordings (see
// ensemble-design.md). Each chair is either a collectible musician's seat or
// the player's own chair — the ensemble only performs fully when the child
// plays along. Stem ids map to src/stems/<ensemble>/<part>.<tempo>.wav.
export const ENSEMBLES = [
  {
    key: "twinkle-duo",
    tier: 1,
    name: "Twinkle Duo",
    piece: { title: "Twinkle Variations", book: 1 },
    venue: "Living room",
    rehearsalsNeeded: 3,
    bpm: { practice: 72, concert: 100 },
    chairs: [
      {
        part: "cello1",
        label: "Melody",
        playerChair: true,
        stem: "twinkle-duo/cello1"
      },
      {
        part: "cello2",
        label: "Second cello",
        musician: "fox-cello",
        stem: "twinkle-duo/cello2"
      }
    ]
  }
];

// Once every card is collected a chest has nothing left to hand out, so it
// pays notes instead. This is the only place notes come from besides practice.
export const FULL_COLLECTION_NOTES = 3;
export const MIN_SESSION_MINUTES = 1;
// One qualifying day, one chest. A day cannot be split into two rewards.
export const MAX_CHESTS_PER_DAY = 1;
// Playing a piece from memory earns one extra chest a day — memorising is the
// step that actually turns practice into music, and it cannot be farmed by
// restarting a timer.
export const MAX_MEMORY_CHESTS_PER_DAY = 1;
export const FREEZE_GRANT_DAYS = 14;
export const MAX_FREEZES = 2;

// Bumped when the shape of the saved state changes. Schema 1 kept a single
// global collection, which is what let one animal appear unlocked in every
// band and every ensemble at the same time.
export const SCHEMA_VERSION = 2;

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
  schemaVersion: SCHEMA_VERSION,
  dailyTargetMin: DEFAULT_TARGET_MIN,
  sessions: [],
  // Chest collection, scoped per band: collecting an animal for one band does
  // not unlock that animal anywhere else.
  bandStickers: {},
  bandInstruments: {},
  notes: 0,
  freezes: 1,
  lastFreezeGrant: dateKey(),
  chestsToday: { date: dateKey(), count: 0 },
  memoryToday: { date: dateKey(), count: 0 },
  // Chests earned today, still sealed. They open tomorrow — see openChest.
  pendingChests: [],
  // Ensemble ladder: musicians owned per ensemble (only awarded by the
  // teacher, never rolled from the chest) plus per-ensemble
  // rehearsal/premiere progress.
  ensembleMusicians: {},
  ensembles: {}
});

// --- Group gating -------------------------------------------------------
// Only one band and one ensemble are ever "open": the first one that is not
// finished yet. Everything past it stays locked, so an animal can never be
// earned — or shown as unlocked — for a group the player has not reached.

export const getBand = (key) => BANDS.find((band) => band.key === key);

export const getBandStickers = (state, bandKey) =>
  state.bandStickers?.[bandKey] || {};

export const isMusicianCollected = (state, bandKey, key) =>
  (getBandStickers(state, bandKey)[key] || 0) > 0;

export const isMusicianEquipped = (state, bandKey, key) =>
  Boolean(state.bandInstruments?.[bandKey]?.[key]);

export const isBandCollected = (state, band) =>
  band.members.every((key) => isMusicianCollected(state, band.key, key));

export const getActiveBandIndex = (state) => {
  const index = BANDS.findIndex((band) => !isBandCollected(state, band));
  return index === -1 ? BANDS.length - 1 : index;
};

export const getActiveBand = (state) => BANDS[getActiveBandIndex(state)];

export const isBandUnlocked = (state, bandKey) =>
  BANDS.findIndex((band) => band.key === bandKey) <= getActiveBandIndex(state);

export const getEnsembleMusicians = (state, ensembleKey) =>
  state.ensembleMusicians?.[ensembleKey] || {};

export const isMusicianOwned = (state, ensembleKey, key) =>
  Boolean(getEnsembleMusicians(state, ensembleKey)[key]);

export const isEnsembleStaffed = (state, ensemble) =>
  ensemble.chairs.every(
    (chair) => chair.playerChair || isMusicianOwned(state, ensemble.key, chair.musician)
  );

export const getActiveEnsembleIndex = (state) => {
  const index = ENSEMBLES.findIndex((ensemble) => !isEnsembleStaffed(state, ensemble));
  return index === -1 ? ENSEMBLES.length - 1 : index;
};

export const getActiveEnsemble = (state) => ENSEMBLES[getActiveEnsembleIndex(state)];

export const isEnsembleUnlocked = (state, ensembleKey) =>
  ENSEMBLES.findIndex((ensemble) => ensemble.key === ensembleKey) <=
  getActiveEnsembleIndex(state);

// --- Saved state: migration and repair ----------------------------------

// Schema 1 stored one global `stickers` / `musicians` map, so a single animal
// counted for every group at once and the chest could hand out an animal that
// belongs to a later band. Everything outside the very first group is dropped;
// progress inside it is kept.
const migrateLegacyState = (state, parsed) => {
  const legacyStickers = parsed.stickers || {};
  const legacyEquipped = parsed.equippedInstruments || {};
  const firstBand = BANDS[0];
  const stickers = {};
  const instruments = {};
  for (const key of firstBand.members) {
    if ((legacyStickers[key] || 0) > 0) {
      stickers[key] = legacyStickers[key];
      if (legacyEquipped[key]) instruments[key] = true;
    }
  }
  state.bandStickers = { [firstBand.key]: stickers };
  state.bandInstruments = { [firstBand.key]: instruments };

  const legacyMusicians = parsed.musicians || {};
  const firstEnsemble = ENSEMBLES[0];
  const owned = {};
  for (const chair of firstEnsemble.chairs) {
    if (chair.playerChair) continue;
    if (legacyMusicians[chair.musician]) {
      owned[chair.musician] = legacyMusicians[chair.musician];
    }
  }
  state.ensembleMusicians = { [firstEnsemble.key]: owned };
  return state;
};

// Idempotent repair, run on every load: an animal may only sit in a group it
// actually belongs to, and no group past the one currently being worked on may
// hold anything at all.
const repairState = (state) => {
  const bandStickers = {};
  const bandInstruments = {};
  for (const band of BANDS) {
    const stickers = {};
    const instruments = {};
    for (const key of band.members) {
      const count = state.bandStickers?.[band.key]?.[key] || 0;
      if (count > 0) {
        // A card is owned or it isn't: the chest never deals a card twice, so
        // older saves with stacked duplicates collapse to a single card here.
        stickers[key] = 1;
        if (state.bandInstruments?.[band.key]?.[key]) instruments[key] = true;
      }
    }
    bandStickers[band.key] = stickers;
    bandInstruments[band.key] = instruments;
  }
  state.bandStickers = bandStickers;
  state.bandInstruments = bandInstruments;
  for (const band of BANDS.slice(getActiveBandIndex(state) + 1)) {
    state.bandStickers[band.key] = {};
    state.bandInstruments[band.key] = {};
  }

  const ensembleMusicians = {};
  for (const ensemble of ENSEMBLES) {
    const owned = {};
    for (const chair of ensemble.chairs) {
      if (chair.playerChair) continue;
      const entry = state.ensembleMusicians?.[ensemble.key]?.[chair.musician];
      if (entry) owned[chair.musician] = entry;
    }
    ensembleMusicians[ensemble.key] = owned;
  }
  state.ensembleMusicians = ensembleMusicians;
  for (const ensemble of ENSEMBLES.slice(getActiveEnsembleIndex(state) + 1)) {
    state.ensembleMusicians[ensemble.key] = {};
  }

  state.pendingChests = (state.pendingChests || [])
    .filter((chest) => chest && typeof chest.earnedOn === "string")
    .map((chest) => ({
      earnedOn: chest.earnedOn,
      goldenWeek: !!chest.goldenWeek,
      ...(chest.source ? { source: chest.source } : {})
    }));

  const today = dateKey();
  const memory = state.memoryToday;
  state.memoryToday =
    memory && memory.date === today
      ? { date: today, count: Number(memory.count) || 0 }
      : { date: today, count: 0 };

  state.schemaVersion = SCHEMA_VERSION;
  return state;
};

export const getGamifyState = (studentId) => {
  if (!studentId) return defaultState();
  try {
    const raw = localStorage.getItem(storageKey(studentId));
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const state = {
      ...defaultState(),
      ...parsed,
      chestsToday: parsed.chestsToday || defaultState().chestsToday,
      bandStickers: parsed.bandStickers || {},
      bandInstruments: parsed.bandInstruments || {},
      pendingChests: parsed.pendingChests || [],
      ensembleMusicians: parsed.ensembleMusicians || {},
      ensembles: parsed.ensembles || {}
    };
    if ((parsed.schemaVersion || 1) < SCHEMA_VERSION) {
      migrateLegacyState(state, parsed);
    }
    delete state.stickers;
    delete state.equippedInstruments;
    delete state.musicians;
    return repairState(state);
  } catch {
    return defaultState();
  }
};

const saveGamifyState = (studentId, state) => {
  localStorage.setItem(storageKey(studentId), JSON.stringify(state));
  window.dispatchEvent(new Event("gamify_updated"));
};

export const clampTarget = (minutes) =>
  Math.min(MAX_TARGET_MIN, Math.max(MIN_TARGET_MIN, Math.round(minutes)));

export const setDailyTarget = (studentId, minutes) => {
  const state = getGamifyState(studentId);
  state.dailyTargetMin = clampTarget(Number(minutes) || DEFAULT_TARGET_MIN);
  saveGamifyState(studentId, state);
  return state.dailyTargetMin;
};

export const resetStudent = (studentId) => {
  localStorage.removeItem(storageKey(studentId));
  window.dispatchEvent(new Event("gamify_updated"));
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

// --- Practising at the same time every day ------------------------------
// A habit is built by the cue, not by the reward: same hour, same place, and
// after a few weeks the cello case opens itself. The app therefore notices
// when a session starts at the child's usual time — only to say so, never to
// take anything away for being late.
export const USUAL_TIME_WINDOW_MIN = 90;
const USUAL_TIME_LOOKBACK_DAYS = 21;
const MIN_SESSIONS_FOR_USUAL = 3;

const minutesOfDay = (iso) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.getHours() * 60 + date.getMinutes();
};

// Median rather than mean: one late-evening session should not drag the whole
// habit an hour later.
export const getUsualStartMinute = (state) => {
  const since = shiftDateKey(dateKey(), -USUAL_TIME_LOOKBACK_DAYS);
  const times = (state.sessions || [])
    .filter((session) => session.at && session.date >= since)
    .map((session) => minutesOfDay(session.at))
    .filter((minute) => minute !== null)
    .sort((a, b) => a - b);
  if (times.length < MIN_SESSIONS_FOR_USUAL) return null;
  return times[Math.floor(times.length / 2)];
};

export const isAtUsualTime = (state, at = new Date()) => {
  const usual = getUsualStartMinute(state);
  if (usual === null) return false;
  const now = at.getHours() * 60 + at.getMinutes();
  const diff = Math.abs(now - usual);
  // The clock wraps: 23:30 and 00:30 are an hour apart, not 23.
  return Math.min(diff, 1440 - diff) <= USUAL_TIME_WINDOW_MIN;
};

// --- What earns a card --------------------------------------------------
// A chest is not paid for showing up. It takes a day that reached the daily
// goal *and* follows another such day: practising every day is the point, so a
// gap pauses the chests until the chain is two days long again. The day right
// after a gap rebuilds the chain and pays nothing — except the very first
// practice day of all, which has no gap behind it, only an empty calendar.
const hasPracticeBefore = (state, key) =>
  state.sessions.some((session) => session.date < key);

export const CHEST_BLOCKED = {
  goal: "goal", // practised, but short of today's goal
  recovery: "recovery" // goal reached, but yesterday was missed
};

export const chestBlockReason = (state, key = dateKey()) => {
  if (!hasBaton(state, key)) return CHEST_BLOCKED.goal;
  if (hasBaton(state, shiftDateKey(key, -1))) return null;
  return hasPracticeBefore(state, key) ? CHEST_BLOCKED.recovery : null;
};

export const dayEarnsChest = (state, key = dateKey()) =>
  chestBlockReason(state, key) === null;

// The chest only ever hands out an animal from the band the player is
// currently building — animals belonging to later bands stay in their box
// until the band in front of them is complete.
//
// A card is never dealt twice. Which card comes is a surprise, but every chest
// moves the collection forward, so the child is never handed something they
// already own. The rarity roll therefore only decides the *order* the cards
// arrive in: the legendary one tends to come last, which is what makes it feel
// earned. Returns null once there is nothing left to collect anywhere.
const rollSticker = (state) => {
  const band = getActiveBand(state);
  const missing = band.members
    .map(getMusician)
    .filter(Boolean)
    .filter((musician) => !isMusicianCollected(state, band.key, musician.key));
  if (!missing.length) return null;

  const roll = Math.random();
  const rarity = roll < 0.05 ? "legendary" : roll < 0.3 ? "rare" : "common";
  const byRarity = missing.filter((musician) => musician.rarity === rarity);
  const pool = byRarity.length ? byRarity : missing;

  return { band, musician: pool[Math.floor(Math.random() * pool.length)] };
};

export const getMusician = (key) => MUSICIANS.find((musician) => musician.key === key);

// What today's practice is playing for. The child sees this *before* starting,
// because that is where the motivation is needed — the hard part is picking up
// the cello, not finishing. The animals shown are the ones the active band is
// still missing: which one arrives stays open, that it arrives is certain.
export const getChestStake = (state) => {
  const band = getActiveBand(state);
  const today = dateKey();
  const missing = band.members
    .map(getMusician)
    .filter(Boolean)
    .filter((musician) => !isMusicianCollected(state, band.key, musician.key));
  return {
    band,
    candidates: missing,
    collectionComplete: !missing.length,
    // What today still needs before it seals a chest.
    blocked: chestBlockReason(state, today),
    minutesToGoal: Math.max(
      0,
      Math.ceil(state.dailyTargetMin * 0.75 - minutesOnDay(state, today))
    ),
    targetMin: state.dailyTargetMin
  };
};

// Chests are sealed on the day they are earned and can only be opened the day
// after. The wait moves the reveal out of the practice session — the child
// opens it in the morning, so the excitement lands when the app is opened
// rather than while fingers should be on the fingerboard, and tomorrow gets a
// reason of its own.
export const getOpenableChests = (state) => {
  const today = dateKey();
  return (state.pendingChests || []).filter((chest) => chest.earnedOn < today);
};

export const getSealedChests = (state) => {
  const today = dateKey();
  return (state.pendingChests || []).filter((chest) => chest.earnedOn >= today);
};

// Opens the oldest chest that has waited its night out. The animal is drawn
// now, not when the chest was earned, so nothing is decided in advance.
export const openChest = (studentId) => {
  const state = getGamifyState(studentId);
  const openable = getOpenableChests(state);
  if (!openable.length) return { ok: false, reason: "no_chest" };

  const chest = openable[0];
  const index = state.pendingChests.indexOf(chest);
  state.pendingChests = state.pendingChests.filter((_, i) => i !== index);

  const drawn = rollSticker(state);
  if (!drawn) {
    // Nothing left to collect: the chest pays notes so it is still worth
    // opening, and the collection stays a set of unique cards.
    state.notes = (state.notes || 0) + FULL_COLLECTION_NOTES;
    saveGamifyState(studentId, state);
    return {
      ok: true,
      reward: {
        chestOnly: true,
        collectionComplete: true,
        notes: state.notes,
        chestsLeft: getOpenableChests(state).length
      }
    };
  }

  const { band, musician } = drawn;
  state.bandStickers = {
    ...state.bandStickers,
    [band.key]: { ...(state.bandStickers?.[band.key] || {}), [musician.key]: 1 }
  };
  saveGamifyState(studentId, state);

  return {
    ok: true,
    reward: {
      chestOnly: true,
      sticker: musician,
      stickerBand: { key: band.key, name: band.name },
      notes: state.notes,
      chestsLeft: getOpenableChests(state).length
    }
  };
};

// Playing a piece from memory is the one thing besides practice time that
// earns a chest. It is claimed by the child at the end of a session, so it only
// counts on a day that was actually practised, and only once — the reward for
// claiming it twice would be nothing anyway, since no card is ever dealt twice.
export const canClaimMemoryPlay = (state) => {
  const today = dateKey();
  // Same gate as the daily chest: a day that does not count for a card does
  // not count for this one either.
  if (!dayEarnsChest(state, today)) return false;
  const claimed = state.memoryToday?.date === today ? state.memoryToday.count : 0;
  return claimed < MAX_MEMORY_CHESTS_PER_DAY;
};

export const logMemoryPlay = (studentId) => {
  const state = getGamifyState(studentId);
  const today = dateKey();
  if (!dayEarnsChest(state, today)) return { ok: false, reason: "day_does_not_count" };
  if (!canClaimMemoryPlay(state)) return { ok: false, reason: "already_claimed" };

  state.memoryToday =
    state.memoryToday?.date === today
      ? { date: today, count: state.memoryToday.count + 1 }
      : { date: today, count: 1 };

  const chest = { earnedOn: today, goldenWeek: isGoldenWeek(state), source: "memory" };
  state.pendingChests = [...(state.pendingChests || []), chest];
  saveGamifyState(studentId, state);

  return { ok: true, sealedChest: { opensOn: shiftDateKey(today, 1) } };
};

export const equipMusician = (studentId, bandKey, key) => {
  const state = getGamifyState(studentId);
  const band = getBand(bandKey);
  const musician = getMusician(key);

  if (!band || !musician) return { ok: false, reason: "missing_musician" };
  if (!band.members.includes(key)) return { ok: false, reason: "not_in_band" };
  if (!isBandUnlocked(state, bandKey)) return { ok: false, reason: "band_locked" };
  if (!isMusicianCollected(state, bandKey, key)) {
    return { ok: false, reason: "not_collected" };
  }
  if (isMusicianEquipped(state, bandKey, key)) return { ok: true, state };
  if ((state.notes || 0) < musician.instrumentCost) {
    return { ok: false, reason: "not_enough_notes" };
  }

  state.notes -= musician.instrumentCost;
  state.bandInstruments = {
    ...state.bandInstruments,
    [bandKey]: { ...(state.bandInstruments?.[bandKey] || {}), [key]: true }
  };
  saveGamifyState(studentId, state);
  return { ok: true, state };
};

export const getBandProgress = (state, band, activeIndex = getActiveBandIndex(state)) => {
  const index = BANDS.findIndex((entry) => entry.key === band.key);
  const unlocked = index <= activeIndex;
  const members = band.members.map((key) => {
    const musician = getMusician(key);
    const count = unlocked ? getBandStickers(state, band.key)[key] || 0 : 0;
    return {
      ...musician,
      collected: count > 0,
      equipped: unlocked && isMusicianEquipped(state, band.key, key),
      count
    };
  });
  const collectedCount = members.filter((member) => member.collected).length;
  const readyCount = members.filter((member) => member.equipped).length;
  return {
    ...band,
    index,
    unlocked,
    locked: !unlocked,
    // Which band has to be finished before this one opens up.
    requires: unlocked ? null : BANDS[activeIndex].name,
    members,
    collectedCount,
    readyCount,
    complete: unlocked && readyCount === members.length
  };
};

export const getBandSummaries = (state) => {
  const activeIndex = getActiveBandIndex(state);
  return BANDS.map((band) => getBandProgress(state, band, activeIndex));
};

// The whole collection laid out as a shelf: every slot of every band, empty
// ones included, in the order the cards can be won. The empty slots are the
// point — a child seeing the gaps knows exactly what is still out there, and
// `collected` is the flat list the full-screen viewer pages through, so paging
// crosses band boundaries instead of stopping at the end of a row.
export const getCollectionShelf = (state) => {
  const sections = getBandSummaries(state).map((band) => ({
    key: band.key,
    name: band.name,
    sizeLabel: band.sizeLabel,
    unlocked: band.unlocked,
    locked: band.locked,
    requires: band.requires,
    collectedCount: band.collectedCount,
    slots: band.members.map((member) => ({
      ...member,
      bandKey: band.key,
      bandName: band.name
    }))
  }));

  const collected = sections.flatMap((section) =>
    section.slots.filter((slot) => slot.collected)
  );

  return {
    sections,
    collected,
    owned: collected.length,
    total: sections.reduce((sum, section) => sum + section.slots.length, 0)
  };
};

export const getEnsemble = (key) =>
  ENSEMBLES.find((ensemble) => ensemble.key === key);

// Ensemble musicians are only awarded — by the teacher for a real milestone,
// never rolled from the chest — and always into one specific ensemble.
export const awardMusician = (studentId, ensembleKey, key, source = "teacher") => {
  const ensemble = getEnsemble(ensembleKey);
  const musician = getMusician(key);
  if (!ensemble || !musician) return { ok: false, reason: "missing_musician" };
  if (!ensemble.chairs.some((chair) => chair.musician === key)) {
    return { ok: false, reason: "no_such_chair" };
  }
  const state = getGamifyState(studentId);
  if (!isEnsembleUnlocked(state, ensembleKey)) {
    return { ok: false, reason: "ensemble_locked" };
  }
  if (isMusicianOwned(state, ensembleKey, key)) {
    return { ok: false, reason: "already_owned" };
  }
  state.ensembleMusicians = {
    ...state.ensembleMusicians,
    [ensembleKey]: {
      ...(state.ensembleMusicians?.[ensembleKey] || {}),
      [key]: { ownedAt: new Date().toISOString(), source }
    }
  };
  saveGamifyState(studentId, state);
  return { ok: true, state };
};

export const getEnsembleProgress = (state, ensemble, options = {}) => {
  const activeIndex = options.activeIndex ?? getActiveEnsembleIndex(state);
  const index = ENSEMBLES.findIndex((entry) => entry.key === ensemble.key);
  const unlocked = index <= activeIndex;
  const chairs = ensemble.chairs.map((chair) => ({
    ...chair,
    musicianInfo: chair.musician ? getMusician(chair.musician) : null,
    owned: chair.playerChair
      ? true
      : unlocked && isMusicianOwned(state, ensemble.key, chair.musician)
  }));
  const missing = chairs.filter((chair) => !chair.owned).length;
  const entry = state.ensembles?.[ensemble.key] || {};
  const rehearsals = entry.rehearsals?.length || 0;
  const premieredAt = entry.premieredAt || null;
  return {
    ...ensemble,
    index,
    unlocked,
    locked: !unlocked,
    requires: unlocked ? null : ENSEMBLES[activeIndex].name,
    chairs,
    missing,
    complete: missing === 0,
    rehearsals,
    premieredAt,
    canPremiere:
      missing === 0 && !premieredAt && rehearsals >= ensemble.rehearsalsNeeded
  };
};

export const getEnsembleSummaries = (state) => {
  const activeIndex = getActiveEnsembleIndex(state);
  return ENSEMBLES.map((ensemble) =>
    getEnsembleProgress(state, ensemble, { activeIndex })
  );
};

// A practice day counts as one rehearsal for every complete ensemble that
// hasn't premiered yet. Rehearsals are practice *days*, not sessions, so
// restarting the timer can't farm them.
const logRehearsals = (state, today) => {
  const earned = [];
  for (const ensemble of ENSEMBLES) {
    const progress = getEnsembleProgress(state, ensemble);
    if (!progress.complete || progress.premieredAt) continue;
    const entry = state.ensembles[ensemble.key] || { rehearsals: [] };
    const rehearsals = entry.rehearsals || [];
    if (rehearsals.includes(today)) continue;
    state.ensembles = {
      ...state.ensembles,
      [ensemble.key]: { ...entry, rehearsals: [...rehearsals, today] }
    };
    earned.push({
      key: ensemble.key,
      name: ensemble.name,
      rehearsals: rehearsals.length + 1,
      rehearsalsNeeded: ensemble.rehearsalsNeeded
    });
  }
  return earned;
};

// The premiere is the ensemble's full concert — only after enough rehearsal
// days. Premiering is a one-time event; afterwards the stage stays open for
// replays.
export const premiere = (studentId, ensembleKey) => {
  const ensemble = getEnsemble(ensembleKey);
  if (!ensemble) return { ok: false, reason: "missing_ensemble" };
  const state = getGamifyState(studentId);
  const progress = getEnsembleProgress(state, ensemble);
  if (!progress.canPremiere) {
    return {
      ok: false,
      reason: progress.premieredAt ? "already_premiered" : "not_ready"
    };
  }
  state.ensembles = {
    ...state.ensembles,
    [ensembleKey]: {
      ...(state.ensembles[ensembleKey] || { rehearsals: [] }),
      premieredAt: new Date().toISOString()
    }
  };
  saveGamifyState(studentId, state);
  return { ok: true, state };
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
  // Asked before today's session is recorded, so the habit is judged against
  // the days before it rather than against itself.
  const onTime = isAtUsualTime(state);
  state.sessions.push({ date: today, minutes, at: new Date().toISOString() });
  state.notes = (state.notes || 0) + 1;

  // Earn a streak freeze ("magic rosin") every two weeks of use.
  const graceAge =
    (new Date(today) - new Date(state.lastFreezeGrant || today)) / 86400000;
  if (graceAge >= FREEZE_GRANT_DAYS && state.freezes < MAX_FREEZES) {
    state.freezes += 1;
    state.lastFreezeGrant = today;
  }

  // The chest is earned now but stays sealed until tomorrow (see openChest).
  // Capped per day so restarting the timer over and over doesn't farm chests.
  if (state.chestsToday.date !== today) {
    state.chestsToday = { date: today, count: 0 };
  }
  const blockedBecause = chestBlockReason(state, today);
  let sealedChest = null;
  if (!blockedBecause && state.chestsToday.count < MAX_CHESTS_PER_DAY) {
    state.chestsToday.count += 1;
    // The golden-week upgrade is banked with the chest, so waiting a night
    // can never cost the child the better odds they practised for.
    const chest = { earnedOn: today, goldenWeek: isGoldenWeek(state) };
    state.pendingChests = [...(state.pendingChests || []), chest];
    sealedChest = { opensOn: shiftDateKey(today, 1), goldenWeek: chest.goldenWeek };
  }

  const rehearsals = logRehearsals(state, today);

  saveGamifyState(studentId, state);

  return {
    minutes,
    rehearsals,
    dayTotal: Math.round(minutesOnDay(state, today)),
    targetMin: state.dailyTargetMin,
    baton: hasBaton(state, today),
    batonJustEarned: !batonBefore && hasBaton(state, today),
    overTarget: minutesOnDay(state, today) > state.dailyTargetMin * 1.25,
    streak: getStreak(state),
    goldenWeek: isGoldenWeek(state),
    sealedChest,
    onTime,
    chestBlocked: blockedBecause,
    minutesToGoal: Math.max(
      0,
      Math.ceil(state.dailyTargetMin * 0.75 - minutesOnDay(state, today))
    ),
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
