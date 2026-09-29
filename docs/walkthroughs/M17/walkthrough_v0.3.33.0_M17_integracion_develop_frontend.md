# Walkthrough: integración M17 con develop

## 1. Metadatos
- Versión: v0.3.33.0 (Minior-feat por incorporación del frontend M17 a develop).
- Módulo: M17 Permisos y Administración, frontend.
- Fecha: 2026-09-28. Responsable: agente de desarrollo.
- Base integrada: develop en 9d8e2fb; rama de entrega: feature/m17-permisos-roles.

## 2. Alcance e historias de usuario
Integración de los flujos existentes de personal, permisos, perfil y configuración. No se implementan nuevas reglas de negocio ni se declara cierre adicional de HUs. Se conserva íntegro el código del módulo respecto de 4bf77cc, incluida su estructura de carpetas, caché de permisos y formularios en drawers.

## 3. Reglas y políticas
Se consumen los componentes oficiales del Core y los DTOs existentes. No se agregan datos iniciales, credenciales ni validaciones en el cliente que sustituyan la autorización del servidor. Los cambios de develop en otros módulos se conservan. El usuario autorizó la integración de rutas y la exclusión de la suite Node de M17 en la configuración compartida de Vitest.

## 4. Verificación
- ESLint con `--max-warnings=0`: 0 errores y 0 advertencias. TypeScript con `npx tsc --noEmit` y compilación Vue/Vite con `npm run build`: aprobados.
- Suite M17: `npm run test:m17`, 8 pruebas aprobadas durante la integración.
- Suite Core: `npm run test:core`, 1 prueba aprobada durante la integración.
- Suite Vitest: `npm test`, 14 pruebas aprobadas en 2 archivos; las suites Node se ejecutan con sus comandos separados para evitar errores de descubrimiento.
- Rutas M17 bajo `/admin`, conservando catálogo y solicitudes de develop y su redirección inicial al catálogo.
- No se ejecutó una prueba de extremo a extremo contra una base de datos y backend autenticado; no se afirma validación de producción ni cierre de políticas de servidor.

## 5. Dependencias externas
Requiere backend M17, PostgreSQL y autenticación M04/M20 configurados para operar con datos reales. Usa el Core de develop para formularios, tablas, modales y drawers. Habilita las pantallas administrativas de M17 junto a las del catálogo.

## 6. Archivos de esta integración
- `frontend/src/core/routes/index.ts`: registro autorizado de m17Routes.
- `frontend/vite.config.ts`: exclusión autorizada de la suite Node de M17 en Vitest.
- `.github/version.txt` y `docs/CHANGELOG.md`: versión oficial y registro de entrega.
- Este walkthrough.
El merge además incorpora los archivos de develop y conserva los entregables históricos de la rama M17; no se editan manualmente las implementaciones de otros módulos.
