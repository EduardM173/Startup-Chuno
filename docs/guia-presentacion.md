# Guía de presentación CHUNO


## Preparación

1. Ejecutar `./scripts/configure.ps1`, `docker compose up --build -d` y `./scripts/seed.ps1`.
2. Abrir http://localhost:8080 y confirmar `docker compose ps` con ocho servicios saludables.
3. Mostrar las cinco bases de negocio y sandbox_db, con usuarios distintos. Presentar `docs/evidencias/aislamiento-bases.txt`: seis accesos propios y 30 conexiones cruzadas rechazadas.
4. Identificar la advertencia SANDBOX. Ninguna operación externa mueve dinero real.

## MVP Clientes y acceso

Ingresar como `admin@chuno.demo` / `AdminChuno2026!`. ADMIN no tiene ficha de cliente ni cuentas propias. Crear un cliente ficticio con documento y correo nuevos, sin cuenta ni acceso digital. Buscarlo, abrir el detalle, modificar contacto y habilitar usuario mediante una contraseña temporal de al menos diez caracteres. Mostrar sus cuentas, préstamos y acceso en el mismo detalle; las listas provienen de cada API.

Ingresar con ese acceso temporal. Verificar que solo se permite cambiar contraseña antes de operar. Cambiarla y volver a ingresar. El cliente solo puede editar teléfono y dirección. Como ADMIN, bloquear el acceso y verificar que la sesión emitida previamente falla; observar que la cuenta bancaria conserva su estado.

## MVP Cuentas y caja

Como ADMIN, abrir cuenta para el cliente registrado. Comprobar saldo cero y número generado. Abrir su detalle; realizar depósito de Bs. 200 con concepto identificable y retirar Bs. 50. Mostrar saldo Bs. 150, dos movimientos, actor y fecha en la API. Intentar retiro superior al saldo: debe rechazarse.

El saldo y número no se editan en el formulario de cuenta. Bloquear una cuenta impide operaciones ordinarias. Retirar el saldo restante, cerrar la cuenta y comprobar que se conserva el historial. Cuando no haya préstamos ni operaciones pendientes, dar de baja al cliente; con una cuenta abierta o saldo la baja debe fallar.

## MVP Pagos

Para la instalación nueva, Valeria inicia con `valeria@chuno.demo` / `Temporal2026!` y debe cambiarla. En la instancia de entrega verificada, usar `ValeriaChuno2026!`. Diego y Camila conservan `Temporal2026!` mientras no hayan cambiado su contraseña.

Seleccionar un proveedor, consultar `DEMO-002` que aún no esté pagada, elegir cuenta origen y revisar los datos. Confirmar; mostrar estado CONFIRMADO y referencia externa en el comprobante. Revisar saldo disponible e historial. Intentar pagar la misma obligación con otra clave: debe fallar. Para un rechazo usar `REJECT`; la reserva debe liberarse. Para incertidumbre usar `TIMEOUT`; observar PENDIENTE, consultar/reconciliar y confirmar que solo existe un débito.

Las pruebas automatizadas crean referencias exclusivas por ejecución; las referencias DEMO pueden consumirse durante una presentación. Consultar otro proveedor si una factura ya fue pagada. El seed no borra pagos ni vuelve a habilitar deudas pagadas.

## MVP Transferencias

1. Entre propias: desde la primera cuenta de Valeria hacia el número de su segunda cuenta, Bs. 10. Mostrar débito y crédito y comprobar el total consolidado.
2. Tercero CHUNO: introducir el número de Diego obtenido en el listado ADMIN. Validar el nombre limitado del beneficiario y transferir Bs. 10. Comprobar movimiento de origen y destino.
3. Interbancaria: BANCO-DEMO, cuenta `900000001`. Validar `Beneficiario Académico`, confirmar y mostrar referencia sandbox. La cuenta `900000002` rechaza; `900000003` produce respuesta incierta y permite reconciliar.
4. En caso de duda, abrir historial y consultar el comprobante. No volver a iniciar otra intención para reemplazar un pendiente.

## MVP Préstamos

Como CLIENTE, solicitar Bs. 1.200, tasa anual 0%, plazo 12 meses. La cuota estimada debe ser Bs. 100. Consultar y editar la solicitud inicial. Como ADMIN, pasar a EN REVISION, aprobar o rechazar y mostrar las restricciones posteriores. Crear otra solicitud y cancelarla antes de aprobación. Explicar que APROBADO conserva una obligación y no desembolsa dinero.

## Evidencias técnicas

Mostrar `/api/clientes/docs/`, `/api/cuentas/docs/`, `/api/pagos/docs/`, `/api/transferencias/docs/` y `/api/prestamos/docs/`. Relacionar los endpoints con las historias y la matriz. Presentar las salidas de pruebas reales, en especial doble débito concurrente, reservas durante timeout y persistencia tras reinicio. No repetir toda la batería durante la defensa si ya se dispone de evidencia.
