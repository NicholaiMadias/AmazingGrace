export const STATE_KEY = 'matchMakerState';

export const PROGRESSION_THRESHOLDS = {
  resonanceUnlock: 7,
  loopMax: 3,
};

export const ALIGNMENT_STATES = ['neutral', 'ladder', 'break'];

export function createEngineStatus() {
  return {
    ready: true,
    mode: 'atlas-linked',
    virtues: [
      'Vision',
      'Courage',
      'Serenity',
      'Autonomy',
      'Sustenance',
      'Patience',
      'Humility',
    ],
    lore: {
      resonanceUnlock: PROGRESSION_THRESHOLDS.resonanceUnlock,
      loopMax: PROGRESSION_THRESHOLDS.loopMax,
      alignmentStates: ALIGNMENT_STATES.slice(),
    },
  };
}

export function createInitialState() {
  return {
    resonanceStability: 0,
    loopPressure: 0,
    alignment: 'neutral',
  };
}

export function applyPatternOutcome(state, pattern) {
  const next = { ...createInitialState(), ...(state && typeof state === 'object' ? state : {}) };

  if (pattern?.type === 'ladder') {
    next.loopPressure += 1;
    next.resonanceStability = Math.max(0, next.resonanceStability - 1);
  } else if (pattern?.type === 'break') {
    next.resonanceStability += 1;
    next.loopPressure = Math.max(0, next.loopPressure - 1);
  }

  if (
    next.resonanceStability >= PROGRESSION_THRESHOLDS.resonanceUnlock &&
    next.loopPressure <= PROGRESSION_THRESHOLDS.loopMax
  ) {
    next.alignment = 'break';
  } else if (next.loopPressure > PROGRESSION_THRESHOLDS.loopMax + 2) {
    next.alignment = 'ladder';
  } else {
    next.alignment = 'neutral';
  }

  return next;
}

export function loadState(callback) {
  const storage = globalThis.chrome?.storage?.local;
  if (!storage) {
    callback(createInitialState());
    return;
  }

  storage.get([STATE_KEY], (result) => {
    const raw = result?.[STATE_KEY];
    if (!raw || typeof raw !== 'object') {
      callback(createInitialState());
      return;
    }

    callback({
      resonanceStability: Number(raw.resonanceStability) || 0,
      loopPressure: Number(raw.loopPressure) || 0,
      alignment: ALIGNMENT_STATES.includes(raw.alignment)
        ? raw.alignment
        : 'neutral',
    });
  });
}

export function saveState(state) {
  const storage = globalThis.chrome?.storage?.local;
  if (!storage) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    storage.set({ [STATE_KEY]: {
      resonanceStability: Number(state?.resonanceStability) || 0,
      loopPressure: Number(state?.loopPressure) || 0,
      alignment: ALIGNMENT_STATES.includes(state?.alignment)
        ? state.alignment
        : 'neutral',
    } }, () => resolve());
  });
}
