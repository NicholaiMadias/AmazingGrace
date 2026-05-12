/**
 * StarMatchEngine.js — Core match-3 puzzle engine for the Seven Stars arcade system.
 * Manages an N×N board of Pleiades star tiles, detects matches, resolves cascades,
 * and applies per-virtue scoring bonuses.
 */

import { STAR_TYPES } from '../../stars/starMap.js';
import { unlockLore } from '../../lore/loreCodex.js';

const STAR_IDS = Object.keys(STAR_TYPES);

/**
 * Per-virtue scoring multipliers applied on top of the base match score.
 * Each value corresponds to the virtue of one of the seven Pleiades sisters.
 */
const VIRTUE_BONUS = {
  Vision:     1.10,  // Electra
  Courage:    1.15,  // Taygete
  Serenity:   1.05,  // Alcyone
  Autonomy:   1.20,  // Maia
  Sustenance: 1.00,  // Celaeno
  Patience:   1.12,  // Sterope
  Humility:   1.08   // Merope
};

export class StarMatchEngine {
  constructor(size = 8) {
    this.size = size;
    this.board = [];
    this.score = 0;
    this.chain = 0;
    this.generateBoard();
  }

  generateBoard() {
    this.board = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () =>
        this.randomStar()
      )
    );
    this.removeInitialMatches();
  }

  randomStar() {
    return STAR_IDS[Math.floor(Math.random() * STAR_IDS.length)];
  }

  removeInitialMatches() {
    let changed = true;
    while (changed) {
      const matches = this.findMatches();
      changed = matches.length > 0;
      if (changed) this.clearMatches(matches);
      this.applyGravity();
      this.fillEmpty();
    }
  }

  swap(a, b) {
    const temp = this.board[a.y][a.x];
    this.board[a.y][a.x] = this.board[b.y][b.x];
    this.board[b.y][b.x] = temp;

    const matches = this.findMatches();
    if (matches.length === 0) {
      // swap back
      this.board[b.y][b.x] = this.board[a.y][a.x];
      this.board[a.y][a.x] = temp;
      return false;
    }

    this.resolveMatches(matches);
    return true;
  }

  findMatches() {
    const matches = [];

    // Horizontal
    for (let y = 0; y < this.size; y++) {
      let streak = 1;
      for (let x = 1; x < this.size; x++) {
        if (this.board[y][x] === this.board[y][x - 1]) {
          streak++;
        } else {
          if (streak >= 3) {
            matches.push({ type: 'row', y, x: x - streak, length: streak });
          }
          streak = 1;
        }
      }
      if (streak >= 3) {
        matches.push({ type: 'row', y, x: this.size - streak, length: streak });
      }
    }

    // Vertical
    for (let x = 0; x < this.size; x++) {
      let streak = 1;
      for (let y = 1; y < this.size; y++) {
        if (this.board[y][x] === this.board[y - 1][x]) {
          streak++;
        } else {
          if (streak >= 3) {
            matches.push({ type: 'col', x, y: y - streak, length: streak });
          }
          streak = 1;
        }
      }
      if (streak >= 3) {
        matches.push({ type: 'col', x, y: this.size - streak, length: streak });
      }
    }

    return matches;
  }

  resolveMatches(matches) {
    this.chain++;
    const chainBonus = this.chain * 50;

    matches.forEach((m) => {
      for (let i = 0; i < m.length; i++) {
        const x = m.type === 'row' ? m.x + i : m.x;
        const y = m.type === 'col' ? m.y + i : m.y;

        const starId = this.board[y][x];
        const virtue = STAR_TYPES[starId].virtue;

        // Lore unlock hook
        unlockLore(starId, 'match3');

        // Virtue bonus
        const bonus = VIRTUE_BONUS[virtue];
        if (bonus === undefined) {
          console.warn(`StarMatchEngine: no VIRTUE_BONUS entry for virtue "${virtue}" (star "${starId}") — defaulting to 1.0`);
        }
        const multiplier = bonus ?? 1.0;

        this.board[y][x] = null;
        this.score += Math.floor((100 + chainBonus) * multiplier);
      }
    });

    this.applyGravity();
    this.fillEmpty();

    const newMatches = this.findMatches();
    if (newMatches.length > 0) {
      this.resolveMatches(newMatches);
    } else {
      this.chain = 0;
    }
  }

  clearMatches(matches) {
    matches.forEach((m) => {
      for (let i = 0; i < m.length; i++) {
        const x = m.type === 'row' ? m.x + i : m.x;
        const y = m.type === 'col' ? m.y + i : m.y;
        this.board[y][x] = null;
      }
    });
  }

  applyGravity() {
    for (let x = 0; x < this.size; x++) {
      for (let y = this.size - 1; y >= 0; y--) {
        if (this.board[y][x] === null) {
          for (let k = y - 1; k >= 0; k--) {
            if (this.board[k][x] !== null) {
              this.board[y][x] = this.board[k][x];
              this.board[k][x] = null;
              break;
            }
          }
        }
      }
    }
  }

  fillEmpty() {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.board[y][x] === null) {
          this.board[y][x] = this.randomStar();
        }
      }
    }
  }
}
