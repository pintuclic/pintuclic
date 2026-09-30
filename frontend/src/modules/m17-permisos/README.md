# M17 — Administración, empleados y permisos

## Entrega vigente: v2.5.2

El módulo vive bajo `/admin`, dentro de `core/layouts/LayoutAdmin.vue`. Usa componentes globales, Pinia, DTOs dedicados y el cliente Axios compartido.

- Menú móvil accesible, tablas en fichas bajo 640 px, formularios y paginación adaptables.
- Todas las operaciones consultan la API y su sesión real. Se retiraron el flag `VITE_M17_DEMO`, el snapshot JSON, su generador y las operaciones simuladas en memoria.
- Los datos de desarrollo se gestionan exclusivamente mediante `bd/sql/seed_pintuclic.sql` y `npm run db:seed` desde backend. No hay precarga automática desde el frontend.
- Las pruebas de contratos usan un adaptador HTTP controlado y extraen datos públicos del SQL central; no escriben en la base de datos ni envían solicitudes externas.
- La búsqueda inversa de permisos conserva una caché por sesión y limita a cuatro las solicitudes concurrentes pendientes.
- Los listados ya no se reemplazan mediante polling global: se actualizan al entrar, por acción explícita o después de una mutación.
- La creación y edición de empleados, y la consulta rápida de clientes, se realizan en Drawers sin perder los filtros ni la página del listado. Las rutas profundas continúan disponibles.
- Para desarrollo: iniciar backend y frontend (`npm run dev` en cada carpeta), acceder mediante el login de M04 y entrar en `/admin` con una sesión autorizada.
- Configurar `VITE_API_URL` para la API local. En Docker se compila con `/api` y Nginx lo dirige a backend.

## Validación

Desde `frontend/`: `npm run lint -- --max-warnings=0`, `npm run test:core`, `npm run test:m17`, `npm run build`.

El perfil consulta la sesión real. El historial de auditoría depende de que backend exponga la consulta correspondiente. Los pedidos y cotizaciones de clientes siguen dependiendo de sus módulos comerciales.

## Documentación

- [Optimización de permisos y Drawers v2.5.2](../../../../docs/walkthroughs/M17/walkthrough_v2.5.2_M17_optimizacion_permisos_drawers_frontend.md).
- [Controles oficiales del Core v2.5.0](../../../../docs/walkthroughs/M17/walkthrough_v2.5.0_M17_controles_core_frontend.md).
- [Integración con Core v2.4.1](../../../../docs/walkthroughs/M17/walkthrough_v2.4.1_M17_sincronizacion_core_frontend.md).
- [Adaptación móvil v2.2.5](../../../../docs/walkthroughs/M17/walkthrough_v2.2.5_M17_responsivo_movil_frontend.md).
- [Preparación Git y despliegue v2.2.6](../../../../docs/walkthroughs/M17/walkthrough_v2.2.6_M17_preparacion_git_despliegue_frontend.md).
- [Despliegue del proyecto modular](../../../../DEPLOY.md).
