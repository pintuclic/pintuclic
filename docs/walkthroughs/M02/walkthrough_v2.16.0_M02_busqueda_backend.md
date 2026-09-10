# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v2.16.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M02 - Búsqueda y navegación`
* **Fecha de Entrega:** `09/09/2026`
* **Autor / Responsable:** `Agente de IA (backend)`
* **Estado de la Implementación:** `✅ NÚCLEO COMPLETO` (búsqueda de HU-BUS-01; filtros/orden/paginación numerada en HUs posteriores)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-BUS-01** | Búsqueda de productos | **Núcleo completo** | `GET /api/busqueda/productos` |

### Descripción del Alcance de la Versión

| Requisito | Estado |
| :--- | :---: |
| RF-BUS-01-01 — texto libre, sin autenticación, sin longitud mínima; vacío → catálogo completo | ✅ Implementado |
| RF-BUS-01-02 — búsqueda resuelta en el servidor, no en el navegador | ✅ Implementado |
| RF-BUS-01-03 — busca sobre nombre, marca, línea, color y descripción; insensible a mayúsculas/acentos; tolera typos | ✅ Implementado (`unaccent` + `pg_trgm`) |
| RF-BUS-01-04 — producto una sola vez, excluye inactivos, informa sin resultados | ✅ Implementado (`EXISTS` + `total=0`) |
| RF-BUS-01-05 — buscar por color de la carta: preparados y entonables | ✅ Implementado |
| RF-BUS-01-06 — falla del servicio sin exponer error técnico | ✅ Implementado (errorHandler global) |
| RNF-BUS-01-01 — resultados en ≤ 5 s | ✅ Consulta paginada indexable (ver §5) |

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **RF-BUS-01-01:** el término es opcional y sin longitud mínima; vacío o solo espacios ⇒ catálogo completo (productos activos + publicados).
- **RF-BUS-01-03:** matching insensible a mayúsculas y acentos vía `unaccent(lower(...))`, y tolerancia a errores tipográficos vía `word_similarity` de `pg_trgm` (umbral `0.3`) combinada con coincidencia por subcadena `ILIKE`. Cubre nombre y descripción del producto, nombre de marca, nombre de línea y nombre de color.
- **RF-BUS-01-04:** se consulta la tabla `producto` filtrada con subconsultas `EXISTS`; al no haber joins que multipliquen filas, cada producto aparece una sola vez. Se excluye `estado <> 'activo'` y `publicado = false`. Sin coincidencias ⇒ `items: []`, `total: 0` (el frontend informa "sin resultados").
- **RF-BUS-01-05:** el color se resuelve por dos vías: **preparado** (existe una variante activa del producto con ese color) o **entonable** (`producto.clase_color = 'entonable'` y el color existe en la carta de la marca del producto).
- **Orden por defecto:** relevancia por similitud del nombre (desc) con desempate estable alfabético por nombre. El ordenamiento configurable (precio/novedad) y la relevancia ponderada completa son HU-BUS-03.

### B. Decisión de Diseño
- **Endpoint público sin guardas de M20** (igual que la consulta pública de M01): la búsqueda es anónima por requisito (CA-BUS-01-04). Solo lectura.
- **`unaccent` + `pg_trgm`** (features nativas de PostgreSQL) en lugar de lógica de similitud en la capa de aplicación: menos código y ejecución en el motor. Requiere habilitar las extensiones (prerequisito de BD, §5).
- **Se ignoró el diagrama `M02/busqueda de productos` por instrucción del PO.** Además, su rama de "ingreso de credenciales / credenciales válidas" contradecía la especificación escrita (la búsqueda es anónima, RF-BUS-01-01 / CA-BUS-01-04); se implementó según la documentación funcional.

### C. Políticas Transversales Validadas
- 🔒 **M20 (HU-SEG-06):** endpoint de solo lectura; no expone datos sensibles ni credenciales. Los errores no controlados se uniforman en el `errorHandler` global sin filtrar detalle técnico (RF-BUS-01-06 / CA-BUS-01-07).
- 🛡️ **M17 / 📧 M18:** N/A para esta HU (aplican a HU-BUS-06).

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-BUS-01-01** | Hay coincidencias por nombre → las devuelve; ninguna → informa sin resultados. | `predicado` sobre `p.nombre` + `total=0` | ✅ **CUMPLIDO** |
| **CA-BUS-01-02** | Buscar con acentos/mayúsculas da los mismos resultados. | `unaccent(lower(...))` en término y columnas | ✅ **CUMPLIDO** |
| **CA-BUS-01-03** | Producto inactivo no aparece. | `where estado='activo' and publicado=true` | ✅ **CUMPLIDO** |
| **CA-BUS-01-04** | Sin sesión, la búsqueda no pide autenticación. | Ruta pública sin guardas | ✅ **CUMPLIDO** |
| **CA-BUS-01-05** | Buscar nombre de línea o color → productos correspondientes. | `EXISTS` sobre `linea` y `color` | ✅ **CUMPLIDO** |
| **CA-BUS-01-06** | Tres variantes coinciden → el producto aparece una sola vez. | Filtro sobre `producto` con `EXISTS` (sin join) | ✅ **CUMPLIDO** |
| **CA-BUS-01-07** | Servicio no disponible → sin exponer error técnico. | `errorHandler` global (HU-SEG-06) | ✅ **CUMPLIDO** |

> Nota de validación: la lógica de servicio (normalización del término, paginación) se cubre con `m02.test.ts` (8/8). El matching SQL (`unaccent`/`pg_trgm`) se validará contra PostgreSQL real una vez habilitadas las extensiones en `pintuclic-db`.

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **M01 Catálogo:** tablas `producto`, `marca`, `linea`, `color`, `variante` y el flag `publicado`. La búsqueda opera de solo lectura sobre ellas.

### B. Dependencias Hacia Adelante
- **M05 Carrito:** la búsqueda habilita encontrar productos para agregarlos.
- **HU-BUS-02/03/05:** filtros, ordenamiento configurable y paginación numerada se montan sobre esta consulta.
- **M06 Reglas y Descuentos:** necesario para el filtro/orden por **precio final tras descuentos** (HU-BUS-02/03); no aplica a HU-BUS-01.

### C. Prerrequisito de Infraestructura (BD — global)
- Deben habilitarse las extensiones de PostgreSQL:
  ```sql
  CREATE EXTENSION IF NOT EXISTS unaccent;
  CREATE EXTENSION IF NOT EXISTS pg_trgm;
  ```
- **Recomendado (rendimiento, RNF-BUS-01-01):** índice GIN de trigramas para acelerar `word_similarity`, p. ej. `CREATE INDEX ... USING gin (unaccent(lower(nombre)) gin_trgm_ops)`. Su inclusión en `bd/sql/schema_pintuclic.sql` es responsabilidad del equipo de BD (archivo fuera de este módulo).

### ⚠️ Limitaciones Conocidas
1. **Extensiones no versionadas en el esquema:** habilitadas por comando sobre el contenedor; falta coordinarlas en `schema_pintuclic.sql` para que sobrevivan a `db:reset`.
2. **Sin índice GIN aún:** con catálogos grandes conviene el índice de trigramas para sostener el RNF de 5 s.
3. **Comodines del término (`%`, `_`) no escapados:** al ser lectura pública sin efectos, se aceptan tal cual; la rama de similitud cubre el matching de todos modos.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[NUEVO]** | `backend/src/modules/m02-busqueda/interfaces/m02.interfaces.ts` | Contratos (`ProductoBusqueda`, `PaginaBusqueda`). Solo tipos. |
| **[NUEVO]** | `backend/src/modules/m02-busqueda/dtos/busqueda.dto.ts` | DTO Zod de la query (`q`, `pagina`, `limite`). |
| **[NUEVO]** | `backend/src/modules/m02-busqueda/repositories/busqueda.repository.ts` | Consulta Kysely con `unaccent`/`pg_trgm` y `EXISTS` por marca/línea/color. |
| **[NUEVO]** | `backend/src/modules/m02-busqueda/services/busqueda.service.ts` | Normalización del término y cálculo de paginación. |
| **[NUEVO]** | `backend/src/modules/m02-busqueda/controllers/busqueda.controller.ts` | Controlador HTTP público (valida query con Zod). |
| **[NUEVO]** | `backend/src/modules/m02-busqueda/m02.routes.ts` | Enrutador del módulo + inyección de dependencias. |
| **[NUEVO]** | `backend/src/modules/m02-busqueda/__tests__/m02.test.ts` | Suite en memoria (8/8): término y paginación. |
| **[MODIFICADO]** | `backend/src/app.routes.ts` | Montaje del módulo: `appRouter.use('/busqueda', busquedaRoutes)`. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v2.16.0`. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ`
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (`tsc --noEmit` limpio, `npm run lint` limpio, 8/8 pruebas en memoria)
* **Validación contra PostgreSQL real:** `⚠️ PENDIENTE` (requiere habilitar `unaccent` + `pg_trgm` en `pintuclic-db`)
* **Apego al Alcance:** `✅ HU-BUS-01 completa; HU-BUS-02/03/05/06 fuera de alcance de esta versión`
