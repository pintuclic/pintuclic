# WALKTHROUGH DE IMPLEMENTACIÓN

> 🏷️ **Archivo:** `docs/walkthroughs/M05/walkthrough_v0.4.4.0_M05_integracion_carrito_backend.md`
> Reemplaza al walkthrough `v3.29.0` de la rama `feature/m05-carrito-compras`, que se renumeró al esquema de cuatro segmentos y se reescribió porque describía rutas (`/api/v1/carrito/visitante/:token`) que no existen en el código.

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.4.0`
* **Tipo de Incremento:** `Minior-feat` (`X.X.1.X`): habilita en `develop` el backend del carrito que consume el frontend de M05 (`v0.3.39.0`). Base: `develop` en `v0.4.3.0`.
* **Módulo de Origen:** `M05 - Carrito de compras`
* **Fecha de Entrega:** `02/10/2026`
* **Autor / Responsable:** `Ibsen Alexis Soto Artunduaga (líder de M05/M08), con apoyo de Agente de IA (backend)`
* **Rama:** `feature/m05-integracion-backend` → PR hacia `develop`
* **Estado de la Implementación:** `⚠️ PARCIAL CON DEPENDENCIAS` (HU-CAR-01 y HU-CAR-02 completas; HU-CAR-04 y HU-CAR-05 dependen de M06, M21 y de definiciones pendientes de la especificación; ver §8)

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints (`/api/carrito`) |
| :--- | :--- | :---: | :--- |
| **HU-CAR-01** | Carrito de visitante | **100% Cumplida** | `GET /visitante` · `POST /visitante/items` |
| **HU-CAR-02** | Gestión de líneas del carrito | **Cumplida** (tope por línea provisional, RF-CAR-02-07 PENDIENTE) | `POST|PUT|DELETE /visitante/items[/:idLinea]` · `POST|PUT|DELETE /cliente/items[/:idLinea]` |
| **HU-CAR-04** | Carrito de cliente | **Parcial**: RF-CAR-04-01 ✅ · RF-CAR-04-02 ❌ (M06) · RF-CAR-04-03 PENDIENTE (decisión provisional) | `GET /cliente` · `POST /cliente/fusionar` |
| **HU-CAR-05** | Revalidación previa a la compra | **Parcial**: stock y estado ✅ · cambio de precio ❌ · cotizaciones ❌ (M21) | `GET /cliente/revalidar` |

Las rutas de visitante identifican el dispositivo con el header `x-visitor-token` (UUID). Las de cliente exigen `Authorization: Bearer` y pasan por `guardas.sesionVigente()` de M20.

### Descripción del Alcance de la Versión

El frontend de M05 ya estaba en `develop`, pero llamaba a 10 endpoints `/api/carrito/*` que el backend de `develop` no tenía. El backend estaba escrito en `feature/m05-carrito-compras`, creada sobre una versión antigua del core. Esta entrega:

1. **Integra** esa rama en `develop`: monta `/carrito`, renombra el módulo a la convención `m05-carrito-compras` y corrige una prueba que no compilaba.
2. **Corrige 4 defectos** encontrados al revisarla (D1 a D4) y aplica **4 mejoras** aprobadas por el líder del módulo (B1 a B4), sin cambiar la forma de las respuestas que consume el frontend.
3. **Ajusta la política CORS global** para admitir el header `X-Visitor-Token`, con [reporte de parada](./reporte_parada_v0.4.4.0_M05_cors_x_visitor_token_backend.md) aprobado.

El contrato HTTP coincide campo a campo con `frontend/src/modules/m05-carrito-compras/services/cart.service.ts` e `interfaces/cart.interface.ts`. El único añadido es el campo **opcional** `avisos` de `/cliente/fusionar` (B1).

### Integración y correcciones, commit por commit

| Commit | Tipo | Qué cambia |
| :--- | :--- | :--- |
| `a626909` | Origen | Backend original del carrito (rama `feature/m05-carrito-compras`), traído por el merge. |
| `11196f1` | Integración | Merge `--no-ff` a la rama de integración. Único conflicto en `app.routes.ts`, resuelto conservando `/ordenes` y añadiendo `/carrito`. Se descarta la entrada `[v3.29.0]` del CHANGELOG de la rama (esquema antiguo). |
| `204114a` | Integración | `git mv` de `m05-carritodecompras` a `m05-carrito-compras`; ajuste del import; `ref_viva` en el mock de `LineaCarrito` (la prueba fallaba con `TS2322`). |
| `0415d37` | **D1** | La variante se valida antes de crear la línea: inexistente → `404 VARIANTE_NO_ENCONTRADA`; no activa → `422 VARIANTE_NO_DISPONIBLE`. Antes, un id inválido llegaba a la FK `fk_lineacarrito_variante` y respondía `500`, y se podían agregar variantes inactivas, agotadas o descontinuadas. |
| `0ec1f86` | **D2** | Al acumular sobre una línea existente no se supera el tope: `422 CANTIDAD_MAXIMA_EXCEDIDA` con `maximo` y `cantidad_actual`. El tope vive en una sola constante (`CANTIDAD_MAXIMA_POR_LINEA`). |
| `681f5c0` | **D3** | `x-visitor-token` y el `token_visitante` de `/fusionar` se validan como UUID con Zod (`tokenVisitanteSchema`), normalizados a minúsculas. Ausente → `400 MISSING_VISITOR_TOKEN`; inválido o repetido → `400 INVALID_VISITOR_TOKEN`. |
| `f6f2328` | **D4** | La fusión con un carrito de cliente existente transfiere las líneas, borra el carrito de visitante y refresca el del cliente en **una sola transacción** (`transferirLineasYEliminarOrigen`). Antes, el borrado iba fuera de la transacción: si fallaba, las líneas quedaban duplicadas en ambos carritos. |
| `36f856e` | **B1** | La fusión limita a 999 la línea que se pasaría y lo informa en `avisos` (ver §3.A). |
| `e0d9830` | **B2** | Agregar o acumular es **una sola sentencia atómica**: `INSERT … ON CONFLICT (id_carrito, id_variante) DO UPDATE … WHERE cantidad + excluded.cantidad <= 999`. Con el código anterior, 8 agregados simultáneos dejaban 4 unidades. |
| `76e2cf4` | **B3** | `POST /visitante/items` y `POST /cliente/items` crean el carrito si todavía no existe (antes: `404 "Inicialice el carrito primero"`). La variante se valida antes, para no dejar carritos vacíos. |
| `1396a3f` | **B4** | El controlador toma el cliente de `obtenerIdentidadVigente(req)` (identidad resuelta en vivo por M20), ya no de `req.user`. `:idLinea` se valida con un DTO de Zod; un valor ilegible responde `404 NOT_FOUND`, como en M08 (RF-SEG-03-05). |
| `f9b0d9d` | Prueba B2 | Cobertura explícita del upsert cuando el `WHERE` del `ON CONFLICT` no afecta filas: `RETURNING` vacío → `422`, nunca un éxito silencioso. |
| `76ff12d` | Core (aprobado) | `X-Visitor-Token` en `allowedHeaders` de CORS. Ver reporte de parada. |
| `54db30b` | Sincronización | Merge de `origin/develop` (`v0.4.3.0`, #1045, solo frontend de M08) para numerar sobre la versión vigente. Sin conflictos. |

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo

- **Carrito vivo (RF-CAR-05-04):** el precio y la existencia se leen de `variante` en cada consulta; el carrito no guarda precios.
- **Una línea por variante (RF-CAR-02-0X):** agregar una variante repetida suma la cantidad, con el `UNIQUE uq_carrito_variante` del DDL como respaldo.
- **Solo variantes vendibles:** solo se agregan variantes que existen y están en estado `activo`.
- **Autenticación diferida (RF-CAR-01-02):** las rutas de visitante no exigen sesión; el token opaco no contiene ni pide datos personales (RNF-CAR-01-01).
- **Cantidad 0 en `PUT`:** elimina la línea (comportamiento heredado de la rama).

> ⚠️ **Decisiones provisionales** (la especificación las tiene como PENDIENTE; deben confirmarse con el analista):
>
> | Decisión | Requisito pendiente | Comportamiento implementado |
> | :--- | :--- | :--- |
> | Tope de **1 a 999 unidades por línea** | RF-CAR-02-07 | DTOs (agregar y actualizar), acumulación (D2/B2) y fusión (B1) usan la misma constante `CANTIDAD_MAXIMA_POR_LINEA`. Cambiar el valor es un cambio de una línea. |
> | **Fusionar sumando** si el cliente ya tenía carrito | RF-CAR-04-03 | Las variantes repetidas se suman y las nuevas se transfieren; el carrito de visitante desaparece. Si el cliente no tenía carrito, el del visitante pasa a su cuenta. |
> | **B1: limitar a 999 y avisar** en la fusión | RF-CAR-04-03 | Si una suma supera el tope, la línea queda en 999 en lugar de rechazar la fusión (que bloquearía el inicio de sesión). La respuesta de `/cliente/fusionar` incluye `avisos: [{ tipo: 'cantidad_ajustada_al_maximo', id_variante, cantidad_solicitada, cantidad_aplicada, descripcion }]` **solo cuando hubo ajustes**; sin ajustes la respuesta conserva su forma original y el frontend actual no se ve afectado. |

### B. Políticas Transversales Validadas (Checklist de Cierre)

**1. Unicidad de Cuentas (`HU-CUE-08`)**
- [x] **Identificador único / no solapamiento / validación de unicidad:** **No aplica de forma directa.** M05 no crea ni modifica cuentas ni correos. El carrito se asocia al `id_usuario` de la identidad que M20 resolvió contra la base, nunca a un dato del cuerpo de la petición.

**2. Control de Acceso en Servidor (`HU-ADM-03` / `HU-SEG-03`)**
- [x] **Validación en backend:** las 6 rutas de cliente exigen `guardas.sesionVigente()` (JWT + sesión viva en la tabla `sesion` + cuenta activa, en cada petición). Las 4 de visitante son públicas por diseño (RF-CAR-01-01), pero el token se valida como UUID (D3).
- [x] **GET igual de protegido que POST/PUT/DELETE:** `GET /cliente` y `GET /cliente/revalidar` usan la misma guarda que las escrituras.
- [x] **Evaluación en tiempo real:** la identidad se resuelve en cada petición y el controlador la lee con `obtenerIdentidadVigente(req)` (B4); un `req.user` puesto a mano no basta (prueba B4-02).
- [x] **Titularidad y respuestas uniformes:** el carrito se elige por la identidad, nunca por un id enviado por el cliente. Una línea ajena, una inexistente o un `:idLinea` ilegible responden igual: `404` (RF-SEG-03-05, B4-04 a B4-07). Sin sesión: `401` genérico.
- [x] **Permisos de empleado (M17):** no aplica; la especificación lo marca N/A (uso libre por clientes).

**3. No Exposición de Datos Sensibles (`HU-SEG-06`)**
- [x] **Payloads mínimos:** cada respuesta contiene solo el carrito del propio titular. Incluye `id_carrito`, `id_usuario` y `token_visitante`, que exige el contrato del frontend y pertenecen al mismo titular.
- [x] **Cero contraseñas o hashes:** el módulo no consulta tablas de credenciales y `sendSuccess` aplica `sanearRespuesta` de M20.
- [x] **Cero datos de pago:** el carrito no almacena ni recibe datos de instrumentos de pago.
- [x] **Protección B2B:** solo se expone `variante.precio_vigente` (precio público). No hay precios de empresa porque M06 no existe (§8).
- [x] **Errores seguros:** los errores de negocio son `AppError` con mensajes funcionales; los no controlados pasan por `errorHandler` con mensaje genérico. D1 elimina el único `500` que el módulo producía por entradas del usuario.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

> La especificación de M05 **no define criterios Gherkin (CA-CAR-*)**; la matriz se construye sobre sus requisitos (RF/RNF). Los IDs de la columna "Prueba" corresponden a las suites de `__tests__/`.

| Requisito | Comportamiento verificado | Prueba | Resultado |
| :--- | :--- | :--- | :---: |
| **RF-CAR-01-01** | El visitante agrega variantes sin autenticarse, incluso sin un `GET` previo | CA-CAR-01-01..05, B3-01..02, B3-INT-01 | ✅ **CUMPLIDO** |
| **RF-CAR-01-02** | Las rutas de visitante no exigen sesión; las de cliente responden `401` sin ella | B4-01..02, flujo HTTP | ✅ **CUMPLIDO** |
| **RF-CAR-01-03** | El mismo token recupera el mismo carrito; tokens distintos, carritos distintos | CA-CAR-01-04..05, B3-02 | ✅ **CUMPLIDO** |
| **RNF-CAR-01-01** | El token es un UUID opaco; no admite texto arbitrario | D3-01..05 | ✅ **CUMPLIDO** |
| **HU-CAR-02** (gestión) | Sumar, restar, eliminar con `DELETE` y con cantidad `0` | CA-CAR-02-01..06, B4-06 | ✅ **CUMPLIDO** |
| **RF-CAR-02-0X** | Variante repetida suma en la misma línea, también con peticiones simultáneas | CA-CAR-02-03..04, B2-01..02, B2-INT-01 | ✅ **CUMPLIDO** |
| **RF-CAR-02-07** | Tope de 999 al agregar, acumular y fusionar | D2-01..03, D2-INT-01..02, B2-INT-02..05, B1-01..04 | ⚠️ **PROVISIONAL** (requisito PENDIENTE) |
| Variante válida | Inexistente `404`, no activa `422`, sin dejar líneas ni carritos | D1-01..04, D1-INT-01..03, B3-05..06 | ✅ **CUMPLIDO** |
| **RF-CAR-04-01** | Al autenticarse, el carrito de visitante pasa a la cuenta o se fusiona, en una transacción | CA-CAR-04-01..04, D4-01..06, D4-INT-01..04 | ✅ **CUMPLIDO** |
| **RF-CAR-04-02** | Recálculo con precios de empresa | — | ❌ **BLOQUEADO** (M06) |
| **RF-CAR-04-03** | Conflicto con un carrito previo de la cuenta | B1-01..04, B1-INT-01..02 | ⚠️ **PROVISIONAL** (requisito PENDIENTE) |
| **RF-CAR-05-01** | Revalidar el precio vigente antes del pago | — | ⚠️ **PARCIAL**: se lee el precio vivo, pero no se detecta si cambió |
| **RF-CAR-05-02** | Revalidar existencias y estado de la variante | CA-CAR-05-01..06, flujo HTTP (`stock_insuficiente`) | ✅ **CUMPLIDO** |
| **RF-CAR-05-04** | Carrito vivo: precio dinámico, sin histórico | Diseño de `listarLineasVivas` (JOIN a `variante`) | ✅ **CUMPLIDO** |
| **RF-CAR-05-05** | Avisar cambios de precio o disponibilidad antes del pago | CA-CAR-05-03..06 | ⚠️ **PARCIAL**: solo disponibilidad |
| **RF-CAR-05-06** | Excluir líneas de cotización de la revalidación de precio | — | ❌ **BLOQUEADO** (M21) |
| Concurrencia (§HU-CAR-05, M20) | Ediciones simultáneas no pierden unidades ni superan el tope | B2-INT-01..02 | ✅ **CUMPLIDO** |

### Ejecución de las pruebas

Las pruebas de backend se ejecutan con `npx tsx`, igual que las de M08 (el script `npm test` del backend no tiene un runner configurado; no hizo falta tocar `package.json`).

```bash
cd backend
npx tsx src/modules/m05-carrito-compras/__tests__/m05.test.ts                   # 72/72 (repositorios falsos, sin BD)
npx tsx src/modules/m05-carrito-compras/__tests__/m05.integracion-escritura.test.ts  # 19/19 (PostgreSQL real)
```

- **Unitarias (72):** repositorios falsos en memoria. Las de controlador (D3, B4) pasan por la guarda real `sesionVigente()` de M20 con servicios de sesión falsos y un JWT firmado.
- **Integración (19):** contra PostgreSQL con `schema_pintuclic.sql` y `seed_pintuclic.sql`. Casi todo corre dentro de una transacción que termina con `ROLLBACK`. **Excepción:** D4 y la concurrencia de B2 necesitan transacciones o conexiones propias, así que escriben de verdad y borran lo que crearon en un `finally`. Al final, la suite comprueba que carritos, líneas y variantes quedaron como estaban.
- **Comprobación de que las pruebas detectan los defectos:** D1-INT, D4-INT, B2-INT y B2-INT-04 se ejecutaron también contra el código anterior (o con el defecto reintroducido) y fallaron como se esperaba.
- **Flujo HTTP de extremo a extremo** (backend levantado, `curl`): agregar como visitante, los cuatro errores controlados, login, fusión (2 + 3 = 5 y una línea transferida), fusión repetida sin duplicar, revalidación válida y con `stock_insuficiente`, y `401` sin sesión.
- `npx tsc --noEmit` → 0 errores · `npm run lint -- --max-warnings=0` → 0 errores, 0 advertencias.

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (¿Qué necesita para operar al 100% en producción?)

- **M20 Seguridad:** `guardas.sesionVigente()` y `obtenerIdentidadVigente()` para las rutas de cliente; tabla `sesion` con la sesión emitida en el login.
- **M04 Cuentas:** login que emite la sesión (`POST /api/cuentas/login`). La fusión la dispara el frontend después de autenticarse (`loadCart` en `CartView.vue`).
- **M01 Catálogo:** tabla `variante` (`precio_vigente`, `existencia_referencial`, `estado`) como fuente del carrito vivo. Hoy se lee directamente con Kysely desde el repositorio de M05.
- **M13 Inventario:** la existencia que se revalida es `existencia_referencial`, que se actualiza por CSV desde SAMIT (diagrama de componentes). M05 no la modifica.
- **M06 Reglas y descuentos / M21 Cotizaciones:** necesarios para cerrar RF-CAR-04-02 y RF-CAR-05-06 (§8).
- **Core (aprobado):** `/carrito` montado en `app.routes.ts` y `X-Visitor-Token` permitido en `cors.middleware.ts`.
- **Infraestructura:** PostgreSQL con el DDL de `bd/sql/schema_pintuclic.sql` (`uq_carrito_variante`, `chk_lineacarrito_cantidad`, FKs en cascada).

### B. Dependencias Hacia Adelante (¿A qué habilita?)

- **Frontend M05 (`v0.3.39.0`):** sus 10 llamadas `/api/carrito/*` dejan de responder `404`.
- **M07 Pasarela de pagos / M08 Orden de venta:** `GET /cliente/revalidar` es el paso previo al pago del diagrama end-to-end; el carrito revalidado es la base de la solicitud que M08 convierte en orden (`serviciosOrdenes.creacion`).

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ **Verificación de Límites de Módulo:** fuera de `backend/src/modules/m05-carrito-compras/` y `docs/walkthroughs/M05/` solo cambian `app.routes.ts` y `cors.middleware.ts`, ambos aprobados explícitamente por el líder del módulo, además de `.github/version.txt` y `docs/CHANGELOG.md` por la entrega. No se tocó `bd/`, `docs/reviews/` ni archivos de otros módulos.

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** ⚠️ compartido | `backend/src/app.routes.ts` | +2 líneas: import y `appRouter.use('/carrito', carritoRoutes)`. |
| **[MODIFICADO]** ⚠️ core | `backend/src/core/middlewares/cors.middleware.ts` | `X-Visitor-Token` en `allowedHeaders` ([reporte de parada](./reporte_parada_v0.4.4.0_M05_cors_x_visitor_token_backend.md)). |
| **[NUEVO]** | `backend/src/modules/m05-carrito-compras/m05.routes.ts` | Raíz de composición y 10 rutas. |
| **[NUEVO]** | `backend/src/modules/m05-carrito-compras/controllers/carrito.controller.ts` | Transporte HTTP; token de visitante, identidad de M20 y `:idLinea`. |
| **[NUEVO]** | `backend/src/modules/m05-carrito-compras/services/carrito.service.ts` | Reglas: validar variante, agregar o acumular, actualizar, eliminar, fusión con tope y revalidación. |
| **[NUEVO]** | `backend/src/modules/m05-carrito-compras/repositories/carrito.repository.ts` | Cabecera `carrito`. |
| **[NUEVO]** | `backend/src/modules/m05-carrito-compras/repositories/linea-carrito.repository.ts` | Líneas vivas, `buscarVariante`, `agregarOAcumular` (upsert atómico), `transferirLineasYEliminarOrigen` (transacción). |
| **[NUEVO]** | `backend/src/modules/m05-carrito-compras/dtos/*.dto.ts` · `dtos/index.ts` | `agregar-item` (y `CANTIDAD_MAXIMA_POR_LINEA`), `actualizar-item`, `fusionar-carrito`, `token-visitante`, `linea-carrito`. |
| **[NUEVO]** | `backend/src/modules/m05-carrito-compras/interfaces/m05.interfaces.ts` | Tipos de dominio (0 runtime), incluidos `AvisoFusion` y `ResultadoTransferencia`. |
| **[NUEVO]** | `backend/src/modules/m05-carrito-compras/__tests__/m05.test.ts` | 72 pruebas unitarias y de controlador. |
| **[NUEVO]** | `backend/src/modules/m05-carrito-compras/__tests__/m05.integracion-escritura.test.ts` | 19 pruebas contra PostgreSQL. |
| **[NUEVO]** | `docs/walkthroughs/M05/walkthrough_v0.4.4.0_M05_integracion_carrito_backend.md` | Este documento. |
| **[NUEVO]** | `docs/walkthroughs/M05/reporte_parada_v0.4.4.0_M05_cors_x_visitor_token_backend.md` | Reporte de parada por el cambio en el core. |
| **[MODIFICADO]** | `.github/version.txt` · `docs/CHANGELOG.md` | `0.4.3.0` → `0.4.4.0` y entrada correspondiente. |

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (72/72 unitarias · 19/19 integración · `tsc` 0 · `lint` 0/0)
* **Apego al Diagrama de Flujo:** `⚠️ Coincidente con el diagrama end-to-end de M05-M08`, salvo el nodo "Si cuenta empresa: recálculo de precio diferenciado" (M06). Los diagramas por historia que cita la especificación no existen (§9).
* **Checklist de cierre:** las 3 políticas globales se validaron (§3.B). El módulo **no** se declara cerrado: quedan los pendientes de §8.

---

## 8. PENDIENTES FUERA DE ALCANCE

| # | Pendiente | Requisito | Depende de | Propuesta |
| :---: | :--- | :--- | :--- | :--- |
| 1 | La revalidación no detecta cambios de precio: el tipo `precio_modificado` existe pero nunca se emite, y `precio_anterior` no se llena. | RF-CAR-05-01 · RF-CAR-05-05 | M05 + definición funcional | Definir contra qué precio se compara (el último mostrado al cliente o uno guardado en la línea) y si eso contradice RF-CAR-05-04 ("no conserva un valor histórico"). |
| 2 | No hay precios de empresa en el carrito. | RF-CAR-04-02 | **M06** Reglas y descuentos (sin analizar) | Recalcular las líneas cuando la cuenta sea empresa aprobada, sin exponer esos precios a otros (RF-SEG-06-05). |
| 3 | Las líneas de una cotización aceptada no se excluyen de la revalidación de precio. | RF-CAR-05-06 | **M21** Cotizaciones | Marcar el origen de la línea (`linea_carrito.ref_viva` se documenta "M21") y excluirla. |
| 4 | Sin `UNIQUE` en `carrito.token_visitante` ni en `carrito.id_usuario`: dos primeras peticiones simultáneas pueden crear dos carritos para el mismo token o cliente. | Integridad (RF-CAR-01-03, RF-CAR-04-01) | **`bd/`** (DDL) | Índices únicos parciales (`WHERE token_visitante IS NOT NULL` / `WHERE id_usuario IS NOT NULL`); luego, en M05, `ON CONFLICT` al crear la cabecera. |
| 5 | El backend no devuelve nombre ni imagen del producto; el frontend usa datos quemados (`cart-product-fallback.ts`). | RF-SEG-06-01 (datos necesarios para la vista) · experiencia de HU-CAR-01/02 | **M01** Catálogo | Que M01 exponga una fachada de lectura (nombre, imagen principal, descripción de la variante) y M05 la añada a cada línea viva. |
| 6 | El carrito de visitante sembrado usa el token `anon-cart-uuid-dev-sample-2026`, que no es un UUID: desde D3 no se puede usar desde la API. | RNF-CAR-01-01 (datos de prueba) | **`bd/`** (`seed_pintuclic.sql`) | Cambiarlo por un UUID válido (p. ej. `00000000-0000-4000-8000-000000000002`) en un PR aparte. |
| 7 | Tope por línea y estrategia de fusión definidos de forma provisional (§3.A). | RF-CAR-02-07 · RF-CAR-04-03 | Analista / especificación de M05 | Confirmar o cambiar los valores; el código está preparado para un cambio de una línea. |

---

## 9. HALLAZGOS PARA EL EQUIPO

| # | Hallazgo | Dónde | Responsable sugerido |
| :---: | :--- | :--- | :--- |
| 1 | **3 vulnerabilidades en dependencias del backend** (`npm audit`), todas con corrección disponible: `nodemailer` (alta, dependencia directa: divulgación de credenciales SMTP entre transportes y varios DoS en el parser de direcciones); `brace-expansion` (alta, transitiva: DoS); `qs` (moderada, transitiva: DoS y bypass de `arrayLimit`). Ya estaban en `develop`; no se tocaron. | `backend/package.json` · `package-lock.json` | Dueño del core / M18 (usa `nodemailer`) |
| 2 | **Un origen no permitido por CORS responde `500` en lugar de `403`.** La función `origin` hace `callback(new Error(...))` y `errorHandler` lo trata como error no controlado. El bloqueo funciona y el mensaje es genérico, pero cada intento queda en el log como `[CORE][ERROR_NO_CONTROLADO]`. Igual en `develop`. | `backend/src/core/middlewares/cors.middleware.ts` | Dueño del core |
| 3 | **Los diagramas por historia que cita la especificación no existen:** `docs/assets/diagrams/M05/HU-CAR-01.png`, `HU-CAR-02.png`, `HU-CAR-04.png` y `HU-CAR-05.png`. Solo están los dos diagramas compartidos de `docs/assets/diagrams/M05-M08/`. | `docs/02_MODULOS_FUNCIONALES/M05_ESPECIFICACION_CARRITO.md` | Analista / líder de M05 |
| 4 | **La matriz de trazabilidad no tiene filas de M05** (HU-CAR-01, 02, 04 y 05 con sus transversales y diagramas). | `docs/00_SISTEMA/01_ARQUITECTURA/MATRIZ_TRAZABILIDAD.md` | Analista / líder técnico |
| 5 | La especificación de M05 **no tiene criterios de aceptación Gherkin** (CA-CAR-*); la matriz de §4 se construyó sobre los RF. | Especificación de M05 | Analista |
