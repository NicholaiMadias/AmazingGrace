import type { Level, LevelHost, PointerInfo, Stats, Wave } from './levels/types';
import { TowerDefenseLevel, type TowerType } from './levels/towerDefense';
import { MatchThreeLevel } from './levels/matchThree';
import { ShooterLevel } from './levels/shooter';
import { PacMazeLevel } from './levels/pacMaze';
import { BossLevel } from './levels/boss';
import { playSound } from './audio';

export const GAME_LEVELS: Record<number, string> = {
    1: 'TOWER DEFENSE SIEGE',
    2: 'NEURAL MATCH-3 DECRYPTION',
    3: 'GRID SPACE SHOOTER',
    4: 'DEEP SIEGE TD (EMP & SPITTERS)',
    5: 'CYBER MAZE SENTINEL DEFENSE',
    6: 'MATRIX OVERLORD CORE FIGHT',
};
export const TOTAL_LEVELS = 6;

export interface GameEvents {
    onChange(stats: Readonly<Stats>, level: number): void;
    onComplete(level: number): void;
    onFail(): void;
}

/** Owns the canvas, the single requestAnimationFrame loop and the active level. */
export class Game implements LevelHost {
    readonly stats: Stats = { score: 0, energy: 120, hp: 100 };
    level = 1;
    width = 800;
    height = 500;
    ctx: CanvasRenderingContext2D;
    private current: Level | null = null;
    private active = false;
    private raf = 0;
    private last = 0;
    private towerType: TowerType = 'aegis';

    constructor(private canvas: HTMLCanvasElement, private events: GameEvents) {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable');
        this.ctx = ctx;
    }

    sound(freq: number, duration?: number, type?: Wave): void { playSound(freq, duration, type); }
    changed(): void { this.events.onChange(this.stats, this.level); }
    complete(): void { this.active = false; this.events.onComplete(this.level); }
    fail(): void { this.active = false; this.events.onFail(); }

    resize(): void {
        const box = this.canvas.parentElement;
        if (!box) return;
        const dpr = window.devicePixelRatio || 1;
        this.width = Math.max(1, box.clientWidth);
        this.height = Math.max(1, box.clientHeight);
        this.canvas.width = Math.floor(this.width * dpr);
        this.canvas.height = Math.floor(this.height * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    start(): void {
        this.last = performance.now();
        const loop = (now: number) => {
            const dt = Math.min(0.1, (now - this.last) / 1000);
            this.last = now;
            this.ctx.clearRect(0, 0, this.width, this.height);
            if (this.current) {
                if (this.active) this.current.update(dt);
                this.current.render();
            }
            this.raf = requestAnimationFrame(loop);
        };
        this.raf = requestAnimationFrame(loop);
    }

    stop(): void { cancelAnimationFrame(this.raf); }

    startLevel(level: number): void {
        this.level = level;
        if (level === 1) this.stats.hp = 100;
        this.stats.energy = 120;
        this.resize();
        switch (level) {
            case 1: this.current = this.makeTd(false); break;
            case 2: this.current = new MatchThreeLevel(this); break;
            case 3: this.current = new ShooterLevel(this); break;
            case 4: this.current = this.makeTd(true); break;
            case 5: this.current = new PacMazeLevel(this); break;
            default: this.current = new BossLevel(this);
        }
        this.active = true;
        this.changed();
    }

    private makeTd(advanced: boolean): TowerDefenseLevel {
        const td = new TowerDefenseLevel(this, advanced);
        td.selected = this.towerType;
        return td;
    }

    reset(): void {
        this.stats.score = 0;
        this.stats.hp = 100;
        this.stats.energy = 120;
    }

    setTowerType(type: TowerType): void {
        this.towerType = type;
        if (this.current instanceof TowerDefenseLevel) this.current.selected = type;
    }

    moveShooter(dir: number): void { if (this.active && this.current instanceof ShooterLevel) this.current.move(dir); }
    fireShooter(): void { if (this.active && this.current instanceof ShooterLevel) this.current.fire(); }

    private point(e: PointerEvent): PointerInfo {
        const rect = this.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    pointerDown(e: PointerEvent): void { if (this.active) this.current?.pointerDown?.(this.point(e)); }
    pointerMove(e: PointerEvent): void { if (this.active) this.current?.pointerMove?.(this.point(e)); }
    pointerUp(e: PointerEvent): void { this.current?.pointerUp?.(this.point(e)); }
    pointerCancel(): void { this.current?.pointerCancel?.(); }

    keyDown(key: string): boolean { return this.active && !!this.current?.keyDown?.(key); }
}
