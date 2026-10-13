# WALKTHROUGH DE IMPLEMENTACIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.9.2`
* **Módulo de Origen:** M01 - Catálogo de productos (vistas públicas, filtro de precio)
* **Fecha de Entrega:** 12/10/2026
* **Autor / Responsable:** Agente de IA (Claude Code)
* **Estado de la Implementación:** ✅ COMPLETO

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título | Estado de Cobertura | Componentes |
| :--- | :--- | :---: | :--- |
| **HU-BUS-02** | Filtros del catálogo (rango de precio) | Corrección | `seleccion-variante.ts`, `TarjetaProductoPublico.vue`, `VistaCatalogoPublico.vue`, `catalogo-publico.dto.ts` |

### Descripción del Alcance de la Versión
La auditoría con datos locales detectó que el filtro de precio parecía no funcionar:

1. **Precio de la tarjeta fuera del rango:** con el filtro $26.000–$26.800 aparecía "Tinte para Madera Brillante" a **$23.300**. El filtro funcionaba bien: el backend devuelve el producto porque alguna de sus variantes cumple el rango (el litro a $26.200). Pero la tarjeta mostraba la variante más barata con existencias (el cuarto a $23.300) sin considerar el filtro, y la compra rápida agregaba esa misma variante. Ahora, con un rango activo, la tarjeta y la compra rápida eligen la variante más barata **dentro** del rango; en el ejemplo, $26.200. Sin filtro, el comportamiento no cambia.
2. **Punto de color de la tarjeta:** muestra el color de la variante cuyo precio se ve. Antes mostraba el de la primera variante del producto, que podía ser de otro color.
3. **Máximo de 0:** el panel aceptaba un máximo de $0 y lo convertía en silencio en "sin límite". Ahora muestra "El precio máximo debe ser mayor que 0." y no aplica el filtro. El mínimo en 0 sigue significando "desde $0" y el campo vacío, "sin límite".

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS APLICADAS

- **Rango de precio:** mínimo ≥ 0 (0 o vacío = sin límite inferior), máximo > 0 (vacío = sin límite superior), mínimo ≤ máximo (CA-BUS-02-06).
- **Precio mostrado con filtro:** el de la variante más barata dentro del rango, priorizando las que tienen existencias. Si ninguna cumple el rango (por ejemplo, por un cambio de precio entre la búsqueda y la ficha), se usa la regla normal en lugar de dejar la tarjeta sin precio.
- **Pendiente de documentar:** RF-BUS-02-03 no define qué precio muestra la tarjeta cuando el filtro solo cumple con algunas variantes; se propone al analista esta regla.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

| Verificación | Método | Resultado |
| :--- | :--- | :---: |
| Con 26.000–26.800, el Tinte muestra $26.200 y la compra rápida agrega el litro | Prueba nueva (catálogo montado) y Docker | ✅ |
| Sin filtro, la tarjeta sigue mostrando la variante más barata | Prueba nueva | ✅ |
| Máximo 0 → error junto al campo y sin consultar | Pruebas nuevas (esquema y panel) | ✅ |
| CA-BUS-02-06: mínimo mayor que máximo → error | Pruebas existentes | ✅ |

**Pruebas:** `tests/publicas/filtro-precio.test.ts` (7 casos). Suite frontend completa 153/153. ESLint de M01 sin errores ni advertencias. `vue-tsc` solo con los 2 errores previos de M05. Compilación correcta. En Docker: Corona Pro Vinilo Brillante $26.800 y Tinte para Madera Brillante $26.200 con el filtro aplicado.

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

- **M02 (búsqueda):** sin cambios; su regla (el producto entra si alguna variante cumple el rango) se mantiene.
- **M06 (precios):** el filtro y el precio mostrado siguen usando el precio base de la variante, no el precio final con descuentos e IVA (RF-BUS-02-04, pendiente de M06).

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo | Ruta | Descripción |
| :---: | :--- | :--- |
| **[MOD]** | `frontend/src/modules/m01-catalogo/services/publicas/seleccion-variante.ts` | Selección con rango de precio opcional. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/components/publicas/TarjetaProductoPublico.vue` | Prop `rangoPrecio`; precio y punto de color de la misma variante. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/views/publicas/VistaCatalogoPublico.vue` | Pasa el rango activo a la tarjeta y a la compra rápida. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/dtos/publicas/catalogo-publico.dto.ts` | Máximo mayor que 0; mínimo 0 = sin límite. |
| **[NUEVO]** | `frontend/src/modules/m01-catalogo/tests/publicas/filtro-precio.test.ts` | 7 casos. |
