/**
 * match-maker.js
 * Arcade Match-Making Engine — Season 7
 *
 * Integrates Ladder and System Break philosophies via the
 * Two-Blueprints Protocol (Appendix II, Lore Codex).
 *
 * Architecture:
 *   MatchMaker          — entry point; routes to Ladder or Break logic
 *   LadderEngine        — rank-symmetric pairing, weighted permanence
 *   BreakEngine         — amplified-stakes pairing, singular rupture
 *   HybridProtocol      — cross-philosophy collision resolution
 *   RankStore           — shared rank state (injectable for testing)
 */

'use strict';

const BLUEPRINT = Object.freeze({ LADDER: 'LADDER', BREAK: 'BREAK' });

const LADDER_TIERS = Object.freeze([
  { name: 'ENTRY',   min: 0,    max: 799  },
  { name: 'BRONZE',  min: 800,  max: 1399 },
  { name: 'SILVER',  min: 1400, max: 1999 },
  { name: 'GOLD',    min: 2000, max: 2599 },
  { name: 'DIAMOND', min: 2600, max: 3199 },
  { name: 'APEX',    min: 3200, max: Infinity },
]);

const LADDER_CONFIG = Object.freeze({
  MAX_PAIR_DELTA:   400,
  K_FACTOR:         32,
  DECAY_RATE_DAY:   8,
  DECAY_GRACE_DAYS: 7,
  RANK_FLOOR:       0,
});

const BREAK_CONFIG = Object.freeze({
  STAKES_MULTIPLIER: 3.5,
  TIER_SPREAD:       2,
  FLOOR_LOCK_TIER:   'BRONZE',
  BREAK_COOLDOWN:    5,
});

const HYBRID_CONFIG = Object.freeze({
  DECLARATION_WINDOW_S:   30,
  REQUIRES_SIMULTANEOUS:  true,
});

// ---- Utilities ----

function getTier(score) {
  return LADDER_TIERS.find(t => score >= t.min && score <= t.max) ?? LADDER_TIERS[0];
}

function getTierIndex(score) {
  return LADDER_TIERS.findIndex(t => score >= t.min && score <= t.max);
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function eloExpected(scoreA, scoreB) {
  return 1 / (1 + Math.pow(10, (scoreB - scoreA) / 400));
}

// ---- RankStore ----

class RankStore {
  constructor(initialData = new Map()) {
    this._data = initialData;
  }
  get(playerId) { return this._data.get(playerId); }
  set(playerId, record) { this._data.set(playerId, record); }

  static createPlayer(id, blueprint = BLUEPRINT.LADDER) {
    return {
      id,
      score:         LADDER_TIERS[0].min,
      blueprint,
      matchesPlayed: 0,
      breakCooldown: 0,
      floorLocked:   false,
      floorLockMin:  0,
      lastActive:    new Date(),
      history:       [],
    };
  }
}

// ---- LadderEngine ----

class LadderEngine {
  constructor(store) { this.store = store; }

  applyDecay(player, now = new Date()) {
    const daysSinceActive = (now - player.lastActive) / 86_400_000;
    if (daysSinceActive <= LADDER_CONFIG.DECAY_GRACE_DAYS) return player;
    const decayDays  = Math.floor(daysSinceActive - LADDER_CONFIG.DECAY_GRACE_DAYS);
    const decayTotal = decayDays * LADDER_CONFIG.DECAY_RATE_DAY;
    const newScore   = Math.max(player.score - decayTotal, LADDER_CONFIG.RANK_FLOOR);
    return { ...player, score: newScore };
  }

  findMatch(seeker, pool, opts = {}) {
    const maxDelta = opts.widenedDelta ?? LADDER_CONFIG.MAX_PAIR_DELTA;
    const candidates = pool
    const now = new Date();
    const updatedWinner = {
      ...winner,
      score:         Math.max(winner.score + delta, LADDER_CONFIG.RANK_FLOOR),
      matchesPlayed: winner.matchesPlayed + 1,
      lastActive:    now,
      history: [...winner.history, { matchId, delta: +delta, result: 'WIN', blueprint: BLUEPRINT.LADDER, ts: now }],
    };
    const updatedLoser = {
      ...loser,
      score:         Math.max(loser.score - delta, LADDER_CONFIG.RANK_FLOOR),
      matchesPlayed: loser.matchesPlayed + 1,
      lastActive:    now,
      history: [...loser.history, { matchId, delta: -delta, result: 'LOSS', blueprint: BLUEPRINT.LADDER, ts: now }],
    };
    return { winner: updatedWinner, loser: updatedLoser, delta };
  }

  commit(winner, loser) {
    this.store.set(winner.id, winner);
    this.store.set(loser.id, loser);
  }
}

// ---- BreakEngine ----

class BreakEngine {
  constructor(store) { this.store = store; }

  checkEligibility(player) {
    if (player.blueprint !== BLUEPRINT.BREAK)
      return { eligible: false, reason: 'Player is registered as a Climber (Ladder blueprint).' };
    if (player.breakCooldown > 0)
      return { eligible: false, reason: `Break on cooldown — ${player.breakCooldown} match(es) remaining.` };
    return { eligible: true };
  }

  findMatch(seeker, pool) {
    const seekerTierIdx = getTierIndex(seeker.score);
    const candidates = pool
      .filter(p => p.id !== seeker.id && Math.abs(getTierIndex(p.score) - seekerTierIdx) <= BREAK_CONFIG.TIER_SPREAD)
      .sort((a, b) => (getTierIndex(b.score) - seekerTierIdx) - (getTierIndex(a.score) - seekerTierIdx));
    return candidates[0] ?? null;
  }

  resolveMatch(winner, loser, matchId) {
    const expected       = eloExpected(winner.score, loser.score);
    const baseDelta      = Math.round(LADDER_CONFIG.K_FACTOR * (1 - expected));
    const amplifiedDelta = Math.round(baseDelta * BREAK_CONFIG.STAKES_MULTIPLIER);
    const now            = new Date();
    const loserTier      = getTier(loser.score);
    const floorLockMin   = loserTier.min;

    const updatedWinner = {
      ...winner,
      score:         winner.score + amplifiedDelta,
      matchesPlayed: winner.matchesPlayed + 1,
      breakCooldown: BREAK_CONFIG.BREAK_COOLDOWN,
      lastActive:    now,
      history: [...winner.history, { matchId, delta: +amplifiedDelta, result: 'WIN', blueprint: BLUEPRINT.BREAK, ts: now }],
    };
    const updatedLoser = {
      ...loser,
      score:         Math.max(loser.score - amplifiedDelta, floorLockMin),
      matchesPlayed: loser.matchesPlayed + 1,
      breakCooldown: BREAK_CONFIG.BREAK_COOLDOWN,
      floorLocked:   true,
      floorLockMin,
      lastActive:    now,
      history: [...loser.history, { matchId, delta: -amplifiedDelta, result: 'LOSS', blueprint: BLUEPRINT.BREAK, ts: now }],
    };
    return { winner: updatedWinner, loser: updatedLoser, delta: baseDelta, amplifiedDelta };
  }

  progressCooldown(player) {
    if (player.breakCooldown <= 0) return player;
    const newCooldown = player.breakCooldown - 1;
    return { ...player, breakCooldown: newCooldown, floorLocked: newCooldown > 0 ? player.floorLocked : false, floorLockMin: newCooldown > 0 ? player.floorLockMin : 0 };
  }

  commit(winner, loser) {
    this.store.set(winner.id, winner);
    this.store.set(loser.id, loser);
  }
}

// ---- HybridProtocol ----
// Resolves matches where blueprints collide (Climber vs Shatterer).
// If BOTH declare Break before final round -> Break multiplier applies.
// Otherwise Ladder scoring stands.

class HybridProtocol {
  constructor(ladderEngine, breakEngine) {
    this.ladder = ladderEngine;
    this.break  = breakEngine;
  }

  resolveDeclaration(playerADeclared, playerBDeclared) {
    return (playerADeclared && playerBDeclared) ? BLUEPRINT.BREAK : BLUEPRINT.LADDER;
  }

  resolveMatch(winner, loser, matchId, winnerDeclaredBreak, loserDeclaredBreak) {
    const scoringMode = this.resolveDeclaration(winnerDeclaredBreak, loserDeclaredBreak);
    const breakActivated = scoringMode === BLUEPRINT.BREAK;
    if (breakActivated) {
      const result = this.break.resolveMatch(winner, loser, matchId);
      return { ...result, scoringMode, breakActivated };
    } else {
      const result = this.ladder.resolveMatch(winner, loser, matchId);
      return { ...result, scoringMode, amplifiedDelta: null, breakActivated };
    }
// ---- MatchMaker ----
// Top-level orchestrator. Routes to Ladder, Break, or Hybrid.

class MatchMaker {
  constructor(store) {
    this.store   = store;
    this.ladder  = new LadderEngine(store);
    this.break_  = new BreakEngine(store);
    this.hybrid  = new HybridProtocol(this.ladder, this.break_);
    this._queue   = [];
    this._pending = new Map();
  }

  enqueue(playerId) {
    const record = this.store.get(playerId);
    if (!record) throw new Error(`Player ${playerId} not found in RankStore.`);
    if (record.blueprint === BLUEPRINT.LADDER) {
      const decayed = this.ladder.applyDecay(record);
      this.store.set(playerId, decayed);
    }
    if (!this._queue.includes(playerId)) this._queue.push(playerId);
  }

  dequeue(playerId) {
    this._queue = this._queue.filter(id => id !== playerId);
  }

  drainQueue() {
    const pairings  = [];
    const unmatched = [...this._queue];
    const matched   = new Set();

    for (const seekerId of unmatched) {
      if (matched.has(seekerId)) continue;
      const seeker = this.store.get(seekerId);
      if (!seeker) continue;

      const pool = unmatched
        .filter(id => !matched.has(id) && id !== seekerId)
        .map(id => this.store.get(id))
        .filter(Boolean);

      let opponent = null;
      let mode;

      if (seeker.blueprint === BLUEPRINT.LADDER) {
        opponent = this.ladder.findMatch(seeker, pool);
        mode     = BLUEPRINT.LADDER;
      } else {
        opponent = this.break_.findMatch(seeker, pool);
        mode     = BLUEPRINT.BREAK;
      }

      if (!opponent) {
        opponent = pool[0] ?? null;
        if (opponent) mode = 'HYBRID';
      }

      if (opponent) {
        const matchId = `match-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        pairings.push({ matchId, playerA: seekerId, playerB: opponent.id, mode });
        this._pending.set(matchId, { matchId, playerAId: seekerId, playerBId: opponent.id, mode, startedAt: new Date() });
        matched.add(seekerId);
        matched.add(opponent.id);
      }
    }

    this._queue = unmatched.filter(id => !matched.has(id));
    return pairings;
  }

  commitResult({ matchId, winnerId, loserId, winnerDeclaredBreak = false, loserDeclaredBreak = false }) {
    const pending = this._pending.get(matchId);
    if (!pending) throw new Error(`No pending match with id ${matchId}.`);

    const winner = this.store.get(winnerId);
    const loser  = this.store.get(loserId);
    if (!winner) throw new Error(`Winner ${winnerId} not found.`);
    if (!loser)  throw new Error(`Loser ${loserId} not found.`);

    let result;
    if (pending.mode === 'HYBRID' || winnerDeclaredBreak || loserDeclaredBreak) {
      result = this.hybrid.resolveMatch(winner, loser, matchId, winnerDeclaredBreak, loserDeclaredBreak);
    } else if (pending.mode === BLUEPRINT.BREAK) {
      const raw = this.break_.resolveMatch(winner, loser, matchId);
      result = { ...raw, scoringMode: BLUEPRINT.BREAK, breakActivated: true };
    } else {
      const raw = this.ladder.resolveMatch(winner, loser, matchId);
      result = { ...raw, scoringMode: BLUEPRINT.LADDER, amplifiedDelta: null, breakActivated: false };
    }

    this.store.set(result.winner.id, result.winner);
    this.store.set(result.loser.id, result.loser);
    this.store.set(result.winner.id, this.break_.progressCooldown(result.winner));
    this.store.set(result.loser.id,  this.break_.progressCooldown(result.loser));
    this._pending.delete(matchId);

    return {
      matchId,
      scoringMode:    result.scoringMode,
      delta:          result.delta,
      amplifiedDelta: result.amplifiedDelta ?? null,
      breakActivated: result.breakActivated,
      winner:         this.store.get(result.winner.id),
      loser:          this.store.get(result.loser.id),
    };
  }

  getStanding(playerId) {
    const record = this.store.get(playerId);
    if (!record) return null;
    const eligibility = this.break_.checkEligibility(record);
    return {
      id:            record.id,
      score:         record.score,
      tier:          getTier(record.score).name,
      blueprint:     record.blueprint,
      breakEligible: eligibility.eligible,
      floorLocked:   record.floorLocked,
      matchesPlayed: record.matchesPlayed,
    };
  }
}

// ---- Exports ----

module.exports = {
  MatchMaker,
  LadderEngine,
  BreakEngine,
  HybridProtocol,
  RankStore,
  BLUEPRINT,
  LADDER_TIERS,
  LADDER_CONFIG,
  BREAK_CONFIG,
  HYBRID_CONFIG,
  getTier,
  getTierIndex,
  eloExpected,
};

  }

  commit(winner, loser, scoringMode) {
    if (scoringMode === BLUEPRINT.BREAK) {
      this.break.commit(winner, loser);
    } else {
      this.ladder.commit(winner, loser);
    }
  }
}
      .filter(p =>
        p.id !== seeker.id &&
        p.blueprint === BLUEPRINT.LADDER &&
        Math.abs(p.score - seeker.score) <= maxDelta
      )
      .sort((a, b) =>
        Math.abs(a.score - seeker.score) - Math.abs(b.score - seeker.score)
      );
    return candidates[0] ?? null;
  }

  resolveMatch(winner, loser, matchId) {
    const expected = eloExpected(winner.score, loser.score);
    const delta = Math.round(LADDER_CONFIG.K_FACTOR * (1 - expected));
