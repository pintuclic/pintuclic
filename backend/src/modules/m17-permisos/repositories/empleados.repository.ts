import { Kysely } from 'kysely';
import { Database, EnumEstadoUsuario } from '../../../core/db/types';
import { EmpleadoResumen, EmpleadoDetalle } from '../interfaces/m17.interfaces';

// ==============================================================================
// M17 - REPOSITORIO DE EMPLEADOS
// Unico punto que habla con PostgreSQL para operaciones de empleados.
// No expone jamas usuario.contrasena (RF-SEG-01-04, HU-SEG-06).
// ==============================================================================

/**
 * Filtros opcionales para listar empleados (RF-ADM-01-12).
 */
export interface FiltroEmpleados {
  estado?: EnumEstadoUsuario | undefined;
  busqueda?: string | undefined;
  pagina: number;
  por_pagina: number;
}

export class EmpleadosRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /**
   * Verifica si un correo ya existe en cualquier cuenta de usuario (HU-CUE-08).
   * La comparacion es insensible a mayusculas para garantizar unicidad global.
   */
  async correoExiste(correo: string): Promise<boolean> {
    const fila = await this.db
      .selectFrom('usuario')
      .select('id_usuario')
      .where((eb) => eb(eb.fn('lower', ['correo']), '=', correo.trim().toLowerCase()))
      .executeTakeFirst();

    return fila !== undefined;
  }

  /**
   * Crea un nuevo empleado en la tabla usuario con:
   * - tipo = 'normal' (cuenta individual, no empresa)
   * - estado = 'activo'
   * - id_rol apuntando al rol individual que se crea previamente (Opcion A)
   * Retorna el id_usuario generado.
   */
  async crearEmpleado(datos: {
    nombre: string;
    correo: string;
    telefono?: string | undefined;
    contrasena_hash: string;
    id_rol: number;
  }): Promise<number> {
    const resultado = await this.db
      .insertInto('usuario')
      .values({
        nombre: datos.nombre,
        correo: datos.correo.toLowerCase(),
        telefono: datos.telefono ?? null,
        contrasena: datos.contrasena_hash,
        id_rol: datos.id_rol,
        estado: 'activo',
        tipo: 'normal',
      })
      .returning('id_usuario')
      .executeTakeFirstOrThrow();

    return resultado.id_usuario;
  }

  /**
   * Crea un rol individual para el empleado recien creado (Opcion A - sin migracion de BD).
   * El nombre del rol sigue el patron `empleado_{id_usuario}` para identificacion unica.
   */
  async crearRolIndividual(idUsuario: number): Promise<number> {
    const resultado = await this.db
      .insertInto('rol')
      .values({
        nombre: `empleado_${idUsuario}`,
        id_sub_rol_empresa: null,
        estado: 'activo',
      })
      .returning('id_rol')
      .executeTakeFirstOrThrow();

    return resultado.id_rol;
  }

  /**
   * Asigna el rol individual al usuario en la tabla usuario_rol.
   */
  async asignarRolAUsuario(idUsuario: number, idRol: number): Promise<void> {
    await this.db
      .insertInto('usuario_rol')
      .values({ id_usuario: idUsuario, id_rol: idRol })
      .execute();
  }

  /**
   * Actualiza el id_rol directo del usuario para que apunte al rol individual.
   */
  async actualizarRolDirecto(idUsuario: number, idRol: number): Promise<void> {
    await this.db
      .updateTable('usuario')
      .set({ id_rol: idRol })
      .where('id_usuario', '=', idUsuario)
      .execute();
  }

  /**
   * Lista empleados que NO son clientes (tienen un rol individual creado por M17).
   * Filtra por estado y/o busqueda de texto libre sobre nombre o correo.
   */
  async listarEmpleados(filtros: FiltroEmpleados): Promise<{
    empleados: EmpleadoResumen[];
    total: number;
  }> {
    let query = this.db
      .selectFrom('usuario as u')
      .innerJoin('usuario_rol as ur', 'ur.id_usuario', 'u.id_usuario')
      .innerJoin('rol as r', 'r.id_rol', 'ur.id_rol')
      .select([
        'u.id_usuario',
        'u.nombre',
        'u.correo',
        'u.telefono',
        'u.estado',
      ])
      // Los empleados tienen rol individual con patron 'empleado_*'
      .where('r.nombre', 'like', 'empleado_%');

    if (filtros.estado) {
      query = query.where('u.estado', '=', filtros.estado);
    }

    if (filtros.busqueda) {
      const termino = `%${filtros.busqueda.toLowerCase()}%`;
      query = query.where((eb) =>
        eb.or([
          eb(eb.fn('lower', ['u.nombre']), 'like', termino),
          eb(eb.fn('lower', ['u.correo']), 'like', termino),
        ])
      );
    }

    const total = await query
      .clearSelect()
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .executeTakeFirstOrThrow()
      .then((r) => Number(r.total));

    const offset = (filtros.pagina - 1) * filtros.por_pagina;
    const empleados = await query
      .orderBy('u.nombre', 'asc')
      .limit(filtros.por_pagina)
      .offset(offset)
      .execute();

    return { empleados, total };
  }

  /**
   * Obtiene la ficha completa de un empleado por ID (RF-ADM-01-13).
   * Retorna null si el usuario no existe o no es un empleado.
   */
  async obtenerEmpleadoPorId(idUsuario: number): Promise<EmpleadoResumen | null> {
    const fila = await this.db
      .selectFrom('usuario as u')
      .innerJoin('usuario_rol as ur', 'ur.id_usuario', 'u.id_usuario')
      .innerJoin('rol as r', 'r.id_rol', 'ur.id_rol')
      .select([
        'u.id_usuario',
        'u.nombre',
        'u.correo',
        'u.telefono',
        'u.estado',
      ])
      .where('u.id_usuario', '=', idUsuario)
      .where('r.nombre', 'like', 'empleado_%')
      .executeTakeFirst();

    return fila ?? null;
  }

  /**
   * Actualiza datos de contacto del empleado: solo nombre y/o telefono (RF-ADM-01-07).
   */
  async actualizarContacto(idUsuario: number, datos: {
    nombre?: string | undefined;
    telefono?: string | undefined;
  }): Promise<void> {
    await this.db
      .updateTable('usuario')
      .set({
        ...(datos.nombre !== undefined && { nombre: datos.nombre }),
        ...(datos.telefono !== undefined && { telefono: datos.telefono }),
      })
      .where('id_usuario', '=', idUsuario)
      .execute();
  }

  /**
   * Actualiza el estado logico de un empleado (RF-ADM-01-10).
   * No realiza borrado fisico.
   */
  async actualizarEstado(idUsuario: number, estado: EnumEstadoUsuario): Promise<void> {
    await this.db
      .updateTable('usuario')
      .set({ estado })
      .where('id_usuario', '=', idUsuario)
      .execute();
  }

  /**
   * Obtiene el id_rol individual del empleado para operaciones de permisos.
   */
  async obtenerIdRolIndividual(idUsuario: number): Promise<number | null> {
    const fila = await this.db
      .selectFrom('usuario_rol as ur')
      .innerJoin('rol as r', 'r.id_rol', 'ur.id_rol')
      .select('ur.id_rol')
      .where('ur.id_usuario', '=', idUsuario)
      .where('r.nombre', 'like', 'empleado_%')
      .executeTakeFirst();

    return fila?.id_rol ?? null;
  }
}

