# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión:** `v0.3.34.0` (Minior-feat; `.github/version.txt` de `0.3.33.1` a `0.3.34.0`)
* **Módulo de Origen:** `M08 - Orden de venta` (modelo de datos; toca archivos compartidos de `bd/` y `core/db/types.ts` con aprobación del líder técnico)
* **Fecha y Autor:** `29/09/2026` · `Manuel (Manuel151025), con apoyo de Agente de IA (backend / BD)`
* **Estado de la Implementación:** `⚠️ PARCIAL CON DEPENDENCIAS` (modelo de estados, historial, notas y contactos listo y probado; los endpoints que lo usan llegan en la siguiente entrega)

Primera tanda del modelo de datos propuesto en `docs/walkthroughs/M08/PROPUESTA_MODELO_DATOS_M08.md` (secciones 1, 2 y 8: estados, historial, notas internas y registro de contactos). Se eligieron porque no dependen de otros módulos. El detalle técnico de la base de datos está en `bd/docs/WALKTHROUGH_DATABASE.md`, versión 2.6.

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

Criterios de la épica **#28** (actualización del 27/09/2026: 11 historias, 49 criterios).

| Historia | Cambio en esta versión |
| :--- | :--- |
| **HU-ORD-03** (#128) Ciclo de vida y estados | `enum_estado_orden` con los 8 estados del ciclo; tabla `historial_estado_orden` con estado anterior y nuevo, autor, motivo y fecha |
| **HU-ORD-05** (#155) Bandeja del personal | Los contadores (`/gestion/resumen`) y el filtro por estado usan ya los estados reales |
| **HU-ORD-07** (#182) Mis pedidos | `despachado` y `devuelto` pasan a finalizados; `revision_disponibilidad` y `preparada` quedan en curso |
| **HU-ORD-09** (#583) Detalle para el personal | Tabla `contacto_orden` para registrar cada contacto con el cliente |
| **HU-ORD-10** (#584) Notas internas | Tabla `nota_orden`, de solo inserción y nunca visible al cliente |

No cambia ningún endpoint: las rutas de la v0.3.31.0 siguen iguales.

### Descripción del Alcance de la Versión

La base de datos ya puede representar el ciclo completo de una orden y guardar quién hizo cada cambio y cuándo. También puede guardar las notas internas del personal y los contactos con el cliente. Con esto quedan desbloqueados 10 criterios, que solo esperan el código de M08. Las bases que ya existen, incluida la del servidor, se migran solas y sin perder datos en el siguiente despliegue.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **Ciclo de estados:** `orden_confirmada` → `revision_disponibilidad` → `en_preparacion` → `preparada` → `despachado` / `entregado`, más los terminales `cancelado` y `devuelto` (D01, D02).
- **No existe orden sin pago** (RF-ORD-01-01): la orden nace en `orden_confirmada`; el valor por defecto `pendiente` se retiró.
- **Despachado es cierre normal a domicilio** (D02, CA-ORD-03-06): Mis pedidos lo muestra entre los finalizados.
- **Historial, notas y contactos son de solo inserción:** los tipos Kysely no exportan tipo de actualización y ningún repositorio los modifica ni los borra.
- **Autor del cambio:** `NULL` en el historial significa transición automática del sistema (D01). En notas y contactos el autor es obligatorio.
- **Motivo obligatorio** al volver de `preparada` a `en_preparacion` (D01) y al cancelar: lo exigirá el servicio de M08. No se usa un `CHECK` porque fallaría en las bases que se migran.

### B. Decisión de Diseño
- **Migración dentro del esquema oficial (sección 0.1):** desde v0.3.33.1 el despliegue ejecuta `schema_pintuclic.sql` y `seed_pintuclic.sql` con `psql -v ON_ERROR_STOP=1` sobre la base persistente del servidor. El renombrado (`pagado` → `orden_confirmada`, `enviado` → `despachado`) va protegido con comprobaciones sobre `pg_enum` y es idempotente.
- **`pendiente` queda sin uso en bases antiguas:** PostgreSQL no permite quitar un valor de un ENUM sin recrear el tipo. `EnumEstadoOrden` no lo incluye, así que ningún módulo puede escribirlo.
- **`ON DELETE RESTRICT`** en todas las FK nuevas: la orden y su rastro se conservan. Ningún módulo borra usuarios, por lo que no bloquea flujos existentes.

### C. Políticas Transversales Validadas
- 🧱 **Seed centralizado:** los datos de ejemplo están en `bd/sql/seed_pintuclic.sql` (4 cambios de estado, 1 nota y 1 contacto).
- 🧩 **Sin romper a otros módulos:**
  - solo M08 usaba `EnumEstadoOrden`, y M20 únicamente cuenta órdenes por usuario;
  - el lector del seed de las pruebas de M17 (`seed-reader.mjs`) obtiene los mismos 4 usuarios que antes.
- 🔒 **HU-SEG-06:** las notas internas no se exponen al cliente. Ningún endpoint de cliente las lee.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN (épica #28 del 27/09/2026)

Resumen: **13 cumplidos · 11 parciales · 10 desbloqueados pendientes de código · 15 bloqueados** (49 criterios). En la v0.3.31.0 eran 13 · 10 · 0 · 26.

Solo se listan los criterios que cambian en esta versión. El resto conserva el estado de la matriz de `walkthrough_v0.3.31.0_M08_bandeja_busqueda_historial_backend.md`.

| CA | Resumen | Antes | Ahora | Motivo |
| :--- | :--- | :---: | :---: | :--- |
| **03-01** #131 | El estado refleja la situación real | ⛔ | 🔓 | Estados e historial listos; falta el endpoint de avance. Las reglas P1/P2 siguen pendientes del análisis |
| **03-04** #421 | Evento y autor por cambio de estado | ⛔ | 🔓 | `historial_estado_orden` guarda autor y fecha; falta registrarlo al cambiar de estado |
| **03-06** #889 | Despachado es el cierre normal a domicilio | ⛔ | ⚠️ | Mis pedidos muestra `despachado` entre los finalizados (prueba en memoria); falta la transición y el modo de entrega (bloqueo 5) |
| **05-01** #176 | Gestión de pedidos avanza una orden | ⛔ | 🔓 | Falta el endpoint de avance con `ventas.gestionar` |
| **05-02** #177 | Revisar órdenes no puede operar | ⛔ | 🔓 | Depende del mismo endpoint |
| **05-05** #894 | Contadores por estado en el panel | ⚠️ | ⚠️ | Ya usan los estados reales; sigue por aclarar «esperando verificación» |
| **05-07** #896 | Más antigua primero y cuánto lleva esperando | ⚠️ | ⚠️ | El historial permite contar desde el último cambio; falta usarlo en `dias_esperando` |
| **05-08** #897 | Operación simultánea con autor por paso | ⛔ | 🔓 | El historial registra autor por paso; falta el endpoint |
| **09-02** #902 | Historial con autor y fecha | ⛔ | 🔓 | Falta exponerlo en el detalle del personal |
| **09-03** #903 | Registrar que se contactó al cliente | ⛔ | 🔓 | `contacto_orden` lista; falta el endpoint. Los medios admitidos siguen pendientes del análisis |
| **10-01** #904 | La nota interna no la ve el cliente | ⛔ | 🔓 | `nota_orden` lista; falta el endpoint del personal |
| **10-02** #905 | La nota muestra autor y momento | ⛔ | 🔓 | Autor y fecha guardados; falta el endpoint |
| **10-03** #906 | La nota no se puede borrar | ⛔ | 🔓 | Solo inserción por diseño; falta decidir si se añade un disparador que lo garantice en la BD |

🔓 = la base de datos ya lo permite y solo falta el código de M08 de la siguiente entrega.

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **Despliegue (v0.3.33.1):** el paso «Cargar esquema y catálogo en PostgreSQL» aplica esta migración al unir a `develop`, sin acción manual.
- **M04 / M17:** tabla `usuario` como autor de cambios, notas y contactos.

### B. Dependencias Hacia Adelante
- **Siguiente entrega de M08:**
  - avance de estado con historial;
  - notas internas y registro de contactos;
  - historial en el detalle del personal;
  - `dias_esperando` desde el último cambio.
- **M18 (HU-NOT-02, #203):** podrá emitir la notificación de cambio de estado cuando exista el endpoint de avance.
- **Frontend M08:** las etiquetas de estado cambian (`enviado` → `despachado`; nuevos `revision_disponibilidad`, `preparada` y `devuelto`).

### C. ⛔ Bloqueos Pendientes
Se mantiene la numeración de la v0.3.31.0.
- **Resueltos en esta versión:** 1 (estados), 2 (historial), 8 (notas internas) y 9 (registro de contactos).
- **Siguen pendientes:**
  - 3: solicitud SOL y pago (M07);
  - 4: consecutivo del código PC;
  - 5: copia histórica, con IVA, descuentos, modo de entrega y línea entonada;
  - 6: disponibilidad por línea (M09);
  - 7: dinero por devolver y política de M11;
  - 10: permisos del seed; el rol 3 sigue con `ventas.ver`;
  - 11: aclaraciones del análisis. A ellas se suman ahora:
    - qué medios de contacto se admiten (09-03);
    - si la inmutabilidad de notas e historial se garantiza también con un disparador en la BD.

### ⚠️ Limitaciones Conocidas
1. **Validación local, no oficial:** PostgreSQL 15.19 local. La validación en el entorno de integración corresponde al equipo de testing.
2. **`pendiente` visible en bases migradas:** aparece en el catálogo del ENUM, pero ningún módulo lo usa ni puede escribirlo.
3. **`setup.ts` avisa «Se esperaban 36 tablas»:** es un número fijo anterior a esta versión y no indica un error.
4. **Diagrama draw.io compartido:** la página «Final 1.3 (M08)» se añade en la carpeta compartida del equipo. `bd/assets/ER Pintuclic.drawio.xml` no se modifica porque es una exportación antigua de una sola página.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `bd/sql/schema_pintuclic.sql` | Esquema 3.8: ENUM de estados, migración 0.1, `DEFAULT 'orden_confirmada'`, 3 tablas y 6 índices. |
| **[MODIFICADO]** | `bd/sql/seed_pintuclic.sql` | `ORD-2026-0001` en `orden_confirmada`; historial, nota y contacto de ejemplo; `setval` de las 3 secuencias. |
| **[MODIFICADO]** | `backend/src/core/db/types.ts` | `EnumEstadoOrden` y tablas `HistorialEstadoOrden`, `NotaOrden` y `ContactoOrden`. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/dtos/ordenes.dto.ts` | Lista de estados del filtro. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/services/ordenes.service.ts` | Clasificación de Mis pedidos con los 8 estados. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/__tests__/m08.test.ts` | Estados nuevos y una prueba de estados intermedios y terminales (52 pruebas). |
| **[MODIFICADO]** | `bd/docs/WALKTHROUGH_DATABASE.md` | Versión 2.6 con la plantilla oficial y la verificación. |
| **[MODIFICADO]** | `bd/docs/DOCUMENTACION_BASE_DATOS.md` | Historial de versiones, diagrama Mermaid, diccionario y ENUM. |
| **[MODIFICADO]** | `bd/docs/CHANGELOG_DATABASE.md` | Entrada v2.6. |
| **[MODIFICADO]** | `bd/README.md` | 47 tablas y versión activa. |
| **[MODIFICADO]** | `docs/walkthroughs/M08/PROPUESTA_MODELO_DATOS_M08.md` | Secciones 1, 2 y 8 marcadas como aplicadas. |
| **[NUEVO]** | `docs/walkthroughs/M08/walkthrough_v0.3.34.0_M08_modelo_datos_estados_historial_backend.md` | Este documento. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v0.3.34.0`. |
| **[MODIFICADO]** | `.github/version.txt` | `0.3.33.1` → `0.3.34.0`. |

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ`
  * `tsc --noEmit` y `npm run lint` limpios.
  * **52/52** pruebas en memoria (`npx tsx src/modules/m08-ordenes/__tests__/m08.test.ts`).
  * **20/20** pruebas de integración (`npx tsx src/modules/m08-ordenes/__tests__/m08.integracion.test.ts`) en la base migrada y en una base nueva.
* **Validación contra PostgreSQL:** `✅ LOCAL` (PostgreSQL 15.19):

  | Prueba | Resultado |
  | :--- | :--- |
  | Migración de una base con datos | ✅ `pagado` → `orden_confirmada` |
  | Ejecución repetida | ✅ Sin errores |
  | Base nueva | ✅ 47 tablas y 8 estados |
  | Simulación del despliegue con `psql -v ON_ERROR_STOP=1` sobre el esquema y el seed actuales de `develop`, dos veces | ✅ Código 0; sin duplicados; líneas, pagos y facturas intactos |
* **Versión:** `✅ 0.3.34.0` en `.github/version.txt` y entrada en `docs/CHANGELOG.md`.
