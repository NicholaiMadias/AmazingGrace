import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const portfolioPath = path.resolve(__dirname, '../arcade/portfolio-cli.html');
const html = fs.readFileSync(portfolioPath, 'utf8');

describe('portfolio CLI arcade', () => {
  it('provides the integrated portfolio destinations and profile links', () => {
    expect(html).toContain('Gemini CLI Arcade');
    expect(html).toContain('Noah &amp; Norea');
    expect(html).toContain('Professional experience');
    expect(html).toContain('Video dossiers');
    expect(html).toContain('https://github.com/nicholaimadias');
    expect(html).toContain('https://linkedin.com/in/nicholaimadias');
  });

  it('registers the standalone production page as a Vite entrypoint', () => {
    const viteConfig = fs.readFileSync(path.resolve(__dirname, '../vite.config.ts'), 'utf8');
    expect(viteConfig).toContain('arcadePortfolioCli: resolve(__dirname, "arcade/portfolio-cli.html")');
  });

  it('keeps the local CLI simulation from sending prompts to Gemini', () => {
    expect(html).toContain('This local demo does not send Gemini requests.');
    expect(html).toContain('textContent = text');
  });

  it('preserves and uses the recovered accent-pill and tab-bar styles', () => {
    expect(html).toContain('--cyan-accent: var(--cyan);');
    expect(html).toContain('color: var(--cyan-accent);');
    expect(html).toContain('gap: 6px;');
    expect(html).toContain('<nav class="nav-list tab-bar"');
    expect(html).toContain('class="tag accent-pill"');
  });
});
