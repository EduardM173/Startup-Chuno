$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$envPath = Join-Path $projectRoot '.env'
if (Test-Path -LiteralPath $envPath) { Write-Output '.env existente conservado'; exit 0 }
function New-ChunoSecret { $bytes = New-Object byte[] 32; $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create(); $rng.GetBytes($bytes); $rng.Dispose(); return ([BitConverter]::ToString($bytes)).Replace('-','').ToLower() }
$lines = @('WEB_PORT=8080', 'SANDBOX_URL=http://sandbox:3000')
foreach ($key in @('POSTGRES_PASSWORD','JWT_SECRET','SERVICE_KEY','CLIENTES_DB_PASSWORD','CUENTAS_DB_PASSWORD','PAGOS_DB_PASSWORD','TRANSFERENCIAS_DB_PASSWORD','PRESTAMOS_DB_PASSWORD','SANDBOX_DB_PASSWORD')) { $lines += "$key=$(New-ChunoSecret)" }
[IO.File]::WriteAllLines($envPath, $lines)
Write-Output 'Configuración local generada. No subir .env a Git.'
