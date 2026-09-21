# M01 · Panel de catálogo (frontend)

Módulo del **panel administrativo** de Pintu Clic para gestionar el catálogo:
productos, variantes, categorías, marcas, líneas comerciales y colores.

- **Dominio:** Catálogo / Comercio · Prefijo de historias: `CAT`
- **Especificación:** [`docs/02_MODULOS_FUNCIONALES/M01_ESPECIFICACION_CATALOGO.md`](../../../../docs/02_MODULOS_FUNCIONALES/M01_ESPECIFICACION_CATALOGO.md)
- **Permiso M17:** `GESTION_CATALOGO` (categorías, líneas, marcas, colores) y
  `GESTION_PRODUCTOS` (productos, variantes, imágenes) — revalidados **siempre** en el servidor.
- **Rama:** `feature/m01-dashboard-catalogo`
- **Tamaño:** 15 vistas · 23 componentes · ~155 archivos

---

## 1. Layout y navegación

Las vistas **no traen su propio chrome**. `core/routes/index.ts` monta
`core/layouts/LayoutAdmin.vue` en `/admin` y cuelga las rutas de este módulo
como `children`, de modo que la barra lateral y la superior son permanentes y
no se remontan al navegar:

```ts
{
  path: '/admin',
  component: () => import('@/core/layouts/LayoutAdmin.vue'),
  children: [ ...dashboardCatalogoRoutes ],   // ← este módulo
}
```

Cada vista es, por tanto, un contenedor limpio (`<div class="space-y-6 p-6 lg:p-8">`).
La navegación interna (botones «Cancelar», «Editar», filas de tabla) usa
`irA()` de `composables/usePanelNavegacion.ts`, que delega en `router.push()`.

> **Importante:** no existe ningún `DisenoAdmin.vue`, `BarraLateralAdmin.vue` ni
> `BarraSuperiorAdmin.vue`. Si los ves mencionados en algún documento viejo,
> están obsoletos: ese rol lo cumple `core/layouts/LayoutAdmin.vue`.

## 2. Qué se consume del Design System

Este módulo **no define componentes base propios**. Todo lo transversal viene de
`@/core/components`:

| Del Core | Dónde se usa |
| :--- | :--- |
| `Table` | Las 6 tablas del módulo. Soporta selección de filas (`selectable` + `v-model`). |
| `Paginacion` | Pie de todas las tablas. |
| `Button` | Todas las acciones con estilo (CTA, formularios, modales). |
| `Badge` | Píldoras de estado (publicado / borrador / inactivo…). |
| `Modal` | `ModalDesactivarLinea` y `ModalConfirmarAccion`. |
| `Input` | Campos de texto y numéricos de los formularios (vía vee-validate). |
| `Card` | Envoltorio de `TarjetaEstadistica`. |
| `PageHeader` | Encabezado (título + descripción + acciones) de las vistas de listado. |
| `Tabs` | Pasos de los formularios de producto y variante. |

**Limitación conocida del Core:** `Select`, `Switch`, `Textarea`, `Checkbox`,
`ConfirmarAccion`, `Dropdown`, `Tooltip`, `Alert`, `Spinner`, `Skeleton`,
`Toast`, `ToastContainer`, `Avatar`, `Migas` y `LineaTiempo` están exportados en
el barril pero **son stubs vacíos sin implementar**. Por eso los `<select>`,
`<textarea>` y casillas de este módulo siguen siendo HTML nativo con tokens de
color del sistema, y por eso `ModalConfirmarAccion.vue` envuelve el `Modal` del
Core en vez de usar `ConfirmarAccion`.

## 3. Flujo de datos

Todas las vistas siguen el mismo patrón:

```
views/VistaXxx.vue  ── irA() ──►  usePanelNavegacion() ──►  router.push()
  │  usa
  ▼
composables/useXxx.ts ──────────────┐  (estado + acciones + formateadores)
  │  usa                            │
  ▼                                 ▼
store/xxx.store.ts            composables/useFormatoCatalogo.ts  (Intl es-CO)
  │  llama
  ▼
services/xxx.service.ts  ──►  GET/POST/PATCH  /api/catalogo/...
  │  ▲                             (cliente axios de @/core/api/axios)
  │  └── si falla (o el endpoint no existe todavía)
  ▼
services/xxx.mock.ts     ──►  semilla local → store.usandoDatosDemo = true
```

**Regla:** los `components/` no llaman al store ni al service; reciben `props` y
emiten eventos. La excepción documentada es `FormularioProducto.vue`, que por su
tamaño consume `useProductoFormulario()` directamente (patrón "container").

## 4. Vistas y rutas

| Vista | Ruta | Qué contiene |
| :--- | :--- | :--- |
| `VistaProductos.vue` | `/admin/catalogo/productos` | Filtros (búsqueda + marca), tabla con selección y acciones masivas, orden y paginación. |
| `VistaProductoFormulario.vue` | `/…/productos/nuevo` · `/…/:productoId/editar` | Formulario en 3 pasos (`Tabs`): identidad, atributos y color, imágenes. Aside con vista previa y checklist. |
| `VistaProductoDetalle.vue` | `/…/productos/:productoId` | Ficha de solo lectura con indicadores, pestañas y actividad reciente. |
| `VistaVariantes.vue` | `/admin/catalogo/variantes` | Filtros, tabla con selección, resumen lateral. |
| `VistaVarianteFormulario.vue` | `/…/variantes/nueva` · `/…/:varianteId/editar` | Formulario en 3 pasos: producto y presentación, precio/existencia/color, imágenes. |
| `VistaCategorias.vue` | `/admin/catalogo/categorias` | Árbol de categorías + panel de detalle + modal de desactivación en cascada. |
| `VistaCategoriaFormulario.vue` | `/…/categorias/nueva` · `/…/subcategorias/nueva` · `/…/:categoriaId/editar` | Información general + jerarquía, con vista previa del árbol. |
| `VistaMarcas.vue` | `/admin/catalogo/marcas` | KPIs, tabla y panel lateral de edición rápida. |
| `VistaMarcaFormulario.vue` | `/…/marcas/nueva` · `/…/:marcaId/editar` | Nombre + logotipo (los dos únicos campos reales). |
| `VistaMarcaDetalle.vue` | `/…/marcas/:marcaId` | Ficha de solo lectura: indicadores derivados y pestañas. |
| `VistaLineas.vue` | `/admin/catalogo/lineas` | KPIs, filtros, tabla con selección, modal de desactivación. |
| `VistaLineaFormulario.vue` | `/…/lineas/nueva` · `/…/:lineaId/editar` | Nombre + marca + gama comercial. |
| `VistaColores.vue` | `/admin/catalogo/colores` | Tira de familias cromáticas, filtros, tabla y resumen. |
| `VistaColorFormulario.vue` | `/…/colores/nuevo` · `/…/:colorId/editar` | Nombre, código, marca, familia, HEX (con CIELAB derivado en vivo). |
| `VistaColorCargaMasiva.vue` | `/…/colores/carga-masiva` | Carga masiva por CSV con validación fila a fila (RF-CAT-05-03). |

`/admin/catalogo` redirige a `/admin/catalogo/productos` (no hay dashboard: ver §7).

## 5. Alineación con el backend real

El backend de M01 (`backend/src/modules/m01-catalogo`) vive en la rama `develop`,
**no en esta**. Los DTOs de este módulo están alineados con sus contratos reales:

| Entidad | Campos que acepta el backend |
| :--- | :--- |
| Producto | `nombre`, `id_marca`, `clase_color`, `id_subcategorias[]`, `id_linea?`, `id_tipo_resina?`, `descripcion?`, `id_categoria_complementaria?`, `patrocinado?` |
| Variante | `id_producto`, `id_presentacion`, `precio_vigente`, `existencia_referencial?`, `id_color?`, `id_base?`, `codigo_proveedor?` |
| Marca | `nombre`, `logotipo` (base64) |
| Línea | `nombre`, `id_marca`, `gama_comercial?` |
| Categoría | `nombre`, `orden?` (+ `id_categoria` en subcategoría) |
| Color | `nombre`, `id_marca`, `codigo?`, `cielab {l,a,b}` |

Notas de integración:

- **Estados.** El backend separa publicación (`/publicar`, `/despublicar`) de
  activación (`/desactivar`, `/reactivar`). Por eso `EstadoPublicacion` tiene
  tres valores (`borrador` / `publicado` / `inactivo`) y desactivar **no** deja
  el producto en borrador.
- **Actualizaciones:** el backend usa `PATCH`, nunca `PUT`.
- **Colores:** la UI captura el color en HEX (selector visual) y
  `composables/useColorCielab.ts` deriva el CIELAB (D65) que exige el backend.
  La conversión está cubierta por tests.
- **Imágenes:** el contrato real es base64 + `orden` + `es_principal`. El modelo y
  la validación (formato y peso máximo 5 MB) ya están alineados, pero **la subida
  real todavía no está conectada** a ningún endpoint en esta rama.

## 6. Convenciones

- **Colores solo con tokens** del design system (`corporate`, `action`,
  `conversion`, `subaction`, `highlight`, `danger`, `neutral-*`). Sin hex
  arbitrarios. Los `hex` que aparecen en colores y marcas son **datos de
  catálogo**, no tokens de UI.
- **Tipografía:** `font-title` (Poppins) en títulos, `font-sans` (Inter) en el
  resto — ambas ya aplicadas por los componentes del Core.
- **Esquemas Zod solo en `dtos/`** (directiva 12 de AGENTS.md), nunca dentro de
  un `.vue`.
- **Campos obligatorios que arrancan en `null`** (selects sin selección) usan el
  helper `requeridoNullable` de su DTO: con `z.string()` a secas, Zod devuelve
  «Expected string, received null» en vez del mensaje de usuario.
- **Verificación:** `npm run lint`, `npx vue-tsc -b --force` y `npx vitest run`
  deben pasar limpios. Usa siempre `--force`: la caché incremental de TypeScript
  ha llegado a ocultar errores reales que sí rompían el build de producción.

## 7. Pendientes de integración

- **Backend M01:** no está en esta rama (solo en `develop`), así que cada store
  sirve su `*.mock.ts` como respaldo. Las llamadas a `/api/catalogo/...` fallan
  y caen al mock de forma transparente.
- **Dashboard de catálogo y «búsquedas sin resultado»:** se eliminaron. Dependían
  al 100 % de métricas simuladas y no existe endpoint ni tabla que los respalde.
  Vuelven cuando el backend exponga analítica real.
- **Acciones masivas:** la selección de filas funciona, pero «Activar» y
  «Desactivar» en lote solo limpian la selección: no hay endpoint de baja lógica
  por lotes.
- **Subida de imágenes y logotipos (HU-CAT-07):** validación lista, transporte
  pendiente.
- **Carga masiva de colores:** la vista y la validación están listas contra
  `POST /catalogo/colores/carga-masiva`, endpoint que aún no existe.
- **Persistencia de los mocks:** los cambios guardados se reflejan en el listado
  durante la sesión, pero se pierden al recargar la página (viven en memoria).
