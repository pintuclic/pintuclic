# Consolidación de la vista Mi perfil

## 1. Metadatos

- Versión: **2.2.4** (PATCH). Fecha: 2026-09-14. Responsable: Codex.
- Módulo de origen: M17 Administración y permisos. Capa: frontend.
- Alcance: eliminación de una entrada de navegación y ruta redundantes. No se añade una HU ni se cambian endpoints.

## 2. Comportamiento

El menú de `core/layouts/LayoutAdmin.vue` presenta solo «Mi perfil». La ruta de M17 `/admin/perfil` conserva `Profile.vue`, con consulta de sesión, cambio de contraseña y actividad. La URL histórica `/admin/administrador` redirige a `/admin/perfil` para mantener enlaces guardados sin presentar una segunda vista. Se retiraron el título condicional y la sección informativa que solo se mostraban en la ruta antigua.

## 3. Reglas, criterios y dependencias

- Criterio visual: desaparece «Administrador» del menú y permanece «Mi perfil».
- Criterio de navegación: entrar directamente a `/admin/administrador` termina en `/admin/perfil`.
- La seguridad de la sesión, la autorización en servidor y las políticas HU-CUE-08, HU-ADM-03 y HU-SEG-06 no cambian. Su aplicación efectiva sigue dependiendo del backend M17/M20. El cambio de contraseña conserva su servicio actual y la auditoría depende de que el backend exponga el historial.
- El layout global continúa sirviendo al resto de módulos administrativos; solo se retiró el enlace duplicado de M17.

## 4. Validación

- `npm run build`: TypeScript y bundle correctos.
- `npm run lint -- --max-warnings=0`: cero errores y advertencias.
- `npm run test:m17`: ocho pruebas correctas, incluida la redirección de la URL antigua.
- Navegador local: menú con una sola entrada de perfil, navegación a la vista y redirección comprobadas.

## 5. Archivos modificados

- `frontend/src/core/layouts/LayoutAdmin.vue`: enlace duplicado retirado.
- `frontend/src/modules/m17-permisos/m17.routes.ts`: redirección de la ruta histórica.
- `frontend/src/modules/m17-permisos/views/Profile.vue`: vista única sin ramas por URL.
- `frontend/src/modules/m17-permisos/tests/integration.test.mjs`: regresión de navegación.
- `frontend/src/modules/m17-permisos/README.md`: documentación de la ruta única.
- `frontend/package.json`, `frontend/package-lock.json`: versión 2.2.4.
- `docs/CHANGELOG.md` y este walkthrough: registro de entrega.

Los cambios permanecen locales en `codex/m17-core-frontend-layouts`, sin commit ni push conforme al acuerdo de esta sesión.
