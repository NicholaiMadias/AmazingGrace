const STATE_KEY = "matchMakerState";
const ALIGNMENT_STATES = ["neutral", "ladder", "break"];

function createInitialState() {
  return {
    resonanceStability: 0,
    loopPressure: 0,
    alignment: "neutral",
  };
}

export const ATLAS_IDS = [
  "gem-electra",
  "gem-maia",
  "gem-taygete",
];

const DEFAULT_SESSION = Object.freeze({
  version: 1,
  boardSize: 7,
  credits: 0,
  launches: 0,
  lastOpenedAt: null,
  selectedAtlas: ATLAS_IDS[0],
  ...createInitialState(),
});

function getStorageArea() {
  return globalThis.chrome?.storage?.local ?? null;
}

export function createDefaultSession() {
  return { ...DEFAULT_SESSION };
}

export function normalizeSession(value) {
  const raw = value && typeof value === "object" ? value : {};
  const initialState = createInitialState();

  return {
    ...createDefaultSession(),
    ...raw,
    resonanceStability: Number(raw.resonanceStability) || initialState.resonanceStability,
    loopPressure: Number(raw.loopPressure) || initialState.loopPressure,
    alignment: ALIGNMENT_STATES.includes(raw.alignment)
      ? raw.alignment
      : initialState.alignment,
  };
}

export function markPopupOpened(session, now = new Date().toISOString()) {
  const next = normalizeSession(session);
  return {
    ...next,
    launches: Number(next.launches || 0) + 1,
    lastOpenedAt: now,
  };
}

export function cycleAtlas(session, atlasIds = ATLAS_IDS) {
  const next = normalizeSession(session);
  const currentIndex = Math.max(0, atlasIds.indexOf(next.selectedAtlas));

  return {
    ...next,
    selectedAtlas: atlasIds[(currentIndex + 1) % atlasIds.length],
  };
}

export function loadSession(callback) {
  const storageArea = getStorageArea();
  if (!storageArea) {
    callback(createDefaultSession());
    return;
  }

  storageArea.get([STATE_KEY], (result) => {
    callback(normalizeSession(result?.[STATE_KEY]));
  });
}

export function saveSession(session) {
  const storageArea = getStorageArea();
  if (!storageArea) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    storageArea.set({ [STATE_KEY]: normalizeSession(session) }, () => resolve());
  });
}
