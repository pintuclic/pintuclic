# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v2.8.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M01 - Catálogo de Productos`
* **Fecha de Entrega:** `09/09/2026`
* **Autor / Responsable:** `Agente de IA (backend)`
* **Estado de la Implementación:** `⚠️ PARCIAL CON DEPENDENCIAS` (publicar parcial; variantes/imágenes en otras HU)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-CAT-02** | Gestión de productos | **Parcial — CRUD + reglas + publicar parcial** | `POST/GET/PATCH /api/catalogo/productos` (+`/publicar`, `/despublicar`, `/desactivar`, `/reactivar`), `POST/GET/PATCH /api/catalogo/tipos-resina` (+estado) |

### Descripción del Alcance de la Versión

| Requisito | Estado |
| :--- | :---: |
| RF-CAT-02-01 — CRUD + búsqueda + cambio de estado de productos | ✅ Implementado |
| RF-CAT-02-02 — marca obligatoria, ≥1 subcategoría, línea+resina en pinturas | ✅ Implementado |
| RF-CAT-02-03 — clase de color obligatoria; inmutable si ya hay variantes | ✅ Implementado (verifica `variante`) |
| RF-CAT-02-04 — tipo de resina como catálogo administrable | ✅ Implementado |
| RF-CAT-02-05 — publicar exige ≥1 variante activa **y** ≥1 imagen | ⚠️ Parcial — valida variante activa; imagen diferida a HU-CAT-07 |

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **RF-CAT-02-02:** marca obligatoria y existente; al menos una subcategoría existente; una pintura (`clase_color != sin_color`) exige línea + resina; una brocha (`sin_color`) puede omitirlas. Toda línea indicada debe pertenecer a la marca del producto (RF-CAT-11-02); toda resina indicada debe estar activa.
- **RF-CAT-02-03:** clase de color obligatoria; no puede cambiarse cuando el producto ya tiene variantes (se consulta la tabla `variante`).
- **RF-CAT-02-04:** el tipo de resina es un catálogo administrable (`tipo_resina`), no una lista fija en el código.
- **RF-CAT-02-05 (parcial):** `publicar` exige al menos una variante activa; la exigencia de imagen queda diferida a HU-CAT-07.
- **RF-CAT-09-04:** al reactivar un producto se verifica que su marca (y su línea, si tiene) estén activas.

### B. Decisiones de Diseño
- La **marca del producto no es editable** tras crearlo (evita romper la integridad línea/color de la marca). Si el negocio lo requiere, se abordará como cambio aparte.
- La relación producto↔subcategoría se modela como tabla N:M (`producto_subcategoria`), que es la relación real que reemplaza el remanente `linea.id_sub_subcategoria` del árbol de categorías previo.

### C. Políticas Transversales Validadas
- 🛡️ **M17 - Permisos:** rutas protegidas por `catalogo.ver` / `catalogo.crear` / `catalogo.editar` / `catalogo.eliminar` vía `guardas.protegido(...)` de M20. **Nota:** la especificación menciona el permiso «Gestión de productos», pero el catálogo oficial de permisos del sistema (seed M17) colapsa productos y catálogo en los códigos `catalogo.*` (`catalogo.crear` = "Crear productos y variantes"); se usan esos para no alterar el catálogo de M17.
- 🔒 **M20 - Autorización en servidor:** verificación exclusivamente en backend (RNF-SEG-03-01).

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CAT-02-01** | Producto con nombre, marca, línea y subcategoría válidos se registra. | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-02-02** | Vinilo sin marca/subcategoría/línea se rechaza indicando el faltante. | `m01.test.ts` (DTO + servicio) | ✅ **CUMPLIDO** |
| **CA-CAT-02-03** | Brocha sin línea ni resina se guarda. | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-02-04** | Producto sin clase de color se rechaza. | DTO Zod (clase obligatoria) | ✅ **CUMPLIDO** |
| **CA-CAT-02-05** | Producto entonable con variantes no puede pasar a colores fijos. | `m01.test.ts` (bloqueo por variantes) | ✅ **CUMPLIDO** |
| **CA-CAT-02-06** | Producto sin variante activa o sin imagen no puede publicarse. | Variante activa ✅; imagen ⚠️ diferida a HU-CAT-07 | ⚠️ **PARCIAL** |
| **CA-CAT-02-07** | Cambio de descripción se refleja sin alterar órdenes. | Edición soportada; órdenes fuera de M01 | ✅ **CUMPLIDO (parte M01)** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **Esquema de BD:** `bd/sql/schema_pintuclic.sql` v3.1 (`producto` enriquecido, `tipo_resina`, `producto_subcategoria`).
- **Marca (HU-CAT-04), Línea (HU-CAT-11), Subcategoría (HU-CAT-01):** el producto los referencia y valida.

### B. Dependencias Hacia Adelante
- **HU-CAT-03 (Variantes):** poblará `variante` (ya referenciada por `producto`); la forma de la variante depende de `clase_color`. También habilita el bloqueo por variantes de RF-CAT-02-03 en escenarios reales y la publicación completa.
- **HU-CAT-07 (Imágenes):** completará la exigencia de imagen para publicar (RF-CAT-02-05).
- **HU-CAT-12 (flujo 2):** la asignación de bases a un producto entonable (RF-CAT-12-02/03) ya puede construirse sobre `producto.clase_color = entonable`.

### ⚠️ Limitaciones Conocidas y Aprobadas por el Product Owner
1. **Publicar parcial:** valida variante activa; la exigencia de imagen se difiere a HU-CAT-07 (aprobado como "publicar parcial").
2. **Marca no editable** tras crear el producto (decisión de diseño para no romper integridad de marca).
3. **Permiso `catalogo.*`:** se usa el catálogo oficial de permisos existente en lugar de crear `productos.*` (evita tocar M17).

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `bd/sql/schema_pintuclic.sql` | v3.1: `enum_clase_color`, tablas `tipo_resina` y `producto_subcategoria`, `producto` enriquecido, índices. |
| **[MODIFICADO]** | `bd/sql/seed_pintuclic.sql` | Semillas de `tipo_resina`, `producto` (marca/clase/resina) y `producto_subcategoria` + setval. |
| **[MODIFICADO]** | `backend/src/core/db/types.ts` | `ProductoTable` ampliada, `TipoResinaTable`, `ProductoSubcategoriaTable`, `EnumClaseColor` + helpers. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/dtos/productos.dto.ts` | Esquemas Zod de producto (crear/actualizar). |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/dtos/resinas.dto.ts` | Esquemas Zod de tipo de resina. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/repositories/productos.repository.ts` | Acceso Kysely a `producto` + `producto_subcategoria` (transacciones, conteo de variantes). |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/repositories/resinas.repository.ts` | Acceso Kysely a `tipo_resina`. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/services/productos.service.ts` | Reglas de negocio de productos (RF-CAT-02-02/03/05). |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/services/resinas.service.ts` | Reglas del catálogo de tipos de resina. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/controllers/productos.controller.ts` | Controlador HTTP de productos (+publicar/despublicar/búsqueda). |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/controllers/resinas.controller.ts` | Controlador HTTP de tipos de resina. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/interfaces/m01.interfaces.ts` | Nuevo contrato `ProductoDetalle`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/m01.routes.ts` | Inyección y rutas de `productos` y `tipos-resina`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/__tests__/m01.test.ts` | +15 pruebas de HU-CAT-02 (72/72 en total). |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v2.8.0`. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ`
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (`tsc --noEmit` limpio, `npm run lint` limpio, 72/72 pruebas en memoria)
* **Validación contra PostgreSQL real:** `✅ SÍ` (reset de esquema + seed en `pintuclic-db`: `producto`, `tipo_resina`, `producto_subcategoria`, FKs y datos verificados; 40 tablas)
* **Apego al Alcance Aprobado:** `✅ RF-CAT-02-01/02/03/04; RF-CAT-02-05 parcial (imagen diferida a HU-CAT-07)`
