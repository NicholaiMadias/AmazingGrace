/**
 * matchMakerState2.js — Matrix of Conscience Match-3 Engine
 * Repository: NicholaiMadias/Amazing-Grace
 * Path: arcade/js/matchMakerState2.js
 * GitHub Pages — No Jekyll
 *
 * Complete match-3 state engine with 7 elements, special tiles,
 * ley system, cascade gravity, and credit integration.
 */

const ELEMENTS = ['aether', 'forge', 'tide', 'verdant', 'umbra', 'radiant', 'void'];
const DEFAULT_ROWS = 8;
const DEFAULT_COLS = 8;

/* ─── Cell Factory ─── */
function makeCell(element, opts = {}) {
  return {
    element: element || ELEMENTS[Math.floor(Math.random() * (ELEMENTS.length - 1))], // void excluded from random
    isLey: opts.isLey || false,
    special: opts.special || null, // 'line' | 'cross' | 'nova' | null
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

/* ─── Grid Initialization ─── */
function createGrid(rows, cols) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      let cell;
      // Prevent initial matches of 3
      do {
        cell = makeCell();
      } while (
        (c >= 2 && grid[r][c - 1].element === cell.element && grid[r][c - 2].element === cell.element) ||
        (r >= 2 && grid[r - 1][c].element === cell.element && grid[r - 2][c].element === cell.element)
      );
      grid[r][c] = cell;
    }
  }
  // Sprinkle ley tiles (~8% of board)
  const totalCells = rows * cols;
  const leyCt = Math.floor(totalCells * 0.08);
  for (let i = 0; i < leyCt; i++) {
    const lr = Math.floor(Math.random() * rows);
    const lc = Math.floor(Math.random() * cols);
    grid[lr][lc].isLey = true;
  }
  return grid;
}

/* ─── Match Detection ─── */
function findMatches(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const matched = new Set();

  // Horizontal
  for (let r = 0; r < rows; r++) {
    let run = 1;
    for (let c = 1; c <= cols; c++) {
      if (c < cols && grid[r][c].element === grid[r][c - 1].element && grid[r][c].element !== 'void') {
        run++;
      } else {
        if (run >= 3) {
          for (let k = c - run; k < c; k++) {
            matched.add(`${r},${k}`);
          }
        }
        run = 1;
      }
    }
  }

  // Vertical
  for (let c = 0; c < cols; c++) {
    let run = 1;
    for (let r = 1; r <= rows; r++) {
      if (r < rows && grid[r][c].element === grid[r - 1][c].element && grid[r][c].element !== 'void') {
        run++;
      } else {
        if (run >= 3) {
          for (let k = r - run; k < r; k++) {
            matched.add(`${k},${c}`);
          }
        }
        run = 1;
      }
    }
  }

  return [...matched].map(key => {
    const [r, c] = key.split(',').map(Number);
    return { row: r, col: c };
  });
}

/* ─── Special Tile Resolution ─── */
function resolveSpecials(grid, matches) {
  const specials = [];

  // Group matches by connected runs
  const byRow = {};
  const byCol = {};
  for (const m of matches) {
    const key = `${m.row}`;
    if (!byRow[key]) byRow[key] = [];
    byRow[key].push(m.col);

    const ckey = `${m.col}`;
    if (!byCol[ckey]) byCol[ckey] = [];
    byCol[ckey].push(m.row);
  }

  // Check for 5+ (nova), L/T shapes (cross), 4-in-line (line)
  for (const [r, cols] of Object.entries(byRow)) {
    cols.sort((a, b) => a - b);
    const runs = _findRuns(cols);
    for (const run of runs) {
      if (run.length >= 5) {
        specials.push({ row: parseInt(r), col: run[2], type: 'nova' });
      } else if (run.length === 4) {
        specials.push({ row: parseInt(r), col: run[1], type: 'line' });
      }
    }
  }

  for (const [c, rows] of Object.entries(byCol)) {
    rows.sort((a, b) => a - b);
    const runs = _findRuns(rows);
    for (const run of runs) {
      if (run.length >= 5) {
        specials.push({ row: run[2], col: parseInt(c), type: 'nova' });
      } else if (run.length === 4) {
        specials.push({ row: run[1], col: parseInt(c), type: 'line' });
      }
    }
  }

  // Check for L/T (intersection of row+col matches)
  for (const m of matches) {
    const rowMatches = byRow[`${m.row}`] || [];
    const colMatches = byCol[`${m.col}`] || [];
    if (rowMatches.length >= 3 && colMatches.length >= 3) {
      specials.push({ row: m.row, col: m.col, type: 'cross' });
    }
  }

  return specials;
}

function _findRuns(sorted) {
  const runs = [];
  let current = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      current.push(sorted[i]);
    } else {
      runs.push(current);
      current = [sorted[i]];
    }
  }
  runs.push(current);
  return runs;
}

/* ─── Gravity ─── */
function applyGravity(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const changed = [];

  for (let c = 0; c < cols; c++) {
    let writeRow = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      if (grid[r][c] !== null) {
        if (writeRow !== r) {
          grid[writeRow][c] = grid[r][c];
          grid[r][c] = null;
          changed.push({ row: writeRow, col: c });
        }
        writeRow--;
      }
    }
    // Fill empty cells at top
    for (let r = writeRow; r >= 0; r--) {
      grid[r][c] = makeCell();
      changed.push({ row: r, col: c });
    }
  }

  return changed;
}

/* ─── Special Tile Activation ─── */
function activateSpecial(grid, row, col) {
  const cell = grid[row][col];
  if (!cell || !cell.special) return [];

  const rows = grid.length;
  const cols = grid[0].length;
  const cleared = [];

  switch (cell.special) {
    case 'line':
      for (let c = 0; c < cols; c++) {
        cleared.push({ row, col: c });
      }
      break;

    case 'cross':
      for (let c = 0; c < cols; c++) cleared.push({ row, col: c });
      for (let r = 0; r < rows; r++) cleared.push({ row: r, col });
      break;

    case 'nova':
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            cleared.push({ row: nr, col: nc });
          }
        }
      }
      break;
  }

  return cleared;
}

/* ═══════════════════════════════════════════
   GAME STATE
   ═══════════════════════════════════════════ */

class MatchMakerState {
  constructor(opts = {}) {
    this.rows = opts.rows || DEFAULT_ROWS;
    this.cols = opts.cols || DEFAULT_COLS;
    this.grid = createGrid(this.rows, this.cols);
    this.score = 0;
    this.moves = 0;
    this.level = opts.level || 1;
    this.chain = 0;
    this.maxChain = 0;
    this.totalMatches = 0;
    this.elementsCleared = {};
    ELEMENTS.forEach(e => this.elementsCleared[e] = 0);

    this._listeners = [];
  }

  getGrid() { return this.grid; }

  getHUD() {
    return {
      score: this.score,
      moves: this.moves,
      level: this.level,
      chain: this.chain,
    };
  }

  getStats() {
    return {
      score: this.score,
      moves: this.moves,
      level: this.level,
      chain: this.chain,
      maxChain: this.maxChain,
      totalMatches: this.totalMatches,
      elementsCleared: { ...this.elementsCleared },
    };
  }

  onUpdate(fn) {
    this._listeners.push(fn);
  }

  _emit(event, data) {
    for (const fn of this._listeners) {
      try { fn(event, data); } catch (e) { console.error('[State]', e); }
    }
  }

  trySwap(a, b) {
    const dr = Math.abs(a.row - b.row);
    const dc = Math.abs(a.col - b.col);
    if ((dr + dc) !== 1) return { valid: false };

    // Perform swap
    const temp = this.grid[a.row][a.col];
    this.grid[a.row][a.col] = this.grid[b.row][b.col];
    this.grid[b.row][b.col] = temp;

    // Check for matches
    const matches = findMatches(this.grid);

    if (matches.length === 0) {
      // Revert swap
      const temp2 = this.grid[a.row][a.col];
      this.grid[a.row][a.col] = this.grid[b.row][b.col];
      this.grid[b.row][b.col] = temp2;
      return { valid: false };
    }

    this.moves++;
    this.chain = 0;

    const result = this._processMatches(matches);
    return { valid: true, ...result };
  }

  _processMatches(matches) {
    this.chain++;
    if (this.chain > this.maxChain) this.maxChain = this.chain;

    // Resolve specials from match pattern
    const specials = resolveSpecials(this.grid, matches);

    // Tally elements and check for ley tiles
    let leyBonus = 0;
    const clearedElements = {};
    for (const m of matches) {
      const cell = this.grid[m.row][m.col];
      if (cell) {
        const el = cell.element;
        clearedElements[el] = (clearedElements[el] || 0) + 1;
        this.elementsCleared[el] = (this.elementsCleared[el] || 0) + 1;
        if (cell.isLey) leyBonus += 50;

        // Activate special tiles being cleared
        if (cell.special) {
          const extra = activateSpecial(this.grid, m.row, m.col);
          for (const e of extra) {
            if (!matches.find(x => x.row === e.row && x.col === e.col)) {
              matches.push(e);
            }
          }
        }
      }
    }

    // Score calculation
    const baseScore = matches.length * 10;
    const chainMultiplier = Math.min(this.chain, 10);
    const specialBonus = specials.length * 25;
    const scoreDelta = (baseScore * chainMultiplier) + specialBonus + leyBonus;
    this.score += scoreDelta;
    this.totalMatches += matches.length;

    // Clear matched cells
    for (const m of matches) {
      this.grid[m.row][m.col] = null;
    }

    // Place special tiles
    for (const sp of specials) {
      if (this.grid[sp.row]?.[sp.col] === null) {
        const prevElement = matches.find(m => m.row === sp.row || m.col === sp.col);
        const element = prevElement
          ? (this.grid[prevElement.row]?.[prevElement.col]?.element || 'aether')
          : 'aether';
        this.grid[sp.row][sp.col] = makeCell(element, { special: sp.type });
      }
    }

    // Gravity
    const filled = applyGravity(this.grid);

    this._emit('match', { matches, scoreDelta, chain: this.chain, specials, clearedElements });

    return {
      matches,
      scoreDelta,
      chain: this.chain,
      specials,
      filled,
      clearedElements,
    };
  }

  processCascade() {
    const matches = findMatches(this.grid);
    if (matches.length === 0) {
      const finalChain = this.chain;
      this.chain = 0;
      this._emit('cascadeEnd', { finalChain });
      return { matches: [], chain: 0 };
    }
    return this._processMatches(matches);
  }

  restart() {
    this.grid = createGrid(this.rows, this.cols);
    this.score = 0;
    this.moves = 0;
    this.chain = 0;
    this.maxChain = 0;
    this.totalMatches = 0;
    ELEMENTS.forEach(e => this.elementsCleared[e] = 0);
    this._emit('restart', {});
  }

  /* Check if any valid moves exist */
  hasValidMoves() {
    const rows = this.grid.length;
    const cols = this.grid[0].length;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Try swap right
        if (c + 1 < cols) {
          this._swap(r, c, r, c + 1);
          if (findMatches(this.grid).length > 0) {
            this._swap(r, c, r, c + 1);
            return true;
          }
          this._swap(r, c, r, c + 1);
        }
        // Try swap down
        if (r + 1 < rows) {
          this._swap(r, c, r + 1, c);
          if (findMatches(this.grid).length > 0) {
            this._swap(r, c, r + 1, c);
            return true;
          }
          this._swap(r, c, r + 1, c);
        }
      }
    }
    return false;
  }

  _swap(r1, c1, r2, c2) {
    const t = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = t;
  }
}

export { MatchMakerState, ELEMENTS, findMatches, applyGravity };
export default MatchMakerState;
