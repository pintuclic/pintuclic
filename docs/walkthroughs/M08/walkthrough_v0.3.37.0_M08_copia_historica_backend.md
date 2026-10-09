# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión:** `v0.3.37.0` (Minior-feat; `.github/version.txt` de `0.3.36.0` a `0.3.37.0`)
* **Módulo de Origen:** `M08 - Orden de venta` (toca `bd/sql/*`, `bd/docs/*` y `core/db/types.ts` con visto bueno del líder técnico; el código vive en `backend/src/modules/m08-ordenes/`)
* **Fecha y Autor:** `29/09/2026` · `Manuel (Manuel151025), con apoyo de Agente de IA (backend / BD)`
* **Estado de la Implementación:** `⚠️ PARCIAL CON DEPENDENCIAS` (copia histórica completa y lista; la creación de órdenes, que la rellena, llega en la siguiente entrega)

Segunda tanda del modelo de datos (esquema **3.9**, documentación de BD **v2.7**), más su lectura en M08. El analista confirmó el 29/09 que la copia histórica, el identificador y la creación de la orden están definidos.

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| Historia / requisito | Cambio en esta versión |
| :--- | :--- |
| **HU-ORD-02** (#118) Copia histórica · RF-ORD-02-01/02 | La orden guarda el IVA y el modo de entrega. Cada línea guarda color, precio inicial y sus descuentos en orden (tabla `linea_orden_descuento`) |
| **HU-ORD-03** (#128) · D02 / RF-ORD-03-06 | Desde Preparada, la recogida solo puede pasar a Entregado y el domicilio solo a Despachado. Las órdenes antiguas sin modo conservan las dos salidas |
| **HU-ORD-04** (#148) · RF-ORD-04-01/03 | El detalle muestra modo y costo de entrega, IVA, solicitud de origen, color, descuentos y producto retirado sin enlace |
| **HU-ORD-05** (#155) · RF-ORD-05-05 | La bandeja muestra el modo de entrega |
| **HU-ORD-06** (#179) · RF-ORD-06-04 | Tabla `consecutivo` sin huecos, lista para el código `PC-AAAA-NNNNN` (se usa en la siguiente entrega) |
| **HU-ORD-09** (#583) · RF-ORD-09-01 | El personal ve la base que consume cada línea entonada |

### Contrato ampliado (mismas rutas, sin rutas nuevas)

```jsonc
// GET /api/ordenes/mis-pedidos/:codigo  y  GET /api/ordenes/gestion/:codigo
{
  "codigo": "ORD-2026-0003",
  "codigo_solicitud": "SOL-2026-00001",   // null si la orden no vino de una solicitud
  "modo_entrega": "recogida",             // "domicilio" | "recogida" | null (órdenes antiguas)
  "direccion": null,                      // null en recogida
  "sub_total": "275900.00", "descuento": "14590.00", "costo_entrega": "0.00", "total": "261310.00",
  "base_sin_impuesto": "219588.24", "importe_iva": "41721.76", "tasa_iva": "19.00",
  "lineas": [{
    "producto": "Viniltex Máxima Protección Antibacterial", "variante": "Galón - Azul Océano",
    "color_solicitado": "Azul Océano", "precio_inicial": "95900.00",
    "descuentos": [
      { "orden": 1, "origen": "Promoción Viniltex", "porcentaje": "10.00", "importe": "9590.00" },
      { "orden": 2, "origen": "Cupón de bienvenida", "porcentaje": null, "importe": "5000.00" }
    ],
    "precio_aplicado": "81310.00", "cantidad": 1,
    "es_entonado": false,
    "retirado": false, "id_producto": 1       // retirado: true → id_producto: null (sin enlace)
    // solo en /gestion: "base_consumida": "Base A - Galón" en las líneas entonadas
  }]
}
// GET /api/ordenes/gestion → cada fila añade "modo_entrega"
```

Nuevo error del cambio de estado, con el código `TRANSICION_NO_PERMITIDA` de siempre:
- **Recogida:** «Una orden de recogida en almacén no se despacha: al recogerla pasa directamente a «Entregado»».
- **Domicilio:** «Una orden a domicilio primero se despacha; «Entregado» es un paso posterior y opcional».

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **Producto retirado (RF-ORD-04-03):** la variante referenciada ya no existe, está inactiva o descontinuada, o su producto está inactivo o sin publicar.
  - «Agotado» no cuenta como retirado.
  - Una línea sin referencia no se marca como retirada, pero tampoco lleva enlace.
- **Importes congelados (D07):**
  - la orden guarda lo que se cobró, sin recalcular ni redondear;
  - `sub_total` es la suma de precios iniciales, `descuento` la suma de descuentos y `total` lo cobrado.
- **Retención (RF-ORD-02-04):** las líneas ya no se borran en cascada con la orden (`ON DELETE RESTRICT`).
- **Una solicitud, una orden:** `codigo_solicitud` es UNIQUE.

### B. Decisiones de Diseño
- **`codigo_solicitud` en lugar de `id_solicitud`:** la tabla de solicitudes de M07 aún no existe; se guarda el código visible `SOL-AAAA-NNNNN`, que es único y estable.
- **Contador sin huecos (opción B de la propuesta):** RF-ORD-06-04 exige que un salto en la numeración solo pueda ser un pedido cancelado. La tabla `consecutivo` es genérica para que M07 la use con SOL.
- **Seed sin actualizar filas existentes:** la guía de datos de prueba exige `ON CONFLICT DO NOTHING`. `ORD-2026-0001` y `0002` quedan con los campos nuevos vacíos en las bases que ya existían, y `ORD-2026-0003` trae la copia completa.
- **Sin redondeo:** RF-PRE-05-04 («al peso superior») y D07 («mitad hacia arriba») se contradicen; el analista lo escaló y M08 no fija ninguna regla.

### C. Políticas Transversales Validadas
- 🔒 **HU-SEG-06:** la base consumida solo llega al personal; el cliente recibe la copia de su compra sin datos de preparación, ni claves primarias, ni datos de pago.
- 🧱 **Seed centralizado:** los datos de prueba nuevos están en `bd/sql/seed_pintuclic.sql`.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN

Resumen: **31 cumplidos · 6 parciales · 12 bloqueados** (49 criterios). Antes eran 26 · 9 · 14, contando CA-ORD-05-05, que el analista confirmó el 29/09.

| CA | Resumen | Antes | Ahora | Método de validación |
| :--- | :--- | :---: | :---: | :--- |
| **02-02** #125 | Descuentos aplicados, su orden y su importe | ⛔ | ⚠️ | Lectura cumplida (memoria, BD y HTTP); los datos los guardará la creación de la orden |
| **02-05** #420 | Conserva el % de IVA aplicado | ⛔ | ⚠️ | Lectura cumplida; la copia al crear llega con HU-ORD-01 |
| **03-03** #136 | Recogida: Entregado con fecha y autor, sin despacho | ⚠️ | ✅ | La recogida no admite el despacho y pasa a Entregado con autor y fecha (memoria y HTTP) |
| **04-01** #150 | Detalle con modo de entrega | ⚠️ | ✅ | Modo y costo de entrega en el detalle |
| **04-02** #152 | Color entonado en el detalle | ⚠️ | ✅ | `color_solicitado` y `es_entonado` por línea |
| **04-04** #424 | Producto retirado con nota | ⚠️ | ✅ | `retirado: true` e `id_producto: null`; la nota visible la pone la interfaz |
| **09-01** #901 | Contacto, dirección y base entonada | ⚠️ | ✅ | La dirección aparece si hay envío, y `base_consumida` solo para el personal |

Siguen parciales **02-01**, **02-03** y **06-01** (dependen de la creación de la orden) y **03-07** (el mensaje lo muestra la interfaz).

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás
- **Despliegue:** la carga de BD del deploy aplica la migración sin acción manual (simulada dos veces con `psql -v ON_ERROR_STOP=1`).
- **M01:** lectura del estado de `variante` y `producto` solo para saber si siguen en el catálogo.

### B. Dependencias Hacia Adelante
- **Siguiente entrega de M08:** servicio de creación de la orden (HU-ORD-01). Rellena esta copia, usa el consecutivo y lo llamará M07.
- **Frontend M08:** detalle con descuentos, IVA, modo de entrega, solicitud, nota de producto retirado y base consumida.

### C. ⛔ Bloqueos Pendientes (fuera de M08)
- **M07 (sin responsable):** confirmar el pago y llamar a la creación de la orden.
- **M09:** disponibilidad por línea y avance automático a preparación.
- **Analista principal:** P3, P5, la política de M11 y el redondeo.

### ⚠️ Limitaciones Conocidas
1. **Validación local, no oficial:** PostgreSQL 15.19 local, en bases temporales. La validación en el entorno de integración corresponde al equipo de testing.
2. **Datos vacíos en órdenes antiguas:** las órdenes creadas antes de v3.9 muestran `null` en modo de entrega, IVA y precio inicial.
3. **Sin productos entonables en el seed:** la línea entonada de ejemplo usa un producto de texto sin referencia.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `bd/sql/schema_pintuclic.sql` | Esquema 3.9: `enum_modo_entrega`, columnas de copia histórica, 2 tablas y restricciones, con migración idempotente. |
| **[MODIFICADO]** | `bd/sql/seed_pintuclic.sql` | Copia completa en bases nuevas, `ORD-2026-0003`, 3 descuentos, historial y `setval`. |
| **[MODIFICADO]** | `backend/src/core/db/types.ts` | `EnumModoEntrega`, columnas nuevas, `LineaOrdenDescuentoTable` y `ConsecutivoTable`. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/interfaces/m08.interfaces.ts` | Tipos de líneas, descuentos, copia histórica y modo de entrega. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/repositories/ordenes.repository.ts` | Cabecera y líneas con la copia, estado del catálogo, descuentos y modo en la bandeja. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/services/ordenes.service.ts` | Detalle con la copia, `lineaRetirada`, recorte de la vista del cliente y modo en la bandeja. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/services/ciclo-estados.ts` | Transiciones desde Preparada según el modo de entrega. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/services/gestion-ordenes.service.ts` | Uso del modo de entrega y mensajes específicos. |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/__tests__/m08.test.ts` | 94 pruebas en memoria (12 nuevas). |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/__tests__/m08.integracion.test.ts` | 36 pruebas de solo lectura (7 nuevas). |
| **[MODIFICADO]** | `backend/src/modules/m08-ordenes/__tests__/m08.integracion-escritura.test.ts` | 17 pruebas con ROLLBACK (6 restricciones nuevas). |
| **[MODIFICADO]** | `bd/docs/WALKTHROUGH_DATABASE.md`, `bd/docs/DOCUMENTACION_BASE_DATOS.md`, `bd/docs/CHANGELOG_DATABASE.md`, `bd/README.md` | Versión 2.7 de la documentación de BD. |
| **[MODIFICADO]** | `docs/walkthroughs/M08/PROPUESTA_MODELO_DATOS_M08.md` | Secciones 3, 4, 5 y 8 marcadas como aplicadas. |
| **[NUEVO]** | `docs/walkthroughs/M08/walkthrough_v0.3.37.0_M08_copia_historica_backend.md` | Este documento. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `v0.3.37.0`. |
| **[MODIFICADO]** | `.github/version.txt` | `0.3.36.0` → `0.3.37.0`. |

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ`
  * `tsc --noEmit` y `npm run lint` limpios.
  * **94/94** en memoria.
  * **36/36** de integración de lectura y **17/17** de escritura con ROLLBACK, en una base migrada desde el esquema actual de `develop` y en una base nueva.
* **Simulación del despliegue:** `✅` Esquema y seed de `develop` (3.8), y encima los nuevos con `psql -v ON_ERROR_STOP=1`, dos veces seguidas:
  * código 0 en ambas ejecuciones;
  * 47 → 49 tablas;
  * órdenes antiguas intactas;
  * FK de líneas en RESTRICT;
  * sin duplicados.
* **Validación HTTP (base temporal): `✅ 9/9`:**
  * detalle del cliente con descuentos, IVA, modo de entrega, color y producto retirado, sin base consumida;
  * detalle del personal con base consumida;
  * bandeja con modo de entrega;
  * recorrido completo de una recogida, con el despacho rechazado y la entrega directa.
* **Versión:** `✅ 0.3.37.0` en `.github/version.txt` y entrada en `docs/CHANGELOG.md`.
