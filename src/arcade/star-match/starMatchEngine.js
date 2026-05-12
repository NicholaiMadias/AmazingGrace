import { STAR_TYPES } from '../../stars/starMap.js';
import { unlockLore } from '../../lore/loreCodex.js';

const STAR_IDS = Object.keys(STAR_TYPES);

const VIRTUE_BONUS = {
  Vision: 1.10,
  Courage: 1.15,
  Serenity: 1.05,
  Autonomy: 1.20,
  Sustenance: 1.00,
  Patience: 1.12,
  Humility: 1.08
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
        this.createTile(this.randomStar())
      )
    );
    this.removeInitialMatches();
  }

  createTile(starId, special = null) {
    return { starId, special }; // special: 'row','col','nova','heart', etc.
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
      this.board[b.y][b.x] = this.board[a.y][a.x];
      this.board[a.y][a.x] = temp;
      return false;
    }

    this.resolveMatches(matches, a, b);
    return true;
  }

  findMatches() {
    const matches = [];

    // Horizontal
    for (let y = 0; y < this.size; y++) {
      let streak = 1;
      for (let x = 1; x < this.size; x++) {
        if (this.board[y][x].starId === this.board[y][x - 1].starId) {
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
        if (this.board[y][x].starId === this.board[y - 1][x].starId) {
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

  resolveMatches(matches, lastSwapA, lastSwapB) {
    this.chain++;
    const chainBonus = this.chain * 50;

    // Determine where to place specials (center of longest match, prefer last swap)
    const specialsToCreate = [];

    matches.forEach((m) => {
      const isRow = m.type === 'row';
      const length = m.length;

      for (let i = 0; i < length; i++) {
        const x = isRow ? m.x + i : m.x;
        const y = isRow ? m.y : m.y + i;

        const tile = this.board[y][x];
        const starId = tile.starId;
        const virtue = STAR_TYPES[starId].virtue;
        const bonus = VIRTUE_BONUS[virtue] || 1.0;

        unlockLore(starId, 'match3');

        this.board[y][x] = null;
        this.score += Math.floor((100 + chainBonus) * bonus);
      }

      // Special tile rules
      if (length >= 4) {
        const midIndex = Math.floor(length / 2);
        const sx = isRow ? m.x + midIndex : m.x;
        const sy = isRow ? m.y : m.y + midIndex;
        specialsToCreate.push({ x: sx, y: sy, length, type: m.type });
      }
    });

    // Create specials after clearing
    specialsToCreate.forEach(({ x, y, length, type }) => {
      if (this.board[y][x] !== null) return; // already filled by gravity later
      const baseStar = this.randomStar();
      let special = null;

      if (length === 4) {
        special = type === 'row' ? 'row' : 'col';
      } else if (length >= 5) {
        special = 'nova';
      }

      this.board[y][x] = this.createTile(baseStar, special);
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
          this.board[y][x] = this.createTile(this.randomStar());
        }
      }
    }
  }
}
