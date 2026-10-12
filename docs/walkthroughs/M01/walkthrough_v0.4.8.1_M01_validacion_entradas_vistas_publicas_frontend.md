# WALKTHROUGH DE IMPLEMENTACIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.8.1`
* **Módulo de Origen:** M01 - Catálogo de productos (vistas públicas)
* **Fecha de Entrega:** 12/10/2026
* **Autor / Responsable:** Agente de IA (Claude Code)
* **Estado de la Implementación:** ⚠️ PARCIAL CON DEPENDENCIAS. Las validaciones de M01 están completas; las de M04, M18 y el esquema de base de datos quedan reportadas (sección 7).

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título | Estado de Cobertura | Componentes |
| :--- | :--- | :---: | :--- |
| **HU-CAT-10** | Atributos técnicos (calculadora de pintura) | Corrección | `CalculadoraPinturaContenido.vue`, `calculadora-pintura.dto.ts` |
| **HU-BUS-02** | Filtros del catálogo (rango de precio) | Corrección | `catalogo-publico.dto.ts`, `useCatalogoPublico.ts`, `VistaCatalogoPublico.vue` |
| **HU-BUS-01** | Búsqueda de productos (buscador del inicio) | Corrección | `useInicioPublico.ts` |
| **HU-CAT-06** | Consulta pública (cantidad en la ficha) | Corrección | `VistaDetalleProductoPublico.vue` |

### Descripción del Alcance de la Versión
Parche de validación de las entradas del usuario en las vistas públicas, a partir de la auditoría de entradas y del informe de la calculadora del 9 de octubre de 2026 (hallazgo F01):

1. **Calculadora:** el esquema ya rechazaba medidas inválidas, pero la pantalla lo ignoraba y mostraba "0.0 m²" y "1 galón", con "Agregar al carrito" activo. Ahora cada medida muestra su mensaje, el área se ve como "—", el resultado se sustituye por un aviso y el botón queda desactivado. El mínimo del esquema pasa a 0,1 m, el mismo que anuncia el campo; antes aceptaba 0,001.
2. **Rango de precio:** un precio negativo se informa ("El precio no puede ser negativo.") en lugar de descartarse en silencio; 0 o vacío siguen significando "sin límite". El campo con error se marca con `aria-invalid`.
3. **Rango por URL:** un enlace con el mínimo mayor que el máximo ya no llega a la API, que respondía 400 y la pantalla lo mostraba como "No fue posible cargar el catálogo". Ahora el rango se descarta, el catálogo carga y se explica el motivo.
4. **Cantidad en la ficha:** el botón "+" no tenía tope. Ahora se detiene en las existencias de la variante elegida y en 999 (el máximo por línea que acepta M05), y se ajusta al cambiar de presentación.
5. **Buscador del inicio:** usaba el listado de M01, que solo compara el nombre del producto, mientras que el catálogo usa la búsqueda de M02. Con el mismo término daban resultados distintos ("VINÍLTEX": 0 frente a 2). Ahora el inicio usa la búsqueda de M02: insensible a acentos, tolerante a errores tipográficos y con marca, línea y color.

**Segunda parte (flujos de las vistas públicas):**

6. **Calculadora → carrito (F02 del informe del 09/10/2026):** "Agregar al carrito" agregaba la cantidad del selector de la ficha (normalmente 1) aunque la calculadora recomendara, por ejemplo, 5 galones. Ahora la calculadora convierte los galones a unidades de la presentación elegida (5 galones son 5 galones, 21 cuartos o 19 litros), lo muestra ("Se agregarán N unidades de …") y envía esa cantidad. La ficha la limita a las existencias y explica si no alcanza.
7. **Rendimiento de la ficha:** decía "Calculado a 2 manos", pero mostraba el rendimiento de una sola mano (un cliente podía comprar la mitad de la pintura necesaria). Ahora reparte el rendimiento por galón y mano entre las 2 manos, igual que la calculadora: "Superficie que cubre 1 Galón a 2 manos".
8. **"Anterior" en la ficha:** volvía a `/catalogo` sin filtros. Si se llegó desde el catálogo, ahora retrocede en el historial y conserva filtros, orden, página y posición; si se llegó de otra página, abre el catálogo limpio.
9. **Fallo de las opciones de filtro (M02-14):** se ocultaba al usuario. Ahora el panel muestra "No pudimos actualizar las opciones de los filtros." con un botón "Reintentar", y los resultados siguen visibles.
10. **Menú de categorías:** se quitó el número junto a cada categoría (contaba subcategorías y se leía como cantidad de productos). Se añadió cierre con Escape, foco inicial en "Cerrar", foco contenido dentro del diálogo y devolución del foco al botón que lo abrió.
11. **Código muerto:** la ficha y la paleta montaban su propio menú de categorías, que nunca se abría y no tenía conectado "Ver todos". Se eliminó, junto con la petición de categorías que hacían solo para él. Esa petición iba en `Promise.all` con los datos principales, así que si fallaba el servicio de categorías la ficha decía "Este producto no está disponible" y la paleta no cargaba.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **Medidas de la calculadora:** de 0,1 a 100 m por dimensión; de 1 a 50 superficies. Sin medidas válidas no hay recomendación ni acción de compra.
- **Rango de precio:** mínimo ≤ máximo (CA-BUS-02-06); no se admiten negativos; 0 o vacío equivalen a "sin límite".
- **Cantidad por línea:** entre 1 y el menor de las existencias de la variante y 999.

### B. Políticas Transversales Validadas
- 🛡️ **Validación en servidor (`HU-ADM-03` / `HU-SEG-03`):** las reglas del rango de precio y de la cantidad ya se validan en el backend (M02 y M05). El frontend las adelanta para dar mensajes claros; no las sustituye.
- 🎨 **Directiva 8 (paleta):** solo tokens del sistema (`highlight`, `neutral-*`, `conversion`).
- 🧩 **Directiva 12 (DTOs):** todos los esquemas siguen en `dtos/publicas/`; ninguno se declara en un `.vue`.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

| ID Criterio | Criterio | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-BUS-02-06** | Un rango con mínimo superior al máximo se impide y se informa | Prueba existente (panel) y prueba nueva (URL) | ✅ |
| **CA-BUS-01-02** | Buscar con acentos o mayúsculas da los mismos resultados (inicio) | Prueba nueva y API local con M02 | ✅ |
| **F01 (informe del 09/10/2026)** | Con medidas inválidas no se presenta una cantidad comprable | Prueba nueva: 0, negativo, 0,05, 101, vacío y recuperación | ✅ |
| **F02 (informe del 09/10/2026)** | La cantidad agregada coincide con la recomendación en la presentación elegida | Pruebas nuevas: conversión, emisión, diálogo y ficha con tope de existencias | ✅ |
| **RF-CAT-10-04** | Rendimiento referido a la presentación, con aviso de aproximación | Prueba nueva: 10–12 m²/gal/mano en 1 galón a 2 manos = 5–6 m² | ✅ |
| **CA-BUS-02-05 / RF-BUS-02-05** | Los filtros se conservan al volver de la ficha | Prueba nueva con historial real (`createWebHistory`) | ✅ |
| **RF-BUS-01-06 / RF-BUS-02-02** | Un fallo de facetas se informa sin bloquear el catálogo | Prueba nueva: aviso y reintento | ✅ |

**Pruebas:** `tests/publicas/validacion-entradas.test.ts` (13 casos) y `tests/publicas/correcciones-vistas-publicas.test.ts` (13 casos). Suite M01 frontend: 103/103, sin errores sin manejar. ESLint de M01 sin errores ni advertencias. `vue-tsc` solo reporta los 2 errores previos de M05.

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **M02 (búsqueda):** el buscador del inicio requiere `GET /api/busqueda/productos`, que a su vez necesita las extensiones `unaccent` y `pg_trgm` en PostgreSQL. El esquema oficial no las crea (sección 7).
- **M05 (carrito):** el tope de 999 replica `CANTIDAD_MAXIMA_POR_LINEA` de M05; si M05 lo cambia, hay que actualizarlo aquí.

### B. Dependencias Hacia Adelante
- **M05 (carrito):** recibe cantidades que ya respetan las existencias y el máximo por línea.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ Verificación de límites de módulo: solo se modificaron archivos de M01.

| Tipo | Ruta | Descripción |
| :---: | :--- | :--- |
| **[MOD]** | `frontend/src/modules/m01-catalogo/dtos/publicas/calculadora-pintura.dto.ts` | Medidas de 0,1 a 100 m con mensajes; tipo `ErroresCalculadoraPintura`. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/components/publicas/CalculadoraPinturaContenido.vue` | Errores por campo, resultado condicionado y botón de agregar protegido. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/dtos/publicas/catalogo-publico.dto.ts` | Precio negativo informado; 0 o vacío como "sin límite". |
| **[MOD]** | `frontend/src/modules/m01-catalogo/composables/publicas/useCatalogoPublico.ts` | Validación del rango leído de la URL (`rangoPrecioDescartado`). |
| **[MOD]** | `frontend/src/modules/m01-catalogo/views/publicas/VistaCatalogoPublico.vue` | Campo con error marcado y aviso de rango descartado. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/views/publicas/VistaDetalleProductoPublico.vue` | Tope de cantidad por existencias y 999. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/composables/publicas/useInicioPublico.ts` | Buscador del inicio con la búsqueda de M02. |
| **[NUEVO]** | `frontend/src/modules/m01-catalogo/tests/publicas/validacion-entradas.test.ts` | 13 casos de validación de entradas. |
| **[NUEVO]** | `frontend/src/modules/m01-catalogo/services/publicas/calculo-pintura.ts` | Galón en litros, manos recomendadas y conversión de galones a unidades de una presentación. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/components/publicas/CalculadoraPinturaPublica.vue` | Recibe la presentación y retransmite las unidades. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/components/publicas/MenuCategoriasPublico.vue` | Sin número de subcategorías; Escape, foco inicial, foco contenido y devolución del foco. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/composables/publicas/useDetalleProductoPublico.ts` | Ya no pide categorías. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/composables/publicas/usePaletaColoresPublica.ts` | Ya no pide categorías. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/views/publicas/VistaPaletaColoresPublica.vue` | Sin menú de categorías propio. |
| **[NUEVO]** | `frontend/src/modules/m01-catalogo/tests/publicas/correcciones-vistas-publicas.test.ts` | 13 casos de los flujos corregidos. |

Además, en la segunda parte se volvieron a modificar `CalculadoraPinturaContenido.vue` (unidades por presentación), `VistaDetalleProductoPublico.vue` (cantidad desde la calculadora, rendimiento a 2 manos, "Anterior", sin menú propio), `useCatalogoPublico.ts` y `VistaCatalogoPublico.vue` (aviso y reintento de facetas).

---

## 7. INCONSISTENCIAS FUERA DEL MÓDULO (PROTOCOLO DE PARADA)

No se modificaron: requieren aprobación de sus responsables.

| Módulo / archivo | Problema | Evidencia |
| :--- | :--- | :--- |
| **M18** `services/plantilla.service.ts` | Los valores (`nombre`, `nombre_empresa`, `motivo`) se insertan en el HTML del correo sin escapar: alguien podría registrarse con el correo de otra persona y un "nombre" con un enlace. | Código, líneas 40-45 |
| **M04** `dtos/registro.dto.ts`, `perfil.dto.ts`, `direccion.dto.ts` (frontend y backend) | Teléfono y NIT aceptan valores sin dígitos (`-------`, `-----`, `kkkkk`); el documento acepta vacío o `%%%%`. La especificación de M04 no define formatos. | Esquemas ejecutados |
| **BD** `bd/sql/schema_pintuclic.sql` | No crea las extensiones `unaccent` y `pg_trgm`: en una base nueva toda búsqueda con texto responde 500. | API local y log del backend |
| **M01 panel** `dtos/variantes.dto.ts` | Admite precio 0 en una variante; falta una decisión de negocio. | Código, línea 10 |
| **M05** `store/cart.store.ts` | Dos errores previos de `vue-tsc` (`CartProductFallback`, número de argumentos), ajenos a esta entrega. | `vue-tsc --noEmit` |
