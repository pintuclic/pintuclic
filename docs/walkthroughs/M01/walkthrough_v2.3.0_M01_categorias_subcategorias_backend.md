# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v2.3.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M01 - Catálogo de Productos`
* **Fecha de Entrega:** `08/09/2026`
* **Autor / Responsable:** `Agente de IA (backend)`
* **Estado de la Implementación:** `✅ COMPLETO` (para el alcance de HU-CAT-01)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-CAT-01** | Gestión de categorías y subcategorías | **100% Cumplida** | `POST/GET/PATCH /api/catalogo/categorias`, `POST/GET/PATCH /api/catalogo/subcategorias` |

### Descripción del Alcance de la Versión
Se implementó la administración completa de categorías (nivel 1) y subcategorías (nivel 2) del catálogo: alta, edición, consulta, baja lógica en cascada con advertencia previa de impacto, y reactivación con verificación de dependencias. El código sigue exactamente el diagrama `docs/assets/diagrams/M01/Gestion categorias y subcategorias.png` (árbol de decisión "¿Qué operación?" → Crear/editar vs. Desactivar).

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **RF-CAT-01-01:** nombre obligatorio, máximo 100 caracteres, validado con Zod tanto en categoría como en subcategoría.
- **RF-CAT-01-02:** exactamente 2 niveles de clasificación (categoría → subcategoría); una subcategoría solo puede tener una categoría padre (FK simple, no relación N:M).
- **RF-CAT-01-03:** unicidad de nombre de categoría a nivel raíz (global); unicidad de nombre de subcategoría solo dentro de la misma categoría padre (se admite el mismo nombre bajo padres distintos).
- **RF-CAT-01-04:** desactivación con advertencia previa de cuántos productos y subcategorías se verán afectados (patrón de doble llamada: sin `confirmar` informa el impacto, con `confirmar: true` aplica la baja en cascada). Desactivar una categoría desactiva en cascada sus subcategorías.
- **RF-CAT-09-04 (aplicada por completitud del ciclo de vida):** no se puede reactivar una subcategoría cuya categoría padre siga inactiva.

### B. Políticas Transversales Validadas
- 🛡️ **M17 - Permisos:** Todas las rutas exigen sesión vigente y el permiso «Gestión del catálogo» (`catalogo.ver` / `catalogo.crear` / `catalogo.editar` / `catalogo.eliminar`, ya sembrados en `bd/sql/seed_pintuclic.sql`), verificado en servidor vía `guardas.protegido(...)` de M20 (RF-CAT-01-05).
- 🔒 **M20 - Autorización en servidor:** Ninguna validación de permisos ocurre en el cliente; el guard de M20 es el único punto de verificación (RNF-SEG-03-01).

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CAT-01-01** | Registro de categoría y subcategoría válidas quedan disponibles para asociarles productos. | `m01.test.ts` (servicio) | ✅ **CUMPLIDO** |
| **CA-CAT-01-02** | Categoría sin nombre o subcategoría sin padre se impide e indica el dato faltante. | DTO Zod (`nombre` requerido, `id_categoria` requerido) | ✅ **CUMPLIDO** |
| **CA-CAT-01-03** | Categoría raíz duplicada se rechaza; subcategoría duplicada bajo el mismo padre se rechaza, pero se admite bajo padres distintos. | `m01.test.ts` (servicio) | ✅ **CUMPLIDO** |
| **CA-CAT-01-04** | Las categorías aparecen ordenadas según `orden` y las inactivas no aparecen en el listado activo. | Columna `orden` + filtro `estado` en repositorio | ✅ **CUMPLIDO** (consumo público queda a cargo de HU-CAT-06) |
| **CA-CAT-01-05** | Antes de desactivar, el sistema informa cuántos productos dejarán de verse; al confirmar, desactiva y cascadea a subcategorías. | `m01.test.ts` (servicio) | ✅ **CUMPLIDO** |
| **CA-CAT-01-06** | Un producto bajo tres subcategorías sigue visible si solo una se desactiva. | `m01.test.ts` (servicio) — verificado a nivel de conteo por subcategoría | ✅ **CUMPLIDO** |
| **CA-CAT-01-07** | Empleado sin permiso de gestión del catálogo no puede crear categorías. | `guardas.protegido('catalogo.crear')` (M20) | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (¿Qué necesita este código para operar al 100% en Producción?)
- **M20 Seguridad:** Requiere que `guardas.protegido` y el catálogo de permisos (`catalogo.*`) sigan sembrados en `bd/sql/seed_pintuclic.sql`.
- **Esquema de Base de Datos:** Requiere aplicar el DDL actualizado (`bd/sql/schema_pintuclic.sql` v2.5) para que `categoria` y `subcategorias` cuenten con las columnas `estado` y `orden`.

### B. Dependencias Hacia Adelante (¿A qué otros módulos habilita este desarrollo?)
- **HU-CAT-02 (Gestión de productos) y HU-CAT-11 (Gestión de líneas):** Consumirán `categoria`/`subcategorias` para exigir al menos una subcategoría por producto.
- **HU-CAT-06 (Consulta pública del catálogo):** Reutilizará el campo `estado` para excluir categorías/subcategorías inactivas de la navegación pública, y `orden` para el orden de presentación.

### ⚠️ Nota Importante — Inconsistencia Detectada y Resuelta con Aprobación
Al iniciar esta HU se detectó que `categoria` y `subcategorias` carecían de columnas `estado` y `orden`, imprescindibles para RF-CAT-01-04 y CA-CAT-01-04. Se reportó al Product Owner (protocolo de parada de `AGENTS.md`), quien aprobó explícitamente agregarlas. También se confirmó que `sub_subcategorias` y `linea` (niveles 3 y 4 ya existentes en la BD) quedan fuera del alcance de esta HU, que solo cubre los 2 niveles definidos por RF-CAT-01-02.

Sigue pendiente para historias futuras: la tabla `marca` (requerida por HU-CAT-04) no existe todavía en el esquema; se reportará por separado cuando se aborde esa HU.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ **Verificación de Límites de Módulo:** No se tocaron archivos de otros equipos. Los dos archivos "compartidos" (`types.ts` y `schema_pintuclic.sql`) fueron editados con aprobación explícita del Product Owner por ser un prerrequisito bloqueante de esta HU.

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[BORRADO]** | `backend/src/modules/productos/productos.routes.ts` | Carpeta de prueba vacía, sin uso, confirmada por el Product Owner para eliminar. |
| **[MODIFICADO]** | `backend/src/app.routes.ts` | Se retira el montaje del stub `productos` y se monta `catalogoRoutes` en `/api/catalogo`. |
| **[MODIFICADO]** | `backend/src/core/db/types.ts` | Se agregan `orden` y `estado` a `CategoriaTable` y `SubcategoriasTable` (aprobado por PO). |
| **[MODIFICADO]** | `bd/sql/schema_pintuclic.sql` | DDL v2.5: columnas `orden`/`estado` en `categoria`/`subcategorias` y `UNIQUE(id_categoria, nombre)` en `subcategorias`. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/interfaces/m01.interfaces.ts` | Contratos de tipos (0 runtime) para categorías, subcategorías e impacto de desactivación. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/dtos/categorias.dto.ts` | Esquemas Zod: crear, actualizar y desactivar categoría. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/dtos/subcategorias.dto.ts` | Esquemas Zod: crear, actualizar y desactivar subcategoría. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/repositories/categorias.repository.ts` | Acceso Kysely a `categoria`, incluye conteo de productos/subcategorías afectados. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/repositories/subcategorias.repository.ts` | Acceso Kysely a `subcategorias`, incluye conteo de productos afectados. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/services/categorias.service.ts` | Reglas de negocio de categorías (unicidad, cascada, reactivación). |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/services/subcategorias.service.ts` | Reglas de negocio de subcategorías (unicidad por padre, dependencia de reactivación). |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/controllers/categorias.controller.ts` | Controlador HTTP de categorías. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/controllers/subcategorias.controller.ts` | Controlador HTTP de subcategorías. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/m01.routes.ts` | Ensamblaje del módulo, inyección de dependencias y rutas protegidas por permiso. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/__tests__/m01.test.ts` | Suite de 17 pruebas unitarias sobre los criterios de aceptación de HU-CAT-01. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v2.3.0`. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ`
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (`tsc --noEmit` limpio, `npm run lint` limpio, 17/17 pruebas)
* **Apego al Diagrama de Flujo:** `✅ 100% Coincidente con Diagrama`
