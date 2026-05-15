/**
 * leySystem2.js — V2 Ley-Line Multiplier System
 * (c) 2026 NicholaiMadias — MIT License
 */

export const LEY_STATE = {
  DORMANT:  'dormant',
  ACTIVE:   'active',
  CHARGED:  'charged',
};

export const LEY_MULTIPLIER = {
  [LEY_STATE.DORMANT]:  1.0,
  [LEY_STATE.ACTIVE]:   1.5,
  [LEY_STATE.CHARGED]:  2.0,
};

const ACTIVE_THRESHOLD  =  8;
const CHARGED_THRESHOLD = 20;

export function createLeyState() {
  return { state: LEY_STATE.DORMANT, charge: 0 };
}

export function advanceLey(ley, matchCount) {
  const charge = ley.charge + matchCount;
  let state;
  if (charge >= CHARGED_THRESHOLD) {
    state = LEY_STATE.CHARGED;
  } else if (charge >= ACTIVE_THRESHOLD) {
    state = LEY_STATE.ACTIVE;
  } else {
    state = LEY_STATE.DORMANT;
  }
  return { state, charge };
}

export function getMultiplier(ley) {
  return LEY_MULTIPLIER[ley.state] ?? 1.0;
}

export function resetLey() {
  return { state: LEY_STATE.DORMANT, charge: 0 };
}
