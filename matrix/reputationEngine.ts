// reputationEngine.ts
import type { ReputationVector } from './types';

export type ReputationEventType =
  | 'karma'
  | 'community'
  | 'wisdom'
  | 'integrity';

export interface ReputationEvent {
  type: ReputationEventType;
  value: number; // positive or negative
  ts?: number;
  source?: string;
}

const CLAMP_MIN = -1000;
const CLAMP_MAX = 1000;

const CREDIT_SCORE_WEIGHTS = {
  integrity: 0.4,
  karma: 0.3,
  wisdom: 0.3
} as const;

const TRUST_SCORE_WEIGHTS = {
  community: 0.5,
  integrity: 0.3,
  karma: 0.2
} as const;

export function applyReputationEvent(
  rep: ReputationVector,
  event: ReputationEvent
): ReputationVector {
  const next = { ...rep };

  switch (event.type) {
    case 'karma':
      next.karma += event.value;
      break;
    case 'community':
      next.community += event.value;
      break;
    case 'wisdom':
      next.wisdom += event.value;
      break;
    case 'integrity':
      next.integrity += event.value;
      break;
    default:
      throw new Error(`Unknown reputation event type: ${String(event.type)}`);
  }

  // Clamp base dimensions
  (['karma', 'community', 'wisdom', 'integrity'] as const).forEach(k => {
    next[k] = Math.max(CLAMP_MIN, Math.min(CLAMP_MAX, next[k]));
  });

  // Derive credit & trust
  next.creditScore = Math.round(
    CREDIT_SCORE_WEIGHTS.integrity * normalize(next.integrity) +
    CREDIT_SCORE_WEIGHTS.karma     * normalize(next.karma) +
    CREDIT_SCORE_WEIGHTS.wisdom    * normalize(next.wisdom)
  );

  next.trustScore = Math.round(
    TRUST_SCORE_WEIGHTS.community  * normalize(next.community) +
    TRUST_SCORE_WEIGHTS.integrity  * normalize(next.integrity) +
    TRUST_SCORE_WEIGHTS.karma      * normalize(next.karma)
  );

  return next;
}

function normalize(v: number): number {
  // Map [CLAMP_MIN, CLAMP_MAX] → [0, 100]
  return ((v - CLAMP_MIN) / (CLAMP_MAX - CLAMP_MIN)) * 100;
}
