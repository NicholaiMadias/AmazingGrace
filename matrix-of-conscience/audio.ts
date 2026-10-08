import type { Wave } from './levels/types';

let audioCtx: AudioContext | null = null;
let enabled = true;

function ensureContext(): AudioContext | null {
    if (!audioCtx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctor) audioCtx = new Ctor();
    }
    if (audioCtx?.state === 'suspended') void audioCtx.resume();
    return audioCtx;
}

export function setAudioEnabled(value: boolean): void { enabled = value; }
export function isAudioEnabled(): boolean { return enabled; }

export function playSound(freq: number, duration = 0.08, type: Wave = 'sine'): void {
    if (!enabled) return;
    const ctx = ensureContext();
    if (!ctx) return;
    try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch {
        /* audio is best-effort */
    }
}

export type BeatKind = 'cyber' | 'ambient' | 'boss';

export function playBeat(kind: BeatKind): void {
    if (kind === 'cyber') { playSound(440, 0.3, 'sawtooth'); playSound(880, 0.2, 'sine'); }
    else if (kind === 'ambient') { playSound(220, 0.5, 'sine'); playSound(330, 0.4, 'triangle'); }
    else { playSound(150, 0.4, 'square'); playSound(600, 0.2, 'sawtooth'); }
}
