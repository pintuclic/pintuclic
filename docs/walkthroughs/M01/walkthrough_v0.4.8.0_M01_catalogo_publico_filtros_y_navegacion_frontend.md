# WALKTHROUGH DE IMPLEMENTACIÓN

> 🏷️ **CONVENCIÓN OBLIGATORIA DE NOMENCLATURA DEL ARCHIVO:**
> Guardar obligatoriamente en `docs/walkthroughs/M[XX]/` con el sufijo de capa técnica **al final del nombre**:
> - **Frontend:** `walkthrough_v0.4.8.0_M01_catalogo_publico_filtros_y_navegacion_frontend.md`

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.8.0`
  * `develop` está en `0.4.7.1` (tags `v0.4.7.0` y `v0.4.7.1` publicados). La entrega aporta funcionalidad nueva → **Minior-feat**: `0.4.8.0`.
  * Ninguna rama remota declara `0.4.8.0` (la más alta es `feature/m17-permisos-roles` con `0.4.7.3`).
  * **Coincidencia de `v0.4.6.5`:** la búsqueda en tiempo real y el color coincidente se documentaron primero como `v0.4.6.5` (commit `d7aaf73`, walkthrough `walkthrough_v0.4.6.5_M01_busqueda_tiempo_real_y_color_coincidente_frontend.md`), pero esa versión nunca llegó a `develop`. Después `develop` publicó su propia `v0.4.6.5` (M01/M05, otro equipo). Para no duplicar el número, ese trabajo se publica dentro de **`v0.4.8.0`**; el walkthrough conserva su nombre original para no alterar el historial, y el CHANGELOG de `develop` no se modifica.
* **Módulo de Origen:** `M01 Catálogo y M02 Búsqueda: vistas públicas (frontend)`
* **Fecha de Entrega:** `11/10/2026`
* **Autor / Responsable:** `yuleinylugo71 (frontend vistas públicas M01/M02) con asistencia de Claude Code (agente de IA)`
* **Estado de la Implementación:** `⚠️ PARCIAL CON DEPENDENCIAS` (vistas públicas de M01 y servicio de búsqueda de M02 entregados; el ajuste de scroll de core queda pendiente de revisión y **no se incluye**, ver sección 7)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| Código HU | Título | Estado |
| :--- | :--- | :---: |
| **HU-BUS-01** | Búsqueda de productos (tiempo real y color coincidente) | ✅ Completada |
| **HU-BUS-02** | Filtros del catálogo (selección múltiple, URL e historial) | ✅ Completada (frontend) |
| **HU-BUS-03** | Ordenamiento de resultados | ✅ Conservada |
| **HU-BUS-05** | Paginación de resultados (16 por página) | ✅ Completada |
| **HU-CAT-06** | Consulta pública del catálogo (Inicio → catálogo filtrado) | ✅ Completada |
| **HU-CAT-08** | Productos complementarios en la ficha | ✅ Completada (frontend) |

### Descripción del Alcance de la Versión
- **Búsqueda en tiempo real:** debounce de 300 ms, `?q=` con `router.replace`, respuestas antiguas descartadas. La tarjeta muestra el color de la variante que coincide con el término (`useColorCoincidenteBusqueda.ts`).
- **Catálogo:** 16 productos por página, 4 columnas desde 1280 px, contador único, paginación propia y chips de filtros activos.
- **Panel de filtros:** secciones con aspecto de select (una sola abierta, todas cerradas al cargar, resumen y contador visibles cerradas), casillas de selección múltiple y un único contenedor con scroll (`overscroll-behavior: contain`).
- **Actualización suave:** tras la primera carga los resultados no se desmontan. Se atenúan con `aria-busy`, aparece «Actualizando resultados…» y una barra discreta. Que la página no salte al inicio depende del ajuste de core pendiente (sección 7.1).
- **Inicio → catálogo:** las tarjetas de categoría navegan a `?categoria=`, el modal a `?subcategoria=` y «Ver todos» al catálogo completo.
- **Complementarios (HU-CAT-08):** máximo 4, sin duplicados, sin el producto actual ni productos sin variantes activas. La sección se oculta si no hay ninguno.
- **Rango de precio:** si el mínimo supera al máximo, el error se informa junto a los campos y no se consulta (CA-BUS-02-06).
- **Fuera de alcance (pausado y separado):** la integración calculadora → catálogo (área, manos, estimación por mano) y el filtro por superficie **no forman parte de esta entrega**. Su código se separó y se conserva en un parche recuperable (ver 7.3). La calculadora pública queda como en `develop`.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **Combinación de filtros (contrato real de M02):** OR entre valores del mismo grupo y AND entre grupos. Marcas, línea, resina y presentación admiten varios valores.
- **Categorías:** se pueden elegir varias subcategorías o varias categorías completas, pero **no mezcladas**. La API combina `categoria` y `subcategoria` con AND, así que mezclarlas daría la intersección en vez de la unión. Si una URL trae ambas, manda la subcategoría (comportamiento previo).
- **Facetas multielección:** la API cuenta también con el filtro del propio grupo. Para poder sumar opciones, cada grupo con selección toma sus valores de una consulta de facetas sin su propio filtro. Ordenar o paginar no vuelve a pedir facetas.
- **URL como fuente de verdad:** `?marca=4,5&linea=5,7&categoria=1,2…`. Al recargar o ir atrás/adelante se restauran **todos** los filtros, el orden y la página. Las navegaciones propias no consultan dos veces.
- **Scroll** (los puntos marcados con ⏳ dependen del ajuste de core pendiente, sección 7.1):
  - ⏳ filtrar u ordenar no mueve la página;
  - paginar o elegir desde «Completa tu proyecto» lleva al inicio de los resultados;
  - una navegación externa nueva (menú «Categorías» del header) muestra los resultados desde arriba;
  - ⏳ atrás/adelante restaura la posición guardada al terminar la carga;
  - se desactiva el anclaje de scroll de Firefox (`overflow-anchor: none`) en la zona del catálogo, porque desplazaba la página unos 400 px al reemplazar las tarjetas.

### B. Políticas Transversales Validadas
- **Seguridad (M20) / datos sensibles (HU-SEG-06):** solo se consumen endpoints públicos. No se exponen datos sensibles y no se guarda nada en `localStorage`.
- **Control en servidor (HU-ADM-03):** no aplica (vistas públicas). Los filtros se validan también en el backend (Zod en M02).
- **DTOs (AGENTS §12):** el rango de precio se valida con `rangoPrecioPublicoSchema` en `dtos/publicas/catalogo-publico.dto.ts`, sin esquemas inline en `.vue`.
- **Design System:** solo tokens oficiales (`corporate`, `action`, `subaction`, `highlight`, `neutral-*`).
- **Accesibilidad:** `aria-expanded`/`aria-controls` en las secciones, `aria-busy` y `inert` durante la actualización, `role="alert"` y `aria-invalid` en el rango de precio. La transición se desactiva con `prefers-reduced-motion`.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

| Criterio | Verificación |
| :--- | :--- |
| CA-BUS-02-03 (dos marcas a la vez) | E2E: marcas 4 y 5 → 49 productos = API. Test `filtros-multiples`. |
| CA-BUS-02-04 (sin coincidencias se informa) | Estado vacío «No encontramos productos» con «Limpiar filtros». |
| CA-BUS-02-05 (quitar uno conserva el resto; paginar los mantiene) | E2E: quitar el chip de una marca conserva la otra marca y las líneas. Test de paginación. |
| CA-BUS-02-06 (mínimo > máximo se impide e informa) | Test nuevo: mensaje, `aria-invalid` y ninguna consulta. |
| CA-BUS-05-02 (avanzar conserva filtros y orden) | Tests `catalogo-diseno` y `navegacion-categorias`. |
| CA-BUS-05-03 (móvil sin scroll horizontal) | E2E a 820 y 390 px. |
| HU-CAT-08 (máx. 4, sin el propio producto, oculta si vacío) | Test `productos-complementarios` y E2E de complementarios. |

### Pruebas automatizadas (11/10/2026, sobre el contenido de los commits, sin el ajuste de core)
- **vitest:** 103/103 (15 archivos), incluidos `filtros-multiples.test.ts` (11 casos) y `busqueda-filtros-categoria.test.ts` (4 casos: lista, id suelto, lista vacía y URL sin corchetes). Las pruebas del prototipo salieron con él.
- **`vue-tsc --noEmit`:** 0 errores en M01/M02. Persisten **2 errores que ya trae `develop`** en `m05-carrito-compras/store/cart.store.ts` (ver 7.2).
- **ESLint** en `m01-catalogo` y `m02-busqueda`: 0/0. El lint global mantiene **3 problemas que ya trae `develop`** en `core/components` (ver 7.2).
- **`vite build`:** correcto. `npm run build` falla por los errores de tipos de M05 de `develop`.

### E2E en Firefox (backend principal `localhost:3000`, `localhost:5173`, 100 productos de prueba locales)
Suites: header/router, selección múltiple, scroll del panel, diseño, categorías, calculadora (regresión sobre la versión de `develop`) y complementarios. Las pruebas del prototipo pausado quedan fuera de la entrega.
- **Sin el ajuste de core (lo que se entrega):** scroll del panel, diseño, categorías, calculadora y complementarios correctos. Fallan solo las 3 comprobaciones de posición de la página: ordenar, filtrar y volver atrás llevan la página al inicio (`scrollY 0`).
- **Con el ajuste de core:** las 7 suites correctas.

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS

### A. Dependencias hacia atrás
- **M02 backend (`/api/busqueda/productos` y `/facetas`):** listas por grupo (OR) y AND entre grupos, ya soportadas. Sin cambios de backend en esta entrega.
- **M01 backend (`/api/catalogo/publico/...`):** categorías, fichas y complementarios.
- **Core (compartido, pendiente):** el ajuste de `frontend/src/core/routes/index.ts` (`scrollBehavior`, 7 líneas) **no se incluye** hasta que lo revise el responsable de core. Sin él, el router global lleva la página al inicio en cada cambio de filtro u orden.
- **M02 frontend (compartido, aprobado):** `m02-busqueda/interfaces/busqueda.interface.ts` y `services/busqueda.service.ts`. `categoria` y `subcategoria` admiten un id o una lista; el servicio las envía separadas por comas (`?categoria=1,2`), el formato que acepta la API. Los consumidores que pasen un solo id siguen funcionando.

### B. Dependencias hacia adelante
- Habilita compartir enlaces de catálogo con filtros múltiples y volver a ellos con atrás/adelante.
- El contrato de `FiltrosBusquedaFrontend` cambia: `categoria` y `subcategoria` pasan a ser `number[]`. En `develop` solo lo consume M01.

---

## 6. REGISTRO DE ARCHIVOS (respecto a `develop`)

| Tipo | Archivo | Cambio |
| :--- | :--- | :--- |
| [PENDIENTE] | `frontend/src/core/routes/index.ts` | **No incluido.** Ajuste de `scrollBehavior` pendiente de revisión de core: posición guardada en atrás/adelante y sin scroll si solo cambia la query. Impacto fuera de M01: `VistaPorMarca` y `VistaVariantes` (admin) dejarían de saltar al inicio al cambiar su filtro. |
| [MOD] | `m02-busqueda/interfaces/busqueda.interface.ts`, `services/busqueda.service.ts` | `categoria` y `subcategoria`: `number \| number[]`, serializadas con comas mediante `idsParametro` (lista vacía omitida). Compatible con consumidores de un solo id. |
| [MOD] | `m01-catalogo/composables/publicas/useCatalogoPublico.ts` | Listas de categorías, facetas por grupo, URL única, restauración completa, `resultadosListos` y `navegacionesExternas`. |
| [MOD] | `m01-catalogo/views/publicas/VistaCatalogoPublico.vue` | Panel tipo select, actualización suave, gestión del scroll y rango de precio validado. |
| [NUEVO] | `components/publicas/FiltroAcordeonPublico.vue`, `OpcionFiltroPublico.vue`, `PaginacionCatalogoPublico.vue` | Sección tipo select, opción de filtro reutilizable y paginación. |
| [NUEVO] | `components/publicas/ProductosComplementariosPublicos.vue`, `composables/publicas/useProductosComplementarios.ts` | HU-CAT-08. |
| [NUEVO] | `composables/publicas/useColorCoincidenteBusqueda.ts` | Color coincidente (ya estaba en `d7aaf73`). |
| [MOD] | `views/publicas/VistaInicioPublica.vue`, `components/publicas/MenuCategoriasPublico.vue` | Inicio → catálogo filtrado. |
| [MOD] | `composables/publicas/useInicioPublico.ts` | Se elimina `filtrarPorSubcategoria`, que no se usaba. |
| [MOD] | `components/publicas/TarjetaProductoPublico.vue` | Altura uniforme, título en 2 líneas y precio que puede pasar de línea. Sobre la versión de `develop` (`idColor`, sin descuento ficticio). |
| [MOD] | `dtos/publicas/catalogo-publico.dto.ts` | `rangoPrecioPublicoSchema`. |
| [MOD] | `views/publicas/VistaDetalleProductoPublico.vue`, `composables/publicas/useDetalleProductoPublico.ts` | Complementarios con `ProductosComplementariosPublicos` y guardas de solicitud. En `develop` la ficha usaba `<TarjetaProductoPublico>` sin importarlo, así que los complementarios no se mostraban. |
| [NUEVO] | `tests/publicas/filtros-multiples.test.ts`, `catalogo-diseno.test.ts`, `navegacion-categorias.test.ts`, `productos-complementarios.test.ts`, `busqueda-filtros-categoria.test.ts`, `busqueda-tiempo-real.test.ts` | Pruebas de la entrega. |

---

## 7. DICTAMEN Y PENDIENTES PARA CERRAR LA ENTREGA

* **Pruebas de Calidad Superadas (QA Gate):** ✅ en el alcance de M01/M02 público. ❌ en el gate global por defectos que trae `develop` (7.2).

### 7.1 Publicación y pendientes
- **Rama:** la entrega se publica en `feature/m01-vistas-publicas`. No se usa otra rama ni se publica en `develop`.
- **Trabajo de otros equipos:** la rama contiene la carpeta `frontend/src/modules/m01-dashboardcatalogo/` (177 archivos, panel administrativo de otro equipo) que `develop` eliminó en `e2604da`. Esta entrega **no la modifica**; solo conserva `ARQUITECTURA.md`, cuya eliminación había llegado con una fusión anterior. Un PR hacia `develop` mostraría esa carpeta como añadida: la decisión corresponde a su equipo, por lo que el PR no debe darse por listo para integrar hasta resolverlo.
- **M02:** cambio del servicio y la interfaz de búsqueda aprobado e incluido.
- **Pendiente:** revisión del responsable de core para el ajuste de `scrollBehavior`. Hasta entonces no se incluye y los puntos ⏳ de la sección 3 no se cumplen en la entrega.

### 7.2 Defectos que vienen de `develop` (otros equipos, no modificados)
- **M05 (`a5e3385` #1050 sobre `2adc051` #1052):** `cart.store.ts` importa `CartProductFallback`, que ya no existe en `cart.interface.ts`, y llama a `toVisualItem` con 2 argumentos. Rompe `vue-tsc` y `npm run build` en `develop`. En ejecución no falla (el segundo argumento se ignora).
- **Core (`5cb8003`):** ESLint `no-undef` (`MouseEvent`, `Node`) en `core/components/forms/SearchableSelect.vue` y una variable sin uso en `Tooltip.vue`.
- **Entorno de pruebas:** el backend usado en las pruebas locales es anterior a los últimos cambios de backend de `develop` en M01 (bloqueo de publicación sin imagen) y M05 (metadatos de líneas). No afectan a los flujos públicos probados.

### 7.3 Prototipo pausado (separado de la entrega)
La integración calculadora → catálogo y el filtro de superficie se separaron el 10/10/2026 y **no se entregan**. Su código, sus pruebas y su walkthrough se conservan en un parche recuperable, en el respaldo local de la autora (fuera del repositorio), junto con las instrucciones de restauración. El backend de superficies existe solo en una rama experimental local, sin integrar.

### 7.4 Verificaciones manuales pendientes
- En Firefox de escritorio (no headless): al llegar al final de la lista de filtros, la rueda no debe arrastrar la página (`overscroll-behavior: contain`; headless no lo aplica a la rueda simulada).
