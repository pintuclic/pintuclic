# 🚀 Walkthrough de Evolución y Migración de Base de Datos - PINTUCLIC

Este documento registra la evolución histórica del modelo de base de datos de **Pintuclic**, detallando para cada versión las tablas creadas, tablas deprecadas, cambios de tipos de datos, nuevas restricciones (`CONSTRAINTS`), tipos `ENUM`, índices e impactos directos en Backend (Kysely/Express) y Frontend.

---

## 📑 Índice de Versiones
- [Versión 2.0 (Página FINAL del ER) - Reestructuración de Catálogo, Variantes y Combos](#-versión-20-2026-09-03)
- [Versión 1.0 (Esquema Inicial Pre-Final) - Base de 21 Tablas](#-versión-10-2026-09-02)

---

## 📦 Versión 2.0 (2026-09-03)

### 🎯 Resumen Ejecutivo
Evolución mayor (**MAJOR**) del esquema de base de datos impulsada por la especificación de la página **`FINAL`** del diagrama Entidad-Relación (`ER Pintuco.drawio.xml`).
- **Total Tablas:** Pasa de 21 a **25 tablas**.
- **Foco de la versión:** Desacoplamiento total del catálogo de productos hacia una jerarquía formal de 4 niveles, incorporación de variantes comerciales por color y tono, soporte para combos/kits promocionales, y blindaje con 8 tipos enumerados (`ENUM`).

---

### 🛑 1. Tablas Deprecadas / Eliminadas (6 Tablas)
En la versión 1.0 el catálogo utilizaba una estructura simplificada de fichas técnicas basada en "necesidad", "presentación" y "descripción". Estas tablas fueron completamente retiradas y sustituidas por el modelo relacional de variantes:

| Tabla Eliminada (v1.0) | Motivo de Deprecación | Reemplazo en v2.0 |
| :--- | :--- | :--- |
| `nesesidad` | Modelo rígido y con error tipográfico en origen. | Se absorbe mediante la jerarquía de categorías y características. |
| `presentacion` | Los envases/tamaños no estaban ligados a combinaciones vendibles. | Reemplazado por **`variante`** y **`caracteristica`**. |
| `descripcion` | Textos planos independientes del ciclo de vida del producto. | Reemplazado por **`caracteristica`**. |
| `producto_presentacion` | Tabla intermedia obsoleta al eliminarse `presentacion`. | Reemplazado por **`variante`**. |
| `producto_descripcion` | Tabla intermedia obsoleta al eliminarse `descripcion`. | Reemplazado por **`caracteristica`**. |
| `roll` / `sub_roll_empresa` | Nombres con error ortográfico en inglés/español (*roll*). | Renombradas a **`rol`** y **`sub_rol_empresa`**. |

---

### ✨ 2. Tablas Nuevas Creadas (10 Tablas)

Se incorporaron 10 tablas que conforman el nuevo motor de catálogo, precios dinámicos y empaquetado:

| Nueva Tabla (v2.0) | Clave Primaria | Claves Foráneas (FK) | Propósito Funcional |
| :--- | :--- | :--- | :--- |
| **`categoria`** | `id_categoria SERIAL` | Ninguna | Nivel 1 de la jerarquía de catálogo (e.g. Vinilos, Esmaltes, Maderas). |
| **`subcategorias`** | `id_subcategoria SERIAL` | `id_categoria` $\rightarrow$ `categoria` | Nivel 2 de subdivisión temática. |
| **`sub_subcategorias`** | `id_sub_subcategoria SERIAL` | `id_subcategoria` $\rightarrow$ `subcategorias` | Nivel 3 de refinamiento comercial. |
| **`linea`** | `id_linea SERIAL` | `id_sub_subcategoria` $\rightarrow$ `sub_subcategorias` | Nivel 4 de marca o línea de producto (e.g. Koraza, Viniltex). |
| **`color`** | `id_color SERIAL` | Ninguna | Maestro de familias de color (`nombre` UNIQUE). |
| **`tonos`** | `id_tono SERIAL` | `id_color` $\rightarrow$ `color` | Desglose de matices o códigos de color con cargo de `precio` adicional. |
| **`variante`** | `id_variante SERIAL` | `id_producto`, `id_color` | Unidad vendible (SKU) con precio específico y color opcional. |
| **`caracteristica`** | `id_caracteristica SERIAL` | `id_variante` $\rightarrow$ `variante` | Propiedades técnicas y fichas de aplicación de cada variante. |
| **`combo`** | `id_combo SERIAL` | `id_producto` $\rightarrow$ `producto` | Cabecera de promociones y paquetes especiales. |
| **`variante_combo`** | `id_variante_combo SERIAL` | `id_variante`, `id_combo` | Detalle N:M con `cantidad` de cada variante en el combo. |

---

### 🔄 3. Tablas Modificadas y Cambios de Relaciones

1. **`producto`**:
   - **Antes (v1.0):** Tenía relaciones intermedias con `producto_presentacion` y `producto_descripcion`.
   - **Ahora (v2.0):** Solo se vincula con su línea (`id_linea INT NOT NULL REFERENCES linea`) y expone hijos en cascada hacia `variante`, `combo`, `detalle_carrito` y `reservaciones`.
2. **`usuario_rol`**:
   - **Nueva Restricción:** Se aplicó `UNIQUE (id_usuario)`, impidiendo a nivel de base de datos que un usuario posea múltiples roles de forma simultánea.
3. **`usuario`**:
   - Se mantiene `id_rol` directo como referencia por defecto indexada, complementando a la tabla asociativa `usuario_rol`.
4. **`rol` y `sub_rol_empresa`**:
   - Cambio de nomenclatura estandarizada: se reemplazó la palabra `roll` por `rol` en nombres de tablas, columnas (`id_rol`) e índices.

---

### 🔒 4. Restricciones (`CONSTRAINTS`) y Tipos `ENUM` Agregados

#### Tipos ENUM Nativos Implementados:
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

#### Reglas de Validación (`CHECK` y `UNIQUE`):
- `chk_descuento_porcentaje`: `porcentaje_descuento BETWEEN 0 AND 100`.
- `chk_descuento_tope`: `tope >= 0`.
- `chk_tonos_precio`: `precio >= 0`.
- `chk_variante_precio`: `precio >= 0`.
- `chk_varcombo_cantidad`: `cantidad > 0`.
- `chk_detcarrito_cantidad`: `cantidad > 0`.
- `chk_pagos_monto`: `monto > 0`.
- `uq_variante_combo`: `UNIQUE(id_variante, id_combo)`.
- `uq_rol_permiso`: `UNIQUE(id_rol, id_permiso)`.
- `uq_usr_rol_usuario`: `UNIQUE(id_usuario)`.

---

### ⚡ 5. Nuevos Índices de Rendimiento
Para acelerar consultas y optimizar los `JOIN` en la nueva jerarquía:
- `idx_subcat_categoria ON subcategorias(id_categoria)`
- `idx_subsubcat_subcat ON sub_subcategorias(id_subcategoria)`
- `idx_linea_subsubcat ON linea(id_sub_subcategoria)`
- `idx_producto_linea ON producto(id_linea)`
- `idx_combo_producto ON combo(id_producto)`
- `idx_tonos_color ON tonos(id_color)`
- `idx_variante_producto ON variante(id_producto)`
- `idx_variante_color ON variante(id_color)`
- `idx_caract_variante ON caracteristica(id_variante)`
- `idx_varcombo_variante ON variante_combo(id_variante)`
- `idx_varcombo_combo ON variante_combo(id_combo)`

---

### 💻 6. Impacto y Acciones Requeridas en Backend y Frontend

#### Backend (TypeScript / Kysely / Express):
1. **Actualizar `src/core/db/types.ts`**:
   - Reemplazar las interfaces de `Presentacion`, `Descripcion`, etc., por las nuevas entidades: `CategoriaTable`, `SubcategoriaTable`, `SubSubcategoriaTable`, `LineaTable`, `ColorTable`, `TonoTable`, `VarianteTable`, `CaracteristicaTable`, `ComboTable`, `VarianteComboTable`.
   - Definir los tipos literales correspondientes a los 8 `ENUMs` de PostgreSQL.
2. **Controlador de Productos (Módulo M02)**:
   - Modificar las consultas `selectFrom('producto')` para hacer join con `linea`, `sub_subcategorias`, `subcategorias` y `categoria`.
   - Incluir carga de variantes (`variante`) con su respectivo `color` y `tonos`.

#### Frontend (UI / Vistas / Componentes):
1. **Navegación Multinivel**:
   - Actualizar el menú de catálogo y el explorador de categorías para soportar la jerarquía de 4 niveles.
2. **Página de Detalle de Producto (PDP)**:
   - Implementar el selector de colores y selector de variantes, calculando el precio en función de la variante seleccionada y el tono escogido.

---

## 📦 Versión 1.0 (2026-09-02)

### 🎯 Resumen Ejecutivo
- Versión fundacional del esquema de base de datos extraída del diagrama preliminar `Pre-Final`.
- **Total Tablas:** 21 tablas iniciales.
- Modelo básico de usuarios, roles, permisos, carrito, pedidos, facturación, pagos, reservaciones y catálogo plano estructurado en `linea`, `producto`, `presentacion`, `descripcion` y `nesesidad`.
