# CHUNO

Banca académica con **React + TypeScript + Express + Prisma + PostgreSQL**. Exactamente cinco microservicios de negocio: Clientes, Cuentas, Pagos, Transferencias y Préstamos. Nginx sirve el frontend y enruta las APIs. Un sandbox externo independiente simula proveedores y bancos mediante HTTP y persistencia propia.

## Iniciar en Windows

Requisitos: Docker Desktop con contenedores Linux y PowerShell. No se necesita instalar Node ni PostgreSQL en el host para ejecutar la aplicación.

```powershell
.\scripts\configure.ps1
docker compose up --build -d
.\scripts\seed.ps1
```

Abrir **http://localhost:8080**. Solo se publica la web en loopback; PostgreSQL no publica 5432 y conserva datos en el volumen `chuno_chuno-data`. No ejecutar `down -v` para reiniciar. Para parar: `docker compose stop`; para continuar: `docker compose start`.

Para medir almacenamiento durante la compilación en este equipo: `./scripts/build.ps1`. Para actualizar un servicio: `docker compose up -d --build --no-deps cuentas`. Cada servicio tiene Dockerfile, esquema Prisma, migraciones y aplicación propios; los clientes Prisma se generan dentro de la imagen. El gateway resuelve cambios de IP mediante DNS de Docker.

## Credenciales exclusivamente académicas

| Acceso | Correo | Contraseña inicial |
|---|---|---|
| Administrador sin ficha de cliente | admin@chuno.demo | AdminChuno2026! |
| Valeria con dos cuentas | valeria@chuno.demo | Temporal2026! |
| Diego con una cuenta | diego@chuno.demo | Temporal2026! |
| Camila con una cuenta | camila@chuno.demo | Temporal2026! |

Los clientes deben cambiar la contraseña temporal antes de operar. **En la instancia verificada de esta entrega, Valeria ya la cambió a `ValeriaChuno2026!` durante la prueba real de navegador.** Una instalación nueva comienza con Temporal2026!. El seed es idempotente y no restablece contraseñas ni saldos existentes. Para recuperar un acceso, ADMIN establece una nueva contraseña temporal desde el detalle del cliente.

Los saldos iniciales son depósitos identificados como APERTURA DEMO. Cada cuenta comienza en cero y tiene su movimiento de apertura. Los números se generan al crearla; consultar Mis cuentas o el listado ADMIN, no usar números fijos inventados.

## Datos externos de prueba

Proveedores: `luz`, `agua`, `telefono`, `gas`, `internet`. Referencias iniciales `DEMO-001` (Bs. 120,50), `DEMO-002` (Bs. 85), `REJECT` (rechazo) y `TIMEOUT` (respuesta perdida después de persistir aceptación). Las obligaciones pagadas no pueden pagarse otra vez. Banco: `BANCO-DEMO`, beneficiario `Beneficiario Académico`; cuentas `900000001` acepta, `900000002` rechaza, `900000003` produce timeout. El botón de reconciliación consulta el resultado persistido y liquida la reserva una sola vez.

No son bancos ni facturas reales. Para sustituir el sandbox, leer [contratos](docs/contratos.md) y configurar SANDBOX_URL y las credenciales del adaptador autorizado.

## Verificación

Las salidas reales y las capturas están en [docs/evidencias](docs/evidencias/). La batería API usa el runner nativo de Node y recorre las APIs completas. Playwright utiliza Chrome ya instalado, sin descargar otro navegador.

Con Node 24 y npm disponibles, la instalación opcional de herramientas de desarrollo es `npm ci`, y después:

```powershell
node --test --test-concurrency=1 tests/banking.test.mjs
node node_modules/@playwright/test/cli.js test
node scripts/audit-databases.mjs
```

Las pruebas crean datos ficticios propios, ejercitan movimientos monetarios de prueba y reinician servicios CHUNO. Se ejecutan en serie, excepto el caso que comprueba dos débitos concurrentes. No las ejecutar sobre datos de producción. `compose.dev.yml` permite montar fuentes durante desarrollo, sin alterar el despliegue normal.

## Entrega

- [Historias de usuario](docs/historias.md), agrupadas por cinco épicas.
- [Matriz de trazabilidad](docs/matriz-trazabilidad.md) y CSV editable.
- [Contratos API](docs/contratos.md); Swagger en `/api/{servicio}/docs/`.
- [Guía de presentación](docs/guia-presentacion.md).
- [Auditoría final](docs/auditoria.md) y resultados reales en evidencias.

Los cinco MVP están implementados para demostración local. El informe académico está a cargo de otro integrante. No hay integración financiera real ni desembolso de préstamos. La aprobación conserva la obligación; no acredita saldo. Las listas tienen un límite de 200 registros en la demostración.

Los secretos locales se generan en `.env` y se excluyen del repositorio. El token se guarda solo en memoria del navegador. El sistema no está publicado como banca de producción.
