// ─── Match-3 pure engine (no DOM / React) ────────────────────────────────────
export type Cell = number | null;
export type Board = Cell[][];
export interface Pos { r: number; c: number; }
export type Rng = () => number;

export const POINTS_PER_TILE = 20;

export const posKey = (r: number, c: number): string => `${r},${c}`;

export const areAdjacent = (a: Pos, b: Pos): boolean =>
    Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

export const inBounds = (board: Board, p: Pos): boolean =>
    p.r >= 0 && p.r < board.length && p.c >= 0 && p.c < (board[0]?.length ?? 0);

export const cloneBoard = (board: Board): Board => board.map(row => row.slice());

const randomType = (types: number, rng: Rng): number => Math.floor(rng() * types) % types;

export function findMatches(board: Board): Set<string> {
    const rows = board.length;
    const cols = board[0]?.length ?? 0;
    const matched = new Set<string>();

    for (let r = 0; r < rows; r++) {
        let c = 0;
        while (c < cols) {
            const t = board[r][c];
            let end = c;
            while (t !== null && end + 1 < cols && board[r][end + 1] === t) end++;
            if (t !== null && end - c >= 2) for (let i = c; i <= end; i++) matched.add(posKey(r, i));
            c = end + 1;
        }
    }
    for (let c = 0; c < cols; c++) {
        let r = 0;
        while (r < rows) {
            const t = board[r][c];
            let end = r;
            while (t !== null && end + 1 < rows && board[end + 1][c] === t) end++;
            if (t !== null && end - r >= 2) for (let i = r; i <= end; i++) matched.add(posKey(i, c));
            r = end + 1;
        }
    }
    return matched;
}

export function swapCells(board: Board, a: Pos, b: Pos): Board {
    const next = cloneBoard(board);
    const tmp = next[a.r][a.c];
    next[a.r][a.c] = next[b.r][b.c];
    next[b.r][b.c] = tmp;
    return next;
}

/** Drop tiles down and refill empty cells from the top. */
export function applyGravity(board: Board, types: number, rng: Rng): Board {
    const rows = board.length;
    const cols = board[0]?.length ?? 0;
    const next = cloneBoard(board);
    for (let c = 0; c < cols; c++) {
        let write = rows - 1;
        for (let r = rows - 1; r >= 0; r--) {
            if (next[r][c] !== null) {
                next[write][c] = next[r][c];
                if (write !== r) next[r][c] = null;
                write--;
            }
        }
        for (let r = write; r >= 0; r--) next[r][c] = randomType(types, rng);
    }
    return next;
}

export interface ResolveResult { board: Board; score: number; chains: number; }

/** Clear matches repeatedly (cascades) until the board is stable. */
export function resolveBoard(board: Board, types: number, rng: Rng): ResolveResult {
    let current = cloneBoard(board);
    let score = 0;
    let chains = 0;
    for (let guard = 0; guard < 100; guard++) {
        const matches = findMatches(current);
        if (matches.size === 0) break;
        chains++;
        score += matches.size * POINTS_PER_TILE * chains;
        matches.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            current[r][c] = null;
        });
        current = applyGravity(current, types, rng);
    }
    return { board: current, score, chains };
}

export function hasPossibleMove(board: Board): boolean {
    const rows = board.length;
    const cols = board[0]?.length ?? 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const a = { r, c };
            for (const b of [{ r, c: c + 1 }, { r: r + 1, c }]) {
                if (!inBounds(board, b)) continue;
                if (findMatches(swapCells(board, a, b)).size > 0) return true;
            }
        }
    }
    return false;
}

export function createBoard(rows: number, cols: number, types: number, rng: Rng = Math.random): Board {
    for (let attempt = 0; attempt < 50; attempt++) {
        const board: Board = [];
        for (let r = 0; r < rows; r++) {
            board.push([]);
            for (let c = 0; c < cols; c++) {
                let t: number;
                do {
                    t = randomType(types, rng);
                } while (
                    (c >= 2 && board[r][c - 1] === t && board[r][c - 2] === t) ||
                    (r >= 2 && board[r - 1][c] === t && board[r - 2][c] === t)
                );
                board[r].push(t);
            }
        }
        if (hasPossibleMove(board)) return board;
    }
    // Deterministic fallback guaranteeing a playable board
    const fallback: Board = [];
    for (let r = 0; r < rows; r++) {
        fallback.push([]);
        for (let c = 0; c < cols; c++) fallback[r].push((r * 2 + c) % types);
    }
    return fallback;
}

export interface SwapResult {
    valid: boolean;
    /** The resulting board; identical to the input when the move is invalid (rollback). */
    board: Board;
    score: number;
    chains: number;
}

/** Attempt to swap two cells. Invalid moves (non-adjacent or no match) roll back. */
export function trySwap(board: Board, a: Pos, b: Pos, types: number, rng: Rng = Math.random): SwapResult {
    if (!inBounds(board, a) || !inBounds(board, b) || !areAdjacent(a, b)) {
        return { valid: false, board, score: 0, chains: 0 };
    }
    const swapped = swapCells(board, a, b);
    if (findMatches(swapped).size === 0) return { valid: false, board, score: 0, chains: 0 };
    const res = resolveBoard(swapped, types, rng);
    return { valid: true, ...res };
}

/** Map a drag vector to the adjacent target cell (dominant axis). */
export function dragTarget(from: Pos, dx: number, dy: number): Pos {
    if (Math.abs(dx) >= Math.abs(dy)) return { r: from.r, c: from.c + (dx > 0 ? 1 : -1) };
    return { r: from.r + (dy > 0 ? 1 : -1), c: from.c };
}
