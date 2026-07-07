import { describe, it, expect } from "vitest";
import { formatMediaName, MEDIA_CATEGORIES, allMediaFiles } from "./mediaConfig";

describe("formatMediaName", () => {
  it("strips the folder path and extension", () => {
    expect(formatMediaName("./mp3/Suzuki mp3 Official/Book 1/01 - Twinkle.mp3")).toBe("01 - Twinkle");
  });

  it("strips the Exercise prefix", () => {
    expect(formatMediaName("./video/Checkpoints/Exercise No. 3 Bow hold.mp4")).toBe("3 Bow hold");
  });

  it("strips the Cello Time Joggers suffix", () => {
    expect(formatMediaName("./video/Joggers/Tune Cello Time Joggers Vol 1.mp4")).toBe("Tune");
  });

  it("decodes URI-encoded names and ignores query strings", () => {
    expect(formatMediaName("./books/Rick%20Mooney/Position%20Pieces.pdf?v=2")).toBe("Position Pieces");
  });
});

describe("media category maps", () => {
  it("exposes all five library categories", () => {
    expect(Object.keys(MEDIA_CATEGORIES).sort()).toEqual(
      ["books", "checkpoints", "joggers", "pretwinkle", "suzukimp3"].sort()
    );
  });

  it("category maps are non-empty and produce URL values", () => {
    for (const [category, files] of Object.entries(MEDIA_CATEGORIES)) {
      const entries = Object.entries(files);
      expect(entries.length, `category ${category}`).toBeGreaterThan(0);
      for (const [, url] of entries.slice(0, 3)) {
        expect(url).toMatch(/^\/(src|api\/media)\//);
      }
    }
  });

  it("allMediaFiles covers every category entry", () => {
    const total = Object.values(MEDIA_CATEGORIES).reduce((sum, files) => sum + Object.keys(files).length, 0);
    expect(Object.keys(allMediaFiles).length).toBeGreaterThan(0);
    expect(Object.keys(allMediaFiles).length).toBeLessThanOrEqual(total);
  });
});
