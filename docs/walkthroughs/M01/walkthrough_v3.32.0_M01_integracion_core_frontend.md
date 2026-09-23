# Walkthrough de Implementación — v3.32.0

## 1. Identificación

- **Integración:** Core Frontend con M01 Catálogo.
- **Rama incorporada:** `origin/feature/core-frontend-layouts`.
- **Rama receptora:** `feature/m01-vistas-publicas`.
- **Incremento:** MINOR.

## 2. Resultado

Se integró la infraestructura global de layouts, componentes base, tipos compartidos y router central sin perder las vistas públicas ni el panel administrativo existente de M01.

## 3. Conflictos resueltos

- `frontend/src/App.vue`: se conservó como contenedor puro de `router-view`.
- `frontend/src/core/routes/index.ts`: se unificó la creación del router con las rutas exportadas por M01 y los layouts globales.
- `frontend/src/main.ts`: se eliminó la creación duplicada del router y se consume la instancia global.

## 4. Compatibilidad preservada

- `/` continúa mostrando el Home público M01.
- `/catalogo` continúa mostrando el catálogo público.
- `/productos/:productoId` continúa mostrando la ficha pública.
- `/admin/catalogo/**` conserva todas las rutas administrativas de M01.
- `/admin` redirige temporalmente a `/admin/catalogo`.
- `docker-compose.dev.yml` no forma parte de la integración.

## 5. Ajustes normativos

- Se corrigió una variable sin uso que impedía compilar `LayoutHome`.
- Se reemplazaron colores hexadecimales inline por `action-hover` y `highlight`.
- Los componentes globales incorporados permanecen disponibles para su implementación y adopción gradual; no se sustituyeron componentes M01 por esqueletos sin comportamiento.

## 6. Validación

- `npm run build`: correcto.
- `npm run lint`: correcto, sin errores ni advertencias.
- No quedan marcadores de conflicto en los archivos resueltos.

## 7. Dependencias y trabajo posterior

- Los componentes globales `Button`, `Table`, `Modal` y relacionados llegaron como esqueletos; deben completar sus contratos antes de reemplazar implementaciones funcionales de los módulos.
- La adopción en M01 debe realizarse componente por componente, con pruebas de regresión visual y funcional.
