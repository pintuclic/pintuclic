# WALKTHROUGH DE IMPLEMENTACIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.9.0`
* **Módulo de Origen:** M01 - Catálogo de productos (vistas públicas)
* **Fecha de Entrega:** 12/10/2026
* **Autor / Responsable:** Agente de IA (Claude Code), por indicación del líder técnico
* **Estado de la Implementación:** ✅ COMPLETO

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título | Estado de Cobertura | Componentes |
| :--- | :--- | :---: | :--- |
| **HU-BUS-05** | Paginación de resultados (tamaño de página) | Ajuste por decisión del líder técnico | `useCatalogoPublico.ts`, `VistaCatalogoPublico.vue` |
| **HU-CAT-06** | Consulta pública (inicio y catálogo) | Ajuste de presentación | `CarruselProductosPublico.vue`, `VistaInicioPublica.vue` |

### Descripción del Alcance de la Versión
Cambios pedidos por el líder técnico el 12/10/2026:

1. **Catálogo en carruseles:** cada página muestra **4 filas de 8 productos** (32 por página, antes 16). Cada fila es un **carrusel manual**: en escritorio se ven 4 tarjetas (3 en tableta, 2 o 1 en móvil) y el resto se alcanza con las flechas, deslizando o con las flechas del teclado. **No avanza solo**: no hay avance automático ni temporizadores. La paginación se conserva debajo para resultados de más de 32 productos.
2. **Destacados del inicio en carrusel:** "Productos destacados" pasa de 5 productos en cuadrícula a un **carrusel manual de 10** (5 visibles en escritorio).
3. **Fondo del catálogo:** pasa de blanco a gris claro (`neutral-lightest`), igual que el inicio. Las tarjetas, el panel de filtros y los mensajes se mantienen en blanco.

### Componente nuevo: `CarruselProductosPublico`
- Desplazamiento nativo con `scroll-snap` (funciona con el dedo en móvil) y flechas que avanzan una pantalla.
- Las flechas solo aparecen si hay tarjetas fuera de la vista, y se desactivan en los extremos.
- Accesible: región con `aria-roledescription="carrusel"` y nombre propio, diapositivas "n de N", flechas con etiqueta y manejo con el teclado. Respeta `prefers-reduced-motion`.
- Al cambiar los resultados (filtro, orden o página), cada fila vuelve al principio.
- Solo usa tokens del sistema de diseño.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS APLICADAS

- **Tamaño de página del catálogo:** 32 (4 × 8), constantes `PRODUCTOS_POR_FILA`, `FILAS_POR_PAGINA` y `LIMITE_PAGINA`. RF-BUS-05-01 pide un "tamaño configurado": mientras no exista la configuración (RF-ADM-07-04 pendiente), el valor lo fija esta decisión del líder técnico.
- **Destacados del inicio:** 10 (`LIMITE_DESTACADOS`). El criterio de selección sigue sin definir en la documentación (se toman los primeros que devuelve el listado público).
- **Sin avance automático:** por decisión del líder técnico; además evita problemas de accesibilidad con contenido que se mueve solo.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

| Criterio | Método de Validación | Resultado |
| :--- | :--- | :---: |
| El catálogo pide 32 productos y los muestra en 4 carruseles de 8 | Prueba actualizada (`catalogo-diseno.test.ts`) | ✅ |
| La paginación conserva filtros con el nuevo tamaño (página 3: 65–80 de 80) | Prueba actualizada | ✅ |
| El carrusel no avanza solo ni deja temporizadores | Prueba nueva con temporizadores simulados | ✅ |
| Las flechas avanzan y retroceden una pantalla y se desactivan en los extremos; el teclado también funciona | Pruebas nuevas | ✅ |
| El inicio pide 10 destacados | Prueba nueva | ✅ |
| El fondo del catálogo es gris claro | Prueba nueva | ✅ |
| CA-BUS-05-02 / CA-BUS-05-04 (paginación) | Pruebas existentes | ✅ |

**Pruebas:** suite M01 frontend 117/117 (`carrusel-productos.test.ts`, 9 casos nuevos). ESLint de M01 sin errores ni advertencias. `vue-tsc` solo reporta los 2 errores previos de M05. En Docker: `/` y `/catalogo` responden 200, la API acepta `limite=32` y las reglas de ancho del carrusel están en el CSS servido.

**No verificado en navegador:** el desplazamiento real y la vista en móvil. Los datos de prueba locales solo tienen 3 productos, así que el desplazamiento no se ve hasta que haya más de 4 por fila.

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

- **M02 (búsqueda):** el catálogo pide `limite=32`, dentro del máximo de 100 que admite la API.
- **Configuración (M02/M17):** cuando exista la configuración del tamaño de página (RF-BUS-05-01, RF-ADM-07-04), las constantes de M01 deberán leerla.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo | Ruta | Descripción |
| :---: | :--- | :--- |
| **[NUEVO]** | `frontend/src/modules/m01-catalogo/components/publicas/CarruselProductosPublico.vue` | Carrusel manual y accesible de tarjetas. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/composables/publicas/useCatalogoPublico.ts` | 4 filas × 8 productos por página. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/views/publicas/VistaCatalogoPublico.vue` | Filas en carrusel y fondo gris claro. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/composables/publicas/useInicioPublico.ts` | 10 destacados. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/views/publicas/VistaInicioPublica.vue` | Destacados en carrusel. |
| **[NUEVO]** | `frontend/src/modules/m01-catalogo/tests/publicas/carrusel-productos.test.ts` | 9 casos del carrusel, tamaños y fondo. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/tests/publicas/catalogo-diseno.test.ts`, `validacion-entradas.test.ts` | Tamaños nuevos (32 y 10). |
