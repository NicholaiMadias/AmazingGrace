[CmdletBinding()]
param(
  [string]$RepoRoot,
  [ValidateSet('dev', 'preview')]
  [string]$Mode = 'dev'
)

$modulePath = Join-Path $PSScriptRoot 'AmazingGrace.Tools.psm1'
Import-Module $modulePath -Force

$resolvedRoot = Get-AGRepoRoot -RepoRoot $RepoRoot
Set-AGMatrixTheme
Start-AGLocalPreview -RepoRoot $resolvedRoot -Mode $Mode
