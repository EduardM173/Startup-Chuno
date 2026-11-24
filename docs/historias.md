# Historias de usuario

Prioridad de todas las historias: ALTA. Estado: IMPLEMENTADO Y VERIFICADO en entorno local académico. Las operaciones externas se verifican exclusivamente contra SANDBOX. Las evidencias y los nombres de las verificaciones ejecutadas se vinculan en cada historia.

## EP-01/HU-01-01 Registrar y mantener clientes
Como ADMIN, quiero registrar, buscar, consultar y modificar clientes sin crear cuentas ni usuarios, para mantener una identidad bancaria independiente.

Criterios de aceptación: Documento y correo únicos; entradas estrictas; consulta por documento; cambios auditados.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: clientes.
Implementación: services/clientes/src/main.mjs y frontend/src/modules/clientes/.
Endpoint: POST GET PATCH /clients; GET /clients/{id}. Pantalla: Clientes y detalle.
Prueba ejecutada: Alta de cliente; Consulta, búsqueda. Evidencia: 03-cliente-creado.png; 04-cliente-modificado.png.

## EP-01/HU-01-02 Habilitar y administrar acceso digital
Como ADMIN, quiero habilitar como máximo un usuario digital por cliente y restablecer su contraseña, para gestionar acceso sin conocer claves existentes.

Criterios de aceptación: Usuario opcional; sin registro público; hash oculto; bloqueo y restablecimiento revocan sesiones sin bloquear cuentas.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: clientes.
Implementación: services/clientes/src/main.mjs y frontend/src/modules/clientes/.
Endpoint: POST PATCH /clients/{id}/access. Pantalla: Detalle de cliente y acceso digital.
Prueba ejecutada: Habilitación única; Restablecer credenciales; Cuenta bloqueada. Evidencia: 09-cambio-temporal.png; pruebas-api.txt.

## EP-01/HU-01-03 Ingresar y cambiar contraseña temporal
Como CLIENTE, quiero iniciar sesión, sustituir la contraseña temporal, cambiar mi contraseña y cerrar sesión, para operar con credenciales propias.

Criterios de aceptación: JWT expira; cambio obligatorio en backend y frontend; token anterior revocado; errores de acceso explícitos.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: clientes.
Implementación: services/clientes/src/main.mjs y frontend/src/modules/clientes/.
Endpoint: POST /auth/login /auth/password /auth/logout. Pantalla: Login y cambio obligatorio.
Prueba ejecutada: Inicio de sesión; Habilitación única. Evidencia: 01-login.png; 09-cambio-temporal.png.

## EP-01/HU-01-04 Consultar perfil y actualizar contacto
Como CLIENTE, quiero consultar mi perfil y modificar solo teléfono y dirección, para mantener mi contacto sin alterar identidad legal.

Criterios de aceptación: No modifica CI, nombres legales, rol, estado ni recursos ajenos.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: clientes.
Implementación: services/clientes/src/main.mjs y frontend/src/modules/clientes/.
Endpoint: GET PATCH /me; GET /clients/{id}. Pantalla: Mi perfil.
Prueba ejecutada: Autorización: recursos ajenos. Evidencia: pruebas-api.txt.

## EP-01/HU-01-05 Baja lógica válida
Como ADMIN, quiero dar de baja clientes sin obligaciones pendientes, para conservar la trazabilidad e impedir nuevas operaciones.

Criterios de aceptación: Exige cuentas cerradas y ningún préstamo u operación pendiente; sesiones revocadas; datos históricos conservados.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: clientes.
Implementación: services/clientes/src/main.mjs y frontend/src/modules/clientes/.
Endpoint: DELETE /clients/{id}. Pantalla: Detalle de cliente.
Prueba ejecutada: Baja con obligaciones rechazada. Evidencia: 08-cliente-baja.png.

## EP-01/HU-01-06 Vista bancaria del cliente
Como ADMIN, quiero consultar cuentas, préstamos y acceso desde el detalle de un cliente, para gestionar al cliente con información de cada dominio.

Criterios de aceptación: Consulta APIs de Cuentas y Préstamos; no comparte tablas; datos del acceso sin hash.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: clientes.
Implementación: services/clientes/src/main.mjs y frontend/src/modules/clientes/.
Endpoint: GET /clients/{id}; cuentas GET /accounts; prestamos GET /loans. Pantalla: Detalle administrativo.
Prueba ejecutada: Recorridos reales ADMIN. Evidencia: 04-cliente-modificado.png.

## EP-02/HU-02-01 Abrir y consultar cuentas
Como ADMIN, quiero abrir múltiples cuentas para clientes registrados, para ofrecer productos de ahorro independientes.

Criterios de aceptación: Creación en cero; número generado único e inmutable; validación HTTP de cliente ACTIVO.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: cuentas.
Implementación: services/cuentas/src/main.mjs y frontend/src/modules/cuentas/.
Endpoint: POST GET /accounts; GET /accounts/{id}. Pantalla: Cuentas bancarias.
Prueba ejecutada: Abrir cuentas en cero. Evidencia: 05-cuenta-creada.png.

## EP-02/HU-02-02 Alias y estados de cuenta
Como CLIENTE y ADMIN, quiero editar alias y administrar estados autorizados, para identificar productos y detener operaciones ordinarias cuando corresponda.

Criterios de aceptación: CLIENTE solo alias propio; ADMIN bloquea/desbloquea; cuenta bloqueada no admite caja ni transferencias; saldo no editable.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: cuentas.
Implementación: services/cuentas/src/main.mjs y frontend/src/modules/cuentas/.
Endpoint: PATCH /accounts/{id}. Pantalla: Detalle de cuenta.
Prueba ejecutada: Saldo y número no son editables; Cuenta bloqueada. Evidencia: pruebas-api.txt.

## EP-02/HU-02-03 Depósitos y retiros de ventanilla
Como ADMIN, quiero registrar depósitos y retiros autorizados, para respaldar cada cambio de saldo con un movimiento.

Criterios de aceptación: Importe positivo; no sobregiro; actor y fecha; claves idempotentes; ningún cliente inventa depósitos.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: cuentas.
Implementación: services/cuentas/src/main.mjs y frontend/src/modules/cuentas/.
Endpoint: POST /accounts/{id}/cash. Pantalla: Depósitos y retiros.
Prueba ejecutada: Depósito y retiro; Autorización; Dos débitos concurrentes. Evidencia: 06-deposito.png; 07-retiro-historial.png.

## EP-02/HU-02-04 Saldo e historial propio
Como CLIENTE, quiero consultar mis cuentas, saldo disponible e historial, para conocer el origen de los fondos y movimientos.

Criterios de aceptación: Saldo disponible descuenta reservas; movimientos no se eliminan; no acceso ajeno; indicadores desde APIs.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: cuentas.
Implementación: services/cuentas/src/main.mjs y frontend/src/modules/cuentas/.
Endpoint: GET /accounts; GET /accounts/{id}/movements. Pantalla: Inicio, Mis cuentas y Movimientos.
Prueba ejecutada: Historial financiero cuadra; Autorización. Evidencia: 10-inicio-cliente.png; 11-cuentas-movimientos.png.

## EP-02/HU-02-05 Cerrar cuentas válidas
Como ADMIN, quiero cerrar cuentas sin dinero ni operaciones pendientes, para conservar el historial sin dejar obligaciones huérfanas.

Criterios de aceptación: Saldo cero; reservas cero; estado CERRADA persistente; operaciones posteriores rechazadas.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: cuentas.
Implementación: services/cuentas/src/main.mjs y frontend/src/modules/cuentas/.
Endpoint: DELETE /accounts/{id}. Pantalla: Detalle de cuenta.
Prueba ejecutada: Baja con obligaciones; Timeout de pago. Evidencia: 07-retiro-historial.png; pruebas-api.txt.

## EP-03/HU-03-01 Consultar obligaciones de servicios
Como CLIENTE, quiero seleccionar proveedor y consultar mi referencia por HTTP, para conocer el importe antes de confirmar.

Criterios de aceptación: Electricidad, agua, telefonía, gas e internet; obligación persistente sandbox; importe no inventado por frontend.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: pagos.
Implementación: services/pagos/src/main.mjs y frontend/src/modules/pagos/.
Endpoint: GET /catalog; GET /obligation. Pantalla: Pago de servicios.
Prueba ejecutada: Consultar deuda y pagar. Evidencia: 12-pago-servicio.png.

## EP-03/HU-03-02 Pagar y obtener comprobante
Como CLIENTE, quiero confirmar el pago desde una cuenta propia, para registrar la obligación y conservar evidencia verificable.

Criterios de aceptación: Valida propiedad y fondos; reserva; ejecuta HTTP; liquida o libera según resultado; evita doble pago; referencia externa.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: pagos.
Implementación: services/pagos/src/main.mjs y frontend/src/modules/pagos/.
Endpoint: POST /transactions; GET /transactions/{id}. Pantalla: Confirmación, comprobante e historial.
Prueba ejecutada: Consultar deuda y pagar; Pago sin fondos. Evidencia: 12-pago-servicio.png; pruebas-api.txt.

## EP-03/HU-03-03 Recuperar un pago incierto
Como CLIENTE y ADMIN, quiero consultar y reconciliar un pago pendiente, para evitar cargos duplicados o devoluciones sin fundamento.

Criterios de aceptación: Timeout conserva reserva; resultado persistente consultable; reconciliación idempotente incluso con cuenta bloqueada.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: pagos.
Implementación: services/pagos/src/main.mjs y frontend/src/modules/pagos/.
Endpoint: POST /transactions/{id}/reconcile. Pantalla: Comprobante pendiente.
Prueba ejecutada: Timeout de pago. Evidencia: pruebas-api.txt.

## EP-04/HU-04-01 Transferir entre cuentas propias
Como CLIENTE, quiero transferir entre mis cuentas de ahorro, para organizar mis fondos.

Criterios de aceptación: Verifica destino propio; no misma cuenta; débito y crédito en una única transacción; dos movimientos; comprobante.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: transferencias.
Implementación: services/transferencias/src/main.mjs y frontend/src/modules/transferencias/.
Endpoint: POST /transactions kind PROPIA. Pantalla: Transferencias propias.
Prueba ejecutada: Transferencias propias ACID; Rechazar misma cuenta. Evidencia: 13-transferencia-propia.png.

## EP-04/HU-04-02 Transferir a un tercero CHUNO
Como CLIENTE, quiero verificar un beneficiario y transferir a otro cliente, para enviar fondos con trazabilidad.

Criterios de aceptación: Beneficiario limitado; destino no propio; cuenta origen propia; actualización ACID en Cuentas.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: transferencias.
Implementación: services/transferencias/src/main.mjs y frontend/src/modules/transferencias/.
Endpoint: POST /transactions kind TERCERO; cuentas GET /beneficiary/{number}. Pantalla: Transferencias a terceros.
Prueba ejecutada: Transferencias propias ACID, tercero. Evidencia: 14-transferencia-tercero.png.

## EP-04/HU-04-03 Transferir a otro banco de prueba
Como CLIENTE, quiero validar banco y beneficiario y realizar una transferencia interbancaria, para demostrar integración externa real por HTTP.

Criterios de aceptación: Sandbox identificado; referencia externa única; reservas y estados definitivos o pendientes; no representa transferencia real.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: transferencias.
Implementación: services/transferencias/src/main.mjs y frontend/src/modules/transferencias/.
Endpoint: GET /catalog /beneficiary; POST /transactions kind INTERBANCARIA. Pantalla: Transferencias a otro banco.
Prueba ejecutada: Interbancaria aceptación y rechazo. Evidencia: 15-transferencia-interbancaria.png.

## EP-04/HU-04-04 Reintentar y recuperar transferencias
Como CLIENTE y ADMIN, quiero consultar historial y recuperar un resultado después de un fallo, para evitar doble débito y mantener integridad.

Criterios de aceptación: Misma key y contenido devuelve misma operación; huella distinta da 409; reinicio recupera estado; cuenta bloqueada liquida reserva previa.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: transferencias.
Implementación: services/transferencias/src/main.mjs y frontend/src/modules/transferencias/.
Endpoint: GET /transactions; POST /transactions/{id}/reconcile. Pantalla: Historial y comprobante.
Prueba ejecutada: Reintentos con misma clave; Reinicio durante resultado incierto. Evidencia: pruebas-api.txt.

## EP-05/HU-05-01 Solicitar y editar préstamo
Como CLIENTE, quiero crear, consultar y actualizar mi solicitud, para evaluar un préstamo con cuota estimada.

Criterios de aceptación: Importe válido; plazo 1 a 360; tasa anual hasta 60%; fórmula francesa Decimal y caso tasa cero; propiedad obligatoria.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: prestamos.
Implementación: services/prestamos/src/main.mjs y frontend/src/modules/prestamos/.
Endpoint: POST GET /loans; GET PATCH /loans/{id}. Pantalla: Mis préstamos.
Prueba ejecutada: CRUD de préstamos, cuota tasa cero. Evidencia: 16-prestamos.png; pruebas-api.txt.

## EP-05/HU-05-02 Revisar y decidir préstamos
Como ADMIN, quiero pasar solicitudes a revisión y aprobar o rechazar, para gestionar las decisiones de crédito.

Criterios de aceptación: Transiciones explícitas; aprobación solo desde revisión; finales inmutables; actor auditado; sin desembolso opcional.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: prestamos.
Implementación: services/prestamos/src/main.mjs y frontend/src/modules/prestamos/.
Endpoint: PATCH /loans/{id}. Pantalla: Préstamos administrativos.
Prueba ejecutada: CRUD de préstamos, cuota tasa cero. Evidencia: pruebas-api.txt.

## EP-05/HU-05-03 Cancelar solicitud válida
Como CLIENTE y ADMIN, quiero cancelar solicitudes antes de aprobación, para conservar historial sin permitir borrar obligaciones.

Criterios de aceptación: Baja lógica CANCELADO; préstamo aprobado no se cancela ni elimina; restricción de propiedad.

Prioridad: ALTA. Estado: IMPLEMENTADO Y VERIFICADO. Servicio: prestamos.
Implementación: services/prestamos/src/main.mjs y frontend/src/modules/prestamos/.
Endpoint: DELETE /loans/{id}. Pantalla: Detalle de préstamo.
Prueba ejecutada: CRUD de préstamos; Baja con obligaciones. Evidencia: pruebas-api.txt.
