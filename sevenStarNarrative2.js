/**
 * sevenStarNarrative2.js — V2 Omen Unlock System
 * (c) 2026 NicholaiMadias — MIT License
 */

import { LORE_FRAGMENTS } from './loreModule2.js';
import { BEAT_TYPE } from './narrativeBridge2.js';

export class SevenStarNarrative2 {
  constructor(bridge) {
    this._bridge   = bridge || null;
    this._unlocked = new Set();
    this._omens    = this._buildOmenList();
  }

  _buildOmenList() {
    return LORE_FRAGMENTS
      .filter(f => f.stat && typeof f.threshold === 'number')
      .sort((a, b) => a.threshold - b.threshold);
  }

  checkThresholds(conscience) {
    const newlyUnlocked = [];
    this._omens.forEach(fragment => {
      const { id, stat, threshold } = fragment;
      if (!this._unlocked.has(id) && (conscience[stat] || 0) >= threshold) {
        this._unlocked.add(id);
        newlyUnlocked.push(fragment);
        if (this._bridge) {
          this._bridge.emit(BEAT_TYPE.OMEN, {
            title: fragment.title,
            text:  fragment.text,
            id:    fragment.id,
          });
          if (stat === 'integrity') {
            this._bridge.emit(BEAT_TYPE.FORGE_MOMENT, { fragment: fragment.text });
          }
        }
      }
    });
    return newlyUnlocked;
  }

  getUnlocked() {
    return LORE_FRAGMENTS.filter(f => this._unlocked.has(f.id));
  }

  getUnlockedCount() {
    return this._unlocked.size;
  }

  reset() {
    this._unlocked.clear();
  }
}
