# Walkthrough v3.35.9 — Integración del panel y organización de vistas públicas

## 1. Metadatos
- Versión: v3.35.9 (PATCH de integración).
- Fecha: 2026-09-23. Responsable: agente IA autorizado.
- Rama: feature/m01-vistas-publicas. Sin push.
- Origen: feature/m01-dashboard-catalogo, commit dd0c8bed39dbf81cbb1496f378b2388751cad18b.
- Verificación: git fetch origin y git ls-remote coinciden con el SHA anterior y con la captura del usuario.

## 2. Historias y alcance
Incorpora el panel administrativo conectado a API real de M01, exactamente como lo publicó su responsable. No se declara cierre funcional de ninguna HU. Las vistas de HU-CAT-06 se organizan dentro de `m01-catalogo` en carpetas `publicas`, sin modificar los 26 archivos administrativos recibidos.

## 3. Reglas y políticas
Se conservan las ampliaciones públicas del backend (código, muestra cromática y familia), sus pruebas y el seed público frente a versiones anteriores de esos mismos archivos en la otra rama. Su contenido queda idéntico al HEAD previo.
Se preservan las correcciones de Core para Table, LayoutHome y OTP. Los archivos App.vue/main.ts mantienen su comportamiento equivalente. Se combinan scripts de pruebas Core y Vitest.
HU-CUE-08, HU-ADM-03 y HU-SEG-06: no se sustituyen políticas del servidor; no hay ejecución de seed ni cambios en datos de BD.

## 4. Validación
- `npm test`: 2 archivos y 15 pruebas aprobadas.
- `npm run build`: TypeScript y Vite aprobados.
- `npm run lint -- --max-warnings 0`: aprobado sin errores ni advertencias.
- `npm run test:core`: 1 prueba Core aprobada.
- Home y Catálogo cargaron datos desde la API real.

## 5. Dependencias y límites
Requiere la API administrativa M01, autenticación y permisos del servidor. El usuario solicita conservar la última versión de su compañero: no se restaura el admin antiguo. El menú Core aún enlaza Búsquedas sin resultado, pero la rama nueva no define esa vista/ruta; pendiente del responsable administrativo.
El N+1 del listado público queda pendiente de la rama responsable de backend y se integrará después de este merge.

## 6. Archivos
Se incorporan los 26 archivos frontend de m01-catalogo y cambios de configuración/dependencias de la rama origen. Resoluciones: backend/src/modules/m01-catalogo/{__tests__/m01.test.ts,interfaces/m01.interfaces.ts,repositories/catalogo-publico.repository.ts,services/catalogo-publico.service.ts}, bd/sql/seed_pintuclic.sql, docs/CHANGELOG.md, frontend/package.json, frontend/src/{App.vue,main.ts}, frontend/src/core/{routes/index.ts,layouts/LayoutHome.vue,components/data-display/Table.vue}, frontend/src/modules/m04-cuentas/components/PasoRecuperarOTP.vue.
Los archivos conservados desde HEAD no introducen cambios de contenido. Este documento distingue la incorporación de trabajo existente de la refactorización pública posterior.
