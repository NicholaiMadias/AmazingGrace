[CmdletBinding()]
param(
  [string]$RepoRoot,
  [switch]$SkipAdminCheck,
  [switch]$IncludeEnvironmentChecks,
  [switch]$StartPreview,
  [ValidateSet('dev', 'preview')]
  [string]$PreviewMode = 'dev'
)

$modulePath = Join-Path $PSScriptRoot 'AmazingGrace.Tools.psm1'
Import-Module $modulePath -Force

$passed = Invoke-AmazingGraceValidation -RepoRoot $RepoRoot -SkipAdminCheck:$SkipAdminCheck -IncludeEnvironmentChecks:$IncludeEnvironmentChecks
if (-not $passed) {
  exit 1
}

if ($StartPreview) {
  $resolvedRoot = Get-AGRepoRoot -RepoRoot $RepoRoot
  Start-AGLocalPreview -RepoRoot $resolvedRoot -Mode $PreviewMode
}
