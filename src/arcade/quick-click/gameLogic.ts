export type QuickClickTarget = {
  x: number;
  y: number;
  radius: number;
  expiresAt: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function isHit(target: QuickClickTarget, x: number, y: number): boolean {
  const dx = x - target.x;
  const dy = y - target.y;
  return dx * dx + dy * dy <= target.radius * target.radius;
}

export function nextSpawnDelayMs(rng = Math.random): number {
  // Random interval (ms) to satisfy "targets appear at random intervals".
  // Keep it snappy but not flickery.
  const min = 250;
  const max = 900;
  return Math.floor(min + (max - min) * rng());
}

export function defaultTargetLifetimeMs(): number {
  return 850;
}

