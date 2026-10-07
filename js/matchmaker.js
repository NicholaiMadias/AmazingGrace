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
 *   triggerSpecial(grid, row,col, kind, comboLevel?) → void (mutates copy)
 *   applyGravity(grid)                  → grid
 *   clearMatches(grid, matchCells, replacements?) → grid  (legacy compat)
 */

export const GRID_SIZE = 7;

const GEM_TYPES = ['heart', 'star', 'cross', 'flame', 'drop'];

function randomGemType() {
  return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
}

/**
 * Returns the kind string from a gem value (string or object).
 */
function gemType(gem) {
  if (!gem) return null;
  return typeof gem === 'string' ? gem : gem.kind;
}

function cellKey(row, col) {
  return row * GRID_SIZE + col;
}

function cellFromKey(key) {
  return { row: Math.floor(key / GRID_SIZE), col: key % GRID_SIZE };
}

function makeGem(kind, special = null) {
  return special ? { kind, special, createdBy: null } : kind;
}

/* ── Grid creation ───────────────────────────────────────────────────────── */

/**
 * Creates an initial 7×7 grid of gem objects with no pre-existing matches.
 * @returns {Array<Array<object|string>>}
 */
export function createInitialGrid() {
  const grid = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let kind;
      do {
        kind = randomGemType();
      } while (
        (c >= 2 && gemType(grid[r][c - 1]) === kind && gemType(grid[r][c - 2]) === kind) ||
        (r >= 2 && gemType(grid[r - 1][c]) === kind && gemType(grid[r - 2][c]) === kind)
      );
      grid[r][c] = makeGem(kind);
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
 * Special kinds:
 *   lineH    — horizontal line-clear (4-in-a-row)
 *   lineV    — vertical line-clear   (4-in-a-row)
 *   bomb     — 3×3 explosion         (T/L shape ≥5)
 *   supernova — clear all same kind  (5-in-a-row)
 *
 * @param {Array<Array<object|string>>} grid
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
      if (!curr || !prev || gemType(curr) !== gemType(prev)) {
        const len = c - runStart;
        if (len >= 3) {
          for (let k = runStart; k < c; k++) matched.add(cellKey(r, k));
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
      if (!curr || !prev || gemType(curr) !== gemType(prev)) {
        const len = r - runStart;
        if (len >= 3) {
          for (let k = runStart; k < r; k++) matched.add(cellKey(k, c));
        }
        runStart = r;
      }
    }
  }

  const basicMatches = Array.from(matched, cellFromKey);

  return classifyShapes(basicMatches);
}

function classifyShapes(basicMatches) {
  const byCell = new Map();
  for (const m of basicMatches) {
    byCell.set(cellKey(m.row, m.col), { ...m, neighbors: [] });
  }

  // Build 4-directional adjacency within matched cells
  for (const cell of byCell.values()) {
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const key = cellKey(cell.row + dr, cell.col + dc);
      if (byCell.has(key)) cell.neighbors.push(byCell.get(key));
    }
  }

  const specials = [];
  const visited = new Set();

  for (const cell of byCell.values()) {
    const key = cellKey(cell.row, cell.col);
    if (visited.has(key)) continue;

    // BFS connected component
    const comp = [];
    const queue = [cell];
    let queueIndex = 0;
    visited.add(key);
    while (queueIndex < queue.length) {
      const cur = queue[queueIndex++];
      comp.push(cur);
      for (const n of cur.neighbors) {
        const nk = cellKey(n.row, n.col);
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

/**
 * Returns matches grouped by connected component (legacy format).
 * @param {Array<Array<object|string>>} grid
 * @returns {Array<Array<{r:number, c:number}>>}
 */
export function findMatchesGrouped(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const matched = new Set();

  for (let r = 0; r < rows; r++) {
    let runStart = 0;
    for (let c = 1; c <= cols; c++) {
      const prev = grid[r][c - 1];
      const curr = c < cols ? grid[r][c] : null;
      if (!curr || !prev || gemType(curr) !== gemType(prev)) {
        const len = c - runStart;
        if (len >= 3) {
          for (let k = runStart; k < c; k++) matched.add(cellKey(r, k));
        }
        runStart = c;
      }
    }
  }

  for (let c = 0; c < cols; c++) {
    let runStart = 0;
    for (let r = 1; r <= rows; r++) {
      const prev = grid[r - 1][c];
      const curr = r < rows ? grid[r][c] : null;
      if (!curr || !prev || gemType(curr) !== gemType(prev)) {
        const len = r - runStart;
        if (len >= 3) {
          for (let k = runStart; k < r; k++) matched.add(cellKey(k, c));
        }
        runStart = r;
      }
    }
  }

  // BFS to group matched cells into components
  const byCell = new Set(matched);
  const groups = [];
  const visited = new Set();

  for (const key of byCell) {
    if (visited.has(key)) continue;
    const group = [];
    const queue = [key];
    let queueIndex = 0;
    visited.add(key);
    while (queueIndex < queue.length) {
      const cur = queue[queueIndex++];
      const { row: r, col: c } = cellFromKey(cur);
      group.push({ r, c });
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nk = cellKey(r + dr, c + dc);
        if (byCell.has(nk) && !visited.has(nk)) {
          visited.add(nk);
          queue.push(nk);
        }
      }
    }
    groups.push(group);
  }

  return groups;
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
    const compSet = new Set(comp.map((c) => cellKey(c.row, c.col)));
    const degrees = new Map(comp.map((cell) => [
      cellKey(cell.row, cell.col),
      [[0, 1], [0, -1], [1, 0], [-1, 0]].reduce(
        (n, [dr, dc]) => n + (compSet.has(cellKey(cell.row + dr, cell.col + dc)) ? 1 : 0), 0
      ),
    ]));
    const intersection = comp.reduce((best, cell) =>
      degrees.get(cellKey(cell.row, cell.col)) > degrees.get(cellKey(best.row, best.col)) ? cell : best
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
 * @param {Array<Array<object|string>>} grid
 * @param {{ matches: Array<{row,col}>, specials: Array<{row,col,specialType}> }} matchResult
 * @param {number} [comboLevel=1]
 * @returns {Array<Array<object|string>>} New grid.
 */
export function applyMatches(grid, matchResult, comboLevel = 1) {
  const { matches, specials } = matchResult;
  const next = grid.map((row) => [...row]);
  const toClear = new Set(matches.map((m) => cellKey(m.row, m.col)));

  // Capture pre-existing specials before clearing anything
  const preExistingSpecials = matches
    .filter((m) => typeof next[m.row][m.col] === 'object' && next[m.row][m.col]?.special)
    .map((m) => ({
      row: m.row,
      col: m.col,
      kind: next[m.row][m.col].special,
      gemKind: gemType(next[m.row][m.col])
    }));

  // Place newly-created special gems (remove from clear list so they persist)
  for (const s of specials) {
    const key = cellKey(s.row, s.col);
    if (toClear.has(key)) {
      toClear.delete(key);
      const cell = next[s.row][s.col];
      const kind = gemType(cell) || 'star';
      next[s.row][s.col] = makeGem(kind, s.specialType);
      // Explicitly mark as created by shape if it was an object before, or just force it
      if (typeof next[s.row][s.col] === 'object') {
        next[s.row][s.col].createdBy = 'shape';
      }
    }
  }

  // Clear remaining matched cells
  for (const key of toClear) {
    const { row: r, col: c } = cellFromKey(key);
    next[r][c] = null;
  }

  // Trigger ONLY pre-existing specials that were part of the match
  for (const ps of preExistingSpecials) {
    triggerSpecial(next, ps.row, ps.col, ps.kind, comboLevel, ps.gemKind);
  }

  return next;
}

/**
 * Clears cells affected by a special gem in-place (mutates the grid copy).
 *
 * @param {Array<Array<object|string>>} grid - Mutable grid copy.
 * @param {number} row
 * @param {number} col
 * @param {string} kind - 'lineH' | 'lineV' | 'bomb' | 'supernova'
 * @param {number} [comboLevel=1]
 * @param {string|null} [targetType=null] - Pre-captured gem type for supernovas.
 */
export function triggerSpecial(grid, row, col, kind, _comboLevel = 1, targetType = null) {
  const rows = grid.length;
  const cols = grid[0].length;

  const mark = (r, c) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return;
    grid[r][c] = null;
  };

  if (kind === 'lineH') {
    for (let c = 0; c < cols; c++) mark(row, c);
  } else if (kind === 'lineV') {
    for (let r = 0; r < rows; r++) mark(r, col);
  } else if (kind === 'bomb') {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        mark(row + dr, col + dc);
      }
    }
  } else if (kind === 'supernova') {
    const actualTargetType = targetType || gemType(grid[row][col]);
    if (!actualTargetType) return;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (gemType(grid[r][c]) === actualTargetType) mark(r, c);
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
    const compactedLength = gems.length;
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      const compactedIndex = GRID_SIZE - 1 - r;
      next[r][c] = compactedIndex < compactedLength
        ? gems[compactedIndex]
        : makeGem(randomGemType());
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

/**
 * Attach mouse + touch drag-to-swap to a board container.
 * Cells are located via `cellAt(el)` which must return `{ r, c }` or null for
 * an element inside the container. A drag from one cell to an adjacent cell
 * calls `onSwap(from, to)`; plain taps are left to the existing click handlers.
 * Returns a function that detaches the listeners.
 */
export function attachDragSwap(container, { cellAt, onSwap, enabled = () => true }) {
  let src = null;
  let srcEl = null;
  let tgtEl = null;
  const originalTouchAction = container.style.touchAction;

  const resolve = (x, y) => {
    const el = document.elementFromPoint(x, y);
    const cellEl = el && container.contains(el) ? el.closest('[data-r][data-c]') : null;
    const cell = cellEl ? cellAt(cellEl) : null;
    return cell ? { cell, el: cellEl } : null;
  };

  const clearPreview = () => {
    if (srcEl) { srcEl.style.transform = ''; srcEl.style.outline = ''; srcEl.style.zIndex = ''; }
    if (tgtEl) { tgtEl.style.transform = ''; tgtEl.style.outline = ''; }
    srcEl = null;
    tgtEl = null;
  };

  const start = (x, y) => {
    if (!enabled()) return;
    const hit = resolve(x, y);
    if (!hit) return;
    src = hit.cell;
    srcEl = hit.el;
    srcEl.style.outline = '2px solid #00f2ff';
    srcEl.style.zIndex = '2';
  };

  const move = (x, y) => {
    if (!src) return;
    const hit = resolve(x, y);
    if (tgtEl) { tgtEl.style.transform = ''; tgtEl.style.outline = ''; tgtEl = null; }
    srcEl.style.transform = '';
    if (hit && isAdjacent(src.r, src.c, hit.cell.r, hit.cell.c)) {
      tgtEl = hit.el;
      tgtEl.style.outline = '2px dashed #facc15';
      const dx = (hit.cell.c - src.c) * 30;
      const dy = (hit.cell.r - src.r) * 30;
      srcEl.style.transform = `translate(${dx}%, ${dy}%) scale(1.08)`;
      tgtEl.style.transform = `translate(${-dx}%, ${-dy}%)`;
    }
  };

  const end = (x, y) => {
    if (!src) return;
    const from = src;
    const hit = resolve(x, y);
    src = null;
    clearPreview();
    if (hit && isAdjacent(from.r, from.c, hit.cell.r, hit.cell.c) && enabled()) {
      onSwap(from, hit.cell);
    }
  };

  const onMouseDown = (e) => { if (e.button === 0) start(e.clientX, e.clientY); };
  const onMouseMove = (e) => move(e.clientX, e.clientY);
  const onMouseUp = (e) => end(e.clientX, e.clientY);
  const onTouchStart = (e) => { const t = e.touches[0]; if (t) start(t.clientX, t.clientY); };
  const onTouchMove = (e) => {
    const t = e.touches[0];
    if (t && src) { e.preventDefault(); move(t.clientX, t.clientY); }
  };
  const onTouchEnd = (e) => {
    const t = e.changedTouches[0];
    if (!t) return;
    const wasDrag = !!src;
    const moved = tgtEl !== null;
    end(t.clientX, t.clientY);
    if (wasDrag && moved && e.cancelable) e.preventDefault();
  };
  const onTouchCancel = () => { src = null; clearPreview(); };

  container.style.touchAction = 'none';
  container.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
  container.addEventListener('touchstart', onTouchStart, { passive: true });
  container.addEventListener('touchmove', onTouchMove, { passive: false });
  container.addEventListener('touchend', onTouchEnd);
  container.addEventListener('touchcancel', onTouchCancel);

  return () => {
    container.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    container.removeEventListener('touchstart', onTouchStart);
    container.removeEventListener('touchmove', onTouchMove);
    container.removeEventListener('touchend', onTouchEnd);
    container.removeEventListener('touchcancel', onTouchCancel);
    container.style.touchAction = originalTouchAction;
  };
}
