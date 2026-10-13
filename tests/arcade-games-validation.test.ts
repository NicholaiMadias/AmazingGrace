import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('Arcade Games Validation', () => {
  const arcadeIndexPath = resolve(__dirname, '../arcade/index.html');

  it('arcade/index.html should exist', () => {
    expect(existsSync(arcadeIndexPath)).toBe(true);
  });

  describe('Arcade Hub', () => {
    const arcadeHTML = readFileSync(arcadeIndexPath, 'utf-8');

    it('should redirect to the Central Matrix', () => {
      expect(arcadeHTML).toContain('href="../matrix.html"');
    });

    it('should reference active games', () => {
      [
        './matrix-of-conscience/',
        './tower-defense/',
        './star-matrix/',
        './syndicate-siege/',
        './trinity/',
        './lore-archive/',
        './seven-stars/',
        './bible-study/',
      ].forEach((path) => {
        expect(arcadeHTML).toContain(`href="${path}"`);
      });
    });

    it('should not reference removed games', () => {
      expect(arcadeHTML).not.toContain('href="./nexus-arcade/"');
      expect(arcadeHTML).not.toContain('Janus Continuum');
    });
  });

  describe('Individual Game Pages', () => {
    const games = [
      { name: 'Matrix of Conscience', path: 'arcade/matrix-of-conscience/index.html' },
      { name: 'Bible Study', path: 'arcade/bible-study/index.html' },
      { name: 'Syndicate Siege', path: 'arcade/syndicate-siege/index.html' },
      { name: 'Certificates', path: 'arcade/certificates/index.html' },
      { name: 'Seven Stars', path: 'arcade/seven-stars/index.html' },
      { name: 'Tower Defense', path: 'arcade/tower-defense/index.html' },
    ];

    games.forEach(game => {
      it(`${game.name} should have valid HTML structure`, () => {
        const gamePath = resolve(__dirname, '..', game.path);
        expect(existsSync(gamePath), `${game.name} file should exist at ${game.path}`).toBe(true);

        const html = readFileSync(gamePath, 'utf-8');
        // Case-insensitive DOCTYPE check (Vite may lowercase it)
        expect(html.toLowerCase()).toContain('<!doctype html>');
        expect(html).toContain('<html');
        expect(html).toContain('</html>');
        expect(html).toContain('<title>');
      });
    });
  });

  describe('Vite Config Entries', () => {
    const viteConfigPath = resolve(__dirname, '../vite.config.ts');
    const viteConfig = readFileSync(viteConfigPath, 'utf-8');

    const requiredEntries = [
      { name: 'arcade', entry: 'arcade/index.html' },
      { name: 'arcadeMatrix', entry: 'arcade/matrix-of-conscience/index.html' },
      { name: 'arcadeBibleStudy', entry: 'arcade/bible-study/index.html' },
      { name: 'arcadeSyndicateSiege', entry: 'arcade/syndicate-siege/index.html' },
      { name: 'arcadeCertificates', entry: 'arcade/certificates/index.html' },
      { name: 'arcadeSevenStars', entry: 'arcade/seven-stars/index.html' },
      { name: 'arcadeTowerDefense', entry: 'arcade/tower-defense/index.html' },
      { name: 'arcadeRedirect', entry: 'arcade.html' },
    ];

    requiredEntries.forEach(({ name, entry }) => {
      it(`should include ${name} entry for ${entry}`, () => {
        expect(viteConfig).toContain(`${name}:`);
        expect(viteConfig).toContain(entry);
      });
    });

    it('should not include removed game entries', () => {
      expect(viteConfig).not.toContain('arcade/matrix-of-conscience-terminal/index.html');
      expect(viteConfig).not.toContain('arcade/nexus-matrix/index.html');
      expect(viteConfig).not.toContain('arcade/janus/index.html');
      expect(viteConfig).not.toContain('arcade/nexus-arcade/index.html');
      expect(viteConfig).not.toContain('arcade/matrix-app/index.html');
    });
  });

  describe('Match Maker Cleanup', () => {
    it('arcade/main.js should be removed', () => {
      expect(existsSync(resolve(__dirname, '../arcade/main.js'))).toBe(false);
    });

    it('arcade/match-maker-ui.js should be removed', () => {
      expect(existsSync(resolve(__dirname, '../arcade/match-maker-ui.js'))).toBe(false);
    });
  });

  describe('Game Navigation and Back Links', () => {
    const gamesWithBackLinks = [
      { name: 'Matrix of Conscience', path: 'arcade/matrix-of-conscience/index.html' },
      { name: 'Syndicate Siege', path: 'arcade/syndicate-siege/index.html' },
    ];

    gamesWithBackLinks.forEach(game => {
      it(`${game.name} should have a back link to arcade`, () => {
        const gamePath = resolve(__dirname, '..', game.path);
        const html = readFileSync(gamePath, 'utf-8');

        // Check for various back link patterns
        const hasBackLink =
          html.includes('Back to Arcade') ||
          html.includes('← Arcade') ||
          html.includes('href="../"') ||
          html.includes('href="../../"') ||
          html.includes('← Back') ||
          html.includes('Arcade Lobby') ||
          html.includes('matrix.html');

        expect(hasBackLink, `${game.name} should have a back link`).toBe(true);
      });
    });
  });

  describe('Standalone Default Architecture', () => {
    const standaloneGames = [
      { name: 'Matrix of Conscience', dir: 'arcade/matrix-of-conscience' },
      { name: 'Tower Defense', dir: 'arcade/tower-defense' },
      { name: 'Atari Lab', dir: 'arcade/atari-lab' },
    ];

    standaloneGames.forEach(game => {
      it(`${game.name} should adhere to the Standalone Default architecture`, () => {
        const gameDir = resolve(__dirname, '..', game.dir);
        const indexPath = resolve(gameDir, 'index.html');
        
        expect(existsSync(indexPath), `${game.name} missing index.html`).toBe(true);
        
        const html = readFileSync(indexPath, 'utf-8');
        expect(html, `${game.name} index.html must load a module script`).toMatch(/<script type="module" src="\.\/.*(?:ts|js)x?"><\/script>/);
        
        // Also ensure the actual module file exists
        const moduleMatch = html.match(/src="\.\/(.*(?:ts|js)x?)"/);
        expect(moduleMatch).not.toBeNull();
        if (moduleMatch) {
          const modulePath = resolve(gameDir, moduleMatch[1]);
          expect(existsSync(modulePath), `${game.name} missing entry module ${moduleMatch[1]}`).toBe(true);
        }
      });
    });
  });

  describe('Asset and Dependency Checks', () => {
    it('arcade/js directory should exist with shared scripts', () => {
      const jsDir = resolve(__dirname, '../arcade/js');
      expect(existsSync(jsDir)).toBe(true);
    });
  });
});
