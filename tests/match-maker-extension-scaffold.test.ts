import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const EXTENSION_ROOT = 'public/match-maker';
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

describe('Nexus Match-Maker extension scaffold', () => {
  it('ships a Manifest V3 scaffold with the expected resources', () => {
    const manifest = JSON.parse(fs.readFileSync(`${EXTENSION_ROOT}/manifest.json`, 'utf8'));

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.action?.default_popup).toBe('popup.html');
    expect(manifest.background?.service_worker).toBe('background.js');
    expect(manifest.background?.type).toBe('module');
    expect(manifest.permissions).toContain('storage');
    expect(manifest.host_permissions).toEqual(['https://*/', 'http://*/']);
    expect(manifest.web_accessible_resources?.[0]?.resources).toEqual([
      'svg/gems-atlas.svg',
      'svg/master-atlas.svg',
      'assets/*.png',
      'engine/*.js',
    ]);
  });

  it('includes popup, background, engine, and local atlas assets', () => {
    const requiredFiles = [
      `${EXTENSION_ROOT}/popup.html`,
      `${EXTENSION_ROOT}/popup.js`,
      `${EXTENSION_ROOT}/background.js`,
      `${EXTENSION_ROOT}/engine/index.js`,
      `${EXTENSION_ROOT}/svg/gems-atlas.svg`,
      `${EXTENSION_ROOT}/svg/master-atlas.svg`,
    ];

    for (const file of requiredFiles) {
      expect(fs.existsSync(file), `${file} should exist`).toBe(true);
    }
  });

  it('ships real PNG placeholder icon binaries', () => {
    for (const size of [16, 48, 128]) {
      const icon = fs.readFileSync(`${EXTENSION_ROOT}/assets/icon${size}.png`);
      expect(Array.from(icon.subarray(0, PNG_SIGNATURE.length))).toEqual(PNG_SIGNATURE);
    }
  });

  it('offers the extension zip download from the arcade page', () => {
    const arcade = fs.readFileSync('arcade/index.html', 'utf8');

    expect(arcade).toContain('./downloads/nexus-match-maker.zip');
    expect(arcade).toContain('MV3 scaffold + Seven-Star atlas assets');
    expect(fs.statSync('public/arcade/downloads/nexus-match-maker.zip').size).toBeGreaterThan(0);
  });

  it('uses Seven-Star atlas graphics on the Match Maker arcade card', () => {
    const arcade = fs.readFileSync('arcade/index.html', 'utf8');

    expect(arcade).toContain('../assets/svg/gems-atlas.svg#gem-electra');
    expect(arcade).toContain('../assets/svg/gems-atlas.svg#gem-maia');
    expect(arcade).toContain('../assets/svg/gems-atlas.svg#gem-taygete');
    expect(arcade).toContain('../assets/svg/master-atlas.svg#icon-seven-stars');
    expect(arcade).toContain('Swap and match Seven-Star gems on a 7×7 board.');
  });
});
