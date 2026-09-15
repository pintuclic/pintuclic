# Transición del drawer de la ficha de cliente

## 1. Metadatos

- Versión: **2.2.3** (PATCH). Fecha: 2026-09-14. Responsable: Codex.
- Módulo de origen: M17 Administración, clientes y permisos. Capa: frontend.
- Alcance: mejora visual del componente `Drawer` global utilizado por la ficha de cliente. No se añade una HU ni se cambian contratos HTTP.

## 2. Comportamiento implementado

El `Drawer` vive en `frontend/src/core/components/overlays/Drawer.vue`, como exige `frontend/infraestructura.md`. La vista `PeopleList.vue` de M17 lo reutiliza sin duplicar el panel. Al abrir una ficha, el drawer entra desde fuera del borde derecho hasta su posición final. Al pulsar cerrar, Escape o el fondo, recorre el movimiento inverso antes de emitir `close` y desmontarse. El fondo se atenúa junto con la entrada y salida. Si el sistema prefiere movimiento reducido, se omite la animación. Se conserva el bloqueo de desplazamiento y se devuelve el foco al control anterior.

## 3. Alcance funcional, políticas y dependencias

- Criterio visual comprobado: el panel aparece desde la derecha y puede cerrarse sin quedar visible ni bloquear la pantalla.
- El contenido de la ficha, la autorización de M17 y sus servicios no cambian. Las políticas HU-CUE-08, HU-ADM-03 y HU-SEG-06 mantienen las mismas dependencias de backend M17/M20; este cambio visual no certifica su ejecución en servidor.
- `Drawer` es una pieza global disponible para otros módulos mediante `@/core/components`. La ficha de cliente sigue dependiendo de los datos y permisos entregados por los servicios de M17/M20.

## 4. Validación

- `npm run build`: TypeScript y bundle correctos.
- `npm run lint -- --max-warnings=0`: cero errores y advertencias.
- `npm run test:m17`: pruebas del módulo aprobadas.
- Navegador local en modo demo: apertura y cierre de la ficha de `Cliente Activo` desde `/admin/clientes`; la vista y el foco regresan al listado.

## 5. Archivos modificados

- `frontend/src/core/components/overlays/Drawer.vue`: entrada y salida animadas, Escape, fondo y movimiento reducido.
- `frontend/package.json`, `frontend/package-lock.json`: versión 2.2.3.
- `frontend/src/modules/m17-permisos/README.md`: comportamiento documentado.
- `docs/CHANGELOG.md` y este walkthrough: registro de entrega.

Los cambios permanecen locales en `codex/m17-core-frontend-layouts`, sin commit ni push conforme al acuerdo de esta sesión.
