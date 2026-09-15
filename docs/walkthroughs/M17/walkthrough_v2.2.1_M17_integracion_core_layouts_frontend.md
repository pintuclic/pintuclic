# Integración local de M17 en la arquitectura de core

## 1. Metadatos

- Versión: **2.2.1**, PATCH de integración y refactorización sin cambios de contratos HTTP.
- Fecha: 2026-09-14. Responsable: Codex.
- Origen: frontend local de M17 versión 1.8.8, en `pintuclic-m17/frontend`.
- Base: `pintuclic/pintuclic`, rama `feature/core-frontend-layouts`, commit `81504daee6c13e5101b435667c6d15c811621dfc`.
- Rama de trabajo exclusivamente local: `codex/m17-core-frontend-layouts`.
- Alcance autorizado: recuperar y reorganizar el frontend, incluyendo los componentes globales y su conexión al layout. No se realizó push.

## 2. Alcance funcional

Se integraron las vistas existentes de dashboard, empleados, clientes, permisos, configuración y perfil. Es una reorganización del trabajo recuperado, no una certificación nueva de cumplimiento de todas las HU de M17.

La base de la rama utiliza Vue 3 Composition API, TypeScript, Vite, Tailwind v4, Vue Router, Pinia y validaciones Zod. Se respeta la separación entre `core` transversal y `modules/m17-permisos` de negocio, así como los subdirectorios semánticos del design system.

Existe una diferencia documental: `infraestructura.md` denomina `core/router` al router, pero el código real de esta rama usa `core/routes`. Se conserva la ruta real para evitar crear un segundo router.

## 3. Reglas y límites preservados

- La instancia Axios sigue siendo la de `core/api/axios.ts`; los servicios M17 conservan sus endpoints y el envío del token configurado por core.
- Las reglas de dependencia de permisos y los nombres/estados de personas permanecen en M17. `core` no importa el módulo M17 para renderizar botones, tablas o badges.
- `EstadoBadge.vue` es específico de M17: traduce estados de negocio a etiquetas y tonos del `Badge` global.
- El estado utiliza Pinia. La fachada `useM17()` mantiene refs para no perder la reactividad al desestructurar `isAdmin` y `canAttend`.
- Los DTOs de empleado, perfil, estado y parámetros se separaron de las vistas. Correo, teléfono y contraseña reutilizan esquemas globales.
- Los tokens `table-*` de la copia antigua no existen en la rama de destino: fueron sustituidos por los tokens oficiales `neutral-*`, `corporate`, `subaction`, etc.
- Se conservaron las variantes y el valor por defecto del botón global utilizado por M04. Se añadieron variantes explícitas para las acciones de M17.
- El modal global conserva `v-model`, tamaños y franja de marca, y admite título y formato amplio. Usa `dialog` nativo para conservar foco y poder apilarse sobre el drawer.
- No se modificó código de otros módulos de negocio ni el backend. Los cambios compartidos se limitan a la integración solicitada.

## 4. Verificación

- `npm run build`: TypeScript y compilación de producción.
- `npm run lint -- --max-warnings=0`: ESLint sin errores ni advertencias.
- `npm run test:m17`: 8 pruebas, todas correctas. Cubren alta, duplicidad, permisos, baja lógica, rutas con prefijo `/admin`, DTOs y aislamiento/reactividad de Pinia, además del manejo de 401 y 403.
- Navegador local en modo demo: dashboard, listado vacío de empleados, apertura y envío del formulario con datos ficticios, aparición de la fila y actualización de contadores, navegación a clientes y apertura de ficha lateral.
- Los datos ficticios del navegador solo permanecen en memoria y desaparecen al recargar. No se enviaron al backend.
- No se ejecutó una validación integral contra backend, base de datos o SMTP. El control de acceso efectivo en servidor continúa siendo responsabilidad de M17/M20 backend.

## 5. Dependencias e instrucciones locales

El frontend integrado se ejecuta desde **`frontend/` en la raíz del proyecto**, no desde la copia de respaldo `pintuclic-m17/frontend`.

```powershell
cd C:\xampp\htdocs\pintucli-frontend\frontend
npm ci
# Solo para demostración local en esta terminal:
$env:VITE_M17_DEMO = 'true'
npm run dev -- --host 127.0.0.1 --port 5178
```

Abrir `http://127.0.0.1:5178/admin`. Para trabajar con backend real, retirar `VITE_M17_DEMO` de la terminal, configurar `VITE_API_URL` y disponer de una sesión válida. No se agregó una variable de demo a los archivos compartidos ni al build de producción.

M04 sigue controlando el inicio de sesión existente. La cuenta y la sesión que M17 consulta provienen de `/seguridad/sesion`. Las pantallas de aprobación de empresas y catálogo que el layout de esta rama enlaza, pero que no estaban implementadas, siguen siendo dependencias de los equipos correspondientes.

## 6. Mapa de archivos

Todas las rutas de la tabla son relativas a `frontend/src`.

| Elemento recuperado | Ubicación integrada | Criterio |
| --- | --- | --- |
| Botón M17 | `core/components/buttons/Button.vue` | Reutiliza y amplía el botón global; no mantiene una copia local |
| Tablas de PeopleList y Dashboard | `core/components/data-display/Table.vue` | Columnas y slots tipados; las acciones de negocio se pasan desde cada vista |
| Presentación de badges | `core/components/data-display/Badge.vue` | Tonos y punto visual genéricos |
| Estados de empleado/cliente | `modules/m17-permisos/components/EstadoBadge.vue` | Traducción propia del dominio |
| Iconos | `core/components/data-display/Icon.vue` | Catálogo visual común; reutiliza la librería de la rama |
| Modal | `core/components/overlays/Modal.vue` | Se amplía el componente existente |
| Ficha lateral | `core/components/overlays/Drawer.vue` | Contenedor genérico; recibe contenido por slot |
| Encabezado de página | `core/components/layout/PageHeader.vue` | Título, descripción y acciones reutilizables |
| Paginación | `core/components/navigation/Paginacion.vue` | Total, tamaño y página por props/v-model |
| Mensajes temporales | `core/components/feedback/Toast.vue` | Presentación genérica; el mensaje pertenece al estado de M17 |
| Fuentes y licencias | `assets/fonts/` | Recursos visuales globales, importados en `style.css` |
| Navegación y contenedor administrativo | `core/layouts/LayoutAdmin.vue` | Se usa el layout de la rama, con destinos M17 integrados |
| Carga y autorización visual M17 | `modules/m17-permisos/M17Shell.vue` | Sin duplicar sidebar, header, footer ni router |
| Rutas M17 | `modules/m17-permisos/m17.routes.ts` | Rutas hijas lazy bajo `/admin`, conectadas en `core/routes/index.ts` |
| Vistas de negocio | `modules/m17-permisos/views/` | Dashboard, PeopleList, EmployeeForm, PersonDetail, Permissions, Configuration, Profile y NotFound |
| Cambio de estado | `modules/m17-permisos/components/StatusModal.vue` | Orquestación de negocio que consume Modal y Button globales |
| Estado | `modules/m17-permisos/store/useM17.ts` | Pinia con fachada compatible |
| Servicios y reglas de permisos | `modules/m17-permisos/services/` | Lógica propia de M17 y consumo de Axios global |
| Contratos | `modules/m17-permisos/interfaces/index.ts` | Solo interfaces y tipos, sin runtime |
| Validaciones | `modules/m17-permisos/dtos/` | Empleado, perfil, cambio de estado y parámetros |
| Demo y generación desde seed | `modules/m17-permisos/assets/seed-preview.json`, `scripts/generate-preview.py` | Se conserva la herramienta y el snapshot público del trabajo local |
| Pruebas | `modules/m17-permisos/tests/` | Pruebas originales e integración con la arquitectura |

Los imports compartidos pasan por `core/components/index.ts`. El logo del shell antiguo no se duplica: se usa el del layout de la rama. Los archivos originales, herramientas y entregables históricos permanecen en sus carpetas de respaldo.

Rutas principales: `/admin`, `/admin/empleados`, `/admin/clientes`, `/admin/permisos`, `/admin/configuracion`, `/admin/administrador` y `/admin/perfil`. Se mantienen los aliases `/admin/usuarios` y `/admin/roles` previstos por la navegación inicial de la rama.

## 7. Respaldo y recuperación

- Stash conservado: `stash@{0}`, mensaje `respaldo-local-antes-core-frontend-layouts-2026-09-14`.
- Identificador estable: `730eace6b14406fdf2b7205da6e61ad7347ca569`.
- Se guardaron los archivos nuevos con `--include-untracked` y luego se recuperaron con `stash apply`, sin eliminar el stash.
- El estado anterior de los archivos ya versionados sigue en la rama local `main`, commit `f0074f8`.
- La copia original `pintuclic-m17/` y los entregables históricos siguen en disco. Los directorios ignorados como `node_modules` y el repositorio anidado `.tmp-pintuclic-review` no se incluyen en el stash y se conservaron en su ubicación.
- Para inspeccionar el respaldo: `git stash show --include-untracked --stat 730eace6b14406fdf2b7205da6e61ad7347ca569`.
- No volver a aplicar el stash sobre estos mismos archivos ya recuperados; para restaurarlo usar una copia limpia del estado anterior.

La integración queda como cambios locales revisables. No se hizo commit ni push y se conservó la configuración del remoto original.
