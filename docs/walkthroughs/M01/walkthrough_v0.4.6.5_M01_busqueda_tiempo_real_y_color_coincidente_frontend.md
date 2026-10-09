# WALKTHROUGH DE IMPLEMENTACIÓN

> 🏷️ **CONVENCIÓN OBLIGATORIA DE NOMENCLATURA DEL ARCHIVO:**  
> Guardar obligatoriamente en `docs/walkthroughs/M[XX]/` con el sufijo de capa técnica **al final del nombre**:  
> - **Frontend:** `walkthrough_v0.4.6.5_M01_busqueda_tiempo_real_y_color_coincidente_frontend.md`

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.6.5`
* **Módulo de Origen:** `M01 Catálogo de Productos (vistas públicas) / M02 Búsqueda y Navegación`
* **Fecha de Entrega:** `08/10/2026`
* **Autor / Responsable:** `yuleinylugo71 (frontend vistas públicas M01/M02) con asistencia de Claude Code (agente de IA)`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-BUS-01** | Búsqueda de productos | **100% Cumplida** (frontend) | `useCatalogoPublico.ts` · consume `GET /api/busqueda/productos` |
| **HU-BUS-02** | Filtros del catálogo | **100% Cumplida** (frontend) | `useCatalogoPublico.ts` · sincronización con la URL (`RF-BUS-02-05`) |
| **HU-CAT-06** | Consulta pública del catálogo | **100% Cumplida** (frontend) | `VistaCatalogoPublico.vue` · `useColorCoincidenteBusqueda.ts` · consume `GET /api/catalogo/publico/productos/:id` |

### Descripción del Alcance de la Versión
Incremento **Patch** sobre `v0.4.6.4` con dos correcciones del catálogo público (`/catalogo`):

1. **Color coincidente en la tarjeta del producto.** Al buscar un color (por ejemplo, "amarillo"), la tarjeta mostraba el círculo de la primera variante del producto (por ejemplo, Azul Océano), sin relación con la búsqueda. Ahora el círculo muestra el **HEX real de la variante cuyo color coincide** con el término buscado. Si no hay coincidencia de color, la tarjeta conserva su comportamiento predeterminado.
2. **Búsqueda en tiempo real.** Los resultados se actualizan mientras el usuario escribe o borra, sin necesidad de pulsar Enter, con un *debounce* de **300 ms**, sin peticiones duplicadas y sin que una respuesta antigua sobrescriba una más reciente. El campo vacío devuelve el catálogo completo.

No se modificó el backend, la base de datos, los módulos administrativos ni el diseño de las tarjetas.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Búsqueda en tiempo real (`useCatalogoPublico.ts`)

| Regla | Implementación |
| :--- | :--- |
| **Debounce de 300 ms** | Un `watch` sobre `termino` reinicia un temporizador (`ESPERA_BUSQUEDA_MS = 300`) en cada pulsación; la consulta se lanza solo cuando el usuario deja de escribir 300 ms. Al desmontar la vista el temporizador se cancela (`onBeforeUnmount`). |
| **Enter / botón buscar** | `buscar()` cancela el temporizador y aplica la búsqueda de inmediato; el temporizador pendiente ya no repite la consulta. |
| **Sin peticiones duplicadas** | `terminoAplicado` guarda el término normalizado de la última consulta lanzada. Si el término normalizado no cambia (por ejemplo, se añade un espacio final), no se consulta de nuevo. |
| **Respuestas antiguas descartadas** | Cada carga recibe un número de solicitud (`solicitudProductos` y `solicitudFacetas`). Solo la solicitud más reciente puede actualizar productos, total, facetas, error y estado de carga. |
| **Paginación** | Todo cambio de término reinicia la página a 1. |
| **Campo vacío** | Se consulta sin `q` y se muestra el catálogo completo (`RF-BUS-01-01`). |
| **Sincronización con la URL** | El término se refleja en `?q=` junto con los filtros existentes. Mientras se escribe se usa `router.replace` para no llenar el historial; las demás acciones (Enter, filtros, orden, página) conservan `router.push`. |
| **Navegación externa** | El `watch` de la ruta (buscador del header, atrás/adelante) solo recarga si la URL difiere del estado ya aplicado. Esto elimina además una petición duplicada preexistente: buscar o elegir subcategoría cargaba dos veces (una directa y otra al cambiar la URL). |
| **Estados de UI** | Se conservan los estados de carga (esqueleto), sin resultados y error con reintento. |

### B. Color coincidente (`useColorCoincidenteBusqueda.ts`)

**Contrato real de la API.** `GET /api/busqueda/productos` devuelve por producto únicamente `id_producto`, `nombre`, `id_marca` y `clase_color`; **no informa qué color coincidió**. El backend sí busca sobre el nombre del color de las variantes (`unaccent(lower(...))` con `ilike` o `word_similarity`). La ficha pública (`GET /api/catalogo/publico/productos/:id`), que la vista ya carga para cada tarjeta, entrega por variante `color`, `familia_color` y `muestra_hex`. Por eso la coincidencia se resuelve en el frontend **sin nuevas peticiones, sin propiedades inventadas y sin modificar el backend**.

**Algoritmo** (`obtenerMuestraColorCoincidente(variantes, termino)`):
1. Normaliza el término y los nombres igual que el backend: minúsculas, sin tildes y con espacios simples.
2. Descarta variantes sin nombre de color o sin HEX válido (`#RGB` o `#RRGGBB`).
3. Clasifica cada coincidencia por precisión: nombre exacto, nombre que empieza por el término, nombre que lo contiene y, por último, todas las palabras presentes en el nombre o en la familia cromática (por ejemplo, "amarillos").
4. Con varias coincidencias elige de forma **determinista**: mejor rango y, a igualdad, menor `id_color` y menor `id_variante`. El orden en que llegan las variantes no altera el resultado.
5. Sin coincidencia devuelve `null`, y `TarjetaProductoPublico` aplica su comportamiento predeterminado (primera variante con muestra, o el gris neutro de respaldo).

La vista calcula el color con `terminoAplicado`, es decir, el término de los resultados que se están mostrando, para que el círculo no cambie antes de que lleguen los nuevos resultados. La tarjeta no se modificó: ya aceptaba la prop `muestraColor`. La ficha de detalle no recibe el color, por lo que su variante seleccionada por defecto no cambia.

**Limitaciones conocidas:**
- **Errores tipográficos en colores:** el backend encuentra el producto con "amarilo" (por similitud), pero el círculo solo cambia cuando el nombre del color o su familia contienen el término. Con una errata la tarjeta conserva su color predeterminado.
- **Coincidencia con el predeterminado:** si el color buscado es justamente el predeterminado del producto (por ejemplo, "azul" en Viniltex, cuya primera variante es Azul Océano), el círculo no cambia visualmente.
- **Fichas no cargadas:** si la ficha de un producto falla (`detalle: null`), no hay variantes con las que comparar y se usa el comportamiento predeterminado.

### C. Políticas transversales validadas
- 👁️ **M20 - Mínima exposición (`HU-SEG-06`):** no se añaden datos a las peticiones ni a las respuestas; solo se reutilizan campos públicos ya expuestos.
- 🎨 **Paleta oficial (`AGENTS.md` §8):** el círculo usa exclusivamente el `muestra_hex` real de la variante; no se introducen colores nuevos en el código.
- 🧩 **Aislamiento de módulo (`AGENTS.md` §1):** los cambios se limitan a las vistas y composables públicos de `m01-catalogo`.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

### 🔹 Historia de Usuario: HU-BUS-01 — Búsqueda de productos

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-BUS-01-01** | **Dado que** existen productos cuyo nombre contiene el término **cuando** busco **entonces** se devuelven; si ninguno coincide, se informa que no hay resultados. | E2E en Firefox: "esmalte" devuelve sus productos; "zzz" muestra "No encontramos productos". | ✅ **CUMPLIDO** |
| **CA-BUS-01-02** | **Dado que** busco con acentos o en mayúsculas **entonces** obtengo los mismos resultados. | Pruebas unitarias: "OCEANO" → Azul Océano, "maiz" → Amarillo Maíz. | ✅ **CUMPLIDO** |
| **CA-BUS-01-05** | **Dado que** busco el nombre de un color de la carta **entonces** obtengo los productos correspondientes. | E2E: "amarillo" devuelve Viniltex con círculo `#FFCD28` (Amarillo Sol). | ✅ **CUMPLIDO** |

### 🔹 Historia de Usuario: HU-BUS-02 — Filtros del catálogo

| ID Criterio | Criterio de Aceptación | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **RF-BUS-02-05** | Compartir y recuperar la búsqueda y los filtros mediante la URL. | Prueba de composable: `?q=` se actualiza al escribir y desaparece con el campo vacío; abrir `/catalogo?q=azul&pagina=2` restaura término y página. | ✅ **CUMPLIDO** |

### 🔹 Pruebas automatizadas (`tests/publicas/busqueda-tiempo-real.test.ts`, 10 casos)

| Caso | Resultado |
| :--- | :---: |
| Usa el HEX real de la variante cuyo color coincide | ✅ |
| Elige de forma determinista entre varias coincidencias (menor `id_color`, independiente del orden) | ✅ |
| Ignora tildes y mayúsculas y coincide por familia de color | ✅ |
| Devuelve `null` sin coincidencia de color (término de producto, vacío o solo espacios) | ✅ |
| Descarta variantes sin HEX válido | ✅ |
| Busca tras 300 ms sin Enter y agrupa la escritura progresiva en una sola petición | ✅ |
| Al borrar hasta vaciar vuelve al catálogo completo y reinicia la página | ✅ |
| No repite la consulta si el término normalizado no cambia | ✅ |
| Una respuesta antigua no sobrescribe los resultados más recientes | ✅ |
| Enter aplica la búsqueda de inmediato sin esperar el debounce | ✅ |

### 🔹 Prueba E2E en navegador real

Firefox 150 en modo headless, controlado mediante WebDriver BiDi, sobre el stack local (Vite + backend + PostgreSQL con los datos del seed). Las pulsaciones se simulan carácter a carácter.

| Escenario | Resultado observado |
| :--- | :--- |
| Catálogo inicial | 3 productos con sus círculos predeterminados. |
| Escribir "amarillo" de corrido (8 pulsaciones) | **1 sola petición** tras el debounce; Viniltex con círculo `#FFCD28` (Amarillo Sol); URL `/catalogo?q=amarillo`. |
| Borrar progresivamente hasta "ama" (pausas de 400 ms) | Resultados actualizados en cada pausa; el círculo amarillo se mantiene. |
| Borrar hasta dejar el campo vacío | 3 productos de nuevo, URL `/catalogo`, 1 petición. |
| Buscar "azul" | Viniltex con `#1D70A5` (Azul Océano, menor `id_color` de la familia). |
| Buscar "esmalte" (nombre de producto) | Las tarjetas conservan su círculo predeterminado. |
| Cambios rápidos: "kit" → "amarillo arena" (120 ms) → "viniltex" | Resultado final de "viniltex"; la búsqueda intermedia no se lanzó; 2 peticiones. |
| Buscar "zzz" | Estado "No encontramos productos". |
| Abrir `/productos/1` después de buscar | La ficha conserva su variante predeterminada (Azul Océano). |

### 🔹 Verificación técnica

| Verificación | Resultado |
| :--- | :--- |
| `npm test` (vitest) | ✅ 53/53 (43 existentes + 10 nuevas) |
| `npx vue-tsc -b` | ✅ 0 errores |
| `npx eslint` sobre los archivos de esta entrega | ✅ 0 errores, 0 advertencias |
| `npm run lint` (proyecto completo) | ⚠️ 2 errores y 1 advertencia **preexistentes en develop**, ajenos a esta entrega (`SearchableSelect.vue`, `Tooltip.vue`) |
| `npm run build` | ✅ Correcto |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias hacia atrás
- **M02 Backend (`GET /api/busqueda/productos`, `/facetas`):** requiere las extensiones `unaccent` y `pg_trgm` en PostgreSQL. `bd/sql/schema_pintuclic.sql` no las crea; en una instalación nueva deben habilitarse (ver walkthrough M02 `v0.3.40.0`).
- **M01 Backend (`GET /api/catalogo/publico/productos/:id`):** debe seguir exponiendo por variante `color`, `familia_color` y `muestra_hex`, de los que depende el color coincidente.

### B. Dependencias hacia adelante
- Cualquier vista pública que use `useCatalogoPublico` obtiene búsqueda en tiempo real y el nuevo `terminoAplicado`.
- `obtenerMuestraColorCoincidente` es una función pura reutilizable por otras vistas públicas que necesiten resaltar el color buscado.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ **Verificación de límites de módulo:** solo se tocaron archivos públicos de `m01-catalogo`, más los archivos de versión y documentación de la entrega.

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[NUEVO]** | `frontend/src/modules/m01-catalogo/composables/publicas/useColorCoincidenteBusqueda.ts` | Normalización de texto y selección determinista del HEX de la variante cuyo color coincide con la búsqueda. |
| **[MODIFICADO]** | `frontend/src/modules/m01-catalogo/composables/publicas/useCatalogoPublico.ts` | Debounce de 300 ms, `terminoAplicado`, descarte de respuestas antiguas, deduplicación de consultas y `router.replace` al escribir. |
| **[MODIFICADO]** | `frontend/src/modules/m01-catalogo/views/publicas/VistaCatalogoPublico.vue` | Pasa a cada tarjeta el color coincidente (`muestra-color`). |
| **[NUEVO]** | `frontend/src/modules/m01-catalogo/tests/publicas/busqueda-tiempo-real.test.ts` | 10 pruebas de color coincidente y de búsqueda en tiempo real. |
| **[NUEVO]** | `docs/walkthroughs/M01/walkthrough_v0.4.6.5_M01_busqueda_tiempo_real_y_color_coincidente_frontend.md` | Este documento. |
| **[MODIFICADO]** | `.github/version.txt` · `docs/CHANGELOG.md` | Versión `0.4.6.5` y su entrada en el CHANGELOG. |

Sin cambios: `TarjetaProductoPublico.vue`, backend, base de datos, módulos administrativos y `m01-dashboardcatalogo`.

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ`
* **Apego al Diagrama de Flujo:** `✅ Sin cambios de flujo; la búsqueda y los filtros se siguen resolviendo en el servidor (RF-BUS-01-02)`
