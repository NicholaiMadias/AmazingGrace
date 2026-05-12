// karmaApply.ts
import { applyReputationEvent } from './reputationEngine';
import { resolveKarmaAction, type KarmaAction } from './karmaEconomy';
import type { ReputationVector } from './types';

export interface MatrixState {
  karma: number;
  community: number;
  wisdom: number;
  integrity: number;
}

export type MatrixStateKey = keyof MatrixState;

const MATRIX_STATE_KEYS: ReadonlySet<MatrixStateKey> = new Set([
  'karma', 'community', 'wisdom', 'integrity'
]);

export interface TelemetryEvent {
  type: MatrixStateKey;
  value: number;
  ts: number;
  source: string;
}

export interface KarmaActionResult {
  matrixState: MatrixState;
  rep: ReputationVector;
}

export function applyTelemetryEvent(
  matrixState: MatrixState,
  event: TelemetryEvent
): MatrixState {
  if (!MATRIX_STATE_KEYS.has(event.type)) {
    throw new Error(`Unknown telemetry event type: "${event.type}"`);
  }
  return { ...matrixState, [event.type]: matrixState[event.type] + event.value };
}

export function applyKarmaAction(
  matrixState: MatrixState,
  rep: ReputationVector,
  action: KarmaAction
): KarmaActionResult {
  const rule = resolveKarmaAction(action);
  const ts = Date.now();

  let nextState = matrixState;

  if (rule.karmaDelta !== 0) {
    nextState = applyTelemetryEvent(nextState, {
      type: 'karma',
      value: rule.karmaDelta,
      ts,
      source: 'karma-economy'
    });
  }

  if (rule.communityDelta !== 0) {
    nextState = applyTelemetryEvent(nextState, {
      type: 'community',
      value: rule.communityDelta,
      ts,
      source: 'karma-economy'
    });
  }

  let nextRep = rep;

  if (rule.karmaDelta !== 0) {
    nextRep = applyReputationEvent(nextRep, {
      type: 'karma',
      value: rule.karmaDelta,
      ts,
      source: 'karma-economy'
    });
  }

  if (rule.communityDelta !== 0) {
    nextRep = applyReputationEvent(nextRep, {
      type: 'community',
      value: rule.communityDelta,
      ts,
      source: 'karma-economy'
    });
  }
  return { matrixState: nextState, rep: nextRep };
}
