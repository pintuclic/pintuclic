-- ==============================================================================
-- PROYECTO: PINTUCLIC
-- DESCRIPCIÓN: Script DDL para PostgreSQL con tipos ENUM tipificados
-- MOTOR: PostgreSQL 12+ (Compatible con PostgreSQL 18)
-- CODIFICACIÓN: UTF-8
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

    -- Estado comercial y de inventario para productos
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
-- Define las reglas de descuento asignables a sub-roles o clientes empresariales.
CREATE TABLE IF NOT EXISTS descuento (
    id_descuento SERIAL PRIMARY KEY,
    tope NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    porcentaje_descuento NUMERIC(5, 2) NOT NULL CHECK (porcentaje_descuento >= 0 AND porcentaje_descuento <= 100),
    estado enum_estado_general NOT NULL DEFAULT 'activo'
);

COMMENT ON TABLE descuento IS 'Tabla para parametrizar descuentos por topes o tipos de cliente';
COMMENT ON COLUMN descuento.tope IS 'Monto tope o límite superior aplicable para el descuento';
COMMENT ON COLUMN descuento.porcentaje_descuento IS 'Porcentaje de descuento (0 a 100)';
COMMENT ON COLUMN descuento.estado IS 'Estado del descuento (activo, inactivo)';

-- Tabla: sub_rol_empresa
-- Sub-roles corporativos o segmentos de cliente empresa vinculados a un descuento.
CREATE TABLE IF NOT EXISTS sub_rol_empresa (
    id_sub_rol_empresa SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    id_descuento INT,
    estado enum_estado_general NOT NULL DEFAULT 'activo',
    CONSTRAINT fk_sub_rol_descuento FOREIGN KEY (id_descuento) 
        REFERENCES descuento (id_descuento) ON UPDATE CASCADE ON DELETE SET NULL
);

COMMENT ON TABLE sub_rol_empresa IS 'Sub-clasificación de roles para clientes corporativos/empresas';
COMMENT ON COLUMN sub_rol_empresa.id_descuento IS 'Descuento asociado a este sub-rol';

-- Tabla: rol
-- Roles generales del sistema (ej: Administrador, Vendedor, Cliente Corporativo, Cliente Persona).
CREATE TABLE IF NOT EXISTS rol (
    id_rol SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    id_sub_rol_empresa INT,
    estado enum_estado_general NOT NULL DEFAULT 'activo',
    CONSTRAINT fk_rol_sub_rol FOREIGN KEY (id_sub_rol_empresa) 
        REFERENCES sub_rol_empresa (id_sub_rol_empresa) ON UPDATE CASCADE ON DELETE SET NULL
);

COMMENT ON TABLE rol IS 'Roles del sistema para control de acceso y tipificación';

-- Tabla: permisos
-- Catálogo de permisos del sistema (ej: ver_pedidos, editar_productos, etc.).
CREATE TABLE IF NOT EXISTS permisos (
    id_permiso SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estado enum_estado_general NOT NULL DEFAULT 'activo'
);

COMMENT ON TABLE permisos IS 'Permisos y privilegios atómicos del sistema';

-- Tabla: asignacion_permiso
-- Tabla intermedia entre roles y permisos (N:M).
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

COMMENT ON TABLE asignacion_permiso IS 'Asignación de permisos a roles';

-- ==============================================================================
-- 2. MÓDULO DE USUARIOS
-- ==============================================================================

-- Tabla: usuario
-- Usuarios registrados en la plataforma.
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    telefono VARCHAR(30),
    correo VARCHAR(150) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    id_rol INT,
    estado enum_estado_usuario NOT NULL DEFAULT 'activo',
    CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) 
        REFERENCES rol (id_rol) ON UPDATE CASCADE ON DELETE SET NULL
);

COMMENT ON TABLE usuario IS 'Usuarios registrados en la plataforma';

-- Tabla: usuario_rol
-- Asignación de rol a usuario con restricción de rol único por usuario (máximo 1 rol por usuario).
CREATE TABLE IF NOT EXISTS usuario_rol (
    id_usuario_rol SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_rol INT NOT NULL,
    CONSTRAINT fk_usr_rol_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_usr_rol_rol FOREIGN KEY (id_rol) 
        REFERENCES rol (id_rol) ON UPDATE CASCADE ON DELETE CASCADE,
    -- Restricción: un usuario no puede tener más de un rol asignado en el sistema
    CONSTRAINT uq_usuario_rol_unico UNIQUE (id_usuario)
);

COMMENT ON TABLE usuario_rol IS 'Asignación de rol por usuario (un usuario no puede tener 2 roles en el sistema)';

-- ==============================================================================
-- 3. MÓDULO DE CATÁLOGO DE PRODUCTOS (NECESIDAD, LÍNEA, PRODUCTO, PRESENTACIÓN)
-- ==============================================================================

-- Tabla: nesesidad (necesidad)
-- Agrupación según la necesidad o aplicación del cliente (ej: Fachadas, Maderas, Pisos).
CREATE TABLE IF NOT EXISTS nesesidad (
    id SERIAL PRIMARY KEY,
    nesesidad VARCHAR(150) NOT NULL
);

COMMENT ON TABLE nesesidad IS 'Necesidades de pintura o aplicación';

-- Tabla: linea
-- Línea de producto asociada a una necesidad.
CREATE TABLE IF NOT EXISTS linea (
    id SERIAL PRIMARY KEY,
    id_nesesidad INT NOT NULL,
    nombre VARCHAR(150),
    CONSTRAINT fk_linea_nesesidad FOREIGN KEY (id_nesesidad) 
        REFERENCES nesesidad (id) ON UPDATE CASCADE ON DELETE RESTRICT
);

COMMENT ON TABLE linea IS 'Líneas de producto clasificadas por necesidad';

-- Tabla: producto
-- Ficha principal del producto de pintura.
CREATE TABLE IF NOT EXISTS producto (
    id SERIAL PRIMARY KEY,
    id_linea INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    precio NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (precio >= 0),
    estado enum_estado_producto NOT NULL DEFAULT 'activo',
    CONSTRAINT fk_producto_linea FOREIGN KEY (id_linea) 
        REFERENCES linea (id) ON UPDATE CASCADE ON DELETE RESTRICT
);

COMMENT ON TABLE producto IS 'Catálogo principal de productos';

-- Tabla: descripcion
-- Descripciones técnicas, usos y características.
-- (Corresponde a Row_2 y Row_3 del ER: título/característica y detalle/contenido).
CREATE TABLE IF NOT EXISTS descripcion (
    id SERIAL PRIMARY KEY,
    id_linea INT,
    titulo VARCHAR(150),       -- En el ER: Row_2 (ej: 'Uso recomendado', 'Rendimiento')
    contenido TEXT,             -- En el ER: Row_3 (ej: 'Para interiores de alta lavabilidad')
    CONSTRAINT fk_descripcion_linea FOREIGN KEY (id_linea) 
        REFERENCES linea (id) ON UPDATE CASCADE ON DELETE SET NULL
);

COMMENT ON TABLE descripcion IS 'Detalles y descripciones técnicas de productos o líneas';

-- Tabla: producto_descripcion
-- Relación N:M entre productos y descripciones.
CREATE TABLE IF NOT EXISTS producto_descripcion (
    id SERIAL PRIMARY KEY,
    id_producto INT NOT NULL,
    id_descripcion INT NOT NULL,
    CONSTRAINT fk_prod_desc_producto FOREIGN KEY (id_producto) 
        REFERENCES producto (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_prod_desc_descripcion FOREIGN KEY (id_descripcion) 
        REFERENCES descripcion (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_producto_descripcion UNIQUE (id_producto, id_descripcion)
);

COMMENT ON TABLE producto_descripcion IS 'Relación entre productos y sus fichas descriptivas';

-- Tabla: presentacion
-- Tipos de presentación (ej: Galón, Cuñete, Caneca, 1/4).
-- (Corresponde a Row_2 y Row_3 del ER: tipo de presentación y volumen/unidad de medida).
CREATE TABLE IF NOT EXISTS presentacion (
    id SERIAL PRIMARY KEY,
    id_producto INT,
    presentacion VARCHAR(100),  -- En el ER: Row_2 (ej: 'Galón', 'Cuarto', 'Caneca')
    unidad_medida VARCHAR(50),  -- En el ER: Row_3 (ej: '4 Litros', '1 Galón', '18.9 Litros')
    CONSTRAINT fk_presentacion_producto FOREIGN KEY (id_producto) 
        REFERENCES producto (id) ON UPDATE CASCADE ON DELETE SET NULL
);

COMMENT ON TABLE presentacion IS 'Presentaciones comerciales de envase y medida';

-- Tabla: producto_presentacion
-- Relación N:M entre productos y presentaciones disponibles.
CREATE TABLE IF NOT EXISTS producto_presentacion (
    id SERIAL PRIMARY KEY,
    id_producto INT NOT NULL,
    id_presentacion INT NOT NULL,
    CONSTRAINT fk_prod_pres_producto FOREIGN KEY (id_producto) 
        REFERENCES producto (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_prod_pres_presentacion FOREIGN KEY (id_presentacion) 
        REFERENCES presentacion (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_producto_presentacion UNIQUE (id_producto, id_presentacion)
);

COMMENT ON TABLE producto_presentacion IS 'Presentaciones habilitadas por cada producto';

-- ==============================================================================
-- 4. MÓDULO DE RESERVACIONES
-- ==============================================================================

-- Tabla: reservaciones
-- Reservas de productos o citas de asesoría por usuario.
CREATE TABLE IF NOT EXISTS reservaciones (
    id_reservacion SERIAL PRIMARY KEY,
    id_producto INT NOT NULL,
    id_usuario INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado enum_estado_reservacion NOT NULL DEFAULT 'pendiente',
    CONSTRAINT fk_reservacion_producto FOREIGN KEY (id_producto) 
        REFERENCES producto (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reservacion_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE reservaciones IS 'Reservas de producto o servicios por parte del cliente';

-- ==============================================================================
-- 5. MÓDULO DE CARRITO Y COMPRAS
-- ==============================================================================

-- Tabla: carrito
-- Carrito de compras asociado a un usuario.
CREATE TABLE IF NOT EXISTS carrito (
    id_carrito SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    estado enum_estado_carrito NOT NULL DEFAULT 'activo',
    CONSTRAINT fk_carrito_usuario FOREIGN KEY (id_usuario) 
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE carrito IS 'Carrito de compras de cada usuario';

-- Tabla: detalle_carrito
-- Ítems añadidos dentro de un carrito de compras.
CREATE TABLE IF NOT EXISTS detalle_carrito (
    id_detalle_carrito SERIAL PRIMARY KEY,
    id_producto INT NOT NULL,
    precio_unitario NUMERIC(12, 2) NOT NULL CHECK (precio_unitario >= 0),
    cantidad INT NOT NULL CHECK (cantidad > 0),
    id_carrito INT NOT NULL,
    CONSTRAINT fk_det_carrito_producto FOREIGN KEY (id_producto) 
        REFERENCES producto (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_det_carrito_carrito FOREIGN KEY (id_carrito) 
        REFERENCES carrito (id_carrito) ON UPDATE CASCADE ON DELETE CASCADE
);

COMMENT ON TABLE detalle_carrito IS 'Ítems y cantidades dentro de un carrito de compras';

-- ==============================================================================
-- 6. MÓDULO DE PEDIDOS, PAGOS Y FACTURACIÓN
-- ==============================================================================

-- Tabla: pedido
-- Pedidos generados a partir de un carrito de compra.
CREATE TABLE IF NOT EXISTS pedido (
    id_pedido SERIAL PRIMARY KEY,
    id_carrito INT NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    sub_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (sub_total >= 0),
    descuento NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (descuento >= 0),
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    observaciones TEXT,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estado enum_estado_pedido NOT NULL DEFAULT 'pendiente',
    CONSTRAINT fk_pedido_carrito FOREIGN KEY (id_carrito) 
        REFERENCES carrito (id_carrito) ON UPDATE CASCADE ON DELETE RESTRICT
);

COMMENT ON TABLE pedido IS 'Encabezado del pedido de compra';

-- Tabla: metodo_pago
-- Métodos de pago disponibles (ej: Tarjeta de Crédito, PSE, Transferencia, Contra Entrega).
CREATE TABLE IF NOT EXISTS metodo_pago (
    id_metodo_pago SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado enum_estado_general NOT NULL DEFAULT 'activo'
);

COMMENT ON TABLE metodo_pago IS 'Medios o métodos de pago aceptados';

-- Tabla: pagos
-- Registro de transacciones de pago aplicadas a un pedido.
CREATE TABLE IF NOT EXISTS pagos (
    id_pago SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_metodo_pago INT NOT NULL,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto >= 0),
    estado enum_estado_pago NOT NULL DEFAULT 'completado',
    CONSTRAINT fk_pagos_pedido FOREIGN KEY (id_pedido) 
        REFERENCES pedido (id_pedido) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_pagos_metodo_pago FOREIGN KEY (id_metodo_pago) 
        REFERENCES metodo_pago (id_metodo_pago) ON UPDATE CASCADE ON DELETE RESTRICT
);

COMMENT ON TABLE pagos IS 'Transacciones y pagos registrados para un pedido';

-- Tabla: factura
-- Documento de facturación electrónica o comprobante fiscal generado.
CREATE TABLE IF NOT EXISTS factura (
    id_factura SERIAL PRIMARY KEY,
    id_pedido INT NOT NULL UNIQUE,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    estado enum_estado_factura NOT NULL DEFAULT 'emitida',
    CONSTRAINT fk_factura_pedido FOREIGN KEY (id_pedido) 
        REFERENCES pedido (id_pedido) ON UPDATE CASCADE ON DELETE RESTRICT
);

COMMENT ON TABLE factura IS 'Factura comercial asociada al pedido';

-- ==============================================================================
-- 7. ÍNDICES PARA MEJORA DE RENDIMIENTO (OPTIMIZACIÓN DE CLAVES FORÁNEAS)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_sub_rol_descuento ON sub_rol_empresa(id_descuento);
CREATE INDEX IF NOT EXISTS idx_rol_sub_rol ON rol(id_sub_rol_empresa);
CREATE INDEX IF NOT EXISTS idx_asig_permiso_rol ON asignacion_permiso(id_rol);
CREATE INDEX IF NOT EXISTS idx_asig_permiso_permiso ON asignacion_permiso(id_permiso);
CREATE INDEX IF NOT EXISTS idx_usuario_rol ON usuario(id_rol);
CREATE INDEX IF NOT EXISTS idx_usr_rol_usuario ON usuario_rol(id_usuario);
CREATE INDEX IF NOT EXISTS idx_usr_rol_rol ON usuario_rol(id_rol);
CREATE INDEX IF NOT EXISTS idx_linea_nesesidad ON linea(id_nesesidad);
CREATE INDEX IF NOT EXISTS idx_producto_linea ON producto(id_linea);
CREATE INDEX IF NOT EXISTS idx_prod_desc_producto ON producto_descripcion(id_producto);
CREATE INDEX IF NOT EXISTS idx_prod_desc_descripcion ON producto_descripcion(id_descripcion);
CREATE INDEX IF NOT EXISTS idx_prod_pres_producto ON producto_presentacion(id_producto);
CREATE INDEX IF NOT EXISTS idx_prod_pres_presentacion ON producto_presentacion(id_presentacion);
CREATE INDEX IF NOT EXISTS idx_reservacion_producto ON reservaciones(id_producto);
CREATE INDEX IF NOT EXISTS idx_reservacion_usuario ON reservaciones(id_usuario);
CREATE INDEX IF NOT EXISTS idx_carrito_usuario ON carrito(id_usuario);
CREATE INDEX IF NOT EXISTS idx_det_carrito_carrito ON detalle_carrito(id_carrito);
CREATE INDEX IF NOT EXISTS idx_det_carrito_producto ON detalle_carrito(id_producto);
CREATE INDEX IF NOT EXISTS idx_pedido_carrito ON pedido(id_carrito);
CREATE INDEX IF NOT EXISTS idx_pagos_pedido ON pagos(id_pedido);
CREATE INDEX IF NOT EXISTS idx_pagos_metodo ON pagos(id_metodo_pago);
CREATE INDEX IF NOT EXISTS idx_factura_pedido ON factura(id_pedido);
