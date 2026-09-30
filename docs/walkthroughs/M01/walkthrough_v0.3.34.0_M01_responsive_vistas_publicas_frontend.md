# Walkthrough de implementación — responsive de vistas públicas

## Metadatos

- Módulo: M01 Catálogo, frontend.
- Versión base de trabajo: v0.3.34.0, sin publicación.
- Alcance: punto 3 solicitado para vistas públicas de M01.

## Revisión y correcciones

- Se revisaron Home, Catálogo, Detalle, Calculadora y Paleta de colores a 320, 390, 420, 768 y 1280 px en el navegador local.
- La barra fija de filtros y ordenación del catálogo se sitúa debajo del encabezado fijo al desplazarse.
- Las tarjetas de productos usan una columna en pantallas de menos de 420 px y recuperan dos o más columnas a partir de ese ancho. Esto evita nombres y botones excesivamente comprimidos en celulares estrechos.
- El valor de área de la calculadora mantiene la cifra y `m²` en una misma línea; el texto explicativo puede ajustarse en el espacio restante.
- En el catálogo móvil, Filtros y Relevancia comparten fila y el contador de productos se alinea a la derecha. El carrito de las tarjetas tiene un área táctil de 44 × 44 px y el botón de detalle mantiene la misma altura en móvil.
- La página general de calculadora ofrece «Anterior» y vuelve a Home o al catálogo, conservando el filtro de subcategoría si existía. Se eliminó un mensaje de depuración al volver del detalle al catálogo.
- La vista de iPhone 16 (393 × 852 px) se comprobó en el navegador local: Filtros, Relevancia y el contador están en una fila; Calculadora muestra «Anterior» y regresa al catálogo.
- El menú móvil y los carruseles horizontales de color conservan sus interacciones y desplazamiento interno.

## Validación y dependencias

- Las cinco rutas públicas y el cálculo consumen los servicios existentes de M01. No se modificaron backend ni SQL.
- Compilación TypeScript/Vite y ESLint del frontend en Docker: aprobados. Cinco pruebas enfocadas de menú, calculadora y rutas: aprobadas.
- Medición de ancho real de documento frente al viewport en 320, 390, 420, 768 y 1280 px; sin desbordamiento horizontal de página.
- La barra del catálogo se midió a 80 px del borde superior al desplazarse, debajo del encabezado de 80 px. El modal de producto abrió dentro del viewport a 320, 390 y 768 px.
- No hubo commit ni push.

## Archivos M01

- `frontend/src/modules/m01-catalogo/views/publicas/VistaInicioPublica.vue`
- `frontend/src/modules/m01-catalogo/views/publicas/VistaCatalogoPublico.vue`
- `frontend/src/modules/m01-catalogo/views/publicas/VistaDetalleProductoPublico.vue`
- `frontend/src/modules/m01-catalogo/views/publicas/VistaPaletaColoresPublica.vue`
- `frontend/src/modules/m01-catalogo/components/publicas/CalculadoraPinturaContenido.vue`
- `frontend/src/modules/m01-catalogo/components/publicas/TarjetaProductoPublico.vue`
- `frontend/src/modules/m01-catalogo/views/publicas/VistaCalculadoraPinturaPublica.vue`
- `frontend/src/modules/m01-catalogo/tests/publicas/calculadora-flujo.test.ts`
