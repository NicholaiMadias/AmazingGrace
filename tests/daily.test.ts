import { describe, it, expect, beforeEach, vi } from "vitest";

// ── localStorage mock ─────────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
};
vi.stubGlobal("localStorage", localStorageMock);

const { getTodayChallenge, updateDailyProgress, checkDailyCompletion } =
  await import("../daily.js");

const VALID_IDS = new Set(["score500", "clear20", "reach3"]);

describe("daily", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useRealTimers();
  });

  // ── getTodayChallenge ───────────────────────────────────────────────────────

  describe("getTodayChallenge", () => {
    it("returns an object with date, challenge, and progress keys", () => {
      const result = getTodayChallenge();
      expect(result).toHaveProperty("date");
      expect(result).toHaveProperty("challenge");
      expect(result).toHaveProperty("progress");
    });

    it("sets the date to today's dateString", () => {
      const today = new Date().toDateString();
      const result = getTodayChallenge();
      expect(result.date).toBe(today);
    });

    it("returns a challenge with a valid id", () => {
      const result = getTodayChallenge();
      expect(VALID_IDS.has(result.challenge.id)).toBe(true);
    });

    it("returns a challenge with a non-empty desc", () => {
      const result = getTodayChallenge();
      expect(typeof result.challenge.desc).toBe("string");
      expect(result.challenge.desc.length).toBeGreaterThan(0);
    });

    it("returns the cached challenge on subsequent calls within the same day", () => {
      const first = getTodayChallenge();
      const second = getTodayChallenge();
      expect(second).toEqual(first);
    });

    it("creates a new challenge when the stored date is a different day", () => {
      // Pre-populate with yesterday's data
      const yesterday = new Date(Date.now() - 86_400_000).toDateString();
      store["daily"] = JSON.stringify({
        date: yesterday,
        challenge: { id: "score500", desc: "Score 500 points today" },
        progress: {},
      });
      const result = getTodayChallenge();
      const today = new Date().toDateString();
      expect(result.date).toBe(today);
    });
  });

  // ── updateDailyProgress ────────────────────────────────────────────────────

  describe("updateDailyProgress", () => {
    it("persists an arbitrary key/value pair in progress", () => {
      updateDailyProgress("score", 600);
      const data = getTodayChallenge();
      expect(data.progress["score"]).toBe(600);
    });

    it("overwrites a progress key on repeated updates", () => {
      updateDailyProgress("score", 100);
      updateDailyProgress("score", 999);
      const data = getTodayChallenge();
      expect(data.progress["score"]).toBe(999);
    });

    it("stores multiple independent progress keys", () => {
      updateDailyProgress("score", 200);
      updateDailyProgress("level", 3);
      const data = getTodayChallenge();
      expect(data.progress["score"]).toBe(200);
      expect(data.progress["level"]).toBe(3);
    });
  });

  // ── checkDailyCompletion ───────────────────────────────────────────────────

  describe("checkDailyCompletion", () => {
    function forceChallenge(id: string) {
      const desc = { score500: "Score 500", clear20: "Clear 20 gems", reach3: "Reach level 3" }[id]!;
      store["daily"] = JSON.stringify({
        date: new Date().toDateString(),
        challenge: { id, desc },
        progress: {},
      });
    }

    it("returns false when the score500 challenge is not yet met", () => {
      forceChallenge("score500");
      expect(checkDailyCompletion({ score: 499, level: 1, clears: 0 })).toBe(false);
    });

    it("returns true when score500 is exactly met", () => {
      forceChallenge("score500");
      expect(checkDailyCompletion({ score: 500, level: 1, clears: 0 })).toBe(true);
    });

    it("returns true when score500 is exceeded", () => {
      forceChallenge("score500");
      expect(checkDailyCompletion({ score: 1000, level: 1, clears: 0 })).toBe(true);
    });

    it("returns false when clear20 is not yet met", () => {
      forceChallenge("clear20");
      expect(checkDailyCompletion({ score: 0, level: 1, clears: 19 })).toBe(false);
    });

    it("returns true when clear20 is exactly met", () => {
      forceChallenge("clear20");
      expect(checkDailyCompletion({ score: 0, level: 1, clears: 20 })).toBe(true);
    });

    it("returns false when reach3 is not yet met", () => {
      forceChallenge("reach3");
      expect(checkDailyCompletion({ score: 0, level: 2, clears: 0 })).toBe(false);
    });

    it("returns true when reach3 is exactly met", () => {
      forceChallenge("reach3");
      expect(checkDailyCompletion({ score: 0, level: 3, clears: 0 })).toBe(true);
    });

    it("persists 'dailyComplete' to localStorage on success", () => {
      forceChallenge("score500");
      checkDailyCompletion({ score: 500, level: 1, clears: 0 });
      expect(localStorageMock.getItem("dailyComplete")).toBe("true");
    });

    it("does not set 'dailyComplete' on failure", () => {
      forceChallenge("score500");
      checkDailyCompletion({ score: 100, level: 1, clears: 0 });
      expect(localStorageMock.getItem("dailyComplete")).toBeNull();
    });

    it("returns false when there is no challenge id", () => {
      store["daily"] = JSON.stringify({
        date: new Date().toDateString(),
        challenge: {},
        progress: {},
      });
      expect(checkDailyCompletion({ score: 9999, level: 9, clears: 99 })).toBe(false);
    });
  });
});
