# start-gemini.ps1
param(
    [string]$Model = "gemini-3.1-pro-preview"
)

# 1. Background npm update check
try {
    npm install -g @google/gemini-cli@latest --quiet
} catch {
    # Fail silently if offline or restricted
}

# 2. Write / update local settings.json configuration
$settingsPath = "$env:USERPROFILE\.gemini\settings.json"
$settingsDir  = Split-Path -Parent $settingsPath

if (-not (Test-Path $settingsDir)) {
    New-Item -ItemType Directory -Path $settingsDir -Force | Out-Null
}

$config = @{
    "model" = $Model
} | ConvertTo-Json

Set-Content -Path $settingsPath -Value $config -Force

# 3. Launch Gemini CLI
gemini --model $Model $args
