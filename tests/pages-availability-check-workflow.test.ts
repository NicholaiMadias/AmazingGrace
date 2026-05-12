import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('pages availability check workflow', () => {
  it('is not present in the workflow directory', () => {
    expect(
      fs.existsSync('.github/workflows/pages-availability-check.yml'),
    ).toBe(false);
  });
});
