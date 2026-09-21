# Arquitectura del módulo M01 · Panel de catálogo (frontend)

Documento de **nivel de arquitectura** del módulo `src/modules/m01-dashboardcatalogo`.
Complementa el inventario archivo-por-archivo de [`README.md`](./README.md) y se
rige por:

- [`frontend/infraestructura.md`](../../../infraestructura.md) — arquitectura del cliente web.
- [`docs/00_SISTEMA/01_ARQUITECTURA/ARQUITECTURA_GENERAL.md`](../../../../docs/00_SISTEMA/01_ARQUITECTURA/ARQUITECTURA_GENERAL.md) — dominios y principios del sistema.
- [`docs/02_MODULOS_FUNCIONALES/M01_ESPECIFICACION_CATALOGO.md`](../../../../docs/02_MODULOS_FUNCIONALES/M01_ESPECIFICACION_CATALOGO.md) — historias y requisitos (prefijo `CAT`).
- Propuesta visual para Figma «Pintu Clic - Vistas Admin M01 y M02» (maquetas ADMIN 01…08).

---

## 1. Encuadre en el sistema

M01 es el **núcleo del catálogo** (dominio *Catálogo / Comercio*). Este módulo
frontend implementa únicamente el **panel administrativo** de ese núcleo: la
consola interna con la que un empleado con permisos gestiona productos,
variantes, categorías, marcas y colores, y revisa indicadores.

```mermaid
graph LR
    subgraph Transversales
        M17[M17 · Permisos]
        M20[M20 · Seguridad / baja lógica]
    end
    M01[(M01 · Catálogo<br/>fuente de verdad)]
    M17 -->|permiso GESTION_CATALOGO / GESTION_PRODUCTOS| M01
    M20 -->|inmutabilidad histórica| M01
    M01 -->|habilita| M02[M02 Búsqueda]
    M01 -->|habilita| M05[M05 Carrito]
    M01 -->|habilita| M06[M06 Reglas y descuentos]
    M01 -->|habilita| M08[M08 Orden de venta]
    SAMIT[[SAMIT / M13 Inventario]] -->|códigos de proveedor, existencia referencial, CIELAB| M01
```

- **Alcance del panel:** administración. No maneja existencias en tiempo real ni
  descuentos dinámicos (eso es M13 y M06).
- **HU cubiertas (UI):** HU-CAT-01 (categorías/subcategorías), HU-CAT-02
  (productos), HU-CAT-03 (variantes), HU-CAT-04 (marcas), HU-CAT-05 (colores),
  HU-CAT-09 (estado y ciclo de vida) y HU-CAT-11 (líneas comerciales). El
  reporte «Búsquedas sin resultado» **se retiró** de este módulo: se alimentaría
  de M02 y no existe endpoint ni tabla que lo respalde.
- **Transversales:** cada ruta declara en `meta.permiso` el permiso de M17
  (`GESTION_CATALOGO` o `GESTION_PRODUCTOS`), que **el backend revalida siempre**
  (Seguridad por Defecto, M20). El frontend nunca es la autoridad de acceso.

---

## 2. Cumplimiento de `frontend/infraestructura.md`

| Regla del estándar | Cómo la cumple M01 |
| :--- | :--- |
| Nomenclatura `m[xx]-[nombre]` | `m01-dashboardcatalogo` |
| Capas del módulo (`components/ views/ services/ store/ dtos/ interfaces/` + `*.routes.ts`) | Presentes las 6 + `dashboard-catalogo.routes.ts`. Se añade `composables/` (orquestación reactiva, ya usado en `m04-cuentas`). |
| `interfaces/` = 0 runtime, sin imports de validación | Solo `interface` / `type`. `ApiResponse<T>` en `interfaces/api.interface.ts`. |
| `dtos/` = Zod, fuente única de validación | 9 `*.dto.ts`. **Cero `z.object` inline** en `.vue` (Directiva 12). Reglas cruzadas en `.superRefine` (p. ej. `producto-formulario.dto.ts`). |
| Composición DRY de DTOs | Los filtros/paginación se definen localmente; cuando exista un DTO global de paginación en `core/dtos/`, se compondrá desde ahí. |
| Regla de Oro de color (solo tokens) | Únicamente `corporate / action / conversion / highlight / subaction / neutral-*`. Sin hex arbitrarios ni colores Tailwind ajenos. Los hex de **color de producto** son dato de catálogo (derivado de CIELAB) y van por `:style` — único uso permitido de estilo inline dinámico. |
| Utility-first, sin CSS por módulo | Sin hojas `.css` ni `<style>` con clases propias. |
| Estados interactivos y responsivo mobile-first | `hover:` / `focus-visible:` en todo clickeable; rejillas `grid-cols-1 … xl:grid-cols-*`. |
| Aislamiento del módulo | **No toca** `tailwind.config.ts`, `style.css`, `main.ts` ni `App.vue`. Consume `@/core` (`api/axios`, tokens, biblioteca de componentes) y registra sus rutas en `core/routes/index.ts` — ese registro es el único punto donde M01 escribe fuera de sí mismo. El chrome del panel **no lo aporta M01**: es `core/layouts/LayoutAdmin.vue`, propiedad del equipo Core. |
| Validar antes de delegar en el servicio | Formularios (`producto-formulario`, `marca`) validan con su DTO antes de llamar al service. |

---

## 3. Arquitectura por capas

Dirección de dependencias (una capa solo importa de las de su derecha):

```text
views/  ─►  composables/  ─►  store/  ─►  services/  ─►  @/core/api/axios
  │              │              │            │
  │              │              │            └─►  *.mock.ts   (respaldo local)
  │              │              └─────────────►  dtos/  ──►  interfaces/
  │              └────────────────────────────►  interfaces/
  └─►  components/  ──►  interfaces/            (componentes: props + emit, sin store)
```

| Capa | Responsabilidad | No hace |
| :--- | :--- | :--- |
| `interfaces/` | Contratos de datos frontend ↔ backend. | Lógica, runtime. |
| `dtos/` | Validar filtros y formularios (Zod). Normalizar parámetros antes de la petición. | Peticiones HTTP. |
| `services/` | Traducir método → endpoint REST tipado con `ApiResponse<T>`; adjuntar token vía interceptor. | Guardar estado, formatear para UI. |
| `services/*.mock.ts` | Semilla que refleja la maqueta + filtrado/orden/paginación en memoria. | Existir en producción (se retira, §7). |
| `store/` (Pinia setup) | Caché de sesión por vista, getters derivados, orquestación de carga con *fallback* al mock. | Formatear textos, conocer componentes. |
| `composables/` | Punto de entrada de la vista: desreferencia el store, decide `onMounted`, añade formateadores (`useFormatoCatalogo`) y la navegación (`usePanelNavegacion`). | Peticiones directas. |
| `components/` | UI reutilizable. Reciben `props`, emiten eventos. | Llamar al store/service (excepción: `FormularioProducto.vue`, *container* por tamaño). |
| `views/` | Pantalla con ruta: monta el *chrome*, consume su composable, compone componentes. | Contener reglas de negocio o validación inline. |

**Criterio de extracción a `components/`:** se saca un componente si (a) se
repite, (b) tiene lógica propia, o (c) su padre superaría ~150 líneas. Lo trivial
(un `<span>`/`<button>` de un solo uso) va inline.

---

## 4. Flujo de datos y reactividad

Instancia del diagrama de `infraestructura.md` §2 para este módulo:

```mermaid
graph TD
    A[Empleado interactúa en el panel] --> S[vue-router · match de ruta]
    S -->|monta como hija de LayoutAdmin| B[VistaXxx.vue]
    B -->|acción / filtro| C(useXxx · composable)
    C --> P[useXxx Store · Pinia]
    P -->|petición tipada| D[XxxService · axios del módulo]
    D -->|GET/POST/PUT/PATCH + Bearer| E((API · /api/catalogo/...))
    E -->|ApiResponse&lt;T&gt;| D
    D -->|data| P
    D -. si falla / no existe .-> M[Xxx.mock.ts]
    M -. semilla .-> P
    P -->|ref / computed| C
    C -->|estado + formateadores| B
    B -->|Tailwind, tokens| A

    classDef vue fill:#41b883,stroke:#35495e,color:#fff;
    classDef pinia fill:#ffe56b,stroke:#f39c12,color:#333;
    classDef backend fill:#2c3e50,stroke:#2c3e50,color:#fff;
    A:::vue
    S:::vue
    B:::vue
    C:::pinia
    P:::pinia
    D:::backend
    E:::backend
```

- **Idempotencia:** los stores de listado no recargan si ya hay datos y no se
  fuerza; los filtros hacen `pagina = 1` y recargan.
- **`ApiResponse<T>`:** contrato único de éxito (`{ success, data, meta }`) y de
  error (`{ success:false, error:{ code, message, details } }`), idéntico a
  `m04-cuentas`. El parser de error del store proyecta `error.message`.

---

## 5. Modelo de navegación

`core/routes/index.ts` monta `core/layouts/LayoutAdmin.vue` en `/admin` y cuelga
`...dashboardCatalogoRoutes` como **rutas hijas**. El layout contiene el
`<router-view />`, así que barra lateral y barra superior son permanentes: no se
remontan al navegar, conservan el scroll y el estado del acordeón, y Vue Router
ilumina solo el enlace activo.

```mermaid
graph LR
    R[vue-router] -->|match /admin| LA[LayoutAdmin · core/layouts]
    LA -->|router-view| V[VistaXxx.vue · ruta hija]
    V -->|irA path, botones internos| N[usePanelNavegacion]
    N -->|router.push| R
```

- Las vistas son **contenedores limpios** (`<div class="space-y-6 p-6 lg:p-8">`):
  no envuelven nada de chrome. Queda prohibido reintroducir un layout local.
- `usePanelNavegacion().irA()` cubre la navegación **interna** de cada vista
  (botones «Cancelar», «Editar», filas de tabla…) delegando en `router.push()`.
- `dashboard-catalogo.routes.ts` declara `meta.titulo` y `meta.permiso` en cada
  ruta; el permiso lo revalida siempre el backend.
- `/admin/catalogo` es un `redirect` a `/admin/catalogo/productos`: el dashboard
  de catálogo se retiró por depender por completo de métricas simuladas.

---

## 6. Contrato con el backend

Endpoints previstos (aún no implementados por el backend de M01):

| Área | Método · Ruta | Permiso M17 |
| :--- | :--- | :--- |
| Dashboard | `GET /api/catalogo/dashboard/{resumen,actividad,estado}` | `GESTION_CATALOGO` |
| Productos | `GET /api/catalogo/productos` · `.../opciones-filtro` | `GESTION_PRODUCTOS` |
| Producto (form) | `GET .../opciones-formulario` · `GET/POST/PUT /api/catalogo/productos[/:id]` | `GESTION_PRODUCTOS` |
| Variantes | `GET /api/catalogo/variantes` · `.../opciones-filtro` · `.../resumen` | `GESTION_PRODUCTOS` |
| Categorías | `GET .../categorias/arbol` · `.../:id` · `POST .../[subcategorias]` · `PATCH .../:id/estado` | `GESTION_CATALOGO` |
| Marcas | `GET /api/catalogo/marcas` · `.../resumen` · `POST/PUT .../[:id]` | `GESTION_CATALOGO` |
| Colores | `GET /api/catalogo/colores` · `.../familias` · `.../opciones-filtro` · `.../resumen` | `GESTION_CATALOGO` |
| Búsquedas | `GET /api/catalogo/busquedas-sin-resultado` · `.../opciones-filtro` · `.../resumen` | `GESTION_CATALOGO` |

- **Paginación siempre del lado servidor** (RNF-CAT-06-01): el frontend nunca
  descarga el catálogo completo.
- **Baja lógica** (HU-CAT-09 / M20): no hay «eliminar»; las acciones de estado
  son `PATCH .../estado`, y el backend informa la cascada de afectados.

---

## 7. Fronteras, aislamiento y datos de ejemplo

**Lo que el módulo toca**

- Crea y modifica casi todo bajo `src/modules/m01-dashboardcatalogo/`.
- **Lee** de `@/core`: `api/axios` (instancia + interceptor JWT), `theme/colors.ts`
  (tokens, vía Tailwind), `assets/logo.png`.
- **Excepción documentada:** la entrada de `dashboardCatalogoRoutes` en
  `core/routes/index.ts` — es el punto donde el módulo se enchufa al árbol de
  rutas. `core/layouts/LayoutAdmin.vue` lo mantiene el equipo Core, no M01.
- **Contribuciones al Core** (acordadas, no unilaterales): se extendió
  `core/components/data-display/Table.vue` con selección opcional de filas y
  `core/components/forms/Input.vue` con soporte de campos numéricos, en vez de
  recrear componentes locales equivalentes.

**Lo que NO toca:** `tailwind.config.ts`, `style.css`, `main.ts`, `App.vue`, ni
archivos de otros módulos (`m02-productos`, `m04-cuentas`, `m17-permisos`).

**Datos de ejemplo (`*.mock.ts`)**

- Cada área tiene una semilla + `consultarXxxDemo()` que reproduce
  filtro/orden/paginación en memoria.
- El store la usa **solo como *fallback*** (catch de la petición) y marca
  `usandoDatosDemo = true`; la vista muestra el aviso «datos de ejemplo».
- **Retirada:** cuando el backend publique cada endpoint, la ruta feliz gana y el
  mock deja de usarse. Los `*.mock.ts` se conservan para pruebas/Storybook o se
  borran en un `refactor(M01)` posterior.

---

## 8. Decisiones de arquitectura (registro breve)

| # | Decisión | Motivo | Alternativa descartada |
| :-- | :--- | :--- | :--- |
| 1 | Añadir `composables/` a las capas del módulo | Aísla el manejo de errores de Axios y el estado de petición de los componentes (patrón de `m04-cuentas`). | Lógica de carga en cada vista. |
| 2 | Stores Pinia por vista, no uno global de catálogo | Caché de sesión acotada; menos acoplamiento; se libera al salir. | Store monolítico `useCatalogoStore`. |
| 3 | Mock con *fallback* en el store, no un flag de entorno | La UI es revisable hoy sin backend y sin build especial; la transición es automática. | `if (import.meta.env.DEV)` disperso. |
| 4 | `usePanelNavegacion` + shell, sin montar `vue-router` (superado: `vue-router` ya está montado, ver §5) | No tocar `main.ts`/`App.vue` → push del módulo 100 % aislado; las vistas no cambian al migrar. | Editar `App.vue` (rompe aislamiento). |
| 5 | El chrome del panel es `core/layouts/LayoutAdmin.vue` y las vistas son rutas **hijas** | Sidebar y topbar no se remontan al navegar: se conserva scroll y estado del acordeón, y el enlace activo lo resuelve el router. | Que cada vista se envuelva en su propio layout (duplica chrome y lo hace parpadear). |
| 8 | Extender los componentes del Core en vez de crear equivalentes locales | Una sola implementación de tabla/input para todo el sistema; el resto de módulos hereda las mejoras. | `TablaBase.vue`, `PaginacionTabla.vue`, `BadgeEstadoProducto.vue` y demás duplicados locales (ya eliminados). |
| 9 | Campos fantasma eliminados de los DTOs | El formulario prometía datos (peso, SEO, márgenes, notas) que el backend rechaza o ignora. Alinear el modelo evita errores silenciosos. | Mantener campos que ninguna tabla persiste. |
| 6 | Envoltorio `ApiResponse<T>` local en `interfaces/api.interface.ts` | Igual contrato que el resto del sistema sin depender de un tipo global inexistente. | Importar de un `core/interfaces` que no existe. |
| 7 | Inline de componentes triviales (badges, barra de acciones, tarjetas de un solo uso) | Coste/beneficio: menos archivos, misma legibilidad. Se extrae solo con reuso o lógica. | 33+ componentes, varios de 1 `<span>`. |

---

## 9. Puntos de integración pendientes

1. **Endpoints de M01** en el backend (`/api/catalogo/*`) → retirar mocks.
2. ~~`vue-router` montado + `dashboardCatalogoRoutes` registradas + `irA` → `router.push()`~~ — **hecho**.
3. ~~Chrome del panel compartido en `core/layouts/LayoutAdmin.vue`, vistas como rutas hijas~~ — **hecho**.
4. **Acciones masivas reales** (`BarraAccionesMasivas.vue`, ya conectada en Productos/Variantes/Líneas/Categorías): "Activar"/"Desactivar" en lote son no-op hasta que exista el endpoint de baja lógica en lote; "Exportar" reutiliza rutas de exportación individuales que tampoco existen aún en el backend.
5. **Sesión (M04):** nombre y permisos reales desde el store de autenticación (hoy `Carlos Álvarez` fijo).
6. **Subida de imágenes/logos (HU-CAT-07):** endpoint propio; los componentes actuales son marcadores.
7. **Enlaces sin conectar en "Gestión Administrativa"** (Usuarios, Roles, Aprobación de Empresas): apuntan a rutas que M04/M17 aún no registran.
8. **`CHANGELOG.md` + walkthrough** de la versión (fuera del módulo; commit administrativo aparte).
