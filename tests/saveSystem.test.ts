import { describe, it, expect, beforeEach, vi } from "vitest";

// ── localStorage mock (node environment) ─────────────────────────────────────

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

// Import *after* stubbing so the module sees the mock.
const { saveGame, loadGame } = await import("../saveSystem.js");

describe("saveSystem", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("loadGame", () => {
    it("returns null when no save exists for the slot", () => {
      expect(loadGame("slot1")).toBeNull();
    });

    it("defaults to slot1 when slot is falsy", () => {
      expect(loadGame(null as any)).toBeNull();
    });
  });

  describe("saveGame / loadGame round-trip", () => {
    it("persists and retrieves data for a named slot", () => {
      const data = { level: 3, score: 750 };
      saveGame("slot1", data);
      expect(loadGame("slot1")).toEqual(data);
    });

    it("stores data independently per slot", () => {
      saveGame("slot1", { level: 1 });
      saveGame("slot2", { level: 5 });
      expect(loadGame("slot1")).toEqual({ level: 1 });
      expect(loadGame("slot2")).toEqual({ level: 5 });
    });

    it("overwrites an existing save in the same slot", () => {
      saveGame("slot1", { level: 1 });
      saveGame("slot1", { level: 7, score: 2000 });
      expect(loadGame("slot1")).toEqual({ level: 7, score: 2000 });
    });

    it("uses slot1 as default when a falsy slot is provided", () => {
      saveGame(null as any, { score: 42 });
      expect(loadGame("slot1")).toEqual({ score: 42 });
    });

    it("preserves complex nested data", () => {
      const data = { level: 2, stats: { kills: 10, clears: 30 }, flags: [true, false] };
      saveGame("hero", data);
      expect(loadGame("hero")).toEqual(data);
    });

    it("returns null for an unwritten slot even after other slots are saved", () => {
      saveGame("slot1", { level: 1 });
      expect(loadGame("slot2")).toBeNull();
    });
  });

  describe("saveGame resilience", () => {
    it("does not throw when localStorage.setItem throws", () => {
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = () => {
        throw new Error("QuotaExceededError");
      };
      expect(() => saveGame("slot1", { level: 1 })).not.toThrow();
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe("loadGame resilience", () => {
    it("returns empty object (no slot) when localStorage contains invalid JSON", () => {
      store["matchmaker-saves"] = "{invalid json}";
      // Should not throw; returns null because the store has no slot key
      expect(() => loadGame("slot1")).not.toThrow();
      expect(loadGame("slot1")).toBeNull();
    });
  });
});
