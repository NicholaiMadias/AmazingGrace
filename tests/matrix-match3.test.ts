import { describe, it, expect } from 'vitest';
import {
    createBoard, findMatches, trySwap, resolveBoard, hasPossibleMove, dragTarget, areAdjacent,
    type Board,
} from '../matrix-of-conscience/match3';

const seq = (values: number[]) => { let i = 0; return () => values[i++ % values.length]; };

describe('matrix match-3 engine', () => {
    it('createBoard yields a stable, playable board', () => {
        const b = createBoard(7, 7, 5);
        expect(findMatches(b).size).toBe(0);
        expect(hasPossibleMove(b)).toBe(true);
    });

    it('findMatches detects horizontal and vertical runs of 3+', () => {
        const b: Board = [
            [1, 1, 1, 2],
            [0, 2, 3, 2],
            [3, 0, 4, 2],
            [4, 3, 0, 1],
        ];
        expect([...findMatches(b)].sort()).toEqual(['0,0', '0,1', '0,2', '0,3', '1,3', '2,3']);
    });

    it('trySwap rolls back invalid moves', () => {
        const b: Board = [
            [0, 1, 2],
            [1, 2, 0],
            [2, 0, 1],
        ];
        const res = trySwap(b, { r: 0, c: 0 }, { r: 0, c: 1 }, 3);
        expect(res.valid).toBe(false);
        expect(res.board).toBe(b);
        expect(res.score).toBe(0);
    });

    it('trySwap rejects non-adjacent and out-of-bounds swaps', () => {
        const b: Board = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];
        expect(trySwap(b, { r: 0, c: 0 }, { r: 2, c: 2 }, 3).valid).toBe(false);
        expect(trySwap(b, { r: 0, c: 0 }, { r: -1, c: 0 }, 3).valid).toBe(false);
    });

    it('trySwap accepts a matching swap and scores it', () => {
        const b: Board = [
            [1, 1, 0],
            [0, 0, 1],
            [2, 2, 0],
        ];
        const res = trySwap(b, { r: 0, c: 2 }, { r: 1, c: 2 }, 3, seq([0.1, 0.5, 0.9]));
        expect(res.valid).toBe(true);
        expect(res.score).toBeGreaterThan(0);
        expect(findMatches(res.board).size).toBe(0);
    });

    it('resolveBoard cascades until stable', () => {
        const b: Board = [
            [2, 2, 2],
            [0, 0, 0],
            [1, 2, 1],
        ];
        const res = resolveBoard(b, 3, seq([0.1, 0.5, 0.9]));
        expect(res.chains).toBeGreaterThanOrEqual(1);
        expect(findMatches(res.board).size).toBe(0);
    });

    it('dragTarget picks the dominant axis neighbour', () => {
        expect(dragTarget({ r: 2, c: 2 }, 20, 5)).toEqual({ r: 2, c: 3 });
        expect(dragTarget({ r: 2, c: 2 }, -20, 5)).toEqual({ r: 2, c: 1 });
        expect(dragTarget({ r: 2, c: 2 }, 3, -20)).toEqual({ r: 1, c: 2 });
        expect(dragTarget({ r: 2, c: 2 }, 3, 20)).toEqual({ r: 3, c: 2 });
        expect(areAdjacent({ r: 2, c: 2 }, dragTarget({ r: 2, c: 2 }, 3, 20))).toBe(true);
    });
});

describe('MatchThreeLevel drag and drop', () => {
    const makeHost = () => {
        const stats = { score: 0, energy: 0, hp: 100 };
        return {
            ctx: {} as CanvasRenderingContext2D, width: 400, height: 500, stats, level: 2,
            sound: () => {}, changed: () => {}, complete: () => {}, fail: () => {},
        };
    };

    it('drags a tile to swap, rolls back invalid moves and unlocks input afterwards', async () => {
        const { MatchThreeLevel } = await import('../matrix-of-conscience/levels/matchThree');
        const host = makeHost();
        const level = new MatchThreeLevel(host);
        const internals = level as unknown as { board: Board; anim: unknown; layout(): { tile: number; ox: number; oy: number } };
        internals.board = Array.from({ length: 7 }, (_, r) => Array.from({ length: 7 }, (_, c) => (r * 2 + c * 3) % 5));
        const before = internals.board.map(row => row.slice());
        const { tile, ox, oy } = internals.layout();
        const x = ox + tile * 2.5;
        const y = oy + tile * 2.5;

        level.pointerDown({ x, y });
        level.pointerMove({ x: x + tile * 0.6, y });
        expect(internals.anim).not.toBeNull();
        for (let i = 0; i < 10; i++) level.update(0.1);
        expect(internals.anim).toBeNull();
        expect(internals.board).toEqual(before);
        expect(host.stats.score).toBe(0);

        level.pointerDown({ x, y });
        level.pointerMove({ x, y: y + tile * 0.6 });
        expect(internals.anim).not.toBeNull();
    });
});
