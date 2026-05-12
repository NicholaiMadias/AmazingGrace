import { afterEach, describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";

import * as canonicalEngine from "../match-maker/engine/index.js";
import * as publicEngine from "../public/match-maker/engine/index.js";
import * as publicSession from "../public/match-maker/session.js";

const originalChrome = globalThis.chrome;

function createStorageArea(initialState: Record<string, unknown> = {}) {
  const store = { ...initialState };

  return {
    store,
    get(keys: string[], callback: (result: Record<string, unknown>) => void) {
      const result = Object.fromEntries(keys.map((key) => [key, store[key]]));
      callback(result);
    },
    set(value: Record<string, unknown>, callback?: () => void) {
      Object.assign(store, value);
      callback?.();
    },
  };
}

afterEach(() => {
  globalThis.chrome = originalChrome;
});

describe("Match-Maker progression engine wiring", () => {
  it("keeps the canonical engine as the real progression owner", async () => {
    expect(canonicalEngine.STATE_KEY).toBe("matchMakerState");
    expect(canonicalEngine.PROGRESSION_THRESHOLDS).toEqual({
      resonanceUnlock: 7,
      loopMax: 3,
    });
    expect(canonicalEngine.ALIGNMENT_STATES).toEqual(["neutral", "ladder", "break"]);

    const breakAligned = canonicalEngine.applyPatternOutcome(
      { resonanceStability: 6, loopPressure: 1, alignment: "neutral" },
      { type: "break" },
    );
    const ladderAligned = canonicalEngine.applyPatternOutcome(
      { resonanceStability: 0, loopPressure: 5, alignment: "neutral" },
      { type: "ladder" },
    );

    expect(breakAligned).toEqual({
      resonanceStability: 7,
      loopPressure: 0,
      alignment: "break",
    });
    expect(ladderAligned).toEqual({
      resonanceStability: 0,
      loopPressure: 6,
      alignment: "ladder",
    });
  });

  it("re-exports the canonical progression helpers through the public engine", () => {
    expect(publicEngine.STATE_KEY).toBe(canonicalEngine.STATE_KEY);
    expect(publicEngine.PROGRESSION_THRESHOLDS).toBe(canonicalEngine.PROGRESSION_THRESHOLDS);
    expect(publicEngine.ALIGNMENT_STATES).toBe(canonicalEngine.ALIGNMENT_STATES);
    expect(publicEngine.createInitialState).toBe(canonicalEngine.createInitialState);
    expect(publicEngine.applyPatternOutcome).toBe(canonicalEngine.applyPatternOutcome);
    expect(publicEngine.loadState).toBe(canonicalEngine.loadState);
    expect(publicEngine.saveState).toBe(canonicalEngine.saveState);
  });

  it("keeps popup session data compatible with canonical progression persistence", async () => {
    const storageArea = createStorageArea();
    globalThis.chrome = {
      storage: {
        local: storageArea,
      },
    } as typeof globalThis.chrome;

    await publicSession.saveSession({
      ...publicSession.createDefaultSession(),
      launches: 4,
      selectedAtlas: publicSession.ATLAS_IDS[1],
      resonanceStability: 8,
      loopPressure: 2,
      alignment: "break",
    });

    const storedSession = await new Promise<Record<string, unknown>>((resolve) => {
      publicSession.loadSession(resolve);
    });
    const storedProgression = await new Promise<Record<string, unknown>>((resolve) => {
      canonicalEngine.loadState(resolve);
    });

    expect(storageArea.store[canonicalEngine.STATE_KEY]).toMatchObject({
      launches: 4,
      selectedAtlas: publicSession.ATLAS_IDS[1],
      resonanceStability: 8,
      loopPressure: 2,
      alignment: "break",
    });
    expect(storedSession).toMatchObject({
      launches: 4,
      selectedAtlas: publicSession.ATLAS_IDS[1],
      resonanceStability: 8,
      loopPressure: 2,
      alignment: "break",
    });
    expect(storedProgression).toEqual({
      resonanceStability: 8,
      loopPressure: 2,
      alignment: "break",
    });
  });

  it("removes the separate public progression owner and keeps the public engine aligned", () => {
    expect(existsSync("public/match-maker/engine/progression.js")).toBe(false);
    expect(readFileSync("public/match-maker/engine/index.js", "utf8").trim())
      .toBe("export * from '../../../match-maker/engine/index.js';");
  });

  it("loads the arcade UI progression state from the canonical engine module", () => {
    const uiSource = readFileSync("public/match-maker-ui.js", "utf8");

    expect(uiSource).toContain("from './match-maker/engine/index.js'");
    expect(uiSource).not.toContain("function applyPatternOutcome(");
  });
});
