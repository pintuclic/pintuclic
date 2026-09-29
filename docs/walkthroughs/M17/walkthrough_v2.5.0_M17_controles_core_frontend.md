# Walkthrough de implementación — Controles Core y limpieza M17

## 1. Metadatos

- Versión: v2.5.0; incremento MINOR por nuevos controles compartidos funcionales.
- Fecha: 15/09/2026. Responsable: Codex, implementador frontend.
- Módulo: M17 Administración, empleados y permisos. Rama: `codex/m17-core-frontend-layouts`.
- Estado: implementación frontend completa para el alcance de controles; no representa cierre productivo integral de las HUs.
- El usuario autorizó completar las primitivas compartidas después del reporte de que Select y Textarea estaban vacíos e Input requería adaptación.

## 2. Historias y alcance

| Historias | Integración cubierta |
| --- | --- |
| HU-ADM-01 | Alta/edición usa Input oficial conservando requeridos, longitudes, autocomplete y campos inmutables. |
| HU-ADM-02 / HU-ADM-03 | Select, búsqueda Input y Checkbox oficiales mantienen selección controlada, permisos reservados y confirmación de retirada de dependientes. |
| HU-ADM-04 | Filtros de personas y motivos de cambio de estado usan controles oficiales. |
| HU-ADM-05 / HU-ADM-06 | Campos numéricos de configuración y contraseñas de perfil usan Input; se mantienen DTOs y contratos HTTP. |

La ruta M17 continúa dentro de los hijos de `/admin`, montada por LayoutAdmin. No se modifica el enrutador ni se crea un layout local. Se elimina el helper duplicado de presentación de estados, ahora resuelto por Badge del Core. StatusModal permanece como componente de negocio que recibe persona/tipo, valida el DTO y llama a la API mediante el Modal oficial, conforme al diagrama de clasificación compartido por el usuario.

## 3. Reglas y políticas

- La concesión individual, las consultas dependientes y los permisos reservados conservan la lógica y diagrama HU-ADM-02 inspeccionado previamente. Checkbox restaura el estado del padre cuando este solicita confirmar antes de retirar un permiso.
- HU-ADM-03: las validaciones visuales no sustituyen la autorización efectiva de la API.
- HU-CUE-08: las entradas conservan sus DTOs y contratos de error; no se cambian restricciones de unicidad en PostgreSQL.
- HU-SEG-06: no se agregan datos de cuentas, mocks en runtime ni nuevas persistencias de credenciales. Los formularios continúan enviando únicamente sus payloads existentes.
- Los DTOs siguen en `m17-permisos/dtos`; no se crean esquemas inline en vistas ni runtime en interfaces.
- Tokens oficiales para superficies, foco y errores. Inter en controles; Poppins en títulos M17 y título del Modal compartido.
- Input con `name` conserva integración VeeValidate de M04; sin `name` usa v-model independiente. Los atributos HTML llegan al input/textarea/select real.

## 4. Verificación de aceptación

| Criterio | Evidencia |
| --- | --- |
| Primitivas compartidas funcionales y consumo oficial en M17 | Select, Textarea y Checkbox completados; M17 sin inputs/selects/textareas/casillas nativas duplicadas. |
| Valores iniciales de M04 conservados | Prueba SSR de Input con useForm y correo inicial; prueba de edición y resetForm en navegador. |
| Valores y tipos se sincronizan | Navegador: texto editado, número 7, selección numérica 2, motivo y casilla reflejados en estado observable. |
| Restablecimiento y bloqueo | Navegador: controles reflejan cambios externos; fieldset bloquea casilla; maxlength y autocomplete comprobados sobre el input. |
| Contraseñas y accesibilidad | Etiquetas con id, errores accesibles y botón que cambia visibilidad de password a text en navegador. |
| Retirada de permiso con confirmación | Navegador: click conserva casilla activa mientras la confirmación está pendiente; confirmar la retirada la desmarca. |
| Reglas y contratos M17 preservados | Ocho pruebas existentes de rutas, DTOs, Pinia, permisos y adaptador HTTP. |
| Compilación y lint | `npm run lint -- --max-warnings=0`, `npx tsc --noEmit`, `npm run build` con vue-tsc. |

`npm run test:core` agrega una prueba de regresión con múltiples comprobaciones SSR para Input/VeeValidate, atributos, errores, iconos, Select, Textarea y Checkbox. Las páginas de prueba del navegador se eliminaron; no contienen datos de negocio ni quedan en la entrega. No se probaron operaciones contra PostgreSQL ni envío SMTP en esta versión.

## 5. Dependencias externas

Core aporta estilos, controles, fuentes y layouts. M04 requiere compatibilidad VeeValidate en sus formularios de autenticación. M17/M20 backend siguen a cargo de personal, unicidad, sesión y autorización efectiva; M18 conserva el envío transaccional. Los controles habilitan formularios reutilizables para otros módulos sin incluir reglas de negocio.

No se modifica backend, SQL, M04 ni `docs/reviews/`. Las limitaciones preexistentes de configuración, auditoría y servicios productivos permanecen fuera de esta entrega.

## 6. Archivos

| Acción | Archivos |
| --- | --- |
| Core modificado con autorización | `components/forms/Input.vue`, `Select.vue`, `Textarea.vue`, `Checkbox.vue`; `components/overlays/Modal.vue` (fuente del título). |
| Core creado | `components/forms/README.md`, `components/forms/tests/controls.test.mjs`. |
| M17 modificado | `M17Shell.vue`, `components/StatusModal.vue`, todas las vistas y `README.md`. |
| M17 eliminado | `services/estado-presentacion.ts`, reemplazado por presentación del Badge oficial. |
| Versionado | `frontend/package.json`, `frontend/package-lock.json`, `docs/CHANGELOG.md` y este walkthrough. |

## 7. Confirmación

Versión v2.5.0 sincronizada y walkthrough registrado. La entrega aplica el diagrama de clasificación: primitivas genéricas en Core y lógica de negocio en M17. El envío remoto permanece pendiente de la autorización específica requerida por la revisión automática del push anterior.
