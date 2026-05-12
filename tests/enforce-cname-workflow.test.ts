import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('enforce-cname workflow', () => {
  it('enforces amazinggracehl.org as the required CNAME value', () => {
    const src = fs.readFileSync(
      '.github/workflows/enforce-cname.yml',
      'utf8',
    );

    // Workflow must check for the correct domain.
    expect(src).toContain('amazinggracehl.org');

    // Workflow must fail when CNAME file is missing.
    expect(src).toContain('CNAME missing');

    // Workflow must validate the actual value against the expected value.
    expect(src).toContain('CNAME must be exactly');

    // Workflow must use bash for the check step.
    expect(src).toContain('shell: bash');
  });
});

