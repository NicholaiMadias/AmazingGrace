/**
 * boss-mutations.js — Rebellion OS Boss Mutation System
 * Defines mutation types, selection logic, and application effects.
 * Requires rebellion-core.js to be loaded first.
 */

const BOSS_MUTATIONS = {
  dataOverload: {
    id: 'dataOverload',
    name: 'Data Overload',
    effect: 'Match speed increases; timer pressure rises',
    trigger: 'matchSpeed',
    lore: 'lf_corrupted_data_logs',
    cosmetic: 'aura_data_glitch'
  },
  spectralEcho: {
    id: 'spectralEcho',
    name: 'Spectral Echo',
    effect: 'Perfect alignments spawn mirror hazards',
    trigger: 'perfectAlignments',
    lore: 'lf_echo_phenomenon',
    cosmetic: 'filter_spectral_pulse'
  },
  quantumFlux: {
    id: 'quantumFlux',
    name: 'Quantum Flux',
    effect: 'Hazard dodge triggers quantum instability bursts',
    trigger: 'hazardDodges',
    lore: 'lf_quantum_instability',
    cosmetic: 'skin_quantum_flux_stream'
  },
  armorRegen: {
    id: 'armorRegen',
    name: 'Armor Regen',
    effect: 'High tower damage triggers boss armor regeneration',
    trigger: 'towerDamage',
    lore: 'lf_overseer_armor_spec',
    cosmetic: 'skin_overseer_armor_tower'
  }
};

/**
 * Select a mutation based on boss memory.
 * Returns the mutation id that best matches recorded player behavior.
 * @param {object} memory - rebellionState.bossMemory
 * @returns {string|null} mutation id or null if no match
 */
function selectMutationFromMemory(memory = {}) {
  const { matchSpeed = 0, perfectAlignments = 0, hazardDodges = 0, towerDamage = 0 } = memory;
  const scores = {
    dataOverload: matchSpeed,
    spectralEcho: perfectAlignments,
    quantumFlux: hazardDodges,
    armorRegen: towerDamage
  };
  const best = Object.entries(scores).reduce(
    (top, [id, score]) => (score > top.score ? { id, score } : top),
    { id: null, score: -1 }
  );
  return best.score > 0 ? best.id : null;
}

/**
 * Apply a mutation to the rebellion state.
 * Adds the mutation id if not already present, then persists and checks for hybrid forms.
 * @param {string} mutationId - key of BOSS_MUTATIONS
 */
function applyMutation(mutationId) {
  const state = window.rebellionState;
  if (!state || !BOSS_MUTATIONS[mutationId]) {
    return;
  }
  if (!state.bossMutations.includes(mutationId)) {
    state.bossMutations.push(mutationId);
  }
  checkMutationUpgrade();
  window.saveRebellionState && window.saveRebellionState();
  unlockMutationLore(mutationId);
  unlockMutationCosmetic(mutationId);
}

/**
 * Upgrade to hybrid/prime/cataclysmic forms if conditions are met.
 */
function checkMutationUpgrade() {
  const state = window.rebellionState;
  if (!state) return;
  const mutations = state.bossMutations;
  const baseIds = Object.keys(BOSS_MUTATIONS);
  const baseCount = baseIds.filter(id => mutations.includes(id)).length;

  if (baseCount >= 4 && !mutations.includes('cataclysmic')) {
    state.bossMutations.push('cataclysmic');
    if (typeof window.unlockLore === 'function') window.unlockLore('lf_archon_ascendant');
  } else if (baseCount >= 3 && !mutations.includes('prime') && !mutations.includes('cataclysmic')) {
    state.bossMutations.push('prime');
    if (typeof window.unlockLore === 'function') window.unlockLore('lf_overseer_evolution_protocol');
  } else if (baseCount >= 2 && !mutations.includes('hybrid') && !mutations.includes('prime') && !mutations.includes('cataclysmic')) {
    state.bossMutations.push('hybrid');
    if (typeof window.unlockLore === 'function') window.unlockLore('lf_core_fracture_analysis');
  }
}

/**
 * Unlock lore file by id (integrates with lore-archive system).
 * @param {string} loreId
 */
function unlockMutationLore(mutationId) {
  const mutation = BOSS_MUTATIONS[mutationId];
  if (!mutation) return;
  if (typeof unlockLore === 'function') {
    unlockLore(mutation.lore);
  }
}

/**
 * Unlock cosmetic reward for a mutation.
 * @param {string} mutationId
 */
function unlockMutationCosmetic(mutationId) {
  const mutation = BOSS_MUTATIONS[mutationId];
  if (!mutation) return;
  const state = window.rebellionState;
  if (!state || !state.cosmetics) return;
  state.cosmetics.owned[mutation.cosmetic] = true;
  window.saveRebellionState && window.saveRebellionState();
}
