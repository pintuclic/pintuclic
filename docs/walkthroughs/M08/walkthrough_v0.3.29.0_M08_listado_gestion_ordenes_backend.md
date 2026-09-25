# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión:** `v0.3.29.0` *(propuesta: subir el 3.er segmento, «Minor», desde `0.3.28.0`; la aplica el usuario en `.github/version.txt` según la guía de versionado)*
* **Módulo de Origen:** `M08 - Orden de venta`
* **Fecha y Autor:** `24/09/2026` · `Manuel (Manuel151025), con apoyo de Agente de IA (backend)`
* **Estado de la Implementación:** `⚠️ PARCIAL CON DEPENDENCIAS` (consultas completas; creación de órdenes y ciclo de estados bloqueados por el modelo de datos)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

Criterios tomados de los Issues de la épica **#28**, en su versión actualizada del **23/09/2026** («Respuesta de definiciones M08 v1.0», D01–D08).

| ID Historia | Título | Cambio en esta versión | Endpoint |
| :--- | :--- | :--- | :--- |
| **HU-ORD-05** (#155) | Gestión de órdenes por personal autorizado | **Nuevo:** listado del personal con filtros | `GET /api/ordenes/gestion?codigo=&estado=&desde=&hasta=&cliente=&pagina=&limite=` |
| **HU-ORD-07** (#182) | Sección de pedidos del cliente | **Ajuste:** `enviado` pasa a finalizados (Despachado cierra el pedido, D02) | `GET /api/ordenes/mis-pedidos` |

Siguen disponibles, sin cambios: `GET /api/ordenes/mis-pedidos/:codigo` (HU-ORD-04) y `GET /api/ordenes/gestion/:codigo` (HU-ORD-05).

### Descripción del Alcance de la Versión

El personal con «Revisar órdenes» (`ventas.ver`) ya puede consultar el listado de órdenes y filtrarlo por identificador, estado, periodo y cliente, con paginación. Es la parte de la actualización del 23/09 que puede construirse sin cambiar el modelo de datos. El resto de lo definido ese día (estados nuevos, historial, código PC, copia histórica completa) necesita cambios en tablas compartidas, detallados en la sección 5.C.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **Filtros del personal (CA-ORD-05-04):** cada filtro es opcional y se valida por separado. Si llegan varios, se combinan con AND. No se añaden campos ni combinaciones obligatorias que los criterios no piden.
  - `codigo`: coincidencia parcial sin distinguir mayúsculas sobre el código visible, con los comodines del usuario escapados.
  - `estado`: uno de los valores que hoy admite `enum_estado_orden`; cualquier otro responde 400.
  - `desde` / `hasta`: fechas `AAAA-MM-DD` sobre `orden.fecha`, **con ambos extremos incluidos**. La HU pedía dejar precisados en el contrato la fecha usada y el tratamiento de los extremos; esta es la decisión tomada. Un inicio posterior al final responde 400.
  - `cliente`: `id_usuario` del titular. El identificador lo aporta la búsqueda de clientes de M17 (HU-ADM-04).
- **Paginación:** página 1 y 20 órdenes por defecto, máximo 100, con `total` y `total_paginas` (mismo criterio que M02).
- **Orden:** más recientes primero, con desempate estable por id interno.
- **Clasificación de Mis pedidos:** `enviado` se trata como Despachado y pasa a finalizados (CA-ORD-07-01, escenario 2). ⚠️ La equivalencia `enviado` = Despachado queda por confirmar hasta que se alinee el enum.

### B. Decisión de Diseño
- **Lista de estados en el DTO con comprobación de exhaustividad:** si `EnumEstadoOrden` cambia en `core/db/types.ts`, la compilación falla hasta actualizar la lista. El cambio de estados no puede pasar desapercibido.
- **SQL parametrizado:** se verificó el SQL generado con un conector sin base de datos. Todos los valores viajan como parámetros (`$1…$n`), y el periodo se compara como `date` para no depender de la zona horaria.

### C. Políticas Transversales Validadas
- 🛡️ **M17 / M20 (`HU-ADM-03`, `HU-SEG-03`):** el listado exige sesión vigente y el permiso `ventas.ver`, resueltos en vivo en cada petición. «Gestión de pedidos» (`ventas.gestionar`) incluye `ventas.ver` por dependencia de M17.
- 👁️ **M20 (`HU-SEG-06`):** cada orden del listado devuelve solo código, fecha, total, estado e id del cliente; ni id interno ni datos de pago.
- 🆔 **`HU-CUE-08`:** no aplica.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN (definiciones del 23/09/2026)

Resumen: **7 cumplidos · 7 parciales · 16 bloqueados.** Frente a la versión anterior (8 · 6 · 16) se añadió el listado del personal, pero varios criterios ahora exigen más. Por ejemplo, CA-ORD-06-01 pide el formato `PC-AAAA-NNNNN` y CA-ORD-07-01 distingue la recogida. Las consultas SQL **no se han validado aún contra PostgreSQL real**.

| CA | Resumen del criterio | Resultado | Motivo o método |
| :--- | :--- | :---: | :--- |
| **CA-ORD-01-01** #110 | Orden única al confirmar el pago, relacionada con su SOL | ⛔ | Bloqueos 3 y 4 |
| **CA-ORD-01-02** #113 | Sin confirmación no hay orden | ⛔ | Bloqueo 3 |
| **CA-ORD-01-03** #115 | Verificación manual equivalente a la pasarela | ⛔ | Bloqueo 3 (permiso «Verificación de pagos» de M07) |
| **CA-ORD-01-04** #117 | Origen cotización y producto desactivado después | ⛔ | Depende de la creación de la orden |
| **CA-ORD-01-05** #417 | Confirmación repetida no duplica | ⛔ | Depende de la creación (`transaccion_pago_id UNIQUE` ya existe) |
| **CA-ORD-01-06** #418 | Recuperar la compra si falla tras el cobro | ⛔ | Bloqueo 3 |
| **CA-ORD-02-01** #124 | Copia de nombre, variante, color solicitado, precio y cantidad | ⚠️ | Lectura cumplida; falta columna de color y la copia al crear |
| **CA-ORD-02-02** #125 | Precio de partida y cada descuento por línea | ⛔ | Bloqueo 5 |
| **CA-ORD-02-03** #126 | Importe acordado de la cotización | ⚠️ | Lectura cumplida; la copia ocurre al crear |
| **CA-ORD-02-04** #419 | Datos presentes tras desactivar el producto | ✅ | Detalle leído solo de `linea_orden` (`m08.test.ts`) |
| **CA-ORD-02-05** #420 | IVA congelado de la solicitud | ⛔ | Bloqueo 5 |
| **CA-ORD-03-01** #131 | Estados y automatismos del ciclo | ⛔ | Bloqueos 1 y 2; P1/P2 abiertos |
| **CA-ORD-03-02** #134 | Falta de disponibilidad visible por línea | ⛔ | Bloqueo 6 (compartido con M09) |
| **CA-ORD-03-03** #136 | Cierre por recogida o domicilio | ⛔ | Bloqueos 1, 2 y 5 (modo de entrega) |
| **CA-ORD-03-04** #421 | Evento, autor y fecha por transición; 3 correos | ⛔ | Bloqueo 2 |
| **CA-ORD-03-05** #422 | Cancelación con rastro de resolución externa | ⛔ | Bloqueos 1 y 2; política M11 pendiente |
| **CA-ORD-04-01** #150 | Detalle con descuentos, entrega e historia de estados | ⚠️ | Productos, precios, total y estado cumplidos; faltan descuentos, entrega e historia |
| **CA-ORD-04-02** #152 | Color solicitado en el detalle | ⚠️ | Solo el texto de `variante_copia` |
| **CA-ORD-04-03** #423 | Acceso ajeno rechazado | ✅ | 404 indistinguible y registro M20 (`m08.test.ts`) |
| **CA-ORD-04-04** #424 | Producto retirado con nota | ⚠️ | Datos y sin enlace; la nota requiere saber qué variante era |
| **CA-ORD-05-01** #176 | Gestión de pedidos opera transiciones válidas | ⛔ | Bloqueo 1 |
| **CA-ORD-05-02** #177 | Revisar órdenes consulta pero no opera | ⚠️ | Escenario 1 cumplido (listado y detalle con `ventas.ver`); el 2 se verifica cuando exista la operación |
| **CA-ORD-05-03** #178 | Sin permisos no consulta | ✅ | Guarda `requierePermiso('ventas.ver')` de M20 en las dos rutas |
| **CA-ORD-05-04** #425 | Identificador, estado, periodo y cliente | ✅ | Los 4 escenarios en `m08.test.ts`; falta validación en PostgreSQL |
| **CA-ORD-06-01** #180 | `PC-AAAA-NNNNN`, estable y relacionado con SOL | ⛔ | Bloqueos 3 y 4; el `UNIQUE` ya garantiza que no se repita |
| **CA-ORD-06-02** #181 | Identificador inequívoco | ✅ | `UNIQUE` + búsqueda exacta (`m08.test.ts`) |
| **CA-ORD-06-03** #426 | No reutilizar el de una cancelada | ⛔ | Bloqueo 4 |
| **CA-ORD-07-01** #183 | En curso / finalizadas por modalidad y acceso al detalle | ⚠️ | Escenarios 1, 2 y 4 cumplidos; el 3 (recogida) necesita el modo de entrega |
| **CA-ORD-07-02** #184 | Entregado entre finalizados | ✅ | `m08.test.ts` |
| **CA-ORD-07-03** #427 | Buscador de Mis pedidos | ✅ | `m08.test.ts` |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **M20:** `guardas.sesionVigente()`, `guardas.requierePermiso('ventas.ver')` y registro de accesos denegados.
- **M17:** permiso `ventas.ver` concedido al personal y dependencia `ventas.gestionar → ventas.ver`; búsqueda de clientes para obtener el `id_usuario` del filtro.
- **Base de datos:** tablas `orden` y `linea_orden` actuales. Esta versión no cambia el esquema.

### B. Dependencias Hacia Adelante
- **Frontend M08:** puede construir la bandeja de órdenes del panel con filtros y paginación.
- **M17 (HU-ADM-04):** la ficha del cliente puede listar sus órdenes con `?cliente=<id>`.

### C. ⛔ Bloqueos Pendientes (cambios en archivos compartidos → Líder Técnico)
Lo desbloqueado el 23/09 es la **definición funcional**. La épica #28 deja al líder técnico «Modelo y enum reconciliados con las transiciones definidas; permisos e historial persistente validados», y hoy el modelo no lo refleja:

1. **Enum de estados:** `enum_estado_orden` sigue siendo `pendiente, pagado, en_preparacion, enviado, entregado, cancelado`. #128 define Orden confirmada, Revisión de disponibilidad, En preparación, Preparada, Despachado, Entregado, Cancelado y Devuelto. El valor por defecto `pendiente` contradice que no exista orden sin pago.
2. **Historial de transiciones:** no hay tabla para estado, autor, fecha/hora y motivo de cada cambio (#421, #131, #136). Tampoco hay persistencia de auditoría (HU-SEG-04 en pausa).
3. **Solicitud y pago:** no existe la solicitud `SOL-AAAA-NNNNN` de M07 ni su relación con la orden. `pagos.id_orden` es `NOT NULL`, así que un pago no puede existir antes que su orden. El permiso «Verificación de pagos» no está en el seed.
4. **Código PC:** falta el consecutivo continuo para `PC-AAAA-NNNNN`, con año de Colombia y sin reutilización. #179 deja la protección concurrente al líder técnico. El seed usa `ORD-2026-0001`.
5. **Copia histórica:** faltan en `linea_orden` el color solicitado, el precio de partida y los descuentos (origen, %, importe y orden). En `orden` faltan base sin IVA, importe y tasa de IVA, y modo y costo de entrega.
6. **Disponibilidad por línea** (total, parcial o nula, con historial): no existe; es compartida con M09.
7. **Referencia a la variante en `linea_orden`** (sin clave foránea, por ADR-05): necesaria para la nota de producto retirado (#424).
8. **Columna `carrito_o_cotizacion`** (añadida el 23/09): se solapa con `origen`, y el seed usa `carrito_directo` y `cotizacion_aprobada`. Hay que aclarar su propósito antes de usarla.

**Pendientes del analista (#28):** P1 (En preparación → Preparada), P2 (corrección desde Preparada), P3 (pago tardío tras descartar la solicitud), P4 (solicitudes SOL en Mis pedidos) y P5 (etiqueta visible de Devuelto), además de la política de cancelación/devolución de M11.

### ⚠️ Limitaciones Conocidas
1. **Sin validar contra PostgreSQL real:** las consultas del listado se verificaron generando su SQL sin base de datos; falta ejecutarlas contra datos.
2. **El filtro de estado usa los estados provisionales.** Cambiará cuando se actualice el enum; la lista del DTO obliga a hacerlo.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/interfaces/m08.interfaces.ts` | `FiltrosGestionOrdenes`, `FilaResumenOrdenGestion`, `ResumenOrdenGestion`, `PaginaOrdenesGestion`. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/dtos/ordenes.dto.ts` | `ListarOrdenesGestionDto` y lista de estados con comprobación de exhaustividad. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/repositories/ordenes.repository.ts` | `listarParaPersonal`, `contarParaPersonal` y base de filtros. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/services/ordenes.service.ts` | `listarOrdenesParaPersonal` con paginación; `enviado` pasa a finalizados. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/controllers/ordenes.controller.ts` | Handler `listarOrdenesGestion` y traducción de filtros. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/m08.routes.ts` | Ruta `GET /gestion` con `ventas.ver`. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/__tests__/m08.test.ts` | +12 pruebas (30/30 en total). |
| **[NUEVO]** | `docs/walkthroughs/M08/walkthrough_v0.3.29.0_M08_listado_gestion_ordenes_backend.md` | Este documento. |

Todos los archivos de código pertenecen al módulo M08. Sin cambios en archivos compartidos. Según la regla actual de AGENTS.md, esta entrega no añade entrada en `docs/CHANGELOG.md`.

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (`tsc --noEmit` limpio, `npm run lint` limpio, 30/30 pruebas en memoria con `npx tsx src/modules/m08-ordenes/__tests__/m08.test.ts`)
* **SQL generado revisado:** `✅ SÍ` (consultas parametrizadas, filtros con AND y periodo con extremos incluidos)
* **Validación contra PostgreSQL real:** `❌ PENDIENTE`
* **Versión:** `⚠️ Pendiente de que el usuario suba .github/version.txt a 0.3.29.0`
