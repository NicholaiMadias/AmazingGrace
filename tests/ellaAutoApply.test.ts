import { describe, expect, test } from 'vitest';
import {
  assertPatchPathsAllowed,
  extractPatchBlocks,
  listTouchedPathsFromPatch,
  wantsAutoApply,
} from '../scripts/ella-auto-apply-review.js';

describe('ella auto-apply helpers', () => {
  test('wantsAutoApply detects marker', () => {
    expect(wantsAutoApply('<!-- ella:apply -->')).toBe(true);
    expect(wantsAutoApply('<!-- ELLA:APPLY -->')).toBe(true);
    expect(wantsAutoApply('no marker')).toBe(false);
  });

  test('extractPatchBlocks returns diff fences', () => {
    const body = [
      'Text',
      '<!-- ella:apply -->',
      '```diff',
      'diff --git a/foo.txt b/foo.txt',
      'index 1111111..2222222 100644',
      '--- a/foo.txt',
      '+++ b/foo.txt',
      '@@',
      '-old',
      '+new',
      '```',
    ].join('\n');

    const blocks = extractPatchBlocks(body);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toContain('diff --git a/foo.txt b/foo.txt');
  });

  test('listTouchedPathsFromPatch extracts b/ paths', () => {
    const patch = [
      'diff --git a/src/a.js b/src/a.js',
      '--- a/src/a.js',
      '+++ b/src/a.js',
      '@@',
      '-a',
      '+b',
      'diff --git a/README.md b/README.md',
      '--- a/README.md',
      '+++ b/README.md',
    ].join('\n');

    expect(listTouchedPathsFromPatch(patch)).toEqual(['README.md', 'src/a.js']);
  });

  test('assertPatchPathsAllowed rejects .github changes', () => {
    expect(() => assertPatchPathsAllowed(['.github/workflows/ci.yml'])).toThrow(/protected paths/i);
    expect(() => assertPatchPathsAllowed(['src/app.js', 'README.md'])).not.toThrow();
  });
});

