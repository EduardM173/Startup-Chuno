$ErrorActionPreference='Stop'
& "$env:USERPROFILE\.codex\tools\Measure-ProjectStorage.ps1" -ProjectPath (Split-Path $PSScriptRoot -Parent) -Stage before
$env:COMPOSE_PARALLEL_LIMIT='1'
docker compose build
if ($LASTEXITCODE -ne 0) { throw 'La compilación falló' }
& "$env:USERPROFILE\.codex\tools\Measure-ProjectStorage.ps1" -ProjectPath (Split-Path $PSScriptRoot -Parent) -Stage after
