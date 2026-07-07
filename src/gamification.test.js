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
  STICKERS
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

  it("records minutes and awards a sticker from the chest", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // common rarity
    const result = finishSession(STUDENT, 600);
    expect(result.minutes).toBe(10);
    expect(result.sticker).toBeTruthy();
    expect(result.sticker.rarity).toBe("common");
    expect(STICKERS.map((s) => s.key)).toContain(result.sticker.key);
  });

  it("caps chests at two per day", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    finishSession(STUDENT, 120);
    finishSession(STUDENT, 120);
    const third = finishSession(STUDENT, 120);
    expect(third.sticker).toBeNull();
    expect(getGamifyState(STUDENT).chestsToday.count).toBe(2);
  });

  it("converts duplicate stickers into notes", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5); // same sticker both times
    finishSession(STUDENT, 120);
    const second = finishSession(STUDENT, 120);
    expect(second.duplicate).toBe(true);
    expect(second.notes).toBeGreaterThan(0);
  });

  it("flags practicing far over the target", () => {
    setDailyTarget(STUDENT, 10);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = finishSession(STUDENT, 20 * 60);
    expect(result.overTarget).toBe(true);
    expect(result.baton).toBe(true);
  });
});
