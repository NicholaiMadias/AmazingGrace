/**
 * specialTiles2.js — V2 Special Tile Logic
 * (c) 2026 NicholaiMadias — MIT License
 */

import { SPECIAL, GRID_SIZE } from './matchMakerState2.js';

export function getSpawnedSpecial(matchCells) {
  const count = matchCells.length;
  if (count >= 7) return SPECIAL.SUPERNOVA;
  const rows = new Set(matchCells.map(cell => cell.r));
  const cols = new Set(matchCells.map(cell => cell.c));
  if (rows.size > 1 && cols.size > 1) return SPECIAL.CROSS;
  if (count >= 5) return SPECIAL.NOVA;
  if (count >= 4) return rows.size === 1 ? SPECIAL.LINE_H : SPECIAL.LINE_V;
  return null;
}

export function activateSpecial(grid, r, c) {
  const gem = grid[r] && grid[r][c];
  if (!gem || !gem.special) return { clearedCells: [] };

  const clearedCells = [];

  switch (gem.special) {
    case SPECIAL.LINE_H:
      for (let col = 0; col < GRID_SIZE; col++) clearedCells.push({ r, c: col });
      break;
    case SPECIAL.LINE_V:
      for (let row = 0; row < GRID_SIZE; row++) clearedCells.push({ r: row, c });
      break;
    case SPECIAL.CROSS:
      for (let col = 0; col < GRID_SIZE; col++) clearedCells.push({ r, c: col });
      for (let row = 0; row < GRID_SIZE; row++) {
        if (row !== r) clearedCells.push({ r: row, c });
      }
      break;
    case SPECIAL.NOVA:
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
            clearedCells.push({ r: nr, c: nc });
          }
        }
      }
      break;
    case SPECIAL.SUPERNOVA:
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) clearedCells.push({ r: row, c: col });
      }
      break;
    default:
      break;
  }

  return { clearedCells };
}
