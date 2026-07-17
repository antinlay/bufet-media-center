$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

Write-Host "Waiting for Docker Desktop..."
for ($attempt = 1; $attempt -le 60; $attempt++) {
  docker info *> $null
  if ($LASTEXITCODE -eq 0) {
    break
  }

  if ($attempt -eq 60) {
    throw "Docker Desktop did not become ready within 5 minutes."
  }

  Start-Sleep -Seconds 5
}

docker compose up -d
docker compose ps
