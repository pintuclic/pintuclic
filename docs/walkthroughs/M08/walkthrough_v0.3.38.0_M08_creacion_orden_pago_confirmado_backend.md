# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión:** `v0.3.38.0` (Minior-feat; `.github/version.txt` de `0.3.37.0` a `0.3.38.0`)
* **Módulo de Origen:** `M08 - Orden de venta` (solo `backend/src/modules/m08-ordenes/`; sin cambios de BD ni de archivos compartidos)
* **Fecha y Autor:** `29/09/2026` · `Manuel (Manuel151025), con apoyo de Agente de IA (backend)`
* **Estado de la Implementación:** `⚠️ PARCIAL CON DEPENDENCIAS` (el servicio de creación está listo y probado; falta que M07, que no tiene responsable, lo llame al confirmar el pago)

Servicio de creación de la orden al confirmarse el pago (HU-ORD-01). El líder técnico indicó el 29/09 que M08 deje listos sus servicios y que M07 no corresponde a este equipo. El analista confirmó ese mismo día que la creación normal, la copia histórica y el identificador están definidos.

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| Historia / requisito | Cambio en esta versión |
| :--- | :--- |
| **HU-ORD-01** (#98) · RF-ORD-01-01/03/05/06 | Servicio `crearDesdePagoConfirmado()`. Crea la orden solo con un pago confirmado, por la pasarela o por la verificación de un empleado. Registra el origen y no duplica si la confirmación se repite |
| **HU-ORD-02** (#118) · RF-ORD-02-01/02 · D07 | Al crearse, la orden guarda la copia exacta de la solicitud: líneas, color, precios, descuentos en orden, IVA y entrega. No se recalcula ni se redondea |
| **HU-ORD-03** (#128) · CA-ORD-03-04 | La orden nace en «Orden confirmada» con su primer registro de historial. Lo hace el sistema si pagó la pasarela, o el empleado si verificó el pago |
| **HU-ORD-06** (#179) · RF-ORD-06-04 · D04 | Código `PC-AAAA-NNNNN` con el consecutivo sin huecos y el año de Colombia |
| **D05** · HU-NOT-02 | Correo «Orden confirmada» al cliente al nacer la orden; si el correo falla, la orden sigue creada |

### Contrato para M07 (llamada interna, sin ruta HTTP)

```ts
import { serviciosOrdenes } from '../m08-ordenes/m08.routes';

const resultado = await serviciosOrdenes.creacion.crearDesdePagoConfirmado({
  codigoSolicitud: 'SOL-2026-00042',      // SOL-AAAA-NNNNN de M07; identifica la operación
  idCliente: 2,
  origen: 'carrito',                      // 'carrito' | 'cotizacion'
  idCotizacion: null,                     // obligatorio si origen = 'cotizacion'; prohibido si 'carrito'
  modoEntrega: 'domicilio',               // 'domicilio' | 'recogida'
  direccion: 'Calle 45 # 12-34, Bogotá',  // obligatoria a domicilio
  costoEntrega: '12000.00',               // importes: texto o número exacto, 0 o positivos, hasta 2 decimales
  subTotal: '275900.00',                  // suma de precios iniciales
  descuento: '14590.00',                  // suma de descuentos
  total: '273310.00',                     // lo cobrado
  baseSinImpuesto: '229672.27', importeIva: '43637.73', tasaIva: 19,
  observaciones: null,
  lineas: [{
    nombreProducto: 'Viniltex Máxima Protección Antibacterial', varianteCopia: 'Galón - Azul Océano',
    cantidad: 1, precioInicial: '95900.00', precioAplicado: '81310.00',
    colorSolicitado: 'Azul Océano', idVarianteRef: 2,
    esEntonado: false, baseConsumida: null,        // si esEntonado: color y base obligatorios
    descuentos: [                                  // el orden del arreglo es el orden de aplicación
      { origen: 'Promoción Viniltex', porcentaje: 10, importe: '9590.00' },
      { origen: 'Cupón de bienvenida', porcentaje: null, importe: '5000.00' },
    ],
  }],
  confirmacion: { medio: 'pasarela', transaccionId: 'TRX-PSE-555000111', montoConfirmado: '273310.00' },
  // o bien: { medio: 'verificacion_manual', idEmpleado: 1, referencia: 'Comprobante 7781', montoConfirmado: '273310.00' }
});
// → { codigo: 'PC-2026-00001', codigoSolicitud: 'SOL-2026-00042', estado: 'orden_confirmada', creada: true }
//   Con la misma SOL otra vez → la misma orden con creada: false
```

| Error | Cuándo |
| :--- | :--- |
| `ZodError` (400 `VALIDATION_ERROR` si llega al manejador de Express) | Falta la confirmación del pago, o hay un campo desconocido, mal escrito o con formato inválido, o faltan dirección, cotización o base de una línea entonada |
| 409 `PAGO_INSUFICIENTE` | `montoConfirmado` menor que `total` (D06) |
| 409 `TRANSACCION_YA_USADA` | La transacción de la pasarela ya generó la orden de otra solicitud |
| 409 `SOLICITUD_DE_OTRO_CLIENTE` | La SOL ya generó una orden de otro cliente |
| 400 `REFERENCIA_INEXISTENTE` | No existe el cliente, la cotización o el empleado indicados |

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **Sin pago confirmado no hay orden (RF-ORD-01-01):**
  - la confirmación es obligatoria y el monto confirmado debe cubrir el total (D06);
  - no hay ninguna ruta HTTP que cree órdenes.
- **Pasarela y verificación manual son equivalentes (CA-ORD-01-03):** la orden es la misma. Solo cambia quién queda como autor del primer registro del historial: el sistema, con la transacción como referencia, o el empleado, con la referencia del comprobante.
- **Una solicitud, una orden (CA-ORD-01-05):**
  - si la SOL ya tiene orden, se devuelve esa orden con `creada: false`, sin consumir número ni repetir el correo;
  - si dos confirmaciones llegan a la vez, la segunda espera y devuelve la orden de la primera.
- **Todo o nada (CA-ORD-01-06):**
  - orden, líneas, descuentos, historial y consecutivo van en una sola transacción;
  - si algo falla no queda nada escrito y el número no se gasta, así que M07 puede reintentar.
- **Consecutivo sin huecos (RF-ORD-06-04):**
  - el número se toma dentro de la misma transacción, y el bloqueo de la fila ordena las creaciones simultáneas;
  - el año del código y la fecha de la orden son los de Colombia, aunque en UTC ya sea el día siguiente.
- **Importes congelados (D07):** se copian tal como llegan. Un número inexacto como `0.1 + 0.2` se rechaza para no guardar un valor distinto del cobrado.

### B. Decisiones de Diseño
- **Llamada interna, no HTTP:** quien confirma el pago, sea la pasarela o la pantalla «Verificación de pagos», es M07. M08 se expone como `serviciosOrdenes`, con el mismo patrón que `servicioNotificaciones` de M18 y `serviciosSeguridad` de M20.
- **Transacción propia e idempotente:** la creación no participa de una transacción de M07. Si M07 confirma el pago y la creación falla, basta con volver a llamar; la SOL impide duplicados.
- **Validación estricta:** los objetos del contrato rechazan campos desconocidos en lugar de ignorarlos. Además, la compilación falla si el contrato (`SolicitudPagoConfirmado`) y su validación dejan de tener los mismos campos.
- **Sin comprobar sumas:** M08 no verifica que las líneas sumen el subtotal. Hacerlo impondría una regla de redondeo que el analista aún no ha fijado (RF-PRE-05-04 frente a D07).
- **Correo reutilizado:** el aviso a M18 pasa a `services/aviso-cliente.ts`, que comparten la creación y el cambio de estado, con la misma plantilla `cambio_estado_orden`.

### C. Políticas Transversales Validadas
- 🔒 **HU-SEG-06:** la respuesta a M07 solo trae el código, la SOL, el estado y si se creó. Los errores no exponen datos de otras órdenes.
- 📧 **M18 / D05:** correo al nacer la orden, sin bloquear. Un fallo del correo queda en el log y no deshace la orden.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

Resumen: **41 cumplidos · 3 parciales · 5 bloqueados** (49 criterios). Antes eran 31 · 6 · 12.

| CA | Resumen | Antes | Ahora | Método de validación |
| :--- | :--- | :---: | :---: | :--- |
| **01-01** #110 | Al confirmar el pago se genera la orden | ⛔ | ✅ | Memoria, BD con ROLLBACK y el servicio real con correo simulado. Falta que M07 lo invoque |
| **01-02** #113 | Sin pago confirmado no hay orden | ⛔ | ✅ | Sin confirmación o con pago corto se rechaza sin escribir nada; no hay ruta que cree órdenes |
| **01-03** #115 | Verificación manual equivalente a la pasarela | ⛔ | ✅ | Misma orden; el empleado queda como autor del historial (BD y HTTP) |
| **01-04** #117 | Registra la cotización de origen | ⛔ | ✅ | `id_cotizacion` y origen en BD |
| **01-05** #417 | Pago duplicado no crea otra orden | ⛔ | ✅ | Repetida y simultánea: la misma orden, sin otro número ni otro correo |
| **01-06** #418 | Recuperar la compra tras un fallo | ⛔ | ⚠️ | Un fallo no deja nada y se puede reintentar; conservar la SOL es de M07 |
| **02-01** #124 | Conserva el precio aunque cambie el catálogo | ⚠️ | ✅ | La creación copia los precios; la lectura ya estaba cumplida |
| **02-02** #125 | Descuentos aplicados, su orden y su importe | ⚠️ | ✅ | Guardados en orden al crear y leídos en el detalle (BD y HTTP) |
| **02-03** #126 | Importe acordado de la cotización | ⚠️ | ✅ | Se copian los importes que entrega la solicitud, sin recalcular (D08) |
| **02-05** #420 | Conserva el % de IVA aplicado | ⚠️ | ✅ | `tasa_iva` copiada al crear |
| **06-01** #180 | Identificador propio y distinto | ⚠️ | ✅ | `PC-AAAA-NNNNN` con el consecutivo y el año de Colombia |
| **06-03** #426 | No reutilizar el de una cancelada | ⛔ | ⚠️ | El consecutivo solo avanza y las órdenes no se borran; la cancelación aún no está habilitada (M11) |

Siguen parcial **03-07** (el mensaje lo muestra la interfaz). Siguen bloqueados **03-02** (M09), **03-05**, **03-08**, **03-09** y **03-10** (política M11 y aclaraciones del analista principal).

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **M18:** plantilla `cambio_estado_orden` para el correo «Orden confirmada».
- **Esquema 3.9 (v0.3.37.0):** tablas `consecutivo` y `linea_orden_descuento`, y columnas de copia histórica. Esta entrega no cambia la BD.

### B. Dependencias Hacia Adelante
- **M07:** al confirmar el pago, llamar a `serviciosOrdenes.creacion.crearDesdePagoConfirmado()` con el contrato de la sección 2, y conservar la SOL hasta obtener la orden (RF-ORD-01-06).
  - La pantalla «Verificación de pagos» y su permiso son de M07: el servicio confía en el `idEmpleado` que recibe.
- **Frontend M08:** las órdenes creadas aparecen en Mis pedidos, en la bandeja y en los detalles sin cambios de contrato.

### C. ⛔ Bloqueos Pendientes (fuera de M08)
- **M07 (sin responsable):** confirmar el pago y llamar a la creación.
- **M09:** disponibilidad por línea y avance automático a preparación.
- **Analista principal:** P3 (pago tardío tras descartar la SOL), P5, la política de M11 y el redondeo.

### ⚠️ Limitaciones Conocidas
1. **Validación local, no oficial:** PostgreSQL 15.19 local, en una base temporal ya borrada. La validación en el entorno de integración corresponde al equipo de testing.
2. **Sin prueba de extremo a extremo con M07:** M07 aún no existe. El servicio se probó llamándolo directamente como lo hará M07.
3. **Pago tardío (P3):** si llega un pago después de descartar la SOL, M08 crearía la orden si M07 lo llama. Qué hacer en ese caso lo decide M07 cuando el analista responda.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[NUEVO]** | `backend/src/modules/m08-ordenes/services/creacion-orden.service.ts` | `CreacionOrdenService.crearDesdePagoConfirmado()`: validación, idempotencia, pago suficiente, fecha de Colombia, errores claros y correo. |
| **[NUEVO]** | `backend/src/modules/m08-ordenes/services/aviso-cliente.ts` | Aviso al cliente por M18 compartido por la creación y el cambio de estado. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/services/gestion-ordenes.service.ts` | Usa `aviso-cliente.ts`; mismo comportamiento. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/repositories/ordenes.repository.ts` | `buscarPorOperacion()` y `crearOrdenConfirmada()` (consecutivo, orden, líneas, descuentos e historial en una transacción). |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/interfaces/m08.interfaces.ts` | Contrato `SolicitudPagoConfirmado`, `ConfirmacionPago`, `LineaSolicitud`, `DescuentoSolicitud`, `ResultadoCreacionOrden` y tipos internos. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/dtos/ordenes.dto.ts` | `SolicitudPagoConfirmadoDto` (Zod estricto) y comprobación de campos contra el contrato. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/m08.routes.ts` | Exporta `serviciosOrdenes.creacion` para M07; sin rutas nuevas. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/__tests__/m08.test.ts` | 117 pruebas en memoria (23 nuevas). |
| **[NUEVO]** | `backend/src/modules/m08-ordenes/__tests__/m08.integracion-creacion.test.ts` | 16 pruebas contra PostgreSQL que se deshacen siempre, incluidas dos creaciones simultáneas. |
| **[NUEVO]** | `docs/walkthroughs/M08/walkthrough_v0.3.38.0_M08_creacion_orden_pago_confirmado_backend.md` | Este documento. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v0.3.38.0`. |
| **[MODIFICADO]** | `.github/version.txt` | `0.3.37.0` → `0.3.38.0`. |

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ`
  * `tsc --noEmit` y `npm run lint` limpios.
  * **117/117** en memoria.
  * **16/16** de creación contra PostgreSQL con ROLLBACK, más las pruebas que ya existían: **36/36** de lectura y **17/17** de escritura. Todo en una base temporal con el esquema y el seed de `develop`, cargados con `psql -v ON_ERROR_STOP=1`.
* **Servicio real con correo simulado (base temporal):** `✅`
  * la 1.ª llamada crea `PC-2026-00001` y la 2.ª devuelve la misma orden con `creada: false`;
  * M18 registra un solo correo, «Orden confirmada»;
  * el consecutivo queda en 1.
* **Validación HTTP (base temporal): `✅ 7/7`:**
  * la orden creada aparece en Mis pedidos y en su detalle, con la SOL, los descuentos y el historial;
  * aparece en la bandeja con cliente y modo, y en el detalle del personal con el empleado como autor;
  * los contadores la incluyen y avanza por el ciclo;
  * `POST /api/ordenes` no existe.
* **Base local del desarrollador:** sin tocar.
* **Versión:** `✅ 0.3.38.0` en `.github/version.txt` y entrada en `docs/CHANGELOG.md`.
