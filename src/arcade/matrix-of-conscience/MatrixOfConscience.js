/**
 * MatrixOfConscience.js — Stat-driven visual FX controller for the Matrix of Conscience.
 *
 * Vanilla-JS equivalent of the MatrixOfConscience React component.
 * Watches karma / wisdom / integrity / community / chainLevel /
 * missionCompleted / omenUnlocked / memoryUnlocked for changes and
 * fires the corresponding DOM animations, sounds, and callbacks.
 *
 * Usage:
 *   import { createMatrixOfConscience } from './MatrixOfConscience.js';
 *
 *   const matrix = createMatrixOfConscience({
 *     onStatPulse:  (nodeId) => { ... },
 *     onComboFX:    (chainLevel) => { ... },
 *     onMissionFX:  () => { ... },
 *     onOmenFX:     (omenId) => { ... },
 *     onMemoryFX:   (memoryId) => { ... },
 *   });
 *
 *   // Later, whenever game state changes:
 *   matrix.update({ karma: 5, chainLevel: 3, missionCompleted: true });
 *
 *   // Tear down when done (removes internal state):
 *   matrix.destroy();
 */

import { playSound }         from '../../sound/NexusSoundFX.js';
import { omenFX, memoryFX }  from '../../fx/NarrativeFX.js';

/**
 * @typedef {Object} MatrixState
 * @property {number}       [karma]
 * @property {number}       [wisdom]
 * @property {number}       [integrity]
 * @property {number}       [community]
 * @property {number}       [chainLevel]
 * @property {boolean}      [missionCompleted]
 * @property {string|null}  [omenUnlocked]
 * @property {string|null}  [memoryUnlocked]
 */

/**
 * @typedef {Object} MatrixCallbacks
 * @property {(nodeId: string) => void}   [onStatPulse]
 * @property {(chainLevel: number) => void} [onComboFX]
 * @property {() => void}                 [onMissionFX]
 * @property {(omenId: string) => void}   [onOmenFX]
 * @property {(memoryId: string) => void} [onMemoryFX]
 */

/** Pulse duration for node flash (ms). */
const PULSE_MS   = 600;
/** Duration for combo-flash on the aether core (ms). */
const COMBO_MS   = 800;
/** Duration for mission-burst on all nodes (ms). */
const MISSION_MS = 900;

/**
 * Create a Matrix of Conscience FX controller.
 *
 * @param {MatrixCallbacks & MatrixState} [options]
 * @returns {{ update: (state: MatrixState) => void, destroy: () => void }}
 */
export function createMatrixOfConscience(options = {}) {
  const {
    onStatPulse  = () => {},
    onComboFX    = () => {},
    onMissionFX  = () => {},
    onOmenFX     = () => {},
    onMemoryFX   = () => {},
    ...initialState
  } = options;

  let _destroyed = false;

  /** @type {Required<MatrixState>} */
  let prev = {
    karma:            initialState.karma            ?? 0,
    wisdom:           initialState.wisdom           ?? 0,
    integrity:        initialState.integrity        ?? 0,
    community:        initialState.community        ?? 0,
    chainLevel:       initialState.chainLevel       ?? 0,
    missionCompleted: initialState.missionCompleted ?? false,
    omenUnlocked:     initialState.omenUnlocked     ?? null,
    memoryUnlocked:   initialState.memoryUnlocked   ?? null
  };

  /* ---- Helpers ---- */

  function _pulseNode(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.classList.add('mc-pulse');
    setTimeout(() => el.classList.remove('mc-pulse'), PULSE_MS);
  }

  /* ---- Stat pulse ---- */

  function _checkStats(next) {
    /** @type {Array<[string, string]>} [statKey, domId] */
    const STAT_NODES = [
      ['karma',     'val-karma'],
      ['wisdom',    'val-wisdom'],
      ['integrity', 'val-integrity'],
      ['community', 'val-community']
    ];

    STAT_NODES.forEach(([key, nodeId]) => {
      if ((next[key] ?? prev[key]) > prev[key]) {
        _pulseNode(nodeId);
        playSound('statPulse');
        onStatPulse(nodeId);
      }
    });
  }

  /* ---- Chain combo ---- */

  function _checkCombo(next) {
    const level = next.chainLevel ?? prev.chainLevel;
    if (level <= prev.chainLevel) return;  // only fire on increases

    document.querySelectorAll('.star-tile').forEach(el => {
      el.classList.add('mc-combo-flash');
      setTimeout(() => el.classList.remove('mc-combo-flash'), COMBO_MS);
    });

    playSound('combo', level);
    onComboFX(level);
  }

  /* ---- Mission completion ---- */

  function _checkMission(next) {
    const completed = next.missionCompleted ?? prev.missionCompleted;
    if (!completed || prev.missionCompleted) return;

    document.querySelectorAll('.star-tile').forEach(n => {
      n.classList.add('mc-mission-burst');
      setTimeout(() => n.classList.remove('mc-mission-burst'), MISSION_MS);
    });

    playSound('missionComplete');
    onMissionFX();
  }

  /* ---- Omen ---- */

  function _checkOmen(next) {
    const id = next.omenUnlocked ?? prev.omenUnlocked;
    if (!id || id === prev.omenUnlocked) return;

    omenFX(id);
    playSound('omen');
    onOmenFX(id);
  }

  /* ---- Memory ---- */

  function _checkMemory(next) {
    const id = next.memoryUnlocked ?? prev.memoryUnlocked;
    if (!id || id === prev.memoryUnlocked) return;

    memoryFX(id);
    playSound('memory');
    onMemoryFX(id);
  }

  /* ---- Public API ---- */

  /**
   * Update the controller with new game state.
   * Only provide the properties that have changed; omitted keys keep their
   * previous values and will NOT trigger effects.
   *
   * @param {MatrixState} next
   */
  function update(next = {}) {
    if (_destroyed) return;
    _checkStats(next);
    _checkCombo(next);
    _checkMission(next);
    _checkOmen(next);
    _checkMemory(next);

    // Merge next into prev so subsequent calls compare correctly
    prev = { ...prev, ...next };
  }

  /** Remove internal state reference (no DOM listeners to clean up). */
  function destroy() {
    _destroyed = true;
  }

  return { update, destroy };
}
