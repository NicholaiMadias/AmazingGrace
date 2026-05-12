import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('Node version consistency', () => {
  it('declares Node 20 support via package.json engines', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    expect(pkg.engines?.node).toBe('>=20.0.0');
  });

  it('.nvmrc specifies Node 20 for Cloudflare Pages and local dev', () => {
    const nvmrc = fs.readFileSync('.nvmrc', 'utf8').trim();
    expect(nvmrc).toBe('20');
  });

  it('pins CI/deploy workflows to Node 20', () => {
    const workflowFiles = [
      '.github/workflows/ci.yml',
      '.github/workflows/deploy.yml',
      '.github/workflows/github-pages-preview.yml',
      '.github/workflows/electra.yml',
      '.github/workflows/self-update.yml',
    ];

    for (const file of workflowFiles) {
      const src = fs.readFileSync(file, 'utf8');
      expect(src).toMatch(/node-version:\s*["']?20["']?/);
      expect(src).not.toMatch(/node-version:\s*["']?24["']?/);
    }
  });
});

