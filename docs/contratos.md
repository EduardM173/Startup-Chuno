# Contratos HTTP

Base pública: `http://localhost:8080/api/{servicio}`. Las respuestas monetarias serializan Decimal como cadena. Los importes de entrada son cadenas positivas con máximo dos decimales; los plazos son enteros. JSON estricto rechaza campos no previstos. Los errores devuelven `{ "error": "detalle" }` con 401, 403, 404, 409, 422 o 503 según corresponda. Ningún error se convierte en éxito financiero.

Cada servicio expone `/health`, `/openapi.json` y `/docs/`. Las rutas de negocio exigen `Authorization: Bearer <token>`. Login es público y limitado a 20 peticiones por minuto. Las rutas `/internal/` requieren `X-Service-Key` y no son accesibles mediante Nginx.

| Servicio | Método y ruta | Entrada o resultado |
|---|---|---|
| Clientes | POST /auth/login | email, password; devuelve token y usuario sin hash |
| Clientes | POST /auth/logout | Revoca las sesiones del usuario |
| Clientes | POST /auth/password | current, password; obliga a volver a ingresar |
| Clientes | GET /me | Usuario, clientId opcional, rol y cambio obligatorio |
| Clientes | PATCH /me | phone, address y email de contacto del cliente autenticado (no cambia el login) |
| Clientes | GET /clients?q= | Búsqueda administrativa, máximo 200 |
| Clientes | POST /clients | document, names, surnames, email, phone, address; sin cuenta ni usuario |
| Clientes | GET/PATCH/DELETE /clients/{id} | Detalle, cambios permitidos o baja con verificaciones |
| Clientes | POST /clients/{id}/access | password temporal, email opcional; máximo un usuario |
| Clientes | PATCH /clients/{id}/access | status ACTIVO/BLOQUEADO/INACTIVO y/o password temporal |
| Cuentas | GET/POST /accounts | Listado propio o administrativo; alta ADMIN: clientId y alias |
| Cuentas | GET/PATCH/DELETE /accounts/{id} | Detalle, alias y estado ADMIN, cierre válido |
| Cuentas | GET /accounts/{id}/movements | Historial propio o ADMIN con actor, fecha e identificador |
| Cuentas | POST /accounts/{id}/cash | ADMIN: operationId UUID, kind DEPOSITO/RETIRO, amount y description |
| Cuentas | GET /beneficiary/{number} | Identificador de destino, nombre limitado y pertenencia propia |
| Pagos | GET /catalog | Cinco categorías de proveedores sandbox |
| Pagos | GET /obligation?provider=&reference= | Deuda real consultada por HTTP al sandbox |
| Pagos | GET/POST /transactions | Historial o pago nuevo, solo CLIENTE para creación |
| Transferencias | GET /catalog | Bancos de prueba |
| Transferencias | GET /beneficiary?bank=&account= | Beneficiario de prueba validado por HTTP |
| Transferencias | GET/POST /transactions | Historial o transferencia nueva, solo CLIENTE para creación |
| Pagos y Transferencias | GET /transactions/{id} | Comprobante persistido y referencia externa |
| Pagos y Transferencias | POST /transactions/{id}/reconcile | Recuperación idempotente de estado |
| Préstamos | GET/POST /loans | Listado y solicitud amount, rate, months, notes; ADMIN indica clientId |
| Préstamos | GET/PATCH/DELETE /loans/{id} | Consulta, edición/transición o cancelación válida |

## Petición de operación

```json
{
  "key": "UUID generado una sola vez por intención de operación",
  "accountId": "UUID de cuenta propia",
  "amount": "10.00",
  "kind": "PROPIA",
  "destination": "UUID de cuenta destino",
  "provider": "",
  "reference": "",
  "beneficiary": ""
}
```

Una transferencia propia utiliza PROPIA; una de terceros TERCERO. Para INTERBANCARIA, destination es la cuenta externa, provider el banco validado y beneficiary el nombre devuelto por validación. Para PAGO, provider y reference identifican una obligación consultada; amount debe coincidir con la deuda. La identidad se toma de la sesión, nunca del cuerpo. La misma key y mismo contenido devuelven la misma operación. Reutilizar key con contenido distinto devuelve 409. La creación devuelve 201 y un resultado persistido que puede ser PENDIENTE, CONFIRMADO, RECHAZADO o REVERTIDO; debe leerse el estado, no inferir éxito financiero por el código HTTP.

## Contratos internos

Clientes ofrece POST /internal/session y GET /internal/clients/{id}. Cuentas ofrece POST /internal/operations para TRANSFERENCIA o RESERVA; GET /internal/operations/{id}; POST /internal/operations/{id}/settle con confirm booleano; y consultas de cuentas y obligaciones. La operación interna exige UUID de operación y actor, cliente, cuenta y amount. Transferencia agrega destinationId. Estas rutas no aceptan un token de cliente como autorización interna.

El sandbox expone GET /providers, /banks, /beneficiary, /obligations, /operations/{id} y POST /operations. La ejecución exige id único, kind PAGO/INTERBANCARIA, amount, reference, provider y beneficiary. Un proveedor real debe ofrecer equivalentes de consulta por identificador e idempotencia antes de sustituir SANDBOX_URL. También deben configurarse credenciales por adaptador, TLS, validación de firma de respuestas y reglas contractuales del proveedor. Una API con resultados inciertos sin consulta de estado necesita una estrategia adicional; no debe declararse compatible solo por cambiar la URL.

El perfil devuelve contactEmail separado del email del usuario y lastAccess obtenido de auditorías INICIO_SESION persistidas. Los accesos anteriores a la introducción del registro no se reconstruyen artificialmente.
