import { Kysely } from 'kysely';
import { Database } from '../../../core/db/types';
import { ClienteResumen } from '../interfaces/m17.interfaces';

// ==============================================================================
// M17 - REPOSITORIO DE CLIENTES
// Consultas de clientes para el panel de administracion.
// Nunca expone contrasena ni datos de tarjetas (HU-SEG-06).
// ==============================================================================

export interface FiltroClientes {
  busqueda?: string | undefined;
  tipo?: 'normal' | 'empresa' | undefined;
  estado?: 'activo' | 'inactivo' | 'bloqueado' | 'pendiente' | undefined;
  pagina: number;
  por_pagina: number;
}

export class ClientesRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /**
   * Lista clientes (tipo = normal | empresa) con filtros facetados (RF-ADM-04-01).
   * Excluye empleados (identificados por el patron de rol 'empleado_*').
   */
  async listarClientes(filtros: FiltroClientes): Promise<{
    clientes: ClienteResumen[];
    total: number;
  }> {
    // Subquery para excluir usuarios que tengan un rol individual de empleado
    let query = this.db
      .selectFrom('usuario as u')
      .leftJoin('usuario_rol as ur', 'ur.id_usuario', 'u.id_usuario')
      .leftJoin('rol as r', 'r.id_rol', 'ur.id_rol')
      .select([
        'u.id_usuario',
        'u.nombre',
        'u.correo',
        'u.telefono',
        'u.tipo',
        'u.estado',
      ])
      .where((eb) =>
        eb.or([
          eb('r.nombre', 'not like', 'empleado_%'),
          eb('r.id_rol', 'is', null),
        ])
      );

    if (filtros.tipo) {
      query = query.where('u.tipo', '=', filtros.tipo);
    }

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
    const clientes = await query
      .orderBy('u.nombre', 'asc')
      .limit(filtros.por_pagina)
      .offset(offset)
      .execute();

    return { clientes, total };
  }

  /**
   * Obtiene la ficha de un cliente por ID. Null si no existe o es empleado.
   */
  async obtenerClientePorId(idUsuario: number): Promise<ClienteResumen | null> {
    const fila = await this.db
      .selectFrom('usuario as u')
      .leftJoin('usuario_rol as ur', 'ur.id_usuario', 'u.id_usuario')
      .leftJoin('rol as r', 'r.id_rol', 'ur.id_rol')
      .select([
        'u.id_usuario',
        'u.nombre',
        'u.correo',
        'u.telefono',
        'u.tipo',
        'u.estado',
      ])
      .where('u.id_usuario', '=', idUsuario)
      .where((eb) =>
        eb.or([
          eb('r.nombre', 'not like', 'empleado_%'),
          eb('r.id_rol', 'is', null),
        ])
      )
      .executeTakeFirst();

    return fila ?? null;
  }

  /**
   * Actualiza el estado de un cliente (bloqueo/desbloqueo administrativo).
   * El motivo se registra en el servidor (no en BD hasta implementar auditoria).
   */
  async actualizarEstado(
    idUsuario: number,
    estado: 'activo' | 'inactivo' | 'bloqueado'
  ): Promise<void> {
    await this.db
      .updateTable('usuario')
      .set({ estado })
      .where('id_usuario', '=', idUsuario)
      .execute();
  }
}

