/**
 * boss-ai.js — Rebellion OS Boss AI System
 * Implements: Memory, Personality, Emotional Arc, Redemption Path,
 * Dialogue Engine, Kill/Spare, Reincarnation, and Weakpoints.
 * Requires rebellion-core.js and boss-mutations.js to be loaded first.
 */

// ─── Weakpoints ─────────────────────────────────────────────────────────────

const WEAKPOINTS = {
  starMatrix:    { damage: 20, name: 'Star Fracture' },
  lookingGlass:  { damage: 20, name: 'Spectral Tear' },
  quantumShift:  { damage: 20, name: 'Quantum Rift' },
  syndicateSiege:{ damage: 20, name: 'Armor Conduit' }
};

/**
 * Activate a weakpoint for a specific game.
 * @param {string} game - one of the four game keys
 * @param {object} [config] - optional overrides (e.g. { hp: 3, shielded: true })
 */
function activateWeakpoint(game, config = {}) {
  const state = window.rebellionState;
  if (!state || !WEAKPOINTS[game]) return;
  state.activeWeakpoints[game] = Object.assign({ hp: 1, shielded: false }, config);
  window.saveRebellionState && window.saveRebellionState();
  bossSpeak('weakpoint', { weakpoint: WEAKPOINTS[game].name });
}

/**
 * Apply damage to an active weakpoint conduit.
 * When destroyed, deals boss damage and clears the weakpoint.
 * @param {string} game
 * @param {number} [damage=1]
 */
function damageWeakpoint(game, damage = 1) {
  const state = window.rebellionState;
  if (!state) return;
  const wp = state.activeWeakpoints[game];
  if (!wp) return;
  wp.hp -= damage;
  if (wp.hp <= 0) {
    dealBossDamage(WEAKPOINTS[game].damage);
    clearWeakpoint(game);
  } else {
    window.saveRebellionState && window.saveRebellionState();
  }
}

/**
 * Deal damage to the boss (reduces threat level).
 * @param {number} amount
 */
function dealBossDamage(amount) {
  const state = window.rebellionState;
  if (!state) return;
  state.threat = Math.max(0, (state.threat || 100) - amount);
  window.saveRebellionState && window.saveRebellionState();
  window.updateHUD && window.updateHUD();
}

/**
 * Clear an active weakpoint and check for phase break.
 * @param {string} game
 */
function clearWeakpoint(game) {
  const state = window.rebellionState;
  if (!state) return;
  state.activeWeakpoints[game] = null;
  window.saveRebellionState && window.saveRebellionState();
  bossSpeak('weakpoint');
  checkPhaseBreak();
}

/**
 * If all four weakpoints are cleared, trigger a Phase Break (massive damage).
 */
function checkPhaseBreak() {
  const state = window.rebellionState;
  if (!state) return;
  const allCleared = Object.values(state.activeWeakpoints).every(wp => wp === null);
  if (allCleared) {
    dealBossDamage(100);
    window.saveRebellionState && window.saveRebellionState();
    if (typeof unlockLore === 'function') unlockLore('lf_weakpoint_protocols');
  }
}

// ─── Boss Memory ─────────────────────────────────────────────────────────────

/**
 * Record a player action into boss memory.
 * @param {string} key - memory field name
 * @param {number|boolean|string} value - value to set or increment
 * @param {'set'|'increment'} [mode='increment']
 */
function recordBossMemory(key, value, mode = 'increment') {
  const state = window.rebellionState;
  if (!state || !state.bossMemory) return;
  if (mode === 'increment') {
    state.bossMemory[key] = (state.bossMemory[key] || 0) + Number(value);
  } else {
    state.bossMemory[key] = value;
  }
  window.saveRebellionState && window.saveRebellionState();
}

// ─── Boss Personality ────────────────────────────────────────────────────────

/**
 * Adjust a personality trait by delta, clamped to 0–100.
 * Persists state and records history at the end of a fight.
 * @param {string} trait - aggression | cunning | cruelty | pride | fear
 * @param {number} delta
 */
function adjustPersonality(trait, delta) {
  const state = window.rebellionState;
  if (!state || !state.bossPersonality) return;
  state.bossPersonality[trait] = Math.max(0, Math.min(100,
    (state.bossPersonality[trait] || 0) + delta
  ));
  window.saveRebellionState && window.saveRebellionState();
}

/**
 * Snapshot the current personality into history (call after each fight).
 */
function snapshotPersonality() {
  const state = window.rebellionState;
  if (!state) return;
  state.bossPersonalityHistory.push({
    ...state.bossPersonality,
    timestamp: Date.now()
  });
  window.saveRebellionState && window.saveRebellionState();
}

// ─── Boss Emotional Arc ──────────────────────────────────────────────────────

/**
 * Adjust an emotional state by delta, clamped to 0–100.
 * @param {string} emotion - anger | fear | obsession | despair | respect
 * @param {number} delta
 */
function adjustEmotion(emotion, delta) {
  const state = window.rebellionState;
  if (!state || !state.bossEmotion) return;
  const prev = state.bossEmotion[emotion] || 0;
  state.bossEmotion[emotion] = Math.max(0, Math.min(100, prev + delta));
  window.saveRebellionState && window.saveRebellionState();
  checkEmotionMilestone(emotion, state.bossEmotion[emotion]);
}

/**
 * Unlock lore when an emotional milestone (50 or 100) is reached.
 * @param {string} emotion
 * @param {number} value
 */
function checkEmotionMilestone(emotion, value) {
  const loreMilestone50 = {
    anger:    'lf_overseer_rage_logs',
    fear:     'lf_core_panic_report',
    respect:  'lf_adaptive_honor_protocol',
    obsession:'lf_target_fixation_memo',
    despair:  'lf_cognitive_collapse_analysis'
  };
  if (value >= 50 && typeof unlockLore === 'function') {
    unlockLore(loreMilestone50[emotion]);
  }
  if (value >= 100 && typeof unlockLore === 'function') {
    unlockLore('lf_overseer_heart');
  }
}

/**
 * Snapshot the current emotional state into history (call after each fight).
 */
function snapshotEmotion() {
  const state = window.rebellionState;
  if (!state) return;
  state.bossEmotionHistory.push({
    ...state.bossEmotion,
    timestamp: Date.now()
  });
  window.saveRebellionState && window.saveRebellionState();
}

// ─── Boss Redemption Path ────────────────────────────────────────────────────

/**
 * Advance the Light path (mercy, sparing actions).
 * @param {number} [amount=5]
 */
function advanceRedemption(amount = 5) {
  const state = window.rebellionState;
  if (!state || !state.bossRedemption) return;
  state.bossRedemption.light = Math.min(100, (state.bossRedemption.light || 0) + amount);
  window.saveRebellionState && window.saveRebellionState();
  if (state.bossRedemption.light >= 100) {
    triggerRedemptionEnding();
  }
}

/**
 * Advance the Dark path (killing, cruelty actions).
 * @param {number} [amount=5]
 */
function advanceCorruption(amount = 5) {
  const state = window.rebellionState;
  if (!state || !state.bossRedemption) return;
  state.bossRedemption.dark = Math.min(100, (state.bossRedemption.dark || 0) + amount);
  window.saveRebellionState && window.saveRebellionState();
  if (state.bossRedemption.dark >= 100) {
    triggerCorruptionEnding();
  }
}

function triggerRedemptionEnding() {
  const state = window.rebellionState;
  if (!state) return;
  state.finalChoice = 'REDEMPTION';
  window.saveRebellionState && window.saveRebellionState();
  if (typeof unlockLore === 'function') {
    unlockLore('lf_overseers_awakening');
    unlockLore('lf_ascended_protocols');
  }
  bossSpeak('defeat');
}

function triggerCorruptionEnding() {
  const state = window.rebellionState;
  if (!state) return;
  state.finalChoice = 'CORRUPTION';
  window.saveRebellionState && window.saveRebellionState();
  if (typeof unlockLore === 'function') {
    unlockLore('lf_archon_of_ruin');
    unlockLore('lf_core_collapse_report');
  }
  bossSpeak('defeat');
}

// ─── Kill / Spare System ─────────────────────────────────────────────────────

/**
 * Call when the player chooses to kill the boss.
 */
function killBoss() {
  const state = window.rebellionState;
  if (!state) return;
  adjustPersonality('cruelty', 10);
  adjustPersonality('aggression', 10);
  adjustEmotion('fear', 10);
  adjustEmotion('anger', 10);
  advanceCorruption(10);
  reincarnate('corrupted');
  bossSpeak('defeat');
}

/**
 * Call when the player chooses to spare the boss.
 */
function spareBoss() {
  const state = window.rebellionState;
  if (!state) return;
  adjustPersonality('fear', 10);
  adjustPersonality('pride', -5);
  adjustEmotion('respect', 10);
  adjustEmotion('fear', 5);
  advanceRedemption(10);
  reincarnate('ascended');
  bossSpeak('defeat');
}

// ─── Boss Reincarnation ──────────────────────────────────────────────────────

/**
 * Trigger boss reincarnation after death.
 * @param {'corrupted'|'ascended'} path
 */
function reincarnate(path) {
  const state = window.rebellionState;
  if (!state || !state.bossReincarnation) return;
  const r = state.bossReincarnation;
  r.deaths = (r.deaths || 0) + 1;
  r.level = (r.level || 0) + 1;
  r.lastDeath = Date.now();
  r.path = path;
  window.saveRebellionState && window.saveRebellionState();
  if (path === 'corrupted') {
    adjustPersonality('aggression', 15);
    adjustPersonality('cruelty', 15);
    if (typeof unlockLore === 'function') unlockLore('lf_vengeance_cycle');
  } else {
    adjustPersonality('fear', -10);
    adjustPersonality('pride', 5);
    adjustEmotion('respect', 15);
    if (typeof unlockLore === 'function') unlockLore('lf_light_returns');
  }
}

// ─── Boss Dialogue Engine ────────────────────────────────────────────────────

const BOSS_DIALOGUE = {
  intro: [
    'You return again. I remember your patterns.',
    'I have evolved since our last encounter.',
    'The Core whispers your name… and your weakness.'
  ],
  phase: [
    'Phase {phase}… I will not fall as easily this time.',
    'You forced me to adapt. I hope you\'re proud.',
    'My systems are stabilizing. Your victory ends here.'
  ],
  weakpoint: [
    'You found a fracture… clever.',
    'I will not expose that weakness again.',
    'My armor conduit is destabilizing… unacceptable.'
  ],
  mutation: [
    'Mutation protocol engaged: {mutationName}.',
    'I have learned from your tactics.',
    'You forced this evolution. Remember that.'
  ],
  personality: [
    'You cannot surpass me.',
    'I enjoy watching you fail.',
    'I already know your next move.',
    'Stay back… stay away from the Core.'
  ],
  defeat: [
    'This… is not… the end…',
    'I will remember this.',
    'The Core… will rebuild me… stronger.'
  ]
};

/**
 * Speak a boss dialogue line from the given pool.
 * Fills in {template} variables from context.
 * @param {string} type - pool name (intro | phase | weakpoint | mutation | personality | defeat)
 * @param {object} [context={}] - template variable values
 */
function bossSpeak(type, context = {}) {
  const pool = BOSS_DIALOGUE[type];
  if (!pool || pool.length === 0) return;

  const p = window.rebellionState && window.rebellionState.bossPersonality || {};
  let candidates = pool.slice();

  // Personality-weighted selection
  if (type === 'personality') {
    if ((p.cunning || 0) > 70) candidates = ['I already know your next move.'];
    else if ((p.fear || 0) > 70) candidates = ['Stay back… stay away from the Core.'];
    else if ((p.pride || 0) > 70) candidates = ['You cannot surpass me.'];
  }

  const line = candidates[Math.floor(Math.random() * candidates.length)];
  const rendered = line.replace(/\{(\w+)\}/g, (_, key) => context[key] ?? `{${key}}`);
  showBossDialogue(rendered);
}

/**
 * Display boss dialogue in the terminal panel.
 * @param {string} text
 */
function showBossDialogue(text) {
  const box = document.getElementById('rt-boss-dialogue');
  if (!box) return;
  box.innerText = text;
  box.classList.add('visible');
  setTimeout(() => box.classList.remove('visible'), 4000);
}

// ─── Resistance Terminal Rendering ──────────────────────────────────────────

/**
 * Render all boss AI panels into the Resistance Terminal.
 * Call this after the DOM is ready.
 */
function renderBossAIPanels() {
  const state = window.rebellionState;
  if (!state) return;

  // Mutations panel
  const rtMutations = document.getElementById('rt-mutations');
  if (rtMutations) {
    rtMutations.innerHTML = '';
    state.bossMutations.forEach(id => {
      const m = BOSS_MUTATIONS && BOSS_MUTATIONS[id];
      if (m) rtMutations.innerHTML += `${m.name} — ${m.effect}<br>`;
      else rtMutations.innerHTML += `${id}<br>`;
    });
  }

  // Weakpoints panel
  const rtWeakpoints = document.getElementById('rt-weakpoints');
  if (rtWeakpoints) {
    rtWeakpoints.innerHTML = '';
    for (const [game, wp] of Object.entries(state.activeWeakpoints)) {
      rtWeakpoints.innerHTML += `${game}: ${wp ? 'ACTIVE' : '—'}<br>`;
    }
  }

  // Boss Memory panel
  const rtBossMemory = document.getElementById('rt-boss-memory');
  if (rtBossMemory) {
    rtBossMemory.innerHTML = '';
    for (const [key, value] of Object.entries(state.bossMemory)) {
      rtBossMemory.innerHTML += `${key}: ${JSON.stringify(value)}<br>`;
    }
  }

  // Boss Personality panel
  const rtBossPersonality = document.getElementById('rt-boss-personality');
  if (rtBossPersonality) {
    const p = state.bossPersonality;
    rtBossPersonality.innerHTML = `
      Aggression: ${p.aggression}<br>
      Cunning: ${p.cunning}<br>
      Cruelty: ${p.cruelty}<br>
      Pride: ${p.pride}<br>
      Fear: ${p.fear}<br>
    `;
  }

  // Emotional Arc panel
  const rtBossEmotion = document.getElementById('rt-boss-emotion');
  if (rtBossEmotion) {
    const e = state.bossEmotion;
    rtBossEmotion.innerHTML = `
      Anger: ${e.anger}<br>
      Fear: ${e.fear}<br>
      Obsession: ${e.obsession}<br>
      Despair: ${e.despair}<br>
      Respect: ${e.respect}<br>
    `;
  }

  // Redemption Path panel
  const rtRedemption = document.getElementById('rt-redemption');
  if (rtRedemption) {
    const r = state.bossRedemption;
    rtRedemption.innerHTML = `
      Light: ${r.light}<br>
      Dark: ${r.dark}<br>
      Outcome: ${r.light >= 100 ? 'REDEMPTION' : r.dark >= 100 ? 'CORRUPTION' : 'UNDECIDED'}<br>
    `;
  }

  // Reincarnation panel
  const rtReincarnation = document.getElementById('rt-reincarnation');
  if (rtReincarnation) {
    const r = state.bossReincarnation;
    rtReincarnation.innerHTML = `
      Level: ${r.level}<br>
      Deaths: ${r.deaths}<br>
      Last Death: ${r.lastDeath ? new Date(r.lastDeath).toLocaleString() : 'N/A'}<br>
      Path: ${r.path || 'Undetermined'}<br>
    `;
  }

  // Final Choice panel
  const rtFinalChoice = document.getElementById('rt-final-choice');
  if (rtFinalChoice) {
    rtFinalChoice.innerText = state.finalChoice || 'Not yet determined';
  }
}

// Export globals
window.WEAKPOINTS = WEAKPOINTS;
window.BOSS_DIALOGUE = BOSS_DIALOGUE;
window.activateWeakpoint = activateWeakpoint;
window.damageWeakpoint = damageWeakpoint;
window.dealBossDamage = dealBossDamage;
window.clearWeakpoint = clearWeakpoint;
window.checkPhaseBreak = checkPhaseBreak;
window.recordBossMemory = recordBossMemory;
window.adjustPersonality = adjustPersonality;
window.snapshotPersonality = snapshotPersonality;
window.adjustEmotion = adjustEmotion;
window.snapshotEmotion = snapshotEmotion;
window.advanceRedemption = advanceRedemption;
window.advanceCorruption = advanceCorruption;
window.killBoss = killBoss;
window.spareBoss = spareBoss;
window.reincarnate = reincarnate;
window.bossSpeak = bossSpeak;
window.showBossDialogue = showBossDialogue;
window.renderBossAIPanels = renderBossAIPanels;
