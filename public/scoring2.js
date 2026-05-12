/**
 * scoring2.js — V2 Unified Scoring Formula
 * score = base × length_bonus × ley_multiplier × combo_multiplier
 * (c) 2026 NicholaiMadias — MIT License
 */

export const BASE_SCORE = 100;

/**
 * Computes the score for a single match resolution step.
 */
export function computeScore({ matchCount, leyMultiplier = 1, comboChain = 1 }) {
  const lengthBonus = 1 + Math.max(0, matchCount - 3) * 0.5;
  return Math.round(BASE_SCORE * lengthBonus * leyMultiplier * comboChain);
}
