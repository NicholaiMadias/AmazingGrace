export const GRID_SIZE = 7;

const GEM_TYPES = ['heart', 'star', 'cross', 'flame', 'drop'];

function randomGem() {
  return GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)];
}

/**
 * Returns the gem kind string from a gem value (string or object).
 */
function gemKind(gem) {
  if (!gem) return null;
  return typeof gem === 'string' ? gem : gem.kind;
}

/**
 * Returns true if two gem cells are the same type.
 */
function sameKind(a, b) {
  return gemKind(a) === gemKind(b);
}

/**
 * Returns a deep clone of the 2-D grid.
 */
function cloneGrid(grid) {
  return grid.map(row => row.slice());
}

/**
 * Creates a gem value. Special gems are objects; plain gems are strings.
 */
function makeGem(kind, special) {
  return special ? { kind, special } : kind;
}

/**
 * Creates an initial 7×7 grid with no pre-existing matches.
 */
export function createInitialGrid() {
  const grid = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      let gem;
      do {
        gem = randomGem();
      } while (
        (c >= 2 && sameKind(grid[r][c - 1], gem) && sameKind(grid[r][c - 2], gem)) ||
        (r >= 2 && sameKind(grid[r - 1][c], gem) && sameKind(grid[r - 2][c], gem))
      );
      grid[r][c] = gem;
    }
  }
  return grid;
}

/**
 * Returns true if the two cells are adjacent (share an edge).
 */
export function canSwap(grid, r1, c1, r2, c2) {
  const rowDiff = Math.abs(r1 - r2);
  const colDiff = Math.abs(c1 - c2);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/**
 * Returns a new grid with the two cells swapped.
 */
export function applySwap(grid, r1, c1, r2, c2) {
  const next = cloneGrid(grid);
  const tmp = next[r1][c1];
  next[r1][c1] = next[r2][c2];
  next[r2][c2] = tmp;
  return next;
}

/**
 * Finds all horizontal and vertical matches of 3 or more.
 * Returns an array of match arrays, each match being an array of {r, c} objects.
 */
export function findMatches(grid) {
  const groups = [];

  // Horizontal runs
  for (let r = 0; r < GRID_SIZE; r++) {
    let run = [{ r, c: 0 }];
    for (let c = 1; c <= GRID_SIZE; c++) {
      if (c < GRID_SIZE && grid[r][c] && grid[r][c - 1] && sameKind(grid[r][c], grid[r][c - 1])) {
        run.push({ r, c });
      } else {
        if (run.length >= 3) groups.push(run);
        run = [{ r, c }];
      }
    }
  }

  // Vertical runs
  for (let c = 0; c < GRID_SIZE; c++) {
    let run = [{ r: 0, c }];
    for (let r = 1; r <= GRID_SIZE; r++) {
      if (r < GRID_SIZE && grid[r][c] && grid[r - 1][c] && sameKind(grid[r][c], grid[r - 1][c])) {
        run.push({ r, c });
      } else {
        if (run.length >= 3) groups.push(run);
        run = [{ r, c }];
      }
    }
  }

  return groups;
}

/**
 * Returns a new grid with matched cells set to null and optional replacements placed.
 * Accepts either a flat array of {r, c} cells or grouped match arrays as returned by findMatches().
 */
export function clearMatches(grid, matchCells, replacements = []) {
  const next = cloneGrid(grid);
  const cellsToClear = matchCells.flatMap(cellOrGroup =>
    Array.isArray(cellOrGroup) ? cellOrGroup : [cellOrGroup]
  );

  cellsToClear.forEach(({ r, c }) => {
    next[r][c] = null;
  });
  replacements.forEach(repl => {
    next[repl.r][repl.c] = makeGem(repl.kind || randomGem(), repl.special || null);
  });
  return next;
}

/**
 * Applies gravity: shifts non-null cells down, fills top with new random gems.
 */
export function applyGravity(grid) {
  const next = cloneGrid(grid);
  for (let c = 0; c < GRID_SIZE; c++) {
    const gems = [];
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      if (next[r][c] !== null) gems.push(next[r][c]);
    }
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      next[r][c] = gems.length > 0 ? gems.shift() : randomGem();
    }
  }
  return next;
}
