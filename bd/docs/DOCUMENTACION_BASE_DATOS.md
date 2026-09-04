# 📘 Arquitectura y Documentación del Esquema de Base de Datos - PINTUCLIC

> **Versión Actual:** 2.0 (Actualizada con la página **FINAL** del diagrama Draw.io)  
> **Motor de Base de Datos:** PostgreSQL 12+ (Compatible con PostgreSQL 18)  
> **Total de Tablas:** 25  
> **Script DDL Oficial:** [`../sql/schema_pintuclic.sql`](../sql/schema_pintuclic.sql)  
> **Walkthrough Detallado de Migraciones:** [`./WALKTHROUGH_DATABASE.md`](./WALKTHROUGH_DATABASE.md)

---

## 📜 Historial Resumido de Versiones (Changelog)

| Versión | Fecha | Tablas Nuevas | Tablas Deprecadas | Cambios Destacados | Detalle Completo |
| :---: | :---: | :--- | :--- | :--- | :---: |
| **v2.0** | 2026-09-03 | `categoria`, `subcategorias`, `sub_subcategorias`, `linea`, `color`, `tonos`, `variante`, `caracteristica`, `combo`, `variante_combo` (10) | `descripcion`, `nesesidad`, `presentacion`, `producto_descripcion`, `producto_presentacion` (5) | Catálogo multinivel de 4 capas, variantes por color/tono, combos, 8 ENUMs nativos y `UNIQUE(id_usuario)` en `usuario_rol`. | [Ver v2.0](./WALKTHROUGH_DATABASE.md#-versión-20-2026-09-03) |
| **v1.0** | 2026-09-02 | 21 tablas iniciales | Ninguna | Esquema fundacional derivado del diagrama `Pre-Final`. | [Ver v1.0](./WALKTHROUGH_DATABASE.md#-versión-10-2026-09-02) |

---

## 🎯 1. Visión General del Sistema

El esquema de base de datos de **Pintuclic** soporta las operaciones integrales de comercio electrónico B2B y B2C, cotizaciones, gestión de catálogo multinivel, inventario de colores/tonos/variantes, carritos, pedidos, facturación, pagos y reservación de servicios.

### 🌟 Cambios Clave en la Versión 2.0 (Página FINAL):
1. **Reestructuración Completa del Catálogo:**  
   Se implementó una jerarquía precisa de 4 niveles para la clasificación de productos:  
   `categoria` $\rightarrow$ `subcategorias` $\rightarrow$ `sub_subcategorias` $\rightarrow$ `linea` $\rightarrow$ `producto`.
2. **Desglose de Colores, Tonos y Variantes:**  
   - `color` $\rightarrow$ `tonos` (con variación de precios por matiz).
   - `producto` $\rightarrow$ `variante` (asociado a un color y precio propio).
   - `variante` $\rightarrow$ `caracteristica` (atributos técnicos de la variante).
3. **Módulo de Combos y Paquetes Promocionales:**  
   - `producto` $\rightarrow$ `combo`.
   - `combo` + `variante` $\rightarrow$ `variante_combo` (especifica variantes y cantidades exactas incluidas en cada combo).
4. **Blindaje de Integridad:**  
   - 8 tipos `ENUM` nativos de PostgreSQL para evitar estados inconsistentes o errores tipográficos.
   - Restricción `UNIQUE(id_usuario)` en `usuario_rol` para forzar que ningún usuario tenga más de 1 rol simultáneo.
   - Restricción `UNIQUE` en `usuario(correo)`, `rol(nombre)`, `permisos(nombre)`, `asignacion_permiso(id_rol, id_permiso)` y `variante_combo(id_variante, id_combo)`.

---

## 🗺️ 2. Diagrama Entidad-Relación (Mermaid ER)

```mermaid
erDiagram
    descuento ||--o{ sub_rol_empresa : "aplica a"
    sub_rol_empresa ||--o{ rol : "agrupa"
    rol ||--o{ asignacion_permiso : "tiene"
    permisos ||--o{ asignacion_permiso : "asignado en"
    rol ||--o{ usuario : "define perfil"
    usuario ||--|| usuario_rol : "posee (1:1)"
    rol ||--o{ usuario_rol : "asignado a"

    usuario ||--o{ carrito : "crea"
    carrito ||--o{ detalle_carrito : "contiene"
    carrito ||--o{ pedido : "genera"
    pedido ||--o{ pagos : "registra"
    metodo_pago ||--o{ pagos : "utilizado en"
    pedido ||--o{ factura : "emite"
    usuario ||--o{ reservaciones : "realiza"

    categoria ||--o{ subcategorias : "divide en"
    subcategorias ||--o{ sub_subcategorias : "subdivide en"
    sub_subcategorias ||--o{ linea : "agrupa"
    linea ||--o{ producto : "clasifica"

    producto ||--o{ combo : "es un"
    producto ||--o{ variante : "tiene"
    color ||--o{ variante : "define"
    color ||--o{ tonos : "desglosa en"
    variante ||--o{ variante_combo : "incluida en"
    combo ||--o{ variante_combo : "compuesto por"
    variante ||--o{ caracteristica : "describe"

    producto ||--o{ detalle_carrito : "agregado a"
    producto ||--o{ reservaciones : "reservado en"
```

---

## 🏛️ 3. Módulos del Sistema y Diccionario de Datos (25 Tablas)

### Módulo 1: Seguridad, Roles y Descuentos (5 Tablas)
| Tabla | PK | FKs | Descripción |
| :--- | :--- | :--- | :--- |
| **`descuento`** | `id_descuento` | Ninguna | Define topes monetarios y porcentajes de descuento (0 a 100%). |
| **`sub_rol_empresa`** | `id_sub_rol_empresa` | `id_descuento` $\rightarrow$ `descuento` | Sub-clasificación de perfiles de clientes comerciales asociados a descuentos. |
| **`rol`** | `id_rol` | `id_sub_rol_empresa` $\rightarrow$ `sub_rol_empresa` | Roles base del sistema (`nombre` UNIQUE). |
| **`permisos`** | `id_permiso` | Ninguna | Permisos atómicos del sistema (`nombre` UNIQUE). |
| **`asignacion_permiso`** | `id_asignacion_permiso` | `id_rol`, `id_permiso` | Matriz N:M con restricción `UNIQUE(id_rol, id_permiso)`. |

### Módulo 2: Cuentas de Usuario y Control de Acceso (2 Tablas)
| Tabla | PK | FKs | Descripción |
| :--- | :--- | :--- | :--- |
| **`usuario`** | `id_usuario` | `id_rol` $\rightarrow$ `rol` | Cuentas con `correo` UNIQUE, hash BCrypt en `contrasena` y estado de usuario. |
| **`usuario_rol`** | `id_usuario_rol` | `id_usuario`, `id_rol` | Asignación con restricción `UNIQUE(id_usuario)` (máximo 1 rol por usuario). |

### Módulo 3: Catálogo Multinivel, Colores y Variantes (11 Tablas)
| Tabla | PK | FKs | Descripción |
| :--- | :--- | :--- | :--- |
| **`categoria`** | `id_categoria` | Ninguna | Nivel 1 del catálogo (e.g. Pinturas Arquitectónicas, Esmaltes). |
| **`subcategorias`** | `id_subcategoria` | `id_categoria` $\rightarrow$ `categoria` | Nivel 2 de agrupación. |
| **`sub_subcategorias`** | `id_sub_subcategoria` | `id_subcategoria` $\rightarrow$ `subcategorias` | Nivel 3 de agrupación. |
| **`linea`** | `id_linea` | `id_sub_subcategoria` $\rightarrow$ `sub_subcategorias` | Nivel 4: Línea de marca (e.g. Viniltex, Koraza). |
| **`producto`** | `id_producto` | `id_linea` $\rightarrow$ `linea` | Entidad base del producto. |
| **`color`** | `id_color` | Ninguna | Catálogo maestro de colores base (`nombre` UNIQUE). |
| **`tonos`** | `id_tono` | `id_color` $\rightarrow$ `color` | Tonos/matices derivados de un color con su precio adicional. |
| **`variante`** | `id_variante` | `id_producto`, `id_color` | SKU vendible de un producto con precio específico y color opcional. |
| **`caracteristica`** | `id_caracteristica` | `id_variante` $\rightarrow$ `variante` | Ficha técnica o especificaciones de la variante. |
| **`combo`** | `id_combo` | `id_producto` $\rightarrow$ `producto` | Paquete comercial ligado a un producto. |
| **`variante_combo`** | `id_variante_combo` | `id_variante`, `id_combo` | Detalle N:M de las variantes y `cantidad` que componen el combo. |

### Módulo 4: Carrito y Ventas (3 Tablas)
| Tabla | PK | FKs | Descripción |
| :--- | :--- | :--- | :--- |
| **`carrito`** | `id_carrito` | `id_usuario` $\rightarrow$ `usuario` | Carrito del usuario con estado (`enum_estado_carrito`). |
| **`detalle_carrito`** | `id_detalle_carrito` | `id_producto`, `id_carrito` | Ítems agregados con `precio_unitario` congelado y `cantidad`. |
| **`pedido`** | `id_pedido` | `id_carrito` $\rightarrow$ `carrito` | Orden de compra confirmada con montos, dirección y estado de despacho. |

### Módulo 5: Pagos y Facturación (3 Tablas)
| Tabla | PK | FKs | Descripción |
| :--- | :--- | :--- | :--- |
| **`metodo_pago`** | `id_metodo_pago` | Ninguna | Pasarelas / métodos habilitados (PSE, Tarjeta, Efectivo). |
| **`pagos`** | `id_pago` | `id_pedido`, `id_metodo_pago` | Registro de transacciones financieras con estado (`enum_estado_pago`). |
| **`factura`** | `id_factura` | `id_pedido` $\rightarrow$ `pedido` | Comprobante fiscal con fecha y estado (`enum_estado_factura`). |

### Módulo 6: Servicios y Reservaciones (1 Tabla)
| Tabla | PK | FKs | Descripción |
| :--- | :--- | :--- | :--- |
| **`reservaciones`** | `id_reservacion` | `id_producto`, `id_usuario` | Citas de asesoría técnica o aplicación con fecha, hora y estado. |

---

## 🛡️ 4. Tipos Enumerados (ENUMs)

Para asegurar la máxima robustez en PostgreSQL, el esquema utiliza 8 tipos enumerados nativos:

```sql
enum_estado_general     -- ('activo', 'inactivo')
enum_estado_usuario     -- ('activo', 'inactivo', 'bloqueado', 'pendiente')
enum_estado_producto    -- ('activo', 'inactivo', 'agotado', 'descontinuado')
enum_estado_reservacion -- ('pendiente', 'confirmada', 'cancelada', 'finalizada')
enum_estado_carrito     -- ('activo', 'abandonado', 'procesado', 'cancelado')
enum_estado_pedido      -- ('pendiente', 'pagado', 'en_preparacion', 'enviado', 'entregado', 'cancelado')
enum_estado_pago        -- ('pendiente', 'completado', 'fallido', 'reembolsado')
enum_estado_factura     -- ('emitida', 'pagada', 'anulada')
```

---

## ⚡ 5. Recomendaciones para el Stack de Desarrollo

### Backend (Node.js / Express / TypeScript / Kysely):
1. **Tipado Kysely Centralizado:**  
   Definir todos los tipos de tablas en `src/core/db/types.ts`. Utilizar `Generated<number>` para las columnas `SERIAL PRIMARY KEY`.
2. **Uso de Transacciones en Operaciones Compuestas:**  
   - Creación de Pedidos: Iniciar transacción `db.transaction().execute(...)` para congelar precios, crear el pedido y actualizar el estado del carrito a `'procesado'`.
   - Creación de Combos: Insertar la cabecera en `combo` y en batch las filas en `variante_combo`.
3. **Hashing Seguro:**  
   Las contraseñas de `usuario` deben ser hasheadas con **BCrypt** (costo mínimo 12) antes de persistirse.

### Frontend (React / Vue / Next.js):
1. **Navegación de Catálogo en Cascada:**  
   Aprovechar la jerarquía `categoria` $\rightarrow$ `subcategorias` $\rightarrow$ `sub_subcategorias` $\rightarrow$ `linea` para implementar menús desplegables y filtros dinámicos.
2. **Selector de Variantes y Tonos:**  
   Al seleccionar un producto, cargar sus variantes y si el usuario escoge un color, calcular el precio base de la variante más el ajuste del tono seleccionado.
