# Walkthrough de Implementación: Core Frontend Design System (v2.3.0)

**Módulo/Capa:** Core Frontend (`src/core/components/`)
**Versión:** v2.3.0
**Fecha:** 2026-09-15
**Responsable:** Agente de IA

## 1. Resumen de HUs / Tareas Completadas
- Implementación de los componentes visuales base del Design System Pintuclic en la rama `feature/core-frontend-layouts`.
- Refactorización de tipografías globales (Inter y Poppins).
- Creación de componentes modulares estrictos para eliminar la duplicidad en los módulos M01, M04 y M17.
- Reubicación de `FooterPrincipal.vue` a la capa correcta de layouts.

## 2. Reglas de Negocio y Políticas Validadas
- **Directiva 8 (Paleta de Colores):** Todos los componentes base (`Button.vue`, `IconButton.vue`, `Badge.vue`, etc.) utilizan estrictamente los tokens del sistema (`corporate`, `action`, `subaction`, `conversion`, `highlight`, `neutral-light/dark`). Se purgaron colores directos y arbitrarios (a excepción de la barra degradada del modal que es marca institucional).
- **Aislamiento de Módulo (Directivas 1 y 2):** Los cambios se realizaron exclusivamente en los archivos exportados en `src/core/components/index.ts`. No se crearon nuevos archivos no estandarizados (como `Icon.vue`) y no se tocaron ramas ni carpetas de otros equipos.

## 3. Criterios de Aceptación y Detalles Técnicos
- **Tipografías:** Se integraron `font-title` (Poppins) y `font-sans` (Inter) en la configuración oficial de Tailwind (`tailwind.config.ts`).
- **Iconos Dinámicos (Sin impactar bundle):** `Button.vue` e `IconButton.vue` soportan renderizar componentes de `lucide-vue-next` inyectados vía props sin requerir componentes intermedios rompe-tree-shaking.
- **Tarjetas de Opciones:** Se mapeó el diseño UI de "Paredes Interiores" a `GrupoOpciones.vue` con soporte completo para `v-model`.
- **Tablas M17 (Adaptativas):** `Table.vue` fue portado para soportar el diseño responsivo `mobile-cards` junto con `Paginacion.vue`.
- **Corrección de Directorio:** Se eliminó la carpeta espuria `layout/` de `components/` y se movió `FooterPrincipal.vue` a `src/core/layouts/`.

## 4. Dependencias e Impacto
- **Habilita a:** M01, M04, M17 y módulos futuros a consumir un solo origen de la verdad visual importando desde `@/core/components`.
- **Acción requerida por los equipos:** Una vez esta rama se fusione a `develop`, los equipos de M01 y M17 deberán refactorizar sus módulos para eliminar sus botones, tablas y modales locales y empezar a usar los globales de esta versión.

## 5. Lista de Archivos Creados o Modificados
- **Modificados:**
  - `frontend/tailwind.config.ts`
  - `frontend/src/core/components/index.ts`
  - `frontend/src/core/components/buttons/Button.vue`
  - `frontend/src/core/components/buttons/IconButton.vue`
  - `frontend/src/core/components/forms/GrupoOpciones.vue`
  - `frontend/src/core/components/forms/Input.vue`
  - `frontend/src/core/components/data-display/Table.vue`
  - `frontend/src/core/components/navigation/Paginacion.vue`
  - `frontend/src/core/components/data-display/Badge.vue`
  - `frontend/src/core/components/data-display/Card.vue`
  - `frontend/src/core/components/overlays/Drawer.vue`
  - `frontend/src/core/components/overlays/Modal.vue`
- **Movidos:**
  - `frontend/src/core/components/layout/FooterPrincipal.vue` $\rightarrow$ `frontend/src/core/layouts/FooterPrincipal.vue`
- **Eliminados:**
  - Directorio vacío `frontend/src/core/components/layout/`
