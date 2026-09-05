-- ==============================================================================
-- FIXTURE DE PRUEBAS DEL MÓDULO M20 - SEGURIDAD
--
-- ⚠️ ESTO NO ES EL CATÁLOGO DE PRODUCCIÓN.
-- Son datos mínimos para poder ejercitar los guardas de M20 en un entorno local.
-- El catálogo real de `permisos` pertenece a M17; estos nombres son de prueba.
-- NO ejecutar contra una base de datos con datos reales.
--
-- Requiere el esquema v2.2 (28 tablas) ya cargado desde bd/sql/schema_pintuclic.sql
-- Es idempotente: se puede correr varias veces sin romper nada.
-- ==============================================================================

BEGIN;

-- Roles ------------------------------------------------------------------------
INSERT INTO rol (id_rol, nombre, estado) VALUES
    (1, 'administrador', 'activo'),
    (2, 'cliente',       'activo')
ON CONFLICT (id_rol) DO NOTHING;

-- Permisos ---------------------------------------------------------------------
-- El tercero nace INACTIVO a propósito: sirve para comprobar que un permiso
-- desactivado deja de conceder acceso aunque siga asignado al rol.
INSERT INTO permisos (id_permiso, nombre, descripcion, estado) VALUES
    (1, 'seguridad.configurar_sesion', 'Ajustar tiempos de vigencia de sesion', 'activo'),
    (2, 'productos.crear',             'Crear productos en el catalogo',        'activo'),
    (3, 'productos.eliminar',          'Permiso desactivado a proposito',       'inactivo')
ON CONFLICT (id_permiso) DO NOTHING;

INSERT INTO asignacion_permiso (id_rol, id_permiso) VALUES
    (1, 1), (1, 2), (1, 3)
ON CONFLICT (id_rol, id_permiso) DO NOTHING;

-- Usuarios ---------------------------------------------------------------------
-- Contraseña de los tres: Pintuclic2026
-- Los hashes de los usuarios 2 y 3 son distintos entre sí pese a compartir
-- contraseña: BCrypt genera una sal única por invocación (CA-SEG-01-02).
INSERT INTO usuario (id_usuario, nombre, correo, contrasena, id_rol, estado) VALUES
    (1, 'Admin Pruebas',   'admin@pintuclic.co',
        '$2b$12$i3iIf6m7gavl8FKk1sbgp.Iao4QP23bqCsf5MXrnhE5vQmPHHA32y', 1, 'activo'),
    (2, 'Cliente Activo',  'cliente@pintuclic.co',
        '$2b$12$rzP5oOr82AJTsAGk4dRAEOtzJnPwwxpsSdcZkx3hm1jVa9AZjcXIC', 2, 'activo'),
    (3, 'Cliente De Baja', 'baja@pintuclic.co',
        '$2b$12$rzP5oOr82AJTsAGk4dRAEOtzJnPwwxpsSdcZkx3hm1jVa9AZjcXIC', 2, 'inactivo')
ON CONFLICT (id_usuario) DO NOTHING;

INSERT INTO usuario_rol (id_usuario, id_rol) VALUES
    (1, 1), (2, 2), (3, 2)
ON CONFLICT (id_usuario) DO NOTHING;

-- Las secuencias quedan por encima de los ids insertados a mano.
SELECT setval('rol_id_rol_seq',          (SELECT MAX(id_rol)     FROM rol));
SELECT setval('permisos_id_permiso_seq', (SELECT MAX(id_permiso) FROM permisos));
SELECT setval('usuario_id_usuario_seq',  (SELECT MAX(id_usuario) FROM usuario));

COMMIT;

-- ==============================================================================
-- RESTAURAR EL ESTADO tras correr la batería de pruebas
-- (las pruebas cambian la contraseña del usuario 2 y retiran permisos)
-- ==============================================================================
-- UPDATE usuario SET contrasena = '$2b$12$rzP5oOr82AJTsAGk4dRAEOtzJnPwwxpsSdcZkx3hm1jVa9AZjcXIC'
--   WHERE id_usuario IN (2, 3);
-- UPDATE usuario SET estado = 'inactivo' WHERE id_usuario = 3;
-- INSERT INTO asignacion_permiso (id_rol, id_permiso) VALUES (1,1),(1,2),(1,3)
--   ON CONFLICT DO NOTHING;
-- DELETE FROM sesion;
