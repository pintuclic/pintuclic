# Walkthrough de Implementación — M05 Carrito de Compras (Frontend)

## 1. Metadatos

- **Versión:** `v0.3.39.0`
- **Módulo:** M05 Carrito de compras
- **Capa:** Frontend
- **Fecha:** 2026-09-30
- **Responsable:** Agente IA (GitHub Copilot)
- **Estado:** Parcial con dependencias de integración

## 2. Historias de Usuario y alcance

El frontend cubre los flujos asociados a `HU-CAR-01` (carrito de visitante), `HU-CAR-02` (gestión de líneas), `HU-CAR-04` (carrito de cliente) y `HU-CAR-05` (revalidación previa a la compra), conforme a los componentes y servicios del módulo.

- La vista de producción `CartView.vue` carga y presenta el carrito desde el backend.
- El store gestiona carga, errores, cantidades, eliminación, vaciado, totales y revalidación.
- El visitante se identifica con un token opaco guardado en `localStorage` bajo `pintuclic_m05_visitor_token`, enviado como `x-visitor-token`.
- La vista incluye estado vacío, resumen, recomendaciones y beneficios; la preview demo permanece separada de la ruta que monta la vista conectada a la API.
- El checkout visitante queda bloqueado en la interfaz con solicitud de inicio de sesión. M05 no implementa el pago.

Los totales de producción se leen de la respuesta del backend; no se sustituyen por los cálculos locales de la preview demo.

## 3. Reglas de negocio y seguridad observadas

- El carrito de visitante puede consultarse y modificarse sin autenticar, usando el token opaco como identificador.
- La autenticación de cliente depende del access token gestionado por M04/M20; al autenticarse, el módulo dispone de operación para fusionar el carrito visitante.
- Antes de continuar con checkout autenticado, la vista solicita revalidación de precio y existencias al backend.
- Las solicitudes de visitante usan `x-visitor-token`; la prueba de navegador se hizo a través del proxy same-origin de la preview.

## 4. Criterios y evidencia de verificación

| Flujo | Evidencia comprobada | Resultado |
| :--- | :--- | :---: |
| Salud y base de datos | `GET /api/health` respondió `200`, con `success: true` y `database: connected` en los contenedores aislados de prueba. | ✅ |
| Carga de carrito visitante | `GET /api/carrito/visitante` respondió `200`. | ✅ |
| Agregar y persistir | `POST /api/carrito/visitante/items`, variante seed `1`, respondió `200`; tras recargar, la interfaz recuperó la línea y su cantidad desde la API. | ✅ |
| Aumentar y disminuir | Ambas operaciones `PUT /api/carrito/visitante/items/:idLinea` respondieron `200`; la cantidad observada pasó de `2` a `3` y regresó a `2`. | ✅ |
| Eliminar y vaciar | `DELETE /api/carrito/visitante/items/:idLinea` respondió `200`; la interfaz mostró estado vacío. La prueba de vaciado también respondió `200` y dejó el carrito vacío. | ✅ |
| Checkout visitante | La interfaz mostró “Para continuar con la compra debes iniciar sesión” y no envió solicitud de checkout. | ✅ |
| CORS y consola | La E2E se ejecutó desde `http://localhost:5173` a través del proxy `/api`; no registró errores CORS, errores de consola ni requests fallidas. | ✅ |

### Validaciones de frontend

Sobre la base frontend completa compatible en la que se probó el módulo, pasaron `vue-tsc --noEmit` con el tsconfig aislado de la preview M05, ESLint limitado a M05 sin `--fix`, `node --check` para `preview/vite.config.mjs` y el build aislado de la preview (`write: false`). El build transformó 1.966 módulos.

En una comprobación posterior de la rama FRONTEND tras integrar `develop` hasta `179c2cb`, Vue/TypeScript informó ocho diagnósticos en `frontend/src/modules/m04-cuentas/components/auth/BotonGoogleAuth.vue` relacionados con `window.google` y el tipo implícito de `response`; no se atribuyen a los archivos M05. Por ello, los resultados exitosos anteriores no se presentan como una compilación limpia de esa base posterior.

La preview aislada también mostró advertencias de Vue Router para `/catalogo` y `/paleta-colores`, provenientes de enlaces del layout global; no se modificaron rutas externas a M05.

## 5. Dependencias e integración

### Hacia atrás

- **M01/M02 y M13:** datos de catálogo, variantes y disponibilidad; la UI conserva fallbacks visuales donde falta información completa.
- **M04/M20:** autenticación de cliente y access token.
- **Backend M05/PostgreSQL:** persistencia del carrito, precios, cantidades y revalidación. La prueba se realizó contra los contenedores aislados `pintuclic-m05-test-backend` y `pintuclic-m05-test-db`.
- **Router global:** `m05CarritoRoutes` se exporta desde el módulo y requiere registro explícito. Este alcance no modifica el router compartido.

### Hacia adelante

- **M07:** orquestación de checkout/pasarela.
- **M08:** creación de la orden después de confirmarse el pago; ese flujo no está implementado por M05.

Esta entrega corresponde a una rama de feature. No afirma que M05 esté desplegado ni que sus cambios hayan sido integrados de regreso en `develop`.

## 6. Archivos del módulo incluidos

Los 28 archivos de frontend M05 son:

1. `frontend/src/modules/m05-carrito-compras/README.md`
2. `frontend/src/modules/m05-carrito-compras/assets/brocha-premium.svg`
3. `frontend/src/modules/m05-carrito-compras/assets/cinta-enmascarar.svg`
4. `frontend/src/modules/m05-carrito-compras/assets/pintura-acrilica.svg`
5. `frontend/src/modules/m05-carrito-compras/assets/rodillo-profesional.svg`
6. `frontend/src/modules/m05-carrito-compras/assets/taladro-20v.svg`
7. `frontend/src/modules/m05-carrito-compras/components/CartBenefits.vue`
8. `frontend/src/modules/m05-carrito-compras/components/CartEmptyState.vue`
9. `frontend/src/modules/m05-carrito-compras/components/CartItem.vue`
10. `frontend/src/modules/m05-carrito-compras/components/CartItemsPanel.vue`
11. `frontend/src/modules/m05-carrito-compras/components/CartSummary.vue`
12. `frontend/src/modules/m05-carrito-compras/components/RecommendedProductCard.vue`
13. `frontend/src/modules/m05-carrito-compras/components/RecommendedProducts.vue`
14. `frontend/src/modules/m05-carrito-compras/interfaces/cart.interface.ts`
15. `frontend/src/modules/m05-carrito-compras/m05-carrito-compras.routes.ts`
16. `frontend/src/modules/m05-carrito-compras/preview/.gitignore`
17. `frontend/src/modules/m05-carrito-compras/preview/CartPreview.vue`
18. `frontend/src/modules/m05-carrito-compras/preview/CartPreviewView.vue`
19. `frontend/src/modules/m05-carrito-compras/preview/cart-preview.data.ts`
20. `frontend/src/modules/m05-carrito-compras/preview/index.html`
21. `frontend/src/modules/m05-carrito-compras/preview/main.ts`
22. `frontend/src/modules/m05-carrito-compras/preview/tsconfig.json`
23. `frontend/src/modules/m05-carrito-compras/preview/vite.config.mjs`
24. `frontend/src/modules/m05-carrito-compras/services/cart-product-fallback.ts`
25. `frontend/src/modules/m05-carrito-compras/services/cart.service.ts`
26. `frontend/src/modules/m05-carrito-compras/services/visitor-token.service.ts`
27. `frontend/src/modules/m05-carrito-compras/store/cart.store.ts`
28. `frontend/src/modules/m05-carrito-compras/views/CartView.vue`

La entrega de versión añade por separado `.github/version.txt`, `docs/CHANGELOG.md` y este walkthrough; no son archivos del módulo de código.

## 7. Dictamen

- **E2E M05 en base compatible:** verificada para los flujos enumerados.
- **TypeScript/ESLint/build en base compatible:** pasaron según las comprobaciones indicadas; el diagnóstico posterior de M04 queda explícitamente separado.
- **Dependencias pendientes:** registro del router global y conexión del flujo de checkout/pago con M07 y la creación de orden en M08.
- **Despliegue / integración en `develop`:** no afirmados.