# WALKTHROUGH DE IMPLEMENTACIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.9.7`
* **Módulo de Origen:** M01 - Catálogo de productos (vistas públicas), con la búsqueda M02 que se muestra en ellas
* **Fecha de Entrega:** 14/10/2026
* **Autor / Responsable:** Agente de IA (Claude Code)
* **Estado de la Implementación:** ✅ COMPLETO en lo viable desde el frontend (ver sección 5 para lo que depende de otros módulos)
* **Origen:** informes "Revisión del frontend de búsqueda M02" y "Revisión del frontend público de M01" del 13/10/2026 (commit `ff300b9`), con la indicación del líder técnico de aplicar todo lo viable.

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título | Hallazgos | Componentes |
| :--- | :--- | :--- | :--- |
| **HU-BUS-02** | Filtros del catálogo | M02-03 (color), M02-11, M02-12, M02-12 B, M02-14 | `useCatalogoPublico.ts`, `VistaCatalogoPublico.vue`, `TarjetaProductoPublico.vue`, `seleccion-variante.ts` |
| **HU-BUS-01** | Búsqueda: resiliencia | M02-13 | `useCatalogoPublico.ts`, `VistaInicioPublica.vue` |
| **HU-CAT-13 / HU-CAT-06** | Venta sin existencias (el límite es solo para combos) | M01-08 (parte de productos normales), PINT-001, PINT-005 | `VistaDetalleProductoPublico.vue`, `CalculadoraPinturaContenido.vue` |
| **HU-CAT-06** | Paleta de colores | M01-16 (mejora parcial) | `usePaletaColoresPublica.ts` |

### Descripción del Alcance de la Versión
1. **M02-03, filtro de color:** el panel vuelve a tener la sección **Color**, con los colores de las facetas reales de M02 y un buscador interno (hay decenas de colores). Se suma con OR dentro del grupo y con AND frente a los demás. Sus opciones se cuentan sin su propio filtro, igual que las de los otros grupos. La URL `?color=` ya funcionaba; ahora también hay control en pantalla. *Nota:* la versión v0.4.8.0 había dejado el panel en 6 secciones "acordadas" sin color; no se encontró registro de esa decisión y la revisión pide restituirlo.
2. **M02-11, categoría y subcategoría combinables:** elegir una categoría ya no borra las subcategorías, ni al revés. La API los combina con AND. Un enlace que trae ambos los conserva (antes se descartaba la categoría). Quitar uno mantiene el otro (CA-BUS-02-05).
3. **M02-14, opciones con resultados:**
   - Las categorías y subcategorías del panel salen de las facetas vigentes: solo se ofrecen las que dan resultados con los filtros actuales. Por ejemplo, con la marca Pintuco quedan 2 categorías de 6. Las marcadas siempre siguen visibles para poder quitarlas.
   - Si fallan las facetas, se descartan las opciones anteriores (eran de otros filtros) y solo quedan las marcadas, con el aviso y el botón «Reintentar» que ya existían.
4. **M02-12, precio en la URL:** el enlace se valida con el mismo esquema que el panel. Antes, `precioMax=0` y los negativos se descartaban en silencio. Ahora no se aplican y se explica el motivo: "El rango de precio del enlace no era válido y no se aplicó: El precio máximo debe ser mayor que 0."
5. **M02-12 B, sin relajar filtros en silencio:** si ninguna variante de un producto cumple todos los filtros a la vez (la búsqueda lo devuelve porque cada filtro lo cumple una variante distinta, hallazgo B-1 de M02):
   - la tarjeta muestra "Ninguna opción cumple todos los filtros; elígela en el producto.";
   - la compra rápida abre la ficha en lugar de agregar otra variante.
6. **M02-13, fallo de búsqueda:** el catálogo lleva al inicio (`/?aviso=busqueda-no-disponible`). El inicio informa sin detalles técnicos y limpia la URL (CA-BUS-01-07).
7. **Venta sin existencias (M01-08, PINT-001, PINT-005):** según RF-CAT-13-02, el límite por existencia es una excepción exclusiva de los combos. La ficha y la calculadora ya no recortan la cantidad por la existencia referencial; solo queda el tope de 999 por línea del carrito. Esto retira el "1 disponible" falso de las variantes con 0 en existencia. El aviso de la calculadora (v0.4.9.6) se conserva con un tope genérico (`maximoUnidades`), para usarlo con combos cuando la API los identifique.
8. **M01-16, paleta:** reúne los colores de todo el catálogo, en páginas de 100 y con un tope de 3 páginas. Antes usaba solo los 20 primeros productos.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS APLICADAS

- **Venta sin existencias:** se puede pedir más de la existencia referencial (RF-CAT-13-02 la cita como regla general). Pendiente de que el analista la redacte (D-1).
- **CA-BUS-01-07 frente a RF-BUS-01-06:** se aplica el criterio de aceptación (llevar al inicio). El RF solo exige mantener accesibles el inicio y el catálogo.
- Solo tokens del Design System; DTO de precio único (`rangoPrecioPublicoSchema`) para el panel y la URL.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

| Verificación | Método | Resultado |
| :--- | :--- | :---: |
| Sección Color: opciones de facetas, búsqueda interna, URL y consulta | Prueba nueva; Docker (`?color=90`: 11 productos) | ✅ |
| Categoría + subcategoría: se combinan, se recuperan del enlace y quitar una conserva la otra | Pruebas nuevas; Docker (`?categoria=1&subcategoria=4`: 16) | ✅ |
| Solo se ofrecen categorías con resultados; con fallo de facetas, solo las marcadas | Pruebas nuevas; Docker (Pintuco: 2 de 6) | ✅ |
| `?precioMax=0` y `?precioMin=-5` no se aplican y se explica el motivo | Pruebas nuevas; Docker | ✅ |
| Coincidencia parcial: aviso en la tarjeta y la compra rápida abre la ficha | Pruebas nuevas | ✅ |
| Búsqueda caída → inicio con aviso, sin texto técnico, URL limpia | Prueba nueva; Docker con el backend detenido | ✅ |
| La ficha permite superar la existencia (0 en existencia → 5 unidades) | Pruebas actualizadas; Docker (producto 95) | ✅ |
| La paleta pide todas las páginas | Prueba nueva; Docker | ✅ |

**Pruebas:** suite frontend completa 176/176. ESLint de M01 sin errores ni advertencias. `vue-tsc` solo con los 2 errores previos de M05.

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

| Hallazgo | Qué falta | Responsable |
| :--- | :--- | :--- |
| M02-03 (familia cromática) | La familia no viene en la búsqueda ni en las facetas | Backend M02 |
| M01-08 (combos) | La API pública no identifica combos (`es_combo`) ni su estado agotado | Backend M01 |
| M01-13 | Carta remota para productos entonables y resolución de base (rama `feature/m01-backend-catalogo-publico`, sin integrar) | Backend M01; regla color–base RF-CAT-12-12 (negocio) |
| M01-15 | Llevar a la compra el color solicitado y el rendimiento de la recomendación | M05 y M08 (contrato del carrito) |
| M01-16 | Listado de colores propio, con cartas entonables | Backend M01 |
| M02-07 | Fuente de configuración para el orden y el tamaño de página (hoy 4×8, decisión del líder) | Configuración del sistema |
| M02-15 | Pantalla de estadísticas de búsquedas sin resultado | Administración |
| PINT-006 | El «+» del carrito bloquea por encima de la existencia, contra la venta sin stock | M05 |

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo | Ruta | Descripción |
| :---: | :--- | :--- |
| **[MOD]** | `frontend/src/modules/m01-catalogo/composables/publicas/useCatalogoPublico.ts` | Grupos de categoría combinables, facetas por grupo (incluido el color), `facetasVigentes`, precio de la URL con el DTO y paso al inicio ante un fallo. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/views/publicas/VistaCatalogoPublico.vue` | Sección Color con buscador, `categoriasVisibles`, mensaje con el motivo y compra rápida ante coincidencia parcial. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/views/publicas/VistaInicioPublica.vue` | Aviso de búsqueda no disponible. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/views/publicas/VistaDetalleProductoPublico.vue` | Sin límite por existencia (tope 999 por línea). |
| **[MOD]** | `frontend/src/modules/m01-catalogo/components/publicas/TarjetaProductoPublico.vue` | Aviso de coincidencia parcial. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/components/publicas/CalculadoraPinturaContenido.vue` | Documentación del tope genérico. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/services/publicas/seleccion-variante.ts` | `cumpleTodosLosFiltros`. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/composables/publicas/usePaletaColoresPublica.ts` | Carga por páginas de 100 (máximo 3). |
| **[NUEVO]** | `frontend/src/modules/m01-catalogo/tests/publicas/revision-filtros-m02.test.ts` | 8 casos de la revisión. |
| **[MOD]** | `tests/publicas/filtros-multiples.test.ts`, `catalogo-diseno.test.ts`, `correcciones-vistas-publicas.test.ts`, `validacion-entradas.test.ts` | Reglas nuevas (3 casos nuevos y 4 actualizados). |
