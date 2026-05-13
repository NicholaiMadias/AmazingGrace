# PR: Two Blueprints — Lore, SVG, Engine Integration
**Branch:** `feature/two-blueprints-s7`
**Base:** `main`
**Author:** Arcade Engine Team
**Date:** 2026-05-09
**Season:** 7
**Reviewers:** @lore-council @engine-leads @arcade-frontend

---

## Summary

Implements the full **Two Blueprints** feature set as specified in Lore Appendix II.
Four concrete deliverables land in this PR:

| # | File | Purpose |
|---|------|---------|
| 1 | `arcade/lore/two-blueprints/two-blueprints.html` | Lore page — The Ladder & The Break |
| 2 | `assets/diagrams/two-blueprints-diagram.svg` | Metaphysics diagram (embeddable) |
| 3 | `src/engine/match-maker.js` | Match-making engine with Ladder/Break/Hybrid logic |
| 4 | `docs/lore/appendix-ii.md` | Lore Appendix II (canonical text) |

---

## Motivation

Season 7 introduces the **Two Blueprints Protocol** — the formal co-existence of Ladder (structured ascent) and Break (singular rupture) match philosophies — including the new **Hybrid Stakes Protocol** for cross-blueprint collisions.

---

## Key Behaviors

| Behavior | Implementation |
|----------|---------------|
| Ladder pairing | +/-400 rank-score delta, same blueprint, smallest delta first |
| Break pairing | +/-2 tier spread, prefers higher-tier opponent |
| Cross-blueprint | Falls back to HybridProtocol automatically |
| Ladder outcome | Elo K=32, dampened variance |
| Break outcome | delta x 3.5 multiplier, floor-lock on loser |
| Hybrid declaration | Both must declare simultaneously |
| Decay | Ladder only; 8 pts/day after 7-day grace period |
| Cooldown | Break players: 5-match cooldown after any Break match |
| Floor-lock | Loser locked to tier floor; lifts after cooldown expires |

---

## Testing Checklist

- [ ] `LadderEngine.findMatch` — returns null when no candidates within delta
- [ ] `LadderEngine.applyDecay` — no decay within grace period
- [ ] `LadderEngine.applyDecay` — correct decay after N days
- [ ] `LadderEngine.resolveMatch` — winner score increases, loser decreases
- [ ] `LadderEngine.resolveMatch` — score never goes below RANK_FLOOR
- [ ] `BreakEngine.checkEligibility` — false for LADDER blueprint
- [ ] `BreakEngine.checkEligibility` — false when cooldown > 0
- [ ] `BreakEngine.findMatch` — respects TIER_SPREAD=2
- [ ] `BreakEngine.resolveMatch` — delta = base x STAKES_MULTIPLIER
- [ ] `BreakEngine.resolveMatch` — loser floor-locked at tier min
- [ ] `BreakEngine.progressCooldown` — decrements by 1; lifts lock at 0
- [ ] `HybridProtocol.resolveDeclaration` — both declare → BREAK
- [ ] `HybridProtocol.resolveDeclaration` — one declares → LADDER
- [ ] `HybridProtocol.resolveDeclaration` — neither declares → LADDER
- [ ] `MatchMaker.drainQueue` — pairs same-blueprint players first
- [ ] `MatchMaker.drainQueue` — falls back to HYBRID on cross-blueprint
- [ ] `MatchMaker.commitResult` — persists updated records to store
- [ ] `MatchMaker.commitResult` — Break cooldown applied to both players post-match
- [ ] `MatchMaker.getStanding` — returns correct tier name and breakEligible

---

## Migration Notes

- `match-maker.js` replaces the previous stub. The stub exported only `{ findMatch }` — update all call sites to use the new `MatchMaker` class interface.
- `RankStore` is in-memory by default. Production must provide a DB-backed adapter implementing `{ get(id), set(id, record) }`.
- Add `floorLocked: boolean` and `floorLockMin: number` columns to player schema + migration for existing rows.

---

## Lore Notes

This PR is canon as of **Season 7**. The Hybrid Stakes Protocol supersedes the Season 6 interim ruling that defaulted all cross-blueprint matches to Ladder scoring.

---
