$ErrorActionPreference = "Stop"

$startScript = Join-Path $PSScriptRoot "start-bufet.ps1"
$taskName = "BUFET home hosting"
$argument = "-NoProfile -ExecutionPolicy Bypass -File `"$startScript`""

Write-Host "Disabling sleep and hibernation while the PC is connected to AC power..."
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0

$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument $argument
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -RunLevel Highest `
  -Force | Out-Null

Write-Host "Scheduled task '$taskName' installed."
Write-Host "Also enable 'Start Docker Desktop when you sign in' in Docker Desktop settings."
