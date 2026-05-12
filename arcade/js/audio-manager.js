/**
 * AudioManager – Matrix Trials Music & SFX Controller
 * Music OFF by default; SFX ON by default.
 * Procedural SFX via Web Audio API synthesis — no audio files required.
 * Preferences persist via localStorage.
 */
class AudioManager {
  constructor(opts = {}) {
    this.STORAGE_KEY = opts.storageKey || 'matrixTrials_audioPrefs';
    const def = { musicEnabled: false, sfxEnabled: true, musicVolume: 0.4, sfxVolume: 0.7 };
    this.prefs = { ...def, ...this._loadPrefs() };
    this._ctx = null;
    this._tracks = new Map();
    this._sfxBufs = new Map();
    this._current = null;
    this._mGain = null;
    this._sGain = null;
    this._ready = false;
    this._pending = null;
    this._proc = new Map();
    this._uiEl = null;
    this._registerProceduralSFX();
  }

  /* ---- Audio Context ---- */
  _initCtx() {
    if (this._ready) return;
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._mGain = this._ctx.createGain();
      this._mGain.gain.value = this.prefs.musicEnabled ? this.prefs.musicVolume : 0;
      this._mGain.connect(this._ctx.destination);
      this._sGain = this._ctx.createGain();
      this._sGain.gain.value = this.prefs.sfxEnabled ? this.prefs.sfxVolume : 0;
      this._sGain.connect(this._ctx.destination);
      this._ready = true;
      if (this._pending) { this.playMusic(this._pending); this._pending = null; }
    } catch (e) { console.warn('[AudioManager] Web Audio unavailable:', e); }
  }

  _ensure() {
    if (!this._ready) this._initCtx();
    if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume();
  }

  /* ---- Registration ---- */
  registerTrack(name, url) { this._tracks.set(name, { url, buffer: null }); }
  registerSFX(name, url) { this._sfxBufs.set(name, { url, buffer: null }); }

  /* ---- Procedural SFX ---- */
  _registerProceduralSFX() {
    const P = this._proc, osc = (c, type, freq, dur, vol, ramp) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
      if (ramp) o.frequency.exponentialRampToValueAtTime(ramp, c.currentTime + dur * 0.8);
      g.gain.setValueAtTime(vol, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g); g.connect(this._sGain); o.start(); o.stop(c.currentTime + dur);
    };
    P.set('click', c => osc(c, 'sine', 800, 0.1, 0.3, 400));
    P.set('error', c => osc(c, 'square', 220, 0.3, 0.15, 110));
    P.set('powerup', c => osc(c, 'sine', 300, 0.5, 0.25, 1200));
    P.set('success', c => {
      [523.25, 659.25, 783.99].forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * 0.12;
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        o.connect(g); g.connect(this._sGain); o.start(t); o.stop(t + 0.3);
      });
    });
    P.set('whoosh', c => {
      const len = c.sampleRate * 0.3, buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const n = c.createBufferSource(); n.buffer = buf;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2;
      bp.frequency.setValueAtTime(1000, c.currentTime);
      bp.frequency.exponentialRampToValueAtTime(4000, c.currentTime + 0.15);
      bp.frequency.exponentialRampToValueAtTime(500, c.currentTime + 0.3);
      const g = c.createGain(); g.gain.setValueAtTime(0.001, c.currentTime);
      g.gain.linearRampToValueAtTime(0.3, c.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
      n.connect(bp); bp.connect(g); g.connect(this._sGain); n.start(); n.stop(c.currentTime + 0.3);
    });
    P.set('boss-hit', c => {
      const o1 = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
      o1.type = 'sawtooth'; o1.frequency.setValueAtTime(150, c.currentTime);
      o1.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.2);
      o2.type = 'square'; o2.frequency.value = 80;
      g.gain.setValueAtTime(0.2, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.25);
      o1.connect(g); o2.connect(g); g.connect(this._sGain);
      o1.start(); o2.start(); o1.stop(c.currentTime + 0.25); o2.stop(c.currentTime + 0.25);
    });
    P.set('chapter-transition', c => {
      [261.63, 329.63, 392, 523.25].forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * 0.15;
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        o.connect(g); g.connect(this._sGain); o.start(t); o.stop(t + 0.5);
      });
    });
    P.set('victory', c => {
      [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * 0.18;
        o.type = i < 4 ? 'sine' : 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o.connect(g); g.connect(this._sGain); o.start(t); o.stop(t + 0.35);
      });
    });
    P.set('defeat', c => {
      [392, 349.23, 293.66, 261.63].forEach((f, i) => {
        const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * 0.25;
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        o.connect(g); g.connect(this._sGain); o.start(t); o.stop(t + 0.6);
      });
    });
  }

  /* ---- Playback ---- */
  async playMusic(name, loop = true) {
    if (!this._ready) { this._pending = name; return; }
    if (!this.prefs.musicEnabled) { this._pending = name; return; }
    if (this._current) await this._fadeOut(0.5);
    const t = this._tracks.get(name);
    if (!t) return;
    if (!t.buffer) {
      try {
        const r = await fetch(t.url), ab = await r.arrayBuffer();
        t.buffer = await this._ctx.decodeAudioData(ab);
      } catch (e) { console.warn('[AudioManager] Track load error:', e); return; }
    }
    const src = this._ctx.createBufferSource();
    src.buffer = t.buffer; src.loop = loop;
    src.connect(this._mGain); src.start(0);
    this._current = { name, source: src };
  }

  async stopMusic(fade = 0.5) { if (this._current) await this._fadeOut(fade); }

  playSFX(name) {
    if (!this.prefs.sfxEnabled) return;
    this._ensure(); if (!this._ctx) return;
    const proc = this._proc.get(name);
    if (proc) { proc(this._ctx); return; }
    const sfx = this._sfxBufs.get(name);
    if (!sfx) return;
    if (!sfx.buffer) {
      fetch(sfx.url).then(r => r.arrayBuffer())
        .then(b => this._ctx.decodeAudioData(b))
        .then(buf => { sfx.buffer = buf; this._playBuf(buf); })
        .catch(() => {});
      return;
    }
    this._playBuf(sfx.buffer);
  }

  _playBuf(buf) {
    const s = this._ctx.createBufferSource();
    s.buffer = buf; s.connect(this._sGain); s.start(0);
  }

  async _fadeOut(dur) {
    if (!this._current || !this._mGain) return;
    const g = this._mGain.gain;
    g.setValueAtTime(g.value, this._ctx.currentTime);
    g.linearRampToValueAtTime(0, this._ctx.currentTime + dur);
    await new Promise(r => setTimeout(r, dur * 1000));
    try { this._current.source.stop(); } catch (e) {}
    this._current = null;
    g.setValueAtTime(this.prefs.musicVolume, this._ctx.currentTime);
  }

  /* ---- Toggles ---- */
  toggleMusic() {
    this.prefs.musicEnabled = !this.prefs.musicEnabled;
    this._savePrefs();
    if (this._mGain) this._mGain.gain.setValueAtTime(
      this.prefs.musicEnabled ? this.prefs.musicVolume : 0, this._ctx.currentTime);
    if (this.prefs.musicEnabled && this._pending) this.playMusic(this._pending);
    if (!this.prefs.musicEnabled && this._current) this._fadeOut(0.3);
    this._updateUI();
    return this.prefs.musicEnabled;
  }

  toggleSFX() {
    this.prefs.sfxEnabled = !this.prefs.sfxEnabled;
    this._savePrefs();
    if (this._sGain) this._sGain.gain.setValueAtTime(
      this.prefs.sfxEnabled ? this.prefs.sfxVolume : 0, this._ctx.currentTime);
    this._updateUI();
    return this.prefs.sfxEnabled;
  }

  setMusicVolume(v) {
    this.prefs.musicVolume = Math.max(0, Math.min(1, v)); this._savePrefs();
    if (this._mGain && this.prefs.musicEnabled)
      this._mGain.gain.setValueAtTime(this.prefs.musicVolume, this._ctx.currentTime);
  }

  setSFXVolume(v) {
    this.prefs.sfxVolume = Math.max(0, Math.min(1, v)); this._savePrefs();
    if (this._sGain && this.prefs.sfxEnabled)
      this._sGain.gain.setValueAtTime(this.prefs.sfxVolume, this._ctx.currentTime);
  }

  /* ---- Toggle UI Widget ---- */
  mountToggleUI(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;
    this._uiEl = el;
    const bs = 'background:none;border:1px solid rgba(0,255,136,0.4);color:#0f8;'
      + 'padding:6px 14px;border-radius:4px;cursor:pointer;font-family:monospace;font-size:13px;';
    el.innerHTML = '<div style="display:flex;gap:12px;align-items:center;">'
      + '<button id="mt-music" style="' + bs + '">Music: '
      + (this.prefs.musicEnabled ? 'ON' : 'OFF') + '</button>'
      + '<button id="mt-sfx" style="' + bs + '">SFX: '
      + (this.prefs.sfxEnabled ? 'ON' : 'OFF') + '</button></div>';
    el.querySelector('#mt-music').onclick = () => { this._ensure(); this.toggleMusic(); this.playSFX('click'); };
    el.querySelector('#mt-sfx').onclick = () => { this._ensure(); this.toggleSFX(); };
  }

  _updateUI() {
    if (!this._uiEl) return;
    const m = this._uiEl.querySelector('#mt-music');
    const s = this._uiEl.querySelector('#mt-sfx');
    if (m) {
      m.textContent = 'Music: ' + (this.prefs.musicEnabled ? 'ON' : 'OFF');
      m.style.borderColor = this.prefs.musicEnabled ? 'rgba(0,255,136,0.8)' : 'rgba(0,255,136,0.3)';
    }
    if (s) {
      s.textContent = 'SFX: ' + (this.prefs.sfxEnabled ? 'ON' : 'OFF');
      s.style.borderColor = this.prefs.sfxEnabled ? 'rgba(0,255,136,0.8)' : 'rgba(0,255,136,0.3)';
    }
  }

  destroy() {
    this.stopMusic(0);
    if (this._ctx) this._ctx.close();
    this._ready = false;
  }

  /* ---- Persistence ---- */
  _savePrefs() {
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.prefs)); } catch (e) {}
  }
  _loadPrefs() {
    try { const d = localStorage.getItem(this.STORAGE_KEY); return d ? JSON.parse(d) : {}; }
    catch (e) { return {}; }
  }
}

if (typeof module !== 'undefined' && module.exports) module.exports = AudioManager;
if (typeof window !== 'undefined') window.AudioManager = AudioManager;
