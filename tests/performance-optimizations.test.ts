import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('performance optimization fixes', () => {
  const homepage = fs.readFileSync('index.html', 'utf8');
  const serviceWorker = fs.readFileSync('public/sw.js', 'utf8');
  const matchmaker = fs.readFileSync('js/matchmaker.js', 'utf8');
  const starMatrix = fs.readFileSync('arcade/star-matrix/index.html', 'utf8');
  const matrixGame = fs.readFileSync('arcade/matrix-of-conscience/app.js', 'utf8');
  const matrixPage = fs.readFileSync('matrix.html', 'utf8');
  const viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
  const lensBoard = fs.readFileSync('arcade/matrix-of-conscience/LensBoard.jsx', 'utf8');
  const conscienceProvider = fs.readFileSync('src/components/ConscienceProvider.tsx', 'utf8');
  const arcadeMain = fs.readFileSync('src/arcade-main.tsx', 'utf8');
  const familyStatsContext = fs.readFileSync('src/context/FamilyStatsContext.tsx', 'utf8');

  it('keeps a single React listing UI and removes legacy hidden listing/search markup', () => {
    expect(homepage).toContain('id="listing-search-root"');
    expect(homepage).toContain('src="./src/listings-main.tsx"');
    expect(homepage).not.toContain('id="property-search"');
    expect(homepage).not.toContain('id="search-clear"');
    expect(homepage).not.toContain('#property-grid .property-card');
    expect(homepage).not.toContain('class="property-grid" style="display:none"');
  });

  it('trims service-worker precache/runtime image caching overhead', () => {
    expect(serviceWorker).toContain("const CACHE_NAME = 'amazing-grace-v10'");
    expect(serviceWorker).toContain("const ASSETS_TO_CACHE = [");
    expect(serviceWorker).toContain("    './arcade/matrix-of-conscience/index.html',");
    expect(serviceWorker).not.toContain("    './arcade/star-matrix/index.html',");
    expect(serviceWorker).not.toContain("    './arcade/trinity/index.html',");
    expect(serviceWorker).not.toContain("    './arcade/bible-study/index.html',");
    expect(serviceWorker).not.toContain("    './arcade/certificates/index.html',");
    expect(serviceWorker).not.toContain("    './ministry/index.html',");
    expect(serviceWorker).toContain("const STATIC_DESTINATIONS = new Set(['style', 'script', 'font', 'manifest']);");
    expect(serviceWorker).not.toContain('png|jpg|jpeg|svg|gif|webp|avif|ico');
  });

  it('uses O(1) gravity fill indexing instead of shift() in matchmaker hot loop', () => {
    expect(matchmaker).toContain('const compactedLength = gems.length;');
    expect(matchmaker).toContain('const compactedIndex = GRID_SIZE - 1 - r;');
    expect(matchmaker).not.toContain('gems.shift()');
  });

  it('uses delegated pointer handlers for star-matrix drag interactions', () => {
    expect(starMatrix).toContain("boardEl.addEventListener('pointerdown', onPointerDown);");
    expect(starMatrix).toContain("boardEl.addEventListener('pointermove', onPointerMove);");
    expect(starMatrix).toContain("boardEl.addEventListener('pointerup', onPointerUp);");
    expect(starMatrix).toContain("boardEl.addEventListener('pointercancel', onPointerCancel);");
    expect(starMatrix).not.toContain("cell.addEventListener('pointerdown', onPointerDown);");
  });

  it('reuses match results and board nodes during match-3 play', () => {
    expect(starMatrix).toContain('let matchResult = firstMatch;');
    expect(starMatrix).toContain('matchResult = findMatches(next);');
    expect(matrixGame).toContain('async resolveMatches(matches = findMatchesGrouped(this.board))');
    expect(matrixGame).not.toContain('matches.flat()');
    expect(matrixGame).toContain('grid.replaceChildren(cells)');
    expect(matrixPage).toContain("document.addEventListener('visibilitychange'");
  });

  it('splits firebase and framer-motion chunks with lower warning limit', () => {
    expect(viteConfig).toContain('chunkSizeWarningLimit: 500');
    expect(viteConfig).toContain("if (id.includes('firebase/firestore')) return 'firebase-firestore';");
    expect(viteConfig).toContain("if (id.includes('firebase/auth')) return 'firebase-auth';");
    expect(viteConfig).toContain("if (id.includes('firebase/app')) return 'firebase-core';");
    expect(viteConfig).toContain("if (id.includes('framer-motion')) return 'framer-motion';");
  });

  it('uses memoization and lower mutation frequency in LensBoard', () => {
    expect(lensBoard).toContain('const alignedSegments = useMemo(');
    expect(lensBoard).toContain('Math.random() < nextDisturbance * 0.1');
    expect(lensBoard).toContain('}, 200);');
  });

  it('stabilizes ConscienceProvider metrics updates', () => {
    expect(conscienceProvider).toContain('const prevMetricsRef = useRef(initialMetrics);');
    expect(conscienceProvider).toContain('const updateMetrics = useCallback(');
    expect(conscienceProvider).toContain('const value = useMemo(() => ({');
    expect(conscienceProvider).toContain('increaseCollapseRisk');
  });

  it('shares family stats via context provider in arcade app', () => {
    expect(familyStatsContext).toContain('export function FamilyStatsProvider');
    expect(familyStatsContext).toContain('export function useFamilyStatsContext()');
    expect(arcadeMain).toContain('const { stats, chainLevel, activeUser, syncStatus, syncError, isLoading } = useFamilyStatsContext();');
    expect(arcadeMain).toContain('<FamilyStatsProvider>');
  });
});
