# WALKTHROUGH DE IMPLEMENTACIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.9.1`
* **Módulo de Origen:** M01 - Catálogo de productos (calculadora de pintura)
* **Fecha de Entrega:** 12/10/2026
* **Autor / Responsable:** Agente de IA (Claude Code)
* **Estado de la Implementación:** ✅ COMPLETO

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título | Estado de Cobertura | Componentes |
| :--- | :--- | :---: | :--- |
| **HU-CAT-10** | Atributos técnicos (rendimiento y calculadora) | Corrección | `calculo-pintura.ts`, `CalculadoraPinturaContenido.vue` |

### Descripción del Alcance de la Versión
La auditoría de la calculadora con datos locales detectó que la cantidad que se agregaba al carrito casi duplicaba la necesaria cuando la presentación elegida no era el galón. El error se introdujo en la v0.4.8.1, al conectar la calculadora con el carrito (F02).

1. **Conversión desde la cantidad exacta:** se convertían a la presentación elegida los galones **ya redondeados**. Ejemplo de la captura: barniz de 45 m²/gal, 25 m² a 2 manos = 1,11 galones (4,2 L). Se redondeaba a 2 galones y luego se convertía a cuartos: **9 cuartos (8,5 L) en vez de 5**. Una pared de 5 m² recomendaba 5 cuartos cuando basta 1. Ahora se calculan los galones exactos (`galonesNecesarios`) y la conversión parte de ellos.
2. **Volumen redondeado del cuarto:** la base guarda el cuarto como 0,946 L (real 0,94625 L), así que 1 galón daba 4,001 cuartos y se redondeaba a 5. La conversión tolera un margen del 0,1 %: 1 galón son 4 cuartos y 5 galones son 20.
3. **Resultado coherente con lo que se agrega:** antes mostraba "2 galones" y agregaba "9 cuartos". Ahora el resultado se expresa en la presentación elegida (p. ej. "5 unidades de Cuarto de Galón"), con los litros necesarios como referencia ("para 2 manos · aprox. 4,2 litros de pintura"). Sin presentación, o si es el galón, se muestra en galones.
4. **Rendimiento rotulado:** la calculadora decía "45.0 m²/gal" sin aclarar que es por mano, mientras la ficha muestra la superficie a 2 manos. Ahora dice "m² por galón y mano".

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS APLICADAS

- **Galones necesarios** = área × 2 manos ÷ rendimiento (m² por galón y mano, promedio entre el mínimo y el máximo del producto; 35 m²/gal sin producto). Estas reglas siguen sin estar documentadas en la especificación (pendiente del analista, punto 2.1).
- **Unidades a comprar** = litros necesarios ÷ volumen de la presentación, redondeado hacia arriba con un margen del 0,1 % para los volúmenes guardados con pocos decimales.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

| Verificación | Método | Resultado |
| :--- | :--- | :---: |
| Caso de la captura: 25 m², 45 m²/gal, cuartos → 5 (antes 9); litros → 5 (antes 8); galones → 2 | Pruebas nuevas | ✅ |
| 1 galón = 4 cuartos y 5 galones = 20 cuartos (antes 5 y 21) | Prueba corregida | ✅ |
| El resultado se muestra en la presentación elegida, con los litros de referencia | Pruebas nuevas | ✅ |
| Con la presentación galón, el resultado sigue en galones | Prueba nueva | ✅ |
| Calculadora general en Docker: 25 m² con 35 m²/gal → "2 galones · aprox. 5,4 litros" | Edge sin interfaz | ✅ |

**Pruebas:** suite frontend completa 146/146. ESLint de M01 sin errores ni advertencias. `vue-tsc` solo con los 2 errores previos de M05. Compilación de producción correcta.

**No verificado:** el modal desde la ficha en un navegador interactivo; cubierto por las pruebas del componente.

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

- **M05 (carrito):** recibe la cantidad corregida, sin cambios de contrato.
- **Datos de presentaciones:** convendría guardar el cuarto de galón con su volumen exacto (0,94625 L); el margen del 0,1 % lo compensa mientras tanto.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo | Ruta | Descripción |
| :---: | :--- | :--- |
| **[MOD]** | `frontend/src/modules/m01-catalogo/services/publicas/calculo-pintura.ts` | `galonesNecesarios`, `esGalon` y conversión con margen. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/components/publicas/CalculadoraPinturaContenido.vue` | Conversión desde galones exactos, resultado en la presentación, litros de referencia y rendimiento por mano. |
| **[MOD]** | `frontend/src/modules/m01-catalogo/tests/publicas/correcciones-vistas-publicas.test.ts` | Prueba corregida y 3 casos nuevos. |
