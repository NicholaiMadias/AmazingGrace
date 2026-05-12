import { describe, it, expect } from "vitest";
import {
  CONSTELLATION_ORDER,
  normalizeConstellationProgress,
  getNextTrialStar,
  completeTrial,
  computeConscienceTint,
  loadConstellationProgress,
  saveConstellationProgress,
  CONSTELLATION_PROGRESS_KEY,
} from "../src/arcade/star-matrix/constellationState.js";

describe("constellationState", () => {
  it("normalizes to a safe prefix of the canonical order", () => {
    expect(normalizeConstellationProgress([])).toEqual([]);
    expect(normalizeConstellationProgress([CONSTELLATION_ORDER[0]])).toEqual([
      CONSTELLATION_ORDER[0],
    ]);
    expect(
      normalizeConstellationProgress([CONSTELLATION_ORDER[0], "wrong"]),
    ).toEqual([CONSTELLATION_ORDER[0]]);
    expect(
      normalizeConstellationProgress([
        CONSTELLATION_ORDER[0],
        CONSTELLATION_ORDER[1],
        CONSTELLATION_ORDER[2],
        CONSTELLATION_ORDER[3],
      ]),
    ).toEqual([
      CONSTELLATION_ORDER[0],
      CONSTELLATION_ORDER[1],
      CONSTELLATION_ORDER[2],
      CONSTELLATION_ORDER[3],
    ]);
  });

  it("getNextTrialStar returns null when all stars are complete", () => {
    expect(getNextTrialStar([])).toBe(CONSTELLATION_ORDER[0]);
    expect(getNextTrialStar([CONSTELLATION_ORDER[0]])).toBe(CONSTELLATION_ORDER[1]);
    expect(getNextTrialStar([...CONSTELLATION_ORDER])).toBeNull();
  });

  it("completeTrial returns unchanged when already fully complete", () => {
    const full = [...CONSTELLATION_ORDER];
    const result = completeTrial(full, CONSTELLATION_ORDER[0]);
    expect(result.changed).toBe(false);
    expect(result.next).toEqual(full);
  });

  it("records trial completion only for the next expected star", () => {
    const a = completeTrial([], "electra");
    expect(a.changed).toBe(true);
    expect(a.next).toEqual(["electra"]);

    const b = completeTrial(a.next, "alcyone");
    expect(b.changed).toBe(false);
    expect(b.next).toEqual(["electra"]);

    const c = completeTrial(a.next, "taygete");
    expect(c.changed).toBe(true);
    expect(c.next).toEqual(["electra", "taygete"]);
  });

  it("computes a subtle tint with bounded opacity", () => {
    const { rgb, opacity } = computeConscienceTint(0, 7);
    expect(typeof rgb).toBe("string");
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);

    const more = computeConscienceTint(7, 7);
    expect(more.opacity).toBeGreaterThan(opacity);
  });

  it("loads and saves progress via a storage adapter", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };

    expect(loadConstellationProgress(storage)).toEqual([]);
    saveConstellationProgress(storage, ["electra", "taygete"]);
    expect(store.has(CONSTELLATION_PROGRESS_KEY)).toBe(true);
    expect(loadConstellationProgress(storage)).toEqual(["electra", "taygete"]);
  });
});

