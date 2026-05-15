/**
 * narrativeBridge2.js — V2 Narrative Beat System
 * Defines 8 beat types and the NarrativeBridge2 class that emits them.
 * (c) 2026 NicholaiMadias — MIT License
 */

export const BEAT_TYPE = {
  MATCH:           'match',
  CASCADE:         'cascade',
  SPECIAL_SPAWN:   'special_spawn',
  SPECIAL_TRIGGER: 'special_trigger',
  LEVEL_UP:        'level_up',
  BOARD_CLEAR:     'board_clear',
  OMEN:            'omen',
  FORGE_MOMENT:    'forge_moment',
};

const ALL_BEAT_TYPES = new Set(Object.values(BEAT_TYPE));

function capitalise(str) {
  return str ? str[0].toUpperCase() + str.slice(1) : '';
}

const BEAT_MESSAGES = {
  [BEAT_TYPE.MATCH]:           ctx => `${capitalise(ctx.element || 'Gem')} match — +${ctx.score || 0}`,
  [BEAT_TYPE.CASCADE]:         ctx => `Chain ×${ctx.chain} — +${ctx.score || 0}`,
  [BEAT_TYPE.SPECIAL_SPAWN]:   ctx => `${capitalise(ctx.special || '')} tile forged!`,
  [BEAT_TYPE.SPECIAL_TRIGGER]: ctx => `${capitalise(ctx.special || '')} unleashed!`,
  [BEAT_TYPE.LEVEL_UP]:        ctx => `Level ${ctx.level} reached — the lattice expands.`,
  [BEAT_TYPE.BOARD_CLEAR]:     ()  => 'Board clear — +5 to all conscience stats!',
  [BEAT_TYPE.OMEN]:            ctx => `✦ ${ctx.title || 'Omen unlocked'}`,
  [BEAT_TYPE.FORGE_MOMENT]:    ctx => `Integrity milestone: "${ctx.fragment || ''}"`,
};

function deepFreeze(obj) {
  Object.getOwnPropertyNames(obj).forEach(name => {
    const value = obj[name];
    if (value && typeof value === 'object') deepFreeze(value);
  });
  return Object.freeze(obj);
}

/**
 * Creates a deeply immutable beat object.
 */
export function createBeat(type, ctx = {}) {
  if (!ALL_BEAT_TYPES.has(type)) {
    throw new Error(`Unknown beat type: "${type}"`);
  }
  const frozenCtx = deepFreeze(Object.assign({}, ctx));
  const message = BEAT_MESSAGES[type](frozenCtx);
  return Object.freeze({ type, message, ctx: frozenCtx, timestamp: Date.now() });
}

/**
 * NarrativeBridge2 — emits narrative beats and maintains a history.
 */
export class NarrativeBridge2 {
  constructor(onBeat) {
    this._onBeat  = typeof onBeat === 'function' ? onBeat : () => {};
    this._history = [];
  }

  emit(type, ctx = {}) {
    const beat = createBeat(type, ctx);
    this._history.push(beat);
    this._onBeat(beat);
    return beat;
  }

  getHistory() {
    return [...this._history];
  }

  clearHistory() {
    this._history = [];
  }
}
