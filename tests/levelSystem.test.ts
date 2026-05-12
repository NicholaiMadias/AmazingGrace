import { describe, it, expect } from "vitest";
import { getLevelConfig, checkLevelUp, MAX_LEVEL } from "../levelSystem.js";

describe("levelSystem", () => {
  describe("MAX_LEVEL", () => {
    it("equals 5", () => {
      expect(MAX_LEVEL).toBe(5);
    });
  });

  describe("getLevelConfig", () => {
    it("returns the correct config for level 1", () => {
      const cfg = getLevelConfig(1);
      expect(cfg.level).toBe(1);
      expect(cfg.target).toBe(200);
      expect(cfg.moves).toBe(20);
      expect(cfg.reward).toBe(50);
      expect(cfg.difficultyModifier).toBe(1.0);
    });

    it("returns the correct config for level 3", () => {
      const cfg = getLevelConfig(3);
      expect(cfg.level).toBe(3);
      expect(cfg.target).toBe(700);
      expect(cfg.moves).toBe(24);
      expect(cfg.reward).toBe(150);
      expect(cfg.difficultyModifier).toBe(1.5);
    });

    it("returns the correct config for level 5", () => {
      const cfg = getLevelConfig(5);
      expect(cfg.level).toBe(5);
      expect(cfg.target).toBe(1600);
      expect(cfg.moves).toBe(28);
      expect(cfg.reward).toBe(300);
      expect(cfg.difficultyModifier).toBe(2.5);
    });

    it("clamps to the last level when level exceeds MAX_LEVEL", () => {
      const cfg = getLevelConfig(99);
      expect(cfg.level).toBe(5);
    });

    it("clamps to the first level for level 0", () => {
      const cfg = getLevelConfig(0);
      expect(cfg.level).toBe(1);
    });

    it("clamps to the first level for negative levels", () => {
      const cfg = getLevelConfig(-1);
      expect(cfg.level).toBe(1);
    });

    it("returns distinct configs for each level (no duplicate targets)", () => {
      const targets = [1, 2, 3, 4, 5].map((l) => getLevelConfig(l).target);
      const unique = new Set(targets);
      expect(unique.size).toBe(5);
    });

    it("has strictly increasing targets across levels", () => {
      for (let l = 1; l < MAX_LEVEL; l++) {
        expect(getLevelConfig(l + 1).target).toBeGreaterThan(getLevelConfig(l).target);
      }
    });

    it("has increasing moves across levels", () => {
      for (let l = 1; l < MAX_LEVEL; l++) {
        expect(getLevelConfig(l + 1).moves).toBeGreaterThanOrEqual(getLevelConfig(l).moves);
      }
    });
  });

  describe("checkLevelUp", () => {
    it("returns false when score is below the target", () => {
      expect(checkLevelUp(199, 1)).toBe(false);
    });

    it("returns true when score exactly meets the target", () => {
      expect(checkLevelUp(200, 1)).toBe(true);
    });

    it("returns true when score exceeds the target", () => {
      expect(checkLevelUp(500, 1)).toBe(true);
    });

    it("uses the correct target for level 3", () => {
      expect(checkLevelUp(699, 3)).toBe(false);
      expect(checkLevelUp(700, 3)).toBe(true);
    });

    it("uses the last level config for out-of-range levels", () => {
      const level5Target = getLevelConfig(5).target;
      expect(checkLevelUp(level5Target - 1, 99)).toBe(false);
      expect(checkLevelUp(level5Target, 99)).toBe(true);
    });

    it("returns false for score 0 at any level", () => {
      for (let l = 1; l <= MAX_LEVEL; l++) {
        expect(checkLevelUp(0, l)).toBe(false);
      }
    });
  });
});
