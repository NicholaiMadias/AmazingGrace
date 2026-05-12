Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$script:ExpectedDomain = 'amazinggracehl.org'
$script:RequiredGemAtlasPath = 'assets/svg/gems-atlas.svg'
$script:HtmlSearchPaths = @('index.html', 'contact.html', 'arcade', 'stories', 'ministry', 'ministries', 'matrix', 'galleries')

function Set-AGMatrixTheme {
  [CmdletBinding()]
  param()

  try {
    $Host.UI.RawUI.BackgroundColor = 'Black'
    $Host.UI.RawUI.ForegroundColor = 'Green'
    Clear-Host
  } catch {
    # Non-interactive hosts may not support RawUI color changes.
  }
}

function Write-AGStatus {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)]
    [ValidateSet('Info', 'Success', 'Warning', 'Error')]
    [string]$Level,

    [Parameter(Mandatory)]
    [string]$Message
  )

  $palette = @{
    Info    = 'Green'
    Success = 'DarkGreen'
    Warning = 'Yellow'
    Error   = 'Red'
  }

  Write-Host "[$Level] $Message" -ForegroundColor $palette[$Level]
}

function Get-AGRepoRoot {
  [CmdletBinding()]
  param([string]$RepoRoot)

  if ($RepoRoot) {
    return (Resolve-Path -LiteralPath $RepoRoot).Path
  }

  return (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
}

function Test-AGWindowsAdmin {
  [CmdletBinding()]
  param()

  if (-not $IsWindows) {
    Write-AGStatus -Level Info -Message 'Admin elevation check skipped: non-Windows host.'
    return $true
  }

  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = [Security.Principal.WindowsPrincipal]::new($identity)
  $isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

  if ($isAdmin) {
    Write-AGStatus -Level Success -Message 'PowerShell session is elevated (Administrator).'
    return $true
  }

  Write-AGStatus -Level Warning -Message 'PowerShell session is not elevated. Some Windows maintenance commands may fail.'
  Write-AGStatus -Level Info -Message 'To elevate: Start-Process pwsh -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File .\\scripts\\Test-AmazingGrace.ps1"'
  return $false
}

function Test-AGEnvironmentReadiness {
  [CmdletBinding()]
  param()

  $ok = $true
  foreach ($cmd in 'node', 'npm', 'git') {
    if (Get-Command -Name $cmd -ErrorAction SilentlyContinue) {
      Write-AGStatus -Level Success -Message "Found command: $cmd"
    } else {
      Write-AGStatus -Level Error -Message "Missing required command: $cmd"
      $ok = $false
    }
  }

  if ($IsWindows) {
    try {
      $policy = Get-ExecutionPolicy -Scope CurrentUser
      Write-AGStatus -Level Info -Message "CurrentUser execution policy: $policy"
    } catch {
      Write-AGStatus -Level Warning -Message "Could not read execution policy: $($_.Exception.Message)"
    }
  }

  return $ok
}

function Test-AGGitHubPagesReadiness {
  [CmdletBinding()]
  param([Parameter(Mandatory)][string]$RepoRoot)

  $ok = $true
  $requiredFiles = @(
    'index.html',
    'CNAME',
    'manifest.json',
    '.github/workflows/deploy.yml',
    'vite.config.ts'
  )

  foreach ($file in $requiredFiles) {
    $path = Join-Path $RepoRoot $file
    if (Test-Path -LiteralPath $path) {
      Write-AGStatus -Level Success -Message "Found $file"
    } else {
      Write-AGStatus -Level Error -Message "Missing required file: $file"
      $ok = $false
    }
  }

  $vitePath = Join-Path $RepoRoot 'vite.config.ts'
  if (Test-Path -LiteralPath $vitePath) {
    $vite = Get-Content -LiteralPath $vitePath -Raw
    if ($vite -match 'base:\s*["'']\./["'']') {
      Write-AGStatus -Level Success -Message 'Vite base is relative (./) for GitHub Pages previews.'
    } else {
      Write-AGStatus -Level Warning -Message 'Vite base does not appear to be set to ./'
      $ok = $false
    }
  }

  $deployWorkflowPath = Join-Path $RepoRoot '.github/workflows/deploy.yml'
  if (Test-Path -LiteralPath $deployWorkflowPath) {
    $deployWorkflow = Get-Content -LiteralPath $deployWorkflowPath -Raw
    if ($deployWorkflow -match 'branches:\s*\[\s*main\s*\]') {
      Write-AGStatus -Level Success -Message 'Deploy workflow is configured for main branch pushes.'
    } else {
      Write-AGStatus -Level Warning -Message 'Deploy workflow does not clearly target main branch.'
      $ok = $false
    }

    if ($deployWorkflow -match 'actions/deploy-pages@') {
      Write-AGStatus -Level Success -Message 'Deploy workflow uses actions/deploy-pages.'
    } else {
      Write-AGStatus -Level Warning -Message 'Deploy workflow does not reference actions/deploy-pages.'
      $ok = $false
    }
  }

  return $ok
}

function Test-AGCustomDomain {
  [CmdletBinding()]
  param([Parameter(Mandatory)][string]$RepoRoot)

  $ok = $true
  $cnamePath = Join-Path $RepoRoot 'CNAME'
  if (-not (Test-Path -LiteralPath $cnamePath)) {
    Write-AGStatus -Level Error -Message 'CNAME file is missing at repo root.'
    return $false
  }

  $rawCnameValue = Get-Content -LiteralPath $cnamePath | Select-Object -First 1
  $cnameValue = if ($null -eq $rawCnameValue) { '' } else { $rawCnameValue.Trim() }
  if ($cnameValue -eq $script:ExpectedDomain) {
    Write-AGStatus -Level Success -Message "CNAME is set to $($script:ExpectedDomain)."
  } else {
    Write-AGStatus -Level Error -Message "CNAME must be exactly $($script:ExpectedDomain), found '$cnameValue'."
    $ok = $false
  }

  $domainTxtPath = Join-Path $RepoRoot 'Domain.txt'
  if (Test-Path -LiteralPath $domainTxtPath) {
    $domainTxt = Get-Content -LiteralPath $domainTxtPath -Raw
    if ($domainTxt -match [Regex]::Escape($script:ExpectedDomain)) {
      Write-AGStatus -Level Success -Message 'Domain.txt references the expected production domain.'
    } else {
      Write-AGStatus -Level Warning -Message 'Domain.txt does not reference the expected domain.'
      $ok = $false
    }
  }

  return $ok
}

function Test-AGManifestConfiguration {
  [CmdletBinding()]
  param([Parameter(Mandatory)][string]$RepoRoot)

  $ok = $true
  $manifestPaths = @(
    'manifest.json',
    'public/manifest.json'
  )

  foreach ($manifestRelativePath in $manifestPaths) {
    $manifestPath = Join-Path $RepoRoot $manifestRelativePath
    if (-not (Test-Path -LiteralPath $manifestPath)) {
      Write-AGStatus -Level Warning -Message "Manifest not found: $manifestRelativePath"
      $ok = $false
      continue
    }

    try {
      $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
      Write-AGStatus -Level Success -Message "Valid JSON: $manifestRelativePath"
    } catch {
      Write-AGStatus -Level Error -Message "Invalid JSON in ${manifestRelativePath}: $($_.Exception.Message)"
      $ok = $false
      continue
    }

    if ($manifest.icons -and $manifest.icons.Count -gt 0) {
      foreach ($icon in $manifest.icons) {
        if (-not $icon.src) {
          Write-AGStatus -Level Warning -Message "Icon entry missing src in $manifestRelativePath"
          $ok = $false
          continue
        }

        if ($icon.src -match '^(https?:)?//|^data:') {
          Write-AGStatus -Level Info -Message "External icon source allowed: $($icon.src)"
          continue
        }

        if ($icon.src.StartsWith('/')) {
          $resolvedIconPath = Join-Path $RepoRoot $icon.src.TrimStart('/')
        } else {
          $resolvedIconPath = Join-Path (Split-Path -Parent $manifestPath) $icon.src
        }

        if (Test-Path -LiteralPath $resolvedIconPath) {
          Write-AGStatus -Level Success -Message "Found icon path: $($icon.src)"
        } else {
          Write-AGStatus -Level Error -Message "Missing manifest icon path: $($icon.src) (from $manifestRelativePath)"
          $ok = $false
        }
      }
    } else {
      Write-AGStatus -Level Warning -Message "No icons array found in $manifestRelativePath"
      $ok = $false
    }
  }

  $htmlFiles = foreach ($contentPath in $script:HtmlSearchPaths) {
    $fullPath = Join-Path $RepoRoot $contentPath
    if (Test-Path -LiteralPath $fullPath) {
      if ((Get-Item -LiteralPath $fullPath).PSIsContainer) {
        Get-ChildItem -LiteralPath $fullPath -Recurse -Filter '*.html' -File
      } else {
        Get-Item -LiteralPath $fullPath
      }
    }
  }

  foreach ($htmlFile in $htmlFiles) {
    $html = Get-Content -LiteralPath $htmlFile.FullName -Raw
    $linkTags = [Regex]::Matches($html, '<link\b[^>]*>', 'IgnoreCase')

    foreach ($linkTag in $linkTags) {
      if ($linkTag.Value -notmatch 'rel=["'']manifest["'']') {
        continue
      }

      $hrefMatch = [Regex]::Match($linkTag.Value, 'href=["'']([^"'']+)["'']', 'IgnoreCase')
      if (-not $hrefMatch.Success) {
        Write-AGStatus -Level Error -Message "Manifest link without href in $($htmlFile.FullName)"
        $ok = $false
        continue
      }

      $href = $hrefMatch.Groups[1].Value
      if ($href -match '^(https?:)?//') {
        Write-AGStatus -Level Warning -Message "External manifest reference in $($htmlFile.FullName): $href"
        $ok = $false
        continue
      }

      if ($href.StartsWith('/')) {
        $resolvedManifestPath = Join-Path $RepoRoot $href.TrimStart('/')
      } else {
        $resolvedManifestPath = Join-Path $htmlFile.DirectoryName $href
      }

      if (Test-Path -LiteralPath $resolvedManifestPath) {
        Write-AGStatus -Level Success -Message "Manifest link ok in $($htmlFile.Name): $href"
      } else {
        Write-AGStatus -Level Error -Message "Broken manifest link in $($htmlFile.FullName): $href"
        $ok = $false
      }
    }
  }

  return $ok
}

function Test-AGGameAssetReferences {
  [CmdletBinding()]
  param([Parameter(Mandatory)][string]$RepoRoot)

  $ok = $true
  $requiredAssetPath = Join-Path $RepoRoot $script:RequiredGemAtlasPath
  if (Test-Path -LiteralPath $requiredAssetPath) {
    Write-AGStatus -Level Success -Message "Found required game atlas asset: /$($script:RequiredGemAtlasPath)"
  } else {
    Write-AGStatus -Level Error -Message "Missing required game atlas asset: /$($script:RequiredGemAtlasPath)"
    $ok = $false
  }

  $htmlFiles = foreach ($contentPath in $script:HtmlSearchPaths) {
    $fullPath = Join-Path $RepoRoot $contentPath
    if (Test-Path -LiteralPath $fullPath) {
      if ((Get-Item -LiteralPath $fullPath).PSIsContainer) {
        Get-ChildItem -LiteralPath $fullPath -Recurse -Filter '*.html' -File
      } else {
        Get-Item -LiteralPath $fullPath
      }
    }
  }

  foreach ($htmlFile in $htmlFiles) {
    $html = Get-Content -LiteralPath $htmlFile.FullName -Raw
    if ($html -match '/assets/svg/gems-atlas\.svg') {
      Write-AGStatus -Level Info -Message "Gem atlas reference found in $($htmlFile.FullName)"
      if (-not (Test-Path -LiteralPath $requiredAssetPath)) {
        Write-AGStatus -Level Error -Message "Referenced gem atlas does not exist for $($htmlFile.FullName)"
        $ok = $false
      }
    }
  }

  return $ok
}

function Start-AGLocalPreview {
  [CmdletBinding()]
  param(
    [Parameter(Mandatory)][string]$RepoRoot,
    [ValidateSet('dev', 'preview')]
    [string]$Mode = 'dev'
  )

  Push-Location -LiteralPath $RepoRoot
  try {
    if ($Mode -eq 'preview') {
      Write-AGStatus -Level Info -Message 'Starting npm run preview...'
      npm run preview
    } else {
      Write-AGStatus -Level Info -Message 'Starting npm run dev...'
      npm run dev
    }
  } finally {
    Pop-Location
  }
}

function Invoke-AmazingGraceValidation {
  [CmdletBinding()]
  param(
    [string]$RepoRoot,
    [switch]$SkipAdminCheck,
    [switch]$IncludeEnvironmentChecks
  )

  Set-AGMatrixTheme
  $root = Get-AGRepoRoot -RepoRoot $RepoRoot
  Write-AGStatus -Level Info -Message "Running Amazing Grace toolkit checks in $root"

  $results = [ordered]@{}

  if (-not $SkipAdminCheck) {
    $results.Admin = Test-AGWindowsAdmin
  }

  if ($IncludeEnvironmentChecks) {
    $results.Environment = Test-AGEnvironmentReadiness
  }

  $results.GitHubPages = Test-AGGitHubPagesReadiness -RepoRoot $root
  $results.Domain = Test-AGCustomDomain -RepoRoot $root
  $results.Manifest = Test-AGManifestConfiguration -RepoRoot $root
  $results.GameAssets = Test-AGGameAssetReferences -RepoRoot $root

  $failed = @($results.GetEnumerator() | Where-Object { -not $_.Value })
  if ($failed.Count -eq 0) {
    Write-AGStatus -Level Success -Message 'All selected checks passed.'
    return $true
  }

  $failedChecks = ($failed | ForEach-Object { $_.Key }) -join ', '
  Write-AGStatus -Level Error -Message "Checks failed: $failedChecks"
  return $false
}

function Invoke-AGWindowsMaintenance {
  [CmdletBinding()]
  param([string]$RepoRoot)

  $root = Get-AGRepoRoot -RepoRoot $RepoRoot
  Set-AGMatrixTheme

  $null = Test-AGWindowsAdmin
  if (-not (Test-AGEnvironmentReadiness)) {
    throw 'Environment readiness checks failed.'
  }

  Push-Location -LiteralPath $root
  try {
    Write-AGStatus -Level Info -Message 'Running npm ci...'
    npm ci
    Write-AGStatus -Level Info -Message 'Running npm test -- --passWithNoTests...'
    npm test -- --passWithNoTests
    Write-AGStatus -Level Info -Message 'Running npm run build...'
    npm run build
    Write-AGStatus -Level Success -Message 'Windows maintenance workflow completed.'
  } finally {
    Pop-Location
  }
}

Export-ModuleMember -Function @(
  'Get-AGRepoRoot',
  'Set-AGMatrixTheme',
  'Write-AGStatus',
  'Test-AGWindowsAdmin',
  'Test-AGEnvironmentReadiness',
  'Test-AGGitHubPagesReadiness',
  'Test-AGCustomDomain',
  'Test-AGManifestConfiguration',
  'Test-AGGameAssetReferences',
  'Start-AGLocalPreview',
  'Invoke-AmazingGraceValidation',
  'Invoke-AGWindowsMaintenance'
)
