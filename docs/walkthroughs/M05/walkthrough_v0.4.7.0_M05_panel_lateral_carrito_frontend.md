# Walkthrough de Implementación — M05 Panel lateral "Tu carrito" (Frontend)

## 1. Metadatos

- **Versión:** `v0.4.7.0`
- **Módulo:** M05 Carrito de compras
- **Capa:** Frontend
- **Fecha:** 2026-10-09
- **Responsable:** juliangutierrez07 con Agente IA (Claude Code)
- **Estado:** Completado

## 2. Historias de Usuario y alcance

Complementa `HU-CAR-01` (carrito de visitante), `HU-CAR-02` (gestión de líneas) y `HU-CAR-04` (carrito de cliente) con un panel lateral de acceso rápido al carrito.

- Al agregar un producto desde la tienda, el panel "Tu carrito" se abre automáticamente con las líneas actualizadas.
- El botón "Mi Carrito" del header abre el mismo panel.
- Desde el panel se puede aumentar, disminuir o eliminar cada línea, ver el total, continuar a `/carrito` o seguir comprando.

## 3. Reglas de negocio y seguridad observadas

- Las líneas, subtotales y el total provienen del backend a través de `useCartStore()`; el panel no calcula precios.
- Se reutilizan las acciones existentes del store (`increaseQuantity`, `decreaseQuantity`, `removeFromCart`), que respetan el flujo visitante (`x-visitor-token`) o cliente autenticado.
- El panel solo se abre tras una respuesta exitosa de `addToCart`; si falla, se conserva el manejo de errores de la vista que agrega.
- Colores exclusivamente con tokens del Design System (`corporate`, `conversion`, `action`, `highlight`, `danger`, `neutral-*`).
- Sin cambios en backend, base de datos ni permisos.

## 4. Criterios y evidencia de verificación

| Flujo | Evidencia comprobada | Resultado |
| :--- | :--- | :---: |
| Abrir al agregar | En el inicio, "Agregar" sobre "Viniltex Máxima Protección Antibacterial" abrió el panel con el producto y `$ 31.900 COP`. | ✅ |
| Varias líneas | Al agregar "Kit Renovación Hogar Premium", el panel mostró ambas líneas y total `$ 161.800 COP`. | ✅ |
| Abrir desde el header | Clic en "Mi Carrito" abrió el panel (incluido el estado vacío). | ✅ |
| Cantidad y eliminación | `+` y eliminar actualizaron líneas, total del panel y contador del header. | ✅ |
| Seguir comprando | Cerró el panel y restauró el scroll de la página. | ✅ |
| Continuar compra | Navegó a `/carrito` y cerró el panel. | ✅ |
| Lint y tipos | ESLint sobre los archivos modificados y `vue-tsc --noEmit -p tsconfig.app.json` sin errores. | ✅ |

Prueba realizada con el backend de la rama (`npm run dev`) contra una base local sembrada con `bd/sql/seed_pintuclic.sql`.

## 5. Dependencias e integración

### Hacia atrás

- **Backend M05/PostgreSQL:** líneas y totales del carrito.
- **M01 (vistas públicas):** ya llaman `cartStore.addToCart(...)` con nombre e imagen; el panel aprovecha esos datos sin modificar M01.
- **M01/M02 (catálogo):** la API del carrito no devuelve nombre, imagen, variante ni SKU; tras recargar la página se usa el fallback visual hasta que el catálogo provea esos datos por variante.

### Hacia adelante

- **M07:** "Continuar compra" lleva a `/carrito`, donde se revalida antes del checkout.

### Observación

- La vista de inicio (M01) mantiene su aviso propio "Se agregó … al carrito" además del panel; retirarlo corresponde a M01.

## 6. Archivos modificados / creados

Módulo M05:

1. `frontend/src/modules/m05-carrito-compras/components/CartDrawer.vue` — nuevo panel lateral.
2. `frontend/src/modules/m05-carrito-compras/store/cart.store.ts` — estado del panel, apertura tras agregar y datos de producto conocidos.

Archivo compartido (con aprobación explícita del equipo):

3. `frontend/src/core/layouts/LayoutHome.vue` — monta `<CartDrawer />`; el botón "Mi Carrito" abre el panel.

Versionado: `.github/version.txt`, `docs/CHANGELOG.md` y este walkthrough.
