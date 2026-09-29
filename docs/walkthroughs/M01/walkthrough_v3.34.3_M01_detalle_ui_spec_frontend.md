# Walkthrough de Implementación — v3.34.3

## 1. Metadatos

- **Versión:** v3.34.3.
- **Módulo:** M01 — Catálogo de Productos.
- **Historia:** HU-CAT-06 — Consulta pública del catálogo.
- **Fecha:** 2026-09-12.
- **Capa:** Frontend.

## 2. Alcance

Se alineó la ficha pública con la sección 4.4 de la UI Spec: layout de dos columnas sobre una tarjeta blanca, galería con ambiente, título y precio jerárquicos, descripción colapsable, swatches circulares, presentaciones seleccionables, acceso a calculadora, stepper de cantidad, compra en verde y aclaración sobre la representación de colores.

## 3. Reglas aplicadas

- Al elegir un color se conserva la variante seleccionada y, cuando existe, se activa la imagen pública asociada al mismo `id_color`.
- La carta completa sigue disponible desde el selector de color.
- Los controles interactivos tienen al menos 44 px, foco visible, hover y estado presionado.
- La descripción expone `aria-expanded` y conserva el contenido accesible.
- Los colores de interfaz usan exclusivamente tokens oficiales.
- No se tocaron backend, zona global ni módulos de otros equipos.

## 4. Criterios verificados

- CA-CAT-06-01: ficha accesible sin autenticación.
- CA-CAT-06-02: color y presentación seleccionan una variante y actualizan el precio.
- CA-CAT-06-03: se conserva el estado de producto no disponible.
- UI Spec 4.4: dos columnas, galería, descripción colapsable, swatches, presentaciones, calculadora, cantidad, compra, disponibilidad y nota referencial.
- Responsive: tarjeta apilada antes del breakpoint `lg` y controles táctiles sin desbordamiento.

## 5. Dependencias externas

La visualización exacta de tonalidades requiere que el endpoint público entregue la muestra derivada del color. Mientras no exista, las muestras usan tokens ilustrativos y la ficha informa que pueden variar según la pantalla. Las imágenes de ambiente reales por color dependen de HU-CAT-07; las locales actúan como respaldo. La compra depende de M07.

## 6. Archivos

- `frontend/src/modules/m01-dashboardcatalogo/views/VistaDetalleProductoPublico.vue`
- `docs/CHANGELOG.md`
- `docs/walkthroughs/M01/walkthrough_v3.34.3_M01_detalle_ui_spec_frontend.md`

## 7. Validación

- `npm run build`: exitoso.
- `npm run lint`: cero errores y cero advertencias.
- Revisión visual en `/productos/1`: ambiente, descripción, dos swatches reales, presentación, precio y nota renderizados correctamente.
