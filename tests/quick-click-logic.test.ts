import { describe, expect, it } from 'vitest';
import { assertPathSegment } from '../src/firebase/path';
import {
  clamp,
  defaultTargetLifetimeMs,
  isHit,
  nextSpawnDelayMs,
} from '../src/arcade/quick-click/gameLogic';

describe('Quick Click game logic', () => {
  it('clamps values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(100, 0, 10)).toBe(10);
  });

  it('detects hits inside target radius', () => {
    const target = { x: 10, y: 10, radius: 5, expiresAt: 0 };
    expect(isHit(target, 10, 10)).toBe(true);
    expect(isHit(target, 15, 10)).toBe(true); // boundary
    expect(isHit(target, 16, 10)).toBe(false);
  });

  it('uses randomized spawn delays within bounds', () => {
    expect(nextSpawnDelayMs(() => 0)).toBe(250);
    expect(nextSpawnDelayMs(() => 1)).toBe(900);
  });

  it('uses a stable target lifetime', () => {
    expect(defaultTargetLifetimeMs()).toBe(850);
  });
});

describe('Firestore strict path segments', () => {
  it('accepts valid segments and rejects slashes', () => {
    expect(() => assertPathSegment('appId', 'arcade')).not.toThrow();
    expect(() => assertPathSegment('appId', 'a/b')).toThrow(/must not include/);
    expect(() => assertPathSegment('appId', '')).toThrow(/non-empty/);
  });
});

