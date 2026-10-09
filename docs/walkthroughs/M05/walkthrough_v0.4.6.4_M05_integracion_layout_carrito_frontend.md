# Walkthrough de Implementación — M05 Carrito dentro del layout de la tienda (Frontend)

## 1. Metadatos

- **Versión:** `v0.4.6.4`
- **Módulo:** M05 Carrito de compras
- **Capa:** Frontend
- **Fecha:** 2026-10-08
- **Responsable:** juliangutierrez07 con Agente IA (Claude Code)
- **Estado:** Completado

## 2. Historias de Usuario y alcance

Complementa los flujos de `HU-CAR-01` (carrito de visitante), `HU-CAR-02` (gestión de líneas) y `HU-CAR-04` (carrito de cliente).

En `develop` (`v0.4.6.3`), `m05CarritoRoutes` estaba registrado en el nivel raíz del router, fuera de `LayoutHome`. El botón "Mi Carrito" del header ya navegaba a `/carrito` y mostraba cantidad y total desde `useCartStore()`, pero la vista del carrito se mostraba sin header ni footer.

- `m05CarritoRoutes` se monta como hija de `LayoutHome`, por lo que `/carrito` muestra el header y el `FooterPrincipal` de la tienda.
- La ruta del módulo pasa a ser relativa (`carrito`); la URL pública sigue siendo `/carrito`.
- `CartView.vue` usa `<div>` como raíz para no anidar un segundo `<main>` dentro del layout.

## 3. Reglas de negocio y seguridad observadas

- Sin cambios en la lógica del carrito, el store, el backend, la base de datos ni los permisos.
- Los totales del header siguen proviniendo del backend a través de `useCartStore()`.

## 4. Criterios y evidencia de verificación

| Flujo | Evidencia comprobada | Resultado |
| :--- | :--- | :---: |
| Header y footer en `/carrito` | Al abrir `http://localhost:5173/carrito` se muestran top bar, navbar, beneficios y footer de la tienda. | ✅ |
| Navegación desde el header | Clic en "Mi Carrito" desde `/` navega a `/carrito`. | ✅ |
| Contador del header | Con 2 líneas de 2 unidades (variantes seed `1` y `2`), el header mostró `4` y `$ 363.600`. | ✅ |
| Actualización en vivo | Al aumentar una línea de 2 a 3, el resumen y el header pasaron a 5 productos y `$ 449.500`. | ✅ |

La prueba se hizo contra los contenedores `pintuclic-m05-test-backend` y `pintuclic-m05-test-db`.

## 5. Dependencias e integración

### Hacia atrás

- **Backend M05/PostgreSQL:** fuente de líneas y totales del carrito.
- **LayoutHome (`develop`):** botón "Mi Carrito" y contador ya integrados en `v0.4.6.3`.

### Hacia adelante

- **M07/M08:** el checkout y la creación de orden no cambian en esta entrega.

## 6. Archivos modificados

Módulo M05:

1. `frontend/src/modules/m05-carrito-compras/m05-carrito-compras.routes.ts` — ruta relativa `carrito`.
2. `frontend/src/modules/m05-carrito-compras/views/CartView.vue` — contenedor raíz `<div>` en lugar de `<main>`.
3. `frontend/src/modules/m05-carrito-compras/README.md` — dependencia del router marcada como resuelta.

Archivo compartido (con aprobación explícita del equipo):

4. `frontend/src/core/routes/index.ts` — `m05CarritoRoutes` movido del nivel raíz a los `children` de `LayoutHome`.

Versionado: `.github/version.txt`, `docs/CHANGELOG.md` y este walkthrough.
