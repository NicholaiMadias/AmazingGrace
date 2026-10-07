import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('Arcade build integrity', () => {
  it('ensures Matrix of Conscience is self-contained', () => {
    const htmlPath = resolve(__dirname, '../arcade/matrix-of-conscience/index.html');
    const mainPath = resolve(__dirname, '../arcade/matrix-of-conscience/main.tsx');

    expect(existsSync(htmlPath), 'arcade/matrix-of-conscience/index.html must exist').toBe(true);
    expect(existsSync(mainPath), 'arcade/matrix-of-conscience/main.tsx must exist').toBe(true);

    const html = readFileSync(htmlPath, 'utf8');

    // Should NOT load from parent/sibling directories (the original bug)
    expect(html).not.toContain('src="../emergence-3d/');

    // Should have a root container element
    const hasRootContainer = html.includes('id="emergence-root"') || html.includes('id="canvas-container"');
    expect(hasRootContainer, 'index.html must have a root container element').toBe(true);
  });

  it('verifies all arcade games loading TypeScript have Vite entries', () => {
    const viteConfig = readFileSync(resolve(__dirname, '../vite.config.ts'), 'utf8');

    // Matrix of Conscience must have entry
    expect(viteConfig).toContain('arcade/matrix-of-conscience/index.html');
    expect(viteConfig).toContain('arcade/star-match/index.html');
    expect(readFileSync(resolve(__dirname, '../arcade/star-match/index.html'), 'utf8'))
      .toContain('<script type="module" src="./main.tsx"></script>');
  });
});
