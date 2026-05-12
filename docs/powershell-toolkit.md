# PowerShell Toolkit (GitHub Pages + Game Assets)

The repository includes Matrix-themed PowerShell tooling for GitHub Pages and game asset validation.

## Files

- `scripts/AmazingGrace.Tools.psm1` - reusable module
- `scripts/Test-AmazingGrace.ps1` - run validations
- `scripts/Start-AmazingGracePreview.ps1` - start local dev/preview server
- `scripts/Invoke-AmazingGraceMaintenance.ps1` - Windows maintenance helper (`npm ci`, tests, build)

## Usage

From repo root:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-AmazingGrace.ps1 -IncludeEnvironmentChecks
```

Run validation and immediately launch preview:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-AmazingGrace.ps1 -StartPreview -PreviewMode dev
```

Preview only:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\Start-AmazingGracePreview.ps1 -Mode preview
```

Windows maintenance helper:

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\Invoke-AmazingGraceMaintenance.ps1
```

## What it validates

- GitHub Pages readiness for this repo (`main` branch workflow, `vite.config.ts`, required files)
- CNAME/domain hardening for `amazinggracehl.org`
- Manifest JSON parse validity and icon path references
- HTML manifest links
- Game/story content references and required asset path `/assets/svg/gems-atlas.svg`
- Optional Windows admin and environment readiness checks

The toolkit applies Matrix-style console theming (green on black) in interactive hosts and uses color-coded success/warning/error output.
