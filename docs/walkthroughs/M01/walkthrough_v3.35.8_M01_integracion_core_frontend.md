# Walkthrough v3.35.8 — Integración Core y vistas públicas M01

## 1. Metadatos
- Versión: v3.35.8, PATCH de integración sin cambiar contratos públicos.
- Módulo: M01 Catálogo / Core frontend.
- Fecha: 2026-09-22. Responsable: agente IA autorizado por el usuario.
- Rama: feature/m01-vistas-publicas. Sin push por instrucción explícita.

## 2. Historias y alcance
Integración de origin/feature/core-frontend-layouts (34e6bea). Se preservan las rutas de consulta pública HU-CAT-06, las muestras cromáticas y el menú de categorías. No se declara cierre de nuevas HUs.

## 3. Reglas y políticas
- Resolución de archivos compartidos autorizada explícitamente por el usuario.
- Se conservan recuperación de contraseña, dropdown y confirmación de cierre de sesión incorporados por Core.
- Tabla genérica sin any; Badge conserva descuento/destacado con tokens oficiales.
- Categorías consultadas en la API: no se fabrican datos cuando devuelve vacío o falla.
- HU-CUE-08 y HU-ADM-03: esta integración no sustituye comprobaciones de identidad y permisos del servidor.
- HU-SEG-06: no se agregan datos sensibles ni errores técnicos a la UI pública.
- Diagrama inspeccionado: docs/assets/diagrams/M01/Entonado durante la compra.drawio.png. No se alteran sus reglas de color/presentación/base.
- Inconsistencia documental: la matriz de trazabilidad no contiene M01 y varias referencias HU-CAT-*.png de la especificación no existen con esos nombres. No se modifican contratos globales.

## 4. Validación
Superados: `npm run build` (vue-tsc -b + Vite), `npm run lint -- --max-warnings 0` (0 errores, 0 advertencias) y `npm run test:core` (1 prueba aprobada).
Estas comprobaciones no certifican los criterios funcionales completos contra una base de datos real.

## 5. Dependencias externas
Requiere API pública M01 y datos centralizados en PostgreSQL. Autenticación M04 y recuperación dependen de sus servicios de seguridad y notificaciones. Habilita la integración posterior del panel sin sustituir las vistas públicas.

## 6. Archivos y límites
Resoluciones manuales: docs/CHANGELOG.md; frontend/src/core/components/buttons/Button.vue; frontend/src/core/components/data-display/Badge.vue y Table.vue; frontend/src/core/components/index.ts; frontend/src/core/layouts/LayoutHome.vue; frontend/src/core/routes/index.ts; este walkthrough.
Los demás cambios proceden de la rama Core, incluidos componentes, tokens y cambios M04. No se refactoriza manualmente M04.
