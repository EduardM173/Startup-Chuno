$ErrorActionPreference='Stop'
docker compose exec -T clientes node scripts/bootstrap-clientes.mjs
if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear administrador' }
docker compose exec -T sandbox node scripts/bootstrap-sandbox.mjs
docker compose exec -T -e BASE_URL=http://web clientes node scripts/seed.mjs --api-only
if ($LASTEXITCODE -ne 0) { throw 'Inicialización incompleta' }
