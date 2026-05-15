/**
 * matchmaker.js — 7×7 Match-3 engine (pure functions).
 *
 * All functions are pure: they receive a grid and return a new grid (or data).
 * No DOM access; no side-effects.
 *
 * Exports:
 *   GRID_SIZE
 *   createInitialGrid() → grid
 *   createGrid()        → grid  (alias)
 *   canSwap(grid, r1,c1, r2,c2)         → boolean
 *   isAdjacent(r1,c1, r2,c2)            → boolean  (no grid param needed)
 *   applySwap(grid, r1,c1, r2,c2)       → grid
 *   swapGems(grid, r1,c1, r2,c2)        → grid     (alias)
 *   findMatches(grid)                   → { matches, specials }
 *   applyMatches(grid, matchResult, comboLevel?) → grid
 *   triggerSpecial(grid, row,col, type, comboLevel?) → void (mutates copy)
 *   applyGravity(grid)                  → grid
 *   clearMatches(grid, matchCells, replacements?) → grid  (legacy compat)
 */

export const GRID_SIZE = 7;

const GEM_TYPES = ['heart', 'star', 'cross', 'flame', 'drop'];

function randomGemType() {
  return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
}

function makeGem(type, special = null) {
  return { type, special, createdBy: null };
}

/* ── Grid creation ───────────────────────────────────────────────────────── */

/**
 * Creates an initial 7×7 grid of gem objects with no pre-existing matches.
 * @returns {Array<Array<object>>}
 */
export function createInitialGrid() {
  const grid = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let gemType;
      do {
        gemType = randomGemType();
      } while (
        (c >= 2 && grid[r][c - 1]?.type === gemType && grid[r][c - 2]?.type === gemType) ||
        (r >= 2 && grid[r - 1][c]?.type === gemType && grid[r - 2][c]?.type === gemType)
      );
      grid[r][c] = makeGem(gemType);
    }
  }
  return grid;
}

/** Alias used by the UI layer. */
export const createGrid = createInitialGrid;

/* ── Adjacency & swap ────────────────────────────────────────────────────── */

/**
 * Returns true if the two cells are adjacent (share an edge).
 */
export function canSwap(_grid, r1, c1, r2, c2) {
  const rowDiff = Math.abs(r1 - r2);
  const colDiff = Math.abs(c1 - c2);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/** Alias that omits the grid parameter. */
export function isAdjacent(r1, c1, r2, c2) {
  return canSwap(null, r1, c1, r2, c2);
}

/**
 * Returns a new grid with the two cells swapped.
 */
export function applySwap(grid, r1, c1, r2, c2) {
  const next = grid.map((row) => [...row]);
  const tmp = next[r1][c1];
  next[r1][c1] = next[r2][c2];
  next[r2][c2] = tmp;
  return next;
}

/** Alias used by the UI layer. */
export const swapGems = applySwap;

/* ── Match detection ─────────────────────────────────────────────────────── */

/**
 * Finds all horizontal and vertical matches of 3+ gems.
 * Returns `{ matches: [{row, col}…], specials: [{row, col, specialType}…] }`.
 *
 * Special types:
 *   lineH    — horizontal line-clear (4-in-a-row)
 *   lineV    — vertical line-clear   (4-in-a-row)
 *   bomb     — 3×3 explosion         (T/L shape ≥5)
 *   supernova — clear all same type  (5-in-a-row)
 *
 * @param {Array<Array<object>>} grid
 * @returns {{ matches: Array<{row:number,col:number}>, specials: Array<{row:number,col:number,specialType:string}> }}
 */
export function findMatches(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const matched = new Set();

  // Horizontal segments
  for (let r = 0; r < rows; r++) {
    let runStart = 0;
    for (let c = 1; c <= cols; c++) {
      const prev = grid[r][c - 1];
      const curr = c < cols ? grid[r][c] : null;
      if (!curr || !prev || curr.type !== prev.type) {
        const len = c - runStart;
        if (len >= 3) {
          for (let k = runStart; k < c; k++) matched.add(`${r},${k}`);
        }
        runStart = c;
      }
    }
  }

  // Vertical segments
  for (let c = 0; c < cols; c++) {
    let runStart = 0;
    for (let r = 1; r <= rows; r++) {
      const prev = grid[r - 1][c];
      const curr = r < rows ? grid[r][c] : null;
      if (!curr || !prev || curr.type !== prev.type) {
        const len = r - runStart;
        if (len >= 3) {
          for (let k = runStart; k < r; k++) matched.add(`${k},${c}`);
        }
        runStart = r;
      }
    }
  }

  const basicMatches = Array.from(matched).map((s) => {
    const [row, col] = s.split(',').map(Number);
    return { row, col };
  });

  return classifyShapes(basicMatches);
}

function classifyShapes(basicMatches) {
  const byCell = new Map();
  for (const m of basicMatches) {
    byCell.set(`${m.row},${m.col}`, { ...m, neighbors: [] });
  }

  // Build 4-directional adjacency within matched cells
  for (const cell of byCell.values()) {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const key = `${cell.row + dr},${cell.col + dc}`;
      if (byCell.has(key)) cell.neighbors.push(byCell.get(key));
    }
  }

  const specials = [];
  const visited = new Set();

  for (const cell of byCell.values()) {
    const key = `${cell.row},${cell.col}`;
    if (visited.has(key)) continue;

    // BFS connected component
    const comp = [];
    const queue = [cell];
    visited.add(key);
    while (queue.length) {
      const cur = queue.shift();
      comp.push(cur);
      for (const n of cur.neighbors) {
        const nk = `${n.row},${n.col}`;
        if (!visited.has(nk)) {
          visited.add(nk);
          queue.push(n);
        }
      }
    }

    specials.push(...classifyComponent(comp).specials);
  }

  return { matches: basicMatches, specials };
}

function classifyComponent(comp) {
  const specials = [];
  if (comp.length < 3) return { specials };

  const compRows = comp.map((c) => c.row);
  const compCols = comp.map((c) => c.col);
  const height = Math.max(...compRows) - Math.min(...compRows) + 1;
  const width  = Math.max(...compCols) - Math.min(...compCols) + 1;

  const sorted = [...comp].sort((a, b) => a.row !== b.row ? a.row - b.row : a.col - b.col);
  const midIdx = Math.floor(sorted.length / 2);

  // 5-in-a-row → supernova at median cell
  if (comp.length >= 5 && (height === 1 || width === 1)) {
    const center = sorted[midIdx];
    specials.push({ row: center.row, col: center.col, specialType: 'supernova' });
    return { specials };
  }

  // T / L shape (5+ cells spanning 2+ rows and cols) → bomb at intersection
  if (comp.length >= 5 && height >= 2 && width >= 2) {
    const compSet = new Set(comp.map((c) => `${c.row},${c.col}`));
    const degrees = new Map(comp.map((cell) => [
      `${cell.row},${cell.col}`,
      [[0, 1], [0, -1], [1, 0], [-1, 0]].reduce(
        (n, [dr, dc]) => n + (compSet.has(`${cell.row + dr},${cell.col + dc}`) ? 1 : 0), 0
      ),
    ]));
    const intersection = comp.reduce((best, cell) =>
      degrees.get(`${cell.row},${cell.col}`) > degrees.get(`${best.row},${best.col}`) ? cell : best
    , comp[0]);
    specials.push({ row: intersection.row, col: intersection.col, specialType: 'bomb' });
    return { specials };
  }

  // 4-in-a-row → line-clear at the median cell
  if (comp.length === 4 && (height === 1 || width === 1)) {
    const medianCell = sorted[midIdx];
    specials.push({
      row: medianCell.row,
      col: medianCell.col,
      specialType: height === 1 ? 'lineH' : 'lineV',
    });
  }

  return { specials };
}

/* ── Applying matches ────────────────────────────────────────────────────── */

/**
 * Applies a match result to the grid:
 *  1. Captures pre-existing specials that are being matched (to trigger later).
 *  2. Places newly-created specials at designated cells.
 *  3. Clears remaining matched cells.
 *  4. Triggers only the pre-existing specials.
 *
 * @param {Array<Array<object>>} grid
 * @param {{ matches: Array<{row,col}>, specials: Array<{row,col,specialType}> }} matchResult
 * @param {number} [comboLevel=1]
 * @returns {Array<Array<object>>} New grid.
 */
export function applyMatches(grid, matchResult, comboLevel = 1) {
  const { matches, specials } = matchResult;
  const next = grid.map((row) => [...row]);
  const toClear = new Set(matches.map((m) => `${m.row},${m.col}`));

  // Capture pre-existing specials before clearing anything
  const preExistingSpecials = matches
    .filter((m) => next[m.row][m.col]?.special)
    .map((m) => ({ row: m.row, col: m.col, type: next[m.row][m.col].special }));

  // Place newly-created special gems (remove from clear list so they persist)
  for (const s of specials) {
    const key = `${s.row},${s.col}`;
    if (toClear.has(key)) {
      toClear.delete(key);
      const cell = next[s.row][s.col];
      next[s.row][s.col] = {
        ...(cell || {}),
        type: cell?.type || 'star',
        special: s.specialType,
        createdBy: 'shape',
      };
    }
  }

  // Clear remaining matched cells
  for (const key of toClear) {
    const [r, c] = key.split(',').map(Number);
    next[r][c] = null;
  }

  // Trigger ONLY pre-existing specials that were part of the match
  for (const ps of preExistingSpecials) {
    triggerSpecial(next, ps.row, ps.col, ps.type, comboLevel);
  }

  return next;
}

/**
 * Clears cells affected by a special gem in-place (mutates the grid copy).
 *
 * @param {Array<Array<object>>} grid - Mutable grid copy.
 * @param {number} row
 * @param {number} col
 * @param {string} type - 'lineH' | 'lineV' | 'bomb' | 'supernova'
 * @param {number} [comboLevel=1]
 */
export function triggerSpecial(grid, row, col, type, _comboLevel = 1) {
  const rows = grid.length;
  const cols = grid[0].length;

  const mark = (r, c) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    grid[r][c] = null;
  };

  if (type === 'lineH') {
    for (let c = 0; c < cols; c++) mark(row, c);
  } else if (type === 'lineV') {
    for (let r = 0; r < rows; r++) mark(r, col);
  } else if (type === 'bomb') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        mark(row + dr, col + dc);
      }
    }
  } else if (type === 'supernova') {
    const targetType = grid[row][col]?.type;
    if (!targetType) return;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c]?.type === targetType) mark(r, c);
      }
    }
  }
}

/* ── Gravity ─────────────────────────────────────────────────────────────── */

/**
 * Applies gravity: shifts non-null cells down, fills the top with new gems.
 * @param {Array<Array<object>>} grid
 * @returns {Array<Array<object>>}
 */
export function applyGravity(grid) {
  const next = grid.map((row) => [...row]);
  for (let c = 0; c < GRID_SIZE; c++) {
    const gems = [];
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      if (next[r][c] !== null) gems.push(next[r][c]);
    }
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      next[r][c] = gems.length > 0 ? gems.shift() : makeGem(randomGemType());
    }
  }
  return next;
}

/* ── Legacy compatibility ────────────────────────────────────────────────── */

/**
 * Legacy helper: clears matched cells and optionally places replacements.
 * Prefer `applyMatches` + `applyGravity` for new code.
 *
 * @param {Array<Array<object|string|null>>} grid
 * @param {Array<{r:number,c:number}>} matchCells
 * @param {Array<{r:number,c:number,kind?:string,special?:string}>} [replacements=[]]
 * @returns {Array<Array<object|null>>}
 */
export function clearMatches(grid, matchCells, replacements = []) {
  const next = grid.map((row) => [...row]);
  matchCells.forEach(({ r, c }) => {
    next[r][c] = null;
  });
  replacements.forEach((repl) => {
    next[repl.r][repl.c] = makeGem(repl.kind || randomGemType(), repl.special || null);
  });
  return next;
}
