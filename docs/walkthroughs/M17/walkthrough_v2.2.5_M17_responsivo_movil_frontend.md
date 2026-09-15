# Walkthrough de implementación — Adaptación móvil de administración

## 1. Metadatos

- Versión: **v2.2.5**, incremento PATCH sobre v2.2.4.
- Módulo: M17, frontend y componentes compartidos autorizados.
- Fecha: 14/09/2026. Responsable: Codex.
- Estado: adaptación visual implementada y validada localmente.
- Autorización: el usuario aprobó explícitamente modificar `frontend/src/core/` tras el reporte de alcance compartido.

## 2. Historias y alcance

Mejora de presentación de HU-ADM-01, HU-ADM-02, HU-ADM-04, HU-ADM-05 y HU-ADM-06. No supone el cierre funcional de estas historias ni incorpora endpoints.

- Layout con altura dinámica del viewport, espaciado móvil y menú con botón de cierre, Escape, devolución de foco y cierre al navegar. El contenido de fondo queda inerte mientras está abierto; el menú oculto queda fuera de la navegación por teclado.
- Las tablas de M17 muestran cada registro verticalmente bajo 640 px, con etiquetas y las mismas acciones. La nueva opción `mobileCards` es optativa para otros consumidores. En pantallas mayores se conserva la tabla y su desplazamiento horizontal local.
- Filtros y paginación apilados, acciones táctiles de listado de 44 px, encabezados con acciones a ancho disponible.
- Formularios y confirmaciones con columnas y acciones adaptables; menor relleno en móvil, campos de alta y contraseña a 16 px y modal limitado por la altura dinámica de pantalla.
- Textos largos de cuenta y permisos pueden partirse sin ensanchar el contenido.

## 3. Reglas y políticas

Se consultaron la infraestructura frontend/backend, matriz de trazabilidad, M17, políticas de seguridad y diagramas M17 de empleados, permisos, clientes, configuración y administración. Los cambios conservan los eventos, DTOs, peticiones y condiciones de autorización existentes.

- HU-CUE-08: no se alteraron las validaciones de identidad ni servicios de alta.
- HU-ADM-03: no se cambiaron permisos ni controles del servidor. La interfaz depende de la autorización efectiva del backend.
- HU-SEG-06: no se agregaron campos de datos ni respuestas sensibles.
- M18: continúa siendo dependencia del backend para comunicaciones; no se cambiaron notificaciones transaccionales.
- Se emplearon tokens oficiales para los nuevos estilos. No hubo cambios de base de datos, semillas, rutas ni módulos ajenos a M17; las excepciones de core cuentan con autorización expresa.

## 4. Matriz de verificación

| Escenario de esta corrección | Método | Resultado |
| --- | --- | --- |
| Dashboard, empleados, clientes, alta, permisos, configuración y perfil a 320, 375, 390, 640, 768, 1024 y 1440 px | Chromium local, 49 combinaciones; comparación del ancho desplazable de documento y contenido | Sin desbordamiento horizontal global |
| Menú móvil al navegar y pulsar Escape | Interacción en navegador a 320 px | Cierra y actualiza `aria-expanded` |
| Alta en modal y ficha de cliente | Navegador a 320 px | Contenido ajustado, desplazamiento vertical disponible |
| Crear empleado, abrir permisos, filtrar y guardar un acceso | Interacción real de interfaz en demo a 320 px | Alta y guardado correctos; catálogo poblado sin desbordamiento |
| Recorrido de foco del menú y cambio a escritorio | Tab desde el último control y cambio de viewport | Foco contenido en el menú móvil; contenido habilitado al pasar a escritorio |
| Compilación de producción y tipado Vue | `npm run build` | Correcto |
| TypeScript | `npx tsc --noEmit` | Correcto |
| Calidad estática | `npm run lint -- --max-warnings=0` | 0 errores, 0 advertencias |
| Regresión M17 | `npm run test:m17` | 8/8 correctas |

Las comprobaciones de navegador utilizaron el modo demo existente en un servidor exclusivo de validación. No acreditan integración con correo, base de datos o sesiones reales. No se probó hardware iOS/Android.

## 5. Dependencias e integración

M17 sigue usando core, Vue Router y los servicios existentes; en producción requiere sesiones M20, API M17 y sus dependencias transversales. La paginación y el modal compartidos reciben mejoras de disposición. La presentación vertical de tablas se activa únicamente en los consumidores M17 modificados.

## 6. Archivos modificados

- `frontend/src/core/layouts/LayoutAdmin.vue`.
- `frontend/src/core/components/navigation/Paginacion.vue`.
- `frontend/src/core/components/data-display/Table.vue`.
- `frontend/src/core/components/layout/PageHeader.vue`.
- `frontend/src/core/components/overlays/Modal.vue`.
- `frontend/src/modules/m17-permisos/views/{Dashboard,PeopleList,EmployeeForm,Permissions,PersonDetail,Configuration,Profile}.vue`.
- `frontend/src/modules/m17-permisos/components/StatusModal.vue`.
- `frontend/src/modules/m17-permisos/README.md`.
- `frontend/package.json`, `frontend/package-lock.json`, `docs/CHANGELOG.md` y este walkthrough.

## 7. Cierre y versión

Versión y changelog sincronizados en v2.2.5. Evidencias de trabajo locales en `tmp/mobile-before/` (capturas, verificaciones y copias previas de los archivos intervenidos).

El repositorio ya tenía cambios sin commit y archivos completos de M17 sin seguimiento antes de esta tarea. Es posible preparar commits delimitados para la integración previa y la corrección móvil; el estado pendiente por sí solo no impide versionar. No se realizó commit ni push. Mensaje previsto para la corrección móvil: `fix(M17): [v2.2.5] adaptar panel administrativo a movil`.

## 8. Análisis previo a subida solicitado por el usuario

### Documentación contrastada

- Las tres guías de `docs/00_SISTEMA/02_GUIAS_Y_ESTANDARES/`: commits y push, versionado y walkthroughs, incorporación de módulos.
- Checklist de cierre y plantilla oficial de walkthrough.
- `README.md`, `frontend/README.md`, `frontend/Dockerfile`, `frontend/nginx.conf`, `docker-compose.yml`, `docker-compose.dev.yml`.
- `.github/workflows/deploy.yml` y `.github/workflows/zip-release.yml`.
- Guía central de mocks en `bd/docs/GUIA_MOCKS_Y_DATOS_PRUEBA.md`.
- `DEPLOY.md` de `origin/main`, leído con `git show`, ya que pertenece al historial remoto y no al árbol actual.

### Reglas aplicables

Commits Conventional Commits con versión coincidente con el changelog; PATCH para la corrección visual; walkthrough con sufijo `_frontend`; compilación, lint sin advertencias y pruebas satisfactorias; push exclusivamente a la rama asignada. No se requiere ejecutar manualmente un despliegue ni hacer push a main para entregar una corrección a la rama de trabajo.

La guía de incorporación trata la estructura documental de módulos, no define una plataforma de despliegue. El procedimiento local de despliegue está en README, Docker y los workflows.

### Hallazgos comprobados

1. **Destino de Git sin continuidad con la base de trabajo.** La rama actual es `codex/m17-core-frontend-layouts`, sin upstream. Su base `81504da` procede de `pintuclic/pintuclic:feature/core-frontend-layouts`, según el walkthrough v2.2.1. El origin configurado es `https://github.com/broravelasquez18-wq/pintuclic.git`; una consulta remota devolvió solo `main` en `f0074f8` y ninguna etiqueta. `git merge-base HEAD origin/main` terminó con código 1; el repositorio no es shallow y ambos historiales tienen raíces distintas. La comparación muestra 11 commits exclusivos del main remoto y 95 exclusivos de la rama local. Publicar esta rama también publicaría ese historial completo, no solo el parche móvil.
2. **Dos procedimientos de despliegue distintos.** El `DEPLOY.md` del main remoto describe HTML/CSS/JS con Nginx en Dokploy, sin backend ni base de datos. El árbol local contiene Vue, Express y PostgreSQL. Su workflow Deploy se dispara con push a main o ejecución manual, usa un runner Linux propio, exige un `.env` en el servidor, ejecuta `docker compose up -d --build` y comprueba `/api/health`. No se ha validado cuál de estos entornos debe recibir esta entrega.
3. **Versión automática de release desalineada.** El workflow local Zip Release calcula la versión desde la última etiqueta y suma PATCH; sin etiquetas usa `0.1.0`. No lee package.json ni CHANGELOG. Por ello, con el estado remoto consultado, una ejecución de ese workflow produciría una release 0.1.0 frente a la versión documental 2.2.5. Este workflow es compartido y no se modificó en este análisis.
4. **Contenido pendiente de registrar.** Hay 59 entradas de estado entre frontend, changelog y walkthroughs M17: incluyen la integración anterior, los componentes nuevos, las fuentes con licencias y la adaptación móvil. Registrar solo archivos ya seguidos omitiría dependencias importadas. Registrar todo indiscriminadamente incluiría respaldos, repositorios anidados y temporales. Debe prepararse una selección explícita de código, recursos y documentación de entrega.
5. **Comprobaciones frente a despliegue real.** El frontend ya superó build, TypeScript, ESLint, ocho pruebas y comprobaciones de navegador. El Dockerfile utiliza Node 22 y `npm ci`, mientras la validación local utilizó Node 24 y dependencias instaladas. Docker no está disponible como comando en esta sesión; no se ejecutó build de contenedor ni se acreditó el estado de base de datos, SMTP o sesiones del servidor. Los workflows locales tampoco ejecutan lint ni las pruebas M17 antes de desplegar/publicar.
6. **Demo frente a política de datos centralizados.** El servicio M17 pendiente importa `assets/seed-preview.json`, generado desde el seed SQL, y mantiene operaciones en memoria bajo `VITE_M17_DEMO`. El origen está documentado, pero la guía de mocks exige consumo centralizado y prohíbe fixtures/scripts dispersos. Su inclusión en la entrega debe resolverse conforme a esa política; el Dockerfile no habilita el flag demo y no se creó ningún `.env` para activarlo. No se cambió esta implementación previa durante el análisis.

### Resultado y siguiente paso

No se subieron cambios, no se alteraron remotos ni workflows y no se ejecutó ningún despliegue. Hace falta definir el repositorio y la rama de entrega para esta base: repositorio del equipo del que procede o rama nueva en el origin personal con el historial completo. Después puede prepararse la selección de archivos y los commits correspondientes; la publicación en una rama de trabajo no certifica preparación para producción. Las diferencias de release y de política de mocks quedan reportadas para su resolución antes de desplegar.
