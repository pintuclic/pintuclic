# WALKTHROUGH DE IMPLEMENTACIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.9.3`
* **Módulo de Origen:** M01 - Catálogo de productos (vistas públicas)
* **Fecha de Entrega:** 12/10/2026
* **Autor / Responsable:** Agente de IA (Claude Code)
* **Estado de la Implementación:** ✅ COMPLETO

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título | Estado de Cobertura | Componentes |
| :--- | :--- | :---: | :--- |
| **HU-BUS-02** | Filtros del catálogo (presentación y color en la tarjeta) | Corrección | `seleccion-variante.ts`, `TarjetaProductoPublico.vue`, `VistaCatalogoPublico.vue` |
| **HU-BUS-01** | Búsqueda de productos (buscador del inicio) | Corrección | `VistaInicioPublica.vue`, `useInicioPublico.ts` |

### Descripción del Alcance de la Versión
Hallazgos de la auditoría de flujos de filtros con datos locales:

1. **La tarjeta ignoraba los filtros de presentación y color (F-1).** Con "Galón", las tarjetas mostraban el precio del cuarto (Anticorrosivo Gris Mate $27.200 en vez de $84.900). Con el color "Nogal", la compra rápida agregaba otro color (Natural, Wengué, Cedro o Roble). Ahora la tarjeta y la compra rápida eligen la variante que cumple **todos** los filtros activos: color, presentación y precio, extendiendo la regla de la v0.4.9.2. Si ninguna variante los cumple a la vez (la búsqueda de M02 puede devolver un producto que cumple cada filtro con una variante distinta, hallazgo B-1), se sueltan primero el precio y luego la presentación, de modo que se muestra la variante más cercana a lo filtrado.
2. **El buscador del inicio "no funcionaba".** Solo buscaba al pulsar Enter o la lupa (el catálogo busca mientras se escribe), y los resultados reemplazaban en silencio a los 10 "Productos destacados", con el mismo título, sin indicar cuántos había ni dejar ver el resto ("azul": 10 de 29). Además, al borrar el término no volvían los destacados. Ahora buscar desde el inicio **lleva al catálogo con el término aplicado** (`/catalogo?q=azul`), que busca mientras se escribe, muestra el contador y permite filtrar y paginar. Los destacados del inicio no cambian.
3. **Orden del código:** el comentario de `muestrasCoincidentes` había quedado separado de su función en la v0.4.9.0; se reubicó.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS APLICADAS

- **Variante mostrada con filtros:** la más barata entre las que cumplen color, presentación y precio filtrados (priorizando las que tienen existencias). Prioridad al no poder cumplirlos todos: color, después presentación, después precio. Pendiente de documentar (analista).
- **Buscador del inicio:** término normalizado (recortado, máximo 120 caracteres); vacío abre el catálogo completo.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

| Verificación | Método | Resultado |
| :--- | :--- | :---: |
| Filtro Galón: la tarjeta muestra precio de galón y la compra rápida agrega el galón | Prueba nueva y Docker ($84.900) | ✅ |
| Filtro de color: la compra rápida agrega ese color | Prueba nueva | ✅ |
| Color + precio sin variante común: se respeta el color | Prueba nueva | ✅ |
| Buscar desde el inicio abre `/catalogo?q=…`; vacío abre el catálogo completo | Pruebas nuevas | ✅ |
| `/catalogo?q=azul` muestra "Mostrando 1–29 de 29" | Docker | ✅ |

**Pruebas:** suite frontend completa 159/159. ESLint de M01 sin errores ni advertencias. `vue-tsc` solo con los 2 errores previos de M05. Compilación correcta.

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

- **M02 (búsqueda), hallazgo B-1:** "Galón + hasta $30.000" devuelve productos que no tienen ningún galón de ≤ $30.000, porque cada condición se cumple con una variante distinta. M01 lo atenúa mostrando la variante más cercana, pero la corrección real es que M02 exija las condiciones sobre la misma variante.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo | Ruta | Descripción |
| :---: | :--- | :--- |
| **[MOD]** | `frontend/src/modules/m01-catalogo/services/publicas/seleccion-variante.ts` | `FiltrosVariante` (precio, presentaciones, colores) con prioridad. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/components/publicas/TarjetaProductoPublico.vue` | Prop `filtrosVariante`. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/views/publicas/VistaCatalogoPublico.vue` | `filtrosVarianteActivos` para la tarjeta y la compra rápida. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/views/publicas/VistaInicioPublica.vue` | El buscador navega al catálogo. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/composables/publicas/useInicioPublico.ts` | Se retira la búsqueda que reemplazaba a los destacados. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/tests/publicas/filtro-precio.test.ts`, `validacion-entradas.test.ts`, `carrusel-productos.test.ts` | 6 casos nuevos o actualizados. |
