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

const { getProgress, recordLevelComplete } = await import(
  "../public/progression.js"
);

describe("progression", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  // ── getProgress ─────────────────────────────────────────────────────────────

  describe("getProgress", () => {
    it("returns { total: 0 } when no progress has been saved", () => {
      expect(getProgress()).toEqual({ total: 0 });
    });

    it("returns the persisted total after a save", () => {
      store["glm-progress"] = JSON.stringify({ total: 5 });
      expect(getProgress()).toEqual({ total: 5 });
    });

    it("returns { total: 0 } when localStorage contains invalid JSON", () => {
      store["glm-progress"] = "{not valid json}";
      expect(getProgress()).toEqual({ total: 0 });
    });

    it("returns { total: 0 } when localStorage value is not an object", () => {
      store["glm-progress"] = JSON.stringify(42);
      expect(getProgress()).toEqual({ total: 0 });
    });

    it("returns { total: 0 } when total is not a finite number", () => {
      store["glm-progress"] = JSON.stringify({ total: "five" });
      expect(getProgress()).toEqual({ total: 0 });
    });

    it("returns { total: 0 } for an array value", () => {
      store["glm-progress"] = JSON.stringify([1, 2, 3]);
      expect(getProgress()).toEqual({ total: 0 });
    });
  });

  // ── recordLevelComplete ─────────────────────────────────────────────────────

  describe("recordLevelComplete", () => {
    it("updates total when the completed level is higher than current total", () => {
      recordLevelComplete(3);
      expect(getProgress().total).toBe(3);
    });

    it("does not lower total when a lower level is completed", () => {
      recordLevelComplete(5);
      recordLevelComplete(2);
      expect(getProgress().total).toBe(5);
    });

    it("does not change total when the same level is completed again", () => {
      recordLevelComplete(4);
      recordLevelComplete(4);
      expect(getProgress().total).toBe(4);
    });

    it("accumulates progress across multiple calls", () => {
      recordLevelComplete(1);
      recordLevelComplete(2);
      recordLevelComplete(3);
      expect(getProgress().total).toBe(3);
    });

    it("persists the new total to localStorage", () => {
      recordLevelComplete(7);
      const raw = JSON.parse(store["glm-progress"] ?? "{}");
      expect(raw.total).toBe(7);
    });

    it("does not throw when localStorage.setItem throws", () => {
      const original = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        throw new Error("QuotaExceeded");
      };
      expect(() => recordLevelComplete(10)).not.toThrow();
      localStorageMock.setItem = original;
    });
  });
});
