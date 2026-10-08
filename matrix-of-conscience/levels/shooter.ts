import type { Level, LevelHost, PointerInfo } from './types';

interface Invader { x: number; y: number; alive: boolean; }
interface Bullet { x: number; y: number; }

export class ShooterLevel implements Level {
    private player = { x: 0, y: 0 };
    private bullets: Bullet[] = [];
    private invaders: Invader[] = [];
    private direction = 1;
    private done = false;

    constructor(private host: LevelHost) {
        this.player.x = host.width / 2;
        this.player.y = host.height - 50;
        const cols = 8;
        const spacing = Math.min(60, Math.max(36, (host.width - 120) / cols));
        const startX = Math.max(50, (host.width - (cols - 1) * spacing) / 2);
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < cols; c++) this.invaders.push({ x: startX + c * spacing, y: 50 + r * 40, alive: true });
        }
    }

    move(dir: number): void {
        this.player.x = Math.max(30, Math.min(this.host.width - 30, this.player.x + dir * 30));
    }

    fire(): void {
        this.bullets.push({ x: this.player.x, y: this.player.y - 10 });
        this.host.sound(900, 0.04, 'square');
    }

    pointerDown({ x }: PointerInfo): void {
        this.player.x = Math.max(30, Math.min(this.host.width - 30, x));
        this.fire();
    }

    pointerMove({ x }: PointerInfo): void {
        this.player.x = Math.max(30, Math.min(this.host.width - 30, x));
    }

    keyDown(key: string): boolean {
        if (key === 'ArrowLeft' || key === 'a') this.move(-1);
        else if (key === 'ArrowRight' || key === 'd') this.move(1);
        else if (key === ' ' || key === 'ArrowUp') this.fire();
        else return false;
        return true;
    }

    update(dt: number): void {
        if (this.done) return;
        const w = this.host.width;
        let hitEdge = false;
        for (const inv of this.invaders) {
            if (!inv.alive) continue;
            inv.x += this.direction * 50 * dt;
            if (inv.x > w - 40 || inv.x < 40) hitEdge = true;
        }
        if (hitEdge) {
            this.direction *= -1;
            for (const inv of this.invaders) inv.y += 15;
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.y -= 350 * dt;
            const hit = this.invaders.find(inv => inv.alive && Math.hypot(b.x - inv.x, b.y - inv.y) < 20);
            if (hit) {
                hit.alive = false;
                this.bullets.splice(i, 1);
                this.host.stats.score += 100;
                this.host.sound(800, 0.05, 'triangle');
                this.host.changed();
            } else if (b.y < 0) {
                this.bullets.splice(i, 1);
            }
        }

        if (this.invaders.some(inv => inv.alive && inv.y >= this.player.y - 10)) {
            this.done = true;
            this.host.stats.hp = 0;
            this.host.changed();
            this.host.fail();
            return;
        }
        if (this.invaders.every(inv => !inv.alive)) { this.done = true; this.host.complete(); }
    }

    render(): void {
        const ctx = this.host.ctx;
        ctx.fillStyle = '#00ff66';
        ctx.fillRect(this.player.x - 15, this.player.y, 30, 15);
        ctx.fillStyle = '#ff0055';
        for (const inv of this.invaders) if (inv.alive) ctx.fillRect(inv.x - 15, inv.y - 10, 30, 20);
        ctx.fillStyle = '#00f3ff';
        for (const b of this.bullets) ctx.fillRect(b.x - 2, b.y, 4, 10);
    }
}
