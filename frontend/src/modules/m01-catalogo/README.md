# M01 Catálogo — frontend

Un solo módulo para el panel administrativo y la tienda pública. La estructura por capas sigue [infraestructura.md](../../../infraestructura.md).

- **Administración:** versión de `feature/m01-dashboard-catalogo` en `dd0c8bed39dbf81cbb1496f378b2388751cad18b`, conservada sin editar sus 26 archivos.
- **Vistas públicas:** trabajo de `feature/m01-vistas-publicas`, organizado bajo subcarpetas `publicas/`.
- **Contrato de integración:** Core monta `publicStorefrontRoutes` de `publico.routes.ts` bajo `LayoutHome` y `adminCatalogoRoutes` de `catalogo.routes.ts` bajo `LayoutAdmin`.

```text
m01-catalogo/
├── assets/                       # Recursos visuales públicos existentes
├── components/
│   ├── admin/                    # Panel del compañero
│   └── publicas/                 # Tarjetas, paleta, calculadora, ambientes
├── views/
│   ├── admin/
│   └── publicas/                 # Inicio, catálogo, detalle, paleta
├── composables/
│   ├── useListado.ts, ...        # Composables administrativos existentes
│   └── publicas/                 # Estado y coordinación de la tienda
├── services/
│   ├── http.ts                   # Transporte compartido del módulo
│   ├── catalogo-admin.service.ts
│   └── publicas/                 # Adaptador y carga de fichas públicas
├── store/useTaxonomias.ts         # Caché administrativa existente
├── dtos/
│   ├── admin.dto.ts
│   └── publicas/                 # Búsqueda y calculadora
├── interfaces/
│   ├── index.ts                  # Contratos administrativos y sobre HTTP
│   └── publicas/                 # Contratos de lectura de la tienda
├── tests/publicas/               # Navegación global y carga de vistas reales
├── catalogo.routes.ts            # Rutas administrativas del compañero
└── publico.routes.ts             # Rutas públicas
```

## Acuerdo para trabajar dos personas

El responsable administrativo trabaja en `admin/` y en sus archivos existentes de las demás capas. La responsable de la tienda trabaja en `publicas/`, recursos visuales y `publico.routes.ts`. Los cambios a `http.ts`, `interfaces/index.ts`, layouts, tokens y router Core requieren coordinación: son puntos compartidos.

No crear otro módulo `m01-*` para separar públicos y administradores. No importar componentes o servicios administrativos desde una vista pública. No crear stores vacíos: el estado público actual vive por instancia en sus composables; Pinia se reserva para estado realmente compartido.

Las URLs públicas se conservan: `/`, `/catalogo`, `/productos/:productoId`, `/paleta-colores`. Los nombres de ruta y parámetros se conservan también.

## Validación local

Desde `frontend/`:

```sh
npm run build
npm run lint -- --max-warnings 0
npm run test:core
npx vitest run src/modules/m01-catalogo
```

Consultar [ARQUITECTURA.md](./ARQUITECTURA.md) para el análisis SOLID, los límites y las tareas funcionales pendientes. El admin antiguo de `m01-dashboardcatalogo` fue retirado por instrucción del usuario de conservar la última versión de su compañero; su historial permanece en Git.
