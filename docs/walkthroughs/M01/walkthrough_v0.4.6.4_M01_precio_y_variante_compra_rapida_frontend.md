# Walkthrough de implementación

## 1. Metadatos
- Versión: v0.4.6.4.
- Módulo y capa: M01 frontend.
- Fecha: 09/10/2026.
- Responsable: Codex.
- Estado: corrección implementada y validada en su alcance; cierre global frontend condicionado al lint compartido.

## 2. Historias y alcance
HU-CAT-06. Correcciones específicas del informe de la tarjeta, sin declarar completadas todas las HUs del módulo.

La tarjeta y la compra rápida comparten la variante con menor precio finito entre las disponibles. Si ninguna tiene existencia, mantienen la política anterior de permitir agregar, escogiendo la de menor precio. Se respeta el color seleccionado en el abanico. Se aplica a inicio, catálogo, paleta y complementarios.

## 3. Reglas y políticas
Es una corrección de coherencia de datos, sin nuevas rutas, estados ni reglas de stock. Se incluye la retirada de referencias de galería a imágenes de demostración inexistentes para que el commit compile. Se conservan fuera del commit los ajustes visuales previos de esa ficha.

HU-ADM-03: se conservan los permisos de publicación y sesiones/token visitante del carrito. HU-SEG-06: solo metadatos de catálogo públicos, sin credenciales ni datos personales nuevos. HU-CUE-08: no aplica a estas correcciones; no se modificaron cuentas. Sin nuevas notificaciones de M18.

## 4. Verificación
Regresión: precio mostrado y variante seleccionada coinciden aun con otra variante más barata agotada; color del abanico; lista vacía y precios no finitos. 27 pruebas frontend M01/M05 superadas.

Backend: npm run lint y npx tsc --noEmit superados con cero errores y advertencias. Frontend: build completo y ESLint de M01/M05 con --max-warnings 0 superados. El lint global falla en core/components/forms/SearchableSelect.vue (MouseEvent y Node no definidos para ESLint) y core/components/overlays/Tooltip.vue (props sin uso), archivos no modificados. El usuario solicitó expresamente el commit local tras conocer esta limitación; se registra la excepción y no se hace push.

## 5. Dependencias externas
M01 requiere imágenes reales cargadas por el gestor, variantes y PostgreSQL. M05 requiere el nuevo contrato backend desplegado junto al frontend; su precio y disponibilidad siguen provenientes del catálogo. M20 conserva las guardas de sesión y M17 el permiso de publicación. Se habilita una compra rápida con identidad y precio coherentes. Las pruebas locales no despliegan los contenedores que sirven localhost.

## 6. Archivos
- `frontend/src/modules/m01-catalogo/services/publicas/seleccion-variante.ts`.
- `frontend/src/modules/m01-catalogo/components/publicas/TarjetaProductoPublico.vue`.
- `frontend/src/modules/m01-catalogo/views/publicas/VistaInicioPublica.vue`.
- `frontend/src/modules/m01-catalogo/views/publicas/VistaCatalogoPublico.vue`.
- `frontend/src/modules/m01-catalogo/views/publicas/VistaPaletaColoresPublica.vue`.
- `frontend/src/modules/m01-catalogo/views/publicas/VistaDetalleProductoPublico.vue`.
- `frontend/src/modules/m01-catalogo/tests/publicas/compra-rapida.test.ts`.

Archivos compartidos de entrega: .github/version.txt y docs/CHANGELOG.md, con autorización explícita del usuario. No se modificaron core ni otros módulos. Los cambios previos en la ficha pública se conservaron.

## 7. Estado de entrega
Corrección validada en el alcance descrito. La fotografía del kit continúa pendiente de datos reales; no se inventó ni sembró una imagen. Los productos ya publicados sin imagen no se modificaron en la base. No se certifica cierre integral del módulo ni ejecución de esta versión en los contenedores existentes.
