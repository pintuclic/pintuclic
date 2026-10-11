# Walkthrough de implementación

## 1. Metadatos
- Versión: v0.4.6.4.
- Módulo y capa: M05 frontend.
- Fecha: 09/10/2026.
- Responsable: Codex.
- Estado: corrección implementada y validada en su alcance; cierre global frontend condicionado al lint compartido.

## 2. Historias y alcance
HU-CAR-01 / HU-CAR-02. Correcciones específicas del informe de la tarjeta, sin declarar completadas todas las HUs del módulo.

El store transforma los metadatos reales de la respuesta, también al recargar o fusionar. Se eliminó cart-product-fallback.ts y el tipo CartProductFallback. CartItem presenta un icono neutral cuando no hay imagen o falla la carga, sin sustituir el artículo por uno de prueba.

## 3. Reglas y políticas
Tokens oficiales del diseño en el icono neutral. Datos de catálogo retirados del mapeo runtime. Los datos de preview ajenos al flujo auditado no forman parte de este cambio.

HU-ADM-03: se conservan los permisos de publicación y sesiones/token visitante del carrito. HU-SEG-06: solo metadatos de catálogo públicos, sin credenciales ni datos personales nuevos. HU-CUE-08: no aplica a estas correcciones; no se modificaron cuentas. Sin nuevas notificaciones de M18.

## 4. Verificación
Regresión: la variante 4 conserva nombre Kit Renovación Hogar Premium al agregar y recargar; no se inventa imagen; se usa la URL real y se maneja su error. 27 pruebas frontend M01/M05 superadas.

Backend: npm run lint y npx tsc --noEmit superados con cero errores y advertencias. Frontend: build completo y ESLint de M01/M05 con --max-warnings 0 superados. El lint global falla en core/components/forms/SearchableSelect.vue (MouseEvent y Node no definidos para ESLint) y core/components/overlays/Tooltip.vue (props sin uso), archivos no modificados. El usuario solicitó expresamente el commit local tras conocer esta limitación; se registra la excepción y no se hace push.

## 5. Dependencias externas
M01 requiere imágenes reales cargadas por el gestor, variantes y PostgreSQL. M05 requiere el nuevo contrato backend desplegado junto al frontend; su precio y disponibilidad siguen provenientes del catálogo. M20 conserva las guardas de sesión y M17 el permiso de publicación. Se habilita una compra rápida con identidad y precio coherentes. Las pruebas locales no despliegan los contenedores que sirven localhost.

## 6. Archivos
- `frontend/src/modules/m05-carrito-compras/store/cart.store.ts`.
- `frontend/src/modules/m05-carrito-compras/interfaces/cart.interface.ts`.
- `frontend/src/modules/m05-carrito-compras/components/CartItem.vue`.
- `frontend/src/modules/m05-carrito-compras/services/cart-product-fallback.ts (eliminado)`.
- `frontend/src/modules/m05-carrito-compras/tests/identidad-carrito.test.ts`.

Archivos compartidos de entrega: .github/version.txt y docs/CHANGELOG.md, con autorización explícita del usuario. No se modificaron core ni otros módulos. Los cambios previos en la ficha pública se conservaron.

## 7. Estado de entrega
Corrección validada en el alcance descrito. La fotografía del kit continúa pendiente de datos reales; no se inventó ni sembró una imagen. Los productos ya publicados sin imagen no se modificaron en la base. No se certifica cierre integral del módulo ni ejecución de esta versión en los contenedores existentes.
