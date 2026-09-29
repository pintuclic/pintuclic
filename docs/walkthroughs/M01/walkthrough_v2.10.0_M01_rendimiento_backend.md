# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v2.10.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M01 - Catálogo de Productos`
* **Fecha de Entrega:** `09/09/2026`
* **Autor / Responsable:** `Agente de IA (backend)`
* **Estado de la Implementación:** `⚠️ PARCIAL POR ALCANCE APROBADO` (solo rendimiento; catálogo genérico de atributos diferido)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-CAT-10** | Atributos técnicos del producto | **Parcial — solo rendimiento** | `GET/PATCH /api/catalogo/productos/:idProducto/rendimiento` |

### Descripción del Alcance de la Versión

| Requisito | Estado |
| :--- | :---: |
| RF-CAT-10-02 — rendimiento en m² por galón, con mínimo y máximo | ✅ Implementado |
| RF-CAT-10-03 — derivar el rendimiento por presentación desde el valor por galón y el volumen | ✅ Implementado |
| RF-CAT-10-05 — rendimiento > 0 y mínimo ≤ máximo | ✅ Implementado (DTO + CHECK en BD) |
| RF-CAT-10-01 — catálogo genérico de atributos técnicos asociables al producto | ❌ Excluido en esta versión por decisión del PO |
| RF-CAT-10-04 — presentar los atributos/rendimiento en la ficha (referido a la presentación) | ⏸️ Frontend — el backend ya expone la derivación por presentación |
| RF-CAT-10-06 — conservar el rendimiento usado en la línea de la compra | ⏸️ Diferido — depende de M08 (órdenes) |
| RF-CAT-10-07 — qué otros atributos técnicos se registran | ⏸️ Pendiente de negocio (marcado en la especificación) |

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **RF-CAT-10-02:** el rendimiento se captura por galón con un valor mínimo y uno máximo (columnas `rendimiento_min` / `rendimiento_max`).
- **RF-CAT-10-05:** ambos valores o ninguno; `min > 0` y `min ≤ max`. Se valida en el DTO (Zod) y con un `CHECK` en la base de datos.
- **RF-CAT-10-03:** el rendimiento por presentación se **deriva** (`valor_por_galón × volumen_presentación / volumen_galón`) para las presentaciones activas, sin capturarlo una por una. Ejemplo: 25 m²/galón → 6,25 m² en un cuarto de galón (CA-CAT-10-05).

### B. Decisión de Diseño
- El volumen del galón se toma como constante calibrable (`VOLUMEN_GALON = 3.785`), en la misma unidad en que se registra el volumen de las presentaciones (litros en el seed).
- El rendimiento se modeló como columnas dedicadas del producto (no como una fila de atributo genérico) por su semántica numérica y su derivación.

### C. Políticas Transversales Validadas
- 🛡️ **M17 - Permisos:** `catalogo.ver` (GET) y `catalogo.editar` (PATCH) vía `guardas.protegido(...)` de M20.
- 🔒 **M20 - Autorización en servidor:** verificación exclusivamente en backend (RNF-SEG-03-01).

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CAT-10-01** | Rendimiento de 25 m²/galón con mínimo y máximo iguales. | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-10-02** | Rendimiento de 15 a 20 conserva ambos extremos. | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-10-03** | Rechaza rendimiento con mínimo mayor que el máximo. | `m01.test.ts` (DTO + CHECK) | ✅ **CUMPLIDO** |
| **CA-CAT-10-05** | Vinilo de 25 m²/galón → 6,25 m² en un cuarto de galón. | `m01.test.ts` (`derivarRendimiento`) | ✅ **CUMPLIDO** |
| **CA-CAT-10-04** | Producto sin ningún atributo técnico se guarda sin campos vacíos. | Rendimiento opcional (ambos NULL) | ✅ **CUMPLIDO** |
| **CA-CAT-10-06** | La ficha refiere el rendimiento a la presentación y lo advierte aproximado. | Frontend (RF-CAT-10-04) | ⏸️ **DIFERIDO (frontend)** |
| **CA-CAT-10-07** | Empleado sin permiso no administra atributos técnicos. | Guardas `catalogo.*` de M20 | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **Esquema de BD:** `bd/sql/schema_pintuclic.sql` v3.3 (`producto.rendimiento_min/max`).
- **Presentación (HU-CAT-03):** el volumen de la presentación es la base de la derivación.

### B. Dependencias Hacia Adelante
- **M08 (Órdenes):** conservará el rendimiento con que se calculó una recomendación (RF-CAT-10-06).
- **Frontend:** presentará el rendimiento referido a la presentación seleccionada, advertido como aproximado (RF-CAT-10-04).

### ⚠️ Limitaciones Conocidas y Aprobadas por el Product Owner
1. **Sin catálogo genérico de atributos técnicos** (RF-CAT-10-01): excluido por decisión del PO; solo se implementó el rendimiento.
2. **RF-CAT-10-07** (qué otros atributos existen) sigue marcado como pendiente en la propia especificación.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `bd/sql/schema_pintuclic.sql` | v3.3: columnas `rendimiento_min` / `rendimiento_max` en `producto` + CHECK. |
| **[MODIFICADO]** | `bd/sql/seed_pintuclic.sql` | Rendimiento de siembra (Viniltex 40–45, Esmalte 15–20). |
| **[MODIFICADO]** | `backend/src/core/db/types.ts` | `ProductoTable` con las columnas de rendimiento. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/dtos/rendimiento.dto.ts` | Esquema Zod de establecer rendimiento. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/services/rendimiento.service.ts` | Reglas + `derivarRendimiento` (derivación por presentación). |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/controllers/rendimiento.controller.ts` | Controlador HTTP de rendimiento. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/interfaces/m01.interfaces.ts` | `RendimientoProducto`, `RendimientoPorPresentacion` y rendimiento en `ProductoDetalle`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/services/productos.service.ts` | La ficha del producto incluye el rendimiento. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/m01.routes.ts` | Inyección y rutas de rendimiento. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/__tests__/m01.test.ts` | +8 pruebas de HU-CAT-10 (94/94 en total). |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v2.10.0`. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ`
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (`tsc --noEmit` limpio, `npm run lint` limpio, 94/94 pruebas en memoria)
* **Validación contra PostgreSQL real:** `✅ SÍ` (reset de esquema + seed en `pintuclic-db`: columnas y CHECK de rendimiento verificados; 41 tablas)
* **Apego al Alcance Aprobado:** `✅ RF-CAT-10-02/03/05; RF-CAT-10-01 excluido por el PO; resto diferido`
