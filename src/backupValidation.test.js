import { describe, it, expect } from "vitest";
import { validateBackupPayload } from "./backupValidation";

const student = { id: "s1", name: "Emma", assignedVideos: [{ title: "Twinkle", videoId: "./x.mp4" }] };
const material = { id: "m1", title: "C Scale", category: "PDF" };
const attendance = { id: "a1", studentId: "s1", date: "2026-07-01", note: "Minuet" };

describe("validateBackupPayload", () => {
  it("accepts a full valid backup", () => {
    const result = validateBackupPayload({ students: [student], materials: [material], attendances: [attendance] });
    expect(result.ok).toBe(true);
    expect(result.payload).toEqual({ students: [student], materials: [material], attendances: [attendance] });
  });

  it("accepts a partial backup with only students", () => {
    expect(validateBackupPayload({ students: [student] }).ok).toBe(true);
  });

  it("rejects non-objects", () => {
    expect(validateBackupPayload(null).ok).toBe(false);
    expect(validateBackupPayload([student]).ok).toBe(false);
    expect(validateBackupPayload("{}").ok).toBe(false);
  });

  it("rejects a backup without any known keys", () => {
    const result = validateBackupPayload({ foo: [] });
    expect(result.ok).toBe(false);
  });

  it("rejects a student without a name", () => {
    const result = validateBackupPayload({ students: [{ id: "s1" }] });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/students\[0\]/);
  });

  it("rejects malformed assignedVideos", () => {
    const bad = { ...student, assignedVideos: [{ videoId: "x" }] };
    expect(validateBackupPayload({ students: [bad] }).ok).toBe(false);
  });

  it("rejects an attendance with an invalid date", () => {
    const bad = { ...attendance, date: "not-a-date" };
    const result = validateBackupPayload({ attendances: [bad] });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/invalid date/);
  });

  it("drops unknown top-level keys from the payload", () => {
    const result = validateBackupPayload({ students: [student], extra: { evil: true } });
    expect(result.ok).toBe(true);
    expect(result.payload.extra).toBeUndefined();
  });
});
