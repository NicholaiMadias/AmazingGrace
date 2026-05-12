[CmdletBinding()]
param([string]$RepoRoot)

$modulePath = Join-Path $PSScriptRoot 'AmazingGrace.Tools.psm1'
Import-Module $modulePath -Force

Invoke-AGWindowsMaintenance -RepoRoot $RepoRoot
