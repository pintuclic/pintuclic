# Walkthrough de implementación — flujo de calculadora pública

## Metadatos

- Módulo: M01 Catálogo, frontend.
- Versión base de trabajo: v0.3.34.0, sin publicación.
- Alcance: punto 2 solicitado para Home, Catálogo y Detalle de producto.

## Flujo implementado

- Home y Catálogo abren la ruta `/calculadora` como página completa. El cálculo general usa el rendimiento de referencia existente de 35 m² por galón y mano, lo identifica como estimación y no presenta un producto elegido automáticamente.
- El resultado general ofrece «Ver productos» y navega al catálogo completo.
- La página general ofrece «Anterior», que regresa a Home o al catálogo de origen y conserva el filtro del catálogo.
- El detalle abre un modal sin cambiar de ruta y pasa el producto seleccionado al cálculo. El botón «Volver al producto» cierra el modal.
- El modal de M01 usa un ancho máximo de 820 px, queda fijo y centrado, y desplaza únicamente su contenido interior. El bloque «Configura tu proyecto» se limita a 500 px en escritorio y la tarjeta del producto a 240 px; ambas se centran dentro del modal. La página general conserva su distribución. Una franja superior de colores oficiales reproduce el detalle visual del modal de inicio de sesión. El encabezado de la estimación ocupa toda la fila superior; «Volver al producto» aparece en una fila separada.
- El acceso antiguo `/productos/:productoId/calculadora` redirige al detalle del mismo producto.
- El botón de cálculo del detalle solo se muestra para productos con rendimiento informado, conforme al diagrama de atributos técnicos HU-CAT-10.

## Validación

- Compilación TypeScript/Vite y ESLint del frontend en Docker: aprobados.
- Pruebas del cálculo general, cálculo con rendimiento de producto y rutas públicas: 3 aprobadas.
- El rendimiento mostrado es aproximado; la estimación general se recalcula con los valores del producto al abrir su modal.
- No hubo cambios de backend, base de datos, otros módulos, commit ni push.

## Dependencias

El cálculo por producto consume la ficha pública de M01 y su rendimiento. La acción de agregar al carrito sigue dependiendo de M07; la página general solo lleva al usuario al catálogo.

## Archivos M01

- `frontend/src/modules/m01-catalogo/publico.routes.ts`
- `frontend/src/modules/m01-catalogo/views/publicas/VistaInicioPublica.vue`
- `frontend/src/modules/m01-catalogo/views/publicas/VistaCatalogoPublico.vue`
- `frontend/src/modules/m01-catalogo/views/publicas/VistaDetalleProductoPublico.vue`
- `frontend/src/modules/m01-catalogo/views/publicas/VistaCalculadoraPinturaPublica.vue`
- `frontend/src/modules/m01-catalogo/components/publicas/CalculadoraPinturaContenido.vue`
- `frontend/src/modules/m01-catalogo/components/publicas/CalculadoraPinturaPublica.vue`
- `frontend/src/modules/m01-catalogo/tests/publicas/calculadora-flujo.test.ts`
- `frontend/src/modules/m01-catalogo/tests/publicas/rutas-publicas.test.ts`
