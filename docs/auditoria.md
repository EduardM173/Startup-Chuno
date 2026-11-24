# Auditoría final

## Revisión funcional

Se contrastaron las cinco capacidades del prompt y el complemento de 30 decisiones con APIs, pantallas y evidencias. Se separaron Usuario, Cliente y Cuenta dentro de sus dominios respectivos. Se corrigieron el alta que exigía acceso inmediato, la identidad de ADMIN como cliente, la edición de identidad legal por CLIENTE y el acceso sin reemplazar contraseña temporal.

La administración dispone de clientes, cuentas bancarias, caja, consulta de operaciones, préstamos y perfil. El cliente dispone de cuentas, movimientos, transferencias, pagos, préstamos y perfil. Cada alta comienza sin producto implícito y las cuentas parten en cero. El detalle de cliente consulta cuentas y préstamos por sus APIs.

Los cinco MVP están implementados con persistencia y verificación local. Los resultados reales se conservan en evidencias; las historias y la matriz detallan sus comprobaciones. Las integraciones se verificaron exclusivamente contra sandbox. La revisión del documento original del docente permanece NO VERIFICADA porque no fue proporcionado.

## Revisión técnica

Se verificaron restricciones SQL de saldos, reservas, estados e identidades; bloqueo ordenado de cuentas; idempotencia por clave y huella; débito y crédito internos en una transacción; reservas y liquidaciones externas; protección de rutas internas; revocación de JWT y autorización por propiedad. Se añadieron actores a movimientos y auditoría administrativa por dominio.

Los 30 accesos cruzados entre bases se rechazaron. Se probó la caída del sandbox y la recuperación tras reinicios. Se corrigieron la lectura Prisma de la función SQL de bloqueo y la resolución DNS del gateway tras recreación de contenedores. El script de inicialización PostgreSQL usa LF e inicialización idempotente para conservar volúmenes existentes. No se publicaron puertos de base de datos ni secretos.

Los permisos y estados se aplican en backend. Un cliente no puede crear saldo, modificar rol o identidad legal, ordenar caja ni consultar cuentas ajenas. ADMIN puede consultar operaciones y reconciliarlas, pero no ordenar pagos/transferencias en nombre de otra persona. Las reservas previas pueden liquidarse internamente aun si una cuenta se bloquea posteriormente.

## Límites de la verificación

No se certifica una plataforma bancaria de producción. No se dispone de API externa autorizada, plantilla oficial ni documento original. No se implementa desembolso opcional. La reconciliación es explícita. La creación de recursos y la baja de clientes dependen de validaciones HTTP entre dominios; este alcance no implementa un protocolo global de bloqueo de identidad entre servicios. Una implantación con administración concurrente intensiva requeriría reforzar ese control de ciclo de vida. Los fondos y sus movimientos sí quedan protegidos por transacciones y restricciones locales.

Las herramientas de validación y sus cachés temporales no forman parte del paquete fuente. El almacenamiento y cualquier temporal restante se reportan en docs/almacenamiento.md al cierre.
