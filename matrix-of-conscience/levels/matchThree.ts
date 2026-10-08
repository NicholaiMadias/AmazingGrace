import type { Level, LevelHost, PointerInfo } from './types';
import {
    areAdjacent, createBoard, dragTarget, hasPossibleMove, inBounds, trySwap,
    type Board, type Pos, type SwapResult,
} from '../match3';

const ROWS = 7;
const COLS = 7;
const TYPES = 5;
const COLORS = ['#00ff66', '#00f3ff', '#f0c05a', '#ff0055', '#a855f7'];
const TARGET_SCORE = 1200;
const SWAP_SECONDS = 0.16;
const DRAG_THRESHOLD = 0.4; // fraction of a tile

interface DragState { from: Pos; startX: number; startY: number; x: number; y: number; }
interface SwapAnim { a: Pos; b: Pos; t: number; result: SwapResult; returning: boolean; }

export class MatchThreeLevel implements Level {
    private board: Board = createBoard(ROWS, COLS, TYPES);
    private selected: Pos | null = null;
    private drag: DragState | null = null;
    private anim: SwapAnim | null = null;
    private gained = 0;
    private done = false;

    constructor(private host: LevelHost) {}

    private layout() {
        const { width, height } = this.host;
        const tile = Math.max(24, Math.floor(Math.min(width - 16, height - 56) / Math.max(ROWS, COLS)));
        return {
            tile,
            ox: Math.floor((width - COLS * tile) / 2),
            oy: Math.floor((height - ROWS * tile) / 2) + 14,
        };
    }

    private cellAt(x: number, y: number): Pos | null {
        const { tile, ox, oy } = this.layout();
        const p = { r: Math.floor((y - oy) / tile), c: Math.floor((x - ox) / tile) };
        return inBounds(this.board, p) ? p : null;
    }

    /** Request a swap; invalid moves animate forward then roll back. */
    private requestSwap(a: Pos, b: Pos): void {
        if (this.anim || this.done) return;
        const result = trySwap(this.board, a, b, TYPES);
        this.anim = { a, b, t: 0, result, returning: false };
        this.selected = null;
    }

    pointerDown(p: PointerInfo): void {
        if (this.anim || this.done) return;
        const cell = this.cellAt(p.x, p.y);
        if (!cell) { this.selected = null; return; }
        this.drag = { from: cell, startX: p.x, startY: p.y, x: p.x, y: p.y };
    }

    pointerMove(p: PointerInfo): void {
        const d = this.drag;
        if (!d) return;
        d.x = p.x; d.y = p.y;
        const { tile } = this.layout();
        const dx = p.x - d.startX;
        const dy = p.y - d.startY;
        if (Math.hypot(dx, dy) >= tile * DRAG_THRESHOLD) {
            const target = dragTarget(d.from, dx, dy);
            this.drag = null;
            if (inBounds(this.board, target)) this.requestSwap(d.from, target);
            else this.host.sound(180, 0.08, 'sawtooth');
        }
    }

    pointerUp(): void {
        const d = this.drag;
        this.drag = null;
        if (!d || this.anim || this.done) return;
        // Tap: select, or swap with an adjacent selection
        if (!this.selected) { this.selected = d.from; return; }
        if (areAdjacent(this.selected, d.from)) this.requestSwap(this.selected, d.from);
        else this.selected = this.selected.r === d.from.r && this.selected.c === d.from.c ? null : d.from;
    }

    pointerCancel(): void { this.drag = null; }

    update(dt: number): void {
        const a = this.anim;
        if (!a || this.done) return;
        a.t += dt;
        if (a.t < SWAP_SECONDS) return;
        if (!a.returning && !a.result.valid) {
            a.returning = true; a.t = 0;
            this.host.sound(200, 0.12, 'sawtooth');
            return;
        }
        this.anim = null;
        if (!a.result.valid) return;

        this.board = a.result.board;
        this.gained += a.result.score;
        this.host.stats.score += a.result.score;
        this.host.sound(600 + Math.min(a.result.chains, 5) * 80, 0.1, 'sine');
        this.host.changed();
        if (this.gained >= TARGET_SCORE) { this.done = true; this.host.complete(); return; }
        if (!hasPossibleMove(this.board)) this.board = createBoard(ROWS, COLS, TYPES);
    }

    render(): void {
        const { ctx, width } = this.host;
        const { tile, ox, oy } = this.layout();
        const anim = this.anim;
        const drag = this.drag;

        ctx.lineWidth = 1;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
                ctx.strokeRect(ox + c * tile, oy + r * tile, tile, tile);
            }
        }

        const drawTile = (type: number, cx: number, cy: number) => {
            ctx.fillStyle = COLORS[type] ?? '#ffffff';
            ctx.beginPath();
            ctx.arc(cx, cy, tile * 0.35, 0, Math.PI * 2);
            ctx.fill();
        };

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const type = this.board[r][c];
                if (type === null) continue;
                const isAnimated = anim && ((anim.a.r === r && anim.a.c === c) || (anim.b.r === r && anim.b.c === c));
                const isDragged = drag && drag.from.r === r && drag.from.c === c;
                if (isAnimated || isDragged) continue;
                drawTile(type, ox + c * tile + tile / 2, oy + r * tile + tile / 2);
            }
        }

        if (anim) {
            const raw = Math.min(1, anim.t / SWAP_SECONDS);
            const p = anim.returning ? 1 - raw : raw;
            const ta = this.board[anim.a.r][anim.a.c];
            const tb = this.board[anim.b.r][anim.b.c];
            const ax = ox + anim.a.c * tile + tile / 2, ay = oy + anim.a.r * tile + tile / 2;
            const bx = ox + anim.b.c * tile + tile / 2, by = oy + anim.b.r * tile + tile / 2;
            if (ta !== null) drawTile(ta, ax + (bx - ax) * p, ay + (by - ay) * p);
            if (tb !== null) drawTile(tb, bx + (ax - bx) * p, by + (ay - by) * p);
        }

        if (drag) {
            const t = this.board[drag.from.r][drag.from.c];
            const cx = ox + drag.from.c * tile + tile / 2;
            const cy = oy + drag.from.r * tile + tile / 2;
            if (t !== null) {
                const limit = tile * DRAG_THRESHOLD;
                drawTile(t, cx + Math.max(-limit, Math.min(limit, drag.x - drag.startX)), cy + Math.max(-limit, Math.min(limit, drag.y - drag.startY)));
            }
        }

        if (this.selected) {
            ctx.strokeStyle = '#f0c05a';
            ctx.lineWidth = 3;
            ctx.strokeRect(ox + this.selected.c * tile + 2, oy + this.selected.r * tile + 2, tile - 4, tile - 4);
            ctx.lineWidth = 1;
        }

        ctx.fillStyle = '#00f3ff';
        ctx.font = '14px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`DECRYPTION: ${this.gained} / ${TARGET_SCORE} — drag or tap tiles to swap`, width / 2, Math.max(16, oy - 10));
        ctx.textAlign = 'start';
    }
}
