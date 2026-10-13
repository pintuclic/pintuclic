# WALKTHROUGH DE IMPLEMENTACIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.9.6`
* **Módulo de Origen:** M01 - Catálogo de productos (vistas públicas)
* **Fecha de Entrega:** 13/10/2026
* **Autor / Responsable:** Agente de IA (Claude Code)
* **Estado de la Implementación:** ✅ COMPLETO (PINT-001 y PINT-005 pendientes de la regla de venta sin existencias)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título | Estado de Cobertura | Componentes |
| :--- | :--- | :---: | :--- |
| **HU-CAT-10** | Atributos técnicos: calculadora de pintura | Corrección | `CalculadoraPinturaContenido.vue`, `CalculadoraPinturaPublica.vue`, `VistaDetalleProductoPublico.vue` |
| **HU-CAT-06** | Consulta pública (avisos de la ficha y de la paleta) | Corrección | `VistaDetalleProductoPublico.vue`, `VistaPaletaColoresPublica.vue` |

### Descripción del Alcance de la Versión
Hallazgos de la auditoría "agregar al carrito desde la calculadora" (producto 95):

1. **PINT-002, aviso antes de agregar:** la calculadora prometía "Se agregarán 3 unidades" aunque la presentación tuviera menos existencias, y el límite se descubría después de agregar. Ahora la ficha le pasa al modal su tope de unidades (`maximoUnidades`, el mismo que usa al agregar). El modal dice lo que realmente se agregará ("Se agregará 1 unidad de Cuarto de Galón.") y, si la recomendación supera las existencias, muestra el aviso "Solo hay N … disponibles de esa presentación; la recomendación es de M. Puedes elegir otra presentación en la ficha."
2. **PINT-003, aviso tapado por el carrito:** al agregar, M05 abre el carrito con un fondo oscuro de capa `z-50`, que tapaba el aviso de la ficha (`z-40`): se veía atenuado y su «X» no respondía. Los avisos de la ficha y de la Paleta de Colores pasan a `z-[60]`.
3. **PINT-004, concordancia:** "solo hay 1 disponibles; se agregaron 1" pasa a "solo hay 1 disponible; se agregó 1".
4. **D-4:** el walkthrough v0.4.9.5 citaba HU-CAT-07 (Imágenes); se corrige a HU-CAT-10.

**No incluido (pendiente de confirmar si se puede pedir sin existencias):** PINT-001 (una presentación con 0 existencias se trata como "1 disponible") y PINT-005 (el tope no descuenta lo que ya está en el carrito).

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS APLICADAS

- El modal y la ficha usan el mismo tope (`cantidadMaxima`), así que lo anunciado coincide con lo agregado.
- Solo se usan tokens del Design System (`highlight`, `neutral-*`).

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

| Verificación | Método | Resultado |
| :--- | :--- | :---: |
| Con 3 (o 1) en existencia y una recomendación de 5: "Se agregarán 3" / "Se agregará 1" y el aviso | Pruebas nuevas | ✅ |
| Con existencias suficientes no hay aviso | Prueba nueva | ✅ |
| Producto 95: aviso en el modal, mensaje en singular y visible sobre el carrito | Clic real en Docker | ✅ |

**Pruebas:** suite frontend completa 166/166. ESLint de M01 sin errores ni advertencias. `vue-tsc` solo con los 2 errores previos de M05.

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

- **Analista (D-1):** definir la "regla de venta sin stock" citada en RF-CAT-13-02. De ella dependen PINT-001 y PINT-005.
- **M05 (PINT-006):** el API del carrito acepta variantes con 0 existencias y cantidades acumuladas por encima de las existencias, mientras que su botón «+» bloquea por encima de las existencias.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo | Ruta | Descripción |
| :---: | :--- | :--- |
| **[MOD]** | `frontend/src/modules/m01-catalogo/components/publicas/CalculadoraPinturaContenido.vue` | Prop `maximoUnidades`, `unidadesAAgregar` y aviso de existencias. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/components/publicas/CalculadoraPinturaPublica.vue` | Reenvía `maximoUnidades`. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/views/publicas/VistaDetalleProductoPublico.vue` | Pasa el tope al modal; aviso en singular y en `z-[60]`. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/views/publicas/VistaPaletaColoresPublica.vue` | Aviso en `z-[60]`. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/tests/publicas/calculadora-flujo.test.ts` | 3 casos nuevos. |
| **[MOD]** | `docs/walkthroughs/M01/walkthrough_v0.4.9.5_M01_distribucion_modal_calculadora_frontend.md` | HU corregida (D-4). |
