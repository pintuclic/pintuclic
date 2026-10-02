# WALKTHROUGH DE IMPLEMENTACIÓN

**M08 — Orden de venta · Vistas de gestión del personal (Frontend)**

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

| Campo | Valor |
|---|---|
| **Versión** | `v0.4.2.0` |
| **Tipo de incremento** | MINOR — tres vistas nuevas |
| **Módulo** | M08 — Orden de venta |
| **Capa** | Frontend |
| **Alcance** | Vistas del **personal**. Las del cliente se entregaron en `v0.4.1.0` |
| **Rama** | `feature/m08-orden-venta` |
| **Fecha** | 2026-10-01 |
| **Depende de** | Backend M08 en `develop` (commit `f12cc3e`) |

---

## 2. HISTORIAS DE USUARIO CUBIERTAS

| HU | Vista | Ruta |
|---|---|---|
| HU-ORD-05 · HU-ORD-08 | Gestión de órdenes | `/admin/ordenes` |
| HU-ORD-09 · HU-ORD-04 | Detalle de orden administrativa | `/admin/ordenes/:codigo` |
| HU-ORD-03 | Cambiar estado de la orden | Modal sobre el detalle |

Con esta entrega quedan maquetadas **las cinco vistas de M08** del listado oficial.

### Alcance

Tres pantallas para el personal con permiso `ventas.ver`, construidas sobre el lenguaje
visual de los paneles ya aprobados del proyecto: tarjetas de resumen con icono en caja de
color, y un único panel que agrupa filtros y listado, como «Gestión de empleados» (M17) y
«Productos» (M01).

**No existía diseño en Figma para estas pantallas.** Se elaboró una propuesta documentando
el sistema visual del que parte y las restricciones técnicas que la condicionan.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS APLICADAS

- **La máquina de estados es del servidor.** El modal ofrece exclusivamente los estados que
  el backend devuelve en `transiciones_permitidas`. El frontend no deduce, no ordena y no
  infiere ninguna transición. Si el array llega vacío, la orden se presenta como estado
  final y el botón «Cambiar estado» ni siquiera se renderiza.
- **`dias_esperando` (CA-ORD-05-07)** se destaca en la bandeja: neutro por debajo de 3 días,
  ámbar de 3 a 4, rojo desde 5. El umbral de color es decisión de presentación; el dato
  viene calculado del servidor.
- **Paginación y filtrado del servidor.** La bandeja no recorta nada en cliente.
- **HU-SEG-03 — Autorización en servidor.** Ninguna vista comprueba permisos por su cuenta.
  `ventas.ver` y `ventas.gestionar` los valida el backend en cada petición.
- **CA-SEG-03-06.** 403 y 404 se presentan igual, de modo que no se puede distinguir una
  orden inexistente de una no visible. El 401 sí se separa y se identifica como sesión
  expirada.
- **HU-SEG-06 — Datos sensibles.** El contacto del cliente, las notas internas y los
  contactos registrados solo aparecen en la vista del personal.
- **Directiva 12.** La regla «cancelar o devolver exige motivo» vive en
  `dtos/cambio-estado.dto.ts`, no dentro del componente.

---

## 4. CRITERIOS DE ACEPTACIÓN COMPROBADOS

Verificado contra el backend y la base de datos reales.

| Criterio | Comprobación | Resultado |
|---|---|---|
| CA-ORD-05-01 | `PC-2026-00102` de «En preparación» a «Preparada» desde el modal | Registrado en `historial_estado_orden` con autor y fecha |
| CA-ORD-05-01 | `PC-2026-00104` (entregado) devuelve `transiciones_permitidas: []` | El botón no se renderiza |
| CA-ORD-05-05 | `GET /gestion/resumen` | Devuelve los 8 estados, incluidos los que están en cero |
| CA-ORD-05-07 | Columna «Parada» | De 1 a 35 días, con el realce por umbral |
| CA-ORD-08-02 | `?correo=` y `?telefono=` | 5 órdenes por cada criterio |
| CA-ORD-09-01 | Detalle administrativo | Muestra nombre, correo y teléfono del titular |
| CA-ORD-09-02 | Historial del detalle | Muestra autor y motivo de cada cambio |
| HU-SEG-03 | Cliente accediendo a `/gestion` | 403 del servidor |
| Bloqueo de M11 | `PATCH .../estado` con `cancelado` | `409 OPERACION_NO_HABILITADA` |

---

## 5. DEPENDENCIAS EXTERNAS

### Hacia atrás

| Necesita | De quién | Estado |
|---|---|---|
| `GET /gestion`, `/gestion/resumen`, `/gestion/:codigo` | M08 backend | Disponible |
| `PATCH /gestion/:codigo/estado` | M08 backend | Disponible |
| Permisos `ventas.ver` y `ventas.gestionar` | M17 | Disponible para el rol administrador |
| Verificación de disponibilidad por línea | M09 | **No existe el módulo** |
| Cancelación y devolución | M11 | **Sin política de negocio** |

### Endpoints disponibles aún sin interfaz

De los siete endpoints del personal, esta entrega usa cuatro. Quedan sin maquetar, a la
espera de decisión:

| Función | Historia | Endpoint |
|---|---|---|
| Escribir una nota interna | HU-ORD-10 | `POST /gestion/:codigo/notas` |
| Registrar un contacto con el cliente | CA-ORD-09-03 | `POST /gestion/:codigo/contactos` |
| Ver compras anteriores del cliente | HU-ORD-11 | `GET /gestion/:codigo/historial-cliente` |

---

## 6. ARCHIVOS

### Creados, dentro del módulo

| Archivo | Propósito |
|---|---|
| `views/admin/VistaGestionOrdenes.vue` | Bandeja del personal |
| `views/admin/VistaDetalleOrdenAdmin.vue` | Detalle administrativo |
| `components/admin/ModalCambiarEstado.vue` | Modal de cambio de estado |
| `dtos/cambio-estado.dto.ts` | Esquema de validación del cambio de estado |
| `m08-ordenes-admin.routes.ts` | Rutas del personal, separadas de las del cliente |

### Fuera del módulo — requieren aprobación

| Archivo | Cambio |
|---|---|
| `core/routes/index.ts` | Montar `ordenesAdminRoutes` en el bloque `/admin`. Incluye además la ruta del carrito de M05, que estaba en el repositorio sin registrar |
| `core/layouts/LayoutAdmin.vue` | Entrada «Órdenes» en el acordeón «Gestión Administrativa». 5 líneas añadidas, 0 eliminadas |

Ver `REPORTE_PARADA_v3.31.0_archivos_compartidos.md`.

---

## 7. VERIFICACIONES DE CIERRE

| Comprobación | Resultado |
|---|---|
| `vue-tsc --noEmit` | 0 errores |
| `eslint src/modules/m08-ordenes` | 0 errores, 0 advertencias |
| Pantallas abiertas contra el backend real | `/admin/ordenes` y `/admin/ordenes/:codigo` cargan y operan |
| Cambio de estado real | Ejecutado y registrado en base de datos |

---

## 8. AJUSTES POSTERIORES

| Versión | Cambio |
|---|---|
| `v0.4.2.1` | Alta de **notas internas** (HU-ORD-10) y **registro de contactos** (CA-ORD-09-03) desde el detalle administrativo. Daban uso a dos endpoints que el backend ya exponía y la interfaz no consumía. Con ellos M08 pasa a usar seis de los siete endpoints del personal; queda pendiente el historial de compras del cliente (HU-ORD-11). |

---

## 9. DICTAMEN

Las tres vistas del personal están implementadas y verificadas contra datos reales. Con
ellas, M08 completa sus cinco vistas en el frontend.

El módulo no queda cerrado de extremo a extremo por causas ajenas a esta capa: **M07
Checkout no existe**, de modo que ninguna orden puede originarse en una compra real; **M09
Cumplimiento no existe**, por lo que la verificación de disponibilidad por línea se hace a
mano; y **M11 Postventa carece de política**, por lo que cancelar y devolver siguen
rechazados por el servidor.
