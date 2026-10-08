import React, { useState, useEffect, useRef } from 'react';
import TowerDefenseBoss from './TowerDefenseBoss';

const TOWER_DEFS = {
    basic:  { cost: 50,  range: 100, damage: 15, cooldown: 30, color: '#00f2ff', label: 'B' },
    rapid:  { cost: 100, range: 80,  damage: 5,  cooldown: 8,  color: '#facc15', label: 'R' },
    sniper: { cost: 150, range: 250, damage: 80, cooldown: 90, color: '#bc13fe', label: 'S' },
    emp:    { cost: 200, range: 120, damage: 2,  cooldown: 40, color: '#38bdf8', label: 'E', effect: 'slow' },
    plasma: { cost: 250, range: 150, damage: 20, cooldown: 60, color: '#fb923c', label: 'P', effect: 'splash' },
    tesla:  { cost: 300, range: 120, damage: 25, cooldown: 45, color: '#e879f9', label: 'T', effect: 'chain' }
};

const CELL_SIZE = 40;
const COLS = 15;
const ROWS = 10;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

const path = [
    {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}, {x: 4, y: 1}, {x: 5, y: 1}, {x: 6, y: 1}, {x: 7, y: 1}, {x: 8, y: 1},
    {x: 8, y: 2}, {x: 8, y: 3}, {x: 8, y: 4}, {x: 8, y: 5},
    {x: 7, y: 5}, {x: 6, y: 5}, {x: 5, y: 5}, {x: 4, y: 5}, {x: 3, y: 5}, {x: 2, y: 5}, {x: 1, y: 5},
    {x: 1, y: 6}, {x: 1, y: 7}, {x: 1, y: 8},
    {x: 2, y: 8}, {x: 3, y: 8}, {x: 4, y: 8}, {x: 5, y: 8}, {x: 6, y: 8}, {x: 7, y: 8}, {x: 8, y: 8}, {x: 9, y: 8}, {x: 10, y: 8}, {x: 11, y: 8}, {x: 12, y: 8}, {x: 13, y: 8}, {x: 14, y: 8}
];

interface Level1Props {
    onBack: () => void;
    onVictory: () => void;
    sectorId?: number;
}

export default function Level1NexusDefense({ onBack, onVictory, sectorId }: Level1Props) {
    const [screen, setScreen] = useState('menu');
    const [faction, setFaction] = useState('netrunners');
    const [metaState, setMetaState] = useState({ upgrades: { integrity: 0, economy: 0, damage: 0 } });
    
    const [money, setMoney] = useState(0);
    const [health, setHealth] = useState(0);
    const [wave, setWave] = useState(1);
    const [score, setScore] = useState(0);
    const [selectedTower, setSelectedTower] = useState('basic');
    const [gameActive, setGameActive] = useState(false);
    const [waveActive, setWaveActive] = useState(false);
    const [isLevelWon, setIsLevelWon] = useState(false);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<any>(null);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('aghl_td_meta');
            if (raw) {
                const parsed = JSON.parse(raw);
                setMetaState(prev => ({ ...prev, ...parsed, upgrades: { ...prev.upgrades, ...(parsed.upgrades || {}) } }));
            }
        } catch (e) {}
    }, []);

    const getTowerCost = (type: keyof typeof TOWER_DEFS) => {
        let cost = TOWER_DEFS[type].cost;
        if (faction === 'architects') cost = Math.floor(cost * 0.9);
        return cost;
    };

    const startGame = () => {
        let startMoney = 100 + (metaState.upgrades.economy * 20);
        let startHealth = 20 + (metaState.upgrades.integrity * 5);
        if (faction === 'netrunners') startMoney += 50;
        if (faction === 'guardians') startHealth += 10;

        setMoney(startMoney);
        setHealth(startHealth);
        setWave(1);
        setScore(0);
        setGameActive(true);
        setWaveActive(false);
        setIsLevelWon(false);
        setScreen('game');

        initEngine(startMoney, startHealth, 1);
    };

    const initEngine = (initMoney: number, initHealth: number, initWave: number) => {
        if (engineRef.current && engineRef.current.animationId) {
            cancelAnimationFrame(engineRef.current.animationId);
        }

        const engine = {
            money: initMoney,
            health: initHealth,
            wave: initWave,
            score: 0,
            enemies: [] as any[],
            towers: [] as any[],
            projectiles: [] as any[],
            particles: [] as any[],
            floatingTexts: [] as any[],
            enemiesToSpawn: 0,
            spawnTimer: 0,
            waveActive: false,
            gameActive: true,
            screenShake: 0,
            time: 0,
            animationId: null as any
        };
        engineRef.current = engine;

        const loop = () => {
            updateEngine();
            drawEngine();
            if (engine.gameActive) {
                engine.animationId = requestAnimationFrame(loop);
            }
        };
        loop();
    };

    const spawnEnemy = () => {
        const engine = engineRef.current;
        if (!engine) return;
        
        let eType = 'normal';
        let hp = 20 + Math.pow(engine.wave, 1.5) * 5;
        let speed = 1.2 + engine.wave * 0.05;
        let color = '#ff0040';

        const rand = Math.random();
        if (engine.wave % 5 === 0 && engine.enemiesToSpawn === 1) {
            eType = 'boss';
            hp *= 6;
            speed *= 0.5;
            color = '#ff0000';
        } else if (engine.wave > 3 && rand < 0.2) {
            eType = 'swarm';
            hp *= 0.4;
            speed *= 1.8;
            color = '#facc15';
        } else if (engine.wave > 4 && rand < 0.4) {
            eType = 'armored';
            hp *= 2.5;
            speed *= 0.8;
            color = '#94a3b8';
        } else if (engine.wave > 4 && rand < 0.6) {
            eType = 'shielded';
            hp *= 0.8;
            color = '#38bdf8';
        }

        engine.enemies.push({
            pathIndex: 0,
            x: path[0].x * CELL_SIZE + CELL_SIZE/2,
            y: path[0].y * CELL_SIZE + CELL_SIZE/2,
            hp, maxHp: hp,
            baseSpeed: speed,
            slowTimer: 0,
            color, type: eType,
            id: Math.random()
        });
    };

    const updateEngine = () => {
        const engine = engineRef.current;
        if (!engine || !engine.gameActive) return;

        engine.time++;
        if (engine.screenShake > 0) engine.screenShake--;

        if (engine.waveActive && engine.enemiesToSpawn > 0) {
            engine.spawnTimer++;
            if (engine.spawnTimer >= Math.max(10, 40 - Math.min(engine.wave, 20))) {
                spawnEnemy();
                engine.enemiesToSpawn--;
                engine.spawnTimer = 0;
            }
        } else if (engine.waveActive && engine.enemiesToSpawn === 0 && engine.enemies.length === 0) {
            engine.waveActive = false;
            
            // Victory Condition for Level 1: Completing Wave 5
            if (engine.wave === 5) {
                engine.gameActive = false;
                setGameActive(false);
                setIsLevelWon(true);
                return;
            }

            engine.wave++;
            engine.money += 50 + engine.wave * 5;
            setWaveActive(false);
            setWave(engine.wave);
            setMoney(engine.money);
        }

        // Move enemies
        for (let i = engine.enemies.length - 1; i >= 0; i--) {
            const e = engine.enemies[i];
            const targetPoint = path[e.pathIndex + 1];
            
            if (!targetPoint) {
                engine.health--;
                engine.enemies.splice(i, 1);
                setHealth(engine.health);
                if (engine.health <= 0) {
                    engine.gameActive = false;
                    setGameActive(false);
                }
                continue;
            }

            let speed = e.baseSpeed;
            if (e.slowTimer > 0) {
                speed *= 0.5;
                e.slowTimer--;
            }

            const targetX = targetPoint.x * CELL_SIZE + CELL_SIZE/2;
            const targetY = targetPoint.y * CELL_SIZE + CELL_SIZE/2;
            const dx = targetX - e.x;
            const dy = targetY - e.y;
            const dist = Math.hypot(dx, dy);

            if (dist <= speed) {
                e.x = targetX;
                e.y = targetY;
                e.pathIndex++;
            } else {
                e.x += (dx / dist) * speed;
                e.y += (dy / dist) * speed;
            }
        }

        // Towers shoot
        engine.towers.forEach((t: any) => {
            if (t.cooldownTimer > 0) t.cooldownTimer--;
            else if (engine.enemies.length > 0) {
                let closest = null;
                let minDist = t.range;
                engine.enemies.forEach((e: any) => {
                    const dist = Math.hypot(e.x - t.x, e.y - t.y);
                    if (dist <= minDist) { minDist = dist; closest = e; }
                });

                if (closest) {
                    t.angle = Math.atan2(closest.y - t.y, closest.x - t.x);
                    engine.projectiles.push({
                        x: t.x, y: t.y,
                        target: closest,
                        speed: t.type === 'sniper' ? 30 : 10,
                        damage: t.damage,
                        color: t.color,
                        effect: t.effect,
                        sourceTower: t.type,
                        hasChained: false
                    });
                    t.cooldownTimer = t.cooldown;
                }
            }
        });

        const spawnParticles = (x: number, y: number, color: string, count: number, speedF = 1) => {
            for (let i=0; i<count; i++) {
                engine.particles.push({
                    x, y, vx: (Math.random()-0.5)*6*speedF, vy: (Math.random()-0.5)*6*speedF,
                    life: 1.0, decay: Math.random()*0.05+0.02, color, size: Math.random()*3+1
                });
            }
        };

        const spawnText = (x: number, y: number, txt: string, color: string) => {
            engine.floatingTexts.push({x, y, text: txt, color, life: 1.0, vy: -1});
        };

        const checkDeath = (e: any) => {
            if (e.hp <= 0 && engine.enemies.includes(e)) {
                engine.enemies.splice(engine.enemies.indexOf(e), 1);
                engine.money += (e.type === 'boss' ? 50 : 5);
                engine.score += (e.type === 'boss' ? 100 : 10);
                spawnParticles(e.x, e.y, e.color, e.type === 'boss' ? 50 : 15);
                spawnText(e.x, e.y, '+'+(e.type === 'boss'?50:5), '#22c55e');
                setMoney(engine.money);
                setScore(engine.score);
            }
        };

        // Projectiles
        for (let i = engine.projectiles.length - 1; i >= 0; i--) {
            const p = engine.projectiles[i];
            if (!engine.enemies.includes(p.target)) {
                engine.projectiles.splice(i, 1);
                continue;
            }
            
            const dx = p.target.x - p.x;
            const dy = p.target.y - p.y;
            const dist = Math.hypot(dx, dy);

            if (dist <= p.speed) {
                let actualDamage = p.damage;
                let damageMult = 1 + (metaState.upgrades.damage * 0.05);
                if (faction === 'sentinels') damageMult += 0.10;
                actualDamage = Math.floor(actualDamage * damageMult);

                if (p.target.type === 'armored') {
                    if (p.sourceTower === 'rapid' || p.sourceTower === 'plasma') actualDamage *= 0.5;
                    if (p.sourceTower === 'sniper') actualDamage *= 1.5;
                }
                if (p.target.type === 'shielded') {
                    actualDamage = p.sourceTower === 'emp' ? p.damage * 5 : 1;
                }

                p.target.hp -= actualDamage;
                if (p.target.type === 'boss') {
                    // @ts-ignore
                    if (typeof window.damageActiveBoss === 'function') {
                        // @ts-ignore
                        window.damageActiveBoss(actualDamage);
                    }
                }
                spawnParticles(p.target.x, p.target.y, p.color, 5);
                spawnText(p.target.x, p.target.y - 10, '-' + Math.floor(actualDamage), p.color);
                
                if (actualDamage >= 50 || p.effect === 'splash') engine.screenShake = Math.max(engine.screenShake, 10);
                if (p.effect === 'slow') p.target.slowTimer = 120;
                
                if (p.effect === 'splash') {
                    spawnParticles(p.target.x, p.target.y, p.color, 20, 2);
                    engine.enemies.forEach((e: any) => {
                        if (e !== p.target && Math.hypot(e.x - p.target.x, e.y - p.target.y) < 60) {
                            let sDmg = p.damage * 0.5;
                            if (e.type === 'shielded') sDmg = 1;
                            e.hp -= sDmg;
                            if (e.type === 'boss') {
                                // @ts-ignore
                                if (typeof window.damageActiveBoss === 'function') {
                                    // @ts-ignore
                                    window.damageActiveBoss(sDmg);
                                }
                            }
                            spawnText(e.x, e.y - 10, '-' + Math.floor(sDmg), p.color);
                            checkDeath(e);
                        }
                    });
                }

                if (p.effect === 'chain' && !p.hasChained) {
                    let nextTarget = null;
                    let minDist = 80;
                    engine.enemies.forEach((e: any) => {
                        if (e !== p.target) {
                            const d = Math.hypot(e.x - p.target.x, e.y - p.target.y);
                            if (d < minDist) { minDist = d; nextTarget = e; }
                        }
                    });
                    if (nextTarget) {
                        engine.projectiles.push({
                            x: p.target.x, y: p.target.y, target: nextTarget,
                            speed: p.speed, damage: p.damage * 0.7, color: p.color, effect: 'chain', hasChained: true, sourceTower: p.sourceTower
                        });
                    }
                }

                checkDeath(p.target);
                engine.projectiles.splice(i, 1);
            } else {
                p.x += (dx / dist) * p.speed;
                p.y += (dy / dist) * p.speed;
            }
        }

        // Particles
        for (let i = engine.particles.length - 1; i >= 0; i--) {
            const pt = engine.particles[i];
            pt.x += pt.vx; pt.y += pt.vy; pt.life -= pt.decay;
            if (pt.life <= 0) engine.particles.splice(i, 1);
        }

        // Texts
        for (let i = engine.floatingTexts.length - 1; i >= 0; i--) {
            const ft = engine.floatingTexts[i];
            ft.y += ft.vy; ft.life -= 0.02;
            if (ft.life <= 0) engine.floatingTexts.splice(i, 1);
        }
    };

    const drawEngine = () => {
        const ctx = canvasRef.current?.getContext('2d');
        const engine = engineRef.current;
        if (!ctx || !engine) return;

        ctx.save();
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        if (engine.screenShake > 0) {
            const mag = engine.screenShake * 0.5;
            ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
        }

        // Draw Grid & Path
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        for (let i = 0; i <= COLS; i++) {
            ctx.beginPath(); ctx.moveTo(i*CELL_SIZE, 0); ctx.lineTo(i*CELL_SIZE, CANVAS_HEIGHT); ctx.stroke();
        }
        for (let j = 0; j <= ROWS; j++) {
            ctx.beginPath(); ctx.moveTo(0, j*CELL_SIZE); ctx.lineTo(CANVAS_WIDTH, j*CELL_SIZE); ctx.stroke();
        }

        ctx.fillStyle = '#1e293b';
        path.forEach(p => {
            ctx.fillRect(p.x * CELL_SIZE, p.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        });

        // Draw Base
        const base = path[path.length - 1];
        ctx.fillStyle = '#00f2ff';
        ctx.shadowColor = '#00f2ff';
        ctx.shadowBlur = 15;
        ctx.fillRect(base.x * CELL_SIZE + 5, base.y * CELL_SIZE + 5, CELL_SIZE - 10, CELL_SIZE - 10);
        ctx.shadowBlur = 0;

        // Draw Towers
        engine.towers.forEach((t: any) => {
            ctx.fillStyle = '#334155';
            ctx.fillRect(t.col * CELL_SIZE + 4, t.row * CELL_SIZE + 4, CELL_SIZE - 8, CELL_SIZE - 8);

            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.rotate(t.angle);
            ctx.fillStyle = t.color;
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(-8, 8);
            ctx.lineTo(-4, 0);
            ctx.lineTo(-8, -8);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();

            if (t.level > 1) {
                ctx.fillStyle = '#fff';
                ctx.font = '10px monospace';
                ctx.fillText(`L${t.level}`, t.col * CELL_SIZE + 2, t.row * CELL_SIZE + 12);
            }
        });

        // Draw Enemies
        engine.enemies.forEach((e: any) => {
            ctx.fillStyle = e.color;
            ctx.shadowColor = e.color;
            ctx.shadowBlur = 10;
            
            ctx.beginPath();
            if (e.type === 'boss') {
                ctx.arc(e.x, e.y, 14, 0, Math.PI * 2);
            } else if (e.type === 'swarm') {
                ctx.moveTo(e.x, e.y - 6); ctx.lineTo(e.x + 6, e.y + 6); ctx.lineTo(e.x - 6, e.y + 6);
            } else if (e.type === 'shielded') {
                ctx.arc(e.x, e.y, 10, 0, Math.PI * 2);
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();
            } else {
                ctx.fillRect(e.x - 8, e.y - 8, 16, 16);
            }
            ctx.fill();
            ctx.shadowBlur = 0;

            // HP Bar
            const hpPct = Math.max(0, e.hp / e.maxHp);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(e.x - 10, e.y - 15, 20, 3);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(e.x - 10, e.y - 15, 20 * hpPct, 3);
        });

        // Draw Projectiles
        engine.projectiles.forEach((p: any) => {
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = p.effect === 'splash' ? 15 : 5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.effect === 'splash' ? 4 : 2, 0, Math.PI*2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });

        // Draw Particles
        engine.particles.forEach((pt: any) => {
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = pt.life;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI*2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Draw Texts
        engine.floatingTexts.forEach((ft: any) => {
            ctx.fillStyle = ft.color;
            ctx.globalAlpha = ft.life;
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
        });
        ctx.globalAlpha = 1.0;

        ctx.restore();
    };

    const handleCanvasInteraction = (clientX: number, clientY: number) => {
        if (!gameActive || !engineRef.current) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        
        const scaleX = canvasRef.current!.width / rect.width;
        const scaleY = canvasRef.current!.height / rect.height;
        
       const x = (clientX - rect.left) * scaleX;
       const y = (clientY - rect.top) * scaleY;
        
        const col = Math.floor(x / CELL_SIZE);
        const row = Math.floor(y / CELL_SIZE);
        
        if (path.some(p => p.x === col && p.y === row)) return;

        const engine = engineRef.current;
        const existingTower = engine.towers.find((t: any) => t.col === col && t.row === row);

        if (existingTower) {
            const baseCost = TOWER_DEFS[existingTower.type as keyof typeof TOWER_DEFS].cost;
            const upgradeCost = Math.floor(baseCost * 0.6 * (existingTower.level || 1));
            if (engine.money >= upgradeCost) {
                engine.money -= upgradeCost;
                existingTower.level = (existingTower.level || 1) + 1;
                existingTower.damage = Math.floor(existingTower.damage * 1.5);
                existingTower.range = Math.floor(existingTower.range * 1.15);
                existingTower.cooldown = Math.max(5, Math.floor(existingTower.cooldown * 0.85));
                
                engine.particles.push({x: existingTower.x, y: existingTower.y, vx: 0, vy: 0, life: 1, decay: 0.05, color: '#38bdf8', size: 3});
                engine.floatingTexts.push({x: existingTower.x, y: existingTower.y-15, text: `LVL ${existingTower.level}`, color: '#38bdf8', life: 1, vy: -1});
                setMoney(engine.money);
            } else {
                engine.floatingTexts.push({x: existingTower.x, y: existingTower.y-15, text: `NEED ${upgradeCost}`, color: '#ef4444', life: 1, vy: -1});
            }
            return;
        }

        const cost = getTowerCost(selectedTower as keyof typeof TOWER_DEFS);
        if (engine.money >= cost) {
            engine.money -= cost;
            let damageMult = 1 + (metaState.upgrades.damage * 0.05);
            if (faction === 'sentinels') damageMult += 0.10;

            const baseDef = TOWER_DEFS[selectedTower as keyof typeof TOWER_DEFS];
            engine.towers.push({
                col, row,
                x: col * CELL_SIZE + CELL_SIZE/2,
                y: row * CELL_SIZE + CELL_SIZE/2,
                type: selectedTower,
                cooldownTimer: 0,
                range: baseDef.range,
                damage: Math.floor(baseDef.damage * damageMult),
                cooldown: baseDef.cooldown,
                color: baseDef.color,
                label: baseDef.label,
                effect: (baseDef as any).effect,
                angle: 0,
                level: 1
            });
            setMoney(engine.money);
        }
    };

    const handleCanvasMouseClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
       handleCanvasInteraction(e.clientX, e.clientY);
    };

    const handleCanvasTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
       e.preventDefault();
       if (e.changedTouches.length > 0) {
           const touch = e.changedTouches[0];
           handleCanvasInteraction(touch.clientX, touch.clientY);
       }
    };

    const startWave = () => {
        if (!waveActive && gameActive && engineRef.current) {
            setWaveActive(true);
            engineRef.current.waveActive = true;
            engineRef.current.enemiesToSpawn = 5 + engineRef.current.wave * 3;
            engineRef.current.spawnTimer = 0;
        }
    };

    useEffect(() => {
        return () => {
            if (engineRef.current && engineRef.current.animationId) {
                cancelAnimationFrame(engineRef.current.animationId);
            }
        };
    }, []);

    return (
        <div style={{ fontFamily: 'monospace', color: '#cbd5e1', padding: '1rem', background: '#090d16', minHeight: '100vh' }}>
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button onClick={onBack} style={{ background: 'transparent', border: '1px solid #00f2ff', color: '#00f2ff', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, borderRadius: '4px' }}>
                    ← Back to Selector
                </button>
                <div style={{ color: '#00f2ff', fontWeight: 800, fontSize: '1.25rem', textShadow: '0 0 10px rgba(0,242,255,0.5)' }}>LEVEL 1: NEXUS CORE GATEWAY</div>
            </nav>

            {screen === 'menu' && (
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)', border: '1px solid #1e293b', borderRadius: '12px', padding: '2rem', maxWidth: '600px', margin: '2rem auto', textAlign: 'center', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)' }}>
                    <h2 style={{ color: '#00f2ff', fontSize: '2rem', marginBottom: '1.5rem', textShadow: '0 0 8px rgba(0,242,255,0.3)' }}>NEXUS DEFENSE</h2>
                    <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Defend the mainframe against the incoming swarms of systemic anomalies.</p>
                    
                    <div style={{ marginBottom: '2rem', textAlign: 'left' }}>
                        <h3 style={{ color: '#cbd5e1', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>SELECT FACTION</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            {[
                                { key: 'netrunners', label: 'NETRUNNERS', desc: '+50 Starting Cores' },
                                { key: 'sentinels', label: 'SENTINELS', desc: '+10% Tower Damage' },
                                { key: 'architects', label: 'ARCHITECTS', desc: '-10% Tower Cost' },
                                { key: 'guardians', label: 'GUARDIANS', desc: '+10 Max Integrity' }
                            ].map(f => (
                                <button key={f.key} onClick={() => setFaction(f.key)} style={{
                                    background: faction === f.key ? 'rgba(0, 242, 255, 0.15)' : 'rgba(30, 41, 59, 0.4)',
                                    border: faction === f.key ? '1px solid #00f2ff' : '1px solid #334155',
                                    borderRadius: '8px', padding: '1rem', color: '#cbd5e1', cursor: 'pointer', textAlign: 'left',
                                    transition: 'all 0.2s', outline: 'none'
                                }}>
                                    <strong style={{ color: faction === f.key ? '#00f2ff' : '#fff' }}>{f.label}</strong>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{f.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={startGame} style={{ background: 'linear-gradient(90deg, #00f2ff, #00ffb7)', border: 'none', color: '#090d16', padding: '1rem 2.5rem', fontSize: '1.1rem', fontWeight: 800, borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 242, 255, 0.3)', width: '100%' }}>
                        INITIALIZE DEFENSES
                    </button>
                </div>
            )}

            {screen === 'game' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
                    <div style={{ width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem 1.5rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>CORES: <span style={{ color: '#00f2ff', fontWeight: 700 }}>{money}</span></div>
                            <div>INTEGRITY: <span style={{ color: '#ef4444', fontWeight: 700 }}>{Math.max(0, health)}</span></div>
                            <div>WAVE: <span style={{ color: '#facc15', fontWeight: 700 }}>{wave}/5</span></div>
                        </div>
                        <button onClick={startWave} disabled={waveActive} style={{
                            background: waveActive ? '#1e293b' : 'linear-gradient(90deg, #00f2ff, #bc13fe)',
                            border: 'none', color: waveActive ? '#64748b' : '#fff', padding: '0.5rem 1.5rem',
                            fontWeight: 700, borderRadius: '4px', cursor: waveActive ? 'default' : 'pointer'
                        }}>
                            {waveActive ? 'DEFENDING...' : 'START WAVE'}
                        </button>
                    </div>

                    <div style={{ position: 'relative', border: '2px solid #1e293b', borderRadius: '8px', overflow: 'hidden', width: '100%', maxWidth: '600px', aspectRatio: '600/400', touchAction: 'none' }}>
                        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onClick={handleCanvasMouseClick} onTouchEnd={handleCanvasTouchEnd} style={{ background: '#0a0f1d', display: 'block', width: '100%', height: '100%', touchAction: 'none' }} />
                        {sectorId && wave >= 5 && engineRef.current?.waveActive && (
                            <TowerDefenseBoss 
                                sectorId={sectorId} 
                                onBossAttack={(damage) => {
                                    setHealth(prev => Math.max(0, prev - damage));
                                    if (engineRef.current) {
                                        engineRef.current.screenShake = 15;
                                    }
                                }}
                                onBossDefeated={() => {
                                    if (engineRef.current) {
                                        engineRef.current.enemies = engineRef.current.enemies.filter((e: any) => e.type !== 'boss');
                                    }
                                }}
                            />
                        )}
                        
                        {!gameActive && health <= 0 && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(9, 13, 22, 0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                                <h1 style={{ color: '#ef4444', textShadow: '0 0 10px rgba(239,68,68,0.5)' }}>SYSTEM COMPROMISED</h1>
                                <p style={{ color: '#94a3b8' }}>Integrity reached 0.</p>
                                <button onClick={() => setScreen('menu')} style={{ background: '#334155', border: '1px solid #475569', color: '#fff', padding: '0.5rem 1.5rem', cursor: 'pointer', borderRadius: '4px' }}>
                                    RETRY LEVEL
                                </button>
                            </div>
                        )}
                    </div>

                    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                        {Object.keys(TOWER_DEFS).map(t => {
                            const def = TOWER_DEFS[t as keyof typeof TOWER_DEFS];
                            const cost = getTowerCost(t as keyof typeof TOWER_DEFS);
                            const selected = selectedTower === t;
                            return (
                                <button key={t} onClick={() => setSelectedTower(t)} style={{
                                    background: selected ? 'rgba(0, 242, 255, 0.1)' : 'rgba(30, 41, 59, 0.3)',
                                    border: selected ? '1px solid #00f2ff' : '1px solid #334155',
                                    borderRadius: '6px', padding: '0.75rem', cursor: 'pointer', color: '#cbd5e1', textAlign: 'left',
                                    outline: 'none', transition: 'all 0.15s'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '2px', background: def.color }} />
                                        <strong style={{ color: selected ? '#00f2ff' : '#fff' }}>{t.toUpperCase()}</strong>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Cost: {cost}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {isLevelWon && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(9, 13, 22, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
                    <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
                        <h1 style={{ color: '#00ffb7', fontSize: '3rem', margin: 0, textShadow: '0 0 20px rgba(0,255,183,0.5)', letterSpacing: '2px' }}>VICTORY</h1>
                        <p style={{ color: '#cbd5e1', fontSize: '1.25rem', marginTop: '1rem', lineHeight: '1.6' }}>
                            Gate secure. Sector alignment achieved. Proceed to Syndicate perimeter.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={onVictory} style={{ background: 'linear-gradient(90deg, #00f2ff, #00ffb7)', border: 'none', color: '#090d16', padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 800, borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 242, 255, 0.3)' }}>
                            PROCEED TO LEVEL 2
                        </button>
                        <button onClick={onBack} style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid #475569', color: '#cbd5e1', padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}>
                            LEVEL SELECTOR
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
