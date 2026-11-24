# Registro de almacenamiento de la entrega

Medición del 24/11/2026. Tamaños en MB/GB decimales. Este registro es operativo; el informe académico corresponde a otro integrante.

| Medida | Antes | Después |
|---|---:|---:|
| Espacio libre en C | 338.241.396.736 bytes | 330.694.565.888 bytes |
| Directorio del proyecto | 27.329 bytes | 1.063.972.332 bytes |
| Caché pip preexistente | 130.868.373 bytes | 130.868.373 bytes |
| Pagefile asignado | 18.253.611.008 bytes | 18.253.611.008 bytes |
| Memoria comprometida | 15.591.567.360 bytes | 26.532.081.664 bytes |

La carpeta incluye fuentes, evidencias, Git, paquete ZIP y herramientas locales. Las fuentes y evidencias para entrega ocupan aproximadamente 2,7 MB. Las seis imágenes backend comparten aproximadamente 1,115 GB de capas, por lo que no deben sumarse seis veces. La imagen web ocupa 92,8 MB, de los que la mayoría de capas se comparte con una imagen preexistente. El volumen PostgreSQL de CHUNO ocupa 120.324 KiB con los datos de demostración y pruebas.

Se eliminaron mediante identificadores precisos los 55 registros de caché Docker creados en esta tarea. Se conservaron los 334 registros anteriores; no se ejecutó una limpieza global de Docker ni se tocaron volúmenes existentes. El contenedor de verificación de inicialización limpia usó tmpfs y fue eliminado.

La diferencia de espacio libre total es 7.546.830.848 bytes. No puede atribuirse enteramente al tamaño de las fuentes ni al pagefile, cuya asignación no cambió. Docker mantiene su disco virtual y puede conservar espacio asignado tras liberar cachés. Su archivo docker_data.vhdx medía 27.473.739.776 bytes; no se midió su tamaño inicial y no se puede cuantificar con precisión su contribución al cambio de espacio libre. No se compactó ni modificó la configuración de Windows o Docker de otros proyectos.

## Rutas locales que permanecen

La revisión automática rechazó el borrado recursivo con el motivo genérico `blocked by policy`, incluso al especificar una ruta absoluta. No se intentó eludir ese bloqueo. Estos artefactos se excluyen de Git y del ZIP; la aplicación en Docker usa sus dependencias dentro de las imágenes.

Raíz exacta: `C:\Users\lalol\Documents\.Universidad\Aquitectura\1er Hackaton`.

| Ruta bajo esa raíz | Bytes | Uso |
|---|---:|---|
| .cache | 525.344.426 | npm temporal, caché de descargas y artefactos de validación |
| node_modules | 380.757.305 | Dependencias locales de desarrollo y pruebas |
| services/clientes/generated | 24.974.027 | Cliente Prisma local generado |
| services/cuentas/generated | 24.997.527 | Cliente Prisma local generado |
| services/pagos/generated | 24.879.538 | Cliente Prisma local generado |
| services/transferencias/generated | 24.879.628 | Cliente Prisma local generado |
| services/prestamos/generated | 24.905.602 | Cliente Prisma local generado |
| infrastructure/sandbox/generated | 24.912.613 | Cliente Prisma local generado |
| frontend/dist | 237.874 | Compilación local para validación |
| test-results | 45 | Metadatos de Playwright |

No hay entornos Python instalados para el proyecto ni descargas de navegadores. Se reutilizó Chrome. Los registros de medida son pequeños y están en `C:\Users\lalol\.codex\storage-audits\1er_Hackaton.jsonl`. La configuración privada `.env` permanece solo local; los datos persistentes permanecen en el volumen Docker `chuno_chuno-data`.
