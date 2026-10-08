# WALKTHROUGH DE IMPLEMENTACIÓN

## 1. Metadatos
- Versión: v0.4.4.2 (patch).
- Módulo: M01 — Catálogo, frontend.
- Fecha: 06/10/2026.
- Responsable: Codex.
- Estado: limpieza implementada; entrega Git pendiente del lint global.

## 2. Historias y alcance
Corrección de la presentación de HU-CAT-06 y HU-CAT-07, sin declarar cumplimiento integral de esas historias. Se eliminan las imágenes y logos de maqueta, sus mapas de IDs, el descuento fijo del 15 %, el precio anterior artificial y la muestra de color ficticia. Las tarjetas, la ficha y la calculadora usan imágenes de la API y un estado vacío cuando no existen o fallan.

Los fondos decorativos, los ambientes del simulador y los controles de la calculadora son recursos funcionales de presentación, no registros de productos de prueba. Las pruebas automatizadas conservan sus entradas aisladas, que no forman parte de los datos de la aplicación. No se altera la base de datos ni el seed centralizado.

Se corrigen errores previos de TypeScript en M01: Vue entrega arrays desenvueltos a toggleFiltro, que ahora acepta esos arrays; se eliminan cálculos y tipos sin uso de la antigua vista de filtros.

## 3. Reglas y políticas
- Origen de datos: API de M01 y búsquedas/facetas de M02. Sin sustitución por productos locales.
- HU-CAT-07: se conserva selección de imagen principal y asociación por color en la ficha.
- Diagrama inspeccionado: `docs/assets/diagrams/M01/Gestion de productos.drawio.png`. El frontend no simula imágenes que puedan aparentar satisfacer los requisitos de publicación. El diagrama específico HU-CAT-07 enlazado en la especificación no existe en este checkout.
- HU-CUE-08: no aplica a esta limpieza; no se modifican cuentas.
- HU-ADM-03: se conserva el transporte y los controles existentes; no se modifican permisos ni endpoints.
- HU-SEG-06: no se agregan datos sensibles ni detalles internos en errores.
- M18: no aplica; no hay notificaciones nuevas.

## 4. Validación
- CA-CAT-07-02: prueba de componente verifica la imagen marcada como principal.
- Sin ficha o ante error de imagen: se verifica ausencia de imagen de demostración y recuperación al cambiar los datos.
- Promociones: se verifica ausencia del descuento fijo y precio tachado artificial.
- Se mantiene la lógica de selección de color para CA-CAT-07-03; no se revalida la gestión backend de imágenes ni miniaturas.
- `npm run build`: aprobado; Vue TypeScript y bundle de producción sin errores.
- `npx eslint src/modules/m01-catalogo --max-warnings=0`: aprobado, cero errores y advertencias.
- `npm test -- src/modules/m01-catalogo`: 22/22 pruebas, cinco archivos aprobados.
- `git diff --check`: aprobado.
- `npm run lint -- --max-warnings=0`: bloqueado por seis errores externos de M05 detallados abajo.

## 5. Dependencias
Requiere backend M01 disponible con imágenes asociadas a los productos y datos persistidos en PostgreSQL. Los filtros dependen de M02. La ausencia de imagen se comunica en la vista; no se inventa un sustituto. M06 deberá proporcionar un contrato real de promociones antes de mostrar descuentos o precios anteriores.

## 6. Archivos
Modificados exclusivamente dentro de M01:
- `components/publicas/TarjetaProductoPublico.vue`.
- `components/publicas/CalculadoraPinturaContenido.vue`.
- `views/publicas/VistaDetalleProductoPublico.vue`.
- `views/publicas/VistaInicioPublica.vue`.
- `views/publicas/VistaCatalogoPublico.vue`.
- `composables/publicas/useCatalogoPublico.ts`.
- Nuevo: `tests/publicas/datos-catalogo.test.ts`.
- Eliminado: `assets/imagenes-catalogo.ts` y los 18 SVG de `assets/productos/` y `assets/marcas/`.

Metadatos obligatorios de entrega: `.github/version.txt`, `docs/CHANGELOG.md` y este walkthrough. Ningún archivo de código de otros módulos ni de `docs/reviews/` fue modificado.

## 7. Cierre y bloqueo
El lint global detecta seis errores `no-undef` para `URL` en `frontend/src/modules/m05-carrito-compras/preview/vite.config.mjs` (líneas 6, 7, 8, 13, 18 y 19). Corregirlo exige intervenir M05, fuera del módulo asignado: no se hace ese cambio, conforme a la directiva de aislamiento de AGENTS.md. No se realiza commit/push mientras falle el control global obligatorio. La rama actual es `feature/m01-dashboard-catalogo`.
