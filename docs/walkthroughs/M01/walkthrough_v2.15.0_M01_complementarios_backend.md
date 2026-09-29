# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v2.15.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M01 - Catálogo de Productos`
* **Fecha de Entrega:** `09/09/2026`
* **Autor / Responsable:** `Agente de IA (backend)`
* **Estado de la Implementación:** `⚠️ PARCIAL POR DEPENDENCIAS` (config a nivel categoría y combos agotados diferidos)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-CAT-08** | Productos complementarios | **Núcleo completo (nivel producto)** | `GET /api/catalogo/publico/productos/:id/complementarios` + config en el update de producto |

### Descripción del Alcance de la Versión

| Requisito | Estado |
| :--- | :---: |
| RF-CAT-08-01 — asociar la categoría de la que se extraen los complementarios | ✅ A nivel producto (nivel categoría diferido) |
| RF-CAT-08-02 — hasta 4, patrocinados primero; fallback a patrocinados; ocultar si no hay | ✅ Implementado |
| RF-CAT-08-03 — excluir el propio producto, variantes inactivas y combos agotados | ✅ Producto propio y no publicados; combos agotados diferido |

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **RF-CAT-08-01:** cada producto puede declarar `id_categoria_complementaria`; al configurarla se valida que la categoría exista.
- **RF-CAT-08-02:** el endpoint devuelve hasta 4 productos activos+publicados de esa categoría, con los `patrocinado=true` primero. Si no hay categoría configurada o no arroja candidatos, cae a los productos patrocinados. Si tampoco hay, devuelve lista vacía (el front oculta la sección — CA-CAT-08-03).
- **RF-CAT-08-03 / CA-CAT-08-04:** se excluye el propio producto y solo se consideran productos activos y publicados.

### B. Decisiones de Diseño / Alcance
- La configuración se hace **a nivel de producto** (la especificación permite "producto o categoría"); el default a nivel categoría queda diferido.
- La exclusión de **combos agotados** (RF-CAT-08-03) depende de la existencia de combos y su stock (HU-CAT-13 / M05-M08), y queda diferida.
- **CA-CAT-08-05** (no sugerir complementarios en el carrito) corresponde a M05.

### C. Políticas Transversales Validadas
- 🛡️ **M17:** la configuración usa el update de producto (permiso `catalogo.editar`); el endpoint de complementarios es **público** (parte de la ficha, HU-CAT-06).
- 🔒 **M20:** solo lectura pública; sin datos sensibles.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CAT-08-01** | Categoría complementaria asociada → productos activos de esa categoría. | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-08-02** | Patrocinados aparecen antes; sin categoría, se muestran patrocinados. | `m01.test.ts` (orden + fallback) | ✅ **CUMPLIDO** |
| **CA-CAT-08-03** | Sin categoría y sin patrocinados → no se muestra la sección. | Devuelve lista vacía (el front oculta) | ✅ **CUMPLIDO (backend)** |
| **CA-CAT-08-04** | El propio producto no aparece entre sus complementarios. | `m01.test.ts` | ✅ **CUMPLIDO** |
| **CA-CAT-08-05** | En el carrito no se sugieren complementarios. | Corresponde a M05 | ⏸️ **FUERA DE M01** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- Producto (HU-CAT-02), Categoría/Subcategoría (HU-CAT-01), `publicado` (HU-CAT-02), consulta pública (HU-CAT-06).

### B. Dependencias Hacia Adelante
- **HU-CAT-13 (combos) / M05-M08:** permitirán excluir combos agotados (RF-CAT-08-03).
- **M05 (carrito):** aplicará CA-CAT-08-05.

### ⚠️ Limitaciones Conocidas
1. **Config a nivel categoría diferida** (solo a nivel producto por ahora).
2. **Combos agotados** no se excluyen aún (dependen de combos/stock).

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `bd/sql/schema_pintuclic.sql` | v3.6: `producto.id_categoria_complementaria` (FK) y `producto.patrocinado` + índice. |
| **[MODIFICADO]** | `bd/sql/seed_pintuclic.sql` | Complementaria y patrocinado de siembra. |
| **[MODIFICADO]** | `backend/src/core/db/types.ts` | `ProductoTable` con las columnas nuevas. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/dtos/productos.dto.ts` | Update admite `id_categoria_complementaria` y `patrocinado`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/services/productos.service.ts` | Validación de categoría complementaria + mapeo en la ficha. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/repositories/catalogo-publico.repository.ts` | `complementariosPorCategoria` y `patrocinados`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/services/catalogo-publico.service.ts` | Lógica de complementarios (patrocinados primero + fallback). |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/controllers/catalogo-publico.controller.ts` | Endpoint de complementarios. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/interfaces/m01.interfaces.ts` | Campos de complementarios en `ProductoDetalle`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/m01.routes.ts` | Inyección de `CategoriasRepository` en `ProductosService` + ruta pública de complementarios. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/__tests__/m01.test.ts` | +5 pruebas de HU-CAT-08 (123/123 en total). |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v2.15.0`. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ`
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (`tsc --noEmit` limpio, `npm run lint` limpio, 123/123 pruebas en memoria)
* **Validación contra PostgreSQL real:** `✅ SÍ` (reset de esquema + seed en `pintuclic-db`: columnas y FK de complementarios; 43 tablas)
* **Apego al Alcance:** `✅ RF-CAT-08-01/02 + CA-CAT-08-04; nivel categoría y combos agotados diferidos`
