import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Sun, Moon, Hexagon, Gem, Flame, Palette, Shield,
    Hammer, Zap, Bomb, Play, RefreshCw, Trophy, Target, Clock,
} from 'lucide-react';
import {
    BOARD_SIZE, Board,
    generateBoard, findMatches, removeMatches, applyGravity, refillBoard, swapGems, isAdjacent,
} from './engine';
// @ts-ignore -- plain JS support module
import { attachDragSwap } from '../../js/matchmaker.js';

// ─── Types ────────────────────────────────────────────────────────────────────
type GamePhase = 'menu' | 'playing' | 'levelup' | 'gameover' | 'victory';
type PowerUpKey = 'hammer' | 'zap' | 'bomb';

// ─── Lore & Constants ─────────────────────────────────────────────────────────
const GEM_TYPES = [
    { id: 'knowledge', color: '#facc15', glow: 'rgba(250,204,21,0.55)', icon: 'Sun' as const,     label: 'Knowledge' },
    { id: 'faith',     color: '#cbd5e1', glow: 'rgba(203,213,225,0.55)', icon: 'Moon' as const,    label: 'Faith'     },
    { id: 'truth',     color: '#3b82f6', glow: 'rgba(59,130,246,0.55)',  icon: 'Hexagon' as const, label: 'Truth'     },
    { id: 'compassion',color: '#10b981', glow: 'rgba(16,185,129,0.55)', icon: 'Gem' as const,     label: 'Compassion'},
    { id: 'courage',   color: '#f43f5e', glow: 'rgba(244,63,94,0.55)',  icon: 'Flame' as const,   label: 'Courage'   },
    { id: 'creativity',color: '#a855f7', glow: 'rgba(168,85,247,0.55)', icon: 'Palette' as const, label: 'Creativity'},
    { id: 'integrity', color: '#71717a', glow: 'rgba(113,113,122,0.55)',icon: 'Shield' as const,  label: 'Integrity' },
] as const;

type GemIconKey = typeof GEM_TYPES[number]['icon'];

const ICON_MAP: Record<GemIconKey, React.ComponentType<{size?: number; strokeWidth?: number; color?: string}>> = {
    Sun, Moon, Hexagon, Gem, Flame, Palette, Shield,
};

const GEM_MAP = Object.fromEntries(GEM_TYPES.map(g => [g.id, g]));

const LEVELS = [
    { target:  400, time: 60 },
    { target:  800, time: 55 },
    { target: 1400, time: 50 },
    { target: 2100, time: 45 },
    { target: 3000, time: 40 },
];

// ─── Synth Audio Engine ───────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;

const playSound = (type: string) => {
    try {
        const Ctx = window.AudioContext ?? (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
        if (!Ctx) return;
        if (!audioCtx) audioCtx = new Ctx();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'swap') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(500, now + 0.1);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'match') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'combo') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1400, now + 0.3);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        } else if (type === 'powerup') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
        } else if (type === 'level_up') {
            osc.type = 'triangle';
            [400, 500, 600, 800].forEach((f, i) => osc.frequency.setValueAtTime(f, now + i * 0.1));
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.6);
            osc.start(now); osc.stop(now + 0.6);
        }
    } catch (e) {
        console.warn('Audio error', e);
    }
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
    page: {
        minHeight: '100vh',
        background: '#020617',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "system-ui, sans-serif",
        padding: '5rem 1rem 2rem',
    },
    navFixed: {
        position: 'fixed' as const,
        top: 0, left: 0, right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.7rem 1.25rem',
        borderBottom: '1px solid #1e293b',
        background: 'rgba(2,6,23,0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 10,
    },
    navLink: { color: '#00f2ff', textDecoration: 'none' as const, fontWeight: 700, fontSize: '0.88rem' },
    title: {
        fontFamily: 'monospace',
        fontSize: 'clamp(1.8rem,5vw,2.6rem)',
        letterSpacing: '0.08em',
        color: '#00f2ff',
        textShadow: '0 0 20px rgba(0,242,255,0.4)',
        margin: '0 0 0.75rem',
        textTransform: 'uppercase' as const,
    },
    btnPrimary: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        background: 'rgba(0,242,255,0.1)',
        border: '1px solid #00f2ff',
        color: '#00f2ff',
        borderRadius: '12px',
        padding: '0.85rem 1.75rem',
        fontWeight: 700,
        fontSize: '0.9rem',
        cursor: 'pointer',
        letterSpacing: '0.04em',
        margin: '0 auto',
    },
    btnSecondary: {
        background: 'rgba(148,163,184,0.08)',
        border: '1px solid #475569',
        color: '#94a3b8',
        borderRadius: '12px',
        padding: '0.85rem 1.75rem',
        fontWeight: 700,
        cursor: 'pointer',
        fontSize: '0.9rem',
    },
    pill: {
        background: 'rgba(15,23,42,0.7)',
        border: '1px solid #1e293b',
        borderRadius: '999px',
        padding: '0.3rem 0.7rem',
        fontSize: '0.76rem',
        color: '#94a3b8',
        fontFamily: 'monospace',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
    },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function VirtueMatchApp() {
    const [board,         setBoard]         = useState<Board>(() => generateBoard());
    const [selected,      setSelected]      = useState<[number, number] | null>(null);
    const [score,         setScore]         = useState(0);
    const [highScore,     setHighScore]     = useState(() => Number(localStorage.getItem('virtue_match_hs') || 0));
    const [level,         setLevel]         = useState(0);
    const [timeLeft,      setTimeLeft]      = useState(LEVELS[0].time);
    const [phase,         setPhase]         = useState<GamePhase>('menu');
    const [processing,    setProcessing]    = useState(false);
    const [message,       setMessage]       = useState('');
    const [powerUps,      setPowerUps]      = useState({ hammer: 1, zap: 1, bomb: 1 });
    const [activePowerUp, setActivePowerUp] = useState<PowerUpKey | null>(null);
    const [shaking,       setShaking]       = useState(false);

    // Refs to read latest values inside async callbacks / intervals
    const phaseRef     = useRef<GamePhase>('menu');
    const scoreRef     = useRef(0);
    const levelRef     = useRef(0);
    const highScoreRef = useRef(highScore);

    phaseRef.current     = phase;
    scoreRef.current     = score;
    levelRef.current     = level;
    highScoreRef.current = highScore;

    // ── Timer ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (phase !== 'playing') return;
        const id = setInterval(() => {
            setTimeLeft(t => Math.max(0, t - 1));
        }, 1000);
        return () => clearInterval(id);
    }, [phase]);

    // Timer expiry → game over
    useEffect(() => {
        if (phase !== 'playing' || timeLeft > 0) return;
        setPhase('gameover');
    }, [timeLeft, phase]);

    // Score target reached → advance / victory
    useEffect(() => {
        if (phase !== 'playing') return;
        const target = LEVELS[level]?.target ?? Infinity;
        if (score >= target) {
            playSound('level_up');
            setPhase(level + 1 >= LEVELS.length ? 'victory' : 'levelup');
        }
    }, [score, phase, level]);

    // ── Game Control ───────────────────────────────────────────────────────────
    const startGame = useCallback(() => {
        setBoard(generateBoard());
        setScore(0);
        setLevel(0);
        setTimeLeft(LEVELS[0].time);
        setPhase('playing');
        setSelected(null);
        setProcessing(false);
        setMessage('');
        setPowerUps({ hammer: 1, zap: 1, bomb: 1 });
        setActivePowerUp(null);
    }, []);

    const goNextLevel = useCallback((currentLevel: number) => {
        const next = currentLevel + 1;
        setLevel(next);
        setBoard(generateBoard());
        setTimeLeft(LEVELS[next].time);
        setPhase('playing');
        setSelected(null);
        setProcessing(false);
        setMessage('');
        setPowerUps(p => ({ hammer: p.hammer + 1, zap: p.zap + 1, bomb: p.bomb + 1 }));
        setActivePowerUp(null);
    }, []);

    // ── Match Chain Processor ─────────────────────────────────────────────────
    const processChain = useCallback(async (initialBoard: Board): Promise<number> => {
        let curr  = initialBoard;
        let delta = 0;
        let combo = 0;

        while (true) {
            const matches = findMatches(curr);
            if (matches.size === 0) break;

            combo++;
            const pts = matches.size * 10 * combo;
            delta += pts;

            if (combo > 1) {
                playSound('combo');
                setMessage(`${combo}× COMBO! +${pts}`);
            } else {
                playSound('match');
                setMessage(`+${pts}`);
            }

            curr = removeMatches(curr, matches);
            setBoard(curr.map(r => [...r]));
            await new Promise(res => setTimeout(res, 220));

            curr = applyGravity(curr);
            setBoard(curr.map(r => [...r]));
            await new Promise(res => setTimeout(res, 160));

            curr = refillBoard(curr);
            setBoard(curr.map(r => [...r]));
            await new Promise(res => setTimeout(res, 160));
        }

        return delta;
    }, []);

    const applyScoreDelta = useCallback((delta: number) => {
        if (delta === 0) return;
        setScore(prev => {
            const next = prev + delta;
            if (next > highScoreRef.current) {
                highScoreRef.current = next;
                setHighScore(next);
                localStorage.setItem('virtue_match_hs', String(next));
            }
            return next;
        });
        setTimeout(() => setMessage(''), 1500);
    }, []);

    // ── Swap (shared by click-select-click and drag) ──────────────────────────
    const attemptSwap = useCallback(async (sr: number, sc: number, r: number, c: number) => {
        const swapped = swapGems(board, sr, sc, r, c);
        if (findMatches(swapped).size === 0) {
            setShaking(true);
            setTimeout(() => setShaking(false), 300);
            return;
        }

        playSound('swap');
        setProcessing(true);
        setBoard(swapped.map(r => [...r]));
        await new Promise(res => setTimeout(res, 100));

        const delta = await processChain(swapped);
        applyScoreDelta(delta);
        setProcessing(false);
    }, [board, processChain, applyScoreDelta]);

    const boardRef = useRef<HTMLDivElement>(null);
    const processingRef = useRef(false);
    const activePowerUpRef = useRef<PowerUpKey | null>(null);
    const attemptSwapRef = useRef(attemptSwap);
    processingRef.current = processing;
    activePowerUpRef.current = activePowerUp;
    attemptSwapRef.current = attemptSwap;

    // ── Cell Click ────────────────────────────────────────────────────────────
    const handleCellClick = useCallback(async (r: number, c: number) => {
        if (processing || phaseRef.current !== 'playing') return;

        // ── Power-up Mode ──────────────────────────────────────────────────────
        if (activePowerUp) {
            setProcessing(true);
            playSound('powerup');
            setShaking(true);
            setTimeout(() => setShaking(false), 300);

            let newBoard = board.map(row => [...row]);

            if (activePowerUp === 'hammer') {
                for (let col = 0; col < BOARD_SIZE; col++) newBoard[r][col] = '';
                setMessage(`Row ${r + 1} cleared!`);
            } else if (activePowerUp === 'zap') {
                for (let row = 0; row < BOARD_SIZE; row++) newBoard[row][c] = '';
                setMessage(`Column ${c + 1} cleared!`);
            } else {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                            newBoard[nr][nc] = '';
                        }
                    }
                }
                setMessage('BOMB! 3×3 cleared!');
            }

            setActivePowerUp(null);
            newBoard = applyGravity(newBoard);
            newBoard = refillBoard(newBoard);
            setBoard(newBoard.map(r => [...r]));
            await new Promise(res => setTimeout(res, 200));

            const delta = await processChain(newBoard);
            applyScoreDelta(delta);
            setProcessing(false);
            return;
        }

        // ── Normal Swap Mode ───────────────────────────────────────────────────
        if (!selected) {
            setSelected([r, c]);
            return;
        }

        const [sr, sc] = selected;
        if (sr === r && sc === c) { setSelected(null); return; }
        if (!isAdjacent(sr, sc, r, c)) { setSelected([r, c]); return; }

        setSelected(null);
        await attemptSwap(sr, sc, r, c);
    }, [processing, activePowerUp, board, selected, processChain, applyScoreDelta, attemptSwap]);

    // Drag-and-drop swap (mouse + touch)
    useEffect(() => {
        const el = boardRef.current;
        if (!el || phase !== 'playing') return;
        return attachDragSwap(el, {
            cellAt: (n: HTMLElement) => ({ r: Number(n.dataset.r), c: Number(n.dataset.c) }),
            enabled: () => !processingRef.current && !activePowerUpRef.current && phaseRef.current === 'playing',
            onSwap: (a: { r: number; c: number }, b: { r: number; c: number }) => {
                setSelected(null);
                void attemptSwapRef.current(a.r, a.c, b.r, b.c);
            },
        });
    }, [phase]);

    const activatePowerUp = useCallback((key: PowerUpKey) => {
        if (processing || phaseRef.current !== 'playing') return;
        if (activePowerUp === key) {
            setActivePowerUp(null);
            return;
        }
        if (powerUps[key] <= 0) return;
        setPowerUps(p => ({ ...p, [key]: p[key] - 1 }));
        setActivePowerUp(key);
        setSelected(null);
    }, [processing, powerUps, activePowerUp]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const levelCfg     = LEVELS[Math.min(level, LEVELS.length - 1)];
    const scoreProgress = Math.min((score / levelCfg.target) * 100, 100);
    const timerPct      = (timeLeft / levelCfg.time) * 100;
    const timerUrgent   = timeLeft <= 10;

    // ══════════════════════════════════════════════════════════════════════════
    // Screens
    // ══════════════════════════════════════════════════════════════════════════

    if (phase === 'menu') {
        return (
            <div style={S.page}>
                <nav style={S.navFixed}>
                    <a href="../" style={S.navLink}>← Arcade</a>
                    <a href="../../" style={{ ...S.navLink, color: '#94a3b8' }}>amazinggracehl.org</a>
                </nav>
                <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                    <div style={{ fontSize: '2.8rem', marginBottom: '0.5rem' }}>✦</div>
                    <h1 style={S.title}>Virtue Match</h1>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem', lineHeight: 1.6, fontSize: '0.92rem' }}>
                        Align sacred virtues on an 8×8 grid. Swap adjacent gems to form matches of 3 or more.
                        Chain combos and use power-ups to ascend through all {LEVELS.length} levels.
                    </p>
                    {highScore > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#facc15', marginBottom: '1.25rem', fontSize: '0.88rem' }}>
                            <Trophy size={15} /> Best: {highScore.toLocaleString()}
                        </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', marginBottom: '2rem' }}>
                        {GEM_TYPES.map(g => {
                            const Icon = ICON_MAP[g.icon];
                            return (
                                <div key={g.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.65rem', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', border: '1px solid #1e293b' }}>
                                    <Icon size={20} color={g.color} />
                                    <span style={{ fontSize: '0.58rem', color: '#64748b' }}>{g.label}</span>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={startGame} style={S.btnPrimary}>
                        <Play size={17} /> Begin Ascension
                    </button>
                </div>
            </div>
        );
    }

    if (phase === 'levelup') {
        const next = level + 1;
        return (
            <div style={{ ...S.page, gap: '1.2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem' }}>⚡</div>
                <h2 style={{ fontFamily: 'monospace', fontSize: '1.75rem', color: '#00f2ff', letterSpacing: '0.1em', margin: 0 }}>LEVEL COMPLETE</h2>
                <p style={{ color: '#94a3b8', margin: 0 }}>Score: <strong style={{ color: '#f8fafc' }}>{score.toLocaleString()}</strong></p>
                <p style={{ color: '#94a3b8', margin: 0 }}>
                    Level {next + 1} target: <strong style={{ color: '#facc15' }}>{LEVELS[next]?.target.toLocaleString()}</strong>
                    {' '}in <strong style={{ color: '#22c55e' }}>{LEVELS[next]?.time}s</strong>
                </p>
                <p style={{ color: '#475569', fontSize: '0.78rem', margin: 0 }}>+1 of each power-up awarded</p>
                <button onClick={() => goNextLevel(level)} style={S.btnPrimary}>
                    <Play size={17} /> Next Level
                </button>
            </div>
        );
    }

    if (phase === 'gameover') {
        return (
            <div style={{ ...S.page, gap: '1.2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem' }}>⏱️</div>
                <h2 style={{ fontFamily: 'monospace', fontSize: '1.75rem', color: '#f43f5e', letterSpacing: '0.1em', margin: 0 }}>TIME EXPIRED</h2>
                <p style={{ color: '#94a3b8', margin: 0 }}>Final Score: <strong style={{ color: '#f8fafc' }}>{score.toLocaleString()}</strong></p>
                <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>Level {level + 1} · needed {levelCfg.target.toLocaleString()} pts</p>
                {score > 0 && score === highScore && <p style={{ color: '#facc15', margin: 0 }}>✦ New High Score!</p>}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={startGame} style={{ ...S.btnPrimary, background: 'rgba(244,63,94,0.1)', border: '1px solid #f43f5e', color: '#f43f5e' }}>
                        <RefreshCw size={17} /> Retry
                    </button>
                    <button onClick={() => setPhase('menu')} style={S.btnSecondary}>Menu</button>
                </div>
            </div>
        );
    }

    if (phase === 'victory') {
        return (
            <div style={{ ...S.page, gap: '1.2rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem' }}>🏆</div>
                <h2 style={{ fontFamily: 'monospace', fontSize: '1.75rem', color: '#facc15', letterSpacing: '0.1em', margin: 0 }}>ASCENSION COMPLETE</h2>
                <p style={{ color: '#94a3b8', margin: 0 }}>All {LEVELS.length} levels mastered!</p>
                <p style={{ color: '#94a3b8', margin: 0 }}>Final Score: <strong style={{ color: '#f8fafc' }}>{score.toLocaleString()}</strong></p>
                {score === highScore && <p style={{ color: '#facc15', margin: 0 }}>✦ New High Score!</p>}
                <a href="../certificates/" style={{ ...S.btnPrimary, background: 'rgba(250,204,21,0.1)', border: '1px solid #facc15', color: '#facc15', textDecoration: 'none' }}>
                    <Trophy size={17} /> Claim Certificate
                </a>
                <button onClick={startGame} style={S.btnSecondary}>Play Again</button>
            </div>
        );
    }

    // ── Playing ───────────────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', fontFamily: "'Inter', system-ui, sans-serif" }}>
            <style>{`
                @keyframes vm-shake {
                    0%,100% { transform: translate(0,0); }
                    25%     { transform: translate(-3px, 2px); }
                    50%     { transform: translate(3px,-2px); }
                    75%     { transform: translate(-3px,-2px); }
                }
            `}</style>

            {/* Topbar */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 1rem', borderBottom: '1px solid #1e293b', background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 10, gap: '0.5rem' }}>
                <a href="../" style={S.navLink}>← Arcade</a>
                <span style={{ fontFamily: 'monospace', color: '#00f2ff', fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Virtue Match</span>
                <button onClick={() => setPhase('menu')} style={{ background: 'none', border: '1px solid #334155', color: '#64748b', borderRadius: '6px', padding: '0.25rem 0.55rem', cursor: 'pointer', fontSize: '0.72rem' }}>Menu</button>
            </nav>

            <div style={{ maxWidth: '560px', margin: '0 auto', padding: '0.5rem 0.75rem 2rem' }}>

                {/* HUD */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginBottom: '0.45rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        <div style={S.pill}>
                            <Target size={10} />{score.toLocaleString()}<span style={{ color: '#334155' }}>/{levelCfg.target.toLocaleString()}</span>
                        </div>
                        <div style={S.pill}>
                            <Trophy size={10} />{highScore.toLocaleString()}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <div style={S.pill}>LVL {level + 1}</div>
                        <div style={{
                            ...S.pill,
                            color: timerUrgent ? '#f43f5e' : '#94a3b8',
                            borderColor: timerUrgent ? 'rgba(244,63,94,0.35)' : '#1e293b',
                            background: timerUrgent ? 'rgba(244,63,94,0.1)' : 'rgba(15,23,42,0.7)',
                        }}>
                            <Clock size={10} />{timeLeft}s
                        </div>
                    </div>
                </div>

                {/* Progress bars */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    {[
                        { pct: scoreProgress, color: 'linear-gradient(90deg,#00f2ff,#3b82f6)', transition: 'width 0.4s' },
                        { pct: timerPct, color: timerUrgent ? '#f43f5e' : '#22c55e', transition: 'width 1s linear' },
                    ].map((bar, i) => (
                        <div key={i} style={{ flex: 1, height: '3px', background: '#1e293b', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${bar.pct}%`, background: bar.color, transition: bar.transition, borderRadius: '999px' }} />
                        </div>
                    ))}
                </div>

                {/* Message / power-up prompt */}
                <div style={{ textAlign: 'center', minHeight: '1.2rem', fontSize: '0.82rem', fontWeight: 700, color: '#facc15', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                    {message || (activePowerUp ? `${activePowerUp.toUpperCase()} ACTIVE — select a cell` : '')}
                </div>

                {/* Board */}
                <div style={{
                    background: 'rgba(15,23,42,0.5)',
                    border: `1px solid ${activePowerUp ? '#facc15' : '#1e293b'}`,
                    borderRadius: '16px',
                    padding: '0.55rem',
                    boxShadow: activePowerUp ? '0 0 20px rgba(250,204,21,0.12)' : 'none',
                    animation: shaking ? 'vm-shake 0.3s ease both' : 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                }}>
                    <div ref={boardRef} style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, gap: '4px', touchAction: 'none' }}>
                        {board.map((row, r) =>
                            row.map((gemId, c) => {
                                const gemDef = GEM_MAP[gemId];
                                const isSel  = selected?.[0] === r && selected?.[1] === c;
                                const Icon   = gemDef ? ICON_MAP[gemDef.icon as GemIconKey] : null;
                                return (
                                    <button
                                        key={`${r}-${c}`}
                                        data-r={r}
                                        data-c={c}
                                        onClick={() => handleCellClick(r, c)}
                                        disabled={processing}
                                        aria-label={gemDef?.label ?? 'empty'}
                                        aria-pressed={isSel}
                                        style={{
                                            aspectRatio: '1',
                                            borderRadius: '9px',
                                            border: isSel
                                                ? `2px solid ${gemDef?.color ?? '#00f2ff'}`
                                                : '1px solid #1e293b',
                                            background: isSel
                                                ? `${gemDef?.color ?? '#00f2ff'}22`
                                                : 'rgba(15,23,42,0.55)',
                                            cursor: processing ? 'progress' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: 0,
                                            transition: 'transform 80ms, border-color 80ms, box-shadow 80ms',
                                            transform: isSel ? 'scale(1.1) translateY(-1px)' : 'none',
                                            boxShadow: isSel && gemDef ? `0 0 10px ${gemDef.glow}` : 'none',
                                        }}
                                    >
                                        {Icon && gemDef && (
                                            <Icon size={19} color={gemDef.color} strokeWidth={1.5} />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Power-ups */}
                <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.65rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {([
                        { key: 'hammer' as const, Icon: Hammer, label: 'Row Clear', hex: '#fb923c' },
                        { key: 'zap'    as const, Icon: Zap,    label: 'Col Clear', hex: '#facc15' },
                        { key: 'bomb'   as const, Icon: Bomb,   label: 'Bomb',      hex: '#f43f5e' },
                    ]).map(({ key, Icon, label, hex }) => {
                        const isActive = activePowerUp === key;
                        const count    = powerUps[key];
                        return (
                            <button
                                key={key}
                                onClick={() => activatePowerUp(key)}
                                disabled={processing || count <= 0}
                                title={`${label} (×${count})`}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.18rem',
                                    padding: '0.5rem 0.85rem',
                                    minWidth: '70px',
                                    background: isActive ? `${hex}22` : 'rgba(15,23,42,0.6)',
                                    border: `1px solid ${isActive ? hex : '#334155'}`,
                                    borderRadius: '10px',
                                    cursor: count > 0 && !processing ? 'pointer' : 'not-allowed',
                                    opacity: count > 0 ? 1 : 0.35,
                                    color: hex,
                                    boxShadow: isActive ? `0 0 12px ${hex}55` : 'none',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <Icon size={17} />
                                <span style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: '#94a3b8' }}>{label}</span>
                                <span style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: '#475569' }}>×{count}</span>
                            </button>
                        );
                    })}
                    <button
                        onClick={startGame}
                        title="New Game"
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.18rem', padding: '0.5rem 0.85rem', minWidth: '70px', background: 'rgba(15,23,42,0.6)', border: '1px solid #334155', borderRadius: '10px', cursor: 'pointer', color: '#64748b' }}
                    >
                        <RefreshCw size={17} />
                        <span style={{ fontSize: '0.58rem', fontFamily: 'monospace' }}>Reset</span>
                    </button>
                </div>

                {/* Instructions (below gameplay) */}
                <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center', lineHeight: 1.5 }}>
                    Drag a gem onto a neighbor, or tap two adjacent gems, to swap and match 3 or more.
                </p>
            </div>
        </div>
    );
}
