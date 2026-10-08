# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v3.31.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M08 - Orden de venta`
* **Capa:** `Frontend`
* **Fecha de Entrega:** `24/09/2026`
* **Autor / Responsable:** `Yessica Jaramillo, con apoyo de Agente de IA`
* **Estado de la Implementación:** `⚠️ PARCIAL CON DEPENDENCIAS` (parte de cliente completa; parte administrativa bloqueada por ausencia de endpoints)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

Construido sobre los endpoints de consulta entregados por el backend en `v3.30.0` y
montados en `v3.30.1`.

| ID Historia | Título | Cobertura | Componentes desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-ORD-07** | Sección de pedidos del cliente | ✅ Cumplida | `SeccionMisPedidos`, `TarjetaPedido`, `FiltrosPedidos`, `PaginacionPedidos`, `useMisPedidos` |
| **HU-ORD-04** | Consulta del detalle de un pedido | ⚠️ Parcial | `PanelSeguimiento` |
| **HU-ORD-02** | Conservación histórica de la orden | ⚠️ Parcial (lectura) | Detalle de la compra sin consultar el catálogo |
| **HU-ORD-06** | Identificación de la orden | ✅ Cumplida | Código visible como único identificador en rutas y vistas |
| **HU-ORD-01** | Generación de la orden tras el pago | ⛔ Bloqueada | — |
| **HU-ORD-03** | Ciclo de vida y estados | ⛔ Bloqueada | — |
| **HU-ORD-05** | Gestión de órdenes (administrador) | ⛔ Bloqueada | — |

### Descripción del Alcance

El cliente autenticado consulta su sección de pedidos, separada en *en curso* y
*finalizados* tal como la devuelve el backend, con buscador, filtros por estado y
paginación. Al abrir un pedido, el seguimiento se despliega **a la derecha de la lista
en la misma pantalla**, sin navegar a otra vista, conforme a lo acordado con diseño.

La parte administrativa queda fuera: el backend de M08 es de solo lectura y no expone
listado de órdenes ni operaciones de escritura.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS APLICADAS

### A. Reglas específicas del módulo

- **RF-ORD-06-01 / ADR-04:** el código visible es el único identificador que viaja en
  las rutas (`/pedidos/:codigo`). La clave primaria nunca se expone ni se acepta.
- **HU-ORD-02 / ADR-05:** el detalle se pinta con la copia guardada en la orden. No se
  consulta el catálogo vivo, así que un cambio posterior no altera lo mostrado.
- **CA-ORD-07-01:** la agrupación *en curso* / *finalizados* la resuelve el backend; la
  vista solo pinta los dos arreglos recibidos, sin reclasificar.
- **Importes:** llegan como texto (`NUMERIC` de PostgreSQL). Se formatean con
  `Intl.NumberFormat('es-CO')` al pintarlos y **no se realiza ninguna suma en cliente**:
  se usan `sub_total`, `descuento` y `total` tal como vienen.
- **Fechas:** `AAAA-MM-DD` sin hora; se construyen en local para no correr el día.

### B. Políticas transversales validadas

- 🛡️ **M20 / HU-SEG-03 — Autorización en servidor:** la interfaz no decide permisos.
  Las tres llamadas viajan con `Authorization: Bearer` y es el backend quien autoriza.
- 🔒 **M20 / CA-SEG-03-06 — Recurso inalcanzable:** un pedido de otro titular responde
  `404` igual que uno inexistente. La vista muestra **el mismo mensaje neutro** en ambos
  casos, sin distinguirlos.
- 👁️ **M20 / HU-SEG-06 — Datos sensibles:** no se solicita ni se muestra ningún dato que
  el backend no exponga (id interno, id de cliente en la vista pública, transacción de
  pago).
- 📧 **M18:** no aplica; el módulo no dispara notificaciones.
- 🆔 **M04 / HU-CUE-08:** no aplica; el módulo no crea ni modifica cuentas.

### C. Cumplimiento del estándar de frontend (`frontend/infraestructura.md`)

| Punto | Estado |
| :--- | :---: |
| Nomenclatura `m[xx]-[nombre]` en kebab-case (§5) | ✅ `m08-ordenes` |
| Estructura `views/ components/ services/ composables/ dtos/ interfaces/` (§1) | ✅ |
| `interfaces/` con cero runtime (§5.1) | ✅ solo `interface` y `type` |
| Sin esquemas Zod inline en `.vue` (§5.3) | ✅ |
| Consumo del `apiClient` centralizado (§2) | ✅ única importación externa del módulo |
| Paleta oficial, sin hexadecimales ni clases ajenas (§4.2) | ✅ verificado, 0 coincidencias |
| Diseño responsivo mobile-first (§4.3) | ✅ una columna en móvil, dos desde `lg` |

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

| ID Criterio | Criterio (resumen) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-ORD-07-01** | Listado separado en curso / finalizados con identificador, fecha, total y estado | Prueba manual contra PostgreSQL local con 5 pedidos | ✅ **CUMPLIDO** |
| **CA-ORD-07-02** | Un pedido entregado aparece entre los finalizados | Prueba manual (`ORD-2026-0104`) | ✅ **CUMPLIDO** |
| **CA-ORD-07-03** | El buscador filtra el listado según lo escrito | Búsqueda por código y por producto, con retardo de 350 ms | ✅ **CUMPLIDO** |
| **CA-ORD-04-01** | El detalle muestra productos, cantidades, precios, total y estado | Prueba manual | ⚠️ **PARCIAL** (sin modo de entrega) |
| **CA-ORD-04-02** | Si llevaba color entonado, figura el color pedido | Se muestra la variante copiada | ⚠️ **PARCIAL** (embebido en el texto) |
| **CA-ORD-04-03** | Abrir una orden ajena se rechaza | Código inexistente → pantalla neutra idéntica | ✅ **CUMPLIDO** |
| **CA-ORD-06-02** | El identificador corresponde a una única orden | Navegación por código visible | ✅ **CUMPLIDO** |
| **CA-ORD-02-01** | La orden conserva el precio aunque cambie el catálogo | El detalle no consulta el catálogo | ✅ **CUMPLIDO** |

Estados de interfaz cubiertos: carga (esqueletos), cliente sin pedidos, búsqueda sin
resultados, sesión no iniciada, pedido no encontrado, pedido cancelado y fallo de red
(respaldo con mocks señalizado al usuario).

---

## 5. DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias hacia atrás

- **Backend M08 (`v3.30.0` / `v3.30.1`):** los tres endpoints de consulta.
- **Core:** `src/core/api/axios.ts` (única importación externa del módulo).
- **M20:** el token de sesión debe estar en `localStorage` bajo la clave `access_token`,
  que es la que lee el interceptor de Axios.

### B. Dependencias hacia adelante

- **M04:** puede incrustar `SeccionMisPedidos` en la página de perfil.

### C. ⛔ Bloqueos y carencias del backend

Cada punto está marcado en el código con un comentario `⚠️ FALTA EN EL BACKEND`.

| # | Carencia | Efecto en la interfaz |
| :-- | :--- | :--- |
| 1 | **No hay historial de estados.** La API solo devuelve `estado` | La línea de tiempo **deduce** los pasos recorridos del orden del enum. No es un historial real, por eso la vista advierte que las fechas por etapa no están disponibles |
| 2 | El listado no devuelve el número de líneas | «N productos» se obtiene consultando el detalle de cada tarjeta visible: **11 peticiones para pintar 5 pedidos** |
| 3 | El listado no admite filtros ni paginación | Ambos se resuelven en cliente sobre el conjunto completo |
| 4 | `linea_orden` no guarda imagen | La miniatura se pinta como marco neutro |
| 5 | Sin columna de modo de entrega, transportadora ni guía | Se omiten; dependen de M10 |
| 6 | Sin columna de costo de envío ni porcentaje de IVA | Se omiten del resumen |
| 7 | Los estados del enum no coinciden con el diagrama oficial | Se usan los seis de la base de datos. El mapa está centralizado en `dtos/estado-pedido.dto.ts` para cambiarlo en un solo punto |

### D. Peticiones al equipo de backend, por impacto

1. Tabla de historial de estados (fecha y autor por paso).
2. Campo `cantidad_lineas` en el listado.
3. Filtros y paginación en `mis-pedidos`.
4. `GET /api/ordenes` con filtros y paginación, para la vista administrativa.
5. Endpoint de cambio de estado.

---

## 6. REGISTRO DE ARCHIVOS CREADOS Y MODIFICADOS

Todos dentro del módulo asignado. **Ningún archivo de otro módulo fue modificado.**

| Acción | Ruta | Contenido |
| :---: | :--- | :--- |
| **[NUEVO]** | `frontend/src/modules/m08-ordenes/m08-ordenes.routes.ts` | Rutas `/pedidos` y `/pedidos/:codigo` |
| **[NUEVO]** | `.../views/VistaMisPedidos.vue` | Vista de la sección |
| **[NUEVO]** | `.../components/SeccionMisPedidos.vue` | Sección reutilizable con maestro-detalle |
| **[NUEVO]** | `.../components/PanelSeguimiento.vue` | Seguimiento, despacho y detalle de la compra |
| **[NUEVO]** | `.../components/TarjetaPedido.vue` | Tarjeta en modo completo y compacto |
| **[NUEVO]** | `.../components/FiltrosPedidos.vue` | Filtros por estado con iconografía lineal |
| **[NUEVO]** | `.../components/PaginacionPedidos.vue` | Paginación |
| **[NUEVO]** | `.../composables/useMisPedidos.ts` | Carga, búsqueda, filtrado y paginación |
| **[NUEVO]** | `.../services/ordenes.service.ts` | Cliente HTTP de los tres endpoints |
| **[NUEVO]** | `.../services/ordenes.mock.ts` | Respaldo para maquetación sin backend |
| **[NUEVO]** | `.../dtos/estado-pedido.dto.ts` | Mapa de estados, filtros y formateadores |
| **[NUEVO]** | `.../interfaces/ordenes.interface.ts` | Contratos del backend (cero runtime) |
| **[NUEVO]** | `docs/walkthroughs/M08/walkthrough_v3.31.0_...frontend.md` | Este documento |
| **[NUEVO]** | `docs/walkthroughs/M08/REPORTE_PARADA_v3.31.0_archivos_compartidos.md` | Reporte de parada (directiva 3) |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v3.31.0` |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ` (`v3.31.0`)
* **Pruebas de Calidad Superadas:** `✅ SÍ` — `npx vue-tsc --noEmit` y `npx eslint src/modules/m08-ordenes` sin errores ni advertencias
* **Aislamiento de Módulo (Directiva 1):** `✅ SÍ` — solo se crearon archivos dentro de `m08-ordenes/`
* **Paleta Oficial (Directiva 8):** `✅ SÍ` — 0 hexadecimales arbitrarios, 0 estilos inline, 0 clases ajenas a la marca
* **Apego al Diagrama de Flujo:** `⚠️ PARCIAL` — la máquina de estados del diagrama no coincide con el enum de la base de datos (bloqueo 7); se implementan los seis estados que la base admite
* **Estado de Integración:** `⛔ PENDIENTE DE APROBACIÓN` — el módulo no es alcanzable hasta que el Líder Técnico apruebe el registro de rutas descrito en el reporte de parada
