import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('incomplete Matrix terminal availability', () => {
  it('does not publish or list the truncated page', () => {
    const config = fs.readFileSync('vite.config.ts', 'utf8');
    const arcade = fs.readFileSync('arcade/index.html', 'utf8');
    const matrixApp = fs.readFileSync('src/components/MatrixOfConscience.tsx', 'utf8');

    expect(config).not.toContain('arcade/matrix-of-conscience-terminal/index.html');
    expect(config).not.toContain('arcadeMatrixTerminal');
    expect(arcade).not.toContain('matrix-of-conscience-terminal');
    expect(matrixApp).not.toContain('name: "Trinity Terminal"');
  });

  it('routes legacy launchers to the active Matrix of Conscience game', () => {
    const popup = fs.readFileSync('extensions/antigravity-companion/popup.js', 'utf8');
    const lorePage = fs.readFileSync('arcade/lore/Noah_and_Norea.html', 'utf8');

    expect(popup).toContain('/arcade/matrix-of-conscience/');
    expect(popup).not.toContain('matrix-of-conscience-terminal');
    expect(lorePage).toContain("'../matrix-of-conscience/'");
    expect(lorePage).not.toContain('matrix-of-conscience-terminal');
  });
});
