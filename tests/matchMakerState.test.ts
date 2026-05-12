import { describe, it, expect } from "vitest";
import {
  GRID_SIZE,
  createInitialGrid,
  canSwap,
  applySwap,
  findMatches,
  clearMatches,
  applyGravity,
} from "../matchMakerState.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build an empty GRID_SIZE × GRID_SIZE grid filled with the given gem kind. */
function uniformGrid(kind: string) {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(kind));
}

/** Build a grid from a 2-D array of strings (pads missing rows/cells with 'x'). */
function fromRows(rows: string[][]): (string | null)[][] {
  return Array.from({ length: GRID_SIZE }, (_, r) =>
    Array.from({ length: GRID_SIZE }, (_, c) => rows[r]?.[c] ?? "x"),
  );
}

// ── GRID_SIZE ─────────────────────────────────────────────────────────────────

describe("GRID_SIZE", () => {
  it("is 7", () => {
    expect(GRID_SIZE).toBe(7);
  });
});

// ── createInitialGrid ─────────────────────────────────────────────────────────

describe("createInitialGrid", () => {
  it("returns a 7×7 grid", () => {
    const grid = createInitialGrid();
    expect(grid).toHaveLength(GRID_SIZE);
    grid.forEach((row) => expect(row).toHaveLength(GRID_SIZE));
  });

  it("contains only valid gem types", () => {
    const VALID = new Set(["heart", "star", "cross", "flame", "drop"]);
    const grid = createInitialGrid();
    grid.forEach((row) =>
      row.forEach((cell) => expect(VALID.has(cell as string)).toBe(true)),
    );
  });

  it("has no pre-existing horizontal matches of 3", () => {
    const grid = createInitialGrid();
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 2; c < GRID_SIZE; c++) {
        const notAllSame =
          grid[r][c] !== grid[r][c - 1] || grid[r][c] !== grid[r][c - 2];
        expect(notAllSame).toBe(true);
      }
    }
  });

  it("has no pre-existing vertical matches of 3", () => {
    const grid = createInitialGrid();
    for (let r = 2; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const notAllSame =
          grid[r][c] !== grid[r - 1][c] || grid[r][c] !== grid[r - 2][c];
        expect(notAllSame).toBe(true);
      }
    }
  });
});

// ── canSwap ───────────────────────────────────────────────────────────────────

describe("canSwap", () => {
  const g = createInitialGrid();

  it("allows swapping horizontally adjacent cells", () => {
    expect(canSwap(g, 0, 0, 0, 1)).toBe(true);
  });

  it("allows swapping vertically adjacent cells", () => {
    expect(canSwap(g, 0, 0, 1, 0)).toBe(true);
  });

  it("rejects diagonal swaps", () => {
    expect(canSwap(g, 0, 0, 1, 1)).toBe(false);
  });

  it("rejects non-adjacent cells in the same row", () => {
    expect(canSwap(g, 0, 0, 0, 2)).toBe(false);
  });

  it("rejects non-adjacent cells in the same column", () => {
    expect(canSwap(g, 0, 0, 2, 0)).toBe(false);
  });

  it("rejects a cell with itself", () => {
    expect(canSwap(g, 3, 3, 3, 3)).toBe(false);
  });
});

// ── applySwap ─────────────────────────────────────────────────────────────────

describe("applySwap", () => {
  it("returns a new grid (immutability)", () => {
    const grid = createInitialGrid();
    const next = applySwap(grid, 0, 0, 0, 1);
    expect(next).not.toBe(grid);
  });

  it("swaps the two target cells", () => {
    const grid = createInitialGrid();
    const a = grid[0][0];
    const b = grid[0][1];
    const next = applySwap(grid, 0, 0, 0, 1);
    expect(next[0][0]).toEqual(b);
    expect(next[0][1]).toEqual(a);
  });

  it("leaves all other cells unchanged", () => {
    const grid = createInitialGrid();
    const next = applySwap(grid, 0, 0, 0, 1);
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if ((r === 0 && c === 0) || (r === 0 && c === 1)) continue;
        expect(next[r][c]).toEqual(grid[r][c]);
      }
    }
  });

  it("original grid is not mutated", () => {
    const grid = createInitialGrid();
    const original00 = grid[0][0];
    applySwap(grid, 0, 0, 0, 1);
    expect(grid[0][0]).toEqual(original00);
  });
});

// ── findMatches ───────────────────────────────────────────────────────────────

describe("findMatches", () => {
  it("returns empty array for a grid with no matches", () => {
    // createInitialGrid is guaranteed match-free
    const grid = createInitialGrid();
    expect(findMatches(grid)).toEqual([]);
  });

  it("detects a horizontal match of 3", () => {
    const grid = fromRows([
      ["heart", "heart", "heart", "star", "cross", "flame", "drop"],
    ]);
    const matches = findMatches(grid as any);
    expect(matches.length).toBeGreaterThanOrEqual(1);
    const cells = matches.flat();
    expect(cells.some(({ r, c }) => r === 0 && c === 0)).toBe(true);
    expect(cells.some(({ r, c }) => r === 0 && c === 1)).toBe(true);
    expect(cells.some(({ r, c }) => r === 0 && c === 2)).toBe(true);
  });

  it("detects a vertical match of 3", () => {
    // Build a 7-row grid where column 0 has 'star' in rows 0-2
    const rows = Array.from({ length: GRID_SIZE }, (_, r) =>
      Array.from({ length: GRID_SIZE }, (_, c) => {
        if (c === 0 && r < 3) return "star";
        return "heart";
      }),
    );
    // Avoid triggering a horizontal match of hearts in cols 1-6
    // (hearts fill 6 cells in every row, forming runs of 6)
    // Patch row 0–2, col 1 to 'cross' to break the runs
    rows[0][1] = "cross";
    rows[1][1] = "cross";
    rows[2][1] = "cross";
    const matches = findMatches(rows as any);
    const cells = matches.flat();
    const vertStarCells = cells.filter(({ r, c }) => c === 0 && r < 3);
    expect(vertStarCells.length).toBe(3);
  });

  it("detects a horizontal run of 4", () => {
    const row = ["heart", "heart", "heart", "heart", "star", "cross", "drop"];
    const grid = Array.from({ length: GRID_SIZE }, (_, r) =>
      r === 0 ? [...row] : ["star", "cross", "drop", "flame", "heart", "star", "cross"],
    );
    const matches = findMatches(grid as any);
    const cells = matches.flat();
    // All four heart positions should be found
    [0, 1, 2, 3].forEach((c) =>
      expect(cells.some((pos) => pos.r === 0 && pos.c === c)).toBe(true),
    );
  });

  it("returns empty on a grid of all-different gems (no 3-in-row)", () => {
    // Cycling pattern: every 5 consecutive cells cycle through all 5 kinds,
    // so no three consecutive identical gems can appear in any row or column.
    const gem = (r: number, c: number) => {
      const kinds = ["heart", "star", "cross", "flame", "drop"];
      return kinds[(r * 3 + c * 2) % kinds.length];
    };
    const grid = Array.from({ length: GRID_SIZE }, (_, r) =>
      Array.from({ length: GRID_SIZE }, (_, c) => gem(r, c)),
    );
    const matches = findMatches(grid as any);
    expect(matches).toHaveLength(0);
  });
});

// ── clearMatches ──────────────────────────────────────────────────────────────

describe("clearMatches", () => {
  it("nulls out the specified cells", () => {
    const grid = uniformGrid("heart") as any;
    const cells = [
      { r: 0, c: 0 },
      { r: 1, c: 1 },
    ];
    const next = clearMatches(grid, cells);
    expect(next[0][0]).toBeNull();
    expect(next[1][1]).toBeNull();
  });

  it("leaves unmentioned cells unchanged", () => {
    const grid = uniformGrid("heart") as any;
    const cells = [{ r: 0, c: 0 }];
    const next = clearMatches(grid, cells);
    expect(next[0][1]).toBe("heart");
    expect(next[1][0]).toBe("heart");
  });

  it("does not mutate the original grid", () => {
    const grid = uniformGrid("heart") as any;
    clearMatches(grid, [{ r: 0, c: 0 }]);
    expect(grid[0][0]).toBe("heart");
  });

  it("places replacement gems at the specified positions", () => {
    const grid = uniformGrid("heart") as any;
    const cells = [{ r: 0, c: 0 }];
    const replacements = [{ r: 0, c: 0, kind: "star", special: null as null }];
    const next = clearMatches(grid, cells, replacements);
    // replacements use makeGem internally; plain (non-special) gems are strings
    expect(next[0][0]).toBe("star");
  });

  it("creates a special-gem object when special is provided", () => {
    const grid = uniformGrid("heart") as any;
    const cells = [{ r: 2, c: 3 }];
    const replacements = [{ r: 2, c: 3, kind: "flame", special: "row" }];
    const next = clearMatches(grid, cells, replacements);
    expect(next[2][3]).toEqual({ kind: "flame", special: "row" });
  });
});

// ── applyGravity ──────────────────────────────────────────────────────────────

describe("applyGravity", () => {
  it("returns a new grid (immutability)", () => {
    const grid = createInitialGrid() as any;
    expect(applyGravity(grid)).not.toBe(grid);
  });

  it("shifts non-null gems downward after a null gap", () => {
    // Column 0: [null, 'heart', 'star', 'cross', 'flame', 'drop', 'heart']
    const grid = Array.from({ length: GRID_SIZE }, (_, r) =>
      Array.from({ length: GRID_SIZE }, (_, c) => {
        if (c === 0) {
          const col = [null, "heart", "star", "cross", "flame", "drop", "heart"];
          return col[r];
        }
        return "star";
      }),
    ) as any;

    const next = applyGravity(grid);
    // After gravity the null fills at the top; the 6 non-null gems occupy rows 1..6
    const col0 = Array.from({ length: GRID_SIZE }, (_, r) => next[r][0]);
    // Bottom 6 rows must be non-null
    col0.slice(1).forEach((cell) => expect(cell).not.toBeNull());
  });

  it("fills the top row with a new gem when there is a null at the bottom", () => {
    // Start with a column that has a null at the bottom
    const grid = Array.from({ length: GRID_SIZE }, (_, r) =>
      Array.from({ length: GRID_SIZE }, (_, c) => {
        if (c === 0 && r === GRID_SIZE - 1) return null;
        return "heart";
      }),
    ) as any;

    const next = applyGravity(grid);
    // All cells in column 0 should be non-null after gravity
    for (let r = 0; r < GRID_SIZE; r++) {
      expect(next[r][0]).not.toBeNull();
    }
  });

  it("produces a fully non-null grid when given a fully null column", () => {
    const grid = Array.from({ length: GRID_SIZE }, (_, r) =>
      Array.from({ length: GRID_SIZE }, (_, c) => (c === 3 ? null : "star")),
    ) as any;

    const next = applyGravity(grid);
    for (let r = 0; r < GRID_SIZE; r++) {
      expect(next[r][3]).not.toBeNull();
    }
  });
});
