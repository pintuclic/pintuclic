-- ==============================================================================
-- PROYECTO: PINTUCLIC
-- DESCRIPCIÓN: Script de Seed y Mocks de Prueba Inicial para Desarrollo y Testing
-- VERSIÓN: 2.3 (Cubre las 31 tablas del esquema relacional oficial)
-- MOTOR: PostgreSQL 12+ (Compatible con PostgreSQL 18)
-- CODIFICACIÓN: UTF-8
-- PROPIEDAD: Totalmente idempotente (ON CONFLICT DO NOTHING + setval)
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. MÓDULO DE DESCUENTOS, ROLES Y PERMISOS (5 Tablas)
-- ==============================================================================

-- 1.1 Descuentos
INSERT INTO descuento (id_descuento, tope, porcentaje_descuento, estado) VALUES
    (1, 500000.00, 15.00, 'activo'),
    (2, 200000.00, 10.00, 'activo')
ON CONFLICT (id_descuento) DO NOTHING;

-- 1.2 Sub-Roles de Empresa
INSERT INTO sub_rol_empresa (id_sub_rol_empresa, nombre, id_descuento, estado) VALUES
    (1, 'Distribuidor Mayorista', 1, 'activo'),
    (2, 'Contratista Comercial',  2, 'activo')
ON CONFLICT (id_sub_rol_empresa) DO NOTHING;

-- 1.3 Roles Principales
INSERT INTO rol (id_rol, nombre, id_sub_rol_empresa, estado) VALUES
    (1, 'administrador', NULL, 'activo'),
    (2, 'cliente',       NULL, 'activo'),
    (3, 'empresa_vip',   1,    'activo')
ON CONFLICT (id_rol) DO NOTHING;

-- 1.4 Permisos Atómicos (Catálogo Maestro Oficial M17 / M20)
INSERT INTO permisos (id_permiso, nombre, descripcion, estado) VALUES
    -- Permisos heredados / pruebas M20
    (1,  'seguridad.configurar_sesion',    'Ajustar tiempos y políticas de vigencia de sesión', 'activo'),
    (2,  'productos.crear',                'Crear productos en el catálogo (alias legado)',      'activo'),
    (3,  'productos.eliminar',             'Permiso desactivado a propósito para pruebas',      'inactivo'),
    (4,  'ordenes.ver',                    'Visualizar órdenes de compra y ventas (alias legado)', 'activo'),
    (5,  'usuarios.gestionar',             'Administrar cuentas de usuarios (alias legado)',    'activo'),
    -- Catálogo Maestro Oficial M17
    (6,  'catalogo.ver',                   'Ver productos, variantes y categorías',             'activo'),
    (7,  'catalogo.crear',                 'Crear productos y variantes en el catálogo',        'activo'),
    (8,  'catalogo.editar',                'Editar productos, precios e imágenes',              'activo'),
    (9,  'catalogo.eliminar',              'Desactivar productos y variantes',                  'activo'),
    (10, 'ventas.ver',                     'Consultar órdenes de venta y cotizaciones',         'activo'),
    (11, 'ventas.gestionar',               'Actualizar estados y despachos de órdenes',         'activo'),
    (12, 'ventas.exportar',                'Exportar reportes comerciales y métricas de venta', 'activo'),
    (13, 'personal.ver',                   'Ver listado y ficha de empleados y clientes',       'activo'),
    (14, 'personal.editar',                'Editar datos de contacto y perfiles de empleados',  'activo'),
    (15, 'personal.desactivar',            'Desactivar y reactivar cuentas de empleado',        'activo'),
    (16, 'seguridad.gestionar_permisos',   'Asignar y revocar permisos individuales a empleados', 'activo'),
    (17, 'seguridad.gestionar_privacidad', 'Gestionar solicitudes de supresión y habeas data',  'activo'),
    (18, 'configuracion.ver',              'Consultar parámetros operativos del sistema',       'activo'),
    (19, 'configuracion.editar',           'Actualizar parámetros y reglas del sistema',        'activo')
ON CONFLICT (id_permiso) DO NOTHING;

-- 1.5 Asignación de Permisos a Roles
INSERT INTO asignacion_permiso (id_rol, id_permiso) VALUES
    (1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
    (1, 6), (1, 7), (1, 8), (1, 9), (1, 10),
    (1, 11), (1, 12), (1, 13), (1, 14), (1, 15),
    (1, 16), (1, 17), (1, 18), (1, 19),
    (3, 4), (3, 10)
ON CONFLICT (id_rol, id_permiso) DO NOTHING;

-- ==============================================================================
-- 2. MÓDULO DE USUARIOS, SESIONES Y CONTROL DE ACCESO (3 Tablas)
-- ==============================================================================

-- 2.1 Usuarios
-- Contraseña de prueba para todos: Pintuclic2026
-- Hashes generados con BCrypt costo 12 (CA-SEG-01-02)
INSERT INTO usuario (id_usuario, nombre, telefono, correo, contrasena, id_rol, estado, tipo) VALUES
    (1, 'Admin Pruebas',              '3001234567', 'admin@pintuclic.co',
        '$2b$12$i3iIf6m7gavl8FKk1sbgp.Iao4QP23bqCsf5MXrnhE5vQmPHHA32y', 1, 'activo',   'normal'),
    (2, 'Cliente Activo',             '3109876543', 'cliente@pintuclic.co',
        '$2b$12$rzP5oOr82AJTsAGk4dRAEOtzJnPwwxpsSdcZkx3hm1jVa9AZjcXIC', 2, 'activo',   'normal'),
    (3, 'Cliente De Baja',            '3155551234', 'baja@pintuclic.co',
        '$2b$12$rzP5oOr82AJTsAGk4dRAEOtzJnPwwxpsSdcZkx3hm1jVa9AZjcXIC', 2, 'inactivo', 'normal'),
    (4, 'Pinturas del Valle S.A.S.',  '3208889900', 'contacto@pinturasvalle.co',
        '$2b$12$rzP5oOr82AJTsAGk4dRAEOtzJnPwwxpsSdcZkx3hm1jVa9AZjcXIC', 3, 'activo',   'empresa')
ON CONFLICT (id_usuario) DO NOTHING;

-- 2.2 Relación 1:1 Usuario - Rol
INSERT INTO usuario_rol (id_usuario, id_rol) VALUES
    (1, 1),
    (2, 2),
    (3, 2),
    (4, 3)
ON CONFLICT (id_usuario) DO NOTHING;

-- 2.3 Sesiones de Usuario (M20 - HU-SEG-02)
INSERT INTO sesion (id_sesion, id_usuario, tipo_sesion, fecha_inicio, fecha_ultimo_acceso, fecha_expiracion, estado, motivo_cierre) VALUES
    ('a0000000-0000-0000-0000-000000000001'::uuid, 1, 'admin',   now(), now(), now() + interval '30 minutes', 'activa', NULL),
    ('a0000000-0000-0000-0000-000000000002'::uuid, 2, 'cliente', now(), now(), now() + interval '30 days',    'activa', NULL)
ON CONFLICT (id_sesion) DO NOTHING;

-- ==============================================================================
-- 3. MÓDULO DE CATÁLOGO, VARIANTES Y COMBOS (11 Tablas)
-- ==============================================================================

-- 3.1 Categoría
INSERT INTO categoria (id_categoria, nombre) VALUES
    (1, 'Pinturas Arquitectónicas'),
    (2, 'Preparación y Protección de Superficies')
ON CONFLICT (id_categoria) DO NOTHING;

-- 3.2 Subcategorías
INSERT INTO subcategorias (id_subcategoria, id_categoria, nombre) VALUES
    (1, 1, 'Interiores y Exteriores'),
    (2, 2, 'Anticorrosivos e Imprimantes')
ON CONFLICT (id_subcategoria) DO NOTHING;

-- 3.3 Sub-Subcategorías
INSERT INTO sub_subcategorias (id_sub_subcategoria, id_subcategoria, nombre) VALUES
    (1, 1, 'Vinilos Base Agua'),
    (2, 2, 'Bases Sintéticas')
ON CONFLICT (id_sub_subcategoria) DO NOTHING;

-- 3.4 Línea
INSERT INTO linea (id_linea, id_sub_subcategoria, nombre) VALUES
    (1, 1, 'Viniltex Avanzado'),
    (2, 2, 'Pintulux Anticorrosivo')
ON CONFLICT (id_linea) DO NOTHING;

-- 3.5 Producto
INSERT INTO producto (id_producto, id_linea, nombre) VALUES
    (1, 1, 'Viniltex Máxima Protección Antibacterial'),
    (2, 1, 'Kit Renovación Hogar Premium'),
    (3, 2, 'Esmalte Anticorrosivo Secado Rápido')
ON CONFLICT (id_producto) DO NOTHING;

-- 3.6 Colores Maestros
INSERT INTO color (id_color, nombre) VALUES
    (1, 'Blanco Puro'),
    (2, 'Azul Océano'),
    (3, 'Gris Titanio')
ON CONFLICT (id_color) DO NOTHING;

-- 3.7 Tonos Derivados con recargo de precio
INSERT INTO tonos (id_tono, id_color, precio) VALUES
    (1, 2, 15000.00),
    (2, 3, 12000.00)
ON CONFLICT (id_tono) DO NOTHING;

-- 3.8 Variantes Vendibles (SKU)
INSERT INTO variante (id_variante, id_producto, precio_vigente, estado, id_color) VALUES
    (1, 1, 85900.00,  'activo', 1),
    (2, 1, 95900.00,  'activo', 2),
    (3, 3, 115000.00, 'activo', 3)
ON CONFLICT (id_variante) DO NOTHING;

-- 3.9 Características Técnicas
INSERT INTO caracteristica (id_caracteristica, id_variante, nombre) VALUES
    (1, 1, 'Rendimiento: 40-45 m2 por galón a dos manos'),
    (2, 1, 'Acabado: Mate de alta lavabilidad sin olor'),
    (3, 2, 'Resistencia a la intemperie: Filtro UV grado superior'),
    (4, 3, 'Protección catódica contra óxido para metales')
ON CONFLICT (id_caracteristica) DO NOTHING;

-- 3.10 Combo Cabecera
INSERT INTO combo (id_combo, id_producto) VALUES
    (1, 2)
ON CONFLICT (id_combo) DO NOTHING;

-- 3.11 Detalle de Variantes en Combo
INSERT INTO variante_combo (id_variante_combo, id_variante, id_combo, cantidad) VALUES
    (1, 1, 1, 2),
    (2, 2, 1, 1)
ON CONFLICT (id_variante, id_combo) DO NOTHING;

-- ==============================================================================
-- 4. MÓDULO DE CARRITO DE COMPRAS (VIVO) (2 Tablas)
-- ==============================================================================

-- 4.1 Carrito
INSERT INTO carrito (id_carrito, token_visitante, id_usuario, fecha_ultima_actividad) VALUES
    (1, NULL, 2, now()),
    (2, 'anon-cart-uuid-dev-sample-2026', NULL, now())
ON CONFLICT (id_carrito) DO NOTHING;

-- 4.2 Líneas de Carrito
INSERT INTO linea_carrito (id_linea_carrito, id_carrito, id_variante, cantidad) VALUES
    (1, 1, 1, 2),
    (2, 2, 2, 1)
ON CONFLICT (id_carrito, id_variante) DO NOTHING;

-- ==============================================================================
-- 5. MÓDULO DE COTIZACIONES Y ÓRDENES (HISTÓRICO INMUTABLE) (3 Tablas)
-- ==============================================================================

-- 5.1 Cotización
INSERT INTO cotizacion (id_cotizacion, estado, fecha_creacion) VALUES
    (1, 'aprobada', now() - interval '2 days'),
    (2, 'borrador', now())
ON CONFLICT (id_cotizacion) DO NOTHING;

-- 5.2 Orden
INSERT INTO orden (id_orden, codigo_visible, id_usuario, origen, id_cotizacion, estado, transaccion_pago_id, direccion, sub_total, descuento, total, observaciones, fecha) VALUES
    (1, 'ORD-2026-0001', 2, 'carrito', NULL, 'pagado', 'TRX-PSE-987654321',
        'Calle 45 # 12-34, Apt 301, Chapinero, Bogotá D.C.', 171800.00, 0.00, 171800.00,
        'Dejar en portería debidamente sellado', CURRENT_DATE),
    (2, 'ORD-2026-0002', 4, 'cotizacion', 1, 'en_preparacion', 'TRX-TAR-112233445',
        'Avenida Las Americas # 68-90, Bodega 4, Medellín', 500000.00, 75000.00, 425000.00,
        'Despacho corporativo con factura electrónica adjunta', CURRENT_DATE)
ON CONFLICT (codigo_visible) DO NOTHING;

-- 5.3 Líneas de Orden (Snapshot Histórico Inmutable)
INSERT INTO linea_orden (id_linea_orden, id_orden, nombre_producto, variante_copia, precio_aplicado, cantidad) VALUES
    (1, 1, 'Viniltex Máxima Protección Antibacterial', 'Galón - Blanco Puro', 85900.00, 2),
    (2, 2, 'Kit Renovación Hogar Premium',              'Kit Corporativo Pro', 425000.00, 1)
ON CONFLICT (id_linea_orden) DO NOTHING;

-- ==============================================================================
-- 6. MÓDULO DE PAGOS Y FACTURACIÓN (3 Tablas)
-- ==============================================================================

-- 6.1 Métodos de Pago
INSERT INTO metodo_pago (id_metodo_pago, nombre, descripcion, estado) VALUES
    (1, 'PSE - Transferencia Bancaria', 'Pagos electrónicos seguros desde cualquier entidad financiera', 'activo'),
    (2, 'Tarjeta de Crédito / Débito',  'Procesamiento vía pasarela internacional (Visa, Master)',        'activo'),
    (3, 'Transferencia Bancolombia',    'Pago directo a cuenta empresarial',                             'activo')
ON CONFLICT (id_metodo_pago) DO NOTHING;

-- 6.2 Pagos
INSERT INTO pagos (id_pago, id_orden, id_metodo_pago, estado, monto) VALUES
    (1, 1, 1, 'completado', 171800.00),
    (2, 2, 2, 'completado', 425000.00)
ON CONFLICT (id_pago) DO NOTHING;

-- 6.3 Factura
INSERT INTO factura (id_factura, id_orden, fecha, estado) VALUES
    (1, 1, CURRENT_DATE, 'emitida'),
    (2, 2, CURRENT_DATE, 'pagada')
ON CONFLICT (id_factura) DO NOTHING;

-- ==============================================================================
-- 7. MÓDULO DE SERVICIOS Y RESERVACIONES (1 Tabla)
-- ==============================================================================

-- 7.1 Reservaciones
INSERT INTO reservaciones (id_reservacion, id_producto, id_usuario, fecha, hora, estado) VALUES
    (1, 1, 2, CURRENT_DATE + interval '3 days', '10:00:00', 'confirmada'),
    (2, 3, 4, CURRENT_DATE + interval '5 days', '14:30:00', 'pendiente')
ON CONFLICT (id_reservacion) DO NOTHING;

-- ==============================================================================
-- 8. MÓDULO DE PRIVACIDAD, CONSENTIMIENTO Y HABEAS DATA (3 Tablas)
-- ==============================================================================

-- 8.1 Aviso de Privacidad
INSERT INTO aviso_privacidad (id_aviso_privacidad, version, descripcion, es_vigente) VALUES
    (1, 'v1.0-2026', 'Política integral de tratamiento de datos personales conforme a la Ley Estatutaria 1581 de 2012 y Decreto 1377 de 2013 de la República de Colombia.', true),
    (2, 'v0.9-2025', 'Política preliminar de términos y condiciones de comercio digital para pruebas piloto.', false)
ON CONFLICT (version) DO NOTHING;

-- 8.2 Consentimiento de Usuarios
INSERT INTO consentimiento_usuario (id_consentimiento, id_usuario, id_aviso_privacidad, fecha) VALUES
    (1, 1, 1, now() - interval '10 days'),
    (2, 2, 1, now() - interval '5 days'),
    (3, 4, 1, now() - interval '2 days')
ON CONFLICT (id_usuario, id_aviso_privacidad) DO NOTHING;

-- 8.3 Solicitud de Supresión (Derechos ARCO / Habeas Data)
INSERT INTO solicitud_supresion (id_solicitud_supresion, id_usuario, fecha_solicitud, fecha_resolucion, estado) VALUES
    (1, 3, now() - interval '1 day', NULL, 'pendiente')
ON CONFLICT (id_solicitud_supresion) DO NOTHING;

-- ==============================================================================
-- 9. ACTUALIZACIÓN AUTOMÁTICA DE SECUENCIAS (EVITA COLISIONES DE IDs)
-- ==============================================================================

SELECT setval('descuento_id_descuento_seq',                      COALESCE((SELECT MAX(id_descuento) FROM descuento), 1));
SELECT setval('sub_rol_empresa_id_sub_rol_empresa_seq',          COALESCE((SELECT MAX(id_sub_rol_empresa) FROM sub_rol_empresa), 1));
SELECT setval('rol_id_rol_seq',                                  COALESCE((SELECT MAX(id_rol) FROM rol), 1));
SELECT setval('permisos_id_permiso_seq',                         COALESCE((SELECT MAX(id_permiso) FROM permisos), 1));
SELECT setval('asignacion_permiso_id_asignacion_permiso_seq',    COALESCE((SELECT MAX(id_asignacion_permiso) FROM asignacion_permiso), 1));
SELECT setval('usuario_id_usuario_seq',                          COALESCE((SELECT MAX(id_usuario) FROM usuario), 1));
SELECT setval('usuario_rol_id_usuario_rol_seq',                  COALESCE((SELECT MAX(id_usuario_rol) FROM usuario_rol), 1));
SELECT setval('categoria_id_categoria_seq',                      COALESCE((SELECT MAX(id_categoria) FROM categoria), 1));
SELECT setval('subcategorias_id_subcategoria_seq',              COALESCE((SELECT MAX(id_subcategoria) FROM subcategorias), 1));
SELECT setval('sub_subcategorias_id_sub_subcategoria_seq',       COALESCE((SELECT MAX(id_sub_subcategoria) FROM sub_subcategorias), 1));
SELECT setval('linea_id_linea_seq',                              COALESCE((SELECT MAX(id_linea) FROM linea), 1));
SELECT setval('producto_id_producto_seq',                        COALESCE((SELECT MAX(id_producto) FROM producto), 1));
SELECT setval('color_id_color_seq',                              COALESCE((SELECT MAX(id_color) FROM color), 1));
SELECT setval('tonos_id_tono_seq',                               COALESCE((SELECT MAX(id_tono) FROM tonos), 1));
SELECT setval('variante_id_variante_seq',                        COALESCE((SELECT MAX(id_variante) FROM variante), 1));
SELECT setval('caracteristica_id_caracteristica_seq',            COALESCE((SELECT MAX(id_caracteristica) FROM caracteristica), 1));
SELECT setval('combo_id_combo_seq',                              COALESCE((SELECT MAX(id_combo) FROM combo), 1));
SELECT setval('variante_combo_id_variante_combo_seq',            COALESCE((SELECT MAX(id_variante_combo) FROM variante_combo), 1));
SELECT setval('carrito_id_carrito_seq',                          COALESCE((SELECT MAX(id_carrito) FROM carrito), 1));
SELECT setval('linea_carrito_id_linea_carrito_seq',              COALESCE((SELECT MAX(id_linea_carrito) FROM linea_carrito), 1));
SELECT setval('cotizacion_id_cotizacion_seq',                    COALESCE((SELECT MAX(id_cotizacion) FROM cotizacion), 1));
SELECT setval('orden_id_orden_seq',                              COALESCE((SELECT MAX(id_orden) FROM orden), 1));
SELECT setval('linea_orden_id_linea_orden_seq',                  COALESCE((SELECT MAX(id_linea_orden) FROM linea_orden), 1));
SELECT setval('metodo_pago_id_metodo_pago_seq',                  COALESCE((SELECT MAX(id_metodo_pago) FROM metodo_pago), 1));
SELECT setval('pagos_id_pago_seq',                               COALESCE((SELECT MAX(id_pago) FROM pagos), 1));
SELECT setval('factura_id_factura_seq',                          COALESCE((SELECT MAX(id_factura) FROM factura), 1));
SELECT setval('reservaciones_id_reservacion_seq',                COALESCE((SELECT MAX(id_reservacion) FROM reservaciones), 1));
SELECT setval('aviso_privacidad_id_aviso_privacidad_seq',        COALESCE((SELECT MAX(id_aviso_privacidad) FROM aviso_privacidad), 1));
SELECT setval('consentimiento_usuario_id_consentimiento_seq',    COALESCE((SELECT MAX(id_consentimiento) FROM consentimiento_usuario), 1));
SELECT setval('solicitud_supresion_id_solicitud_supresion_seq',  COALESCE((SELECT MAX(id_solicitud_supresion) FROM solicitud_supresion), 1));

COMMIT;
