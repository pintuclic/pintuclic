# Walkthrough de Implementación — v3.34.1

## 1. Metadatos de la implementación

- **Versión:** v3.34.1.
- **Módulo:** M01 — Catálogo de Productos.
- **Fecha:** 2026-09-12.
- **Capa:** Frontend.

## 2. Historia cubierta

- **HU-CAT-06 — Consulta pública del catálogo.**
- Ajuste visual del Home y de la tarjeta compartida de producto según `Pintu_Clic_UI_Oficial.docx.md`, versión 1.0 estable.

## 3. Reglas aplicadas

- Tarjetas con radio de 8 px, superficie blanca, sombra base y elevación al pasar el cursor.
- Nombre de producto en Poppins semibold, descripción en Inter y precio como segundo elemento de mayor jerarquía.
- Botón «Ver producto» outline azul y botón de carrito verde con hover oscuro.
- Controles con foco visible, estado presionado y objetivo táctil mínimo de 44 px.
- Separación de tarjetas de 24 px horizontal y 32 px vertical.
- Colores limitados a tokens semánticos oficiales.

## 4. Criterios verificados

- Las tarjetas mantienen dimensiones, espaciado y comportamiento uniforme en Home, catálogo, recomendaciones y complementarios.
- Las imágenes usan `object-contain` y no se recortan.
- Nombre y descripción se limitan a dos líneas.
- El grid conserva cinco columnas en Home de escritorio, tres en tablet y dos en móvil.
- Build y lint confirman que no cambió el contrato de props ni eventos del componente.

## 5. Dependencias externas

La API pública entrega `id_marca` pero no el nombre comercial de la marca. La línea visual reservada para marca se mantiene neutral hasta que el contrato público incluya ese dato. Las acciones de carrito continúan dependiendo de M07.

## 6. Archivos modificados

- `frontend/src/modules/m01-dashboardcatalogo/components/publicas/TarjetaProductoPublico.vue`
- `frontend/src/modules/m01-dashboardcatalogo/views/VistaInicioPublica.vue`
- `docs/CHANGELOG.md`
- `docs/walkthroughs/M01/walkthrough_v3.34.1_M01_home_ui_spec_frontend.md`
