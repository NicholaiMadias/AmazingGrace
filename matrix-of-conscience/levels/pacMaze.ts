import type { Level, LevelHost, PointerInfo } from './types';

const GRID = 32;
const MAX_X = 18;
const MAX_Y = 12;

interface Sentinel { x: number; y: number; dx: number; dy: number; }

export class PacMazeLevel implements Level {
    private player = { x: 2, y: 2 };
    private nodes: { x: number; y: number; collected: boolean }[] = [];
    private sentinels: Sentinel[] = [
        { x: 10, y: 10, dx: 1, dy: 0 },
        { x: 12, y: 4, dx: 0, dy: 1 },
    ];
    private done = false;

    constructor(private host: LevelHost) {
        for (let r = 2; r < 12; r += 2) for (let c = 2; c < 18; c += 2) this.nodes.push({ x: c, y: r, collected: false });
    }

    private clampTo(x: number, y: number): void {
        this.player.x = Math.max(1, Math.min(MAX_X, x));
        this.player.y = Math.max(1, Math.min(MAX_Y, y));
    }

    pointerDown({ x, y }: PointerInfo): void { this.clampTo(Math.floor(x / GRID), Math.floor(y / GRID)); }
    pointerMove({ x, y }: PointerInfo): void { this.clampTo(Math.floor(x / GRID), Math.floor(y / GRID)); }

    keyDown(key: string): boolean {
        const p = this.player;
        if (key === 'ArrowLeft' || key === 'a') this.clampTo(p.x - 1, p.y);
        else if (key === 'ArrowRight' || key === 'd') this.clampTo(p.x + 1, p.y);
        else if (key === 'ArrowUp' || key === 'w') this.clampTo(p.x, p.y - 1);
        else if (key === 'ArrowDown' || key === 's') this.clampTo(p.x, p.y + 1);
        else return false;
        return true;
    }

    update(dt: number): void {
        if (this.done) return;
        const { stats } = this.host;
        for (const s of this.sentinels) {
            s.x += s.dx * dt * 2; s.y += s.dy * dt * 2;
            if (s.x > MAX_X || s.x < 1) s.dx *= -1;
            if (s.y > MAX_Y || s.y < 1) s.dy *= -1;
            if (Math.hypot(s.x - this.player.x, s.y - this.player.y) < 1.0) {
                stats.hp -= 20;
                this.host.sound(200, 0.2, 'sawtooth');
                this.player = { x: 2, y: 2 };
                this.host.changed();
                if (stats.hp <= 0) { this.done = true; this.host.fail(); return; }
            }
        }
        for (const n of this.nodes) {
            if (!n.collected && Math.hypot(n.x - this.player.x, n.y - this.player.y) < 0.8) {
                n.collected = true; stats.score += 150;
                this.host.sound(750, 0.05, 'sine');
                this.host.changed();
            }
        }
        if (this.nodes.every(n => n.collected)) { this.done = true; this.host.complete(); }
    }

    render(): void {
        const ctx = this.host.ctx;
        ctx.fillStyle = '#f0c05a';
        for (const n of this.nodes) {
            if (n.collected) continue;
            ctx.beginPath(); ctx.arc(n.x * GRID, n.y * GRID, 6, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#00ff66';
        ctx.beginPath(); ctx.arc(this.player.x * GRID, this.player.y * GRID, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff0055';
        for (const s of this.sentinels) ctx.fillRect(s.x * GRID - 10, s.y * GRID - 10, 20, 20);
    }
}
