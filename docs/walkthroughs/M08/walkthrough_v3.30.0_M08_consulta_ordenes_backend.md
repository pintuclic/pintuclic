# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v3.30.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M08 - Orden de venta`
* **Fecha de Entrega:** `15/09/2026`
* **Autor / Responsable:** `Manuel (Manuel151025), con apoyo de Agente de IA (backend)`
* **Estado de la Implementación:** `⚠️ PARCIAL CON DEPENDENCIAS` (consultas implementadas; creación de órdenes y ciclo de estados bloqueados por el esquema de BD)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

Fuente de los criterios de aceptación: Issues de GitHub de la épica **#28 (EPICA 10 - M08)**, actualizados por el analista el 15/09/2026.

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-ORD-01** (#98) | Generación de la orden tras el pago confirmado | ⛔ Bloqueada | — |
| **HU-ORD-02** (#118) | Conservación histórica de los datos de la orden | ⚠️ Parcial (lectura) | Detalle de pedido (sin consultar el catálogo) |
| **HU-ORD-03** (#128) | Ciclo de vida y estados de la orden | ⛔ Bloqueada | — |
| **HU-ORD-04** (#148) | Consulta del detalle de un pedido | ⚠️ Parcial | `GET /api/ordenes/mis-pedidos/:codigo` |
| **HU-ORD-05** (#155) | Gestión de órdenes por personal autorizado | ⚠️ Parcial (consulta) | `GET /api/ordenes/gestion/:codigo` |
| **HU-ORD-06** (#179) | Identificación de la orden | ⚠️ Parcial | Código visible como único identificador expuesto |
| **HU-ORD-07** (#182) | Sección de pedidos del cliente | ✅ Cumplida | `GET /api/ordenes/mis-pedidos?q=` |

> ⚠️ **Rutas aún no montadas:** el router `ordenesRoutes` está listo en `m08.routes.ts`, pero registrarlo en `backend/src/app.routes.ts` como `/ordenes` requiere aprobación (archivo compartido). Las rutas indicadas asumen ese montaje.

### Descripción del Alcance de la Versión

Primera entrega del backend de M08, limitada a lo que el esquema de base de datos actual permite construir sin tocar archivos compartidos:

- **Cliente:** consulta su sección de pedidos separada en *en curso* y *finalizados*, con buscador por código o producto, y abre el detalle de un pedido propio usando su código visible.
- **Personal autorizado:** localiza cualquier orden por su código visible para atender a un cliente.

La creación de órdenes (HU-ORD-01), el avance de estados (HU-ORD-03 y la parte operativa de HU-ORD-05) y varios datos que exigen los nuevos criterios quedan **bloqueados**. Los motivos están en la sección 5.C.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **RF-ORD-06-01 / ADR-04:** el código visible (`codigo_visible`) es el único identificador que viaja al navegador. La clave primaria `id_orden` nunca se expone ni se acepta en la URL.
- **HU-ORD-02 / ADR-05:** el detalle se construye solo con la copia guardada en `linea_orden` (nombre, variante, precio aplicado, cantidad), sin unir con el catálogo vivo. Un cambio o retiro posterior del producto no altera lo mostrado.
- **HU-ORD-07:** agrupación *en curso* / *finalizados* centralizada en `GRUPO_POR_ESTADO` (servicio). Es un `Record` exhaustivo sobre `EnumEstadoOrden`: si el enum cambia, TypeScript obliga a clasificar el estado nuevo.
  - ⚠️ **Provisional:** la clasificación usa el enum actual de la BD (`entregado` y `cancelado` son finalizados; el resto, en curso), que no coincide con el diagrama. Ver bloqueo 1.
- **Buscador (CA-ORD-07-03):** coincidencia parcial sin distinguir mayúsculas (`ILIKE`) sobre el código visible y sobre el nombre y la variante copiados en las líneas. Los comodines `%` y `_` del texto del usuario se escapan.
- **Fechas:** `orden.fecha` es `DATE`; se devuelve como `AAAA-MM-DD` usando la fecha local, para no correr el día al convertir a UTC.

### B. Decisión de Diseño
- **Titularidad en el servicio, no en la guarda:** la orden se busca por código y el servicio compara el titular. Así se puede registrar el intento sobre una orden ajena (CA-SEG-03-05) y responder exactamente igual que ante una inexistente (`404 Recurso no encontrado`, CA-SEG-03-06).
- **Código ilegible = recurso inexistente:** un código vacío o de más de 50 caracteres responde `404` y no `400`, para no revelar la forma del recurso (RF-SEG-03-05).
- **Permiso de consulta del personal:** la ruta exige `ventas.ver` («Revisar órdenes»). Quien tiene `ventas.gestionar` («Gestión de pedidos») recibe `ventas.ver` por la regla de dependencias de M17 (RF-ADM-02-04), así que solo se rechaza a quien no tiene ninguno de los dos (CA-ORD-05-03). ⚠️ La correspondencia de nombres entre los CA y el catálogo de permisos está pendiente de confirmar.

### C. Políticas Transversales Validadas
- 🛡️ **M20 / M17 - Autorización en servidor (`HU-SEG-03`, `HU-ADM-03`):** todo el router exige `guardas.sesionVigente()`, que revalida sesión, estado de la cuenta y permisos en vivo en cada petición. La consulta del personal exige además `guardas.requierePermiso('ventas.ver')`.
- 🔒 **M20 - Accesos denegados (`CA-SEG-03-05`):** el intento sobre una orden ajena se registra con `serviciosSeguridad.registro.registrarAccesoDenegado` (motivo `TITULARIDAD_AJENA`).
- 👁️ **M20 - Mínima exposición (`HU-SEG-06`):**
  - al cliente no se le devuelven `id_orden`, `id_usuario`, `transaccion_pago_id` ni `id_cotizacion`;
  - el listado se consulta siempre filtrado por el `id_usuario` de la sesión (CA-SEG-06-05);
  - los errores no controlados los uniforma el `errorHandler` global.
- 🆔 **M04 - Unicidad de cuentas (`HU-CUE-08`):** no aplica; el módulo no crea ni modifica cuentas.
- 📧 **M18 - Notificaciones:** no aplica en esta versión (sin cambios de estado).

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

Resumen: **8 cumplidos · 6 parciales · 16 bloqueados** (30 CA en total). La suite `m08.test.ts` usa un repositorio en memoria; las consultas SQL **no se han validado aún contra PostgreSQL real**.

### 🔹 HU-ORD-01 — Generación de la orden tras el pago confirmado

| ID Criterio | Criterio de Aceptación (resumen) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-ORD-01-01** (#110) | Al recibir el pago confirmado se genera la orden con los datos de la compra. | — | ⛔ **BLOQUEADO** (bloqueos 1, 3) |
| **CA-ORD-01-02** (#113) | Sin confirmación de pago no existe orden. | — | ⛔ **BLOQUEADO** (bloqueos 1, 3) |
| **CA-ORD-01-03** (#115) | Un empleado confirma un pago directo y la orden se genera igual. | — | ⛔ **BLOQUEADO** (bloqueo 3) |
| **CA-ORD-01-04** (#117) | Si viene de una cotización aceptada, queda registrado su identificador. | — | ⛔ **BLOQUEADO** (depende de la creación; columnas `origen`/`id_cotizacion` ya existen) |
| **CA-ORD-01-05** (#417) | Un pago confirmado duplicado no genera una segunda orden. | — | ⛔ **BLOQUEADO** (depende de la creación; `transaccion_pago_id UNIQUE` ya lo soporta) |
| **CA-ORD-01-06** (#418) | Tras un fallo después del cobro, la solicitud de compra sigue existiendo. | — | ⛔ **BLOQUEADO** (bloqueo 3) |

### 🔹 HU-ORD-02 — Conservación histórica de los datos de la orden

| ID Criterio | Criterio de Aceptación (resumen) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-ORD-02-01** (#124) | La orden conserva el precio aunque cambie el catálogo. | Detalle leído solo de `linea_orden` (`m08.test.ts`) | ⚠️ **PARCIAL** (lectura cumplida; la copia al crear depende de HU-ORD-01) |
| **CA-ORD-02-02** (#125) | Se ven los descuentos aplicados, su orden y cuánto descontó cada uno. | — | ⛔ **BLOQUEADO** (bloqueo 4) |
| **CA-ORD-02-03** (#126) | Si viene de cotización, muestra el importe acordado y no el del catálogo. | Se muestra `precio_aplicado` guardado | ⚠️ **PARCIAL** (copiar el importe acordado ocurre al crear, HU-ORD-01) |
| **CA-ORD-02-04** (#419) | Si el producto se desactiva, los datos de la orden siguen presentes. | Detalle sin unión con el catálogo (`m08.test.ts`) | ✅ **CUMPLIDO** |
| **CA-ORD-02-05** (#420) | La orden conserva el porcentaje de IVA aplicado. | — | ⛔ **BLOQUEADO** (bloqueo 5) |

### 🔹 HU-ORD-03 — Ciclo de vida y estados de la orden

| ID Criterio | Criterio de Aceptación (resumen) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-ORD-03-01** (#131) | El estado refleja la situación real de la orden. | — | ⛔ **BLOQUEADO** (bloqueo 1) |
| **CA-ORD-03-02** (#134) | Una línea sin disponibilidad se refleja y no queda oculta. | — | ⛔ **BLOQUEADO** (bloqueo 1; `linea_orden` no guarda disponibilidad por línea) |
| **CA-ORD-03-03** (#136) | Al marcar entregado, figura con fecha y quién lo marcó. | — | ⛔ **BLOQUEADO** (bloqueos 1, 2) |
| **CA-ORD-03-04** (#421) | Cada cambio de estado emite su evento y consta quién lo hizo. | — | ⛔ **BLOQUEADO** (bloqueo 2; M18 ya expone `notificarCambioEstadoOrden`) |
| **CA-ORD-03-05** (#422) | Al cancelar se genera un reembolso asociado. | — | ⛔ **BLOQUEADO** (bloqueo 7) |

### 🔹 HU-ORD-04 — Consulta del detalle de un pedido

| ID Criterio | Criterio de Aceptación (resumen) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-ORD-04-01** (#150) | El detalle muestra productos, cantidades, precios, total, modo de entrega y estado. | `m08.test.ts` | ⚠️ **PARCIAL** (todo salvo el modo de entrega, bloqueo 6) |
| **CA-ORD-04-02** (#152) | Si llevaba un color entonado, figura el color pedido. | Se muestra `variante_copia` tal como se guardó (`m08.test.ts`) | ⚠️ **PARCIAL** (no hay columna propia para el color; bloqueo 6) |
| **CA-ORD-04-03** (#423) | Abrir una orden ajena se rechaza. | `404` indistinguible de inexistente + registro M20 (`m08.test.ts`) | ✅ **CUMPLIDO** |
| **CA-ORD-04-04** (#424) | Si el producto se retiró: mismos datos, sin enlace y con nota de «ya no disponible». | Datos copiados y sin id de producto en la respuesta | ⚠️ **PARCIAL** (la nota requiere saber qué variante era; bloqueo 6) |

### 🔹 HU-ORD-05 — Gestión de órdenes por personal autorizado

| ID Criterio | Criterio de Aceptación (resumen) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-ORD-05-01** (#176) | Con «Gestión de pedidos» se puede avanzar el estado. | — | ⛔ **BLOQUEADO** (bloqueo 1) |
| **CA-ORD-05-02** (#177) | Con solo «Revisar órdenes» no se puede avanzar. | — | ⛔ **BLOQUEADO** (sin operación de avance; exigirá `ventas.gestionar`) |
| **CA-ORD-05-03** (#178) | Sin ninguno de los dos permisos no se puede consultar. | Guarda central `requierePermiso('ventas.ver')` de M20 en la ruta (probada por M20; no cubierta por la suite en memoria) | ✅ **CUMPLIDO** |
| **CA-ORD-05-04** (#425) | Buscando por el número del pedido se llega a la orden correcta. | `m08.test.ts` | ✅ **CUMPLIDO** |

### 🔹 HU-ORD-06 — Identificación de la orden

| ID Criterio | Criterio de Aceptación (resumen) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-ORD-06-01** (#180) | Cada orden tiene un identificador propio y distinto. | Restricción `UNIQUE` de `orden.codigo_visible` | ⚠️ **PARCIAL** (garantía de BD y consulta; la generación depende de HU-ORD-01) |
| **CA-ORD-06-02** (#181) | El identificador corresponde a una única orden. | `UNIQUE` + búsqueda exacta (`m08.test.ts`) | ✅ **CUMPLIDO** |
| **CA-ORD-06-03** (#426) | Una orden cancelada nunca cede su identificador a la siguiente. | — | ⛔ **BLOQUEADO** (bloqueo 8) |

### 🔹 HU-ORD-07 — Sección de pedidos del cliente

| ID Criterio | Criterio de Aceptación (resumen) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-ORD-07-01** (#183) | Listado separado en curso / finalizados con identificador, fecha, total y estado. | `m08.test.ts` | ✅ **CUMPLIDO** (clasificación provisional, bloqueo 1) |
| **CA-ORD-07-02** (#184) | Un pedido Entregado aparece entre los finalizados. | `m08.test.ts` | ✅ **CUMPLIDO** |
| **CA-ORD-07-03** (#427) | El buscador filtra el listado según lo escrito. | Servicio (`m08.test.ts`) + `ILIKE` en repositorio (sin validar en PostgreSQL real) | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **M20 Seguridad:** `guardas.sesionVigente()`, `guardas.requierePermiso()` y `serviciosSeguridad.registro`. Los accesos denegados se emiten al registro técnico mientras HU-SEG-04 (auditoría persistente) siga en pausa.
- **M17 Permisos:**
  - `ventas.ver` debe estar concedido al personal que consulta órdenes;
  - la dependencia `ventas.gestionar → ventas.ver` debe mantenerse.
- **Base de datos:** tablas `orden` y `linea_orden` (ya existentes; esta versión no cambia el esquema).
- **Enrutador central:** montar `ordenesRoutes` en `app.routes.ts` como `/ordenes` (pendiente de aprobación).

### B. Dependencias Hacia Adelante
- **Frontend M08:** puede construir la sección «Mis pedidos», el detalle del pedido y la búsqueda de órdenes del panel administrativo.
- **HU-ADM-04 (M17):** la ficha del cliente puede reutilizar la consulta de órdenes por código.

### C. ⛔ Bloqueos Pendientes de Decisión (archivos compartidos → Líder Técnico)
1. **Estados de la orden:** `enum_estado_orden` (`bd/sql/schema_pintuclic.sql`) y `EnumEstadoOrden` (`core/db/types.ts`) admiten `pendiente, pagado, en_preparacion, enviado, entregado, cancelado`. El diagrama (`Maquina_de_estados_de_la_Orden.drawio.png`) exige `Pago confirmado → En revisión → Consiguiendo stock / Stock disponible → En preparación → …` y `Cancelada`. Además, el valor por defecto `pendiente` contradice RF-ORD-01-01. También hay que aclarar la contradicción entre el PNG y el mermaid de `equipo-2-doc` sobre `En preparación → Cancelada`.
2. **Historial de estados y auditoría:** no hay dónde guardar la fecha y el autor de cada cambio de estado (CA-ORD-03-03, CA-ORD-03-04). HU-SEG-04 sigue en pausa.
3. **Creación de la orden:**
   - M05 (carrito) no está en `develop` y M07 (pasarela) está aplazado;
   - `pagos.id_orden` es `NOT NULL`, así que el pago exige una orden que aún no existe (CA-ORD-01-03);
   - no existe tabla de solicitud de compra ni outbox (CA-ORD-01-06, ADR-03).
4. **Descuentos detallados:** `orden` solo guarda un `descuento` total (CA-ORD-02-02).
5. **IVA:** no hay columna para el porcentaje aplicado (CA-ORD-02-05).
6. **Datos del detalle:**
   - sin columna de modo de entrega (CA-ORD-04-01, depende de M10);
   - sin columna propia de color entonado (CA-ORD-04-02);
   - `linea_orden` no guarda referencia (sin FK, por ADR-05) a la variante, necesaria para saber si el producto se retiró (CA-ORD-04-04).
7. **Reembolsos:** CA-ORD-03-05 depende de M07, que está aplazado.
8. **Código visible:** falta el parámetro configurable de formato (HU-ORD-06) y la regla de consecutivo (CA-ORD-06-03). El ejemplo del CA (`PC-2025-00123`) no coincide con el seed (`ORD-2026-0001`).
9. **Permisos:** confirmar que «Gestión de pedidos» equivale a `ventas.gestionar` y «Revisar órdenes» a `ventas.ver`.
10. **Fuente de verdad:** los CA vigentes están en los Issues de GitHub. `docs/02_MODULOS_FUNCIONALES/M08_ESPECIFICACION_ORDEN.md` no está sincronizado con ellos.

### ⚠️ Limitaciones Conocidas
1. **Sin validar contra PostgreSQL real:** faltan las credenciales de la BD compartida. Hay que probar las consultas del repositorio (en especial el buscador con `ILIKE` y `EXISTS`).
2. **Listado sin paginación:** la sección devuelve todos los pedidos del cliente. Si el volumen por cliente crece, conviene paginar cada grupo.
3. **Búsqueda del personal solo por código exacto:** no hay listado ni filtros para el panel (fuera de los CA actuales).

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[NUEVO]** | `backend/src/modules/m08-ordenes/interfaces/m08.interfaces.ts` | Tipos del módulo derivados de `core/db/types.ts` (`Pick` de `Orden`/`LineaOrden`) y contratos de respuesta. |
| **[NUEVO]** | `backend/src/modules/m08-ordenes/dtos/ordenes.dto.ts` | `CodigoOrdenDto` y `ListarMisPedidosDto` (Zod). |
| **[NUEVO]** | `backend/src/modules/m08-ordenes/repositories/ordenes.repository.ts` | Lecturas Kysely: orden por código, líneas y pedidos de un cliente con buscador. |
| **[NUEVO]** | `backend/src/modules/m08-ordenes/services/ordenes.service.ts` | Titularidad, agrupación en curso / finalizados y armado de respuestas mínimas. |
| **[NUEVO]** | `backend/src/modules/m08-ordenes/controllers/ordenes.controller.ts` | Transporte HTTP y delegación. |
| **[NUEVO]** | `backend/src/modules/m08-ordenes/m08.routes.ts` | Composición del módulo, guardas M20 y constante `PERMISO_VER_ORDENES`. |
| **[NUEVO]** | `backend/src/modules/m08-ordenes/__tests__/m08.test.ts` | 18 pruebas en memoria. |
| **[NUEVO]** | `docs/walkthroughs/M08/walkthrough_v3.30.0_M08_consulta_ordenes_backend.md` | Este documento. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v3.30.0`. |

Ningún archivo de otro módulo ni compartido (`app.routes.ts`, `core/db/types.ts`, `bd/sql/*`) fue modificado.

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ`
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (`tsc --noEmit` limpio, `npm run lint` limpio, 18/18 pruebas en memoria con `npx tsx src/modules/m08-ordenes/__tests__/m08.test.ts`)
* **Validación contra PostgreSQL real:** `❌ PENDIENTE` (sin credenciales de la BD)
* **Apego al Diagrama de Flujo:** `⚠️ PARCIAL` (esta versión no implementa transiciones; la máquina de estados queda bloqueada por el esquema, bloqueo 1)
