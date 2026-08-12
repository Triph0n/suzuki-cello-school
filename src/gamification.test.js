import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  dateKey,
  getGamifyState,
  getStreak,
  getWeek,
  hasBaton,
  isGoldenWeek,
  finishSession,
  setDailyTarget,
  clampTarget,
  MUSICIANS,
  BANDS,
  ENSEMBLES,
  MIN_TARGET_MIN,
  MAX_TARGET_MIN,
  DEFAULT_TARGET_MIN,
  awardMusician,
  equipMusician,
  isMusicianOwned,
  isMusicianCollected,
  getActiveBand,
  getBandProgress,
  getBandSummaries,
  getEnsembleProgress,
  getChestStake,
  getCollectionShelf,
  getOpenableChests,
  getSealedChests,
  canClaimMemoryPlay,
  getUsualStartMinute,
  isAtUsualTime,
  logMemoryPlay,
  openChest,
  premiere,
  SCHEMA_VERSION
} from "./gamification";

const STUDENT = "test-student";
const KEY = `gamify_${STUDENT}`;

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateKey(d);
};

const seedState = (overrides = {}) => {
  const state = { ...getGamifyState(STUDENT), ...overrides };
  localStorage.setItem(KEY, JSON.stringify(state));
  return state;
};

// A chest earned N days ago, i.e. one that is ready to be opened today.
const chestFrom = (daysBack, goldenWeek = false) => ({
  earnedOn: daysAgo(daysBack),
  goldenWeek
});

// Marks every member of the given bands as collected (count 1, unequipped).
const collectBands = (...bandKeys) => {
  const bandStickers = {};
  for (const key of bandKeys) {
    const band = BANDS.find((b) => b.key === key);
    bandStickers[key] = Object.fromEntries(band.members.map((m) => [m, 1]));
  }
  return bandStickers;
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("dateKey", () => {
  it("formats a date as YYYY-MM-DD in local time", () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("daily target", () => {
  it("defaults to the design-doc target", () => {
    expect(getGamifyState(STUDENT).dailyTargetMin).toBe(DEFAULT_TARGET_MIN);
  });

  it("stores an in-range target", () => {
    expect(setDailyTarget(STUDENT, 25)).toBe(25);
    expect(getGamifyState(STUDENT).dailyTargetMin).toBe(25);
  });

  it("clamps out-of-range targets", () => {
    expect(clampTarget(1)).toBe(MIN_TARGET_MIN);
    expect(clampTarget(600)).toBe(MAX_TARGET_MIN);
    expect(setDailyTarget(STUDENT, 0)).toBe(DEFAULT_TARGET_MIN);
    expect(setDailyTarget(STUDENT, 9999)).toBe(MAX_TARGET_MIN);
  });
});

describe("getStreak", () => {
  it("counts consecutive practice days ending today", () => {
    seedState({
      sessions: [0, 1, 2].map((n) => ({ date: daysAgo(n), minutes: 10 }))
    });
    expect(getStreak(getGamifyState(STUDENT))).toBe(3);
  });

  it("does not break the streak before today's practice happened", () => {
    seedState({
      sessions: [1, 2].map((n) => ({ date: daysAgo(n), minutes: 10 }))
    });
    expect(getStreak(getGamifyState(STUDENT))).toBe(2);
  });

  it("bridges a single missed day with a freeze", () => {
    seedState({
      freezes: 1,
      sessions: [0, 2, 3].map((n) => ({ date: daysAgo(n), minutes: 10 }))
    });
    expect(getStreak(getGamifyState(STUDENT))).toBe(3);
  });

  it("breaks without a freeze", () => {
    seedState({
      freezes: 0,
      sessions: [0, 2, 3].map((n) => ({ date: daysAgo(n), minutes: 10 }))
    });
    expect(getStreak(getGamifyState(STUDENT))).toBe(1);
  });
});

describe("hasBaton / getWeek", () => {
  it("earns the baton at 75 % of the daily target", () => {
    seedState({
      dailyTargetMin: 20,
      sessions: [{ date: daysAgo(0), minutes: 15 }]
    });
    expect(hasBaton(getGamifyState(STUDENT), daysAgo(0))).toBe(true);
  });

  it("withholds the baton below 75 %", () => {
    seedState({
      dailyTargetMin: 20,
      sessions: [{ date: daysAgo(0), minutes: 14 }]
    });
    expect(hasBaton(getGamifyState(STUDENT), daysAgo(0))).toBe(false);
  });

  it("returns 7 days with today last", () => {
    const week = getWeek(getGamifyState(STUDENT));
    expect(week).toHaveLength(7);
    expect(week[6].isToday).toBe(true);
  });

  it("golden week needs 5 baton days", () => {
    seedState({
      dailyTargetMin: 10,
      sessions: [0, 1, 2, 3, 4].map((n) => ({ date: daysAgo(n), minutes: 10 }))
    });
    expect(isGoldenWeek(getGamifyState(STUDENT))).toBe(true);
  });
});

describe("finishSession", () => {
  it("rejects sessions under one minute", () => {
    const result = finishSession(STUDENT, 45);
    expect(result.tooShort).toBe(true);
    expect(getGamifyState(STUDENT).sessions).toHaveLength(0);
  });

  it("records minutes and seals a chest for tomorrow", () => {
    setDailyTarget(STUDENT, 10);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = finishSession(STUDENT, 600);
    expect(result.minutes).toBe(10);
    expect(result.sealedChest).toBeTruthy();
    // Nothing is revealed or collected on the day the chest is earned.
    expect(result.sticker).toBeUndefined();
    const state = getGamifyState(STUDENT);
    expect(state.bandStickers[BANDS[0].key]).toEqual({});
    expect(getSealedChests(state)).toHaveLength(1);
    expect(getOpenableChests(state)).toHaveLength(0);
  });

  it("gives no chest for a day that misses the goal", () => {
    setDailyTarget(STUDENT, 20);
    const result = finishSession(STUDENT, 120);
    expect(result.sealedChest).toBeNull();
    expect(result.chestBlocked).toBe("goal");
    expect(result.minutesToGoal).toBeGreaterThan(0);
    expect(getGamifyState(STUDENT).pendingChests).toHaveLength(0);
  });

  it("caps chests at one per day, however often the timer is restarted", () => {
    setDailyTarget(STUDENT, 10);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    finishSession(STUDENT, 600);
    const second = finishSession(STUDENT, 600);
    expect(second.sealedChest).toBeNull();
    const state = getGamifyState(STUDENT);
    expect(state.chestsToday.count).toBe(1);
    expect(state.pendingChests).toHaveLength(1);
  });

  it("pays nothing on the day that follows a missed one", () => {
    // Practised the day before yesterday, missed yesterday: today rebuilds the
    // run instead of paying out.
    seedState({
      dailyTargetMin: 10,
      sessions: [{ date: daysAgo(2), minutes: 10 }]
    });
    const result = finishSession(STUDENT, 600);
    expect(result.sealedChest).toBeNull();
    expect(result.chestBlocked).toBe("recovery");
    expect(getGamifyState(STUDENT).pendingChests).toHaveLength(0);
  });

  it("pays again on the second goal day in a row", () => {
    seedState({
      dailyTargetMin: 10,
      sessions: [{ date: daysAgo(2), minutes: 10 }, { date: daysAgo(1), minutes: 10 }]
    });
    const result = finishSession(STUDENT, 600);
    expect(result.chestBlocked).toBeNull();
    expect(result.sealedChest).toBeTruthy();
  });

  it("does not treat the very first practice day as a broken run", () => {
    setDailyTarget(STUDENT, 10);
    const result = finishSession(STUDENT, 600);
    expect(result.chestBlocked).toBeNull();
    expect(result.sealedChest).toBeTruthy();
  });

  it("records the golden week on the chest", () => {
    seedState({
      dailyTargetMin: 10,
      sessions: [1, 2, 3, 4, 5].map((n) => ({ date: daysAgo(n), minutes: 10 }))
    });
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = finishSession(STUDENT, 600);
    expect(result.sealedChest.goldenWeek).toBe(true);
    expect(getGamifyState(STUDENT).pendingChests[0].goldenWeek).toBe(true);
  });

  it("flags practicing far over the target", () => {
    setDailyTarget(STUDENT, 10);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = finishSession(STUDENT, 20 * 60);
    expect(result.overTarget).toBe(true);
    expect(result.baton).toBe(true);
  });
});

describe("sealed chests", () => {
  it("refuses to open a chest earned today", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    setDailyTarget(STUDENT, 10);
    finishSession(STUDENT, 600);
    expect(openChest(STUDENT)).toEqual({ ok: false, reason: "no_chest" });
    expect(getGamifyState(STUDENT).pendingChests).toHaveLength(1);
  });

  it("opens a chest that waited a night and collects the animal", () => {
    seedState({ pendingChests: [chestFrom(1)] });
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const outcome = openChest(STUDENT);
    expect(outcome.ok).toBe(true);
    expect(outcome.reward.chestOnly).toBe(true);
    expect(BANDS[0].members).toContain(outcome.reward.sticker.key);
    const state = getGamifyState(STUDENT);
    expect(isMusicianCollected(state, BANDS[0].key, outcome.reward.sticker.key)).toBe(true);
    expect(state.pendingChests).toHaveLength(0);
  });

  it("opens one chest at a time, oldest first", () => {
    seedState({ pendingChests: [chestFrom(2), chestFrom(1)] });
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const first = openChest(STUDENT);
    expect(first.reward.chestsLeft).toBe(1);
    const state = getGamifyState(STUDENT);
    expect(state.pendingChests).toEqual([chestFrom(1)]);
  });

  it("never opens an animal from a band the player has not reached", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.04); // legendary rarity roll
    for (let i = 0; i < 200; i++) {
      localStorage.clear();
      seedState({ pendingChests: [chestFrom(1)] });
      const { reward } = openChest(STUDENT);
      expect(reward.stickerBand.key).toBe(BANDS[0].key);
      expect(BANDS[0].members).toContain(reward.sticker.key);
    }
  });

  it("draws from the next band once the one in front of it is collected", () => {
    seedState({
      bandStickers: collectBands(BANDS[0].key),
      pendingChests: [chestFrom(1)]
    });
    expect(getActiveBand(getGamifyState(STUDENT)).key).toBe(BANDS[1].key);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const { reward } = openChest(STUDENT);
    expect(reward.stickerBand.key).toBe(BANDS[1].key);
    expect(BANDS[1].members).toContain(reward.sticker.key);
  });

  it("never deals a card the player already owns", () => {
    const [first, second] = BANDS[0].members;
    seedState({
      bandStickers: { [BANDS[0].key]: { [first]: 1 } },
      pendingChests: [chestFrom(1)]
    });
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const { reward } = openChest(STUDENT);
    expect(reward.sticker.key).toBe(second);
    expect(reward.duplicate).toBeUndefined();
  });

  it("keeps every card unique however many chests are opened", () => {
    const chests = Array.from({ length: 15 }, () => chestFrom(1));
    seedState({ pendingChests: chests });
    for (let i = 0; i < chests.length; i++) openChest(STUDENT);
    const state = getGamifyState(STUDENT);
    for (const band of BANDS) {
      for (const key of band.members) {
        expect(state.bandStickers[band.key][key] ?? 0).toBeLessThanOrEqual(1);
      }
    }
  });

  it("collects every card in the set and then pays notes", () => {
    seedState({
      bandStickers: collectBands(...BANDS.map((band) => band.key)),
      notes: 0,
      pendingChests: [chestFrom(1)]
    });
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const { reward } = openChest(STUDENT);
    expect(reward.collectionComplete).toBe(true);
    expect(reward.sticker).toBeUndefined();
    expect(reward.notes).toBeGreaterThan(0);
  });

  it("collapses duplicates stored by an older version", () => {
    seedState({ bandStickers: { [BANDS[0].key]: { [BANDS[0].members[0]]: 4 } } });
    const state = getGamifyState(STUDENT);
    expect(state.bandStickers[BANDS[0].key][BANDS[0].members[0]]).toBe(1);
  });

  it("names what today plays for without revealing the outcome", () => {
    const stake = getChestStake(getGamifyState(STUDENT));
    expect(stake.band.key).toBe(BANDS[0].key);
    expect(stake.candidates.map((m) => m.key).sort()).toEqual(
      [...BANDS[0].members].sort()
    );
    expect(stake.collectionComplete).toBe(false);
  });

  it("only names cards that are still missing", () => {
    const [first, second] = BANDS[0].members;
    seedState({ bandStickers: { [BANDS[0].key]: { [first]: 1 } } });
    const stake = getChestStake(getGamifyState(STUDENT));
    expect(stake.candidates.map((m) => m.key)).toEqual([second]);
  });

  it("drops malformed pending chests on load", () => {
    seedState({ pendingChests: [chestFrom(1), null, { nonsense: true }] });
    expect(getGamifyState(STUDENT).pendingChests).toEqual([chestFrom(1)]);
  });
});

// A day that qualifies for a chest: today's goal reached, and yesterday's too.
const qualifyingDay = () => ({
  dailyTargetMin: 10,
  sessions: [
    { date: daysAgo(1), minutes: 10 },
    { date: daysAgo(0), minutes: 10 }
  ]
});

describe("playing from memory", () => {
  it("cannot be claimed on a day without practice", () => {
    expect(canClaimMemoryPlay(getGamifyState(STUDENT))).toBe(false);
    expect(logMemoryPlay(STUDENT)).toEqual({
      ok: false,
      reason: "day_does_not_count"
    });
  });

  it("cannot be claimed on a day that misses the goal", () => {
    seedState({ dailyTargetMin: 20, sessions: [{ date: daysAgo(0), minutes: 2 }] });
    expect(canClaimMemoryPlay(getGamifyState(STUDENT))).toBe(false);
  });

  it("seals an extra chest after a practised day", () => {
    seedState(qualifyingDay());
    expect(canClaimMemoryPlay(getGamifyState(STUDENT))).toBe(true);

    const outcome = logMemoryPlay(STUDENT);
    expect(outcome.ok).toBe(true);
    const state = getGamifyState(STUDENT);
    expect(state.pendingChests).toHaveLength(1);
    expect(state.pendingChests[0].source).toBe("memory");
    // Sealed like every other chest: it opens tomorrow, not now.
    expect(getOpenableChests(state)).toHaveLength(0);
    expect(getSealedChests(state)).toHaveLength(1);
  });

  it("counts only once a day", () => {
    seedState(qualifyingDay());
    expect(logMemoryPlay(STUDENT).ok).toBe(true);
    expect(logMemoryPlay(STUDENT)).toEqual({ ok: false, reason: "already_claimed" });
    expect(getGamifyState(STUDENT).pendingChests).toHaveLength(1);
  });

  it("forgets yesterday's claim", () => {
    seedState({ ...qualifyingDay(), memoryToday: { date: daysAgo(1), count: 1 } });
    expect(canClaimMemoryPlay(getGamifyState(STUDENT))).toBe(true);
  });
});

describe("practising at the usual time", () => {
  // A session that started at a given hour on a given day.
  const at = (daysBack, hour, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);
    d.setHours(hour, minute, 0, 0);
    return { date: daysAgo(daysBack), minutes: 12, at: d.toISOString() };
  };

  it("has no opinion until there are a few sessions to go on", () => {
    seedState({ sessions: [at(1, 16), at(2, 16)] });
    const state = getGamifyState(STUDENT);
    expect(getUsualStartMinute(state)).toBeNull();
    expect(isAtUsualTime(state, new Date(2026, 0, 1, 16, 0))).toBe(false);
  });

  it("takes the median hour, so one late night does not move it", () => {
    seedState({ sessions: [at(1, 16), at(2, 16, 30), at(3, 23), at(4, 16, 15)] });
    const usual = getUsualStartMinute(getGamifyState(STUDENT));
    expect(usual).toBeGreaterThanOrEqual(16 * 60);
    expect(usual).toBeLessThanOrEqual(16 * 60 + 30);
  });

  it("recognises the usual hour and rejects a very different one", () => {
    seedState({ sessions: [at(1, 16), at(2, 16), at(3, 16)] });
    const state = getGamifyState(STUDENT);
    expect(isAtUsualTime(state, new Date(2026, 0, 1, 17, 0))).toBe(true);
    expect(isAtUsualTime(state, new Date(2026, 0, 1, 9, 0))).toBe(false);
  });

  it("treats the clock as a circle around midnight", () => {
    seedState({ sessions: [at(1, 23, 30), at(2, 23, 30), at(3, 23, 30)] });
    const state = getGamifyState(STUDENT);
    expect(isAtUsualTime(state, new Date(2026, 0, 1, 0, 30))).toBe(true);
  });

  it("ignores sessions older than the lookback window", () => {
    seedState({ sessions: [at(30, 16), at(31, 16), at(32, 16)] });
    expect(getUsualStartMinute(getGamifyState(STUDENT))).toBeNull();
  });
});

describe("collection shelf", () => {
  it("shows every slot of every band, empty ones included", () => {
    const shelf = getCollectionShelf(getGamifyState(STUDENT));
    expect(shelf.sections).toHaveLength(BANDS.length);
    expect(shelf.total).toBe(
      BANDS.reduce((sum, band) => sum + band.members.length, 0)
    );
    expect(shelf.owned).toBe(0);
    expect(shelf.collected).toEqual([]);
    expect(shelf.sections[0].slots).toHaveLength(BANDS[0].members.length);
  });

  it("lists collected cards flat, so paging crosses bands", () => {
    seedState({ bandStickers: collectBands(BANDS[0].key, BANDS[1].key) });
    const shelf = getCollectionShelf(getGamifyState(STUDENT));
    expect(shelf.owned).toBe(BANDS[0].members.length + BANDS[1].members.length);
    expect(shelf.collected.map((card) => card.bandKey)).toEqual([
      ...BANDS[0].members.map(() => BANDS[0].key),
      ...BANDS[1].members.map(() => BANDS[1].key)
    ]);
    // Each card knows which band it belongs to — the same animal can sit in
    // more than one band, and the card face has to say which one it is.
    expect(shelf.collected[0].bandName).toBe(BANDS[0].name);
  });

  it("keeps bands the player has not reached locked and empty", () => {
    const shelf = getCollectionShelf(getGamifyState(STUDENT));
    expect(shelf.sections[0].locked).toBe(false);
    expect(shelf.sections[1].locked).toBe(true);
    expect(shelf.sections[1].slots.every((slot) => !slot.collected)).toBe(true);
  });
});

describe("band scoping", () => {
  it("keeps a collected animal inside the band it was won for", () => {
    seedState({
      bandStickers: { [BANDS[0].key]: { "mouse-violin": 1 } }
    });
    const state = getGamifyState(STUDENT);
    expect(isMusicianCollected(state, BANDS[0].key, "mouse-violin")).toBe(true);
    // Mia also plays in the melody quartet — but not until it is reached.
    expect(isMusicianCollected(state, "melody-quartet", "mouse-violin")).toBe(false);
    const quartet = getBandProgress(state, BANDS.find((b) => b.key === "melody-quartet"));
    expect(quartet.locked).toBe(true);
    expect(quartet.members.every((m) => !m.collected)).toBe(true);
  });

  it("equips instruments per band and charges notes each time", () => {
    seedState({
      notes: 2,
      bandStickers: {
        [BANDS[0].key]: { "mouse-violin": 1, "rabbit-flute": 1 },
        [BANDS[1].key]: collectBands(BANDS[1].key)[BANDS[1].key]
      }
    });
    expect(equipMusician(STUDENT, BANDS[0].key, "mouse-violin").ok).toBe(true);
    const state = getGamifyState(STUDENT);
    expect(state.notes).toBe(1);
    // The same animal in a later band is a separate purchase — and locked here.
    expect(equipMusician(STUDENT, "melody-quartet", "mouse-violin").ok).toBe(false);
  });

  it("rejects equipping into a locked band", () => {
    seedState({ notes: 10 });
    const result = equipMusician(STUDENT, "steady-trio", "hedgehog-drum");
    expect(result).toEqual({ ok: false, reason: "band_locked" });
  });

  it("marks later bands locked in summaries", () => {
    const summaries = getBandSummaries(getGamifyState(STUDENT));
    expect(summaries[0].unlocked).toBe(true);
    expect(summaries.slice(1).every((band) => band.locked)).toBe(true);
    expect(summaries[1].requires).toBe(BANDS[0].name);
  });
});

describe("saved-state migration and repair", () => {
  it("migrates a schema-1 save into the first band and first ensemble", () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        stickers: {
          "mouse-violin": 2,
          "hedgehog-drum": 1,
          "fox-cello": 1
        },
        equippedInstruments: { "mouse-violin": true, "hedgehog-drum": true },
        musicians: { "fox-cello": { ownedAt: "2026-08-01", source: "teacher" } },
        notes: 7,
        sessions: []
      })
    );
    const state = getGamifyState(STUDENT);
    expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    // First-band progress survives, everything else is dropped.
    expect(isMusicianCollected(state, BANDS[0].key, "mouse-violin")).toBe(true);
    // The legacy save stacked this animal twice; cards are unique now.
    expect(state.bandStickers[BANDS[0].key]["mouse-violin"]).toBe(1);
    expect(isMusicianCollected(state, BANDS[1].key, "hedgehog-drum")).toBe(false);
    // Teacher-awarded chair in the first ensemble survives.
    expect(isMusicianOwned(state, ENSEMBLES[0].key, "fox-cello")).toBe(true);
    // Legacy keys are gone.
    expect(state.stickers).toBeUndefined();
    expect(state.musicians).toBeUndefined();
    expect(state.notes).toBe(7);
  });

  it("repair is idempotent", () => {
    seedState({
      bandStickers: {
        [BANDS[0].key]: { "mouse-violin": 1 },
        // Nonsense: an animal parked in a band it doesn't play in.
        [BANDS[1].key]: { "fox-cello": 3 }
      }
    });
    const once = getGamifyState(STUDENT);
    localStorage.setItem(KEY, JSON.stringify(once));
    const twice = getGamifyState(STUDENT);
    expect(twice).toEqual(once);
    expect(once.bandStickers[BANDS[1].key]).toEqual({});
  });
});

describe("ensemble ladder", () => {
  const DUO = ENSEMBLES.find((e) => e.key === "twinkle-duo");

  it("awards a musician into one ensemble once and rejects duplicates", () => {
    expect(awardMusician(STUDENT, "twinkle-duo", "fox-cello").ok).toBe(true);
    expect(
      isMusicianOwned(getGamifyState(STUDENT), "twinkle-duo", "fox-cello")
    ).toBe(true);
    expect(awardMusician(STUDENT, "twinkle-duo", "fox-cello")).toEqual({
      ok: false,
      reason: "already_owned"
    });
    expect(awardMusician(STUDENT, "twinkle-duo", "nonsense").ok).toBe(false);
  });

  it("rejects a musician without a chair in that ensemble", () => {
    expect(awardMusician(STUDENT, "twinkle-duo", "hedgehog-drum")).toEqual({
      ok: false,
      reason: "no_such_chair"
    });
  });

  it("counts the player chair as always owned", () => {
    const progress = getEnsembleProgress(getGamifyState(STUDENT), DUO);
    expect(progress.complete).toBe(false);
    expect(progress.missing).toBe(1);
    expect(progress.chairs.find((c) => c.playerChair).owned).toBe(true);
  });

  it("completes the ensemble once every chair is awarded", () => {
    awardMusician(STUDENT, "twinkle-duo", "fox-cello");
    const progress = getEnsembleProgress(getGamifyState(STUDENT), DUO);
    expect(progress.complete).toBe(true);
    expect(progress.canPremiere).toBe(false); // no rehearsals yet
  });

  it("logs at most one rehearsal per practice day", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    awardMusician(STUDENT, "twinkle-duo", "fox-cello");
    const first = finishSession(STUDENT, 120);
    expect(first.rehearsals).toEqual([
      expect.objectContaining({ key: "twinkle-duo", rehearsals: 1 })
    ]);
    const second = finishSession(STUDENT, 120);
    expect(second.rehearsals).toEqual([]);
    const progress = getEnsembleProgress(getGamifyState(STUDENT), DUO);
    expect(progress.rehearsals).toBe(1);
  });

  it("logs no rehearsal while a chair is still empty", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = finishSession(STUDENT, 120);
    expect(result.rehearsals).toEqual([]);
  });

  it("premieres only after enough rehearsals, exactly once", () => {
    awardMusician(STUDENT, "twinkle-duo", "fox-cello");
    seedState({
      ensembles: {
        "twinkle-duo": { rehearsals: [daysAgo(2), daysAgo(1)] }
      }
    });
    expect(premiere(STUDENT, "twinkle-duo")).toEqual({
      ok: false,
      reason: "not_ready"
    });

    seedState({
      ensembles: {
        "twinkle-duo": { rehearsals: [daysAgo(3), daysAgo(2), daysAgo(1)] }
      }
    });
    expect(getEnsembleProgress(getGamifyState(STUDENT), DUO).canPremiere).toBe(true);
    expect(premiere(STUDENT, "twinkle-duo").ok).toBe(true);
    expect(getEnsembleProgress(getGamifyState(STUDENT), DUO).premieredAt).toBeTruthy();
    expect(premiere(STUDENT, "twinkle-duo")).toEqual({
      ok: false,
      reason: "already_premiered"
    });
  });

  it("stops logging rehearsals after the premiere", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    awardMusician(STUDENT, "twinkle-duo", "fox-cello");
    seedState({
      ensembles: {
        "twinkle-duo": {
          rehearsals: [daysAgo(3), daysAgo(2), daysAgo(1)],
          premieredAt: new Date().toISOString()
        }
      }
    });
    const result = finishSession(STUDENT, 120);
    expect(result.rehearsals).toEqual([]);
  });
});
