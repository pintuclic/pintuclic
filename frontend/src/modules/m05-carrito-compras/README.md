# M05 - Carrito de compras

## Propósito

M05 gestiona el carrito vivo de visitantes y clientes autenticados. La vista de producción consume el backend mediante el store y el servicio del módulo; no contiene datos demo ni calcula precios históricos.

## Estructura

- `views/CartView.vue`: vista de producción conectada al store.
- `store/cart.store.ts`: estado, carga, mutaciones, errores, totales y revalidación.
- `services/cart.service.ts`: operaciones HTTP de M05.
- `services/visitor-token.service.ts`: creación y persistencia local del token opaco.
- `components/`: líneas, resumen, estado vacío, beneficios y recomendaciones.
- `interfaces/cart.interface.ts`: contratos TypeScript del módulo.
- `preview/CartPreviewView.vue`: preview demo aislada, con datos locales intencionales.
- `preview/index.html?route=api-cart`: preview API que monta `CartView.vue`.
- `m05-carrito-compras.routes.ts`: rutas exportables sin registro global automático.

## Endpoints utilizados

- `GET /api/carrito/visitante`
- `POST /api/carrito/visitante/items`
- `PUT /api/carrito/visitante/items/:idLinea`
- `DELETE /api/carrito/visitante/items/:idLinea`
- `GET /api/carrito/cliente`
- `POST /api/carrito/cliente/items`
- `PUT /api/carrito/cliente/items/:idLinea`
- `DELETE /api/carrito/cliente/items/:idLinea`
- `POST /api/carrito/cliente/fusionar`
- `GET /api/carrito/cliente/revalidar`

La vista usa `GET /api/carrito/cliente/revalidar` antes de permitir continuar al pago para un cliente autenticado. Checkout y pago pertenecen a módulos posteriores.

## Visitante y cliente

El visitante se identifica con el header `x-visitor-token`. El token es opaco, se genera con `crypto.randomUUID()` y se conserva en `localStorage` bajo `pintuclic_m05_visitor_token`; no contiene credenciales ni datos personales.

El cliente autenticado usa el access token gestionado por M04/M20. Al autenticarse, M05 puede fusionar el carrito visitante mediante `POST /api/carrito/cliente/fusionar`. Antes del checkout se revalidan precio y existencia con `GET /api/carrito/cliente/revalidar`.

Los totales de producción se toman del campo `total` enviado por el servidor. El precio y subtotal de cada línea también se transforman desde la respuesta API; no se usa la aritmética demo de la preview.

## Previews

Con las dependencias frontend ya instaladas, desde `frontend/`:

```powershell
npm.cmd run dev -- --config src/modules/m05-carrito-compras/preview/vite.config.mjs --host 127.0.0.1 --port 5173
```

Preview demo, sin API:

`http://localhost:5173/src/modules/m05-carrito-compras/preview/index.html`

Preview API, con `CartView.vue`:

`http://localhost:5173/src/modules/m05-carrito-compras/preview/index.html?route=api-cart`

La configuración de preview usa un proxy local `/api` hacia `http://localhost:3000` para que el navegador pueda enviar `x-visitor-token` same-origin sin cambiar CORS ni backend. La ruta demo no realiza solicitudes API.

## Dependencias pendientes

- **Catálogo/M02:** debe proporcionar información completa de producto, imágenes y variantes para sustituir los fallbacks visuales actuales.
- **M07:** debe conectar el checkout y pago después de la revalidación exitosa.
- **Router global:** `m05CarritoRoutes` ya está registrado como hija de `LayoutHome` (v0.3.39.1); `/carrito` muestra el header y el footer de la tienda.
- **Backend/header:** el backend debe permitir `x-visitor-token` en `Access-Control-Allow-Headers` si se consume directamente desde otro origen, sin proxy.

## Recursos Docker de prueba

Se utilizaron recursos nuevos y aislados, que permanecen activos:

- Red: `pintuclic-m05-test`
- Volumen: `pintuclic-m05-test-pgdata`
- PostgreSQL: `pintuclic-m05-test-db`
- Backend: `pintuclic-m05-test-backend`
- Imagen: `pintuclic-m05-test-backend:local`
- Puertos: `5432` para PostgreSQL y `3000` para backend.

La base se inicializó con `bd/sql` montado en solo lectura. No se modificó el `.env` raíz ni se ejecutaron resets sobre bases existentes.

## Resultados E2E verificados

- Healthcheck API: `200`, base de datos conectada.
- Obtener carrito visitante: `200`.
- Agregar variante seed `1`: `200`.
- Persistencia y aumento/disminución de cantidades: `200`.
- Eliminación y vaciado: `200`.
- Token ausente y cantidad inválida: `400`.
- Checkout visitante bloqueado/no disponible: `404` en el endpoint no implementado.
- Login seed, fusión y revalidación: `200`.
- En navegador se verificó `x-visitor-token` en `GET`, `PUT` y `DELETE`, incluido el vaciado de varias líneas.
- Checkout de visitante muestra el bloqueo de autenticación sin solicitar revalidación.
- La preview demo permaneció separada y no emitió solicitudes API.
