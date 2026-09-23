# Walkthrough de Implementación — v3.34.2

## 1. Metadatos

- **Versión:** v3.34.2.
- **Módulo:** M01 — Catálogo de Productos.
- **Historia:** HU-CAT-06 — Consulta pública del catálogo.
- **Fecha:** 2026-09-12.
- **Capa:** Frontend.

## 2. Alcance implementado

Se ajustó `/catalogo` a la estructura aprobada en la UI Spec v1.0: breadcrumb, H1 y subtítulo; buscador y accesos a herramientas; toolbar sticky con rango de resultados, orden y selector grid/lista; sidebar de filtros en escritorio; drawer de filtros en móvil; grilla responsive; paginación; estados de carga, error y vacío; y bloque «Completa tu proyecto».

La tarjeta compartida admite ahora una representación horizontal para la vista de lista sin alterar su contrato por defecto en Home y recomendaciones.

## 3. Reglas y políticas

- La API mantiene la propiedad de búsqueda, subcategoría y paginación.
- El orden y el filtro «Con existencia» afectan exclusivamente la página ya recibida; no se presentan como filtros globales del catálogo.
- Marca y rango de precio se documentan en la interfaz como dependencias pendientes, en lugar de fabricar opciones.
- Todos los controles tienen estados hover, active, disabled o focus según corresponda y un objetivo táctil mínimo de 44 px.
- Se usan únicamente tokens oficiales, Poppins/Inter, radios oficiales y el grid 24/32 px.
- No se modificaron backend, componentes globales ni módulos ajenos.

## 4. Criterios verificados

- CA-CAT-06-01: acceso público, categorías, productos y variantes sin autenticación.
- CA-CAT-06-04: la navegación usa categorías devueltas por el endpoint público.
- CA-CAT-06-05: la consulta continúa solicitando páginas de ocho productos.
- Responsive: cuatro columnas en escritorio, tres en tablet, dos en móvil y filtros ocultos en drawer bajo `lg`.
- Vacío: icono, explicación y acción para limpiar filtros.
- Imágenes: `object-contain`, sin deformación ni recorte.

## 5. Dependencias externas

Los filtros globales por marca, precio y orden requieren ampliar el endpoint público de productos con esos parámetros y devolver el nombre comercial de la marca. Hasta entonces, el frontend no mezcla filtros locales con el total global del servidor. Carrito y asesoría dependen de M07 y del flujo público de asesoría respectivamente.

## 6. Archivos

- `frontend/src/modules/m01-dashboardcatalogo/views/VistaCatalogoPublico.vue`
- `frontend/src/modules/m01-dashboardcatalogo/components/publicas/TarjetaProductoPublico.vue`
- `docs/CHANGELOG.md`
- `docs/walkthroughs/M01/walkthrough_v3.34.2_M01_catalogo_ui_spec_frontend.md`

## 7. Validación

- `npm run build`: exitoso.
- `npm run lint`: cero errores y cero advertencias.
- Verificación visual en `/catalogo`: estructura, tres productos reales, toolbar, sidebar, complementos y footer renderizados.
