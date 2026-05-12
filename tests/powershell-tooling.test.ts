import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('PowerShell toolkit', () => {
  it('adds a reusable module with repository-specific checks', () => {
    const src = fs.readFileSync('scripts/AmazingGrace.Tools.psm1', 'utf8');

    expect(src).toContain('Invoke-AmazingGraceValidation');
    expect(src).toContain('Test-AGGitHubPagesReadiness');
    expect(src).toContain('Test-AGGameAssetReferences');
    expect(src).toContain('Test-AGManifestConfiguration');
    expect(src).toContain('Test-AGWindowsAdmin');
    expect(src).toContain('amazinggracehl.org');
    expect(src).toContain('assets/svg/gems-atlas.svg');
    expect(src).toContain('Set-AGMatrixTheme');
  });

  it('adds entry-point scripts for validation, preview, and maintenance', () => {
    const testScript = fs.readFileSync('scripts/Test-AmazingGrace.ps1', 'utf8');
    const previewScript = fs.readFileSync('scripts/Start-AmazingGracePreview.ps1', 'utf8');
    const maintenanceScript = fs.readFileSync('scripts/Invoke-AmazingGraceMaintenance.ps1', 'utf8');

    expect(testScript).toContain('Invoke-AmazingGraceValidation');
    expect(previewScript).toContain('Start-AGLocalPreview');
    expect(maintenanceScript).toContain('Invoke-AGWindowsMaintenance');
  });

  it('documents toolkit usage', () => {
    const docs = fs.readFileSync('docs/powershell-toolkit.md', 'utf8');

    expect(docs).toContain('Test-AmazingGrace.ps1');
    expect(docs).toContain('Start-AmazingGracePreview.ps1');
    expect(docs).toContain('Invoke-AmazingGraceMaintenance.ps1');
    expect(docs).toContain('amazinggracehl.org');
    expect(docs).toContain('/assets/svg/gems-atlas.svg');
  });
});
