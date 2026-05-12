import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('electra workflow', () => {
  const src = fs.readFileSync('.github/workflows/electra.yml', 'utf8');

  it('skips draft pull requests for PR review and auto-merge steps', () => {
    expect(src).toContain("if: github.event_name == 'pull_request' && !github.event.pull_request.draft");
  });

  it('guards auto-merge against ineligible PR states before merge API call', () => {
    expect(src).toContain('if (fresh.draft)');
    expect(src).toContain('if (fresh.state !== "open" || fresh.merged)');
    expect(src).toContain('if (fresh.mergeable !== true)');
  });

  it('handles merge API ineligible responses without failing the job', () => {
    expect(src).toContain('if ([403, 405, 409, 422].includes(status) || /draft|mergeable|conflict|not open|closed/i.test(message)) {');
    expect(src).toContain('Skipping auto-merge for PR');
  });
});
