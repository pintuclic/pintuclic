# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v2.13.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M01 - Catálogo de Productos`
* **Fecha de Entrega:** `09/09/2026`
* **Autor / Responsable:** `Agente de IA (backend)`
* **Estado de la Implementación:** `✅ CONSOLIDACIÓN` (cierra huecos; el resto ya estaba cubierto)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-CAT-09** | Estado y ciclo de vida del catálogo | **Consolidada** | `GET /api/catalogo/marcas/:id/impacto-desactivacion`, `GET /api/catalogo/productos/:id/impacto-desactivacion` + cierre de cascada marca→productos |

### Estado por requisito

| Requisito | Estado | Dónde |
| :--- | :---: | :--- |
| RF-CAT-09-01 — sin eliminación física de elementos referenciados | ✅ Ya cubierto | No hay endpoints DELETE de catálogo (solo desactivar); `imagen` es la única con borrado físico y no la referencian órdenes |
| RF-CAT-09-02 — excluir del catálogo público lo desactivado | ⏸️ HU-CAT-06 | Se aplicará al filtrar por `estado='activo'` en la consulta pública |
| RF-CAT-09-03 — avisar el impacto en cascada antes de desactivar | ✅ **Esta versión** | Endpoints de impacto para marca y producto (categorías y líneas ya lo tenían) |
| RF-CAT-09-04 — reactivar verificando dependencias activas | ✅ Ya cubierto | `reactivar` de línea, base, color, subcategoría, producto y variante |
| RF-CAT-09-05 — no reactivar variante entonable con base inactiva | ✅ Ya cubierto | `VariantesService.reactivar` (HU-CAT-03) |
| RF-CAT-09-06 — reactivar variante de brocha sin comprobar base/color | ✅ Ya cubierto | `VariantesService.reactivar` solo comprueba base/color si existen |

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Cierre de la Cascada Marca→Productos (RF-CAT-04-03)
Cuando se implementó la marca (v2.5.0), `producto` no tenía `id_marca`, por lo que su cascada quedó pendiente. Desde HU-CAT-02 la relación existe, así que `MarcasService.desactivar` ahora desactiva también los productos de la marca, además de líneas, bases y colores. (El módulo de campañas aún no existe; su cascada queda pendiente de ese módulo.)

### B. Aviso de Impacto en Cascada (RF-CAT-09-03)
Endpoints de solo lectura que informan, antes de confirmar, qué quedará oculto:
- **Marca:** líneas, bases, colores y productos activos afectados.
- **Producto:** variantes activas e imágenes afectadas.

### C. Políticas Transversales Validadas
- 🛡️ **M17 - Permisos:** los endpoints de impacto usan `catalogo.eliminar` (mismo permiso que la desactivación que informan), vía `guardas.protegido(...)` de M20.
- 🔒 **M20 - Autorización en servidor:** verificación exclusivamente en backend (RNF-SEG-03-01).

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CAT-09-01** | Variante referenciada por orden: no se elimina, se ofrece desactivar. | Sin endpoint DELETE de variante; solo desactivar | ✅ **CUMPLIDO** |
| **CA-CAT-09-02** | Producto desactivado no aparece; orden anterior intacta. | Estado del producto (exclusión pública en HU-CAT-06) | ✅ **CUMPLIDO (backend)** |
| **CA-CAT-09-03** | Antes de desactivar una línea/marca se enumera el impacto. | `impactoDesactivacion` (marca) + `solicitarDesactivacion` (línea) | ✅ **CUMPLIDO** |
| **CA-CAT-09-04** | Producto con una subcategoría activa se puede reactivar. | `ProductosService.reactivar` (no exige todas las subcategorías) | ✅ **CUMPLIDO** |
| **CA-CAT-09-05** | No reactivar variante entonable con base inactiva. | `m01.test.ts` (HU-CAT-03) | ✅ **CUMPLIDO** |
| **CA-CAT-09-06** | Reactivar variante de brocha sin comprobar base/color. | `VariantesService.reactivar` | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- Todas las entidades de M01 ya implementadas (marca, línea, base, color, producto, variante, imagen).

### B. Dependencias Hacia Adelante
- **HU-CAT-06 (consulta pública):** aplicará RF-CAT-09-02 filtrando por `estado='activo'`.
- **M08 (órdenes):** cuando existan órdenes, la imposibilidad de borrado físico de una variante referenciada (RF-CAT-09-01) se ejercerá con datos reales.

### ⚠️ Limitaciones Conocidas
1. **Sin cambios de esquema:** esta versión es de lógica y endpoints; no altera el DDL (43 tablas).
2. **RF-CAT-09-02** depende de HU-CAT-06 (catálogo público).

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/repositories/lineas.repository.ts` | `contarActivasPorMarca`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/repositories/bases.repository.ts` | `contarActivasPorMarca`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/repositories/colores.repository.ts` | `contarActivosPorMarca`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/repositories/productos.repository.ts` | `contarImagenes`, `contarActivosPorMarca`, `desactivarProductosDeMarca`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/services/marcas.service.ts` | Cascada a productos + `impactoDesactivacion`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/services/productos.service.ts` | `impactoDesactivacion`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/controllers/marcas.controller.ts` | Endpoint de impacto. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/controllers/productos.controller.ts` | Endpoint de impacto. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/interfaces/m01.interfaces.ts` | `ImpactoDesactivacionMarca`, `ImpactoDesactivacionProducto`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/m01.routes.ts` | Inyección de `ProductosRepository` en `MarcasService` y rutas de impacto. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/__tests__/m01.test.ts` | +3 pruebas de HU-CAT-09 (113/113 en total). |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v2.13.0`. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ`
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (`tsc --noEmit` limpio, `npm run lint` limpio, 113/113 pruebas en memoria)
* **Validación contra PostgreSQL real:** `ℹ️ N/A — sin cambios de esquema; la lógica se valida en el suite en memoria`
* **Apego al Alcance:** `✅ RF-CAT-09-03 + cierre de cascada marca→productos; resto ya cubierto o en HU-CAT-06`
