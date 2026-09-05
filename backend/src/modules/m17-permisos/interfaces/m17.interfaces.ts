import { EnumEstadoUsuario } from '../../../core/db/types';

// ==============================================================================
// M17 - ADMINISTRACIÓN, EMPLEADOS Y PERMISOS
// Contratos e interfaces públicas del módulo (Solo tipos de compilación, 0 runtime)
// ==============================================================================

// ------------------------------------------------------------------------------
// PERMISOS — Catálogo maestro y reglas de cascada
// ------------------------------------------------------------------------------

/**
 * Áreas funcionales del sistema que agrupan los permisos (RF-ADM-02-01).
 */
export type AreaFuncional =
  | 'catalogo'
  | 'ventas'
  | 'personal'
  | 'seguridad'
  | 'configuracion';

/**
 * Permiso atómico tal como vive en el catálogo `permisos` de la BD.
 */
export interface PermisoDetalle {
  readonly id_permiso: number;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly area: AreaFuncional;
}

/**
 * Catálogo de permisos agrupado por área funcional (RF-ADM-02-01).
 */
export type CatalogoPermisos = Record<AreaFuncional, PermisoDetalle[]>;

/**
 * Mapa de dependencias para la regla de cascada (RF-ADM-02-06, RF-ADM-02-07).
 * Al conceder un permiso de operación, se auto-concede el de consulta.
 * Al revocar consulta, se revocan en cascada los dependientes.
 */
export const DEPENDENCIAS_PERMISOS: Readonly<Record<string, string>> = {
  'catalogo.crear':    'catalogo.ver',
  'catalogo.editar':   'catalogo.ver',
  'catalogo.eliminar': 'catalogo.ver',
  'ventas.gestionar':  'ventas.ver',
  'ventas.exportar':   'ventas.ver',
  'personal.editar':     'personal.ver',
  'personal.desactivar': 'personal.ver',
  'seguridad.gestionar_permisos': 'personal.ver',
  'configuracion.editar': 'configuracion.ver',
};

/**
 * Semillas del catálogo maestro que M17 garantiza en la BD al arrancar.
 * M20 ya declaró `seguridad.configurar_sesion`; M17 registra el resto.
 */
export const PERMISOS_SISTEMA: ReadonlyArray<{
  nombre: string;
  descripcion: string;
  area: AreaFuncional;
}> = [
  { nombre: 'catalogo.ver',      descripcion: 'Ver productos, variantes y categorias',           area: 'catalogo'       },
  { nombre: 'catalogo.crear',    descripcion: 'Crear productos y variantes',                     area: 'catalogo'       },
  { nombre: 'catalogo.editar',   descripcion: 'Editar productos, precios e imagenes',            area: 'catalogo'       },
  { nombre: 'catalogo.eliminar', descripcion: 'Desactivar productos y variantes',                area: 'catalogo'       },
  { nombre: 'ventas.ver',        descripcion: 'Consultar ordenes y cotizaciones',                area: 'ventas'         },
  { nombre: 'ventas.gestionar',  descripcion: 'Actualizar estado de ordenes',                    area: 'ventas'         },
  { nombre: 'ventas.exportar',   descripcion: 'Exportar reportes de ventas',                     area: 'ventas'         },
  { nombre: 'personal.ver',        descripcion: 'Ver listado y ficha de empleados y clientes',   area: 'personal'       },
  { nombre: 'personal.editar',     descripcion: 'Editar datos de contacto de empleados',         area: 'personal'       },
  { nombre: 'personal.desactivar', descripcion: 'Desactivar/reactivar cuentas de empleado',     area: 'personal'       },
  { nombre: 'seguridad.gestionar_permisos', descripcion: 'Asignar/revocar permisos a empleados',area: 'seguridad'      },
  { nombre: 'seguridad.configurar_sesion',  descripcion: 'Ajustar politica de vigencia de sesion', area: 'seguridad'   },
  { nombre: 'configuracion.ver',   descripcion: 'Consultar parametros del sistema',              area: 'configuracion'  },
  { nombre: 'configuracion.editar', descripcion: 'Actualizar parametros del sistema',            area: 'configuracion'  },
];

// ------------------------------------------------------------------------------
// EMPLEADOS — Respuestas HTTP
// ------------------------------------------------------------------------------

/** Ficha resumida de un empleado para listados (RF-ADM-01-12). Sin datos sensibles. */
export interface EmpleadoResumen {
  readonly id_usuario: number;
  readonly nombre: string;
  readonly correo: string;
  readonly telefono: string | null;
  readonly estado: EnumEstadoUsuario;
}

/** Ficha completa de un empleado con sus permisos actuales (RF-ADM-01-13). */
export interface EmpleadoDetalle extends EmpleadoResumen {
  readonly permisos: readonly string[];
}

/**
 * Resultado de crear un empleado: incluye la credencial temporal de un solo uso.
 * La contrasena temporal SOLO se retorna en esta respuesta (RF-ADM-01-04, HU-SEG-01).
 */
export interface EmpleadoCreadoRespuesta {
  readonly id_usuario: number;
  readonly correo: string;
  readonly contrasena_temporal: string;
}

// ------------------------------------------------------------------------------
// CLIENTES — Respuestas HTTP
// ------------------------------------------------------------------------------

/** Ficha resumida de cliente para administracion (RF-ADM-04-01). Sin datos sensibles. */
export interface ClienteResumen {
  readonly id_usuario: number;
  readonly nombre: string;
  readonly correo: string;
  readonly telefono: string | null;
  readonly tipo: 'normal' | 'empresa';
  readonly estado: EnumEstadoUsuario;
}

// ------------------------------------------------------------------------------
// PARÁMETROS — Respuestas HTTP
// ------------------------------------------------------------------------------

/** Par clave-valor de un parametro configurable del sistema (RF-ADM-06). */
export interface ParametroSistema {
  readonly clave: string;
  readonly valor: string | number | boolean;
  readonly descripcion?: string;
}
