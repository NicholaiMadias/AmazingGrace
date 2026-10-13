import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('GitHub Pages deployment', () => {
  it('builds and deploys the main branch Vite output', () => {
    const workflow = fs.readFileSync('.github/workflows/deploy-pages.yml', 'utf8');
    expect(workflow).toContain('branches: [main]');
    expect(workflow).toContain('run: npm run build');
    expect(workflow).toContain('path: dist');
    expect(workflow).toContain('actions/deploy-pages@v4');
  });

  it('keeps the custom domain in the deployable public output', () => {
    expect(fs.readFileSync('CNAME', 'utf8').trim()).toBe('amazinggracehl.org');
    expect(fs.readFileSync('public/CNAME', 'utf8').trim()).toBe('amazinggracehl.org');
  });

  it('publishes pages and scripts linked from source HTML', () => {
    const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
    expect(viteConfig).toContain('resolve(__dirname, "CLI.html")');
    expect(viteConfig).toContain('library/resources/florida-lease-agreement.html');
    expect(viteConfig).toContain("resolve(__dirname, 'ministries/story-nodes.js')");
    expect(viteConfig).toContain("resolve(__dirname, 'ministry/bible-journey-data.js')");
  });
});
