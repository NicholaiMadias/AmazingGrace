import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CAMPAIGN_MISSIONS, isCampaignMissionLevel } from '../arcade/matrix-of-conscience/campaignMissionData';

const missionLevels = Object.keys(CAMPAIGN_MISSIONS).map(Number).sort((a, b) => a - b);

describe('Matrix of Conscience campaign', () => {
  it('defines all ten sectors with a transmission and objective', () => {
    const mapSource = fs.readFileSync(
      path.resolve(__dirname, '../arcade/matrix-of-conscience/UniverseMap.tsx'),
      'utf8'
    );
    const sectorIds = [...mapSource.matchAll(/id:\s*(\d+),\s*x:/g)].map((match) => Number(match[1]));

    expect(sectorIds).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect((mapSource.match(/transmission:\s*"/g) ?? []).length).toBe(10);
    expect((mapSource.match(/objective:\s*"/g) ?? []).length).toBe(10);
  });

  it('provides playable, contiguous, unique routes and rewards for levels 4 through 10', () => {
    expect(missionLevels).toEqual([4, 5, 6, 7, 8, 9, 10]);
    const missions = Object.values(CAMPAIGN_MISSIONS);
    expect(new Set(missions.map((mission) => mission.badge)).size).toBe(7);
    expect(new Set(missions.map((mission) => mission.bossName)).size).toBe(7);

    for (const mission of missions) {
      expect(mission.waves).toBeGreaterThanOrEqual(4);
      expect(mission.ending.length).toBeGreaterThan(40);
      expect(mission.route.length).toBeGreaterThan(10);
      expect(new Set(mission.route.map(([row, column]) => `${row}:${column}`)).size).toBe(mission.route.length);

      mission.route.forEach(([row, column], index) => {
        expect(row).toBeGreaterThanOrEqual(0);
        expect(row).toBeLessThan(8);
        expect(column).toBeGreaterThanOrEqual(0);
        expect(column).toBeLessThan(10);

        if (index > 0) {
          const [previousRow, previousColumn] = mission.route[index - 1];
          expect(Math.abs(row - previousRow) + Math.abs(column - previousColumn)).toBe(1);
        }
      });

      expect(mission.route[0][0] === 0 || mission.route[0][1] === 0).toBe(true);
      expect(mission.route.at(-1)?.[0] === 7 || mission.route.at(-1)?.[1] === 9).toBe(true);
    }
  });

  it('wires level selection, level 3 completion, and levels 4 through 10 into campaign routing', () => {
    const appSource = fs.readFileSync(
      path.resolve(__dirname, '../arcade/matrix-of-conscience/MatrixOfConscienceApp.tsx'),
      'utf8'
    );
    const level2Source = fs.readFileSync(
      path.resolve(__dirname, '../arcade/matrix-of-conscience/Level2SyndicateSiege.tsx'),
      'utf8'
    );
    const emergenceSource = fs.readFileSync(
      path.resolve(__dirname, '../src/components/EmergenceSimulation/EmergenceScene.tsx'),
      'utf8'
    );

    expect(appSource).toContain('const selectedMissionLevel = selectedSectorData.id;');
    expect(appSource).toContain('if (isCampaignMissionLevel(level))');
    expect(appSource).toContain('onVictory={() => completeLevel(level)}');
    expect(appSource).toContain('onVictory={() => completeLevel(1, true)}');
    expect(appSource).toContain('onVictory={() => completeLevel(2, true)}');
    expect(appSource).toContain('setSelectedSector(nextLevel);');
    expect(appSource).toContain('setSelectedSector(parsed);');
    expect(appSource).toContain('sectorId={selectedSector}');
    expect(level2Source).toContain('sectorId?: number;');
    expect(level2Source).toMatch(/function Level2SyndicateSiege\(\{\s*onBack,\s*onVictory,\s*sectorId\s*\}/);
    expect(appSource).toContain('onMissionComplete={() => completeLevel(3)}');
    expect(emergenceSource).toContain('gameState.wave > 3');
    expect(emergenceSource).toContain('Rift Peacemaker');

    for (const level of missionLevels) {
      expect(isCampaignMissionLevel(level)).toBe(true);
    }
    expect(isCampaignMissionLevel(3)).toBe(false);
    expect(isCampaignMissionLevel(11)).toBe(false);
  });
});
