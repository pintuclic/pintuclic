# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión:** `v0.3.31.0` (Minior-feat; `.github/version.txt` de `0.3.30.1` a `0.3.31.0`)
* **Módulo de Origen:** `M08 - Orden de venta`
* **Fecha y Autor:** `28/09/2026` · `Manuel (Manuel151025), con apoyo de Agente de IA (backend)`
* **Estado de la Implementación:** `⚠️ PARCIAL CON DEPENDENCIAS` (consultas, búsqueda, bandeja e historial listos; creación de órdenes, ciclo de estados y notas internas bloqueados por el modelo de datos)

Esta entrega agrupa todo el trabajo de la rama `feature/m08-orden-venta` que aún no está en `develop` desde la v3.30.1. Sustituye al borrador `walkthrough_v0.3.29.0_…`, cuyo número ya ocupó otra entrega en `develop`.

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

Criterios tomados de los Issues de la épica **#28**, actualizada el **27/09/2026**: 11 historias y 49 criterios. Los textos de las HU y los CA son los de la documentación de Drive; las decisiones D01–D08 figuran en la épica como guía.

| Historia | Cambio en esta versión | Endpoint |
| :--- | :--- | :--- |
| **HU-ORD-05** (#155) Bandeja del personal | Listado con filtros y paginación; **contadores por estado**; **orden por antigüedad** y `dias_esperando` | `GET /api/ordenes/gestion` · `GET /api/ordenes/gestion/resumen` |
| **HU-ORD-08** (#582) Encontrar un pedido | Búsqueda por identificador, **correo** y **teléfono** del cliente | `GET /api/ordenes/gestion?codigo=&correo=&telefono=` · `GET /api/ordenes/gestion/:codigo` |
| **HU-ORD-09** (#583) Detalle para el personal | El detalle incluye el **contacto del cliente** (nombre, correo, teléfono) y la dirección | `GET /api/ordenes/gestion/:codigo` |
| **HU-ORD-11** (#585) Historial del cliente | Compras anteriores del titular abiertas desde una orden, sin repetirla | `GET /api/ordenes/gestion/:codigo/historial-cliente` |
| **HU-ORD-07** (#182) Mis pedidos | `enviado` se trata como Despachado y pasa a finalizados (D02, CA-ORD-03-06) | `GET /api/ordenes/mis-pedidos` |
| **HU-ORD-06** (#179) Identificación | Generador del formato `PC-AAAA-NNNNN` con año de Colombia (D04), a la espera del consecutivo | `CodigoPedidoService` (uso interno) |

Siguen disponibles sin cambios: `GET /api/ordenes/mis-pedidos/:codigo` (HU-ORD-04).

La versión incluye además:
- **`m08.integracion.test.ts`:** pruebas de solo lectura contra PostgreSQL.
- **`PROPUESTA_MODELO_DATOS_M08.md`:** propuesta de modelo de datos para el líder técnico, ampliada con las necesidades del 27/09.

### Descripción del Alcance de la Versión

El personal con «Revisar órdenes» (`ventas.ver`) ya dispone de una bandeja:
- ve cuántas órdenes hay en cada estado;
- las atiende empezando por la más antigua;
- localiza el pedido de un cliente por su número, su correo o su teléfono;
- abre su detalle con los datos de contacto y consulta sus compras anteriores.

Todo se apoya en tablas existentes (`orden`, `linea_orden` y `usuario`). Lo que requiere tablas o columnas nuevas queda detallado en la sección 5.C y en la propuesta de modelo.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **Búsqueda por correo y teléfono (CA-ORD-08-02):** coincidencia **exacta** con el titular, para no mostrar pedidos de otra persona.
  - El correo se compara sin distinguir mayúsculas.
  - El teléfono admite espacios y el prefijo `+`, y se compara sin espacios.
  - Ambos se comprueban con `EXISTS` sobre `usuario`, sin traer sus columnas al listado.
- **Filtros combinables:** `codigo` (parcial), `estado`, `desde`/`hasta` (fecha de la orden, **extremos incluidos**), `cliente`, `correo` y `telefono`. Si llegan varios, se aplican a la vez.
- **Orden de la bandeja (CA-ORD-05-07):** `orden=recientes` (por defecto) u `orden=antiguedad`, con desempate estable por id interno.
- **`dias_esperando` (CA-ORD-05-07):** días naturales entre la fecha de la orden y **hoy en Colombia** (`America/Bogota`), nunca negativos. ⚠️ **Provisional:** cuando exista el historial de estados debe contar desde el último cambio de estado.
- **Contadores (CA-ORD-05-05):** una entrada por cada estado del enum, **incluidos los que tienen 0**, más el total.
- **Historial del cliente (CA-ORD-11-01):** mismas columnas que la bandeja (fecha, importe y estado), de la más reciente a la más antigua, **sin repetir la orden desde la que se abre**.
- **Contacto en el detalle (CA-ORD-09-01):** solo nombre, correo y teléfono del titular. Si la cuenta ya no existe, el detalle responde igual con `cliente: null`.
- **Código del pedido (D04, #180):** `CodigoPedidoService.formatear(consecutivo, fecha)` produce `PC-AAAA-NNNNN` con el año de Colombia y conserva todas las cifras por encima de 99 999. No genera el número: el consecutivo lo aporta la fuente que defina el líder técnico.
- **Clasificación de Mis pedidos:** `enviado` pasa a finalizados. ⚠️ La equivalencia `enviado` = Despachado queda por confirmar hasta que se alinee el enum.

### B. Decisión de Diseño
- **Ruta de contadores antes que la de detalle:** `/gestion/resumen` se declara antes de `/gestion/:codigo` para que Express no tome «resumen» como un código.
- **Reloj inyectable:** el servicio recibe la fuente de la hora actual, de modo que `dias_esperando` es verificable en las pruebas, incluido el cambio de día a medianoche en Bogotá.
- **Listas de estados exhaustivas:** el DTO y el servicio fallan en compilación si `EnumEstadoOrden` cambia y no se actualizan. El cambio de estados no puede pasar desapercibido.
- **Mensajes de validación en español** para los campos de valor cerrado (`estado`, `orden`).

### C. Políticas Transversales Validadas
- 🛡️ **M17 / M20 (`HU-ADM-03`, `HU-SEG-03`):** todas las rutas del personal exigen sesión vigente y `ventas.ver`, resueltos en vivo en cada petición. Un cliente recibe 403 en la bandeja, los contadores y el historial (CA-ORD-11-02, CA-ORD-08-03). Los accesos denegados quedan registrados (CA-SEG-03-05, comprobado en el log del servidor).
- 👁️ **M20 (`HU-SEG-06`):**
  - el listado solo trae código, fecha, total, estado, id del cliente y días esperando;
  - del cliente solo viajan nombre, correo y teléfono, y solo al personal autorizado;
  - nunca viajan el id interno de la orden ni datos de pago.
- 📧 **M18 (CA-ORD-05-06):** la llegada de un pedido no envía correos al personal; aparece en los contadores del panel.
- 🆔 **`HU-CUE-08`:** no aplica.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN (épica #28 del 27/09/2026)

Resumen: **13 cumplidos · 10 parciales · 26 bloqueados** (49 criterios). El criterio CA-ORD-05-04 (#425) se cerró en la documentación vigente y queda fuera del recuento. Las consultas se validaron contra PostgreSQL 15 local con el seed de `develop`.

| CA | Resumen | Resultado | Motivo o método |
| :--- | :--- | :---: | :--- |
| **01-01** #110 | Al confirmar el pago se genera la orden | ⛔ | Bloqueos 1, 3 y 4 |
| **01-02** #113 | Sin pago confirmado no hay orden | ⛔ | Bloqueos 1 y 3 |
| **01-03** #115 | Verificación manual equivalente a la pasarela | ⛔ | Bloqueo 3 |
| **01-04** #117 | Registra la cotización de origen | ⛔ | Depende de la creación |
| **01-05** #417 | Pago duplicado no crea otra orden | ⛔ | Depende de la creación (`transaccion_pago_id UNIQUE` ya existe) |
| **01-06** #418 | Recuperar la compra tras un fallo | ⛔ | Bloqueo 3 |
| **02-01** #124 | Conserva el precio aunque cambie el catálogo | ⚠️ | Lectura cumplida; la copia al crear depende de HU-ORD-01 |
| **02-02** #125 | Descuentos aplicados, su orden y su importe | ⛔ | Bloqueo 5 |
| **02-03** #126 | Importe acordado de la cotización | ⚠️ | Lectura cumplida; la copia al crear depende de HU-ORD-01 |
| **02-04** #419 | Datos intactos si el producto se desactiva | ✅ | Detalle leído de `linea_orden` |
| **02-05** #420 | Conserva el % de IVA aplicado | ⛔ | Bloqueo 5 |
| **03-01** #131 | El estado refleja la situación real | ⛔ | Bloqueos 1 y 2 |
| **03-02** #134 | La falta de disponibilidad no queda oculta | ⛔ | Bloqueo 6 |
| **03-03** #136 | Recogida: Entregado con fecha y autor | ⛔ | Bloqueos 1, 2 y 5 |
| **03-04** #421 | Evento y autor por cambio de estado | ⛔ | Bloqueo 2 |
| **03-05** #422 | Registrar el dinero por devolver sin moverlo | ⛔ | Bloqueos 1 y 7 |
| **03-06** #889 | Despachado es el cierre normal a domicilio | ⛔ | Bloqueo 1 (Mis pedidos ya trata `enviado` como finalizado) |
| **03-07** #890 | El cliente no puede cancelar por su cuenta | ⚠️ | La API no ofrece cancelación al cliente; el mensaje de «gestionarlo con un empleado» es de la interfaz |
| **03-08** #891 | Cancelación por empleado | ⛔ | Bloqueos 1, 2 y 7; ver aclaración 11 |
| **03-09** #892 | Devolución aceptada pasa a Devuelta | ⛔ | Bloqueos 1, 2 y 7; ver aclaración 11 |
| **03-10** #893 | Lo entonado a medida no se devuelve | ⛔ | Bloqueos 5 y 7 |
| **04-01** #150 | Detalle con modo de entrega | ⚠️ | Productos, precios, total y estado cumplidos; falta el modo de entrega (bloqueo 5) |
| **04-02** #152 | Color entonado en el detalle | ⚠️ | Solo el texto de la variante (bloqueo 5) |
| **04-03** #423 | Orden ajena rechazada | ✅ | 404 indistinguible y registro M20 |
| **04-04** #424 | Producto retirado con nota | ⚠️ | Datos y sin enlace cumplidos; la nota requiere la referencia a la variante (bloqueo 5) |
| **05-01** #176 | Gestión de pedidos avanza una orden | ⛔ | Bloqueo 1 |
| **05-02** #177 | Revisar órdenes no puede operar | ⛔ | No existe la operación de avance (bloqueo 1) |
| **05-03** #178 | Sin permisos no se consulta | ✅ | Guarda `ventas.ver` de M20 (403 comprobado por HTTP) |
| **05-05** #894 | Contadores por estado en el panel | ⚠️ | Contadores listos y probados; usan los estados provisionales y «esperando verificación» está por aclarar |
| **05-06** #895 | Un pedido nuevo no envía correo; suma en el contador | ✅ | Sin correo al personal; contador de `/gestion/resumen` |
| **05-07** #896 | Más antigua primero y cuánto lleva esperando | ⚠️ | Orden por antigüedad cumplido; los días se cuentan desde la fecha de la orden hasta que exista el historial (bloqueo 2) |
| **05-08** #897 | Operación simultánea con autor por paso | ⛔ | Bloqueo 2 |
| **06-01** #180 | Identificador propio y distinto | ⚠️ | `UNIQUE` en `codigo_visible` y formato PC listos; la generación llega con la creación (bloqueos 3 y 4) |
| **06-02** #181 | Identificador inequívoco | ✅ | `UNIQUE` y búsqueda exacta |
| **06-03** #426 | No reutilizar el de una cancelada | ⛔ | Bloqueo 4 |
| **07-01** #183 | En curso / finalizados con código, fecha, total y estado | ✅ | Pruebas en memoria |
| **07-02** #184 | Entregado entre finalizados | ✅ | Pruebas en memoria |
| **07-03** #427 | Buscador de Mis pedidos | ✅ | Pruebas en memoria y de integración |
| **08-01** #898 | Buscar por el número del pedido | ✅ | `GET /gestion/:codigo` y filtro `codigo` |
| **08-02** #899 | Buscar por el correo del cliente | ✅ | Pruebas en memoria, de integración y HTTP (correo en mayúsculas) |
| **08-03** #900 | Sin permiso no aparece ninguna orden | ✅ | 403 en el buscador para quien no tiene `ventas.ver` |
| **09-01** #901 | Contacto, dirección y base entonada | ⚠️ | Contacto y dirección cumplidos; faltan la base consumida por línea y saber si el pedido se envía (bloqueo 5) |
| **09-02** #902 | Historial con autor y fecha | ⛔ | Bloqueo 2 |
| **09-03** #903 | Registrar que se contactó al cliente | ⛔ | Bloqueo 9 |
| **10-01** #904 | La nota interna no la ve el cliente | ⛔ | Bloqueo 8 |
| **10-02** #905 | La nota muestra autor y momento | ⛔ | Bloqueo 8 |
| **10-03** #906 | La nota no se puede borrar | ⛔ | Bloqueo 8 |
| **11-01** #907 | Historial de compras desde el pedido actual | ✅ | Pruebas en memoria, de integración y HTTP |
| **11-02** #908 | Un cliente no ve el historial de otro | ✅ | 403 comprobado por HTTP |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **M20:** guardas de sesión y permisos, y registro de accesos denegados.
- **M17:**
  - el permiso `ventas.ver` concedido al personal, con la dependencia `ventas.gestionar → ventas.ver`;
  - la búsqueda de clientes, para obtener el id del filtro `cliente`.
- **M04:** tabla `usuario`, de la que solo se leen nombre, correo y teléfono del titular.
- **Base de datos:** `orden`, `linea_orden` y `usuario`, sin cambios de esquema en esta versión.

### B. Dependencias Hacia Adelante
- **Frontend M08:** bandeja del panel con contadores, antigüedad y buscador; detalle con contacto; historial del cliente.
- **M18 (HU-NOT-02, #203):** reabierta a la espera de que M08 emita los eventos de cambio de estado; depende de los bloqueos 1 y 2.

### C. ⛔ Bloqueos Pendientes
Cambios de modelo que corresponden al líder técnico. El SQL de cada uno está en `docs/walkthroughs/M08/PROPUESTA_MODELO_DATOS_M08.md`.

1. **Estados:** `enum_estado_orden` no refleja el ciclo de #128 (Orden confirmada, Revisión de disponibilidad, En preparación, Preparada, Despachado, Entregado, Cancelado, Devuelto). El valor por defecto `pendiente` contradice que no exista orden sin pago.
2. **Historial de transiciones:** estado, autor, fecha/hora y motivo de cada cambio. También lo necesitan 05-07 (días desde el último cambio), 05-08 y 09-02.
3. **Solicitud SOL y pago (M07):** no existen la solicitud ni el permiso «Verificación de pagos», y `pagos.id_orden` es `NOT NULL`.
4. **Consecutivo del código PC:** secuencia o contador sin huecos, según se aclare «consecutivo corrido».
5. **Copia histórica:**
   - en `linea_orden`: color solicitado, precio inicial, descuentos por línea, referencia a la variante, `es_entonado` y base consumida;
   - en `orden`: base sin IVA, importe y tasa de IVA, y modo y costo de entrega.
6. **Disponibilidad por línea** (con M09).
7. **Dinero por devolver** (CA-ORD-03-05): tabla con importe, motivo, referencia externa, autor y fecha. Además, la política de cancelación y devolución de M11, cuyas HU-POS-01/02/03 están marcadas «no desarrollar».
8. **Notas internas** (HU-ORD-10): tabla de solo inserción con autor, texto y fecha.
9. **Registro de contactos con el cliente** (CA-ORD-09-03): tabla con autor, medio, detalle y fecha.
10. **Seed:**
    - el rol 3 (cliente empresa) tiene `ordenes.ver` y `ventas.ver`, lo que le daría acceso a la bandeja del personal;
    - falta el permiso `pagos.verificar`;
    - faltan órdenes de ejemplo en más estados.

    El fallo de `npm run db:seed` en bases nuevas se resolvió en `develop` el 25/09 y se comprobó el 28/09 sobre una base recién creada.
11. **Aclaraciones del análisis:**
    - P1–P5;
    - CA-ORD-03-08/03-09 dicen «se genera el reembolso», mientras CA-ORD-03-05 y D03 dicen que solo se registra el dinero por devolver;
    - la épica indica que D01–D08 «no son verificables contra el Drive», así que falta confirmar si siguen vigentes;
    - qué estado es «esperando verificación» (05-05);
    - si la búsqueda por teléfono forma parte de HU-ORD-08;
    - qué medio usa el contacto de 09-03.

### ⚠️ Limitaciones Conocidas
1. **Validación local, no oficial:** PostgreSQL 15 local con el seed de `develop`. La validación en el entorno de integración corresponde al equipo de testing.
2. **`dias_esperando` provisional:** se mide desde la fecha de la orden (columna DATE) y no desde el último cambio de estado.
3. **Pruebas de integración ligadas al seed:** dependen de `ORD-2026-0001` y `ORD-2026-0002`, y habrá que ajustarlas cuando esos códigos pasen al formato PC.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

Cambios de la rama respecto a `develop` en esta entrega:

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/interfaces/m08.interfaces.ts` | Filtros, contacto, contadores, orden del listado y `dias_esperando`. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/dtos/ordenes.dto.ts` | Filtros `correo`, `telefono` y `orden`; `PaginacionDto`; mensajes en español. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/repositories/ordenes.repository.ts` | Listado con filtros y orden, conteo por estado y contacto del cliente. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/services/ordenes.service.ts` | Bandeja, contadores, historial del cliente, contacto en el detalle y reloj inyectable. |
| **[NUEVO]** | `backend/src/modules/m08-ordenes/services/codigo-pedido.service.ts` | Formato `PC-AAAA-NNNNN` con año de Colombia. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/controllers/ordenes.controller.ts` | Handlers de bandeja, contadores e historial. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/m08.routes.ts` | Rutas `/gestion`, `/gestion/resumen`, `/gestion/:codigo/historial-cliente` y `/gestion/:codigo`. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/__tests__/m08.test.ts` | 51 pruebas en memoria. |
| **[NUEVO]** | `backend/src/modules/m08-ordenes/__tests__/m08.integracion.test.ts` | 20 pruebas de solo lectura contra PostgreSQL. |
| **[NUEVO]** | `docs/walkthroughs/M08/PROPUESTA_MODELO_DATOS_M08.md` | Propuesta de modelo de datos para el líder técnico. |
| **[NUEVO]** | `docs/walkthroughs/M08/walkthrough_v0.3.31.0_M08_bandeja_busqueda_historial_backend.md` | Este documento. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v0.3.31.0`. |
| **[MODIFICADO]** | `.github/version.txt` | `0.3.30.1` → `0.3.31.0`. |

Todos los archivos de código pertenecen al módulo M08. La rama incluye también, de entregas anteriores aún no integradas, el montaje de `/ordenes` en `backend/src/app.routes.ts` (2 líneas, v3.30.1) y las consultas iniciales (v3.30.0).

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ`
  * `tsc --noEmit` y `npm run lint` limpios.
  * **51/51** pruebas en memoria (`npx tsx src/modules/m08-ordenes/__tests__/m08.test.ts`).
  * **20/20** pruebas de integración (`npx tsx src/modules/m08-ordenes/__tests__/m08.integracion.test.ts`).
* **Validación contra PostgreSQL:** `✅ LOCAL`. PostgreSQL 15.19 con una base recreada desde el esquema y el seed de `develop` del 28/09. 12 peticiones HTTP reales con los resultados esperados: 200 en los casos válidos, 404 genérico, 403 para el cliente, 400 con mensaje en español y 401 sin sesión. La validación oficial corresponde al equipo de testing.
* **Versión:** `✅ 0.3.31.0` en `.github/version.txt` y entrada en `docs/CHANGELOG.md`.
