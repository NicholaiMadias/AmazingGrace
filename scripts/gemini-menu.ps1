# gemini-menu.ps1
# Nexus Control Console & Gemini CLI Launchpad

$script:activeToolMode = "CLI_DISPATCH"
$script:appsScriptUrl  = "$script:appsScriptUrl = "https://script.google.com/macros/s/AKfycbwowTISiNVkyVVKeTdFiJtbTdYHugKwvm6p2V3Ja3QKzUu3aAIFe-G-7BItr5gMGGR3MQ/exec" # Set in Google Secret Manager or Environment Variable

function Write-ConsoleLog {
    param(
        [string]$Message,
        [string]$Type = "INFO"
    )
    $timestamp = (Get-Date).ToString("HH:mm:ss")
    switch ($Type) {
        "ERROR"   { Write-Host "[$timestamp] [FAILED] $Message" -ForegroundColor Red }
        "SUCCESS" { Write-Host "[$timestamp] [SUCCESS] $Message" -ForegroundColor Green }
        "MODE"    { Write-Host "[$timestamp] [SHIFT] $Message" -ForegroundColor Magenta }
        default   { Write-Host "[$timestamp] [SYSTEM] $Message" -ForegroundColor Cyan }
    }
}

function Show-ToolModeMenu {
    Write-Host "`n--- Select Tool Mode ---" -ForegroundColor Yellow
    Write-Host "1. Anti-Gravity Dispatch (ANTIGRAVITY)"
    Write-Host "2. Gemini CLI Command (CLI_DISPATCH)"
    Write-Host "3. Drive State Sync (DRIVE_SYNC)"
    $modeChoice = Read-Host "Choose mode [1-3]"
    
    switch ($modeChoice) {
        "1" { $script:activeToolMode = "ANTIGRAVITY" }
        "2" { $script:activeToolMode = "CLI_DISPATCH" }
        "3" { $script:activeToolMode = "DRIVE_SYNC" }
        default { Write-ConsoleLog "Invalid choice. Retaining $script:activeToolMode." "ERROR" }
    }
    Write-ConsoleLog "Switched active mode to: $script:activeToolMode" "MODE"
}

function Test-GitHubProxy {
    Write-ConsoleLog "Connecting to Google Apps Script GitHub proxy..."
    if ($script:appsScriptUrl -eq "YOUR_APPS_SCRIPT_WEB_APP_URL") {
        Write-ConsoleLog "GitHub Proxy URL not set. Please set appsScriptUrl variable." "ERROR"
        return
    }
    try {
        $body = @{ action = "PING"; command = "status" } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri $script:appsScriptUrl -Method Post -Body $body -ContentType "text/plain;charset=utf-8"
        Write-ConsoleLog "Connected to GitHub Proxy successfully." "SUCCESS"
    } catch {
        Write-ConsoleLog "Failed to connect to proxy: $_" "ERROR"
    }
}

function Show-GeminiNexus {
    Clear-Host
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host "           NEXUS CONTROL CONSOLE          " -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host " Active Mode: $script:activeToolMode" -ForegroundColor Magenta
    Write-Host "------------------------------------------"
    Write-Host "1. Launch Gemini CLI (Auto-Update)"
    Write-Host "2. Change Tool Mode (CLI / Anti-Gravity / Drive)"
    Write-Host "3. Connect / Test GitHub Dispatch Proxy"
    Write-Host "4. Force Check & Update Gemini CLI"
    Write-Host "5. Exit"
    Write-Host "------------------------------------------"
    $choice = Read-Host "Select an option [1-5]"

    switch ($choice) {
        "1" { 
            Write-ConsoleLog "Launching Gemini CLI in mode $script:activeToolMode..." "SUCCESS"
            if (Test-Path "$PSScriptRoot/start-gemini.ps1") {
                & "$PSScriptRoot/start-gemini.ps1"
            } else {
                gemini --model gemini-3.1-pro-preview
            }
        }
        "2" {
            Show-ToolModeMenu
            Read-Host "Press Enter to return to main menu..."
            Show-GeminiNexus
        }
        "3" {
            Test-GitHubProxy
            Read-Host "Press Enter to return to main menu..."
            Show-GeminiNexus
        }
        "4" { 
            Write-ConsoleLog "Updating Gemini CLI package..."
            npm install -g @google/gemini-cli@latest
            Read-Host "Update complete! Press Enter to return to main menu."
            Show-GeminiNexus
        }
        "5" { exit }
        default { Show-GeminiNexus }
    }
}

Show-GeminiNexus
