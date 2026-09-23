# Walkthrough de implementación — M17 Optimización de permisos y Drawers

## 1. Metadatos de la implementación

- **Versión:** v2.5.2.
- **Tipo de incremento:** PATCH.
- **Módulo:** M17 — Permisos, Roles y Personal.
- **Capa:** Frontend.
- **Fecha:** 23/09/2026.
- **Responsable:** Agente de desarrollo.
- **Estado:** Implementación frontend y controles automáticos; validación visual con datos pendiente de backend disponible.

## 2. Historias y alcance cubierto

| Historia / política | Cobertura | Componentes |
| --- | --- | --- |
| HU-ADM-03 — Control de acceso por permisos individuales | Se conserva la consulta y asignación por empleado; la caché solo evita solicitudes repetidas y se elimina ante cambios de sesión. | Permissions.vue, useM17.ts |
| Gestión de personal | Crear y editar empleados abre un Drawer desde listados y Dashboard sin perder el contexto. | PeopleList.vue, Dashboard.vue, EmployeeForm.vue |
| Consulta administrativa de clientes | El listado abre una ficha compacta con datos, estado, historial y acceso al detalle completo. | PeopleList.vue, PersonDetail.vue |

La entrega mantiene la estructura existente de carpetas y archivos. No renombra vistas ni introduce una arquitectura paralela.

Se actualizó la base a 542e43f de la rama del equipo antes de entregar. Se conservaron sus mejoras de Core, Alert y SinResultados. El diff propio se limita a M17 y los archivos obligatorios de versión y documentación.

## 3. Reglas de negocio y políticas aplicadas

- Los permisos continúan siendo individuales por empleado y no se transforman en roles fijos.
- La consulta inversa almacena permisos por empleado durante la sesión y limita a cuatro las solicitudes pendientes concurrentes.
- Guardar permisos actualiza únicamente la entrada de caché del empleado afectado.
- La caché caduca a los 60 segundos. Las respuestas anteriores a una invalidación no la repueblan y las lecturas anteriores a un guardado no sobrescriben permisos guardados. La cola compartida limita búsquedas superpuestas.
- El cierre desde X, Escape y fondo del Drawer invoca la protección del formulario; Cancelar y navegación conservan confirmación de descarte.
- Un 401 o 403 elimina la caché para impedir que los datos de una sesión se reutilicen en otra.
- La cuenta administradora continúa protegida contra cambios de permisos y estado.
- El cambio de estado conserva la confirmación y el motivo validado por el DTO de M17.
- Las decisiones de autorización siguen dependiendo del servidor. La caché frontend no concede permisos ni reemplaza la validación de los endpoints.
- No se añadieron datos semilla, mocks de ejecución, DTOs inline ni datos sensibles.

### Políticas transversales

- **HU-ADM-03:** las solicitudes siguen llegando a endpoints protegidos; la optimización solo controla lectura repetida en la interfaz.
- **HU-CUE-08:** el alta conserva el DTO y el contrato HTTP existente; la unicidad continúa siendo responsabilidad del servidor.
- **HU-SEG-06:** las vistas consumen únicamente los campos públicos del contrato Persona.

## 4. Criterios de aceptación

| Criterio | Evidencia | Resultado |
| --- | --- | --- |
| La búsqueda inversa no repite una ráfaga por cada selección. | La prueba de integración realiza dos consultas y confirma que la segunda no incrementa las llamadas HTTP. | Cumplido |
| Las solicitudes faltantes tienen concurrencia limitada. | La prueba registra solicitudes activas y confirma un máximo de cuatro. | Cumplido |
| La caché no sobrevive a una sesión rechazada. | La prueba provoca un 403 y confirma que una lectura posterior vuelve a consultar la API. | Cumplido |
| El listado no se refresca automáticamente cada 60 segundos. | Se eliminó el temporizador de M17Shell.vue; quedan carga inicial, actualización manual y actualizaciones posteriores a mutaciones. | Cumplido |
| La paginación y los filtros se conservan. | Solo los cambios de búsqueda, estado, tipo o clase de persona reinician la página; un cambio de datos únicamente la acota si queda fuera del rango. | Cumplido |
| Crear y editar empleados usa Drawer. | PeopleList.vue controla creación y edición; EmployeeForm.vue comparte el formulario entre Drawer y rutas completas. | Cumplido |
| La ficha de cliente abre sin navegar. | El nombre y la acción Ver asignan el cliente seleccionado; el detalle compacto se renderiza dentro del Drawer. | Cumplido |
| Las rutas profundas siguen disponibles. | Las pruebas de rutas conservan alta, edición y detalle bajo /admin. | Cumplido |
| Diseño y accesibilidad usan Core. | Drawer mantiene foco, Escape y bloqueo de scroll; botones, controles, badge y tokens provienen del Design System. | Cumplido |

## 5. Dependencias externas

### Necesarias para producción

- Backend M17 con endpoints de sesión, empleados, clientes, catálogo y permisos.
- M20 para autenticación, expiración de sesión y autorización en servidor.
- Módulos comerciales para poblar pedidos y cotizaciones en el historial del cliente.

El backend actual no ofrece una consulta agregada de titulares por permiso. La primera búsqueda inversa de una sesión todavía debe consultar los empleados ausentes de la caché, aunque lo hace con concurrencia limitada. Un endpoint agregado permitiría eliminar esas solicitudes iniciales en una entrega coordinada con backend.

### Módulos habilitados

- El panel administrativo conserva accesos para M02 Catálogo y otros módulos que dependen de permisos individuales.
- La ficha completa del cliente queda preparada para enlazar pedidos y cotizaciones cuando estén disponibles.

## 6. Archivos modificados

| Archivo | Cambio |
| --- | --- |
| frontend/src/modules/m17-permisos/M17Shell.vue | Eliminación del polling global. |
| frontend/src/modules/m17-permisos/components/StatusModal.vue | Actualización del listado afectado y variante oficial. |
| frontend/src/modules/m17-permisos/store/useM17.ts | Caché de permisos, concurrencia limitada y refrescos específicos. |
| frontend/src/modules/m17-permisos/tests/integration.test.mjs | Regresión de caché, concurrencia e invalidación. |
| frontend/src/modules/m17-permisos/views/Dashboard.vue | Alta de empleado mediante Drawer. |
| frontend/src/modules/m17-permisos/views/EmployeeForm.vue | Modo Drawer reutilizable para alta y edición. |
| frontend/src/modules/m17-permisos/views/PeopleList.vue | Drawers de empleado y cliente con contexto persistente. |
| frontend/src/modules/m17-permisos/views/Permissions.vue | Consumo de la caché en edición y consulta inversa. |
| frontend/src/modules/m17-permisos/views/PersonDetail.vue | Ficha compacta con iconografía, estado, historial y acciones. |
| frontend/src/modules/m17-permisos/README.md | Estado de la entrega y documentación. |
| frontend/package.json y frontend/package-lock.json | Versión v2.5.2. |
| docs/CHANGELOG.md | Registro ejecutivo y enlace a este documento. |

No se modificaron backend, Core, rutas compartidas, otros módulos ni docs/reviews.

## 7. Validación

Ejecutado desde frontend:

- npm run lint -- --max-warnings=0.
- npx tsc --noEmit.
- npm run build.
- npm run test:core.
- npm run test:m17.

Resultados: ESLint cero errores y advertencias, TypeScript y build correctos, ocho pruebas M17 y una prueba Core aprobadas; verificador de release correcto. La integración también prueba respuestas tardías tras invalidar, protección de permisos guardados y doce lecturas concurrentes con límite global de cuatro.

Los criterios de interfaz descritos arriba reflejan la implementación y la inspección de código; su prueba interactiva con datos reales está pendiente. No se certifica el funcionamiento del backend ni de los módulos comerciales mediante estas pruebas frontend.

La validación en navegador confirmó que el layout y el manejo de error se renderizan sin errores de consola propios de M17. Los flujos con datos dependen de un backend activo; las dependencias de backend no están instaladas en este checkout y no se alteraron por tratarse de una entrega frontend.

## 8. Dictamen

- Incremento SemVer: registrado.
- Changelog: actualizado.
- Walkthrough frontend: generado.
- Estructura del módulo: conservada.
- Contratos HTTP: sin cambios.
- Archivos compartidos de Core: sin cambios.
