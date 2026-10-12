# WALKTHROUGH DE IMPLEMENTACIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.8.2`
* **Módulo de Origen:** M01 - Catálogo de productos (vistas públicas)
* **Fecha de Entrega:** 12/10/2026
* **Autor / Responsable:** Agente de IA (Claude Code)
* **Estado de la Implementación:** ✅ COMPLETO dentro de M01. La franja de marca queda pendiente de decisión (sección 7).

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título | Estado de Cobertura | Componentes |
| :--- | :--- | :---: | :--- |
| **HU-CAT-07** | Imágenes del producto (CA-CAT-07-03) | Prueba añadida | `VistaDetalleProductoPublico.vue` |
| **HU-CAT-06** | Consulta pública (identidad visual y modales) | Corrección | Vistas y componentes públicos de M01 |

### Descripción del Alcance de la Versión
Parche de identidad corporativa y de comportamiento de los modales, a partir de la auditoría de identidad de M01:

1. **Tipografía de marca:** `font-title` no generaba ningún estilo. El proyecto usa Tailwind 4, que toma los tokens del bloque `@theme` de `style.css`, y ahí solo existen `--font-poppins` y `--font-inter`; `font-title` venía de `tailwind.config.ts`, que Tailwind 4 no carga. Los títulos h1–h6 recibían Poppins por la regla base, pero 8 elementos se veían en Inter, entre ellos **el precio de la tarjeta y el de la ficha**. Se reemplazaron los 42 usos en M01 por `font-poppins`, comprobado en el CSS servido: `.font-poppins{font-family:var(--font-poppins)}`.
2. **Errores en `danger`:** los mensajes de error (rango de precio y medidas de la calculadora), los bordes de campo inválido, el aviso de fallo de filtros y los iconos de estado de error usaban `highlight` (amarillo, reservado para "Patrocinado" y estrellas), que además apenas se lee sobre blanco. Ahora usan `danger` / `danger-subtle`. El amarillo se mantiene donde es decorativo o informativo.
3. **Cierre de modales:** la calculadora, la carta de colores y el menú de categorías se cerraban al seleccionar texto arrastrando y soltar fuera de la ventana: el navegador entrega ese clic al fondo. La nueva función `useCierrePorFondo` solo cierra si el clic empieza **y** termina en el fondo.
4. **Radios oficiales:** se sustituyeron 17 radios genéricos por tokens: `rounded-modal` en modales, `rounded-card` en tarjetas y contenedores, y `rounded-button` en botones y etiquetas. Cambio visible: las tarjetas de producto pasan de 16 px a 8 px, dentro del rango de la guía (6–10 px).
5. **Legibilidad:** los textos de 8–9 px de la carta de colores suben a 10 px; los avisos de color sin muestra dejan de ir en amarillo y ya no muestran el término técnico "HEX" ("Sin muestra" / "Muestra no disponible"). El gris escrito a mano de la paleta (`#CCCCCC`) pasa al token `neutral-light`.
6. **Cobertura de envíos:** el inicio decía "Envíos rápidos a toda Colombia", mientras la paleta y el encabezado del core dicen "Caquetá". Con la cobertura confirmada (Caquetá por ahora), el inicio dice "A todo el Caquetá".

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS APLICADAS

- 🎨 **Directiva 8 (paleta y sistema de diseño):** solo tokens oficiales en colores, tipografía y radios, con su rol semántico (`danger` para errores, `highlight` para destacados).
- **Cobertura de envíos:** Caquetá, según confirmación del equipo (12/10/2026). Pendiente de documentar en la especificación.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

| ID Criterio | Criterio | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CAT-07-03** | Al seleccionar un color con imagen asociada, se muestra esa imagen | Prueba nueva sobre la imagen principal de la ficha | ✅ |
| Identidad (Guía UI) | El precio usa Poppins | Prueba nueva y CSS servido | ✅ |
| Identidad (Guía de colores) | Los errores usan `danger` | Prueba nueva | ✅ |
| Usabilidad | Seleccionar texto y soltar fuera no cierra los modales | Pruebas nuevas (función, menú y carta) | ✅ |

**Pruebas:** `tests/publicas/identidad-y-modales.test.ts` (6 casos). Suite M01 frontend: 109/109. ESLint de M01 sin errores ni advertencias. `vue-tsc` solo reporta los 2 errores previos de M05. Comprobado en Docker que `font-poppins`, `rounded-modal`, `rounded-card`, `rounded-b-card`, `text-danger`, `border-danger` y `bg-danger-subtle` existen en el CSS servido.

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

- **Core (`style.css`):** M01 usa `font-poppins` porque `@theme` no define `--font-title`. Otros módulos (M04, M08, M17 y core) siguen usando `font-title` y tienen el mismo problema; se reporta al core.
- **Core (`Modal.vue`):** el login, el registro y el resto de modales del core tienen el mismo error de cierre al seleccionar texto; se reporta al core. `useCierrePorFondo` puede servir de referencia.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ Verificación de límites de módulo: solo se modificaron archivos de M01.

| Tipo | Ruta | Descripción |
| :---: | :--- | :--- |
| **[NUEVO]** | `frontend/src/modules/m01-catalogo/composables/publicas/useCierrePorFondo.ts` | Cierre por fondo solo con clic iniciado y terminado en el fondo. |
| **[NUEVO]** | `frontend/src/modules/m01-catalogo/tests/publicas/identidad-y-modales.test.ts` | 6 casos: CA-CAT-07-03, tipografía del precio, cierre de modales y errores en `danger`. |
| **[MOD]** | `components/publicas/CalculadoraPinturaPublica.vue`, `CartaColoresProductoPublica.vue`, `MenuCategoriasPublico.vue` | Cierre por fondo corregido y `rounded-modal`; textos y avisos de la carta. |
| **[MOD]** | `components/publicas/CalculadoraPinturaContenido.vue` | Errores en `danger`, tipografía y radio. |
| **[MOD]** | `components/publicas/TarjetaProductoPublico.vue`, `VisualizadorAmbientesPublico.vue`, `MenuNavegacionMovil.vue` | Tipografía y radios oficiales. |
| **[MOD]** | `views/publicas/VistaCatalogoPublico.vue`, `VistaDetalleProductoPublico.vue`, `VistaInicioPublica.vue`, `VistaPaletaColoresPublica.vue` | Tipografía, errores en `danger`, radios; cobertura "Caquetá" en el inicio; token `neutral-light` en la paleta. |
| **[MOD]** | Vistas y componentes del panel de M01 con `font-title` | Reemplazo por `font-poppins` (sin cambio visual en los títulos). |

---

## 7. PENDIENTES

- **Franja de marca:** el menú de categorías y la carta de colores mantienen su degradado con colores escritos a mano, a la espera de la decisión de crear un token oficial en el core.
- **Textos de asesoría:** los botones y promesas de asesoría siguen sin cambios, a la espera de decisión.
