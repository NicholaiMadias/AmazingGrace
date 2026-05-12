// karmaEconomy.ts
export type KarmaAction =
  | 'helped_peer'
  | 'completed_mission'
  | 'donation'
  | 'spam'
  | 'exploit';

export interface KarmaRule {
  readonly action: KarmaAction;
  readonly karmaDelta: number;
  readonly communityDelta: number;
  readonly rewardStars?: number;
  readonly rewardTokens?: number;
}

export const KARMA_RULES: ReadonlyArray<KarmaRule> = [
  { action: 'helped_peer',       karmaDelta: 5,   communityDelta: 8,   rewardStars: 0, rewardTokens: 5  },
  { action: 'completed_mission', karmaDelta: 10,  communityDelta: 4,   rewardStars: 1, rewardTokens: 10 },
  { action: 'donation',          karmaDelta: 15,  communityDelta: 10,  rewardStars: 1, rewardTokens: 20 },
  { action: 'spam',              karmaDelta: -20, communityDelta: -15 },
  { action: 'exploit',           karmaDelta: -40, communityDelta: -30 }
] as const satisfies ReadonlyArray<KarmaRule>;

export function resolveKarmaAction(action: KarmaAction): KarmaRule {
  const rule = KARMA_RULES.find(r => r.action === action);
  if (!rule) throw new Error(`Unknown karma action: ${action}`);
  return rule;
}
