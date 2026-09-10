# M01 · Panel de catálogo (frontend)

Módulo del **panel administrativo** de Pintu Clic para gestionar el catálogo:
dashboard, productos, variantes, categorías, marcas, colores y el reporte de
búsquedas sin resultado. Cubre las 8 pantallas «ADMIN 01…08» de la propuesta
visual para Figma.

- **Dominio:** Catálogo / Comercio · Prefijo de historias: `CAT`
- **Especificación:** [`docs/02_MODULOS_FUNCIONALES/M01_ESPECIFICACION_CATALOGO.md`](../../../../docs/02_MODULOS_FUNCIONALES/M01_ESPECIFICACION_CATALOGO.md)
- **Permiso M17:** `GESTION_CATALOGO` (categorías, líneas, marcas, colores, bases…) y
  `GESTION_PRODUCTOS` (productos, variantes, imágenes) — revalidados **siempre** en el servidor.
- **Rama:** `feature/m01-dashboard-catalogo`
- **Tamaño:** 8 vistas + 1 shell · 28 componentes · ~102 archivos

> **Navegación entre vistas** (mientras no haya `vue-router` montado): la abre
> `views/VistaPanelCatalogo.vue`, un *shell* que mantiene la vista activa y la
> cambia con `<component :is>` cuando se llama a `irA()` (provisto por
> `composables/usePanelNavegacion.ts`). Pulsar un ítem del menú lateral, un botón
> «Nuevo…», «Editar» o una fila cambia de pantalla sin recargar. Todo vive dentro
> del módulo: no toca `main.ts` ni `App.vue`.

---

## 1. Árbol de carpetas

```
m01-dashboardcatalogo/
├── README.md                     Este documento
├── dashboard-catalogo.routes.ts  Rutas del módulo (todas las vistas)
│
├── assets/       (19)  Ilustraciones SVG de las fotos de producto y logos de marca
│                       de las maquetas (imagenes-catalogo.ts las mapea por id).
├── interfaces/   (12)  Contratos de datos TypeScript — 0 bytes de runtime
├── dtos/         (10)  Esquemas Zod (validación de lo que se envía al backend)
├── services/     (20)  Cliente HTTP tipado + semillas de datos de ejemplo (*.mock.ts)
├── store/        (11)  Caché de sesión por vista (Pinia, sintaxis setup)
├── composables/  (12)  Orquestación reactiva que consumen las vistas
├── components/   (29)  Piezas de interfaz reutilizables (no tienen ruta)
└── views/        (10)  Pantallas con ruta (una por maqueta ADMIN)
```

## 2. Flujo de datos (todas las vistas siguen el mismo patrón)

```
views/VistaPanelCatalogo.vue  (shell: provide(NAV) + <component :is>)
  │  renderiza la vista activa
  ▼
views/VistaXxx.vue  ── irA() ──►  usePanelNavegacion() ──►  shell cambia de vista
  │  usa
  ▼
composables/useXxx.ts ──────────────┐  (expone estado + acciones + formateadores)
  │  usa                            │
  ▼                                 ▼
store/xxx.store.ts            composables/useFormatoCatalogo.ts   (Intl es-CO, sin estado)
  │  llama                          (formatearNumero, formatearFecha…)
  ▼
services/xxx.service.ts  ──►  GET/POST/PUT/PATCH  /api/catalogo/...
  │  ▲                             (cliente axios de @/core/api/axios)
  │  └── si falla (o el endpoint no existe todavía)
  ▼
services/xxx.mock.ts     ──►  datos de ejemplo → store.usandoDatosDemo = true
```

**Regla:** los `components/` nunca llaman al store ni al service; reciben datos por
`props` y avisan cambios con `emit`. La excepción es `FormularioProducto.vue`, que
por su tamaño consume el composable directamente (patrón "container").

---

## 3. `interfaces/` — contratos de datos

Tipos de integración *end-to-end* (frontend ↔ backend). Sin lógica, sin imports de
runtime: al compilar no generan ni un byte. Todo se reexporta desde `interfaces/index.ts`.

| Archivo | Qué define |
| :--- | :--- |
| `api.interface.ts` | Envoltorio estándar de respuesta: `ApiResponse<T>`, `ApiErrorResponse`, `ApiErrorDetail`, `PaginacionMeta`. Compartido por todo el módulo. |
| `dashboard.interface.ts` | ADMIN 01. `MetricaCatalogo`, `AccesoRapido`, `RegistroActividad`, `EstadoActividad`, `EstadoCatalogo`, `SegmentoEstadoCatalogo`, `ResumenDashboardCatalogo`, `PeriodoDashboard`. |
| `productos.interface.ts` | ADMIN 02. `ProductoListado`, `FiltrosProductos`, `OrdenProductos`, `EstadoProducto`, `ClaseColorProducto`, `OpcionSelect`, `OpcionesFiltroProductos`, `PaginaProductos`. |
| `producto-formulario.interface.ts` | ADMIN 03 + ADMIN 04. `FormularioProducto` (modelo editable: incluye `atributos` técnicos, `basesDisponibles`, `sistemaEntonado`), `OpcionesFormularioProducto`, `AtributosTecnicosProducto`, `OpcionBaseProducto`, `ColorCatalogo`, `ImagenProducto`, `SubcategoriaOpcion`, `LineaOpcion`, `EstadoPublicacion`, `ModoFormulario`, `SeccionChecklist`, `ProgresoChecklist`, `ResultadoGuardadoProducto`, `DetalleEdicionProducto` + `MovimientoAuditoriaProducto` (auditoría solo-edición). |
| `producto-detalle.interface.ts` | ADMIN 05. `DetalleAdministrativoProducto` (ficha de solo lectura completa), `ImagenDetalleProducto`, `VarianteResumenDetalle`, `AtributoTecnicoDetalle`, `ColorAsociadoDetalle`, `IndicadorDetalle`, `PestanaDetalleProducto`. |
| `variantes.interface.ts` | ADMIN 04. `VarianteListado` (modelo RF-CAT-03-02), `FiltrosVariantes`, `OrdenVariantes` (`{campo, direccion}`), `CampoOrdenVariantes`, `EstadoVariante`, `OpcionesFiltroVariantes`, `PaginaVariantes`, `ResumenVariantes`, `IndicadorResumen`. |
| `variante-formulario.interface.ts` | ADMIN 07 + ADMIN 08. `FormularioVariante` (modelo editable), `OpcionesFormularioVariante`, `OpcionColorVariante`, `OpcionProductoVariante`, `EstadoVarianteForm`, `ModoFormularioVariante`, `ImagenVariante`, `SeccionChecklistVariante`, `MovimientoInventario`, `DetalleEdicionVariante`, `ResultadoGuardadoVariante`. |
| `categorias.interface.ts` | ADMIN 05. `NodoCategoria`, `CategoriaConHijos`, `DetalleCategoria`, `FiltrosElementosCategoria`, `OrdenElementoCategoria`, `TipoNodoCategoria`, `EstadoCategoria`. |
| `marcas.interface.ts` | ADMIN 06. `MarcaListado`, `FiltrosMarcas`, `PaginaMarcas`, `ResumenMarcas`, `MarcaFormulario`, `EstadoMarca`. |
| `colores.interface.ts` | ADMIN 07. `ColorListado`, `FamiliaCromatica`, `FiltrosColores`, `OpcionesFiltroColores`, `PaginaColores`, `ResumenColores`, `EstadoColor`. |
| `busquedas.interface.ts` | ADMIN 08. `TerminoBusqueda`, `FiltrosBusquedas`, `PaginaBusquedas`, `ResumenBusquedas`, `OpcionesFiltroBusquedas`, `PeriodoBusqueda`, `FrecuenciaBusqueda`, `EstadoTerminoBusqueda`, `AccionSugerida`. |
| `index.ts` | Barrel: `export * from` de todos los anteriores. |

## 4. `dtos/` — validación con Zod

Esquemas de los **filtros y formularios** que la vista envía al backend. Cada uno
va sincronizado 1:1 con su interface. Reexportados desde `dtos/index.ts`.

| Archivo | Qué exporta |
| :--- | :--- |
| `dashboard.dto.ts` | `periodoDashboardSchema`, `filtroDashboardSchema`, `normalizarFiltroDashboard()`. |
| `productos.dto.ts` | `filtrosProductosSchema`, `FILTROS_PRODUCTOS_INICIALES`, `normalizarFiltrosProductos()`, `hayFiltrosActivos()`; enums `estadoProductoSchema`, `claseColorProductoSchema`, `ordenProductosSchema`. |
| `producto-formulario.dto.ts` | `productoFormularioSchema` con `.superRefine` (RF-CAT-02-03: color según clase; RF-CAT-02-05: imagen obligatoria para publicar) + `atributosTecnicosSchema` (atributos técnicos opcionales, ADMIN 04), `validarProductoFormulario()` → `{valido, errores}`. |
| `variantes.dto.ts` | `filtrosVariantesSchema` (con `ordenVariantesSchema` `{campo,direccion}`), `FILTROS_VARIANTES_INICIALES`, `normalizarFiltrosVariantes()`, `hayFiltrosVariantesActivos()`. |
| `variante-formulario.dto.ts` | `varianteFormularioSchema` con `.superRefine` (stock mínimo ≤ inicial), `validarVarianteFormulario()` → `{valido, errores}`. |
| `categorias.dto.ts` | `categoriaFormSchema` y `subcategoriaFormSchema` (nombre ≤ 100, padre obligatorio — RF-CAT-01-01), `filtrosElementosCategoriaSchema`, `FILTROS_ELEMENTOS_INICIALES`. |
| `marcas.dto.ts` | `filtrosMarcasSchema`, `marcaFormSchema` (nombre + logo + descripción ≤ 120 — RF-CAT-04-01/02), `validarMarcaForm()`, helpers de filtros. |
| `colores.dto.ts` | `filtrosColoresSchema`, `FILTROS_COLORES_INICIALES`, `normalizarFiltrosColores()`, `hayFiltrosColoresActivos()`. |
| `busquedas.dto.ts` | `filtrosBusquedasSchema` (periodo, categoría, frecuencia, término), helpers de filtros. |
| `index.ts` | Barrel. |

## 5. `services/` — cliente HTTP + datos de ejemplo

Dos archivos por área: `xxx.service.ts` (peticiones reales, tipadas con
`ApiResponse<T>`, usando el interceptor de `@/core/api/axios` que adjunta el token)
y `xxx.mock.ts` (semilla que refleja la maqueta y una función `consultarXxxDemo`
que reproduce filtrado / orden / paginación en memoria).

| Área | `*.service.ts` — métodos | `*.mock.ts` — exports |
| :--- | :--- | :--- |
| dashboard | `DashboardCatalogoService`: `obtenerResumen`, `obtenerActividadReciente`, `obtenerEstadoCatalogo` | `RESUMEN_DASHBOARD_DEMO` |
| productos | `ProductosService`: `listar`, `opcionesFiltro` | `PRODUCTOS_DEMO`, `OPCIONES_FILTRO_DEMO`, `consultarProductosDemo()` |
| producto-formulario | `ProductoFormularioService`: `obtenerOpciones`, `obtenerProducto`, `obtenerDetalleEdicion`, `crear`, `actualizar` | `OPCIONES_FORMULARIO_DEMO`, `FORMULARIO_PRODUCTO_DEMO`, `EDICION_PRODUCTO_DEMO`, `formularioProductoVacio()` |
| producto-detalle | `ProductoDetalleService`: `obtener`, `cambiarEstado` | `DETALLE_PRODUCTO_DEMO`, `detalleProductoDemo()` |
| variantes | `VariantesService`: `listar`, `opcionesFiltro`, `resumen` | `VARIANTES_DEMO`, `RESUMEN_VARIANTES_DEMO`, `OPCIONES_FILTRO_VARIANTES_DEMO`, `consultarVariantesDemo()` |
| variante-formulario | `VarianteFormularioService`: `obtenerOpciones`, `obtenerVariante`, `obtenerDetalleEdicion`, `crear`, `actualizar` | `OPCIONES_FORMULARIO_VARIANTE_DEMO`, `FORMULARIO_VARIANTE_DEMO`, `EDICION_VARIANTE_DEMO`, `formularioVarianteVacio()` |
| categorias | `CategoriasService`: `obtenerArbol`, `obtenerDetalle`, `crearCategoria`, `crearSubcategoria`, `cambiarEstado` | `ARBOL_CATEGORIAS_DEMO`, `CATEGORIA_INICIAL_DEMO`, `detalleCategoriaDemo()` |
| marcas | `MarcasService`: `listar`, `resumen`, `crear`, `actualizar` | `MARCAS_DEMO`, `RESUMEN_MARCAS_DEMO`, `LINEAS_MARCA_DEMO`, `consultarMarcasDemo()` |
| colores | `ColoresService`: `listar`, `familias`, `opcionesFiltro`, `resumen` | `COLORES_DEMO`, `FAMILIAS_CROMATICAS_DEMO`, `OPCIONES_FILTRO_COLORES_DEMO`, `RESUMEN_COLORES_DEMO`, `consultarColoresDemo()` |
| busquedas | `BusquedasService`: `listar`, `opcionesFiltro`, `resumen` | `BUSQUEDAS_DEMO`, `RESUMEN_BUSQUEDAS_DEMO`, `OPCIONES_FILTRO_BUSQUEDAS_DEMO`, `consultarBusquedasDemo()` |
| — | — | `services/index.ts`: barrel de todo lo anterior |

> Los `hex` que aparecen en los mocks de colores/formulario son la representación
> visual derivada del valor CIELAB (RF-CAT-05-02): son **datos de catálogo**, no
> tokens de UI.

> **Imágenes:** `productos.mock.ts`, `producto-formulario.mock.ts` y `marcas.mock.ts`
> toman sus `imagenUrl` / `imagenes[].url` / `logoUrl` de `assets/imagenes-catalogo.ts`,
> que importa las ilustraciones SVG de `assets/productos/` y `assets/marcas/` y las
> mapea por id. Al conectar el backend real esas rutas las reemplaza el CDN.

## 6. `store/` — caché de sesión (Pinia, sintaxis setup)

Un store por vista. Guarda lo que se consultó para no repetir peticiones al navegar
entre pantallas del panel, y expone getters derivados. Ante fallo/ausencia del
endpoint carga la semilla y pone `usandoDatosDemo = true`. Todos reexportados en
`store/index.ts`.

| Archivo | Store | Estado / acciones destacadas |
| :--- | :--- | :--- |
| `dashboard.store.ts` | `useDashboardCatalogoStore` | `resumen`, `cargando`, `error`; getters `metricas`, `accesosRapidos`, `actividadReciente`, `estadoCatalogo`; acción `cargar(filtro, {forzar})` idempotente. |
| `productos.store.ts` | `useProductosStore` | `filtros`, `pagina`, `opciones`; acciones `inicializar`, `aplicarFiltros`, `ordenarPor`, `irAPagina`, `limpiarFiltros`. |
| `producto-formulario.store.ts` | `useProductoFormularioStore` | `formulario`, `opciones`, `modo` (crear/editar), `detalleEdicion` (auditoría/relacionados), `erroresValidacion`, `guardadoOk`, `desactivado`; getters `subcategoriasDisponibles`, `lineasDisponibles`, `coloresDeLaMarca`, `checklist`, `progresoChecklist`, `puedePublicar`; acciones `inicializar(id?)` (en edición carga también el detalle de auditoría), `actualizar()` (con reset en cascada categoría→subcategoría y marca→línea/colores), `definirColorPrincipal`, `alternarColorDisponible`, `agregar/quitarEtiqueta`, `agregar/quitarImagen`, `marcarImagenPrincipal`, `guardarBorrador`, `publicar`, `desactivar`. |
| `producto-detalle.store.ts` | `useProductoDetalleStore` | `detalle` (ficha completa), `pestanaActiva`, `cargando`, `guardando`, `desactivado`; acciones `inicializar(id)` / `cargar(id)` (respaldo transparente a la semilla), `setPestana`, `desactivar`, `reiniciar`. |
| `variantes.store.ts` | `useVariantesStore` | `filtros` (con `orden {campo,direccion}`), `pagina`, `opciones`, `resumen`; acciones `inicializar`, `aplicarFiltros`, `ordenarPor` (asc→desc por columna), `irAPagina`, `cambiarPorPagina`, `limpiarFiltros`. |
| `variante-formulario.store.ts` | `useVarianteFormularioStore` | `formulario`, `opciones`, `modo` (crear/editar), `detalleEdicion` (movimientos/rotación), `erroresValidacion`, `guardadoOk`, `desactivado`; getters `productoAsociado`, `colorAsociado`, `margenEstimado` (calculado), `checklist`, `progresoChecklist`, `puedePublicar`; acciones `inicializar(id?)`, `actualizar`, `definirColor`, `agregar/quitar/marcarImagen`, `guardarBorrador`, `publicar`, `guardarCambios`, `desactivar`. |
| `categorias.store.ts` | `useCategoriasStore` | `arbol`, `seleccionadaId`, `detalle`, `busquedaArbol`, `expandidas` (Set), `filtrosElementos`; getters `arbolFiltrado`, `elementosFiltrados`, `totalElementos`; acciones `inicializar`, `seleccionar(id)`, `alternarExpandida`, `buscarEnArbol`, `aplicarFiltroElementos`, `ordenarElementosPor`. |
| `marcas.store.ts` | `useMarcasStore` | listado + `resumen` + **panel lateral**: `marcaEnEdicion`, `erroresEdicion`; acciones `abrirEdicion(marca)`, `nuevaMarca()`, `cerrarEdicion()`, `actualizarEdicion()`, `guardarEdicion()`. |
| `colores.store.ts` | `useColoresStore` | `filtros`, `pagina`, `familias`, `opciones`, `resumen`; acción especial `filtrarPorFamilia(clave)` (alterna el filtro al pulsar un círculo de la tira). |
| `busquedas.store.ts` | `useBusquedasStore` | `filtros` que **no** recargan al vuelo: `setFiltro()` los cambia en memoria y `aplicarFiltros()` (botón «Filtrar») confirma. |
| `index.ts` | — | Barrel. |

## 7. `composables/` — orquestación reactiva

Punto de entrada de cada vista. Desreferencia el store con `storeToRefs`, decide
si autocargar en `onMounted`, y añade los formateadores de presentación. Barrel en
`composables/index.ts`.

| Archivo | Qué expone |
| :--- | :--- |
| `useFormatoCatalogo.ts` | **Sin estado.** `formatearNumero`, `formatearFecha`, `formatearFechaHora`, `formatearVariacion`, `formatearPorcentaje` (Intl `es-CO`). Lo usan también componentes hoja. |
| `usePanelNavegacion.ts` | Navegación interna del panel. `inject` de la API `{ vistaActiva, parametro, irA }` que provee el shell; si no hay shell devuelve una versión inerte. Exporta también `resolverRutaPanel(path)` (traduce `/admin/catalogo/...` → clave de vista + parámetro) y el tipo `ClaveVistaPanel`. |
| `useDashboardCatalogo.ts` | Estado del dashboard + `refrescar()` + formateadores. Autocarga. |
| `useProductos.ts` | Listado de productos: estado + `aplicarFiltros`, `ordenarPor`, `irAPagina`, `limpiarFiltros`. Autocarga. |
| `useProductoFormulario.ts` | Formulario de producto: **no autocarga** (la vista llama `inicializar(id?)` cuando conoce la ruta). Expone todo el estado, getters y acciones del store. |
| `useProductoDetalle.ts` | Detalle administrativo del producto: **no autocarga** (`inicializar(id)`). Expone `detalle`, `pestanaActiva`, acciones (`setPestana`, `desactivar`) y los formateadores. |
| `useVariantes.ts` | Listado de variantes + `resumen` + acciones de orden/paginación/porPágina. Autocarga. |
| `useVarianteFormulario.ts` | Formulario de variante: **no autocarga** (`inicializar(id?)`). Expone estado, getters (`margenEstimado`, `checklist`…) y acciones del store. |
| `useCategorias.ts` | Árbol + detalle + filtro local de elementos. Autocarga. |
| `useMarcas.ts` | Listado + acciones del panel de edición (`abrirEdicion`, `nuevaMarca`, `guardarEdicion`…). Autocarga. |
| `useColores.ts` | Listado + `familias` + `filtrarPorFamilia`. Autocarga. |
| `useBusquedas.ts` | Reporte + `setFiltro` / `aplicarFiltros` (confirmación con botón). Autocarga. |
| `index.ts` | Barrel. |

## 8. `views/` — pantallas con ruta

Cada `.vue` es una pantalla completa: monta `BarraLateralAdmin` + `BarraSuperiorAdmin`,
consume su composable y compone los `components/`. La navegación entre pantallas es
provisional (`irA()` guarda la ruta en un ref) hasta montar el router del panel admin.

| Archivo | Maqueta | Ruta | Qué contiene |
| :--- | :--- | :--- | :--- |
| `VistaPanelCatalogo.vue` | — (shell) | `/admin/catalogo` (entrada) | Mantiene la vista activa y la cambia con `<component :is>`. `provide` la API de navegación. `:key` fuerza el remonte al cambiar de vista o parámetro. Pasa `productoId` a la vista de formulario. |
| `VistaDashboardCatalogo.vue` | ADMIN 01 | `/admin/catalogo` | Saludo + fecha (inline), 5 KPIs, accesos rápidos, tabla de actividad reciente y rosco de estado del catálogo. |
| `VistaProductos.vue` | ADMIN 02 | `/admin/catalogo/productos` | Encabezado con «Nuevo producto» / «Exportar», barra de filtros (categoría, marca, línea, estado, tipo de color), tabla con orden y paginación. |
| `VistaProductoFormulario.vue` | ADMIN 03 + ADMIN 04 | `/admin/catalogo/productos/nuevo` y `/…/:productoId/editar` | Enlace «Volver» + título, `FormularioProducto` (9 secciones), aside contextual: en **crear** vista previa + checklist; en **editar** vista previa con metadatos + tarjetas «Variantes y relacionados» e «Historial / auditoría» (inline), acciones de cabecera (Ver en catálogo / Duplicar) y barra fija Cancelar / Desactivar / Guardar cambios. |
| `VistaProductoDetalle.vue` | ADMIN 05 | `/admin/catalogo/productos/:productoId` | Ficha de solo lectura: encabezado con galería + disponibilidad + acciones (Editar / Duplicar / Desactivar), 6 tarjetas de indicadores, pestañas (general / galería / variantes / bases y entonado / etiquetas — inline) y «Actividad reciente» siempre visible. |
| `VistaVariantes.vue` | ADMIN 04 | `/admin/catalogo/variantes` | Filtros + `TablaVariantes` (columnas ordenables, acciones editar/duplicar/estado) + aside «Resumen de variantes» (3 `TarjetaEstadistica` + nota, inline). |
| `VistaVarianteFormulario.vue` | ADMIN 07 + ADMIN 08 | `/admin/catalogo/variantes/nueva` y `/…/:varianteId/editar` | «Volver» + título, formulario (producto asociado, presentación/unidad, base y color, códigos, comercial con margen calculado, inventario, dimensiones, notas, imágenes) reutilizando `TarjetaSeccionFormulario`/`CampoFormulario`; aside contextual: **crear** → vista previa + `ChecklistPublicacion`; **editar** → vista previa + últimos movimientos de inventario + tarjetas rotación/disponibilidad; barra fija Cancelar / Guardar borrador / Publicar (o Duplicar / Desactivar / Guardar cambios). |
| `VistaCategorias.vue` | ADMIN 05 | `/admin/catalogo/categorias` | Rejilla `ArbolCategorias` (izquierda) + `PanelDetalleCategoria` (derecha: cabecera, 4 indicadores, tabla de elementos). |
| `VistaMarcas.vue` | ADMIN 06 | `/admin/catalogo/marcas` | 4 KPIs, filtros inline, `TablaMarcas`, y `PanelEditarMarca` (slide-over) cuando hay `marcaEnEdicion`. |
| `VistaColores.vue` | ADMIN 07 | `/admin/catalogo/colores` | Tira de familias cromáticas (inline, filtro rápido) + filtros + `TablaColores` + aside «Resumen de colores» (3 `TarjetaEstadistica`). |
| `VistaBusquedas.vue` | ADMIN 08 | `/admin/catalogo/busquedas-sin-resultado` | Filtros con botón «Filtrar», 4 KPIs mixtos (número + texto), `TablaBusquedasSinResultado` (acción sugerida + estado de gestión). |

## 9. `components/` — piezas de interfaz

Reciben `props`, emiten eventos, no conocen el store. Agrupados por dónde se usan.

### Compartidos / primitivas

| Componente | Qué hace |
| :--- | :--- |
| `BarraLateralAdmin.vue` | Menú lateral del panel (logo, ítems de navegación, promo). `item-activo` marca el actual; emite `navegar`. Usado por las 8 vistas. |
| `BarraSuperiorAdmin.vue` | Barra superior (breadcrumb por `seccion`, buscador global con `v-model:termino-busqueda`, notificaciones, usuario). Usado por las 8 vistas. |
| `EncabezadoSeccion.vue` | Título + descripción + slot `#acciones`. Usado por 6 vistas. |
| `PaginacionTabla.vue` | «Mostrando X a Y de Z» + botones de página con elipsis. Prop `etiqueta` para el sustantivo. Usado por 4 tablas. |
| `TarjetaEstadistica.vue` | Tile KPI: etiqueta, valor, icono y línea de variación opcional (`+n% / -n% / 0%` con flecha). Usado por 4 vistas (11+ instancias). |

### ADMIN 01 — Dashboard

| Componente | Qué hace |
| :--- | :--- |
| `PanelMetricas.vue` | Rejilla de 5 KPIs; mapea `metrica.clave` → icono y delega en `TarjetaEstadistica`. |
| `PanelAccesosRapidos.vue` | Cabecera «Accesos rápidos» + rejilla de tarjetas de acción (icono/colores por `rol`, botón que emite `navegar`). Recorta a `limite` (4). |
| `TablaActividadReciente.vue` | Tabla de últimas acciones; píldora de estado inline (`Publicado`/`Actualizado`/`Desactivado`/`Eliminado`). |
| `GraficoEstadoCatalogo.vue` | Rosco SVG (dasharray por porcentaje) + leyenda + nota de salud. Sin librería de charts. |

### ADMIN 02 — Productos · Listado

| Componente | Qué hace |
| :--- | :--- |
| `FiltrosProductos.vue` | Buscador con rebote (300 ms) + 5 selects + «Limpiar filtros». Emite `cambiar` / `limpiar`. |
| `TablaProductos.vue` | Tabla con selección local, «N productos encontrados», selector de orden, columnas y `PaginacionTabla`. Emite `ordenar`, `ir-pagina`, `abrir`, `menu`, `seleccion`. |
| `BadgeEstadoProducto.vue` | Píldora `Publicado` / `Borrador` / `Inactivo`. Reutilizada en la vista previa del formulario. |

### ADMIN 03 — Productos · Crear / editar

| Componente | Qué hace |
| :--- | :--- |
| `FormularioProducto.vue` | Columna izquierda: las 9 secciones (general, clasificación + visibilidad, marca y línea, clase de color, **atributos técnicos**, **bases y entonado**, imágenes, información comercial, etiquetas). **Consume `useProductoFormulario()` directamente** (container). Selects dependientes, clase de color que muestra/oculta color principal + código + swatches, checkboxes de bases/venta, etiquetas. |
| `TarjetaSeccionFormulario.vue` | Tarjeta de sección con icono + título + descripción + slot. 9 instancias dentro de `FormularioProducto`. |
| `CampoFormulario.vue` | Envoltorio de campo: `<label>` + marca de obligatorio + contador opcional + texto de ayuda/error, con `id`/`aria-describedby` por slot (`useId`). ~14 instancias. |
| `EntradaEtiquetas.vue` | Input de chips: Enter agrega, Backspace/✕ quita. Emite `agregar` / `quitar`. |
| `GaleriaImagenesProducto.vue` | Rejilla de miniaturas + tile «Añadir más»; marca principal, quita, muestra error. |
| `VistaPreviaProducto.vue` | Tarjeta de vista previa en vivo (imagen, nombre, precio COP, estado, stock, color con muestra). Prop opcional `meta` → añade última actualización / autor / SKU (modo editar). |
| `ChecklistPublicacion.vue` | Anillo de progreso SVG (`completas/total`) + lista de secciones con check/círculo y marca «(opcional)». Solo en modo crear. |

### ADMIN 04 — Variantes · Listado

| Componente | Qué hace |
| :--- | :--- |
| `FiltrosVariantes.vue` | 4 selects (producto, presentación, estado, marca) + «Limpiar filtros» + «Nueva variante». Emite `cambiar` / `limpiar` / `nueva`. |
| `TablaVariantes.vue` | Cabecera «Variantes (N)» + «Exportar»; `table-fixed` (sin scroll horizontal, toda la info a la vista), cabeceras ordenables (▲/▼/↕), acciones por fila en un menú ⋮ (Editar / Duplicar / Activar-Desactivar) posicionado con `position: fixed` como en `TablaProductos`, pie con paginación y «N por página». Píldora de estado inline (deriva «Sin stock» de existencia 0). |

### ADMIN 05 — Categorías y subcategorías

| Componente | Qué hace |
| :--- | :--- |
| `ArbolCategorias.vue` | Panel «Estructura de categorías»: buscador + árbol expandible (categoría → subcategorías). Emite `seleccionar` / `alternar` / `buscar`. |
| `PanelDetalleCategoria.vue` | Cabecera (icono, nombre, badge «Categoría principal», descripción, «Editar») + 4 `TarjetaEstadistica` + `TablaElementosCategoria`. |
| `TablaElementosCategoria.vue` | Tabla de la categoría + sus subcategorías; buscador y filtro por tipo, cabeceras ordenables. Chip de tipo y píldora de estado inline. |

### ADMIN 06 — Marcas

| Componente | Qué hace |
| :--- | :--- |
| `TablaMarcas.vue` | Tabla con logo (iniciales), descripción, líneas/productos/colores, estado inline, acciones editar + ⋮; `PaginacionTabla` al pie. |
| `PanelEditarMarca.vue` | Slide-over (`fixed` + overlay): logotipo, nombre, descripción corta (contador /120), estado, chips de líneas + «Agregar línea», nota y Cancelar / Guardar cambios. Emite `cerrar` / `cambiar` / `guardar`. |

### ADMIN 07 — Colores

| Componente | Qué hace |
| :--- | :--- |
| `TablaColores.vue` | Tabla: muestra (swatch desde el hex CIELAB), nombre, código, marca, chip de familia, valor cromático con **botón copiar** (`navigator.clipboard`), estado inline, ⋮. `PaginacionTabla` al pie. |

### ADMIN 08 — Búsquedas sin resultado

| Componente | Qué hace |
| :--- | :--- |
| `TablaBusquedasSinResultado.vue` | Cabecera + «Exportar»; columnas término / frecuencia / última búsqueda / posible categoría / **acción sugerida** (botón «Crear producto» o «Agregar sinónimo») / **estado** (`Pendiente` ámbar, `Revisado` azul, `Atendido` verde) / ⋮. `PaginacionTabla` al pie. |

### `components/index.ts`

Barrel con `export { default as … }` de todos los componentes, agrupados por vista.

## 10. `dashboard-catalogo.routes.ts`

Exporta `dashboardCatalogoRoutes: RouteRecordRaw[]` con las rutas de las 10 vistas
(carga diferida por `import()`): dashboard, productos (listado), producto nuevo,
**producto detalle** (`/productos/:productoId`), producto editar
(`/productos/:productoId/editar`), variantes (listado), **variante nueva**
(`/variantes/nueva`), **variante editar** (`/variantes/:varianteId/editar`),
categorías, marcas, colores, búsquedas sin resultado. Cada ruta lleva
`meta.permiso` (`GESTION_CATALOGO` / `GESTION_PRODUCTOS`) que el guard de
navegación y **el backend** deben exigir. `main.ts` monta el router con estas
rutas vía `core/routes/index.ts` (ver §12).

---

## 11. Convenciones aplicadas

- **Colores solo con tokens** del design system (`corporate`, `action`, `conversion`,
  `highlight`, `subaction`, `neutral-*`). Sin hex arbitrarios ni colores Tailwind por
  defecto. La paleta **no define rol «destructivo» (rojo)**: los estados
  `inactivo` / `desactivado` / `eliminado` / «sin stock» usan neutros o ámbar.
- **Radios y tipografía** desde `style.css` (`--radius-card`, `--radius-button`,
  `--radius-input`; Poppins en títulos, Inter en cuerpo).
- **Mismos patrones que `m04-cuentas`:** `ApiResponse<T>`, service como objeto,
  composable que aísla el manejo de errores de Axios, store Pinia en sintaxis setup.
- **Componentes:** salen a `components/` si (a) se repiten, (b) tienen lógica propia,
  o (c) su padre superaría ~150 líneas. Los triviales (un `<span>`/`<button>` de un
  solo uso) van inline.
- **Verificación:** `npx vue-tsc -b` y `npx eslint src/modules/m01-dashboardcatalogo`
  pasan sin errores.

## 12. Pendientes de integración

- **Backend M01:** ningún endpoint `GET/POST/PUT/PATCH /api/catalogo/...` existe aún.
  Mientras tanto cada store sirve su `*.mock.ts` y la vista muestra el aviso
  «datos de ejemplo».
- **Router del panel:** ✅ integrado. `main.ts` monta `vue-router` con
  `core/routes/index.ts`, que agrega `...dashboardCatalogoRoutes` (una URL por vista,
  bajo `/admin/catalogo`). `usePanelNavegacion().irA` delega en `router.push()` cuando
  no hay shell (traducción clave→path en `rutaRealPanel`). El shell
  `VistaPanelCatalogo.vue` queda como alternativa sin router. Las vistas no cambiaron:
  siguen llamando a `irA()`.
- **Layout admin:** `BarraLateralAdmin` / `BarraSuperiorAdmin` deberían moverse a
  `core/layouts/DisenoAdmin.vue` cuando exista, para compartirlo con otros módulos.
- **Sesión (M04):** el nombre de usuario está fijo (`Carlos Álvarez`) hasta que el
  panel comparta el store de autenticación.
- **Subida de imágenes/logos (HU-CAT-07):** los componentes son marcadores; el
  upload real usa su propio endpoint.
