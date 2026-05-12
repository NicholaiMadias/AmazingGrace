const COLORS = ["red", "blue", "green", "yellow", "purple", "orange"];

export function createInitialGrid(rows, cols) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
  }
  return grid;
}

export function canSwap(r1, c1, r2, c2) {
  return (
    (Math.abs(r1 - r2) === 1 && c1 === c2) ||
    (Math.abs(c1 - c2) === 1 && r1 === r2)
  );
}

export function swapGems(grid, r1, c1, r2, c2) {
  const temp = grid[r1][c1];
  grid[r1][c1] = grid[r2][c2];
  grid[r2][c2] = temp;
}

export function findMatches(grid) {
  const seen = new Set();
  const matches = [];

  function addMatch(r, c) {
    const key = `${r},${c}`;
    if (!seen.has(key)) {
      seen.add(key);
      matches.push({ r, c });
    }
  }

  // Horizontal
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length - 2; c++) {
      const gem = grid[r][c];
      if (gem && gem === grid[r][c + 1] && gem === grid[r][c + 2]) {
        addMatch(r, c);
        addMatch(r, c + 1);
        addMatch(r, c + 2);
      }
    }
  }

  // Vertical
  for (let c = 0; c < grid[0].length; c++) {
    for (let r = 0; r < grid.length - 2; r++) {
      const gem = grid[r][c];
      if (gem && gem === grid[r + 1][c] && gem === grid[r + 2][c]) {
        addMatch(r, c);
        addMatch(r + 1, c);
        addMatch(r + 2, c);
      }
    }
  }

  return matches;
}

export function applyGravity(grid) {
  for (let c = 0; c < grid[0].length; c++) {
    let pointer = grid.length - 1;

    for (let r = grid.length - 1; r >= 0; r--) {
      if (grid[r][c] !== null) {
        grid[pointer][c] = grid[r][c];
        pointer--;
      }
    }

    while (pointer >= 0) {
      grid[pointer][c] = COLORS[Math.floor(Math.random() * COLORS.length)];
      pointer--;
    }
  }
}
