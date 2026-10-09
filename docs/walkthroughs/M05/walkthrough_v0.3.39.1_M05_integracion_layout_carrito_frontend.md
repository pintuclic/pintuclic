# Walkthrough de Implementación — M05 Integración del carrito con el layout de la tienda (Frontend)

## 1. Metadatos

- **Versión:** `v0.3.39.1`
- **Módulo:** M05 Carrito de compras
- **Capa:** Frontend
- **Fecha:** 2026-10-08
- **Responsable:** juliangutierrez07 con Agente IA (Claude Code)
- **Estado:** Completado

## 2. Historias de Usuario y alcance

Complementa los flujos de `HU-CAR-01` (carrito de visitante), `HU-CAR-02` (gestión de líneas) y `HU-CAR-04` (carrito de cliente) entregados en `v0.3.39.0`, resolviendo la dependencia pendiente del router global.

- La vista `CartView.vue` se monta dentro de `LayoutHome`, por lo que `/carrito` muestra el header y el `FooterPrincipal` de la tienda.
- El botón "Mi Carrito" del header navega a `/carrito`.
- El contador y el total del header se leen de `useCartStore()` en lugar del estado mock.

## 3. Reglas de negocio y seguridad observadas

- Los totales del header provienen de la respuesta del backend (`total` del carrito) a través del store; no se calculan en el layout.
- El layout carga el carrito al montarse con `cartStore.loadCart()`, que respeta el flujo visitante (`x-visitor-token`) o cliente autenticado (fusión) ya definido en el store.
- No se modificaron el backend, la base de datos ni los permisos.

## 4. Criterios y evidencia de verificación

| Flujo | Evidencia comprobada | Resultado |
| :--- | :--- | :---: |
| Header y footer en `/carrito` | Al abrir `http://localhost:5173/carrito` se muestran top bar, navbar, beneficios y footer de la tienda. | ✅ |
| Navegación desde el header | Clic en "Mi Carrito" desde `/` navega a `/carrito`. | ✅ |
| Contador del header | Con 2 líneas de 2 unidades (variantes seed `1` y `2`), el header mostró `4` y `$ 363.600`. | ✅ |
| Actualización en vivo | Al aumentar una línea de 2 a 3, el resumen y el header pasaron a 5 productos y `$ 449.500`. | ✅ |
| Lint | ESLint sobre los cuatro archivos de código modificados terminó sin errores ni advertencias. | ✅ |

La prueba se hizo contra los contenedores `pintuclic-m05-test-backend` y `pintuclic-m05-test-db`, con un proxy local `/api` (configuración temporal fuera del repositorio), porque el backend no permite el encabezado `x-visitor-token` en CORS.

`vue-tsc --noEmit` sobre `tsconfig.app.json` solo reportó dos diagnósticos previos por falta de `vitest` en pruebas de M01, no relacionados con esta entrega.

## 5. Dependencias e integración

### Hacia atrás

- **Backend M05/PostgreSQL:** fuente de líneas y totales del carrito.
- **Backend core (pendiente):** `backend/src/core/middlewares/cors.middleware.ts` debe agregar `x-visitor-token` a `allowedHeaders` para que el frontend en desarrollo (`localhost:5173` → `localhost:3000`) funcione sin proxy. En el despliegue con Nginx (`/api` same-origin) no aplica.

### Hacia adelante

- **M07/M08:** el checkout y la creación de orden siguen pendientes, sin cambios en esta entrega.

## 6. Archivos modificados

Módulo M05:

1. `frontend/src/modules/m05-carrito-compras/m05-carrito-compras.routes.ts` — ruta relativa `carrito`.
2. `frontend/src/modules/m05-carrito-compras/views/CartView.vue` — contenedor raíz `<div>` en lugar de `<main>`.
3. `frontend/src/modules/m05-carrito-compras/README.md` — dependencia del router marcada como resuelta.

Archivos compartidos (con aprobación explícita del equipo):

4. `frontend/src/core/routes/index.ts` — registro de `m05CarritoRoutes` como hija de `LayoutHome`.
5. `frontend/src/core/layouts/LayoutHome.vue` — enlace "Mi Carrito" a `/carrito` y contador/total desde `useCartStore()`.

Versionado: `.github/version.txt`, `docs/CHANGELOG.md` y este walkthrough.
