/**
 * NexusSoundFX.js — Procedural SFX synthesiser for Matrix of Conscience.
 * Uses the Web Audio API to synthesise all sounds; no audio files required.
 * Sound names: statPulse | combo | missionComplete | omen | memory
 */

/** @type {AudioContext|null} */
let _ctx = null;
/** @type {GainNode|null} */
let _gain = null;

function _ensure() {
  if (_ctx) {
    if (_ctx.state === 'suspended') _ctx.resume();
    return;
  }
  try {
    _ctx  = new (window.AudioContext || window.webkitAudioContext)();
    _gain = _ctx.createGain();
    _gain.gain.value = 0.6;
    _gain.connect(_ctx.destination);
  } catch (e) {
    console.warn('[NexusSoundFX] Web Audio unavailable:', e);
  }
}

/**
 * @param {'sine'|'square'|'sawtooth'|'triangle'} type
 * @param {number} freq
 * @param {number} dur   seconds
 * @param {number} vol
 * @param {number} [rampTo]  optional frequency ramp target
 */
function _osc(type, freq, dur, vol, rampTo) {
  if (!_ctx || !_gain) return;
  const o = _ctx.createOscillator();
  const g = _ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, _ctx.currentTime);
  if (rampTo) {
    o.frequency.exponentialRampToValueAtTime(rampTo, _ctx.currentTime + dur * 0.8);
  }
  g.gain.setValueAtTime(vol, _ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, _ctx.currentTime + dur);
  o.connect(g);
  g.connect(_gain);
  o.start();
  o.stop(_ctx.currentTime + dur);
}

/** Play a chord arpeggio (array of [freq, startOffset]) */
function _arpeggio(freqs, dur, vol, type = 'sine', step = 0.1) {
  if (!_ctx || !_gain) return;
  freqs.forEach((freq, i) => {
    const t = _ctx.currentTime + i * step;
    const o = _ctx.createOscillator();
    const g = _ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(_gain);
    o.start(t);
    o.stop(t + dur);
  });
}

const SOUNDS = {
  /**
   * Brief ascending blip when a stat node pulses.
   */
  statPulse() {
    _osc('sine', 660, 0.18, 0.25, 1200);
  },

  /**
   * Escalating chord flash — louder / more complex at higher chainLevel.
   * @param {number} [level]
   */
  combo(level = 1) {
    const vol  = Math.min(0.05 + level * 0.04, 0.35);
    const base = 440 + level * 55;
    _arpeggio([base, base * 1.25, base * 1.5], 0.22, vol, 'triangle', 0.08);
  },

  /**
   * Triumphant ascending fanfare when a mission completes.
   */
  missionComplete() {
    _arpeggio([523.25, 659.25, 783.99, 1046.5], 0.4, 0.22, 'sine', 0.15);
  },

  /**
   * Deep ominous drone for an omen unlock.
   */
  omen() {
    _osc('sawtooth', 80, 0.6, 0.2, 160);
    _osc('square',   40, 0.8, 0.1);
  },

  /**
   * Ethereal shimmer for a memory unlock.
   */
  memory() {
    _arpeggio([880, 1108, 1320, 1760], 0.5, 0.18, 'sine', 0.12);
    _osc('triangle', 440, 0.8, 0.08);
  }
};

/**
 * Play a named sound effect.
 *
 * @param {keyof typeof SOUNDS} name  - 'statPulse' | 'combo' | 'missionComplete' | 'omen' | 'memory'
 * @param {number} [level]            - optional intensity level (used by 'combo')
 */
export function playSound(name, level) {
  _ensure();
  if (!_ctx) return;
  const fn = SOUNDS[name];
  if (fn) {
    fn(level);
  } else {
    console.warn(`[NexusSoundFX] Unknown sound: "${name}"`);
  }
}
