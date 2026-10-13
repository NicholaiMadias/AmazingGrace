import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Arcade Game Smoke Tests
 *
 * These tests verify that each arcade game:
 * 1. Has an HTML entry point in vite.config.ts
 * 2. Has valid HTML structure
 * 3. Loads required scripts and assets
 * 4. Doesn't have obvious syntax errors
 *
 * This helps prevent "broken games" from being deployed to production.
 */

const ARCADE_GAMES = [
  { name: 'Main Arcade', path: 'arcade/index.html' },
  { name: 'Matrix of Conscience', path: 'arcade/matrix-of-conscience/index.html' },
  { name: 'Lore Archive', path: 'arcade/lore-archive/index.html' },
  { name: 'Certificates', path: 'arcade/certificates/index.html' },
  { name: 'Bible Study', path: 'arcade/bible-study/index.html' },
  { name: 'Seven Stars', path: 'arcade/seven-stars/index.html' },
  { name: 'Syndicate Siege', path: 'arcade/syndicate-siege/index.html' },
  { name: 'Tower Defense', path: 'arcade/tower-defense/index.html' },
];

const extractInlineScriptBody = (scriptTag: string): string => {
  const openTagEnd = scriptTag.indexOf('>');
  const closeTagStart = scriptTag.toLowerCase().lastIndexOf('</script');

  if (openTagEnd === -1 || closeTagStart <= openTagEnd) {
    return '';
  }

  return scriptTag.slice(openTagEnd + 1, closeTagStart);
};

describe('Arcade Game Smoke Tests', () => {
  describe('Game Entry Points', () => {
    it('should have all arcade games configured in vite.config.ts', () => {
      const viteConfig = readFileSync(resolve('vite.config.ts'), 'utf-8');

      for (const game of ARCADE_GAMES) {
        expect(
          viteConfig,
          `${game.name} should be in vite.config.ts rollupOptions.input`
        ).toContain(game.path);
      }
    });

    it('should have all game HTML files exist', () => {
      for (const game of ARCADE_GAMES) {
        const fullPath = resolve(game.path);
        expect(
          existsSync(fullPath),
          `${game.name} HTML file should exist at ${game.path}`
        ).toBe(true);
      }
    });
  });

  describe('Game HTML Structure', () => {
    for (const game of ARCADE_GAMES) {
      describe(game.name, () => {
        let html: string;

        it('should have valid HTML with DOCTYPE', () => {
          html = readFileSync(resolve(game.path), 'utf-8');
          expect(html).toMatch(/<!DOCTYPE html>/i);
        });

        it('should have html, head, and body tags', () => {
          html = readFileSync(resolve(game.path), 'utf-8');
          expect(html).toMatch(/<html[^>]*>/i);
          expect(html).toMatch(/<head[^>]*>/i);
          expect(html).toMatch(/<body[^>]*>/i);
          expect(html).toMatch(/<\/html>/i);
        });

        it('should have a title', () => {
          html = readFileSync(resolve(game.path), 'utf-8');
          expect(html).toMatch(/<title[^>]*>.*<\/title>/i);
        });

        it('should not contain broken script syntax', () => {
          html = readFileSync(resolve(game.path), 'utf-8');

          // Check for common script errors
          const scriptBlocks = html.match(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi) || [];

          for (const script of scriptBlocks) {
            // Skip if it's an external script (src attribute)
            if (script.match(/src=/i)) continue;

            // Check for unmatched braces (basic syntax check)
            const content = extractInlineScriptBody(script);
            const openBraces = (content.match(/\{/g) || []).length;
            const closeBraces = (content.match(/\}/g) || []).length;

            expect(
              openBraces,
              `${game.name} should have matched braces in inline scripts`
            ).toBe(closeBraces);
          }
        });

        it('should use relative paths for internal navigation', () => {
          html = readFileSync(resolve(game.path), 'utf-8');

          // Check for absolute arcade paths that break on preview deployments
          const brokenPatterns = [
            /href=["']\/arcade\//g,
            /src=["']\/arcade\//g,
          ];

          for (const pattern of brokenPatterns) {
            const matches = html.match(pattern);
            if (matches) {
              expect(
                matches,
                `${game.name} should use relative paths (./ or ../) instead of absolute /arcade/ paths for preview compatibility`
              ).toHaveLength(0);
            }
          }
        });

        it('should not have obvious placeholder content', () => {
          html = readFileSync(resolve(game.path), 'utf-8');

          // Check for placeholder patterns that suggest incomplete games
          const placeholderPatterns = [
            /lorem ipsum/i,
            /\btodo\b.*(?:game|feature|implement)/i,
            /placeholder\s+text/i,
            /coming\s+soon/i,
          ];

          for (const pattern of placeholderPatterns) {
            expect(
              html,
              `${game.name} should not contain placeholder content: ${pattern}`
            ).not.toMatch(pattern);
          }
        });
      });
    }
  });

  describe('Asset References', () => {
    for (const game of ARCADE_GAMES) {
      it(`${game.name} should have resolvable asset references`, () => {
        const html = readFileSync(resolve(game.path), 'utf-8');
        const gameDir = resolve(game.path, '..');

        // Extract src and href references
        const srcMatches = html.matchAll(/src=["']([^"']+)["']/gi);
        const hrefMatches = html.matchAll(/href=["']([^"']+)["']/gi);

        const refs = [
          ...Array.from(srcMatches).map(m => m[1]),
          ...Array.from(hrefMatches).map(m => m[1]),
        ];

        for (const ref of refs) {
          // Skip external URLs
          if (/^(https?:|mailto:|tel:|data:|javascript:|#)/i.test(ref)) continue;

          const cleanRef = ref.split(/[?#]/)[0].trim();
          if (!cleanRef) continue;

          const resolvedPath = cleanRef.startsWith('/')
            ? resolve(cleanRef.slice(1))
            : resolve(gameDir, cleanRef);

          expect(
            existsSync(resolvedPath) || existsSync(resolve(resolvedPath, 'index.html')),
            `${game.name} has a broken local reference: ${ref}`
          ).toBe(true);
        }
      });
    }
  });

  describe('Arcade Navigation', () => {
    it('should have working back navigation links in arcade games', () => {
      const arcadeIndex = readFileSync(resolve('arcade/index.html'), 'utf-8');

      // Main arcade should have a link to parent (homepage or matrix)
      expect(arcadeIndex).toMatch(/href=["']\.\.\/[^"']*["']/);
    });

    it('should have sub-games link back to arcade index', () => {
      const subGames = ARCADE_GAMES.filter(g =>
        g.path.startsWith('arcade/') && g.path !== 'arcade/index.html'
      );

      for (const game of subGames) {
        const html = readFileSync(resolve(game.path), 'utf-8');

        // Game should have navigation back to arcade or home (either in static HTML or via an SPA shell)
        const isSpaShell =
          /<main[^>]+id=["']root["']/i.test(html) &&
          /<script[^>]+type=["']module["'][^>]+src=["'][^"']+["']/i.test(html);

        const hasBackNav =
          isSpaShell ||
          html.includes('href="../') ||
          html.includes("href='../") ||
          html.includes('href="./') ||
          html.includes("href='./") ||
          html.includes('Back to Arcade') ||
          html.includes('← Arcade');
        expect(
          hasBackNav,
          `${game.name} should have navigation back to arcade or home`
        ).toBe(true);
      }
    });
  });

  describe('Game Load Performance', () => {
    it('should not have excessively large inline scripts', () => {
      for (const game of ARCADE_GAMES) {
        const html = readFileSync(resolve(game.path), 'utf-8');
        const scriptBlocks = html.match(/<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi) || [];

        for (const script of scriptBlocks) {
          // Skip external scripts
          if (script.match(/src=/i)) continue;

          const size = script.length;

          // Fail if over 100KB (should definitely be external)
          expect(
            size,
            `${game.name} inline script too large (${Math.round(size/1024)}KB) - externalize to separate .js file`
          ).toBeLessThan(100000);
        }
      }
    });
  });
});
