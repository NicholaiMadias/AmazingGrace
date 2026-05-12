import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('Matrix Classic preview-safe routing', () => {
  it('uses a relative Nexus route in runtime scripts', () => {
    const runtimeScript = fs.readFileSync('js/matrix-classic.js', 'utf8');
    const publicScript = fs.readFileSync('public/js/matrix-classic.js', 'utf8');

    expect(runtimeScript).toContain('const NEXUS_URL = "./matrix-of-conscience/";');
    expect(publicScript).toContain('const NEXUS_URL = "./matrix-of-conscience/";');
  });
});
