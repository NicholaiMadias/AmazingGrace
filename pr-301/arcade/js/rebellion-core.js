(function rebellionCoreBootstrap(global) {
  const STORAGE_KEY = 'rebellion_core_state_v1';
  const defaultState = {
    certifications: {
      starMatrix: 0,
      lookingGlass: 0,
      quantumShift: 0,
      syndicateSiege: 0
    },
    dailyMissions: {
      completed: 0,
      streak: 0
    },
    threat: 100,
    inventory: {
      quantumCore: 0,
      rebellionKey: 0
    },
    activeWeakpoints: {
      starMatrix: null,
      lookingGlass: null,
      quantumShift: null,
      syndicateSiege: null
    },
    bossMutations: [],
    bossMemory: {
      matchSpeed: 0,
      perfectAlignments: 0,
      hazardDodges: 0,
      towerDamage: 0,
      weakpointsClearedQuickly: false,
      preferredGame: null
    },
    bossPersonality: {
      aggression: 0,
      cunning: 0,
      cruelty: 0,
      pride: 0,
      fear: 0
    },
    bossPersonalityHistory: [],
    bossEmotion: {
      anger: 0,
      fear: 0,
      obsession: 0,
      despair: 0,
      respect: 0
    },
    bossEmotionHistory: [],
    bossRedemption: {
      light: 0,
      dark: 0
    },
    bossReincarnation: {
      level: 0,
      deaths: 0,
      lastDeath: null,
      path: null
    },
    finalChoice: null,
    cosmetics: {
      owned: {}
    }
  };

  function mergeDeep(base, incoming) {
    if (!incoming || typeof incoming !== 'object') {
      return base;
    }

    if (!base || typeof base !== 'object') {
      return incoming;
    }

    const merged = { ...base };
    for (const [key, value] of Object.entries(incoming)) {
      const baseValue = base[key];
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        baseValue &&
        typeof baseValue === 'object' &&
        !Array.isArray(baseValue)
      ) {
        merged[key] = mergeDeep(baseValue, value);
      } else {
        merged[key] = value;
      }
    }

    return merged;
  }

  function loadRebellionState() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      global.rebellionState = mergeDeep(defaultState, parsed);
    } catch (error) {
      console.warn('Failed to load rebellion state, using defaults.', error);
      global.rebellionState = { ...defaultState };
    }

    return global.rebellionState;
  }

  function saveRebellionState() {
    if (!global.rebellionState) {
      return;
    }

    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(global.rebellionState));
    } catch {
      // best-effort persistence
    }
  }

  function updateHUD() {
    const root = global.document && (
      global.document.getElementById('rebellion-hud') ||
      global.document.getElementById('syndicate-ai')
    );
    if (!root || !global.rebellionState) {
      return;
    }

    const { certifications = {}, dailyMissions = {}, threat = 100, inventory = {} } = global.rebellionState;
    const inventoryEntries = Object.entries(inventory).filter(([, amount]) => Number(amount) > 0);
    const inventorySummary = inventoryEntries.length
      ? inventoryEntries.map(([name, amount]) => `${name}: ${amount}`).join(', ')
      : 'empty';

    const rows = [
      `Threat Level: ${threat}`,
      `Daily Missions: ${dailyMissions.completed || 0} completed`,
      `Inventory: ${inventorySummary}`,
      `Stars — Matrix: ${certifications.starMatrix || 0}`,
      `Stars — Looking Glass: ${certifications.lookingGlass || 0}`,
      `Stars — Quantum Shift: ${certifications.quantumShift || 0}`,
      `Stars — Siege: ${certifications.syndicateSiege || 0}`
    ];

    root.textContent = '';
    rows.forEach((rowText) => {
      const row = global.document.createElement('div');
      row.textContent = rowText;
      root.appendChild(row);
    });
  }

  function isLoreArchiveUnlocked(state = global.rebellionState) {
    const certs = (state && state.certifications) || {};
    return (
      (certs.starMatrix || 0) >= 2 &&
      (certs.lookingGlass || 0) >= 2 &&
      (certs.quantumShift || 0) >= 2
    );
  }

  global.loadRebellionState = loadRebellionState;
  global.saveRebellionState = saveRebellionState;
  global.updateHUD = updateHUD;
  global.isLoreArchiveUnlocked = isLoreArchiveUnlocked;

  if (!global.rebellionState) {
    loadRebellionState();
  }
})(window);
