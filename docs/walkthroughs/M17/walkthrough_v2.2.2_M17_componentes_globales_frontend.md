# Componentes globales del frontend y consumo desde M17

## 1. Metadatos

- Versión: **2.2.2** (PATCH). Fecha: 2026-09-14. Responsable: Codex.
- Módulo de origen: M17 Administración, empleados y permisos.
- Alcance: clasificación y reutilización de UI existente. No se añade ninguna HU ni se alteran endpoints.

## 2. Inventario y ubicación

La zona global definida por `frontend/infraestructura.md` es `frontend/src/core/components/`. El barril `index.ts` exporta sus piezas para que M17 importe desde `@/core/components`.

| Categoría global | Archivos usados por M17 | Responsabilidad |
| --- | --- | --- |
| `buttons/` | `Button.vue`, `IconButton.vue` | Aspecto, estados y accesibilidad de acciones ordinarias y acciones solo con icono |
| `data-display/` | `Table.vue`, `Badge.vue`, `Icon.vue` | Tabla con columnas/slots, indicador visual e iconografía |
| `overlays/` | `Modal.vue`, `Drawer.vue` | Diálogo y panel lateral genéricos |
| `navigation/` | `Paginacion.vue` | Páginas y controles de navegación del listado |
| `feedback/` | `Toast.vue` | Mensaje temporal reutilizable |
| `layout/` | `PageHeader.vue` | Encabezado de página con zona de acciones |

Los estilos de color de estos componentes emplean tokens semánticos de `frontend/src/core/theme/colors.ts`. `IconButton` estaba en core como plantilla vacía: ahora presenta botones o enlaces accesibles con icono, nombre y tonos de la paleta. Las acciones de editar, ver, permisos y cambio de estado en `PeopleList.vue` consumen esa única implementación. El botón de alta rápida de `Dashboard.vue` consume `Button.vue`.

Permanecen en `frontend/src/modules/m17-permisos/components/` únicamente `EstadoBadge.vue` y `StatusModal.vue`: el primero traduce estados de cuentas M17 a tonos del `Badge` global y el segundo orquesta la operación de cambio de estado con `Modal` y `Button`. Las vistas, DTOs, servicios, store y rutas de negocio también permanecen en el módulo.

## 3. Criterios comprobados y políticas

- La lista de personas conserva los enlaces de edición y permisos y los botones de ficha de cliente y cambio de estado, con etiquetas accesibles.
- No se duplican `Button`, `Table`, `Badge`, `Modal`, `Drawer` ni iconografía genérica dentro del módulo integrado.
- La operación de alta rápida conserva la apertura del modal de empleado.
- Las políticas HU-CUE-08, HU-ADM-03 y HU-SEG-06 no cambian por este ajuste visual. Su cumplimiento efectivo en servidor depende del backend M17/M20 y no se certifica con estas pruebas de frontend.
- M18 y el servicio de sesión M20 siguen siendo dependencias externas para el funcionamiento completo en producción. Los demás módulos de frontend pueden consumir el mismo barril global.

## 4. Validación

- `npm run build`: compilación TypeScript y bundle de producción correctos.
- `npm run lint -- --max-warnings=0`: cero errores y advertencias.
- `npm run test:m17`: ocho pruebas correctas.

## 5. Archivos de esta revisión

- `frontend/src/core/components/buttons/IconButton.vue`: componente global completado.
- `frontend/src/modules/m17-permisos/views/PeopleList.vue`: acciones de icono migradas a core.
- `frontend/src/modules/m17-permisos/views/Dashboard.vue`: alta rápida usa el botón global.
- `frontend/src/modules/m17-permisos/README.md`: ubicación de la UI compartida.
- `frontend/package.json`, `frontend/package-lock.json`: versión 2.2.2.
- `docs/CHANGELOG.md` y este walkthrough: registro de la revisión.

Los cambios siguen en la rama local `codex/m17-core-frontend-layouts` sin commit ni push, conforme al acuerdo de trabajo local.
