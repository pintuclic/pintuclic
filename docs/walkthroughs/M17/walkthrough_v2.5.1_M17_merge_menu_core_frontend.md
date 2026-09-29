# Walkthrough — Merge del menú Core

## 1. Metadatos

Versión v2.5.1, PATCH. Fecha: 15/09/2026. Responsable: Codex, implementador frontend. Rama: `codex/m17-core-frontend-layouts`. Merge solicitado expresamente por el usuario de `equipo/feature/core-frontend-layouts`, commit `f1ce953`.

## 2. Historias y alcance

Actualización de navegación de las vistas existentes HU-ADM-01, HU-ADM-02, HU-ADM-04, HU-ADM-05 y HU-ADM-06. No implementa nuevas HUs ni modifica sus contratos. El commit recibido modifica exclusivamente `frontend/src/core/layouts/LayoutAdmin.vue`.

## 3. Reglas y políticas

Se incorporan los enlaces oficiales de empleados, permisos, clientes, perfil, configuración y líneas de catálogo. Se conserva el manejo local de foco móvil y se resuelven los conflictos eliminando enlaces duplicados. Los estilos de ruta activa usan tokens oficiales. No se altera la máquina de estados de permisos del diagrama HU-ADM-02 ni las políticas HU-ADM-03, HU-CUE-08 y HU-SEG-06.

## 4. Criterios y validación

- Perfil, clientes y configuración aparecen una sola vez en el menú.
- Se mantienen el icono y control de cierre móvil; se incorporan los iconos de perfil y líneas.
- `npm run lint -- --max-warnings=0`, `npx tsc --noEmit`, `npm run build`, `npm run test:core` y `npm run test:m17` verifican la entrega.
- No se prueba contra PostgreSQL ni SMTP ni se declara cierre productivo integral de HUs.

## 5. Dependencias externas

Core aporta LayoutAdmin y estilos. M17 mantiene sus rutas bajo `/admin` y depende de las APIs y sesión backend existentes. Los enlaces de catálogo recibidos pertenecen a M01; su disponibilidad depende de las rutas de ese módulo. No se modifican rutas de otros módulos.

## 6. Archivos modificados y creados

Único cambio de código: `frontend/src/core/layouts/LayoutAdmin.vue`. Versionado obligatorio: `frontend/package.json`, `frontend/package-lock.json`, `docs/CHANGELOG.md` y este walkthrough. No se modifican backend, SQL ni `docs/reviews/`.

## 7. Confirmación

Versión sincronizada y merge guardado localmente con Conventional Commits. Posteriormente el usuario autorizó el push y corrigió el destino a `pintuclic/pintuclic`, rama `feature/m17-permisos-roles`.

La entrega se prepara en `codex/m17-entrega-equipo` sobre `97ffc84`, conservando su documentación y agrupando la implementación validada en un commit. El árbol de código coincide con la integración local; el historial publicado excluye el merge `b02d13f` y los commits del repositorio personal. El envío avanza la rama del equipo sin force ni cambios a main.
