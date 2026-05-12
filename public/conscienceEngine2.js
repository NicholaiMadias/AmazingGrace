/**
 * conscienceEngine2.js — V2 Conscience Delta System
 * Tracks Karma, Wisdom, Integrity, and Community stats.
 * (c) 2026 NicholaiMadias — MIT License
 */

export const CONSCIENCE_KEYS = ['karma', 'wisdom', 'integrity', 'community'];

export const CONSCIENCE_DELTAS = {
  radiant: { karma: 2, wisdom: 0, integrity: 0, community: 0 },
  tide:    { karma: 0, wisdom: 2, integrity: 0, community: 0 },
  forge:   { karma: 0, wisdom: 0, integrity: 2, community: 0 },
  verdant: { karma: 0, wisdom: 0, integrity: 0, community: 2 },
  aether:  { karma: 1, wisdom: 1, integrity: 0, community: 0 },
  umbra:   { karma: 0, wisdom: 0, integrity: 1, community: 1 },
  void:    { karma: 0, wisdom: 0, integrity: 0, community: 0 },
};

export const BOARD_CLEAR_BONUS = 5;

export function createConscienceState() {
  return { karma: 0, wisdom: 0, integrity: 0, community: 0 };
}

export function applyMatchDeltas(conscience, matchedCells, grid) {
  const next = { ...conscience };
  matchedCells.forEach(({ r, c }) => {
    const gem = grid[r] && grid[r][c];
    if (!gem) return;
    const delta = CONSCIENCE_DELTAS[gem.kind] || {};
    CONSCIENCE_KEYS.forEach(k => {
      next[k] = Math.min(100, next[k] + (delta[k] || 0));
    });
  });
  return next;
}

export function applyBoardClearBonus(conscience) {
  const next = { ...conscience };
  CONSCIENCE_KEYS.forEach(k => {
    next[k] = Math.min(100, next[k] + BOARD_CLEAR_BONUS);
  });
  return next;
}
