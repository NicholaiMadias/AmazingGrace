import type { Level, LevelHost } from './types';

const BOSS_MAX_HP = 1000;

export class BossLevel implements Level {
    private hp = BOSS_MAX_HP;
    private timer = 0;
    private done = false;

    constructor(private host: LevelHost) {}

    update(dt: number): void {
        if (this.done) return;
        this.timer += dt;
        if (this.timer <= 1.2) return;
        this.timer = 0;
        this.hp -= 65;
        this.host.stats.score += 200;
        this.host.sound(850, 0.06, 'square');
        this.host.changed();
        if (this.hp <= 0) { this.done = true; this.host.complete(); }
    }

    render(): void {
        const { ctx, width } = this.host;
        const barW = Math.min(300, width - 40);
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(width / 2 - 60, 60, 120, 100);
        ctx.fillStyle = '#00f3ff';
        ctx.font = '18px "Cinzel", serif';
        ctx.textAlign = 'center';
        ctx.fillText('MATRIX OVERLORD CORE', width / 2, 40);
        ctx.textAlign = 'start';
        ctx.fillStyle = 'rgba(255,0,0,0.5)';
        ctx.fillRect(width / 2 - barW / 2, 180, barW, 16);
        ctx.fillStyle = '#00ff66';
        ctx.fillRect(width / 2 - barW / 2, 180, Math.max(0, this.hp / BOSS_MAX_HP) * barW, 16);
    }
}
