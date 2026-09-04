-- ==============================================================================
-- PROYECTO: PINTUCLIC
-- DESCRIPCIÓN: Script DDL para PostgreSQL con tipos ENUM tipificados
-- VERSIÓN: 2.0 (Actualización basada en página FINAL del ER)
-- MOTOR: PostgreSQL 12+ (Compatible con PostgreSQL 18)
-- CODIFICACIÓN: UTF-8
-- TOTAL TABLAS: 25
-- ==============================================================================

-- Si deseas recrear el esquema desde cero, puedes descomentar la siguiente línea:
-- DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;

-- ==============================================================================
-- 0. DEFINICIÓN DE TIPOS ENUMERADOS (ENUMs)
-- ==============================================================================

DO $$ 
BEGIN
    -- Estado general para entidades de configuración (descuentos, roles, permisos, métodos de pago)
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_estado_general') THEN
        CREATE TYPE enum_estado_general AS ENUM ('activo', 'inactivo');
    END IF;

    -- Estado para cuentas de usuario
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_estado_usuario') THEN
        CREATE TYPE enum_estado_usuario AS ENUM ('activo', 'inactivo', 'bloqueado', 'pendiente');
    END IF;

    -- Estado comercial y de inventario para productos / variantes
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_estado_producto') THEN
        CREATE TYPE enum_estado_producto AS ENUM ('activo', 'inactivo', 'agotado', 'descontinuado');
    END IF;

    -- Estado del ciclo de vida de una reservación
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_estado_reservacion') THEN
        CREATE TYPE enum_estado_reservacion AS ENUM ('pendiente', 'confirmada', 'cancelada', 'finalizada');
    END IF;

    -- Estado del carrito de compras
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_estado_carrito') THEN
        CREATE TYPE enum_estado_carrito AS ENUM ('activo', 'abandonado', 'procesado', 'cancelado');
    END IF;

    -- Estado del pedido en el flujo de despacho
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_estado_pedido') THEN
        CREATE TYPE enum_estado_pedido AS ENUM ('pendiente', 'pagado', 'en_preparacion', 'enviado', 'entregado', 'cancelado');
    END IF;

    -- Estado de la transacción de pago
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_estado_pago') THEN
        CREATE TYPE enum_estado_pago AS ENUM ('pendiente', 'completado', 'fallido', 'reembolsado');
    END IF;

    -- Estado fiscal y legal de la factura
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_estado_factura') THEN
        CREATE TYPE enum_estado_factura AS ENUM ('emitida', 'pagada', 'anulada');
    END IF;
END $$;

-- ==============================================================================
-- 1. MÓDULO DE DESCUENTOS, ROLES Y PERMISOS
-- ==============================================================================

-- Tabla: descuento
-- Define políticas de descuento comerciales asignadas a sub-roles o clientes empresariales.
CREATE TABLE IF NOT EXISTS descuento (
    id_descuento SERIAL PRIMARY KEY,
    tope NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    porcentaje_descuento NUMERIC(5, 2) NOT NULL,
    estado enum_estado_general NOT NULL DEFAULT 'activo',
    CONSTRAINT chk_descuento_tope CHECK (tope >= 0),
    CONSTRAINT chk_descuento_porcentaje CHECK (porcentaje_descuento >= 0 AND porcentaje_descuento <= 100)
);

COMMENT ON TABLE descuento IS 'Políticas y topes de descuento aplicables';
COMMENT ON COLUMN descuento.tope IS 'Monto tope máximo en valor monetario aplicable al descuento';
COMMENT ON COLUMN descuento.porcentaje_descuento IS 'Porcentaje de descuento (0 a 100)';
COMMENT ON COLUMN descuento.estado IS 'Estado de la regla de descuento (activo/inactivo)';

-- Tabla: sub_rol_empresa
-- Sub-clasificación de roles para clientes y perfiles corporativos / empresariales.
CREATE TABLE IF NOT EXISTS sub_rol_empresa (
    id_sub_rol_empresa SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_descuento INT,
    estado enum_estado_general NOT NULL DEFAULT 'activo',
    CONSTRAINT fk_subrol_descuento FOREIGN KEY (id_descuento) 
        REFERENCES descuento (id_descuento) ON UPDATE CASCADE ON DELETE SET NULL
);

COMMENT ON TABLE sub_rol_empresa IS 'Sub-roles empresariales asociados a políticas de descuento';
COMMENT ON COLUMN sub_rol_empresa.id_descuento IS 'Referencia opcional a una política de descuento';

-- Tabla: rol
-- Catálogo de roles del sistema (administrador, cliente particular, empresa, operario, etc.).
CREATE TABLE IF NOT EXISTS rol (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    id_sub_rol_empresa INT,
    estado enum_estado_general NOT NULL DEFAULT 'activo',
    CONSTRAINT fk_rol_subrol FOREIGN KEY (id_sub_rol_empresa) 
        REFERENCES sub_rol_empresa (id_sub_rol_empresa) ON UPDATE CASCADE ON DELETE SET NULL
);

COMMENT ON TABLE rol IS 'Roles principales del sistema';
COMMENT ON COLUMN rol.id_sub_rol_empresa IS 'Referencia a sub-rol empresarial en caso de clientes corporativos';

-- Tabla: permisos
-- Catálogo granular de capacidades y privilegios del sistema.
CREATE TABLE IF NOT EXISTS permisos (
    id_permiso SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado enum_estado_general NOT NULL DEFAULT 'activo'
);

COMMENT ON TABLE permisos IS 'Permisos y privilegios atómicos del sistema';

-- Tabla: asignacion_permiso
-- Matriz de asociación N:M entre roles y permisos específicos.
CREATE TABLE IF NOT EXISTS asignacion_permiso (
    id_asignacion_permiso SERIAL PRIMARY KEY,
    id_rol INT NOT NULL,
    id_permiso INT NOT NULL,
    CONSTRAINT fk_asig_permiso_rol FOREIGN KEY (id_rol) 
        REFERENCES rol (id_rol) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_asig_permiso_permiso FOREIGN KEY (id_permiso) 
        REFERENCES permisos (id_permiso) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_rol_permiso UNIQUE (id_rol, id_permiso)
);

COMMENT ON TABLE asignacion_permiso IS 'Relación N:M que asigna permisos específicos a cada rol';

-- ==============================================================================
-- 2. MÓDULO DE USUARIOS Y CONTROL DE ACCESO
-- ==============================================================================

-- Tabla: usuario
-- Cuentas de usuario registradas en la plataforma (clientes y personal interno).
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    id_rol INT,
    estado enum_estado_usuario NOT NULL DEFAULT 'activo',
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) 
        REFERENCES rol (id_rol) ON UPDATE CASCADE ON DELETE SET NULL
);

COMMENT ON TABLE usuario IS 'Entidad de usuarios registrados en el sistema';
COMMENT ON COLUMN usuario.contrasena IS 'Hash criptográfico seguro de la contraseña (BCrypt)';
COMMENT ON COLUMN usuario.id_rol IS 'Rol directo por defecto asignado al usuario';

-- Tabla: usuario_rol
-- Asignación de rol a usuario con restricción de rol único por usuario (máximo 1 rol por usuario).
CREATE TABLE IF NOT EXISTS usuario_rol (
    id_usuario_rol SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE,
    id_rol INT NOT NULL,
    CONSTRAINT fk_usr_rol_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_usr_rol_rol FOREIGN KEY (id_rol) 
        REFERENCES rol (id_rol) ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE usuario_rol IS 'Asignación de roles a usuarios con restricción UNIQUE(id_usuario)';

-- ==============================================================================
-- 3. MÓDULO DE CATÁLOGO Y JERARQUÍA DE PRODUCTOS
-- ==============================================================================

-- Tabla: categoria
-- Nivel superior de categorización del catálogo (e.g., Vinilos, Esmaltes, Anticorrosivos, Maderas).
CREATE TABLE IF NOT EXISTS categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

COMMENT ON TABLE categoria IS 'Nivel 1 de la jerarquía de catálogo: Categoría principal';

-- Tabla: subcategorias
-- Nivel secundario de subdivisión de categorías.
CREATE TABLE IF NOT EXISTS subcategorias (
    id_subcategoria SERIAL PRIMARY KEY,
    id_categoria INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT fk_subcat_categoria FOREIGN KEY (id_categoria) 
        REFERENCES categoria (id_categoria) ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE subcategorias IS 'Nivel 2 de la jerarquía de catálogo: Subcategorías';

-- Tabla: sub_subcategorias
-- Nivel terciario de subdivisión temática o funcional.
CREATE TABLE IF NOT EXISTS sub_subcategorias (
    id_sub_subcategoria SERIAL PRIMARY KEY,
    id_subcategoria INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT fk_subsubcat_subcat FOREIGN KEY (id_subcategoria) 
        REFERENCES subcategorias (id_subcategoria) ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE sub_subcategorias IS 'Nivel 3 de la jerarquía de catálogo: Sub-subcategorías';

-- Tabla: linea
-- Línea específica de productos (e.g., Koraza, Viniltex, Doméstica, Profesional).
CREATE TABLE IF NOT EXISTS linea (
    id_linea SERIAL PRIMARY KEY,
    id_sub_subcategoria INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT fk_linea_subsubcat FOREIGN KEY (id_sub_subcategoria) 
        REFERENCES sub_subcategorias (id_sub_subcategoria) ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE linea IS 'Nivel 4 de la jerarquía de catálogo: Línea de producto';

-- Tabla: producto
-- Entidad base de producto perteneciente a una línea.
CREATE TABLE IF NOT EXISTS producto (
    id_producto SERIAL PRIMARY KEY,
    id_linea INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    CONSTRAINT fk_producto_linea FOREIGN KEY (id_linea) 
        REFERENCES linea (id_linea) ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE producto IS 'Entidad de producto clasificada dentro de una línea';

-- Tabla: color
-- Catálogo de colores base o familias de color para productos y pinturas.
CREATE TABLE IF NOT EXISTS color (
    id_color SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

COMMENT ON TABLE color IS 'Catálogo maestro de colores';

-- Tabla: tonos
-- Tonos y acabados desglosados a partir de un color con variación de precio.
CREATE TABLE IF NOT EXISTS tonos (
    id_tono SERIAL PRIMARY KEY,
    id_color INT NOT NULL,
    precio NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_tonos_color FOREIGN KEY (id_color) 
        REFERENCES color (id_color) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_tonos_precio CHECK (precio >= 0)
);

COMMENT ON TABLE tonos IS 'Tonos y matices derivados de un color con precio asociado';

-- Tabla: variante
-- Variantes comerciales del producto (combinación de producto, color y precio de venta).
CREATE TABLE IF NOT EXISTS variante (
    id_variante SERIAL PRIMARY KEY,
    id_producto INT NOT NULL,
    precio NUMERIC(12, 2) NOT NULL,
    id_color INT,
    CONSTRAINT fk_variante_producto FOREIGN KEY (id_producto) 
        REFERENCES producto (id_producto) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_variante_color FOREIGN KEY (id_color) 
        REFERENCES color (id_color) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_variante_precio CHECK (precio >= 0)
);

COMMENT ON TABLE variante IS 'Variantes comerciales vendibles de un producto';

-- Tabla: caracteristica
-- Atributos técnicos y especificaciones descriptivas de cada variante.
CREATE TABLE IF NOT EXISTS caracteristica (
    id_caracteristica SERIAL PRIMARY KEY,
    id_variante INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    CONSTRAINT fk_caract_variante FOREIGN KEY (id_variante) 
        REFERENCES variante (id_variante) ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE caracteristica IS 'Características y propiedades técnicas de una variante';

-- Tabla: combo
-- Definición de paquetes o combos promocionales asociados a un producto.
CREATE TABLE IF NOT EXISTS combo (
    id_combo SERIAL PRIMARY KEY,
    id_producto INT NOT NULL,
    CONSTRAINT fk_combo_producto FOREIGN KEY (id_producto) 
        REFERENCES producto (id_producto) ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE combo IS 'Combos o paquetes comerciales vinculados a un producto';

-- Tabla: variante_combo
-- Tabla intermedia que desglosa qué variantes y en qué cantidad componen un combo.
CREATE TABLE IF NOT EXISTS variante_combo (
    id_variante_combo SERIAL PRIMARY KEY,
    id_variante INT NOT NULL,
    id_combo INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_varcombo_variante FOREIGN KEY (id_variante) 
        REFERENCES variante (id_variante) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_varcombo_combo FOREIGN KEY (id_combo) 
        REFERENCES combo (id_combo) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_varcombo_cantidad CHECK (cantidad > 0),
    CONSTRAINT uq_variante_combo UNIQUE (id_variante, id_combo)
);

COMMENT ON TABLE variante_combo IS 'Detalle de variantes y cantidades que integran cada combo';

-- ==============================================================================
-- 4. MÓDULO DE CARRITO Y VENTAS
-- ==============================================================================

-- Tabla: carrito
-- Carrito de compras temporal o persistente por usuario.
CREATE TABLE IF NOT EXISTS carrito (
    id_carrito SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    estado enum_estado_carrito NOT NULL DEFAULT 'activo',
    CONSTRAINT fk_carrito_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_carrito_total CHECK (total >= 0)
);

COMMENT ON TABLE carrito IS 'Cabecera del carrito de compras de un usuario';

-- Tabla: detalle_carrito
-- Ítems agregados al carrito de compras con precio congelado y cantidad.
CREATE TABLE IF NOT EXISTS detalle_carrito (
    id_detalle_carrito SERIAL PRIMARY KEY,
    id_producto INT NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    id_carrito INT NOT NULL,
    CONSTRAINT fk_detcarrito_producto FOREIGN KEY (id_producto) 
        REFERENCES producto (id_producto) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_detcarrito_carrito FOREIGN KEY (id_carrito) 
        REFERENCES carrito (id_carrito) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_detcarrito_precio CHECK (precio_unitario >= 0),
    CONSTRAINT chk_detcarrito_cantidad CHECK (cantidad > 0)
);

COMMENT ON TABLE detalle_carrito IS 'Detalle de productos agregados al carrito';

-- Tabla: pedido
-- Registro de orden de compra formal generada a partir de un carrito.
CREATE TABLE IF NOT EXISTS pedido (
    id_pedido SERIAL PRIMARY KEY,
    id_carrito INT NOT NULL,
    direccion TEXT NOT NULL,
    sub_total NUMERIC(12, 2) NOT NULL,
    descuento NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL,
    observaciones TEXT,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estado enum_estado_pedido NOT NULL DEFAULT 'pendiente',
    CONSTRAINT fk_pedido_carrito FOREIGN KEY (id_carrito) 
        REFERENCES carrito (id_carrito) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_pedido_subtotal CHECK (sub_total >= 0),
    CONSTRAINT chk_pedido_descuento CHECK (descuento >= 0),
    CONSTRAINT chk_pedido_total CHECK (total >= 0)
);

COMMENT ON TABLE pedido IS 'Cabecera de pedidos generados';

-- ==============================================================================
-- 5. MÓDULO DE PAGOS Y FACTURACIÓN
-- ==============================================================================

-- Tabla: metodo_pago
-- Catálogo de pasarelas y métodos de pago (PSE, Tarjeta, Transferencia, Contra Entrega).
CREATE TABLE IF NOT EXISTS metodo_pago (
    id_metodo_pago SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado enum_estado_general NOT NULL DEFAULT 'activo'
);

COMMENT ON TABLE metodo_pago IS 'Métodos de pago habilitados en la plataforma';

-- Tabla: pagos
-- Registro de transacciones financieras asociadas a un pedido.
CREATE TABLE IF NOT EXISTS pagos (
    id_pago SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_metodo_pago INT NOT NULL,
    estado enum_estado_pago NOT NULL DEFAULT 'pendiente',
    monto NUMERIC(12, 2) NOT NULL,
    CONSTRAINT fk_pagos_pedido FOREIGN KEY (id_pedido) 
        REFERENCES pedido (id_pedido) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_pagos_metodo FOREIGN KEY (id_metodo_pago) 
        REFERENCES metodo_pago (id_metodo_pago) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_pagos_monto CHECK (monto > 0)
);

COMMENT ON TABLE pagos IS 'Transacciones y pagos registrados para un pedido';

-- Tabla: factura
-- Documento fiscal emitido legalmente a partir de un pedido completado.
CREATE TABLE IF NOT EXISTS factura (
    id_factura SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estado enum_estado_factura NOT NULL DEFAULT 'emitida',
    CONSTRAINT fk_factura_pedido FOREIGN KEY (id_pedido) 
        REFERENCES pedido (id_pedido) ON UPDATE CASCADE ON DELETE RESTRICT
);

COMMENT ON TABLE factura IS 'Factura electrónica o física vinculada a un pedido';

-- ==============================================================================
-- 6. MÓDULO DE SERVICIOS Y RESERVACIONES
-- ==============================================================================

-- Tabla: reservaciones
-- Citas y agendamientos técnicos o comerciales vinculados a productos y usuarios.
CREATE TABLE IF NOT EXISTS reservaciones (
    id_reservacion SERIAL PRIMARY KEY,
    id_producto INT NOT NULL,
    id_usuario INT NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora TIME NOT NULL,
    estado enum_estado_reservacion NOT NULL DEFAULT 'pendiente',
    CONSTRAINT fk_reservacion_producto FOREIGN KEY (id_producto) 
        REFERENCES producto (id_producto) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_reservacion_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE reservaciones IS 'Agendamiento de citas y reservaciones de servicios';

-- ==============================================================================
-- 7. ÍNDICES DE RENDIMIENTO (OPTIMIZACIÓN DE BÚSQUEDAS Y JOINS)
-- ==============================================================================

-- Índices en Roles, Permisos y Usuarios
CREATE INDEX IF NOT EXISTS idx_subrol_descuento ON sub_rol_empresa(id_descuento);
CREATE INDEX IF NOT EXISTS idx_rol_subrol ON rol(id_sub_rol_empresa);
CREATE INDEX IF NOT EXISTS idx_asig_permiso_rol ON asignacion_permiso(id_rol);
CREATE INDEX IF NOT EXISTS idx_asig_permiso_permiso ON asignacion_permiso(id_permiso);
CREATE INDEX IF NOT EXISTS idx_usuario_correo ON usuario(correo);
CREATE INDEX IF NOT EXISTS idx_usuario_rol ON usuario(id_rol);
CREATE INDEX IF NOT EXISTS idx_usr_rol_usuario ON usuario_rol(id_usuario);
CREATE INDEX IF NOT EXISTS idx_usr_rol_rol ON usuario_rol(id_rol);

-- Índices en Jerarquía de Catálogo
CREATE INDEX IF NOT EXISTS idx_subcat_categoria ON subcategorias(id_categoria);
CREATE INDEX IF NOT EXISTS idx_subsubcat_subcat ON sub_subcategorias(id_subcategoria);
CREATE INDEX IF NOT EXISTS idx_linea_subsubcat ON linea(id_sub_subcategoria);
CREATE INDEX IF NOT EXISTS idx_producto_linea ON producto(id_linea);
CREATE INDEX IF NOT EXISTS idx_combo_producto ON combo(id_producto);
CREATE INDEX IF NOT EXISTS idx_tonos_color ON tonos(id_color);
CREATE INDEX IF NOT EXISTS idx_variante_producto ON variante(id_producto);
CREATE INDEX IF NOT EXISTS idx_variante_color ON variante(id_color);
CREATE INDEX IF NOT EXISTS idx_caract_variante ON caracteristica(id_variante);
CREATE INDEX IF NOT EXISTS idx_varcombo_variante ON variante_combo(id_variante);
CREATE INDEX IF NOT EXISTS idx_varcombo_combo ON variante_combo(id_combo);

-- Índices en Ventas, Pagos y Reservaciones
CREATE INDEX IF NOT EXISTS idx_carrito_usuario ON carrito(id_usuario);
CREATE INDEX IF NOT EXISTS idx_detcarrito_carrito ON detalle_carrito(id_carrito);
CREATE INDEX IF NOT EXISTS idx_detcarrito_producto ON detalle_carrito(id_producto);
CREATE INDEX IF NOT EXISTS idx_pedido_carrito ON pedido(id_carrito);
CREATE INDEX IF NOT EXISTS idx_pedido_fecha ON pedido(fecha);
CREATE INDEX IF NOT EXISTS idx_pagos_pedido ON pagos(id_pedido);
CREATE INDEX IF NOT EXISTS idx_pagos_metodo ON pagos(id_metodo_pago);
CREATE INDEX IF NOT EXISTS idx_factura_pedido ON factura(id_pedido);
CREATE INDEX IF NOT EXISTS idx_reservacion_usuario ON reservaciones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_reservacion_producto ON reservaciones(id_producto);
CREATE INDEX IF NOT EXISTS idx_reservacion_fecha ON reservaciones(fecha);

-- ==============================================================================
-- FIN DEL SCRIPT DDL (25 TABLAS)
-- ==============================================================================
