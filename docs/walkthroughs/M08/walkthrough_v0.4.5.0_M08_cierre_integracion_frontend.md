# WALKTHROUGH DE IMPLEMENTACIÓN

> 🏷️ **Archivo:** `docs/walkthroughs/M08/walkthrough_v0.4.5.0_M08_cierre_integracion_frontend.md`

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.5.0`
* **Tipo de Incremento:** `Minior-feat` (`X.X.1.X`). Base: `develop` en `v0.4.3.0`; `v0.4.4.0` la ocupa el PR de M05 (`feature/m05-integracion-backend`). Si al hacer merge cambió `develop`, se renumera.
* **Módulo de Origen:** `M08 - Orden de venta`
* **Fecha de Entrega:** `02/10/2026`
* **Autor / Responsable:** `Ibsen Alexis Soto Artunduaga (líder de M05/M08), con apoyo de Agente de IA (frontend)`
* **Rama:** `feature/m08-cierre-integracion` → PR hacia `develop`
* **Estado de la Implementación:** `⚠️ PARCIAL CON DEPENDENCIAS`. Lo que depende de M08 queda cerrado e integrado; lo pendiente depende de M07, M09 y M11, y de la firma del líder técnico al reporte de parada de `v3.31.0` (§8).

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

Esta entrega no añade historias: verifica la integración de las que ya estaban en `develop` y corrige cómo reaccionan las pantallas cuando la API falla.

| ID Historia | Título | Estado de Cobertura | Pantalla / Endpoint |
| :--- | :--- | :---: | :--- |
| **HU-ORD-04** | Consulta del detalle de un pedido | **Corregida**: sin datos de ejemplo ante errores | `/pedidos/:codigo` · `GET /api/ordenes/mis-pedidos/:codigo` |
| **HU-ORD-05** | Ver qué pedidos hay que atender | **Corregida**: Reintentar ante errores del servidor | `/admin/ordenes` · `GET /api/ordenes/gestion` |
| **HU-ORD-07** | Sección de pedidos del cliente | **Corregida**: sin datos de ejemplo ante errores | `/pedidos` (y `/perfil`) · `GET /api/ordenes/mis-pedidos` |
| **HU-ORD-09** | Abrir un pedido con todo lo necesario | **Corregida**: un 5xx ya no se muestra como "no encontrada" | `/admin/ordenes/:codigo` · `GET /api/ordenes/gestion/:codigo` |
| HU-ORD-01, 02, 03, 06, 08, 10, 11 | — | Sin cambios; verificadas de extremo a extremo (§4) | — |

### Descripción del Alcance de la Versión

**1. Estado de la integración (verificado, sin cambios de código).** El backend (PRs #1033 a #1039) y el frontend (#1045) de M08 ya estaban los dos en `develop`. Las 7 ramas `feature/m08-*` no tienen contenido pendiente: cada versión de cada archivo ya estuvo en el historial de `develop` y fue superada. El contrato se comparó **contra la API real**: los 9 endpoints coinciden campo a campo con `frontend/src/modules/m08-ordenes/interfaces/ordenes.interface.ts` en los 13 tipos de respuesta de lectura, y en los 3 de escritura (`NotaInterna`, `ContactoRegistrado`, `ResultadoCambioEstado`) por revisión de código.

**2. Defecto corregido: datos de ejemplo ante errores.** Si la API respondía 5xx o la red fallaba, la lista de pedidos mostraba `PEDIDOS_MOCK` (con un aviso) y **el detalle mostraba `DETALLE_MOCK` sin ningún aviso**: un pedido del seed, con otra dirección, presentado como si fuera del cliente. Se eliminó `ordenes.mock.ts` y las 4 pantallas muestran ahora un estado de error con **Reintentar** y ningún dato.

| Commit | Qué cambia |
| :--- | :--- |
| `b6ef31e` | **Cliente:** elimina `services/ordenes.mock.ts`. Nuevos `composables/clasificarErrorCarga.ts` (401 → `sesion`, 403/404 → `no_encontrado`, el resto → `servidor`) y `components/EstadoErrorCarga.vue` (mensaje y botón Reintentar). `useMisPedidos` expone `tipoError` y, con error, no afirma "Todavía no tienes pedidos". `PanelSeguimiento` muestra el estado de error en vez del mock. |
| `a6caa2f` | **Personal:** `VistaDetalleOrdenAdmin` mostraba un 5xx o una caída de red como "Orden no encontrada"; ahora muestra el estado de error con Reintentar. `VistaGestionOrdenes` ofrece Reintentar solo para fallos del servidor o de red (no para 401/403). |
| `54bbf7a` | **Personal:** `Alert` del core recibe `variant`, no `tone`. Con `tone`, los avisos de error de la bandeja y del modal, y el de éxito del detalle, salían con el estilo de información. |
| `ab3e362` | Tipado del montaje de componentes en las pruebas (`vue-tsc -b` también revisa los tests). |

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de comportamiento ante errores

| Respuesta | Pantallas del cliente | Pantallas del personal |
| :--- | :--- | :--- |
| `401` | "Inicia sesión…" / "Pedido no encontrado" (sin cambios) | "Tu sesión expiró" (sin cambios) |
| `403` / `404` | "Pedido no encontrado"; ajeno e inexistente responden igual (CA-SEG-03-06) | "Orden no encontrada" (detalle) / "falta el permiso ventas.ver" (bandeja) |
| `5xx`, `502` de nginx, sin respuesta (red, timeout, CORS) | **Error + Reintentar, ningún dato** | **Error + Reintentar, ningún dato** |

- Nunca se muestran datos que no vienen del servidor para el usuario autenticado.
- "Reintentar" repite la misma consulta; no recarga la página ni pierde la sesión.

### B. Políticas Transversales Validadas (Checklist de Cierre)

**1. Unicidad de Cuentas (`HU-CUE-08`)**
- [x] **No aplica de forma directa.** M08 no crea ni modifica cuentas; la orden se asocia al `id_usuario` de la sesión (consultas) o al que envía M07 (creación).

**2. Control de Acceso en Servidor (`HU-ADM-03` / `HU-SEG-03`)**
- [x] **Validación en backend:** todas las rutas de M08 exigen `guardas.sesionVigente()`; `/gestion` exige `ventas.ver` y las escrituras `ventas.gestionar`. El frontend no decide permisos.
- [x] **Verificado en vivo** con dos empleados creados solo en la BD desechable: sin `ventas.ver` → `403` en bandeja, resumen y detalle; con `ventas.ver` pero sin `ventas.gestionar` → `200` al leer y `403` al cambiar estado o crear nota. El cliente en `/gestion` → `403`.
- [x] **Respuestas genéricas y auditadas:** `403` con "No tiene autorización para realizar esta operación"; cada denegación queda en el log como `[M20][ACCESO_DENEGADO]` con usuario, operación y motivo (`PERMISO_AUSENTE`, `TITULARIDAD_AJENA`, `SESION_AUSENTE`).

**3. No Exposición de Datos Sensibles (`HU-SEG-06`)**
- [x] **Sin datos de otros clientes en pantalla:** se eliminó el único camino que mostraba pedidos ajenos (el mock).
- [x] **Payload mínimo del cliente:** el detalle del cliente no incluye notas, contactos, autor ni motivo del historial (verificado en vivo).
- [x] **Errores seguros:** `404` idéntico byte a byte para un pedido ajeno y uno inexistente.
- [x] **Cero contraseñas o datos de pago:** sin cambios; M08 no los maneja.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

### 🔹 Pruebas automatizadas del frontend (vitest, 24 nuevas)

| Archivo | Pruebas | Qué fija |
| :--- | :---: | :--- |
| `tests/estados-error-cliente.test.ts` | 12 | `clasificarErrorCarga`; `useMisPedidos`, `SeccionMisPedidos` y `PanelSeguimiento` con un 500 y con un error de red: **no aparece ningún dato** (ni códigos ni dirección del antiguo mock), Reintentar vuelve a consultar y muestra datos reales, y el 404 sigue diciendo "Pedido no encontrado". |
| `tests/estados-error-personal.test.ts` | 12 | `VistaDetalleOrdenAdmin` con 500 o red → error + Reintentar, no "Orden no encontrada"; 401/403/404 conservan su estado; `VistaGestionOrdenes` con 500 o red → Reintentar y ninguna orden; 401/403 sin Reintentar; el aviso usa el estilo de peligro. |

Las pruebas se ejecutaron también contra el código de `develop`: del cliente fallan 10 de 12, del personal fallan las 6 de error del servidor, y la de estilo falla con `tone`. Las que siguen pasando son las que deben pasar con ambas versiones.

### 🔹 Verificación de extremo a extremo (stack `docker-compose.dev.yml`, BD desechable)

| Verificación | Método | Resultado |
| :--- | :--- | :---: |
| Backend M08 sin cambios | `m08.test.ts` 117/117 · `m08.integracion.test.ts` 36/36 (solo lectura) | ✅ **CUMPLIDO** |
| Cliente: lista, búsqueda, detalle, ajeno = inexistente, 401, 403 en `/gestion` | `flujo-m08.sh`, pasos 1 a 7 | ✅ **CUMPLIDO** |
| Personal: bandeja, filtros, orden, contadores, detalle | Pasos 8 a 13 | ✅ **CUMPLIDO** |
| Ciclo de estados: avanzar, inválida `409`, cancelar `409 OPERACION_NO_HABILITADA`, retroceso sin motivo `400`, con motivo `200` | Pasos 14 a 20 | ✅ **CUMPLIDO** |
| Nota `201`, editarla `405 NOTA_INMUTABLE`, contacto `201`, historial con autor, compras anteriores sin la orden actual | Pasos 21 a 25 | ✅ **CUMPLIDO** |
| El cliente no ve notas, contactos ni autor | Pasos 15 y 26 | ✅ **CUMPLIDO** |
| Permisos: sin `ventas.ver` y solo lectura | Pasos 27 a 30 | ✅ **CUMPLIDO** |
| Backend detenido: las 4 pantallas reciben `502` de nginx (clasificado como `servidor`); al levantarlo, los mismos tokens responden `200` | `docker stop` / `docker start` + `curl` vía `:8081` | ✅ **CUMPLIDO** |
| Aviso al cliente por M18 al despachar | Bitácora `GET /api/notificaciones/bitacora`: `CAMBIO_ESTADO_ORDEN`, `orden: ORD-2026-0001`, `nuevoEstado: Despachado`, plantilla `cambio_estado_orden`, estado `enviado`, 1 intento (`2026-10-02T19:57:57Z`) | ✅ **CUMPLIDO** (ver limitaciones) |
| Las 4 pantallas en el navegador con el backend detenido: Reintentar y ningún dato; al levantarlo, Reintentar carga los datos reales | Prueba manual del líder del módulo | ⏳ **PENDIENTE DE CONFIRMAR** |

**Limitaciones de la prueba de M18:** la bitácora de M18 vive en memoria (`EnvioRepository` usa un `Map`; no hay tabla en la BD) y se pierde al reiniciar el backend; el envío fue simulado (`SMTP_SIMULACION=true`); y M08 solo notifica en `despachado` (`ESTADOS_QUE_NOTIFICAN`), por lo que los cambios a revisión o preparación no generan correo, como está diseñado.

**Verificaciones estáticas:** `vue-tsc -b` y `eslint` en **0/0 para M08**; los totales globales no cambian respecto de `develop` (11 y 12, todos ajenos a M08, §9). `vitest run` 43/43 en todo el frontend. `vite build` correcto.

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (¿Qué necesita para operar al 100% en producción?)

- **M20 Seguridad:** guardas `sesionVigente` y `requierePermiso`, y registro de accesos denegados.
- **M17 Permisos:** `ventas.ver` y `ventas.gestionar` asignados a los roles del personal.
- **M18 Notificaciones:** `notificarCambioEstadoOrden` con SMTP real configurado.
- **M04 Cuentas:** login y token en `localStorage.access_token`, que adjunta el interceptor de `core/api/axios.ts`.

### B. Dependencias Hacia Adelante (¿A qué habilita?)

- **M11 Postventa:** usará el detalle de la orden como entrada a cancelación y devolución.
- **M07 Checkout:** cuando exista, llamará a `serviciosOrdenes.creacion.crearDesdePagoConfirmado()`.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ **Verificación de Límites de Módulo:** todos los cambios de código están en `frontend/src/modules/m08-ordenes/`. No se tocó el backend, el core, M04 (`VistaPerfil.vue` solo usa `SeccionMisPedidos` con las mismas props), `bd/` ni `docs/reviews/`.

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[ELIMINADO]** | `frontend/src/modules/m08-ordenes/services/ordenes.mock.ts` | Datos de ejemplo que se mostraban ante errores. |
| **[NUEVO]** | `frontend/src/modules/m08-ordenes/composables/clasificarErrorCarga.ts` | Clasifica un error de carga en sesión, no encontrado o servidor. |
| **[NUEVO]** | `frontend/src/modules/m08-ordenes/components/EstadoErrorCarga.vue` | Estado de error con botón Reintentar. |
| **[MODIFICADO]** | `frontend/src/modules/m08-ordenes/composables/useMisPedidos.ts` | Sin mock; expone `tipoError`. |
| **[MODIFICADO]** | `frontend/src/modules/m08-ordenes/components/SeccionMisPedidos.vue` | Estado de error con Reintentar. |
| **[MODIFICADO]** | `frontend/src/modules/m08-ordenes/components/PanelSeguimiento.vue` | Estado de error con Reintentar en vez del mock. |
| **[MODIFICADO]** | `frontend/src/modules/m08-ordenes/views/admin/VistaDetalleOrdenAdmin.vue` | Error del servidor separado de "no encontrada"; `Alert` con `variant`. |
| **[MODIFICADO]** | `frontend/src/modules/m08-ordenes/views/admin/VistaGestionOrdenes.vue` | Reintentar en el aviso de error; `Alert` con `variant`. |
| **[MODIFICADO]** | `frontend/src/modules/m08-ordenes/components/admin/ModalCambiarEstado.vue` | `Alert` con `variant`. |
| **[NUEVO]** | `frontend/src/modules/m08-ordenes/tests/estados-error-cliente.test.ts` | 12 pruebas vitest. |
| **[NUEVO]** | `frontend/src/modules/m08-ordenes/tests/estados-error-personal.test.ts` | 12 pruebas vitest. |
| **[NUEVO]** | `docs/walkthroughs/M08/walkthrough_v0.4.5.0_M08_cierre_integracion_frontend.md` | Este documento. |
| **[MODIFICADO]** | `.github/version.txt` · `docs/CHANGELOG.md` | `0.4.3.0` → `0.4.5.0` y entrada correspondiente. |

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (vitest 43/43 · `vue-tsc` y `eslint` 0/0 en M08 · backend 117/117 y 36/36 · 30 pasos de API en el stack completo). La prueba manual en navegador queda **pendiente de confirmar** (§4).
* **Apego al Diagrama de Flujo:** `✅ Coincidente con la máquina de estados` (`docs/assets/diagrams/M08/Maquina_de_estados_de_la_Orden.drawio.png`), verificada en vivo: transiciones válidas, retroceso con motivo y estados bloqueados por M11.
* **Cierre del módulo:** M08 está integrado y cerrado en todo lo que depende de M08. No puede declararse cerrado de extremo a extremo por las dependencias de §8.

---

## 8. PENDIENTES FUERA DE ALCANCE

| # | Pendiente | Requisito / Criterio | Depende de |
| :---: | :--- | :--- | :--- |
| 1 | Ninguna compra real genera una orden: nadie llama a `serviciosOrdenes.creacion.crearDesdePagoConfirmado()`. Las órdenes solo existen por el seed. | HU-ORD-01, CA-ORD-01-06 | **M07 Checkout y pago** (sin responsable ni especificación). Se preparará una propuesta de M07 mínimo para el líder técnico. |
| 2 | Verificación de disponibilidad por línea. | CA-ORD-03-02 | **M09 Cumplimiento** |
| 3 | Cancelación y devolución. | CA-ORD-03-05, 03-08, 03-09, 03-10, 06-03 | **M11 Postventa** (política del negocio) |
| 4 | **El reporte de parada del frontend de M08 sigue sin firma.** `REPORTE_PARADA_v3.31.0_archivos_compartidos.md` está en "EJECUCIÓN DETENIDA — pendiente de aprobación del Líder Técnico", con las 3 casillas sin marcar (`m04-cuentas/views/VistaPerfil.vue`, `core/routes/index.ts`, `core/layouts/LayoutAdmin.vue`), aunque esos cambios están en `develop` desde el #1045. El comentario de `core/routes/index.ts` también lo indica. Este walkthrough no modifica el reporte: la firma corresponde al líder técnico. | Protocolo de parada (`AGENTS.md`) | **Líder técnico** |
| 5 | Prueba manual en navegador de las 4 pantallas con el backend detenido. | §4 | Líder del módulo |

---

## 9. HALLAZGOS PARA EL EQUIPO

| # | Hallazgo | Dónde | Responsable sugerido |
| :---: | :--- | :--- | :--- |
| 1 | **`npm run build` falla en `develop`**: ejecuta `vue-tsc -b`, que da 11 errores, todos en `m01-catalogo/views/publicas/VistaCatalogoPublico.vue`. Docker no se ve afectado porque su Dockerfile ejecuta solo `vite build`. | `frontend/` | Equipo de M01 |
| 2 | **Lint pendiente en `m05-carrito-compras/preview/vite.config.mjs`** (parte de los 12 problemas de `eslint src`). Es nuestro; se corregirá en un PR aparte. | Frontend de M05 | Líder de M05/M08 |
| 3 | **La bitácora de M18 vive en memoria**: `EnvioRepository` usa un `Map` y no persiste en la BD; se pierde con cada reinicio. RF-NOT-01-04 pide un registro auditable. | `backend/src/modules/m18-notificaciones/repositories/envio.repository.ts` | Equipo de M18 |
| 4 | **La matriz de trazabilidad no tiene filas de HU-ORD** (solo menciona M08 en las filas de M18). | `docs/00_SISTEMA/01_ARQUITECTURA/MATRIZ_TRAZABILIDAD.md` | Analista / líder técnico |
| 5 | **`ARQUITECTURA_GENERAL.md` llama a M07 "Checkout y Carrito"** (numeración antigua: hoy el carrito es M05). Explica por qué los botones del catálogo de M01 dicen "requiere la integración con M07". | `docs/00_SISTEMA/01_ARQUITECTURA/ARQUITECTURA_GENERAL.md` | Líder técnico |
| 6 | **`docker-compose.dev.yml` no arranca en hosts con SELinux en modo enforcing** (Fedora, RHEL): monta `./bd/sql:/docker-entrypoint-initdb.d:ro` sin `:z`, y Postgres falla con `Permission denied`. `docker-compose.yml` ya usa `:ro,Z` para `bd/sql` en el servicio `backend`. Propuesta: `:ro,z` en un PR aparte. | `docker-compose.dev.yml` | Dueño de la infraestructura |
| 7 | **`ALLOWED_ORIGINS` de `docker-compose.dev.yml` no incluye el frontend local**: el login y todo POST/PUT/DELETE desde el navegador responden `500` con `FRONTEND_PORT` 8080 (el valor por defecto del compose) y también en el puerto 80, porque el navegador envía `Origin: http://localhost` sin `:80`. | `docker-compose.dev.yml` | Dueño de la infraestructura |
