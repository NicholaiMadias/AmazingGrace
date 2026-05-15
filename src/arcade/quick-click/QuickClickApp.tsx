import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  type DocumentData,
} from 'firebase/firestore';
import {
  ensureAnonymousUser,
  getAppId,
  getFirestoreDb,
} from '../../firebase/nexus-firestore';
import { assertPathSegment } from '../../firebase/path';
import {
  clamp,
  defaultTargetLifetimeMs,
  isHit,
  nextSpawnDelayMs,
  type QuickClickTarget,
} from './gameLogic';

type GameStatus = 'idle' | 'playing' | 'ended';

type PersistStatus =
  | { state: 'idle' }
  | { state: 'unavailable' }
  | { state: 'saving' }
  | { state: 'saved'; highScore: number }
  | { state: 'error'; message: string };

type LeaderboardEntry = {
  userId: string;
  score: number;
  updatedAt?: string;
};

const GAME_DURATION_MS = 20_000;

function formatMs(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function tryParseLeaderboard(data: DocumentData | undefined): LeaderboardEntry[] | null {
  const raw = data?.entries ?? data?.scores ?? null;
  if (!Array.isArray(raw)) return null;

  const entries: LeaderboardEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const userId =
      typeof (item as any).userId === 'string'
        ? (item as any).userId
        : typeof (item as any).uid === 'string'
          ? (item as any).uid
          : '';
    const score = typeof (item as any).score === 'number' ? (item as any).score : NaN;
    if (!userId || !Number.isFinite(score)) continue;
    entries.push({
      userId,
      score,
      updatedAt:
        typeof (item as any).updatedAt === 'string'
          ? (item as any).updatedAt
          : undefined,
    });
  }

  entries.sort((a, b) => b.score - a.score);
  return entries.slice(0, 10);
}

export default function QuickClickApp() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);

  const [status, setStatus] = useState<GameStatus>('idle');
  const [score, setScore] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(GAME_DURATION_MS);
  const [persistStatus, setPersistStatus] = useState<PersistStatus>({ state: 'idle' });

  const [leaderboardState, setLeaderboardState] = useState<
    | { state: 'idle' }
    | { state: 'loading' }
    | { state: 'ready'; entries: LeaderboardEntry[] | null; raw: unknown }
    | { state: 'unavailable' }
    | { state: 'error'; message: string }
  >({ state: 'idle' });

  const appId = useMemo(() => getAppId('arcade'), []);
  const db = useMemo(() => getFirestoreDb(), []);

  const gameEndAtRef = useRef<number | null>(null);
  const targetRef = useRef<QuickClickTarget | null>(null);
  const rafRef = useRef<number | null>(null);
  const spawnTimeoutRef = useRef<number | null>(null);
  const expireTimeoutRef = useRef<number | null>(null);
  const tickIntervalRef = useRef<number | null>(null);
  const statusRef = useRef<GameStatus>(status);
  const scoreRef = useRef<number>(score);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const clearTimers = () => {
    if (spawnTimeoutRef.current) window.clearTimeout(spawnTimeoutRef.current);
    if (expireTimeoutRef.current) window.clearTimeout(expireTimeoutRef.current);
    if (tickIntervalRef.current) window.clearInterval(tickIntervalRef.current);
    spawnTimeoutRef.current = null;
    expireTimeoutRef.current = null;
    tickIntervalRef.current = null;
  };

  const stopDrawing = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const computeTarget = (w: number, h: number, now: number): QuickClickTarget => {
    const minSide = Math.min(w, h);
    const radius = clamp(minSide * 0.08, 18, 42);
    const padding = radius + 10;
    const x = padding + Math.random() * Math.max(0, w - padding * 2);
    const y = padding + Math.random() * Math.max(0, h - padding * 2);
    return { x, y, radius, expiresAt: now + defaultTargetLifetimeMs() };
  };

  const scheduleNextTarget = () => {
    if (statusRef.current !== 'playing') return;
    if (!canvasWrapRef.current) return;

    const delay = nextSpawnDelayMs();
    spawnTimeoutRef.current = window.setTimeout(() => {
      const wrap = canvasWrapRef.current;
      if (!wrap || statusRef.current !== 'playing') return;
      const now = Date.now();
      const rect = wrap.getBoundingClientRect();
      targetRef.current = computeTarget(rect.width, rect.height, now);

      if (expireTimeoutRef.current) window.clearTimeout(expireTimeoutRef.current);
      const ttl = Math.max(0, targetRef.current.expiresAt - now);
      expireTimeoutRef.current = window.setTimeout(() => {
        targetRef.current = null;
        scheduleNextTarget();
      }, ttl);
    }, delay);
  };

  const endGame = async () => {
    clearTimers();
    targetRef.current = null;
    gameEndAtRef.current = null;
    statusRef.current = 'ended';
    setStatus('ended');

    if (!db) {
      setPersistStatus({ state: 'unavailable' });
      return;
    }

    try {
      setPersistStatus({ state: 'saving' });
      const user = await ensureAnonymousUser();
      if (!user) {
        setPersistStatus({ state: 'unavailable' });
        return;
      }

      assertPathSegment('appId', appId);
      assertPathSegment('userId', user.uid);

      const scoreToPersist = scoreRef.current;

      const statsRef = doc(
        db,
        'artifacts',
        appId,
        'users',
        user.uid,
        'game_stats',
        'quick_click'
      );

      const nextHighScore = await runTransaction(db, async (tx) => {
        const snap = await tx.get(statsRef);
        const previousHighScore = snap.exists()
          ? (snap.data() as Record<string, unknown>).highScore
          : 0;
        const previousHigh =
          typeof previousHighScore === 'number' && Number.isFinite(previousHighScore)
            ? previousHighScore
            : 0;
        const highScore = Math.max(previousHigh, scoreToPersist);

        tx.set(
          statsRef,
          {
            lastScore: scoreToPersist,
            highScore,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        return highScore;
      });

      setPersistStatus({ state: 'saved', highScore: nextHighScore });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setPersistStatus({ state: 'error', message });
    }
  };

  const startGame = () => {
    setPersistStatus({ state: 'idle' });
    setScore(0);
    statusRef.current = 'playing';
    setStatus('playing');
    scoreRef.current = 0;
    const endAt = Date.now() + GAME_DURATION_MS;
    gameEndAtRef.current = endAt;
    setTimeLeftMs(GAME_DURATION_MS);

    clearTimers();
    scheduleNextTarget();

    tickIntervalRef.current = window.setInterval(() => {
      const end = gameEndAtRef.current;
      if (!end) return;
      const remaining = end - Date.now();
      setTimeLeftMs(remaining);
      if (remaining <= 0) {
        void endGame();
      }
    }, 120);
  };

  useEffect(() => {
    const wrap = canvasWrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(wrap);

    const draw = () => {
      const rect = wrap.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Subtle grid
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = '#7effd8';
      ctx.lineWidth = 1;
      const step = 36;
      for (let x = 0; x <= rect.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }
      for (let y = 0; y <= rect.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }
      ctx.restore();

      const target = targetRef.current;
      if (status === 'playing' && target) {
        ctx.save();
        ctx.shadowBlur = 18;
        ctx.shadowColor = '#7effd8';
        ctx.fillStyle = '#7effd8';
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Bullseye
        ctx.save();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.radius * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      ro.disconnect();
      stopDrawing();
    };
  }, [status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = canvasWrapRef.current;
    if (!canvas || !wrap) return;

    const onPointerDown = (event: PointerEvent) => {
      if (statusRef.current !== 'playing') return;
      const target = targetRef.current;
      if (!target) return;
      const now = Date.now();
      if (now > target.expiresAt) return;

      const rect = wrap.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      if (!isHit(target, x, y)) return;

      setScore((current) => {
        const next = current + 10;
        scoreRef.current = next;
        return next;
      });
      targetRef.current = null;

      if (expireTimeoutRef.current) window.clearTimeout(expireTimeoutRef.current);
      expireTimeoutRef.current = null;

      // Snappy reward: schedule next target quickly.
      if (spawnTimeoutRef.current) window.clearTimeout(spawnTimeoutRef.current);
      spawnTimeoutRef.current = window.setTimeout(() => scheduleNextTarget(), 120);
    };

    canvas.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => canvas.removeEventListener('pointerdown', onPointerDown);
  }, [status]);

  useEffect(() => {
    return () => {
      clearTimers();
      stopDrawing();
    };
  }, []);

  useEffect(() => {
    if (leaderboardState.state !== 'idle') return;
    if (!db) {
      setLeaderboardState({ state: 'unavailable' });
      return;
    }

    let cancelled = false;
    const run = async () => {
      try {
        setLeaderboardState({ state: 'loading' });
        assertPathSegment('appId', appId);
        const leaderboardRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard');
        const snap = await getDoc(leaderboardRef);
        const raw = snap.exists() ? snap.data() : null;
        const entries = tryParseLeaderboard(raw ?? undefined);
        if (!cancelled) {
          setLeaderboardState({ state: 'ready', entries, raw });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        if (!cancelled) setLeaderboardState({ state: 'error', message });
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [appId, db, leaderboardState.state]);

  const refreshLeaderboard = async () => {
    if (!db) {
      setLeaderboardState({ state: 'unavailable' });
      return;
    }
    try {
      setLeaderboardState({ state: 'loading' });
      assertPathSegment('appId', appId);
      const leaderboardRef = doc(db, 'artifacts', appId, 'public', 'data', 'leaderboard');
      const snap = await getDoc(leaderboardRef);
      const raw = snap.exists() ? snap.data() : null;
      const entries = tryParseLeaderboard(raw ?? undefined);
      setLeaderboardState({ state: 'ready', entries, raw });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setLeaderboardState({ state: 'error', message });
    }
  };

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '16px',
      }}
      aria-label="Quick Click game"
    >
      <header
        style={{
          background: 'rgba(30,41,59,0.55)',
          border: '1px solid rgba(148,163,184,0.25)',
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'baseline' }}>
          <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: '#ffd700' }}>
            Quick Click
          </h1>
          <div style={{ color: '#94a3b8', fontWeight: 700, letterSpacing: '0.02em' }}>
            Click the target — <span style={{ color: '#7effd8' }}>+10</span> per hit
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.25)',
              background: 'rgba(15,23,42,0.55)',
              minWidth: 140,
            }}
            aria-label={`Score: ${score}`}
          >
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 800, letterSpacing: '0.12em' }}>
              SCORE
            </div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{score}</div>
          </div>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.25)',
              background: 'rgba(15,23,42,0.55)',
              minWidth: 140,
            }}
            aria-label={`Time left: ${formatMs(timeLeftMs)}`}
          >
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 800, letterSpacing: '0.12em' }}>
              TIME
            </div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{formatMs(timeLeftMs)}</div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            {status !== 'playing' ? (
              <button
                onClick={startGame}
                style={{
                  cursor: 'pointer',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.25)',
                  background: '#7effd8',
                  color: '#0f172a',
                  fontWeight: 900,
                  minHeight: 44,
                }}
              >
                ▶ Start
              </button>
            ) : (
              <button
                onClick={() => void endGame()}
                style={{
                  cursor: 'pointer',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(148,163,184,0.25)',
                  background: 'rgba(251,113,133,0.12)',
                  color: '#fb7185',
                  fontWeight: 900,
                  minHeight: 44,
                }}
              >
                ■ End
              </button>
            )}
          </div>
        </div>
      </header>

      <div
        ref={canvasWrapRef}
        style={{
          width: '100%',
          aspectRatio: '16 / 10',
          borderRadius: 18,
          border: '1px solid rgba(148,163,184,0.25)',
          background: 'rgba(15,23,42,0.55)',
          overflow: 'hidden',
          position: 'relative',
        }}
        aria-label="Game canvas"
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            touchAction: 'manipulation',
          }}
        />

        {status === 'idle' ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              padding: 16,
              textAlign: 'center',
              color: '#94a3b8',
              fontWeight: 700,
            }}
          >
            Press <span style={{ color: '#7effd8' }}>Start</span> and click every target you see.
          </div>
        ) : null}

        {status === 'ended' ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              padding: 16,
              textAlign: 'center',
            }}
            role="status"
            aria-live="polite"
          >
            <div
              style={{
                maxWidth: 520,
                width: '100%',
                borderRadius: 18,
                border: '1px solid rgba(148,163,184,0.25)',
                background: 'rgba(30,41,59,0.75)',
                padding: 16,
              }}
            >
              <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 800, letterSpacing: '0.12em' }}>
                GAME OVER
              </div>
              <div style={{ fontSize: 28, fontWeight: 950, marginTop: 6 }}>
                Score: <span style={{ color: '#7effd8' }}>{score}</span>
              </div>

              <div style={{ marginTop: 10, color: '#cbd5e1', fontWeight: 700 }}>
                {persistStatus.state === 'idle' ? null : null}
                {persistStatus.state === 'unavailable'
                  ? 'Firestore not configured here — score not saved.'
                  : null}
                {persistStatus.state === 'saving' ? 'Saving to Firestore…' : null}
                {persistStatus.state === 'saved'
                  ? `Saved. Personal best: ${persistStatus.highScore}`
                  : null}
                {persistStatus.state === 'error'
                  ? `Save failed: ${persistStatus.message}`
                  : null}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <button
                  onClick={startGame}
                  style={{
                    cursor: 'pointer',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.25)',
                    background: '#ffd700',
                    color: '#0f172a',
                    fontWeight: 900,
                    minHeight: 44,
                  }}
                >
                  ↻ Play Again
                </button>
                <a
                  href="/arcade/"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(148,163,184,0.25)',
                    background: 'rgba(15,23,42,0.55)',
                    color: '#e2e8f0',
                    fontWeight: 900,
                    textDecoration: 'none',
                    minHeight: 44,
                  }}
                >
                  ← Arcade
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <section
        style={{
          borderRadius: 16,
          border: '1px solid rgba(148,163,184,0.25)',
          background: 'rgba(30,41,59,0.55)',
          padding: 16,
        }}
        aria-label="Global leaderboard"
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: '#ffd700' }}>
            Global Leaderboard
          </h2>
          <button
            onClick={() => void refreshLeaderboard()}
            style={{
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.25)',
              background: 'rgba(15,23,42,0.55)',
              color: '#e2e8f0',
              fontWeight: 900,
              minHeight: 40,
            }}
          >
            ⟳ Refresh
          </button>
        </div>

        <p style={{ margin: '10px 0 0', color: '#94a3b8', fontWeight: 700 }}>
          Source: <code>/artifacts/{appId}/public/data/leaderboard</code>
        </p>

        {leaderboardState.state === 'unavailable' ? (
          <p style={{ color: '#94a3b8', fontWeight: 700, marginTop: 12 }}>
            Firestore not configured here — leaderboard unavailable.
          </p>
        ) : leaderboardState.state === 'loading' ? (
          <p style={{ color: '#cbd5e1', fontWeight: 700, marginTop: 12 }}>Loading…</p>
        ) : leaderboardState.state === 'error' ? (
          <p style={{ color: '#fb7185', fontWeight: 800, marginTop: 12 }}>
            Failed to load leaderboard: {leaderboardState.message}
          </p>
        ) : leaderboardState.state === 'ready' ? (
          leaderboardState.entries && leaderboardState.entries.length ? (
            <ol style={{ marginTop: 12, paddingLeft: 18 }}>
              {leaderboardState.entries.map((entry) => (
                <li key={`${entry.userId}-${entry.score}`} style={{ margin: '6px 0', fontWeight: 800 }}>
                  <span style={{ color: '#7effd8' }}>{entry.score}</span>
                  <span style={{ color: '#94a3b8' }}> · </span>
                  <span style={{ color: '#e2e8f0' }}>{entry.userId}</span>
                </li>
              ))}
            </ol>
          ) : (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 900, color: '#e2e8f0' }}>
                No parsed leaderboard entries (show raw)
              </summary>
              <pre
                style={{
                  marginTop: 10,
                  background: 'rgba(15,23,42,0.55)',
                  border: '1px solid rgba(148,163,184,0.25)',
                  borderRadius: 12,
                  padding: 12,
                  overflow: 'auto',
                  color: '#cbd5e1',
                }}
              >
                {JSON.stringify(leaderboardState.raw, null, 2)}
              </pre>
            </details>
          )
        ) : (
          <p style={{ marginTop: 12, color: '#94a3b8', fontWeight: 700 }}>
            Ready when Firestore is configured.
          </p>
        )}
      </section>
    </section>
  );
}
