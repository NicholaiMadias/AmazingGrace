import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('matrix root entrypoint', () => {
  it('mounts the full MatrixOfConscience React app for the matrix subdomain root', () => {
    const html = fs.readFileSync(path.resolve(__dirname, '../matrix-of-conscience/index.html'), 'utf8');
    const entry = fs.readFileSync(path.resolve(__dirname, '../matrix-of-conscience/main.tsx'), 'utf8');

    expect(html).toContain('id="matrix-root"');
    expect(html).toContain('<script type="module" src="./main.tsx"></script>');
    expect(entry).toContain("import MatrixOfConscience from '../src/components/MatrixOfConscience';");
    expect(entry).toContain('<MatrixOfConscience />');
    expect(entry).not.toContain('EmergenceScene');
  });
});
