# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v2.12.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M01 - Catálogo de Productos`
* **Fecha de Entrega:** `09/09/2026`
* **Autor / Responsable:** `Agente de IA (backend)`
* **Estado de la Implementación:** `✅ NÚCLEO COMPLETO (backend)` — miniaturas (RNF) pendientes

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-CAT-07** | Imágenes del producto | **Núcleo backend completo** | `POST/GET /api/catalogo/productos/:idProducto/imagenes`, `GET /api/catalogo/imagenes/:id/contenido`, `PATCH/DELETE /api/catalogo/imagenes/:id` |

### Descripción del Alcance de la Versión

| Requisito | Estado |
| :--- | :---: |
| RF-CAT-07-01 — cargar, reemplazar, eliminar y ordenar imágenes | ✅ Implementado |
| RF-CAT-07-02 — asociar una imagen a una variante o a un color | ✅ Implementado |
| RF-CAT-07-03 — almacenar en la propia infraestructura | ✅ Implementado (BYTEA) |
| CA-CAT-07-02 — una imagen principal por producto | ✅ Implementado (índice único parcial) |
| RNF-CAT-07-01 — miniaturas optimizadas + caché en listados | ⏸️ Parcial — se sirve con `Cache-Control`; la generación de miniaturas queda pendiente |

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **RF-CAT-07-01:** cargar/reemplazar/eliminar/ordenar imágenes de un producto. El borrado físico está permitido (una imagen no la referencian las órdenes).
- **RF-CAT-07-02:** una imagen puede asociarse a una variante del propio producto o a un color de la marca del producto; se rechaza una variante de otro producto o un color de otra marca.
- **CA-CAT-07-02:** a lo sumo una imagen principal por producto (garantizado por un índice único parcial `WHERE es_principal`); fijar una nueva principal desmarca la anterior.
- **RF-CAT-07-03:** las imágenes se almacenan como BYTEA en la base de datos y se sirven por un endpoint dedicado con `Cache-Control`.

### B. Decisión de Diseño
- La imagen viaja como **data URL base64** dentro del JSON (mismo enfoque que el logotipo de marca), evitando subida multipart y dependencias nuevas. Formatos jpeg/png/webp, máximo 5MB.

### C. Políticas Transversales Validadas
- 🛡️ **M17 - Permisos:** `catalogo.crear` (subir), `catalogo.editar` (modificar), `catalogo.eliminar` (borrar), `catalogo.ver` (listar/servir) vía `guardas.protegido(...)` de M20.
- 🔒 **M20 - Autorización en servidor:** verificación exclusivamente en backend (RNF-SEG-03-01).

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CAT-07-01** | Imagen válida se asocia al producto y se muestra en su ficha. | `m01.test.ts` (carga + servir binario) | ✅ **CUMPLIDO** |
| **CA-CAT-07-02** | Definir la imagen principal; una sola por producto. | `m01.test.ts` (índice único parcial) | ✅ **CUMPLIDO** |
| **CA-CAT-07-03** | Color con imagen asociada se muestra al seleccionarlo. | Asociación imagen↔color soportada (presentación en frontend) | ✅ **CUMPLIDO (backend)** |
| **CA-CAT-07-04** | En listados se descargan miniaturas, no tamaño completo. | Miniaturas pendientes (RNF-CAT-07-01) | ⏸️ **PENDIENTE** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **Esquema de BD:** `bd/sql/schema_pintuclic.sql` v3.5 (tabla `imagen`).
- **Producto (HU-CAT-02), Variante (HU-CAT-03), Color (HU-CAT-05):** referenciados y validados.

### B. Dependencias Hacia Adelante
- **HU-CAT-02 (publicar):** ya puede exigir al menos una imagen además de una variante activa (RF-CAT-02-05).
- **HU-CAT-06 (consulta pública):** servirá miniaturas y las imágenes públicamente; el endpoint de contenido podrá exponerse sin autenticación.

### ⚠️ Limitaciones Conocidas
1. **RNF-CAT-07-01 (miniaturas):** no se generan miniaturas optimizadas (requiere una librería de imágenes como `sharp`, dependencia nativa). Se sirve el binario con `Cache-Control`; la generación de miniaturas queda pendiente.
2. **Servido bajo permiso:** el binario se protege con `catalogo.ver`; el acceso público llegará con HU-CAT-06.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `bd/sql/schema_pintuclic.sql` | v3.5: tabla `imagen` + índices + índice único parcial de principal. |
| **[MODIFICADO]** | `backend/src/core/db/types.ts` | `ImagenTable` + helpers + registro. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/dtos/imagenes.dto.ts` | Esquemas Zod (data URL base64, crear/actualizar). |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/repositories/imagenes.repository.ts` | Acceso Kysely a `imagen` (metadatos vs binario, principal). |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/services/imagenes.service.ts` | Reglas de negocio de imágenes. |
| **[NUEVO]** | `backend/src/modules/m01-catalogo/controllers/imagenes.controller.ts` | Controlador HTTP (incluye servir binario). |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/interfaces/m01.interfaces.ts` | `ImagenDetalle`, `ImagenContenido`. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/m01.routes.ts` | Inyección y rutas de imágenes. |
| **[MODIFICADO]** | `backend/src/modules/m01-catalogo/__tests__/m01.test.ts` | +8 pruebas de HU-CAT-07 (110/110 en total). |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v2.12.0`. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ`
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (`tsc --noEmit` limpio, `npm run lint` limpio, 110/110 pruebas en memoria)
* **Validación contra PostgreSQL real:** `✅ SÍ` (reset de esquema + seed en `pintuclic-db`: tabla `imagen`, FKs e índice único parcial; 43 tablas)
* **Apego al Alcance:** `✅ RF-CAT-07-01/02/03; RNF-CAT-07-01 (miniaturas) pendiente`
