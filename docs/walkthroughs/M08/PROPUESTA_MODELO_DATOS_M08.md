# Propuesta de modelo de datos — M08 Orden de venta

* **Para:** Ibsen (líder técnico) · **De:** Manuel (backend M08) · **Fecha:** 24/09/2026
* **Base:** definiciones D01–D08 de la épica **#28** (actualización del 23/09/2026) y esquema `bd/sql/schema_pintuclic.sql` v3.7 en `develop`.
* **Estado:** propuesta para revisión. No modifica ningún archivo compartido; los cambios de `schema_pintuclic.sql`, `seed_pintuclic.sql` y `core/db/types.ts` los decide y aplica el líder técnico.

La épica #28 deja pendiente de líder técnico: *«Modelo y enum reconciliados con las transiciones definidas; permisos e historial persistente validados»*. Este documento propone ese modelo para que la revisión parta de algo concreto. Cada bloque indica qué criterios desbloquea y qué decisión queda abierta.

---

## Resumen

| # | Cambio | Desbloquea | Decisión abierta |
| --- | --- | --- | --- |
| 1 | Nuevos valores de `enum_estado_orden` | HU-ORD-03 y el avance de HU-ORD-05: #131, #176, #177 (esc. 2), #183 | Si `pendiente` se elimina recreando el tipo o queda sin uso |
| 2 | Tabla `historial_estado_orden` | #421, #131, #136, #422, historia de #150 | Si se protege con un disparador de solo inserción |
| 3 | `orden.id_solicitud` (relación SOL → PC) | #110, #113, #115, #417, #418 (junto con M07) | Diseño de la solicitud y de `pagos` (M07) |
| 4 | Consecutivo del código `PC-AAAA-NNNNN` | #180, #426 | Secuencia (con posibles huecos) o contador sin huecos |
| 5 | Copia histórica: color, precio inicial, descuentos, IVA y entrega | #124, #125, #420, #150, #152, #424, #136, #183 (esc. 3) | Qué pasa con `sub_total` y `descuento` actuales |
| 6 | Verificación de disponibilidad por línea | #134, #131 (esc. 3) | Reparto con M09 |
| 7 | Permisos y aclaraciones | Seguridad de HU-ORD-05; #115 | Ver sección 7 |

---

## 1. Estados de la orden

**Problema:** `enum_estado_orden` es `('pendiente', 'pagado', 'en_preparacion', 'enviado', 'entregado', 'cancelado')`. #128 define otro ciclo, y el valor por defecto `pendiente` contradice que no exista orden sin pago (RF-ORD-01-01).

**Propuesta para el esquema** (bases nuevas):

```sql
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_estado_orden') THEN
    CREATE TYPE enum_estado_orden AS ENUM (
        'orden_confirmada', 'revision_disponibilidad', 'en_preparacion', 'preparada',
        'despachado', 'entregado', 'cancelado', 'devuelto'
    );
END IF;
-- En la tabla orden:
estado enum_estado_orden NOT NULL DEFAULT 'orden_confirmada',
```

**Migración para bases que ya existen** (conserva los datos):

```sql
ALTER TYPE enum_estado_orden RENAME VALUE 'pagado' TO 'orden_confirmada';
ALTER TYPE enum_estado_orden RENAME VALUE 'enviado' TO 'despachado';
ALTER TYPE enum_estado_orden ADD VALUE IF NOT EXISTS 'revision_disponibilidad' AFTER 'orden_confirmada';
ALTER TYPE enum_estado_orden ADD VALUE IF NOT EXISTS 'preparada' AFTER 'en_preparacion';
ALTER TYPE enum_estado_orden ADD VALUE IF NOT EXISTS 'devuelto';
ALTER TABLE orden ALTER COLUMN estado SET DEFAULT 'orden_confirmada';
```

- `pendiente` queda sin uso: PostgreSQL no permite quitar un valor de un enum sin recrear el tipo. En entornos que se recrean con `npm run db:reset` basta con el `CREATE TYPE` nuevo.
- `devuelto` se incluye porque #128 lo contempla como terminal. Su etiqueta visible al cliente sigue pendiente (P5), pero eso no afecta al valor interno.
- **También cambian:** `EnumEstadoOrden` en `core/db/types.ts` y el seed (`ORD-2026-0001` pasa de `pagado` a `orden_confirmada`).
- **En M08:** la clasificación de Mis pedidos y la lista del DTO del listado dejarán de compilar hasta actualizarse. Está hecho a propósito, para que el cambio no pase desapercibido.

## 2. Historial de transiciones

**Problema:** #421 exige que cada cambio de estado conserve estado alcanzado, autor y fecha/hora. D01 pide motivo al volver de Preparada a En preparación, y #422 exige el rastro de la resolución económica externa. Hoy no hay dónde guardarlo, y la auditoría de M20 (HU-SEG-04) está en pausa. #421 aclara además que evento, auditoría e intento de correo son registros distintos.

```sql
CREATE TABLE IF NOT EXISTS historial_estado_orden (
    id_historial SERIAL PRIMARY KEY,
    id_orden INT NOT NULL,
    estado_anterior enum_estado_orden,          -- NULL cuando la orden nace
    estado_nuevo enum_estado_orden NOT NULL,
    id_usuario_autor INT,                       -- NULL = transición automática del sistema (D01)
    motivo TEXT,                                -- obligatorio al rehacer preparación (D01) y al cancelar (#422)
    referencia_externa VARCHAR(150),            -- rastro de la resolución económica externa (D03, #422)
    fecha TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_orden FOREIGN KEY (id_orden)
        REFERENCES orden (id_orden) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_historial_autor FOREIGN KEY (id_usuario_autor)
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT
);

COMMENT ON TABLE historial_estado_orden IS 'Historia inmutable de transiciones de la orden (HU-ORD-03, #421). Solo inserción.';
CREATE INDEX IF NOT EXISTS idx_historial_orden ON historial_estado_orden(id_orden, fecha);
```

- **Fechas de despacho y entrega (#150):** se obtienen de esta tabla, así que no hacen falta columnas nuevas en `orden`.
- **Decisión:** si se añade un disparador que impida `UPDATE` y `DELETE` sobre la tabla, o basta con que ningún repositorio lo haga.

## 3. Relación solicitud (SOL) → orden (PC)

**Problema:** D04 y D06 establecen que M07 administra la solicitud `SOL-AAAA-NNNNN` y que M08 crea el pedido al confirmarse el pago, conservando la relación. Hoy no existe la solicitud, y `pagos.id_orden` es `NOT NULL`, así que un pago no puede registrarse antes que su orden.

**Lo que M08 necesita** (la tabla de solicitud la diseña M07):

```sql
ALTER TABLE orden ADD COLUMN IF NOT EXISTS id_solicitud INT;
ALTER TABLE orden ADD CONSTRAINT uq_orden_solicitud UNIQUE (id_solicitud);
-- y, cuando exista la tabla de M07:
-- ALTER TABLE orden ADD CONSTRAINT fk_orden_solicitud FOREIGN KEY (id_solicitud) REFERENCES <solicitud_m07> (id) ...;
```

- El `UNIQUE` sobre `id_solicitud`, junto con el que ya existe sobre `transaccion_pago_id`, garantiza que una confirmación repetida no cree otra orden (#417).
- **Decisión de M07:** si `pagos` pasa a referenciar la solicitud, o si `id_orden` se vuelve opcional. También hace falta el permiso de verificación manual (sección 7).

## 4. Consecutivo del código `PC-AAAA-NNNNN`

**Problema:** D04 exige un consecutivo corrido, que no se reinicie con el año ni reutilice números cancelados. #179 deja la protección ante accesos simultáneos al líder técnico. M08 ya tiene el generador del formato (`codigo-pedido.service.ts`): solo falta la fuente del número.

| Opción | SQL | A favor | En contra |
| --- | --- | --- | --- |
| A. Secuencia | `CREATE SEQUENCE IF NOT EXISTS seq_codigo_pedido START 1;` | Simple; no bloquea creaciones simultáneas; nunca repite | Puede dejar huecos si la transacción falla después de pedir el número |
| B. Contador sin huecos | `CREATE TABLE IF NOT EXISTS contador_codigo (nombre VARCHAR(20) PRIMARY KEY, ultimo BIGINT NOT NULL);` y en la transacción de creación `UPDATE contador_codigo SET ultimo = ultimo + 1 WHERE nombre = 'PC' RETURNING ultimo;` | Sin huecos; se revierte junto con la orden | Serializa la creación de órdenes |

- **Recomendación:** B si «consecutivo corrido» significa sin huecos, y A en caso contrario. Es una pregunta para el analista.
- **Seed:** los códigos pasan a `PC-2026-00001` y `PC-2026-00002`.

## 5. Copia histórica completa

**Problema:** #118, #124, #125 y #420 exigen conservar, por línea, el color solicitado, el precio de partida y cada descuento. En la orden hay que conservar la base sin impuesto, el IVA (importe y tasa) y el modo y costo de entrega, todo congelado al crear la solicitud (D07).

```sql
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_modo_entrega') THEN
    CREATE TYPE enum_modo_entrega AS ENUM ('domicilio', 'recogida');
END IF;

ALTER TABLE linea_orden
    ADD COLUMN IF NOT EXISTS color_solicitado VARCHAR(150),
    ADD COLUMN IF NOT EXISTS precio_inicial NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS id_variante_ref INT;          -- sin FK a propósito (ADR-05); permite la nota de #424

ALTER TABLE orden
    ADD COLUMN IF NOT EXISTS base_sin_impuesto NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS importe_iva NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS tasa_iva NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS modo_entrega enum_modo_entrega,
    ADD COLUMN IF NOT EXISTS costo_entrega NUMERIC(12, 2) NOT NULL DEFAULT 0.00;

CREATE TABLE IF NOT EXISTS linea_orden_descuento (
    id_linea_orden_descuento SERIAL PRIMARY KEY,
    id_linea_orden INT NOT NULL,
    orden_aplicacion SMALLINT NOT NULL,
    origen VARCHAR(150) NOT NULL,              -- nombre u origen del descuento (#125)
    porcentaje NUMERIC(5, 2),
    importe NUMERIC(12, 2) NOT NULL,
    CONSTRAINT fk_lod_linea FOREIGN KEY (id_linea_orden)
        REFERENCES linea_orden (id_linea_orden) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT uq_lod_orden_aplicacion UNIQUE (id_linea_orden, orden_aplicacion),
    CONSTRAINT chk_lod_importe CHECK (importe >= 0),
    CONSTRAINT chk_lod_porcentaje CHECK (porcentaje IS NULL OR (porcentaje >= 0 AND porcentaje <= 100))
);
```

- **Decisión:** qué representan desde ahora `orden.sub_total` y `orden.descuento`. Una opción es que `sub_total` sea la suma de precios iniciales y `descuento` la suma de `linea_orden_descuento`, conservando `total` como importe final.
- `id_variante_ref` guarda el identificador **sin** clave foránea. Así la línea no depende del catálogo vivo, pero M08 puede comprobar si el producto sigue activo para mostrar la nota de «ya no disponible».

## 6. Verificación de disponibilidad por línea (con M09)

**Problema:** #134 exige conservar la verificación de cada línea, con resultado total, parcial o nulo, y su historia. D01 hace avanzar la orden a En preparación cuando se confirma la última línea totalmente disponible.

```sql
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_disponibilidad_linea') THEN
    CREATE TYPE enum_disponibilidad_linea AS ENUM ('total', 'parcial', 'nula');
END IF;

CREATE TABLE IF NOT EXISTS verificacion_disponibilidad (
    id_verificacion SERIAL PRIMARY KEY,
    id_linea_orden INT NOT NULL,
    resultado enum_disponibilidad_linea NOT NULL,
    id_usuario_autor INT NOT NULL,
    observacion TEXT,
    fecha TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_verif_linea FOREIGN KEY (id_linea_orden)
        REFERENCES linea_orden (id_linea_orden) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_verif_autor FOREIGN KEY (id_usuario_autor)
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT
);
```

- **Decisión:** si esta tabla es de M08 o de M09 (#29). La verificación vigente de una línea es su último registro.

## 7. Permisos y aclaraciones

1. **Permiso «Verificación de pagos»** (D06, #115): no existe en el seed. Propuesta: `pagos.verificar`, de M07, con el alta en el catálogo de M17.
2. **Correspondencia de nombres:** confirmar que «Revisar órdenes» = `ventas.ver` y «Gestión de pedidos» = `ventas.gestionar`, que es lo que ya usa M08.
3. **Posible exposición de datos:** según el seed, el rol 3 (`empresa_vip`, **cliente** empresa) tiene `ordenes.ver` y `ventas.ver` en `asignacion_permiso`. Si se confirma, un cliente empresa vería el listado de órdenes de **todos** los clientes en `GET /api/ordenes/gestion` (HU-SEG-06). Propuesta: retirar `(3, 4)` y `(3, 10)` del seed.
4. **`orden.carrito_o_cotizacion`** (añadida en #428): se solapa con `origen`, y el seed usa `carrito_directo` y `cotizacion_aprobada`. ¿Qué información aporta que `origen` no tenga? Si ninguna, se propone retirarla antes de que alguien la use.
5. **`linea_orden` con `ON DELETE CASCADE`:** contradice la retención de la orden (nunca se elimina). Propuesta: `ON DELETE RESTRICT`.
6. **Seed roto en bases nuevas** (#428): `base` referencia las variantes 1 y 2 antes de insertarlas (ciclo `base → variante → color → base`), y `npm run db:seed` falla con `fk_base_variante`. Afecta a todo el equipo, incluido testing.

---

## Orden de aplicación sugerido

1. **Estados (1) e historial (2):** desbloquean HU-ORD-03 y el avance de HU-ORD-05, que no dependen de M07.
2. **Copia histórica (5):** M08 puede leer y mostrar los datos aunque la creación llegue después.
3. **Consecutivo PC (4) y relación SOL (3):** junto con M07, para HU-ORD-01.
4. **Disponibilidad (6):** junto con M09.

Tras cada paso, M08 implementa lo que ese cambio habilita, dentro de su carpeta, con sus pruebas y su walkthrough.
