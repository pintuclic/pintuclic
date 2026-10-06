# WALKTHROUGH DE IMPLEMENTACIÓN

**M08 — Orden de venta · Sección de pedidos y seguimiento del cliente (Frontend)**

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

| Campo | Valor |
|---|---|
| **Versión** | `v0.4.1.0` |
| **Tipo de incremento** | MINOR |
| **Módulo** | M08 — Orden de venta |
| **Capa** | Frontend |
| **Alcance** | Vistas del **cliente**. Las del personal se entregan aparte |
| **Rama** | `feature/m08-orden-venta` |
| **Fecha** | 2026-10-01 |
| **Depende de** | Backend M08 en `develop` (commit `f12cc3e`) |

---

## 2. HISTORIAS DE USUARIO CUBIERTAS

| HU | Vista | Ruta |
|---|---|---|
| HU-ORD-07 | Mis pedidos | `/pedidos` y dentro de `/perfil` |
| HU-ORD-02 / 04 / 06 | Seguimiento de pedido | `/pedidos/:codigo` |

### Alcance

Dos pantallas, según los diseños «Mi-Perfil_Usuario natural», «Mi-Perfil_Usuario
Empresa» y «Seguimiento de Pedido» del Figma:

- **Mis pedidos** vive bajo la información personal del perfil y también como página
  propia. Filtros por estado, buscador, separación entre pedidos en curso y
  finalizados, y paginación.
- **Seguimiento de pedido** es una pantalla independiente, con su encabezado, su ruta
  de navegación y el contenido en dos columnas: línea de tiempo a la izquierda; datos
  de despacho y detalle de la compra a la derecha.

**Las vistas del personal (HU-ORD-01, 03, 05) quedan fuera de esta entrega**: su
diseño aún no está aprobado. Sus rutas viven en `m08-ordenes-admin.routes.ts`, que no
se incluye, de modo que nada de esta entrega depende de ellas.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS APLICADAS

- **La línea de tiempo sigue el diagrama oficial.** Según
  `Maquina_de_estados_de_la_Orden.drawio.png`, desde «Preparada» el flujo bifurca
  según el modo de entrega: a domicilio pasa por *Despachado*; la recogida en tienda
  cierra directamente en *Entregado*. La secuencia se calcula con
  `secuenciaSegunEntrega(modo_entrega)`, de modo que a quien recoge en tienda no se le
  muestra una etapa por la que su pedido nunca va a pasar. El backend aplica la misma
  regla (`EXCLUIDA_POR_MODO` en `ciclo-estados.ts`).
- **Importes como texto.** Llegan como `NUMERIC` serializado y se formatean con
  `Intl.NumberFormat('es-CO')`. No se suma ni recalcula ningún importe en el navegador.
- **Aviso de cancelación.** HU-POS-01 y HU-POS-02 están bloqueadas a la espera de la
  política de M11, y el backend rechaza esas transiciones con
  `409 OPERACION_NO_HABILITADA`. Mientras el pedido sigue en curso, el panel explica al
  cliente cómo proceder en lugar de dejarlo buscando un botón que no existe. Es el
  pendiente que el informe final del backend asigna al frontend.
- **HU-SEG-02 — sesiones.** Un `401` se presenta como sesión expirada, no como «pedido
  no encontrado». Además, con 401, 403 o 404 el panel ya **no** cae a los datos de
  ejemplo: mostrar un pedido simulado a quien perdió la sesión es peor que no mostrar
  nada.
- **CA-SEG-03-06.** 403 y 404 se presentan igual, de modo que no se puede distinguir un
  pedido inexistente de uno ajeno.
- **Directiva 10.** `interfaces/` contiene solo `type` e `interface`, sin runtime.
- **Directiva 12.** Ningún esquema de validación vive dentro de un `.vue`.

---

## 4. CRITERIOS DE ACEPTACIÓN COMPROBADOS

Verificado contra el backend y la base de datos reales.

| Criterio | Comprobación | Resultado |
|---|---|---|
| CA-ORD-07-01 | `GET /mis-pedidos` | 2 en curso y 3 finalizados, pintados bajo sus encabezados |
| CA-ORD-07-03 | Buscador de la sección | Filtra el listado por código y por producto |
| RF-ORD-07-05 | Tarjeta de pedido | Muestra código, fecha, total y estado, y abre el detalle |
| RF-ORD-04-01 | Línea de tiempo de `PC-2026-00104` | Seis etapas con fecha y hora reales del historial |
| Directiva 5 | `PC-2026-00101` (recogida) | Cinco etapas, sin «Despachado» |
| Recogida en tienda | `PC-2026-00103` | Sin dirección ni costo de envío, porque llegan nulos |
| Pedido cancelado | `PC-2026-00105` | Aviso de cancelación en lugar de la secuencia |
| HU-SEG-02 | Token expirado | «Tu sesión expiró», no «pedido no encontrado» |

---

## 5. DEPENDENCIAS EXTERNAS

### Hacia atrás

| Necesita | De quién | Estado |
|---|---|---|
| `GET /ordenes/mis-pedidos` y `/mis-pedidos/:codigo` | M08 backend | Disponible |
| Marco del perfil (`PerfilSidebarNav`, `TarjetaSoporte`) | M04 | Disponible; se importan sin modificarlos |
| Fotografía del encabezado (`hero-storefront.png`) | M01 | Disponible; se importa sin copiarla |
| Que una compra genere una orden | M07 Checkout | **No existe.** Las órdenes solo nacen del seed o por inserción directa |

### Hacia adelante

- **M12 Facturación** podrá enlazar el comprobante desde el detalle.
- **M11 Postventa** usará este detalle como entrada a cancelación y devolución.

### Peticiones a otros módulos

- **A M08 backend:** exponer `id_variante_ref` —o la URL de la imagen— en cada línea
  del detalle. La tabla `imagen` guarda imágenes por variante y `linea_orden` ya
  conserva esa referencia, pero el endpoint no la devuelve. Desbloquearía las
  miniaturas del seguimiento y de las tarjetas, que hoy muestran un icono.

---

## 6. ARCHIVOS

### Creados

| Archivo | Propósito |
|---|---|
| `m08-ordenes/m08-ordenes-admin.routes.ts` | Rutas del personal, **fuera de esta entrega** |

### Modificados, dentro del módulo

| Archivo | Cambio |
|---|---|
| `interfaces/ordenes.interface.ts` | Campos nuevos del detalle: historial, modo y costo de entrega, desglose fiscal |
| `services/ordenes.service.ts` | Alineado con el contrato del backend |
| `dtos/estado-pedido.dto.ts` | `MODO_ENTREGA`, `formatearFechaHora`, `formatearFechaCorta`, `secuenciaSegunEntrega`, `descripcionEtapa` |
| `components/PanelSeguimiento.vue` | Historial real, entrega, IVA, dos columnas, aviso de cancelación |
| `components/SeccionMisPedidos.vue` | Solo lista; el detalle pasó a su propia pantalla |
| `components/TarjetaPedido.vue`, `FiltrosPedidos.vue` | Ajuste visual al Figma |
| `views/VistaMisPedidos.vue` | Dos pantallas: listado y seguimiento con encabezado propio |
| `services/ordenes.mock.ts` | Alineado al contrato nuevo |
| `m08-ordenes.routes.ts` | Solo rutas de cliente |

### Fuera del módulo

| Archivo | Cambio | Estado |
|---|---|---|
| `m04-cuentas/views/VistaPerfil.vue` | **11 líneas añadidas, 0 eliminadas**: la sección de pedidos bajo la información personal, como exige el diseño | Requiere aprobación. Ver reporte de parada |

---

## 7. VERIFICACIONES DE CIERRE

| Comprobación | Resultado |
|---|---|
| `vue-tsc --noEmit` | 0 errores |
| `eslint src/modules/m08-ordenes` | 0 errores, 0 advertencias |
| Pantallas abiertas contra el backend real | `/perfil`, `/pedidos`, `/pedidos/:codigo` — todas cargan |
| Archivos de otros equipos modificados | 1, solo con líneas añadidas |

---

## 8. AJUSTES POSTERIORES

| Versión | Cambio |
|---|---|
| `v0.4.1.1` | El encabezado de «Seguimiento de pedido» pasa al tratamiento de «Mi Perfil» (fondo `subaction` con la ilustración a la derecha), en lugar de la fotografía del catálogo. Se conservan la ruta de navegación y los textos. Solicitado en revisión de diseño; sin cambios de funcionalidad ni de contrato. |
| `v0.4.3.0` | Las líneas del pedido pasan a mostrar los **10 campos** que el backend entrega, no 4: descuentos desglosados con su origen y orden (CA-ORD-02-02), precio antes de descuentos, color solicitado, entonado, y aviso de producto retirado del catálogo sin enlace a su ficha (RF-ORD-04-03). |

---

## 9. DICTAMEN

Las dos vistas del cliente están implementadas, contrastadas con el Figma y
verificadas contra datos reales. El módulo no queda cerrado de extremo a extremo
porque **M07 Checkout no existe** y ninguna orden puede originarse en una compra real,
y porque las vistas del personal esperan la aprobación de su diseño.
