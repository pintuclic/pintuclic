# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión:** `v0.3.38.1` (PATCH de documentación; `.github/version.txt` de `0.3.38.0` a `0.3.38.1`)
* **Módulo de Origen:** `M08 - Orden de venta` (documentación de M08 y un comentario en `m08.routes.ts`; sin cambios de comportamiento, de BD ni de archivos compartidos)
* **Fecha y Autor:** `29/09/2026` · `Manuel (Manuel151025), con apoyo de Agente de IA (backend)`
* **Estado de la Implementación:** `✅ BACKEND CERRADO` en todo lo que depende de M08. Lo pendiente depende de M07, M09, M11, del analista principal o del líder técnico (sección 5).

Entrega de cierre del backend de M08. Pone al día los diagramas y la especificación, que seguían describiendo el ciclo anterior a las definiciones del analista, y deja el dictamen del checklist de cierre del equipo (`CHECKLIST_CIERRE_MODULOS.md`) con la matriz completa de los 49 criterios.

---

## 2. QUÉ CAMBIA EN ESTA VERSIÓN

| Documento | Antes | Ahora |
| :--- | :--- | :--- |
| **Máquina de estados** (`docs/assets/diagrams/M08/Maquina_de_estados_de_la_Orden.drawio.png`) | Ciclo del 07/09: Pago confirmado, En revisión, Consiguiendo stock, Stock disponible, Enviado, En camino y «Cancelada (implica reembolso)» | Ciclo implementado: Orden confirmada, Revisión de disponibilidad, En preparación y Preparada. Desde Preparada, domicilio → Despachado y recogida → Entregado, con vuelta a En preparación con motivo. Cancelado y Devuelto aparecen como no habilitados (M11). |
| **Documento de diseño** (`equipo-2-doc/assets/diagrams/M08/M08_Orden_de_venta.md`) | Versión 1.0, borrador: 2 tablas, máquina anterior y pendientes ya resueltos | Versión 2.0: modelo de datos real (8 tablas), flujo de creación, máquina de estados, arquitectura, aplicación de los ADR y pendientes vigentes |
| **Especificación** (`docs/02_MODULOS_FUNCIONALES/M08_ESPECIFICACION_ORDEN.md`) | 6 de las 11 historias, sin criterios de aceptación, con reglas superadas y 3 imágenes que no existen | Las 11 historias con sus 34 requisitos y 49 criterios, copiados sin cambios de la Tanda 3C, más la implementación de cada historia, las definiciones aplicadas y los pendientes |
| **`m08.routes.ts`** | Comentario: «que notas y contactos pidan `ventas.gestionar` está pendiente de confirmar» | El analista lo confirmó el 29/09. Solo cambia el comentario. |

**Cómo se hizo el diagrama:**
- Tiene el mismo nombre y el mismo formato editable que el anterior: el PNG lleva incrustado el archivo de draw.io.
- Se reemplazó solo la página «Máquina de estados de la Orden». La página «Flujo funcional end-to-end» que venía incrustada se conserva byte a byte.
- Está dibujado con figuras nativas de draw.io en lugar de un objeto Mermaid, para poder editarlo sin regenerarlo.

**Sin cambios:** los diagramas conjuntos `docs/assets/diagrams/M05-M08/` (flujo end-to-end y arquitectura) siguen siendo correctos para M08:
- la orden se genera de forma idempotente, con copia histórica y a salvo de un fallo entre el pago y la creación;
- la cola de eventos que dibujan pertenece a M07.

---

## 3. DICTAMEN DE CIERRE (`CHECKLIST_CIERRE_MODULOS.md`)

### A. Política de unicidad de cuentas (HU-CUE-08) — `No aplica`
M08 no registra ni modifica cuentas. La orden se asocia al `id_usuario` de la sesión (consultas del cliente) o al que envía M07 (creación), validado por la clave foránea hacia `usuario`.

### B. Política de control de acceso en el servidor (HU-ADM-03) — `✅ Cumple`
| Requisito | Evidencia en M08 |
| :--- | :--- |
| **RF-ADM-03-01 / 03-05** Permiso comprobado en el servidor, también ante el acceso directo | `ordenesRoutes.use(guardas.sesionVigente())` protege todo el módulo, y cada ruta del personal exige `ventas.ver` o `ventas.gestionar` con las guardas de M20. Probado por HTTP (403). |
| **RF-ADM-03-02** También en las consultas | Las cuatro consultas del personal (`GET /gestion`, `/gestion/resumen`, `/gestion/:codigo` y `/gestion/:codigo/historial-cliente`) exigen `ventas.ver`; el detalle del cliente exige ser el titular. |
| **RF-ADM-03-03** Permisos resueltos en cada operación | `sesionVigente` de M20 relee identidad y permisos en cada petición. |
| **RF-ADM-03-06** Respuesta genérica | 403 «No tiene autorización para realizar esta operación». Una orden ajena responde 404, igual que una inexistente, y un código ilegible también da 404 en lugar de un error de validación. |
| **RF-ADM-03-08** Registro del intento denegado | Las guardas de M20 lo registran. M08 registra además el intento de abrir una orden ajena (`TITULARIDAD_AJENA`). |
| **RNF-ADM-03-01** Comprobación centralizada | La sesión se exige a nivel de enrutador: una ruta nueva queda protegida por omisión. |
| **RF-ADM-03-04 / 03-07** Ocultar opciones y devolver a una pantalla permitida | Corresponde a la interfaz; está indicado en el informe para frontend. |

La creación de órdenes (`serviciosOrdenes.creacion`) no tiene ruta HTTP. La pantalla de M07 que la invoque deberá exigir su propio permiso de verificación de pagos.

### C. Política de no exposición de datos sensibles (HU-SEG-06) — `✅ Cumple en M08, con una observación externa`
| Requisito | Evidencia en M08 |
| :--- | :--- |
| **RF-SEG-06-01** Solo los datos necesarios | Las respuestas se arman campo a campo. El cliente no recibe la base consumida, las notas, los contactos ni el autor o motivo de los cambios. No sale ninguna clave primaria de la orden. |
| **RF-SEG-06-02** Sin datos de instrumentos de pago | Solo se guarda el identificador de la transacción o la referencia del comprobante, y ninguna respuesta los devuelve. |
| **RF-SEG-06-03 / CA-SEG-06-05** Sin información de otros clientes | Mis pedidos filtra por el titular en la propia consulta SQL y el detalle rechaza órdenes ajenas. **Observación:** ver abajo. |
| **RF-SEG-06-04 / 06-07** Errores sin detalles internos, registrados por dentro | Manejador central de errores. Una clave foránea rota se traduce a `REFERENCIA_INEXISTENTE` sin mostrar SQL, y los fallos del correo quedan en el log. |
| **RF-SEG-06-05** Precio empresarial | La orden solo muestra sus propios precios y descuentos copiados, y solo a su titular o al personal. |

**⚠️ Observación externa: permisos del rol empresa.**
- En `bd/sql/seed_pintuclic.sql`, el rol `empresa_vip` (3) recibe `ordenes.ver` (4) y `ventas.ver` (10), los permisos de consulta del personal. El perfil de prueba del frontend (`core/auth/useAuth.ts`) también le da `ventas.ver`.
- Con esa asignación, un cliente empresa pasa la guarda de la bandeja y puede ver las órdenes de todos los clientes, con su contacto y sus notas internas.
- El código de M08 aplica bien el permiso. Lo que falla es a quién se le asigna, así que no se puede corregir desde M08 sin tocar archivos compartidos.
- Afecta a CA-ORD-04-03, CA-ORD-10-01 y CA-ORD-11-02 cuando quien consulta es un cliente empresa. **Decisión del líder técnico:** quitar esos permisos al rol empresa o crearle uno propio.

### D. Lista de chequeo final de entrega
| Punto del checklist | Estado | Detalle |
| :--- | :---: | :--- |
| Todos los criterios de aceptación implementados | ⚠️ | 41 de 49 cumplidos. Los 8 restantes dependen de M07, M09, M11 o de la interfaz (sección 4). |
| Diagramas de flujo respetados | ✅ | Los diagramas de M08 describen ahora el ciclo implementado (esta entrega). |
| Las 3 políticas validadas | ✅ | Con la observación externa de 3.C. |
| Código solo en el módulo asignado | ✅ | Todo el código está en `backend/src/modules/m08-ordenes/`. Los archivos compartidos se tocaron con visto bueno: `app.routes.ts` (v3.30.1) y `bd/sql/*` con `core/db/types.ts` (v0.3.34.0 y v0.3.37.0, aprobados por el líder técnico). |

---

## 4. MATRIZ FINAL DE CRITERIOS DE ACEPTACIÓN

Resumen: **41 cumplidos · 3 parciales · 5 bloqueados** (49 criterios, épica #28; CA-ORD-05-04 se cerró como no planificado). Los criterios marcados con ¹ dependen además de la observación 3.C.

| CA | Resumen | Estado | Evidencia |
| :--- | :--- | :---: | :--- |
| **01-01** #110 | Al confirmar el pago se genera la orden | ✅ | Servicio de creación probado en memoria, en BD con ROLLBACK y como servicio real (v0.3.38.0). Falta que M07 lo invoque. |
| **01-02** #113 | Sin pago confirmado no hay orden | ✅ | Sin confirmación, o con un pago corto, no se crea nada. No hay ruta HTTP que cree órdenes. |
| **01-03** #115 | Verificación manual equivalente a la pasarela | ✅ | Misma orden; el empleado queda como autor del historial |
| **01-04** #117 | Registra la cotización de origen | ✅ | `origen` e `id_cotizacion` en BD |
| **01-05** #417 | Pago duplicado no crea otra orden | ✅ | Repetido o simultáneo: la misma orden, sin otro número ni otro correo |
| **01-06** #418 | Recuperar la compra tras un fallo | ⚠️ | Un fallo no deja nada escrito y se puede reintentar; conservar la solicitud es de M07 |
| **02-01** #124 | Conserva el precio aunque cambie el catálogo | ✅ | Copia al crear y lectura desde `linea_orden` |
| **02-02** #125 | Descuentos aplicados, su orden y su importe | ✅ | `linea_orden_descuento`, en orden de aplicación |
| **02-03** #126 | Importe acordado de la cotización | ✅ | Se copian los importes de la solicitud sin recalcular |
| **02-04** #419 | Datos intactos si el producto se desactiva | ✅ | Detalle leído de la copia; líneas con `ON DELETE RESTRICT` |
| **02-05** #420 | Conserva el % de IVA aplicado | ✅ | `tasa_iva` copiada al crear |
| **03-01** #131 | El estado refleja la situación real | ✅ | Ciclo completo en memoria, en BD y por HTTP |
| **03-02** #134 | La falta de disponibilidad no queda oculta | ⛔ | Depende de la verificación por línea de M09 |
| **03-03** #136 | Recogida: Entregado con fecha y autor, sin despacho | ✅ | La recogida no admite el despacho y pasa a Entregado con autor y fecha |
| **03-04** #421 | Evento y autor por cambio de estado | ✅ | `historial_estado_orden` con autor y fecha |
| **03-05** #422 | Registrar el dinero por devolver sin moverlo | ⛔ | Depende de la cancelación (política de M11) |
| **03-06** #889 | Despachado es el cierre normal a domicilio | ✅ | Despachado cierra el envío y cuenta como finalizado |
| **03-07** #890 | El cliente no puede cancelar por su cuenta | ⚠️ | La API no ofrece la cancelación al cliente; el mensaje lo muestra la interfaz |
| **03-08** #891 | Cancelación por empleado | ⛔ | Política de M11 |
| **03-09** #892 | Devolución aceptada pasa a Devuelta | ⛔ | Política de M11 |
| **03-10** #893 | Lo entonado a medida no se devuelve | ⛔ | Política de M11 |
| **04-01** #150 | Detalle con modo de entrega | ✅ | Productos, precios, total, modo de entrega y estado |
| **04-02** #152 | Color entonado en el detalle | ✅ | `color_solicitado` y `es_entonado` |
| **04-03** #423 | Orden ajena rechazada ¹ | ✅ | 404 indistinguible y registro en M20 |
| **04-04** #424 | Producto retirado con nota | ✅ | `retirado: true` e `id_producto: null`; la nota la pone la interfaz |
| **05-01** #176 | Gestión de pedidos avanza una orden | ✅ | HTTP 200 con `ventas.gestionar` |
| **05-02** #177 | Revisar órdenes no puede operar | ✅ | HTTP 403 con solo `ventas.ver` |
| **05-03** #178 | Sin permisos no se consulta | ✅ | HTTP 403 sin `ventas.ver` |
| **05-05** #894 | Contadores por estado en el panel | ✅ | `/gestion/resumen`; «esperando verificación» es Revisión de disponibilidad (analista, 29/09) |
| **05-06** #895 | Un pedido nuevo no avisa por correo al personal | ✅ | Solo suma en los contadores |
| **05-07** #896 | Más antigua primero y cuánto lleva esperando | ✅ | `orden=antiguedad` y `dias_esperando` |
| **05-08** #897 | Operación simultánea con autor por paso | ✅ | Autor por paso y 409 `ESTADO_CAMBIADO` en lugar de sobrescribir |
| **06-01** #180 | Identificador propio y distinto | ✅ | `PC-AAAA-NNNNN` con el consecutivo y el año de Colombia |
| **06-02** #181 | Identificador inequívoco | ✅ | `UNIQUE` y búsqueda exacta |
| **06-03** #426 | No reutilizar el de una cancelada | ⚠️ | El consecutivo solo avanza y las órdenes no se borran; falta habilitar la cancelación |
| **07-01** #183 | En curso y finalizados con código, fecha, total y estado | ✅ | Pruebas en memoria y de integración |
| **07-02** #184 | Entregado entre los finalizados | ✅ | Pruebas en memoria |
| **07-03** #427 | Buscador de Mis pedidos | ✅ | Pruebas en memoria y de integración |
| **08-01** #898 | Buscar por el número del pedido | ✅ | `GET /gestion/:codigo` y filtro `codigo` |
| **08-02** #899 | Buscar por el correo del cliente | ✅ | Filtros `correo` y `telefono` |
| **08-03** #900 | Sin permiso no aparece ninguna orden | ✅ | HTTP 403 en el buscador |
| **09-01** #901 | Contacto, dirección y base entonada | ✅ | Detalle del personal |
| **09-02** #902 | Historial con autor y fecha | ✅ | `historial` en el detalle del personal |
| **09-03** #903 | Registrar que se contactó al cliente | ✅ | HTTP 201; medios correo y teléfono |
| **10-01** #904 | La nota interna no la ve el cliente ¹ | ✅ | La vista del cliente no incluye notas |
| **10-02** #905 | La nota muestra autor y momento | ✅ | HTTP 201 y detalle del personal |
| **10-03** #906 | La nota no se puede borrar | ✅ | HTTP 405 `NOTA_INMUTABLE` |
| **11-01** #907 | Historial de compras desde el pedido actual | ✅ | `/gestion/:codigo/historial-cliente` |
| **11-02** #908 | Un cliente no ve el historial de otro ¹ | ✅ | HTTP 403 para un cliente sin permisos del personal |

---

## 5. DEPENDENCIAS EXTERNAS Y PENDIENTES

| Quién | Qué falta | Criterios |
| :--- | :--- | :--- |
| **M07 Checkout y pago** (sin responsable) | Conservar la solicitud SOL, confirmar el pago y llamar a `serviciosOrdenes.creacion.crearDesdePagoConfirmado()` | 01-06 |
| **M09 Cumplimiento y preparación** | Verificación de disponibilidad por línea y paso automático a preparación (RF-CUM-03-10) | 03-02 |
| **M11 Postventa** (política del negocio) | Condiciones de cancelación y devolución (RF-POS-04-03) | 03-05, 03-08, 03-09, 03-10, 06-03 |
| **Analista principal** | P3 (pago tardío tras descartar la solicitud), P5 (¿el cliente ve Devuelto?) y la regla de redondeo | — |
| **Líder técnico** | Permisos del rol empresa en el seed (3.C) y confirmar que «Revisar órdenes» corresponde a `ventas.ver` | 04-03, 10-01, 11-02 |
| **M18 Notificaciones** | HU-NOT-02 (#203) esperaba a M08: M08 ya pide el correo al nacer la orden y al despacharla | — |
| **Frontend M08** | Pantallas y mensajes de la interfaz, con el informe entregado | 03-07 |

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `docs/assets/diagrams/M08/Maquina_de_estados_de_la_Orden.drawio.png` | Máquina de estados implementada; draw.io incrustado, con la página del flujo intacta. |
| **[MODIFICADO]** | `equipo-2-doc/assets/diagrams/M08/M08_Orden_de_venta.md` | Documento de diseño v2.0. |
| **[MODIFICADO]** | `docs/02_MODULOS_FUNCIONALES/M08_ESPECIFICACION_ORDEN.md` | Especificación completa desde la Tanda 3C, con implementación, definiciones y pendientes. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/m08.routes.ts` | Comentario de permisos actualizado; sin cambio de comportamiento. |
| **[NUEVO]** | `docs/walkthroughs/M08/walkthrough_v0.3.38.1_M08_cierre_documentacion_backend.md` | Este documento. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v0.3.38.1`. |
| **[MODIFICADO]** | `.github/version.txt` | `0.3.38.0` → `0.3.38.1`. |

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ`. `tsc --noEmit` y `npm run lint` limpios, y las pruebas en memoria siguen en **117/117**; el único cambio de código es un comentario.
* **Diagramas verificados:**
  * los 4 bloques Mermaid del documento de diseño se validaron y se dibujaron con Mermaid 11, sin errores;
  * draw.io de escritorio vuelve a abrir el PNG con sus dos páginas.
* **Especificación:** 11 historias, 34 requisitos y 49 criterios generados desde la Tanda 3C del Drive (versión 3.0, descargada de nuevo el 29/09 y sin cambios de contenido). Ya no enlaza imágenes que no existen.
* **Versión:** `✅ 0.3.38.1` en `.github/version.txt` y entrada en `docs/CHANGELOG.md`.
