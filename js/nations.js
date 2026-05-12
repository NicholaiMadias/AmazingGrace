/**
 * nations.js — Sovereign Nations simulation module.
 *
 * A lightweight turn-based nation-building simulation. Nations accumulate
 * resources each turn, can enact policies, and interact with other nations
 * through diplomacy or conflict.
 *
 * Exports:
 *   createNation(name, options?)        → Nation
 *   processTurn(nation)                 → Nation   (pure, returns updated copy)
 *   enactPolicy(nation, policyId)       → Nation
 *   proposeTrade(from, to, offer)       → TradeProposal
 *   acceptTrade(from, to, proposal)     → { from: Nation, to: Nation }
 *   rejectTrade(proposal)               → TradeProposal
 *   getNationSummary(nation)            → string
 *   POLICIES                            → object (policy definitions)
 */

/* ── Nation schema ───────────────────────────────────────────────────────── */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   population: number,
 *   resources: { food: number, gold: number, faith: number, knowledge: number },
 *   policies: string[],
 *   turn: number,
 *   status: 'growing'|'stable'|'declining',
 *   history: string[],
 * }} Nation
 */

let _idCounter = 0;
function genId() {
  return 'nation_' + (++_idCounter) + '_' + Math.random().toString(36).slice(2, 7);
}

function cloneNation(n) {
  return {
    ...n,
    resources: { ...n.resources },
    policies: [...n.policies],
    history: [...n.history],
  };
}

/* ── Policy definitions ──────────────────────────────────────────────────── */

/**
 * Each policy defines:
 *   id       — unique key
 *   label    — display name
 *   desc     — short description
 *   effect   — (nation) => Partial<Nation['resources']>  per-turn resource modifiers
 *   cost     — one-time resource cost to enact
 */
export const POLICIES = {
  agricultureReform: {
    id: 'agricultureReform',
    label: 'Agriculture Reform',
    desc: 'Boost food production by training farmers.',
    cost: { gold: 20 },
    effect: () => ({ food: 5 }),
  },
  faithCampaign: {
    id: 'faithCampaign',
    label: 'Faith Campaign',
    desc: 'Inspire the populace with spiritual revival.',
    cost: { food: 15 },
    effect: () => ({ faith: 4, knowledge: 1 }),
  },
  scholarsGuild: {
    id: 'scholarsGuild',
    label: "Scholars' Guild",
    desc: 'Fund a guild of scholars to advance knowledge.',
    cost: { gold: 30, food: 10 },
    effect: () => ({ knowledge: 6 }),
  },
  tradeRoutes: {
    id: 'tradeRoutes',
    label: 'Trade Routes',
    desc: 'Open trade routes to increase gold income.',
    cost: { knowledge: 10 },
    effect: () => ({ gold: 7 }),
  },
  populationDrive: {
    id: 'populationDrive',
    label: 'Population Drive',
    desc: 'Encourage population growth.',
    cost: { food: 25, gold: 10 },
    effect: (n) => ({ food: -Math.floor(n.population * 0.01) }),
  },
};

/* ── Base per-turn yields ────────────────────────────────────────────────── */

const BASE_YIELDS = { food: 10, gold: 5, faith: 2, knowledge: 2 };

/* ── Public API ──────────────────────────────────────────────────────────── */

/**
 * Create a new nation.
 * @param {string} name
 * @param {{ population?: number, resources?: Partial<Nation['resources']> }} [options={}]
 * @returns {Nation}
 */
export function createNation(name, options = {}) {
  return {
    id: genId(),
    name: (name || 'Unnamed Nation').slice(0, 40),
    population: options.population ?? 100,
    resources: {
      food:      options.resources?.food      ?? 50,
      gold:      options.resources?.gold      ?? 30,
      faith:     options.resources?.faith     ?? 20,
      knowledge: options.resources?.knowledge ?? 10,
    },
    policies: [],
    turn: 0,
    status: 'stable',
    history: ['Nation founded.'],
  };
}

/**
 * Process one turn for a nation (pure — returns new nation object).
 * @param {Nation} nation
 * @returns {Nation}
 */
export function processTurn(nation) {
  const n = cloneNation(nation);
  n.turn++;

  // Collect per-turn yields
  const yields = { ...BASE_YIELDS };

  // Apply active policy effects
  for (const policyId of n.policies) {
    const policy = POLICIES[policyId];
    if (policy) {
      const delta = policy.effect(n);
      for (const [k, v] of Object.entries(delta)) {
        yields[k] = (yields[k] ?? 0) + v;
      }
    }
  }

  // Population food consumption
  const foodConsumed = Math.max(1, Math.floor(n.population * 0.05));
  yields.food = (yields.food ?? 0) - foodConsumed;

  // Apply to resources
  for (const [k, v] of Object.entries(yields)) {
    n.resources[k] = Math.max(0, (n.resources[k] ?? 0) + v);
  }

  // Population growth
  if (n.resources.food > 30) {
    n.population = Math.floor(n.population * 1.02);
    if (n.population % 10 === 0) n.history.push(`Turn ${n.turn}: Population grew to ${n.population}.`);
  } else if (n.resources.food === 0) {
    n.population = Math.max(1, Math.floor(n.population * 0.95));
    n.history.push(`Turn ${n.turn}: Famine — population fell to ${n.population}.`);
  }

  // Update status
  const totalRes = Object.values(n.resources).reduce((a, b) => a + b, 0);
  n.status = totalRes > 200 ? 'growing' : totalRes > 50 ? 'stable' : 'declining';

  return n;
}

/**
 * Enact a policy for a nation (pure).
 * Deducts the one-time cost and adds the policy to the active list.
 * Throws if the nation cannot afford the policy or already has it.
 *
 * @param {Nation} nation
 * @param {string} policyId
 * @returns {Nation}
 */
export function enactPolicy(nation, policyId) {
  const policy = POLICIES[policyId];
  if (!policy) throw new Error(`Unknown policy: ${policyId}`);
  if (nation.policies.includes(policyId)) throw new Error(`Policy already active: ${policyId}`);

  const n = cloneNation(nation);

  // Check and deduct costs
  for (const [resource, amount] of Object.entries(policy.cost || {})) {
    if ((n.resources[resource] ?? 0) < amount) {
      throw new Error(`Insufficient ${resource} to enact "${policy.label}" (need ${amount}).`);
    }
    n.resources[resource] -= amount;
  }

  n.policies.push(policyId);
  n.history.push(`Turn ${n.turn}: Enacted policy — ${policy.label}.`);
  return n;
}

/* ── Trade system ────────────────────────────────────────────────────────── */

/**
 * @typedef {{ id: string, fromId: string, toId: string, offer: Partial<Nation['resources']>, request: Partial<Nation['resources']>, status: 'pending'|'accepted'|'rejected' }} TradeProposal
 */

let _tradeIdCounter = 0;

/**
 * Create a trade proposal from one nation to another.
 * @param {Nation} from
 * @param {Nation} to
 * @param {{ offer: Partial<Nation['resources']>, request: Partial<Nation['resources']> }} terms
 * @returns {TradeProposal}
 */
export function proposeTrade(from, to, terms) {
  if (!from || !to) throw new Error('Both nations are required.');
  return {
    id: 'trade_' + (++_tradeIdCounter),
    fromId: from.id,
    toId: to.id,
    offer:   terms.offer   || {},
    request: terms.request || {},
    status: 'pending',
  };
}

/**
 * Accept a trade proposal, transferring resources between the two nations.
 * @param {Nation} from
 * @param {Nation} to
 * @param {TradeProposal} proposal
 * @returns {{ from: Nation, to: Nation, proposal: TradeProposal }}
 */
export function acceptTrade(from, to, proposal) {
  if (proposal.status !== 'pending') throw new Error('Proposal is no longer pending.');
  if (proposal.fromId !== from.id || proposal.toId !== to.id) {
    throw new Error('Nation mismatch in trade proposal.');
  }

  const f = cloneNation(from);
  const t = cloneNation(to);

  // Transfer: from gives offer → to; to gives request → from
  for (const [res, amt] of Object.entries(proposal.offer || {})) {
    f.resources[res] = Math.max(0, (f.resources[res] ?? 0) - amt);
    t.resources[res] = (t.resources[res] ?? 0) + amt;
  }
  for (const [res, amt] of Object.entries(proposal.request || {})) {
    t.resources[res] = Math.max(0, (t.resources[res] ?? 0) - amt);
    f.resources[res] = (f.resources[res] ?? 0) + amt;
  }

  f.history.push(`Turn ${f.turn}: Trade accepted with ${t.name}.`);
  t.history.push(`Turn ${t.turn}: Trade accepted with ${f.name}.`);

  return { from: f, to: t, proposal: { ...proposal, status: 'accepted' } };
}

/**
 * Reject a trade proposal.
 * @param {TradeProposal} proposal
 * @returns {TradeProposal}
 */
export function rejectTrade(proposal) {
  return { ...proposal, status: 'rejected' };
}

/* ── Utility ─────────────────────────────────────────────────────────────── */

/**
 * Return a human-readable summary of a nation's current state.
 * @param {Nation} nation
 * @returns {string}
 */
export function getNationSummary(nation) {
  const r = nation.resources;
  return (
    `${nation.name} (Turn ${nation.turn}, ${nation.status}) — ` +
    `Pop: ${nation.population} | ` +
    `Food: ${r.food} | Gold: ${r.gold} | Faith: ${r.faith} | Knowledge: ${r.knowledge} | ` +
    `Policies: ${nation.policies.length > 0 ? nation.policies.join(', ') : 'none'}`
  );
}
