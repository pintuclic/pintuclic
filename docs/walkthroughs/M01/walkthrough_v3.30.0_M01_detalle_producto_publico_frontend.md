# Walkthrough de Implementación — v3.30.0

## 1. Identificación

- **Módulo:** M01 — Catálogo de Productos.
- **Historia:** HU-CAT-06 — Vistas Públicas de la Tienda.
- **Entrega:** Detalle público de producto.
- **Incremento:** MINOR.

## 2. Resultado

Se implementó la ruta pública `/productos/:productoId` con galería, ficha descriptiva, selección de variantes, precio vigente, control de cantidad y productos complementarios. Las tarjetas del Home y catálogo enlazan directamente a esta ficha.

## 3. Integración

- `GET /api/catalogo/publico/productos/:id` carga la ficha activa y publicada.
- `GET /api/catalogo/publico/productos/:id/complementarios` carga recomendaciones priorizadas por backend.
- La variante seleccionada determina el precio mostrado.
- Un identificador inactivo, no publicado o inexistente muestra “Producto no disponible”.

## 4. Criterios validados

- Acceso sin autenticación.
- Navegación catálogo → producto y entre recomendaciones.
- Precio, presentación, color y existencia provienen de variantes públicas activas.
- La sección de complementarios se oculta cuando el backend devuelve una lista vacía.
- Carrito se mantiene desacoplado y señalizado como dependencia de M07.

## 5. Dependencias

- HU-CAT-07 debe proveer imágenes públicas definitivas; hasta entonces se utilizan recursos visuales de respaldo existentes en M01.
- La compra requiere M07 Carrito.
- La calculadora se integra en la siguiente entrega de HU-CAT-06.

## 6. Archivos

- `frontend/src/modules/m01-dashboardcatalogo/services/catalogo-publico.service.ts`
- `frontend/src/modules/m01-dashboardcatalogo/composables/useDetalleProductoPublico.ts`
- `frontend/src/modules/m01-dashboardcatalogo/views/VistaDetalleProductoPublico.vue`
- `frontend/src/modules/m01-dashboardcatalogo/dashboard-catalogo.routes.ts`
- `docs/CHANGELOG.md`
