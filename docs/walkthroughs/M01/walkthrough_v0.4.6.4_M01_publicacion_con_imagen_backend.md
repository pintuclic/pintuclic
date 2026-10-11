# Walkthrough de implementación

## 1. Metadatos
- Versión: v0.4.6.4.
- Módulo y capa: M01 backend.
- Fecha: 09/10/2026.
- Responsable: Codex.
- Estado: corrección implementada y validada en su alcance; cierre global frontend condicionado al lint compartido.

## 2. Historias y alcance
HU-CAT-02. Correcciones específicas del informe de la tarjeta, sin declarar completadas todas las HUs del módulo.

La publicación exige una variante activa y una imagen; responde 422 PRODUCTO_SIN_IMAGEN sin cambiar publicado si falta imagen.

## 3. Reglas y políticas
El diagrama Gestión de productos de M01 define exactamente la condición implementada. Se conserva el permiso catalogo.editar en servidor.

HU-ADM-03: se conservan los permisos de publicación y sesiones/token visitante del carrito. HU-SEG-06: solo metadatos de catálogo públicos, sin credenciales ni datos personales nuevos. HU-CUE-08: no aplica a estas correcciones; no se modificaron cuentas. Sin nuevas notificaciones de M18.

## 4. Verificación
CA-CAT-02-06: rechazo sin variante o imagen y aceptación con ambas condiciones. Suite M01: 125 comprobaciones superadas.

Backend: npm run lint y npx tsc --noEmit superados con cero errores y advertencias. Frontend: build completo y ESLint de M01/M05 con --max-warnings 0 superados. El lint global falla en core/components/forms/SearchableSelect.vue (MouseEvent y Node no definidos para ESLint) y core/components/overlays/Tooltip.vue (props sin uso), archivos no modificados. El usuario solicitó expresamente el commit local tras conocer esta limitación; se registra la excepción y no se hace push.

## 5. Dependencias externas
M01 requiere imágenes reales cargadas por el gestor, variantes y PostgreSQL. M05 requiere el nuevo contrato backend desplegado junto al frontend; su precio y disponibilidad siguen provenientes del catálogo. M20 conserva las guardas de sesión y M17 el permiso de publicación. Se habilita una compra rápida con identidad y precio coherentes. Las pruebas locales no despliegan los contenedores que sirven localhost.

## 6. Archivos
- `backend/src/modules/m01-catalogo/services/productos.service.ts`.
- `backend/src/modules/m01-catalogo/__tests__/m01.test.ts`.

Archivos compartidos de entrega: .github/version.txt y docs/CHANGELOG.md, con autorización explícita del usuario. No se modificaron core ni otros módulos. Los cambios previos en la ficha pública se conservaron.

## 7. Estado de entrega
Corrección validada en el alcance descrito. La fotografía del kit continúa pendiente de datos reales; no se inventó ni sembró una imagen. Los productos ya publicados sin imagen no se modificaron en la base. No se certifica cierre integral del módulo ni ejecución de esta versión en los contenedores existentes.
