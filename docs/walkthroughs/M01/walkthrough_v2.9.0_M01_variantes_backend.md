# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v2.9.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M01 - Catálogo de Productos`
* **Fecha de Entrega:** `09/09/2026`
* **Autor / Responsable:** `Agente de IA (backend)`
* **Estado de la Implementación:** `✅ NÚCLEO COMPLETO (backend)` — RF-CAT-03-07 es de frontend

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-CAT-03** | Gestión de variantes | **Núcleo backend completo** | `POST/GET/PATCH /api/catalogo/variantes` (+`/desactivar`, `/reactivar`), `GET /api/catalogo/productos/:idProducto/variantes`, `POST/GET/PATCH /api/catalogo/presentaciones` (+estado) |

### Descripción del Alcance de la Versión

| Requisito | Estado |
| :--- | :---: |
| RF-CAT-03-01 — registrar/editar/desactivar variantes; sin borrado físico | ✅ Implementado |
| RF-CAT-03-02 — forma según clase (entonable→base, colores_fijos→color, sin_color→ninguno) | ✅ Implementado |
| RF-CAT-03-03 — sin variantes idénticas; base/color de la marca; existencia no negativa | ✅ Implementado |
| RF-CAT-03-04 — precio y existencia sobre la variante física | ✅ Implementado |
| RF-CAT-03-05 — presentación como entidad propia con volumen numérico | ✅ Implementado |
| RF-CAT-03-06 — ID interno propio; código de proveedor (SAMIT) único | ✅ Implementado |
| RF-CAT-03-07 — actualizar precio/info al cambiar presentación o color en la ficha | ⏸️ Frontend — el modelo de datos ya lo soporta |

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **RF-CAT-03-02 (forma por clase):** entonable = producto + base + presentación; colores_fijos = producto + color + presentación; sin_color = producto + presentación. Se rechaza asignar color a una entonable o base a una de colores fijos (CA-CAT-03-03/04).
- **RF-CAT-03-03 (integridad):** no se admiten dos variantes idénticas del mismo producto (unicidad de forma con `UNIQUE NULLS NOT DISTINCT`); la base/color debe pertenecer a la marca del producto y estar activa (CA-CAT-03-06); la existencia referencial no puede ser negativa (CA-CAT-03-11).
- **RF-CAT-03-04:** precio y existencia viven en la variante física, nunca en el color aislado.
- **RF-CAT-03-05:** la presentación es entidad propia (nombre + volumen numérico) para comparar precios; no se elimina físicamente si está referenciada, solo se desactiva (CA-CAT-03-10).
- **RF-CAT-03-06:** el ID de la variante es autogenerado (CA-CAT-03-07); el código de proveedor es único cuando existe (CA-CAT-03-08).
- **RF-CAT-03-01 / RF-CAT-09-04/05:** sin borrado físico (solo desactivación); al reactivar se verifica que producto, presentación y base/color estén activos.

### B. Efecto sobre HU-CAT-02
Al existir ya la entidad `variante` completa, el `publicar` de productos (RF-CAT-02-05) queda operativo de extremo a extremo en su parte de "variante activa" (la exigencia de imagen sigue pendiente de HU-CAT-07).

### C. Políticas Transversales Validadas
- 🛡️ **M17 - Permisos:** rutas protegidas por `catalogo.*` vía `guardas.protegido(...)` de M20 (el catálogo oficial de permisos usa `catalogo.crear` = "Crear productos y variantes").
- 🔒 **M20 - Autorización en servidor:** verificación exclusivamente en backend (RNF-SEG-03-01).

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CAT-03-01/02** | Variante entonable con base y presentación válidas; rechaza idéntica. | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-03-03** | Rechaza color en una variante entonable. | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-03-04** | Brocha (sin color) se guarda sin base ni color; no admite base. | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-03-05** | Un color por variante en colores fijos. | `m01.test.ts` (forma por clase) | ✅ **CUMPLIDO** |
| **CA-CAT-03-06** | Rechaza base de otra marca. | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-03-07** | ID propio autogenerado. | `variante` SERIAL | ✅ **CUMPLIDO** |
| **CA-CAT-03-08** | Rechaza código de proveedor duplicado. | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-03-11** | Rechaza existencia referencial negativa. | `m01.test.ts` (DTO + CHECK) | ✅ **CUMPLIDO** |
| **CA-CAT-03-10** | Presentación referenciada no se elimina, solo se desactiva. | Sin endpoint de borrado físico; solo desactivar | ✅ **CUMPLIDO** |
| **CA-CAT-03-09** | Actualiza precio/info al cambiar presentación/color en la ficha. | Frontend (RF-CAT-03-07) | ⏸️ **DIFERIDO (frontend)** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **Esquema de BD:** `bd/sql/schema_pintuclic.sql` v3.2 (`presentacion`, `variante` enriquecida). Requiere PostgreSQL 15+ (`UNIQUE NULLS NOT DISTINCT`).
- **Producto (HU-CAT-02), Base (HU-CAT-12), Color (HU-CAT-05):** la variante los referencia y valida.

### B. Dependencias Hacia Adelante
- **HU-CAT-02 (publicar):** ya puede validar variante activa de forma real.
- **HU-CAT-07 (imágenes):** una imagen puede asociarse a variante/color; completa el `publicar`.
- **HU-CAT-12 (flujo 2/3):** las variantes entonables (producto+base) son la base para el entonado (color↔base) cuando el negocio resuelva RF-CAT-12-12.

### ⚠️ Limitaciones Conocidas
1. **RF-CAT-03-07** (actualización reactiva de precio/color en la ficha) es responsabilidad del frontend; el backend ya expone el dato por variante.
2. **Validación contra PostgreSQL real:** realizada — se aplicó el reset de esquema (drop + recreate + seed) contra `pintuclic-db` y se verificaron la estructura de `variante` v3.2 (unicidad de forma con `NULLS NOT DISTINCT`, unicidad de código, CHECKs y FKs), la tabla `presentacion` y los datos semilla (41 tablas).

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `bd/sql/schema_pintuclic.sql` | v3.2: tabla `presentacion`, `variante` enriquecida (base/presentación/existencia/código, unicidad de forma), índices. |
| **[MODIFICADO]** | `bd/sql/seed_pintuclic.sql` | Semillas de `presentacion` y variantes con presentación + existencia + setval. |
| **[MODIFICADO]** | `backend/src/core/db/types.ts` | `PresentacionTable`, `VarianteTable` ampliada + helpers. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/dtos/presentaciones.dto.ts` | Esquemas Zod de presentación. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/dtos/variantes.dto.ts` | Esquemas Zod de variante. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/repositories/presentaciones.repository.ts` | Acceso Kysely a `presentacion`. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/repositories/variantes.repository.ts` | Acceso Kysely a `variante` (unicidad de forma y de código). |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/services/presentaciones.service.ts` | Reglas de negocio de presentaciones. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/services/variantes.service.ts` | Reglas de negocio de variantes (RF-CAT-03-02/03/06). |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/controllers/presentaciones.controller.ts` | Controlador HTTP de presentaciones. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/controllers/variantes.controller.ts` | Controlador HTTP de variantes. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/interfaces/m01.interfaces.ts` | Contratos `PresentacionDetalle` y `VarianteDetalle`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/m01.routes.ts` | Inyección y rutas de `variantes` y `presentaciones`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/__tests__/m01.test.ts` | +14 pruebas de HU-CAT-03 (86/86 en total). |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v2.9.0`. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ`
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (`tsc --noEmit` limpio, `npm run lint` limpio, 86/86 pruebas en memoria)
* **Validación contra PostgreSQL real:** `✅ SÍ` (reset de esquema + seed en `pintuclic-db`: `variante`, `presentacion`, unicidad de forma/código, CHECKs, FKs y datos verificados; 41 tablas)
* **Apego al Alcance Aprobado:** `✅ RF-CAT-03-01..06; RF-CAT-03-07 es frontend`
