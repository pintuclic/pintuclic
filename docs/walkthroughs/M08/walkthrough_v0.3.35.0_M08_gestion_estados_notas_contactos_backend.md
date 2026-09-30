# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión:** `v0.3.35.0` (Minior-feat; `.github/version.txt` de `0.3.34.0` a `0.3.35.0`)
* **Módulo de Origen:** `M08 - Orden de venta` (solo `backend/src/modules/m08-ordenes/`; sin cambios de esquema ni de archivos compartidos)
* **Fecha y Autor:** `29/09/2026` · `Manuel (Manuel151025), con apoyo de Agente de IA (backend)`
* **Estado de la Implementación:** `⚠️ PARCIAL CON DEPENDENCIAS` (todo lo que depende de M08 está hecho; quedan la creación de órdenes, la copia histórica completa, la disponibilidad, la cancelación y la devolución, que dependen de otros módulos o del análisis)

Implementa sobre el modelo de datos de la v0.3.34.0 las operaciones del personal: avanzar una orden por su ciclo, ver su historial, dejar notas internas y registrar los contactos con el cliente.

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| Historia | Cambio en esta versión |
| :--- | :--- |
| **HU-ORD-03** (#128) Ciclo de vida | Cambio de estado con reglas D01/D02, autor, fecha y motivo en el historial |
| **HU-ORD-05** (#155) Bandeja del personal | «Gestión de pedidos» avanza órdenes; «Revisar órdenes» solo consulta; `dias_esperando` desde el último cambio |
| **HU-ORD-09** (#583) Detalle para el personal | Historial de estados y registro de contactos en el detalle |
| **HU-ORD-10** (#584) Notas internas | Crear y leer notas; no se editan ni se borran |

### Contrato de la API (nuevo o ampliado)

Todas exigen sesión. Las respuestas siguen el formato `{ success, data, message }`; los errores, `{ success: false, error: { code, message, details? } }`.

| Método y ruta | Permiso | Cuerpo | Éxito |
| :--- | :--- | :--- | :--- |
| `PATCH /api/ordenes/gestion/:codigo/estado` | `ventas.gestionar` | `{ "estado": "...", "motivo"?: "..." }` (motivo ≤ 500) | **200** `{ codigo, estado_anterior, estado, fecha, transiciones_permitidas }` |
| `POST /api/ordenes/gestion/:codigo/notas` | `ventas.gestionar` | `{ "texto": "..." }` (1–2000) | **201** `{ texto, autor, fecha }` |
| `PUT` / `PATCH` / `DELETE` `/api/ordenes/gestion/:codigo/notas[/:nota]` | `ventas.ver` | — | **405** `NOTA_INMUTABLE` |
| `POST /api/ordenes/gestion/:codigo/contactos` | `ventas.gestionar` | `{ "medio": "telefono\|correo\|whatsapp\|otro", "detalle"?: "..." }` (≤ 1000) | **201** `{ medio, detalle, autor, fecha }` |
| `GET /api/ordenes/gestion/:codigo` (ampliado) | `ventas.ver` | — | **200** con `transiciones_permitidas`, `historial[]`, `notas[]` y `contactos[]` |
| `GET /api/ordenes/gestion` (ampliado) | `ventas.ver` | — | `dias_esperando` desde el último cambio de estado |

Las fechas de `historial`, `notas` y `contactos` viajan en ISO 8601 (UTC). En `historial`, `autor: null` significa cambio automático del sistema.

**Errores del cambio de estado:**

| HTTP | `code` | Cuándo |
| :---: | :--- | :--- |
| 400 | `VALIDATION_ERROR` | Estado desconocido, cuerpo vacío o motivo demasiado largo |
| 400 | `MOTIVO_REQUERIDO` | Volver de Preparada a En preparación sin motivo |
| 403 | `FORBIDDEN` | Sin `ventas.gestionar` (por ejemplo, solo «Revisar órdenes») |
| 404 | `NOT_FOUND` | La orden no existe |
| 409 | `TRANSICION_NO_PERMITIDA` | El ciclo no permite ese paso; `details.permitidas` lista los válidos |
| 409 | `ESTADO_SIN_CAMBIO` | La orden ya está en ese estado |
| 409 | `ESTADO_CAMBIADO` | Otra persona cambió la orden entre medias; hay que volver a abrirla |
| 409 | `OPERACION_NO_HABILITADA` | Cancelar o devolver (pendiente de la política de M11) |

### Descripción del Alcance de la Versión

El personal con «Gestión de pedidos» ya puede:
- hacer avanzar una orden desde Orden confirmada hasta Despachado o Entregado;
- volver de Preparada a En preparación indicando el motivo;
- dejar notas internas para sus compañeros;
- registrar cada contacto con el cliente.

Quien solo tiene «Revisar órdenes» ve todo, pero no puede operar. El cliente recibe un correo cuando su pedido se despacha.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **Ciclo (`services/ciclo-estados.ts`, única fuente):**

  | Desde | Puede pasar a |
  | :--- | :--- |
  | Orden confirmada | Revisión de disponibilidad |
  | Revisión de disponibilidad | En preparación |
  | En preparación | Preparada |
  | Preparada | En preparación (con motivo), Despachado o Entregado |
  | Despachado | Entregado |
  | Entregado, Cancelado y Devuelto | — (finales) |

- **Recogida en tienda (D02):** Preparada → Entregado en una sola acción, sin despacho. El sistema aún no guarda el modo de entrega, así que las dos salidas de Preparada están disponibles.
- **Operación simultánea (CA-ORD-05-08):**
  - no hay bloqueo: varios empleados pueden operar la misma orden;
  - el cambio solo se aplica si la orden sigue en el estado que se leyó;
  - si otra persona la cambió antes, responde 409 `ESTADO_CAMBIADO` sin sobrescribir;
  - cada paso queda con su autor.
- **Correo (D05):** solo al despachar, con la plantilla `cambio_estado_orden` de M18. Se envía en segundo plano y, si falla, el cambio de estado se conserva y el error queda en el log.
- **Notas (HU-ORD-10):** solo inserción. Editar o borrar responde 405 y el mensaje indica añadir otra nota.

### B. Decisiones de Diseño
- **Escribir exige `ventas.gestionar`; leer, `ventas.ver`.** Los CA lo fijan para avanzar órdenes (05-01/05-02). Para notas y contactos las historias no lo dicen, y se aplica la misma regla. ⚠️ Pendiente de confirmar con el análisis.
- **Medios de contacto:** `telefono`, `correo`, `whatsapp` y `otro`. ⚠️ Lista provisional hasta que el análisis la cierre; la columna de la BD admite texto libre, así que cambiarla no requiere migración.
- **`revision_disponibilidad` → `en_preparacion` es manual por ahora.** D01 prevé que sea automática cuando M09 confirme la disponibilidad de la última línea.

### C. Políticas Transversales Validadas
- 🔒 **M20:** guardas de sesión y permiso en cada ruta. Los intentos sin permiso quedan en el registro de accesos denegados (comprobado en el log: `PERMISO_AUSENTE` y `SESION_AUSENTE`).
- 🔒 **HU-SEG-06:**
  - la vista del cliente no incluye notas, historial interno ni contactos;
  - del autor solo viaja el nombre;
  - ninguna clave primaria sale en las respuestas.
- 📬 **M18:** se reutiliza `notificarCambioEstadoOrden` sin modificar M18.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN (épica #28 del 27/09/2026)

Resumen: **25 cumplidos · 10 parciales · 14 bloqueados** (49 criterios). En la v0.3.34.0 eran 13 · 11 · 10 desbloqueados · 15.

Solo se listan los criterios que cambian. El resto conserva el estado de las matrices de la v0.3.31.0 y la v0.3.34.0.

| CA | Resumen | Antes | Ahora | Método de validación |
| :--- | :--- | :---: | :---: | :--- |
| **03-01** #131 | El estado refleja la situación real | 🔓 | ✅ | Ciclo completo en memoria, en BD con ROLLBACK y por HTTP. Las reglas P1/P2 del análisis pueden ajustar el ciclo |
| **03-03** #136 | Recogida: Entregado con fecha y autor | ⛔ | ⚠️ | Preparada → Entregado registra fecha y autor; falta distinguir recogida y domicilio (modo de entrega, bloqueo 5) |
| **03-04** #421 | Evento y autor por cambio de estado | 🔓 | ✅ | Historial con autor y fecha en BD; correo de M18 al despachar |
| **03-06** #889 | Despachado es el cierre normal a domicilio | ⚠️ | ✅ | La transición a Despachado existe, Entregado es opcional y Mis pedidos lo muestra entre los finalizados |
| **05-01** #176 | Gestión de pedidos avanza una orden | 🔓 | ✅ | HTTP 200 con el administrador |
| **05-02** #177 | Revisar órdenes no puede operar | 🔓 | ✅ | HTTP 403 con un usuario que solo tiene `ventas.ver` |
| **05-07** #896 | Más antigua primero y cuánto lleva esperando | ⚠️ | ✅ | `dias_esperando` desde el último cambio, con la fecha de Colombia |
| **05-08** #897 | Operación simultánea con autor por paso | 🔓 | ✅ | Autor por paso y rechazo sin sobrescribir (memoria y BD) |
| **09-02** #902 | Historial con autor y fecha | 🔓 | ✅ | Detalle del personal con `historial` |
| **09-03** #903 | Registrar que se contactó al cliente | 🔓 | ✅ | HTTP 201; medios provisionales |
| **10-01** #904 | La nota interna no la ve el cliente | 🔓 | ✅ | Vista del cliente sin `notas` (memoria, BD y HTTP) |
| **10-02** #905 | La nota muestra autor y momento | 🔓 | ✅ | HTTP 201 y detalle con autor y fecha |
| **10-03** #906 | La nota no se puede borrar | 🔓 | ✅ | HTTP 405 `NOTA_INMUTABLE` en DELETE y PUT |

Siguen parciales **05-05** («esperando verificación» por aclarar) y **09-01** (falta la base entonada por línea).

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **Modelo de datos v0.3.34.0:** `historial_estado_orden`, `nota_orden` y `contacto_orden`, ya aplicadas en el servidor.
- **M20:** guardas `sesionVigente` y `requierePermiso`.
- **M17:** permisos `ventas.ver` y `ventas.gestionar` asignados al personal.
- **M18:** plantilla `cambio_estado_orden` y SMTP real en producción; en local funciona en simulación.

### B. Dependencias Hacia Adelante
- **Frontend M08 (Yessica):** botones de cambio de estado según `transiciones_permitidas`, historial, notas y contactos en el detalle, y mensajes de error en español.
- **M18 (HU-NOT-02, #203):** el evento de cambio de estado ya se emite al despachar.

### C. ⛔ Bloqueos Pendientes (fuera de M08)
- **3:** solicitud SOL y pago (M07), para crear órdenes (HU-ORD-01).
- **4:** consecutivo del código PC.
- **5:** copia histórica (IVA, descuentos, modo de entrega y línea entonada).
- **6:** disponibilidad por línea (M09).
- **7:** dinero por devolver y política de M11, para cancelar y devolver.
- **10:** permisos del seed.
- **11:** aclaraciones del análisis:
  - P1–P5;
  - el reembolso;
  - «esperando verificación»;
  - los medios de contacto;
  - los permisos de notas y contactos.

### ⚠️ Limitaciones Conocidas
1. **Validación local, no oficial:** PostgreSQL 15.19 local. La validación en el entorno de integración corresponde al equipo de testing.
2. **Pruebas HTTP sobre la base local:** escribieron datos reales; la base local se recreó y se volvió a sembrar al terminar.
3. **Inmutabilidad de notas e historial:** la garantiza la API, no un disparador de la BD (decisión abierta).

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[NUEVO]** | `backend/src/modules/m08-ordenes/services/ciclo-estados.ts` | Transiciones, etiquetas, estados no habilitados y regla del motivo. |
| **[NUEVO]** | `backend/src/modules/m08-ordenes/services/gestion-ordenes.service.ts` | Cambio de estado, notas, contactos y aviso a M18. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/services/ordenes.service.ts` | Detalle con historial, notas, contactos y transiciones; espera desde el último cambio. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/repositories/ordenes.repository.ts` | Lecturas y escrituras de historial, notas y contactos; cambio de estado condicionado en transacción. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/controllers/ordenes.controller.ts` | Manejadores de estado, notas (incluido el 405) y contactos. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/m08.routes.ts` | Rutas nuevas y permiso `ventas.gestionar`. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/dtos/ordenes.dto.ts` | `CambiarEstadoDto`, `CrearNotaDto` y `RegistrarContactoDto`. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/interfaces/m08.interfaces.ts` | Tipos de historial, notas, contactos, resultado del cambio y notificador. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/__tests__/m08.test.ts` | 79 pruebas en memoria (27 nuevas). |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/__tests__/m08.integracion.test.ts` | 27 pruebas de solo lectura (7 nuevas). |
| **[NUEVO]** | `backend/src/modules/m08-ordenes/__tests__/m08.integracion-escritura.test.ts` | 11 pruebas de escritura que siempre se deshacen. |
| **[NUEVO]** | `docs/walkthroughs/M08/walkthrough_v0.3.35.0_M08_gestion_estados_notas_contactos_backend.md` | Este documento. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v0.3.35.0`. |
| **[MODIFICADO]** | `.github/version.txt` | `0.3.34.0` → `0.3.35.0`. |

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ`
  * `tsc --noEmit` y `npm run lint` limpios.
  * **79/79** en memoria (`npx tsx src/modules/m08-ordenes/__tests__/m08.test.ts`).
  * **27/27** de integración de solo lectura (`m08.integracion.test.ts`).
  * **11/11** de integración de escritura con ROLLBACK (`m08.integracion-escritura.test.ts`), que comprueba al final que la base quedó igual.
* **Validación HTTP (backend local + PostgreSQL 15.19):** `✅ 29/29`:
  * ciclo completo hasta Despachado, con vuelta atrás con motivo;
  * errores 400, 403, 401, 404, 405 y 409 con mensaje en español;
  * notas y contactos 201;
  * vista del cliente sin datos internos;
  * un único correo simulado de M18 al despachar, registrado en su bitácora.
* **Versión:** `✅ 0.3.35.0` en `.github/version.txt` y entrada en `docs/CHANGELOG.md`.
