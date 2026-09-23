# Walkthrough v3.34.9 — Filtros preliminares del catálogo

## 1. Metadatos de la implementación

- **Versión:** `v3.34.9`
- **Módulo de origen:** M01 — Catálogo de Productos
- **Capa:** Frontend
- **Fecha:** 14/09/2026
- **Responsable:** Yuleiny Lugo / Codex

## 2. Historia de usuario cubierta

- **HU-BUS-02 — Filtros del catálogo:** cobertura visual preliminar dentro del storefront de HU-CAT-06.
- Se incorporaron controles para marca, línea, tipo de resina, color, familia cromática, presentación y rango de precio.
- La conexión funcional con búsqueda, facetas y URL se difiere hasta integrar el contrato de M02.

## 3. Reglas y políticas aplicadas

- El cambio de producto reside en la vista pública de M01.
- Se usaron exclusivamente Tailwind y tokens cromáticos oficiales.
- No se declararon DTOs inline ni datos maestros o catálogos hardcodeados.
- Los filtros sin fuente de datos están deshabilitados y señalados como vista preliminar para no simular resultados incorrectos.
- Se preservaron la búsqueda, categoría/subcategoría, disponibilidad, orden y paginación existentes.

## 4. Criterios de aceptación verificados

| Criterio relacionado | Cobertura | Resultado |
| :--- | :--- | :---: |
| **RF-BUS-02-01** — presencia de filtros requeridos | Todos los tipos de filtro están representados en el panel. | ✅ Visual |
| **RF-BUS-02-02** — opciones que producen resultados | Requiere facetas de M02; los controles permanecen deshabilitados. | ⏳ Pendiente |
| **RF-BUS-02-04** — precio final y rango válido | Requiere precios efectivos y validación del contrato M02. | ⏳ Pendiente |
| **RF-BUS-02-05** — persistencia en URL | Requiere integración de búsqueda M02. | ⏳ Pendiente |
| Accesibilidad | `fieldset` deshabilitado, etiquetas visibles y textos alternativos para precio. | ✅ |
| Calidad estática | `npm run lint`, `npm run build` y `git diff --check`. | ✅ |

## 5. Dependencias externas

### Necesita para operar al 100 %

- Facetas dinámicas de M02 para marcas, líneas, resinas, colores y presentaciones.
- Soporte de familia cromática en el contrato de M02.
- Precio final con descuentos e IVA y serialización de filtros múltiples en la URL.

### Habilita

- Define el espacio visual y accesible donde se conectarán las facetas sin rediseñar el catálogo.

## 6. Archivos modificados y creados

- `frontend/src/modules/m01-dashboardcatalogo/views/VistaCatalogoPublico.vue`
- `docs/CHANGELOG.md`
- `docs/walkthroughs/M01/walkthrough_v3.34.9_M01_filtros_catalogo_estaticos_frontend.md`
