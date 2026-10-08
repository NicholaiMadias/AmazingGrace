import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Game, GAME_LEVELS, TOTAL_LEVELS } from './Game';
import type { Stats } from './levels/types';
import type { TowerType } from './levels/towerDefense';
import { TOWER_COST } from './levels/towerDefense';
import { isAudioEnabled, playBeat, setAudioEnabled, type BeatKind } from './audio';
import { askCode, askImage, askSpeech, askText } from './ai';
import { getUserId, initCloud, isOnline, publishPost, saveProgress, subscribeFeeds, type BlogPost, type ScoreEntry } from './cloud';
import './matrix.css';

type ToolKey = 'cli' | 'img' | 'code' | 'music' | 'multi' | 'blog' | 'media';

const TOOLS: { key: ToolKey; label: string; unlockLevel: number | 'victory'; requirement: string }[] = [
    { key: 'cli', label: 'L1: PowerShell CLI', unlockLevel: 1, requirement: 'Level 1' },
    { key: 'img', label: 'L2: AI Image Studio', unlockLevel: 2, requirement: 'Level 2' },
    { key: 'code', label: 'L3: AI Code Assistant', unlockLevel: 3, requirement: 'Level 3' },
    { key: 'music', label: 'L4: AI Music Synthesizer', unlockLevel: 4, requirement: 'Level 4' },
    { key: 'multi', label: 'L5: Cloud Sync & Co-op', unlockLevel: 5, requirement: 'Level 5' },
    { key: 'blog', label: 'L6: Conscience Blog', unlockLevel: 6, requirement: 'Level 6' },
    { key: 'media', label: 'VICTORY: Verified Media Hub', unlockLevel: 'victory', requirement: 'Game Completion' },
];

const TOWER_BUTTONS: { type: TowerType; label: string }[] = [
    { type: 'aegis', label: 'AEGIS WARD' },
    { type: 'sunfire', label: 'SUNFIRE BEAM' },
    { type: 'emp', label: 'EMP PULSE' },
];

type Modal = { title: string; subtitle?: string; body: string; action: { label: string; run: () => void } } | null;
interface Toast { id: number; msg: string; }
interface CliLine { id: number; kind: 'in' | 'out' | 'ai' | 'err' | 'wait'; text: string; }

let nextId = 1;

export default function MatrixApp() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Game | null>(null);
    const levelRef = useRef(1);

    const [hud, setHud] = useState({ level: 1, score: 0, energy: 120, hp: 100 });
    const [sync, setSync] = useState('OFFLINE');
    const [unlocked, setUnlocked] = useState<Record<ToolKey, boolean>>({ cli: false, img: false, code: false, music: false, multi: false, blog: false, media: false });
    const [activeTool, setActiveTool] = useState<ToolKey | null>(null);
    const [modal, setModal] = useState<Modal>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [tower, setTower] = useState<TowerType>('aegis');
    const [audioOn, setAudioOn] = useState(isAudioEnabled());
    const [scores, setScores] = useState<ScoreEntry[]>([]);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [userId, setUserId] = useState('Connecting...');
    const unlockedRef = useRef(unlocked);
    unlockedRef.current = unlocked;

    const toast = useCallback((msg: string) => {
        const id = nextId++;
        setToasts(t => [...t, { id, msg }]);
        window.setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
    }, []);

    const beginLevel = useCallback((level: number) => {
        levelRef.current = level;
        setModal(null);
        gameRef.current?.startLevel(level);
    }, []);

    const reboot = useCallback(() => {
        gameRef.current?.reset();
        setUnlocked({ cli: false, img: false, code: false, music: false, multi: false, blog: false, media: false });
        setActiveTool(null);
        beginLevel(1);
    }, [beginLevel]);

    const showIntro = useCallback(() => {
        setModal({
            title: 'INITIALIZING CONSCIENCE MATRIX',
            subtitle: 'CORE NODE ARCHITECTURE',
            body: "Welcome, Architect. The Matrix of Conscience evaluates autonomous defense choices and ethical alignments across multiple cybernetic domains. Complete each level's objective to unlock AI systemic capabilities!",
            action: { label: `BEGIN LEVEL 1: ${GAME_LEVELS[1]}`, run: () => beginLevel(1) },
        });
    }, [beginLevel]);

    // Game lifecycle
    useEffect(() => {
        const canvas = canvasRef.current;
        const viewport = viewportRef.current;
        if (!canvas || !viewport) return;

        const game = new Game(canvas, {
            onChange: (s: Readonly<Stats>, level) => setHud({ level, score: s.score, energy: Math.floor(s.energy), hp: Math.floor(s.hp) }),
            onComplete: level => {
                const key = TOOLS.find(t => t.unlockLevel === level)?.key;
                setUnlocked(prev => ({ ...prev, ...(key ? { [key]: true } : {}), ...(level === TOTAL_LEVELS ? { media: true } : {}) }));
                toast(level === TOTAL_LEVELS ? '🏆 ARCHITECT VICTORY! UNLOCKED VERIFIED MEDIA HUB!' : `🔓 UNLOCKED LEVEL ${level} TOOL!`);
                void saveProgress(game.stats.score, level).then(ok => { if (ok) toast('☁️ Progress saved to Cloud Firestore!'); });
                if (level < TOTAL_LEVELS) {
                    setModal({
                        title: `LEVEL ${level} COMPLETED!`,
                        body: `Excellent performance, Architect. You unlocked the Level ${level} System Tool! Proceed to Level ${level + 1}.`,
                        action: { label: `ADVANCE TO LEVEL ${level + 1}: ${GAME_LEVELS[level + 1]}`, run: () => beginLevel(level + 1) },
                    });
                } else {
                    setModal({
                        title: 'SYSTEM RESTORED — ARCHITECT VICTORY',
                        body: `Congratulations Architect! You defeated the Matrix Overlord with ${game.stats.score} PTS! Verified Media Hub unlocked.`,
                        action: { label: 'REBOOT MATRIX ARCADE', run: reboot },
                    });
                }
            },
            onFail: () => setModal({
                title: 'SYSTEM BREACH DETECTED',
                body: 'The Matrix lost structural integrity. Re-align ethical defenses and try again.',
                action: { label: 'REBOOT TERMINAL', run: reboot },
            }),
        });
        gameRef.current = game;
        game.resize();
        game.start();

        const ro = new ResizeObserver(() => game.resize());
        ro.observe(viewport);

        const onKey = (e: globalThis.KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
            if (game.keyDown(e.key)) e.preventDefault();
        };
        window.addEventListener('keydown', onKey);

        const down = (e: PointerEvent) => { canvas.setPointerCapture?.(e.pointerId); game.pointerDown(e); };
        const move = (e: PointerEvent) => game.pointerMove(e);
        const up = (e: PointerEvent) => game.pointerUp(e);
        const cancel = () => game.pointerCancel();
        canvas.addEventListener('pointerdown', down);
        canvas.addEventListener('pointermove', move);
        canvas.addEventListener('pointerup', up);
        canvas.addEventListener('pointercancel', cancel);

        return () => {
            game.stop();
            ro.disconnect();
            window.removeEventListener('keydown', onKey);
            canvas.removeEventListener('pointerdown', down);
            canvas.removeEventListener('pointermove', move);
            canvas.removeEventListener('pointerup', up);
            canvas.removeEventListener('pointercancel', cancel);
            gameRef.current = null;
        };
    }, [beginLevel, reboot, toast]);

    useEffect(() => { showIntro(); }, [showIntro]);

    // Optional cloud sync
    useEffect(() => {
        let off: (() => void) | undefined;
        let cancelled = false;
        void initCloud().then(async ok => {
            if (cancelled) return;
            setSync(ok ? 'ONLINE' : 'LOCAL-ONLY');
            setUserId(ok ? getUserId() : 'Local (offline)');
            if (ok && isOnline()) {
                const unsub = await subscribeFeeds(setScores, setPosts);
                if (cancelled) unsub(); else off = unsub;
            }
        });
        return () => { cancelled = true; off?.(); };
    }, []);

    const toggleTool = (key: ToolKey | null) => {
        if (key && !unlocked[key]) {
            const req = TOOLS.find(t => t.key === key)?.requirement ?? 'Level 1';
            toast(`🔒 Tool locked! Complete ${req} to unlock.`);
            return;
        }
        setActiveTool(prev => (key && prev !== key ? key : null));
    };

    const selectTower = (type: TowerType) => { setTower(type); gameRef.current?.setTowerType(type); };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => {});
        else void document.exitFullscreen?.();
    };

    const isTd = hud.level === 1 || hud.level === 4;

    return (
        <>
            <div className="crt-overlay" />
            <div className="toast-container" role="status" aria-live="polite">
                {toasts.map(t => <div key={t.id} className="toast-msg">{t.msg}</div>)}
            </div>

            <div className="game-wrapper">
                <header>
                    <div className="brand-title">
                        <span>MATRIX OF CONSCIENCE</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--term-cyan)' }}>[MULTIVERSE ARCADE v4.0]</span>
                    </div>
                    <div className="hud-metrics">
                        <div className="hud-item"><label>LEVEL:</label> <span className="val">{hud.level} / {TOTAL_LEVELS}</span></div>
                        <div className="hud-item"><label>MODE:</label> <span className="val">{GAME_LEVELS[hud.level]}</span></div>
                        <div className="hud-item"><label>SCORE:</label> <span className="val">{hud.score}</span></div>
                        <div className="hud-item"><label>ENERGY/HP:</label> <span className="val">{hud.energy} (HP: {hud.hp})</span></div>
                        <div className="hud-item"><label>SYNC:</label> <span className="val" style={{ color: 'var(--term-green)' }}>{sync}</span></div>
                    </div>
                </header>

                <div className="tools-bar">
                    <span style={{ color: 'var(--term-amber)', fontSize: '0.75rem', alignSelf: 'center', fontWeight: 'bold' }}>UNLOCKED SYSTEM TOOLS:</span>
                    {TOOLS.map(t => (
                        <button
                            key={t.key}
                            type="button"
                            className={`btn-unlock${unlocked[t.key] ? ' unlocked' : ''}${activeTool === t.key ? ' active-tool' : ''}`}
                            aria-disabled={!unlocked[t.key]}
                            onClick={() => toggleTool(t.key)}
                        >
                            {unlocked[t.key] ? '🔓' : '🔒'} {t.label}
                        </button>
                    ))}
                </div>

                <div className="viewport" ref={viewportRef}>
                    <canvas ref={canvasRef} aria-label="Matrix of Conscience game board" />

                    {modal && (
                        <div className="overlay-window" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                            <div className="modal-card">
                                <div className="modal-title">
                                    <span id="modal-title">{modal.title}</span>
                                    {modal.subtitle && <span style={{ fontSize: '0.75rem', color: 'var(--term-cyan)' }}>{modal.subtitle}</span>}
                                </div>
                                <div className="modal-body">{modal.body}</div>
                                <div className="choice-list">
                                    <button type="button" className="btn-choice" autoFocus onClick={modal.action.run}>{modal.action.label}</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTool && unlocked[activeTool] && (
                        <div className="tool-panel">
                            <ToolPanel
                                tool={activeTool}
                                close={() => setActiveTool(null)}
                                toast={toast}
                                scores={scores}
                                posts={posts}
                                userId={userId}
                                saveNow={async () => {
                                    const ok = await saveProgress(gameRef.current?.stats.score ?? 0, levelRef.current);
                                    toast(ok ? '☁️ Progress saved to Cloud Firestore!' : 'Cloud sync unavailable — playing in local-only mode.');
                                }}
                                openBlog={() => setActiveTool('blog')}
                            />
                        </div>
                    )}
                </div>

                <footer>
                    <div className="footer-group">
                        {isTd && (
                            <>
                                <span style={{ color: 'var(--term-cyan)' }}>TOWERS:</span>
                                {TOWER_BUTTONS.filter(b => b.type !== 'emp' || hud.level === 4).map(b => (
                                    <button key={b.type} type="button" className={`btn-util${tower === b.type ? ' active' : ''}`} onClick={() => selectTower(b.type)}>
                                        {b.label} ({TOWER_COST[b.type]} EN)
                                    </button>
                                ))}
                            </>
                        )}
                        {hud.level === 3 && (
                            <>
                                <button type="button" className="btn-util" onClick={() => gameRef.current?.moveShooter(-1)}>◀ LEFT</button>
                                <button type="button" className="btn-util" onClick={() => gameRef.current?.fireShooter()}>🔥 FIRE</button>
                                <button type="button" className="btn-util" onClick={() => gameRef.current?.moveShooter(1)}>RIGHT ▶</button>
                            </>
                        )}
                    </div>
                    <div className="footer-group">
                        <button type="button" className="btn-util" onClick={() => { const v = !audioOn; setAudioEnabled(v); setAudioOn(v); }}>AUDIO: {audioOn ? 'ON' : 'OFF'}</button>
                        <button type="button" className="btn-util" onClick={toggleFullscreen}>FULLSCREEN</button>
                    </div>
                </footer>
            </div>
        </>
    );
}

interface ToolPanelProps {
    tool: ToolKey;
    close: () => void;
    toast: (m: string) => void;
    scores: ScoreEntry[];
    posts: BlogPost[];
    userId: string;
    saveNow: () => Promise<void>;
    openBlog: () => void;
}

function PanelTitle({ children, close }: { children: string; close: () => void }) {
    return (
        <div className="modal-title" style={{ marginBottom: 12 }}>
            <span>{children}</span>
            <button type="button" className="btn-util" onClick={close}>CLOSE [X]</button>
        </div>
    );
}

const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e));

function ToolPanel({ tool, close, toast, scores, posts, userId, saveNow, openBlog }: ToolPanelProps) {
    const [cli, setCli] = useState<CliLine[]>([
        { id: 0, kind: 'out', text: 'Windows PowerShell v7.4.1 Matrix Conscience Instance' },
        { id: 1, kind: 'out', text: "Type 'help' for built-in commands or ask Gemini AI questions directly!" },
    ]);
    const [cliInput, setCliInput] = useState('');
    const cliEnd = useRef<HTMLDivElement>(null);
    const [imgPrompt, setImgPrompt] = useState('');
    const [imgState, setImgState] = useState<{ status: 'idle' | 'busy' | 'err'; src?: string; msg?: string }>({ status: 'idle' });
    const [codePrompt, setCodePrompt] = useState('');
    const [codeOut, setCodeOut] = useState('// AI Code Script Output...');
    const [tts, setTts] = useState('Say cheerfully: Welcome Architect to the Matrix of Conscience voice core!');
    const [ttsState, setTtsState] = useState<{ status: 'idle' | 'busy' | 'err'; src?: string; msg?: string }>({ status: 'idle' });
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => { cliEnd.current?.scrollIntoView?.({ block: 'end' }); }, [cli]);

    const push = (kind: CliLine['kind'], text: string) => setCli(l => [...l, { id: nextId++, kind, text }]);
    const colors: Record<CliLine['kind'], string> = { in: '#fff', out: 'var(--term-green)', ai: 'var(--term-green)', err: 'var(--term-alert)', wait: 'var(--term-amber)' };

    const onCliKey = async (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        const q = cliInput.trim();
        if (!q) return;
        setCliInput('');
        push('in', `PS C:\\> ${q}`);
        const cmd = q.toLowerCase();
        if (cmd === 'help') { push('out', 'Built-in commands: help, status, clear, or ask any AI prompt!'); return; }
        if (cmd === 'status') { push('out', `Cloud: ${isOnline() ? 'ONLINE' : 'LOCAL-ONLY'} | User: ${userId}`); return; }
        if (cmd === 'clear') { setCli([]); return; }
        push('wait', '[Gemini AI Thinking...]');
        try { push('ai', await askText(q)); } catch (err) { push('err', `AI Query Error: ${errMsg(err)}`); }
    };

    const genImage = async () => {
        const p = imgPrompt.trim();
        if (!p) { toast('Please enter an image prompt!'); return; }
        setImgState({ status: 'busy' });
        try {
            const src = await askImage(p);
            setImgState(src ? { status: 'idle', src } : { status: 'err', msg: 'Failed to render image.' });
        } catch (err) { setImgState({ status: 'err', msg: `Image Gen Error: ${errMsg(err)}` }); }
    };

    const genCode = async () => {
        const p = codePrompt.trim();
        if (!p) { toast('Enter a coding request!'); return; }
        setCodeOut('// Generating script with Gemini 3 Flash...');
        try { setCodeOut(await askCode(p)); } catch (err) { setCodeOut(`// Code Gen Error: ${errMsg(err)}`); }
    };

    const genSpeech = async () => {
        const t = tts.trim();
        if (!t) return;
        setTtsState({ status: 'busy' });
        try {
            const src = await askSpeech(t);
            setTtsState(src ? { status: 'idle', src } : { status: 'err', msg: 'Speech generation error.' });
        } catch (err) { setTtsState({ status: 'err', msg: `TTS Error: ${errMsg(err)}` }); }
    };

    const beat = (kind: BeatKind) => { playBeat(kind); toast(`🎵 Playing ${kind.toUpperCase()} synth sound pattern!`); };

    const publish = async (e: FormEvent) => {
        e.preventDefault();
        const t = title.trim();
        const c = content.trim();
        if (!t || !c) { toast('Title and content required!'); return; }
        if (await publishPost(t, c)) {
            toast('✅ Published verified artifact to Public Matrix Feed!');
            setTitle(''); setContent(''); openBlog();
        } else toast('Cloud sync unavailable — cannot publish in local-only mode.');
    };

    switch (tool) {
        case 'cli':
            return (
                <>
                    <PanelTitle close={close}>POWERSHELL / GEMINI CLI TERMINAL</PanelTitle>
                    <div className="cli-output">
                        {cli.map(l => <div key={l.id} style={{ color: colors[l.kind], whiteSpace: 'pre-wrap' }}>{l.text}</div>)}
                        <div ref={cliEnd} />
                    </div>
                    <div className="cli-input-row">
                        <span className="prompt">PS C:\Matrix\Conscience&gt;</span>
                        <input className="cli-input" value={cliInput} onChange={e => setCliInput(e.target.value)} onKeyDown={onCliKey} placeholder="Type AI query or CLI command..." aria-label="CLI input" />
                    </div>
                </>
            );
        case 'img':
            return (
                <>
                    <PanelTitle close={close}>AI STUDIO IMAGE GENERATOR (Gemini 3.1 Flash Lite)</PanelTitle>
                    <div className="stack" style={{ height: '100%' }}>
                        <div className="row">
                            <input className="field" value={imgPrompt} onChange={e => setImgPrompt(e.target.value)} placeholder="Prompt: e.g. A cybernetic tree of life glowing with emerald energy in a dark matrix core..." aria-label="Image prompt" />
                            <button type="button" className="btn-util btn-primary" style={{ background: 'var(--term-cyan)' }} onClick={genImage} disabled={imgState.status === 'busy'}>GENERATE ART</button>
                        </div>
                        <div style={{ flex: 1, minHeight: 120, border: '1px dashed var(--term-cyan)', borderRadius: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                            {imgState.src ? <img src={imgState.src} alt="Generated artwork" style={{ maxHeight: '100%', maxWidth: '100%', borderRadius: 4 }} />
                                : imgState.status === 'busy' ? <span style={{ color: 'var(--term-cyan)' }}>Generating artwork with gemini-3.1-flash-lite-image...</span>
                                : imgState.status === 'err' ? <span style={{ color: 'var(--term-alert)' }}>{imgState.msg}</span>
                                : <span style={{ color: 'var(--term-amber)' }}>Art output area — Enter prompt above to generate artwork via Gemini API</span>}
                        </div>
                    </div>
                </>
            );
        case 'code':
            return (
                <>
                    <PanelTitle close={close}>AI CODING ASSISTANT & SCRIPT STUDIO</PanelTitle>
                    <div className="stack" style={{ flex: 1 }}>
                        <textarea className="field" style={{ flex: 'none', height: 80 }} value={codePrompt} onChange={e => setCodePrompt(e.target.value)} placeholder="Ask AI Code Assistant to write a script, game algorithm, or web tool..." aria-label="Code prompt" />
                        <button type="button" className="btn-util btn-primary" style={{ background: 'var(--term-amber)' }} onClick={genCode}>GENERATE CODE SCRIPT</button>
                        <div style={{ flex: 1, background: 'rgba(0,0,0,0.9)', border: '1px solid var(--term-green)', padding: 10, borderRadius: 4, overflowY: 'auto', fontSize: '0.8rem', color: 'var(--term-green)', whiteSpace: 'pre-wrap' }}>{codeOut}</div>
                    </div>
                </>
            );
        case 'music':
            return (
                <>
                    <PanelTitle close={close}>AI MUSIC SYNTHESIZER & TTS VOICE ENGINE</PanelTitle>
                    <div className="stack">
                        <div className="card">
                            <h4 style={{ color: 'var(--term-amber)', marginBottom: 6 }}>Web Audio Procedural Cyber Synthesizer</h4>
                            <div className="row">
                                <button type="button" className="btn-util" onClick={() => beat('cyber')}>PLAY CYBER SYNTH PULSE</button>
                                <button type="button" className="btn-util" onClick={() => beat('ambient')}>PLAY MATRIX HARMONIC</button>
                                <button type="button" className="btn-util" onClick={() => beat('boss')}>PLAY BATTLE OVERDRIVE</button>
                            </div>
                        </div>
                        <div className="card" style={{ borderColor: 'var(--term-amber)' }}>
                            <h4 style={{ color: 'var(--term-amber)', marginBottom: 6 }}>Gemini Voice TTS Synthesizer (gemini-2.5-flash-preview-tts)</h4>
                            <div className="row">
                                <input className="field" value={tts} onChange={e => setTts(e.target.value)} aria-label="Speech text" />
                                <button type="button" className="btn-util btn-primary" style={{ background: 'var(--term-amber)' }} onClick={genSpeech} disabled={ttsState.status === 'busy'}>SYNTHESIZE SPEECH</button>
                            </div>
                            <div style={{ marginTop: 10 }}>
                                {ttsState.status === 'busy' && <span style={{ color: 'var(--term-amber)' }}>Generating speech audio with gemini-2.5-flash-preview-tts...</span>}
                                {ttsState.status === 'err' && <span style={{ color: 'var(--term-alert)' }}>{ttsState.msg}</span>}
                                {ttsState.src && <audio controls autoPlay src={ttsState.src} />}
                            </div>
                        </div>
                    </div>
                </>
            );
        case 'multi':
            return (
                <>
                    <PanelTitle close={close}>CLOUD SYNC & MULTIPLAYER LEADERBOARD</PanelTitle>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, flex: 1 }}>
                        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ color: 'var(--term-cyan)', borderBottom: '1px solid var(--term-cyan)', paddingBottom: 4, marginBottom: 8 }}>GLOBAL ARCHITECT LEADERBOARD</h4>
                            <div style={{ flex: 1, overflowY: 'auto', fontSize: '0.85rem' }}>
                                {scores.length === 0 && <div>{isOnline() ? 'No scores yet.' : 'Leaderboard unavailable in local-only mode.'}</div>}
                                {scores.map((s, i) => (
                                    <div key={`${s.userId}-${i}`} className="lb-row">
                                        <span>#{i + 1} {s.userId.substring(0, 8)}...</span>
                                        <span style={{ color: 'var(--term-amber)' }}>{s.score} PTS (L{s.level})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card stack" style={{ borderColor: 'var(--term-amber)' }}>
                            <h4 style={{ color: 'var(--term-amber)', borderBottom: '1px solid var(--term-amber)', paddingBottom: 4 }}>CLOUD SAVE STATUS</h4>
                            <p style={{ fontSize: '0.85rem' }}>User Identification: <span style={{ color: 'var(--term-cyan)' }}>{userId}</span></p>
                            <button type="button" className="btn-util btn-primary" style={{ background: 'var(--term-green)' }} onClick={() => void saveNow()}>FORCE CLOUD SYNC SAVE</button>
                        </div>
                    </div>
                </>
            );
        case 'blog':
            return (
                <>
                    <PanelTitle close={close}>CONSCIENCE CHRONICLE — COMMUNITY BLOG</PanelTitle>
                    <div className="stack" style={{ flex: 1, overflowY: 'auto' }}>
                        {posts.length === 0 && <div>{isOnline() ? 'No posts yet.' : 'Community feed unavailable in local-only mode.'}</div>}
                        {posts.map(p => (
                            <div key={p.id} className="card">
                                <h3 style={{ color: 'var(--term-amber)', fontSize: '1rem', fontWeight: 'bold' }}>{p.title}</h3>
                                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: '4px 0', whiteSpace: 'pre-wrap' }}>{p.content}</p>
                                <span style={{ fontSize: '0.7rem', color: 'var(--term-cyan)' }}>Posted by Verified Architect {p.userId}</span>
                            </div>
                        ))}
                    </div>
                </>
            );
        case 'media':
            return (
                <>
                    <PanelTitle close={close}>VERIFIED ARCHITECT MEDIA HUB (SPAM-PROTECTED)</PanelTitle>
                    <form className="stack" onSubmit={publish}>
                        <div className="card" style={{ borderColor: 'var(--term-green)', fontSize: '0.85rem' }}>
                            ✅ <strong>VERIFICATION PASSED:</strong> You completed all 6 levels of Matrix of Conscience! You now hold full privileges to share media and blog posts to the public ecosystem.
                        </div>
                        <input className="field" style={{ flex: 'none' }} value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder="Media Title / Artifact Name..." aria-label="Media title" />
                        <textarea className="field" style={{ flex: 'none', height: 80 }} value={content} onChange={e => setContent(e.target.value)} maxLength={2000} placeholder="Description or image URL / text body..." aria-label="Media content" />
                        <button type="submit" className="btn-util btn-primary" style={{ background: 'var(--term-green)' }}>PUBLISH TO PUBLIC MATRIX FEED</button>
                    </form>
                </>
            );
    }
}
