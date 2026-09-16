# Walkthrough de implementación — M17 y Core Frontend

## 1. Metadatos de la implementación

- Versión: v2.4.1, incremento PATCH sobre v2.4.0 recibido del Core.
- Módulo: M17 Administración, empleados y permisos; capa frontend.
- Fecha: 15/09/2026. Responsable: Codex, implementador.
- Alcance: integración del frontend; la operación productiva depende de la API y sesión real.
- Rama: `codex/m17-core-frontend-layouts`.
- Origen integrado: `equipo/feature/core-frontend-layouts`, commits `4dc87f3` y `bcc42e2`.
- El usuario autorizó expresamente incorporar los commits compartidos y resolver los conflictos el 15/09/2026.

## 2. Historias de usuario cubiertas

| Historias | Alcance de esta entrega |
| --- | --- |
| HU-ADM-01 y HU-ADM-04 | Listados, estados, navegación, alta y ficha de personas conservan los contratos HTTP existentes. |
| HU-ADM-02 y HU-ADM-03 | Se conservan permisos individuales y dependencias de consulta/operación; las pruebas existentes verifican esas reglas. |
| HU-ADM-05 y HU-ADM-06 | Se mantienen rutas de configuración y perfil; no se declara cierre integral de estas HUs. |

Se incorporó el Core oficial y se resolvieron los conflictos con la integración local previa. M17 sigue usando un contenedor de sesión sin duplicar el layout administrativo. El dashboard consume PageHeader y componentes de acción oficiales, y las vistas importan Badge directamente del barril compartido. El Drawer usa su contrato `modelValue` y la ficha se monta únicamente con un identificador válido.

## 3. Reglas de negocio y políticas de seguridad

- Se inspeccionó visualmente el diagrama HU-ADM-02: permisos individuales, concesión de consulta dependiente y retirada de operaciones al revocar consulta. Esta entrega conserva la lógica existente.
- HU-ADM-03: las guardas visuales complementan la autorización real de la API; no se reemplazan permisos de servidor por validaciones del cliente.
- HU-CUE-08: se mantienen DTOs y errores de la API para unicidad; no se modifica la persistencia ni se afirma haber probado restricciones PostgreSQL en esta entrega.
- HU-SEG-06: no se agregan datos sensibles, credenciales persistidas nuevas ni respuestas de servidor. Las pruebas usan el adaptador HTTP existente.
- Los datos de prueba permanecen en SQL central. El helper de estados contiene exclusivamente presentación de los estados de dominio, sin catálogos o cuentas de prueba.
- Tokens oficiales para Badge y estados de error OTP. Button usa Inter y PageHeader usa Poppins.
- La resolución conserva foco móvil, dialog nativo y bloqueo de scroll de Modal. Drawer incluye Escape, ciclo de foco, restauración de foco/scroll y movimiento reducido.

## 4. Criterios de aceptación verificados

| Criterio de integración | Validación |
| --- | --- |
| Rutas M17 dentro de los hijos de `/admin` con LayoutAdmin único | Inspección del enrutador y pruebas M17 de rutas, aliases y redirección de perfil. |
| Componentes compartidos importados desde `@/core/components` | Inspección de las vistas; eliminación de EstadoBadge local. |
| Navegación de Button e IconButton renderiza enlaces reales e iconos string | Render SSR con Vue Router y comprobación de `<a href>` y SVG. |
| Estados de permisos y contratos HTTP conservados | Ocho pruebas M17 correctas. |
| Cero errores TypeScript y cero advertencias ESLint | `npx tsc --noEmit`, `npm run build` con vue-tsc y `npm run lint -- --max-warnings=0`. |

La comprobación SSR de Table verifica caption y estado vacío. No se realizó una prueba de navegador autenticado ni pruebas contra PostgreSQL/SMTP; no se declara aceptación productiva completa de las HUs.

## 5. Dependencias externas e integración

- Core: layouts, tokens, fuentes, tablas, paginación y overlays oficiales.
- M04/M20: sesión válida y credenciales gestionadas por sus servicios; el OTP recibido de M04 necesitó un callback ref tipado para compilar.
- Backend M17: personal, permisos, configuración, validación de unicidad y autorización efectiva. M18 sigue encargado de correo transaccional.
- PostgreSQL y seed central: fuente de datos del sistema. Las vistas habilitan la administración de personal y accesos para los módulos operativos.
- Se recibieron los cambios M04 y de configuración global tal como forman parte de la rama Core; la intervención adicional en M04 se limita al callback ref OTP, su tipo de código y token de error.

## 6. Archivos creados y modificados

| Acción | Archivos |
| --- | --- |
| Modificados M17 | `views/Dashboard.vue`, `views/PeopleList.vue`, `views/PersonDetail.vue`, `README.md`. |
| Creado M17 | `services/estado-presentacion.ts`. |
| Eliminado M17 | `components/EstadoBadge.vue`, reemplazado por Badge oficial. |
| Resolución Core autorizada | `core/routes/index.ts`, barril de componentes, Button, IconButton, Badge, Table, PageHeader, Drawer, Modal, Paginacion, Icon, tipos de tabla y LayoutAdmin. |
| Corrección M04 autorizada | `components/PasoRecuperarOTP.vue`. |
| Versionado | `frontend/package.json`, `frontend/package-lock.json`, `docs/CHANGELOG.md` y este walkthrough. |

El merge incorpora además los archivos originales de los dos commits Core, incluidos LayoutHome, FooterPrincipal, fuentes/tokens, componentes de navegación/formularios y recuperación de contraseña M04. El detalle completo queda en el diff del commit de integración. No se modificaron backend, SQL ni `docs/reviews/`.

## 7. Confirmación de versionado

Versión sincronizada entre paquete, lockfile, changelog y walkthrough. La entrega integra el Core y mantiene los flujos de M17 sin modificar contratos backend. El cierre funcional productivo requiere los servicios descritos en la sección de dependencias.
