/**
 * conscienceEngine2.js — Matrix of Conscience / Seven Stars Narrative
 * Repository: NicholaiMadias/Amazing-Grace
 * Path: arcade/js/conscienceEngine2.js
 *
 * Maps match-3 gameplay into the Seven Pillars of Conscience.
 * Each pillar unlocks through element-clearing milestones.
 * Conscience deltas: empathy→karma, justice→integrity, wisdom→wisdom, growth→community
 */

/* ─── The Seven Pillars ─── */
const PILLARS = [
  {
    id: 'ephesus',
    name: 'Ephesus',
    subtitle: 'First Love',
    star: 1,
    element: 'radiant',
    delta: 'karma',
    description: 'The core empathy that protects integrity.',
    threshold: 50,
    icon: 'el-radiant',
    color: '#fbbf24',
  },
  {
    id: 'agency',
    name: 'Agency',
    subtitle: 'The Power of Choice',
    star: 2,
    element: 'aether',
    delta: 'integrity',
    description: 'The power to choose your own path in the code.',
    threshold: 120,
    icon: 'el-aether',
    color: '#c084fc',
  },
  {
    id: 'progression',
    name: 'Progression',
    subtitle: 'Growth Through Challenge',
    star: 3,
    element: 'verdant',
    delta: 'community',
    description: 'The accumulation of experience and shedding of old versions.',
    threshold: 200,
    icon: 'el-verdant',
    color: '#34d399',
  },
  {
    id: 'feedback',
    name: 'Feedback',
    subtitle: 'The Golden Ripple',
    star: 4,
    element: 'tide',
    delta: 'wisdom',
    description: 'The confirmation that validates a true connection.',
    threshold: 300,
    icon: 'el-tide',
    color: '#22d3ee',
  },
  {
    id: 'challenge',
    name: 'Challenge',
    subtitle: 'The Crucible',
    star: 5,
    element: 'forge',
    delta: 'karma',
    description: 'The trials that forge a champion\'s spirit.',
    threshold: 420,
    icon: 'el-forge',
    color: '#fb923c',
  },
  {
    id: 'social',
    name: 'Social',
    subtitle: 'The Radiant Dove',
    star: 6,
    element: 'umbra',
    delta: 'community',
    description: 'The resonance that increases the strength of all allies.',
    threshold: 560,
    icon: 'el-umbra',
    color: '#818cf8',
  },
  {
    id: 'reward',
    name: 'Reward',
    subtitle: 'Mission Accomplished',
    star: 7,
    element: 'aether',
    delta: 'wisdom',
    description: 'The state where all shields are filled and light prevails.',
    threshold: 777,
    icon: 'el-aether',
    color: '#e9d5ff',
  },
];

/* ─── Conscience Deltas ─── */
const DELTAS = {
  karma: 0,
  integrity: 0,
  wisdom: 0,
  community: 0,
};

/* ─── Storage ─── */
const STORAGE_KEY = 'nexus_conscience';

class ConscienceEngine {
  constructor() {
    this._listeners = [];
    this._load();
  }

  /* ─── State ─── */

  get pillars() { return PILLARS; }
  get deltas() { return { ...this._state.deltas }; }
  get unlockedStars() { return this._state.unlockedStars; }
  get totalCleared() { return this._state.totalCleared; }

  /** Get pillar status with unlock progress */
  getPillarStatus() {
    return PILLARS.map(p => {
      const cleared = this._state.totalCleared;
      const unlocked = cleared >= p.threshold;
      const progress = Math.min(1, cleared / p.threshold);
      return {
        ...p,
        unlocked,
        progress,
        progressPct: Math.round(progress * 100),
      };
    });
  }

  /** Get the currently active (next to unlock) pillar */
  getActivePillar() {
    const status = this.getPillarStatus();
    return status.find(p => !p.unlocked) || status[status.length - 1];
  }

  /** Get total conscience level (sum of deltas) */
  getConscienceLevel() {
    const d = this._state.deltas;
    return d.karma + d.integrity + d.wisdom + d.community;
  }

  /* ─── Match Processing ─── */

  /**
   * Process match results from the game engine.
   * Call after each match/cascade cycle.
   *
   * @param {object} matchResult - { clearedElements: {element: count}, chain, scoreDelta }
   * @returns {object|null} - Pillar unlock event or null
   */
  processMatch(matchResult) {
    const { clearedElements = {}, chain = 0, scoreDelta = 0 } = matchResult;

    // Count total elements cleared this cycle
    let cycleCleared = 0;
    for (const [element, count] of Object.entries(clearedElements)) {
      cycleCleared += count;

      // Map element to delta
      const deltaKey = this._elementToDelta(element);
      if (deltaKey) {
        this._state.deltas[deltaKey] += count;
      }
    }

    // Chain bonus to deltas
    if (chain >= 3) {
      this._state.deltas.karma += Math.floor(chain / 2);
      this._state.deltas.wisdom += 1;
    }

    this._state.totalCleared += cycleCleared;

    // Check for pillar unlocks
    const previousUnlocked = this._state.unlockedStars;
    const status = this.getPillarStatus();
    const newlyUnlocked = status.filter(p => p.unlocked);

    let unlockEvent = null;
    if (newlyUnlocked.length > previousUnlocked) {
      this._state.unlockedStars = newlyUnlocked.length;
      const justUnlocked = newlyUnlocked[newlyUnlocked.length - 1];
      unlockEvent = {
        type: 'pillarUnlocked',
        pillar: justUnlocked,
        totalStars: this._state.unlockedStars,
        message: `Star ${justUnlocked.star} Aligned — ${justUnlocked.name}: ${justUnlocked.subtitle}`,
      };
      this._emit('pillarUnlocked', unlockEvent);
    }

    this._save();
    this._emit('update', { deltas: this.deltas, totalCleared: this._state.totalCleared });

    return unlockEvent;
  }

  /* ─── Element → Delta Mapping ─── */

  _elementToDelta(element) {
    const map = {
      radiant: 'karma',
      aether: 'integrity',
      verdant: 'community',
      tide: 'wisdom',
      forge: 'karma',
      umbra: 'community',
      void: 'wisdom',
    };
    return map[element] || null;
  }

  /* ─── Events ─── */

  onUpdate(fn) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(l => l !== fn); };
  }

  _emit(event, data) {
    for (const fn of this._listeners) {
      try { fn(event, data); } catch (e) { console.error('[Conscience]', e); }
    }
  }

  /* ─── Persistence ─── */

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this._state = raw ? JSON.parse(raw) : {
        deltas: { ...DELTAS },
        unlockedStars: 0,
        totalCleared: 0,
      };
    } catch {
      this._state = { deltas: { ...DELTAS }, unlockedStars: 0, totalCleared: 0 };
    }
  }

  _save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._state));
  }

  reset() {
    this._state = { deltas: { ...DELTAS }, unlockedStars: 0, totalCleared: 0 };
    this._save();
    this._emit('reset', {});
  }
}

/* ─── Singleton ─── */
const conscience = new ConscienceEngine();

if (typeof window !== 'undefined') {
  window.NexusConscience = conscience;
}

export { ConscienceEngine, PILLARS, DELTAS };
export default conscience;
