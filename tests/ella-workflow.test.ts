import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('ella workflow', () => {
  const src = fs.readFileSync('.github/workflows/ella.yml', 'utf8');

  it('triggers on pull_request_review submitted events', () => {
    expect(src).toContain('pull_request_review');
    expect(src).toContain('submitted');
  });

  it('has write permissions for contents and pull-requests', () => {
    expect(src).toContain('contents: write');
    expect(src).toContain('pull-requests: write');
  });

  it('restricts to same-repo PRs to protect the write token', () => {
    expect(src).toContain('github.repository');
  });

  it('skips draft pull requests', () => {
    expect(src).toContain('pull_request.draft');
  });

  it('fetches review comments and looks for suggestion blocks', () => {
    expect(src).toContain('listReviewComments');
    expect(src).toContain('suggestion');
  });

  it('applies suggestions and pushes a commit', () => {
    expect(src).toContain('git commit');
    expect(src).toContain('git push');
  });

  it('posts a summary comment with the Ella marker', () => {
    expect(src).toContain('ella-auto-apply');
    expect(src).toContain('Ella — Auto-Applied Suggestions');
  });

  it('uses a concurrency group to serialise per-PR runs', () => {
    expect(src).toContain('concurrency');
    expect(src).toContain('ella-apply-');
  });
});
