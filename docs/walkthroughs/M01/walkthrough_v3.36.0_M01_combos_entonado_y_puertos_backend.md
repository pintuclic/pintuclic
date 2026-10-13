# Walkthrough v3.36.0 — M01 Combos, entonado color↔base, miniaturas, herencia de complementarios y puertos M06/campañas

## 1. Metadatos de la Implementación
- **Versión:** `v3.36.0` (base de datos `v2.8`, esquema 4.0)
- **Módulo de Origen:** `M01 Catálogo de productos`
- **Fecha y Autor:** 2026-10-13 — Agente IA (Claude), a solicitud del equipo M01. Cambios de base de datos y la dependencia `sharp` autorizados por el líder técnico.
- **Fuente:** `Informe_M01_faltantes_errores_inconsistencias.docx` (6 de octubre de 2026), hallazgos de backend pendientes tras `v3.35.11`.
- **Base de código:** rama `feature/m01-backend-catalogo-publico` con `backend/` y `bd/` sincronizados con `develop` (`395dfc9`).

## 2. Historias de Usuario (HUs) Cubiertas
| Hallazgo | HU / Requisito | Resultado |
| :--- | :--- | :--- |
| M01 06 Impacto de líneas sin reglas M06 | HU-CAT-11 / RF-CAT-11-03 | Resuelto en M01: puerto `ConsultaReglasComerciales`; sin M06 responde `null` (no integrado), nunca un cero falso |
| M01 07 Cascada de marca sin campañas | HU-CAT-04 / RF-CAT-04-03 | Resuelto en M01: puerto `CascadaCampanas` dentro de la misma transacción de la marca |
| M01 08 Combos | HU-CAT-13 / RF-CAT-13-01 a 13-05 | Resuelto en M01: combo con existencia real, exclusión de descuentos, agotado, reserva atómica sin sobreventa y devolución al cancelar |
| M01 11 Miniaturas y optimización | HU-CAT-07 / RNF-CAT-07-01 | Resuelto: miniatura y versión optimizada WebP generadas con `sharp`, listados con miniatura, ficha con optimizada, caché pública con ETag |
| M01 12 Complementarios | HU-CAT-08 / RF-CAT-08-01/03 | Resuelto: herencia por categoría y exclusión de combos agotados |
| M01 13 Carta entonable | HU-CAT-12 / RF-CAT-12-04 a 12-07, RF-CAT-06-04 | Resuelto en backend: combinaciones color↔base, carta solo con colores preparables y resolución de la base consumida |

## 3. Reglas de Negocio y Políticas de Seguridad Aplicadas
- **Puertos (SOLID, inversión de dependencias):** M01 depende de los contratos `ConsultaReglasComerciales` y `CascadaCampanas` (`interfaces/m01.interfaces.ts`). Mientras M06 y campañas no existan se inyectan `reglasComercialesNoIntegradas` y `campanasNoIntegradas` (`services/integraciones-pendientes.ts`) en `m01.routes.ts`; al existir se reemplazan ahí sin tocar el catálogo. `reglas_afectadas: null` reemplaza a `reglas_afectadas: 0` + `reglas_integradas: false`.
- **Combos:**
  - `PUT /api/catalogo/productos/:idProducto/combo` registra el producto como combo con componentes opcionales (CA-CAT-13-02) y `excluido_descuentos`. `uq_combo_producto` garantiza un único combo por producto.
  - La existencia se ajusta con `PATCH /variantes/:id` (RF-CAT-13-05); no se duplicó ese flujo.
  - `combosService.reservarExistencias` descuenta solo variantes de combo con `UPDATE ... WHERE existencia_referencial >= n`, bloqueando la fila: dos compras simultáneas de la última unidad no pueden completarse ambas (CA-CAT-13-05). Las líneas se agrupan y ordenan por variante para un orden de bloqueo estable. Participa de la transacción de quien llama o abre la suya y la revierte completa ante un faltante.
  - `liberarExistencias` devuelve las unidades al cancelar (CA-CAT-13-07). `excluidoDeDescuentos` es el contrato para M06/M08 (CA-CAT-13-09).
  - El catálogo público expone `es_combo` y `agotado`; el combo agotado sigue visible (CA-CAT-13-06) y sale de los complementarios (RF-CAT-13-04, RF-CAT-08-03).
- **Entonado:**
  - `POST/GET/DELETE /api/catalogo/colores/:idColor/bases` declara sobre qué bases se prepara cada color. La base debe ser de la marca del color (RF-CAT-12-03) y estar activa.
  - Una única definición de «color preparable» (`variantesPreparables` en el repositorio público): base declarada para el color, ofrecida por el producto (`producto_base`), activa y con variante y presentación activas. La usan la carta, el conteo de colores del listado y la resolución de la base.
  - `GET /api/catalogo/publico/productos/:id/entonado?id_color=&id_presentacion=` devuelve la variante de base que se consume (RF-CAT-12-05); el cliente nunca elige la base (RF-CAT-12-07).
- **Imágenes (RNF-CAT-07-01):**
  - Puerto `OptimizadorImagenes` con implementación `optimizadorSharp` (`services/optimizador-imagenes.ts`): miniatura ≤ 400 px y optimizada ≤ 1600 px en WebP, respetando la orientación EXIF y sin agrandar. El original se conserva para el panel.
  - Las versiones se generan al cargar o reemplazar la imagen; un archivo que no es una imagen real se rechaza con `IMAGEN_INVALIDA` (antes solo se validaba la cabecera del data URL).
  - `GET /api/catalogo/publico/imagenes/:id/contenido?tamano=miniatura|optimizada|original` (por defecto `optimizada`) lee solo la columna pedida. El listado público usa `miniatura` y la ficha `optimizada`. Respuesta con `Cache-Control: public, max-age=86400` y ETag (304 si no cambió).
  - Las imágenes previas generan y guardan sus versiones en la primera consulta, sin migración manual.
  - Dependencia `sharp` **0.35.5**: se descartó 0.34.x por vulnerabilidades heredadas de libvips/libheif (GHSA-f88m-g3jw-g9cj, GHSA-rgj7-g3m4-5g8c) corregidas en 0.35.5; `npm audit --omit=dev` no reporta `sharp`. El lockfile incluye los binarios `linuxmusl` de la imagen Docker Alpine.
- **Complementarios:** `categoria.id_categoria_complementaria` se valida en el servicio de categorías y la heredan los productos sin configuración propia, por el orden administrado de sus categorías activas.
- **Seguridad:** las rutas administrativas nuevas usan los guardas de M20/M17 existentes (`catalogo.ver` / `catalogo.editar`, 🛡️ HU-ADM-03); las públicas nuevas solo exponen productos elegibles y no devuelven datos sensibles (🔒 HU-SEG-06).

## 4. Criterios de Aceptación Cumplidos (Matriz de Verificación)
| Criterio | Verificación |
| :--- | :--- |
| CA-CAT-11-04 / RF-CAT-11-03 | Unitarias: `null` sin M06 y conteo real con un puerto M06 de prueba |
| RF-CAT-04-03 (campañas + transacción) | Integración: un puerto de campañas que falla revierte marca, línea, base y productos; el exitoso se ejecuta una vez y dentro de la transacción |
| RNF-CAT-07-01 | Unitarias con `sharp` real: genera WebP y rechaza un archivo que no es imagen. Integración: la primera consulta genera y guarda las versiones, las siguientes las reutilizan, el listado apunta a la miniatura, la carga desde el panel guarda versiones y un PNG falso se rechaza |
| CA-CAT-13-01/02/09 | Integración y unitarias: combo con y sin componentes, redefinición sobre el mismo registro, exclusión de descuentos |
| CA-CAT-13-03/05 | Integración: dos reservas simultáneas de las 2 últimas unidades → una se completa, la otra `COMBO_SIN_EXISTENCIA`, existencia 0 (repetido 4 veces, estable) |
| RF-CAT-13-03 | Integración: reserva con una línea sin unidades no descuenta ninguna; reserva dentro de una transacción revertida no descuenta |
| CA-CAT-13-06/07 | Integración: agotado visible en la ficha; al liberar vuelve la unidad y deja de estar agotado |
| RF-CAT-08-01/03 | Integración: herencia de la categoría; combo agotado excluido; combo con unidades incluido |
| RF-CAT-12-03/04/05/06, CA-CAT-12-04/05/06 | Integración: base de otra marca rechazada; carta solo con colores preparables; conteo del listado coherente; base consumida resuelta; combinación no declarada y base desactivada → `COLOR_NO_DISPONIBLE`; el producto sigue a la venta |
| Esquema v4.0 | Creado desde cero, re-ejecutado (idempotente) y migrado sobre una base 3.9 con su seed sin pérdida de datos; seed carga sobre 4.0 |
| Regresión | `m01.test.ts`: **154/154**; `m01.integracion.test.ts`: **50/50**, ejecutadas con la imagen Docker de producción que incluye `sharp` contra PostgreSQL 15 (contenedor `pintuclic-db`, base aislada eliminada al terminar); `tsc --noEmit` y `eslint src/modules/m01-catalogo` limpios |

## 5. Resumen Conceptual de Dependencias Externas
- **M08 Órdenes (otro equipo):** debe llamar `serviciosCatalogo.combosService.reservarExistencias(lineas, trx)` al generar la orden dentro de su transacción, `liberarExistencias` al cancelar y `catalogoPublicoService.resolverEntonado` para registrar `base_consumida` y `color_solicitado` (columnas ya existentes en `linea_orden`). Hasta entonces el descuento de existencias no ocurre en el flujo real de compra.
- **M05 Carrito (otro equipo):** hoy marca `stock_insuficiente` para cualquier variante; según RF-CAT-13-02 solo los combos tienen límite de existencia.
- **M06 Reglas y campañas:** al existir, implementar los puertos e inyectarlos en `m01.routes.ts`, y aplicar `excluidoDeDescuentos`.
- **Negocio:** RF-CAT-12-12 sigue pendiente: el administrador debe registrar qué base exige cada color; sin esas combinaciones la carta entonable queda vacía (comportamiento correcto: no se inventan compatibilidades).
- **Frontend (fuera de alcance):** consumir `/entonado`, `es_combo`/`agotado`, la carta remota y no sugerir complementarios en el carrito (RF-CAT-08-03).
- **No resueltos y por qué:**
  - **M01 05 (permisos separados):** exige un área `productos` en `DEPENDENCIAS_PERMISOS` de M17 (otro equipo) y migrar las asignaciones `catalogo.*` de los empleados actuales.

## 6. Registro de Archivos Modificados / Creados
- **Dependencias:** `backend/package.json` y `backend/package-lock.json` (`sharp` 0.35.5).
- **Base de datos (versión aparte `v2.8`):** `bd/sql/schema_pintuclic.sql`, `bd/docs/CHANGELOG_DATABASE.md`, `bd/docs/WALKTHROUGH_DATABASE.md`, `bd/docs/DOCUMENTACION_BASE_DATOS.md`, `bd/README.md`.
- **Tipos centrales:** `backend/src/core/db/types.ts` (paso 6 de `GUIA_REFACTORIZACION_BD.md`).
- **M01 — nuevos:** `services/optimizador-imagenes.ts`, `dtos/combos.dto.ts`, `repositories/combos.repository.ts`, `repositories/color-bases.repository.ts`, `services/combos.service.ts`, `services/color-bases.service.ts`, `services/integraciones-pendientes.ts`, `controllers/combos.controller.ts`, `controllers/color-bases.controller.ts`.
- **M01 — modificados:** `m01.routes.ts`, `interfaces/m01.interfaces.ts`, `dtos/categorias.dto.ts`, `dtos/catalogo-publico.dto.ts`, `services/categorias.service.ts`, `services/imagenes.service.ts`, `repositories/imagenes.repository.ts`, `services/lineas.service.ts`, `services/marcas.service.ts`, `services/catalogo-publico.service.ts`, `repositories/marcas.repository.ts`, `repositories/catalogo-publico.repository.ts`, `controllers/catalogo-publico.controller.ts`, `__tests__/m01.test.ts`, `__tests__/m01.integracion.test.ts`.
- No se modificaron archivos de M05, M08, M17 ni del frontend.
