import type { Level, LevelHost, PointerInfo } from './types';

export type TowerType = 'aegis' | 'sunfire' | 'emp';

interface Tower { x: number; y: number; type: TowerType; range: number; damage: number; fireRate: number; cooldown: number; }
interface Enemy { x: number; y: number; pathIdx: number; hp: number; maxHp: number; speed: number; isSpitter: boolean; }
interface Projectile { x: number; y: number; tx: number; ty: number; damage: number; type: TowerType; }

export const TOWER_COST: Record<TowerType, number> = { aegis: 50, sunfire: 90, emp: 120 };
const TOWER_STATS: Record<TowerType, { range: number; damage: number; fireRate: number }> = {
    aegis: { range: 100, damage: 20, fireRate: 0.6 },
    sunfire: { range: 140, damage: 45, fireRate: 1.2 },
    emp: { range: 100, damage: 20, fireRate: 0.6 },
};
const ENEMIES_PER_WAVE = 8;

export class TowerDefenseLevel implements Level {
    selected: TowerType = 'aegis';
    private path: { x: number; y: number }[] = [];
    private towers: Tower[] = [];
    private enemies: Enemy[] = [];
    private projectiles: Projectile[] = [];
    private spawned = 0;
    private totalEnemies: number;
    private spawnTimer = 0;
    private done = false;

    constructor(private host: LevelHost, private advanced: boolean) {
        this.totalEnemies = (advanced ? 4 : 3) * ENEMIES_PER_WAVE;
        host.stats.energy = advanced ? 180 : 120;
        this.buildPath();
    }

    private buildPath(): void {
        const { width: w, height: h } = this.host;
        this.path = [
            { x: 0, y: Math.floor(h * 0.3) },
            { x: Math.floor(w * 0.3), y: Math.floor(h * 0.3) },
            { x: Math.floor(w * 0.3), y: Math.floor(h * 0.7) },
            { x: Math.floor(w * 0.7), y: Math.floor(h * 0.7) },
            { x: Math.floor(w * 0.7), y: Math.floor(h * 0.4) },
            { x: w, y: Math.floor(h * 0.4) },
        ];
    }

    pointerDown({ x, y }: PointerInfo): void {
        const cost = TOWER_COST[this.selected];
        const { stats } = this.host;
        if (stats.energy < cost) return;
        stats.energy -= cost;
        this.towers.push({ x, y, type: this.selected, ...TOWER_STATS[this.selected], cooldown: 0 });
        this.host.sound(500, 0.08, 'sine');
        this.host.changed();
    }

    update(dt: number): void {
        if (this.done) return;
        const host = this.host;
        const { stats } = host;
        const isFour = host.level === 4;

        this.spawnTimer += dt;
        if (this.spawnTimer > 1.8 && this.spawned < this.totalEnemies && this.path.length) {
            this.spawnTimer = 0;
            this.spawned++;
            const spitter = isFour && this.spawned % 3 === 0;
            const hp = (spitter ? 180 : 75) * (isFour ? 1.4 : 1);
            this.enemies.push({
                x: this.path[0].x, y: this.path[0].y, pathIdx: 0, hp, maxHp: hp,
                speed: spitter ? 60 : 90, isSpitter: spitter,
            });
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            const node = this.path[e.pathIdx + 1];
            if (!node) {
                stats.hp -= 15;
                host.sound(180, 0.2, 'sawtooth');
                this.enemies.splice(i, 1);
                host.changed();
                if (stats.hp <= 0) { this.done = true; host.fail(); return; }
                continue;
            }
            const dx = node.x - e.x;
            const dy = node.y - e.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 4) e.pathIdx++;
            else { e.x += (dx / dist) * e.speed * dt; e.y += (dy / dist) * e.speed * dt; }
        }

        for (const t of this.towers) {
            t.cooldown -= dt;
            if (t.cooldown > 0) continue;
            const target = this.enemies.find(e => Math.hypot(e.x - t.x, e.y - t.y) < t.range);
            if (!target) continue;
            t.cooldown = t.fireRate;
            this.projectiles.push({ x: t.x, y: t.y, tx: target.x, ty: target.y, damage: t.damage, type: t.type });
            host.sound(t.type === 'sunfire' ? 700 : 400, 0.05, 'square');
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            const dx = p.tx - p.x;
            const dy = p.ty - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 8) {
                const radius = p.type === 'sunfire' ? 50 : 20;
                for (const e of this.enemies) if (Math.hypot(e.x - p.tx, e.y - p.ty) < radius) e.hp -= p.damage;
                this.projectiles.splice(i, 1);
            } else {
                p.x += (dx / dist) * 400 * dt;
                p.y += (dy / dist) * 400 * dt;
            }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].hp <= 0) {
                stats.score += 50; stats.energy += 25;
                this.enemies.splice(i, 1);
                host.changed();
            }
        }

        if (this.spawned >= this.totalEnemies && this.enemies.length === 0) { this.done = true; host.complete(); }
    }

    render(): void {
        const ctx = this.host.ctx;
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
        ctx.lineWidth = 24;
        ctx.lineCap = 'round';
        ctx.beginPath();
        this.path.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
        ctx.stroke();
        ctx.lineWidth = 1;

        for (const t of this.towers) {
            ctx.fillStyle = t.type === 'sunfire' ? '#f0c05a' : t.type === 'emp' ? '#00f3ff' : '#00ff66';
            ctx.beginPath(); ctx.arc(t.x, t.y, 14, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(0, 255, 102, 0.15)';
            ctx.beginPath(); ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2); ctx.stroke();
        }
        for (const e of this.enemies) {
            ctx.fillStyle = e.isSpitter ? '#ff0055' : '#a855f7';
            ctx.fillRect(e.x - 10, e.y - 10, 20, 20);
            ctx.fillStyle = 'rgba(255,0,0,0.6)'; ctx.fillRect(e.x - 12, e.y - 16, 24, 4);
            ctx.fillStyle = '#00ff66'; ctx.fillRect(e.x - 12, e.y - 16, Math.max(0, e.hp / e.maxHp) * 24, 4);
        }
        for (const p of this.projectiles) {
            ctx.fillStyle = p.type === 'sunfire' ? '#f0c05a' : '#00f3ff';
            ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
        }
    }
}
