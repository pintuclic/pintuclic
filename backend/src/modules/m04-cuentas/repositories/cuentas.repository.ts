import { Kysely } from 'kysely';
import { Database, Usuario, NewUsuario, UsuarioUpdate, EnumEstadoUsuario } from '../../../core/db/types';

// ==============================================================================
// M04 - REPOSITORIO DE CUENTAS (Kysely + PostgreSQL)
// Acceso seguro a las tablas usuario, usuario_rol y rol
// ==============================================================================

export class CuentasRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /**
   * Busca un usuario por correo electrónico normalizado en minúsculas (HU-CUE-08).
   */
  async buscarPorCorreo(correo: string): Promise<Usuario | undefined> {
    const normalizado = correo.trim().toLowerCase();
    return this.db
      .selectFrom('usuario')
      .selectAll()
      .where((eb) => eb(eb.fn('lower', ['correo']), '=', normalizado))
      .executeTakeFirst();
  }

  /**
   * Busca un usuario por su identificador primario.
   */
  async buscarPorId(idUsuario: number): Promise<Usuario | undefined> {
    return this.db
      .selectFrom('usuario')
      .selectAll()
      .where('id_usuario', '=', idUsuario)
      .executeTakeFirst();
  }

  /**
   * Inserta un nuevo usuario en la base de datos PostgreSQL.
   */
  async crearUsuario(datos: NewUsuario): Promise<Usuario> {
    return this.db
      .insertInto('usuario')
      .values({
        ...datos,
        correo: datos.correo.trim().toLowerCase(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Asigna un rol al usuario en la tabla `usuario_rol`.
   */
  async asignarRolUsuario(idUsuario: number, idRol: number): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto('usuario_rol')
        .values({
          id_usuario: idUsuario,
          id_rol: idRol,
        })
        .onConflict((oc) =>
          oc.column('id_usuario').doUpdateSet({ id_rol: idRol })
        )
        .execute();

      // Sincronizar también rol directo en tabla usuario
      await trx
        .updateTable('usuario')
        .set({ id_rol: idRol })
        .where('id_usuario', '=', idUsuario)
        .execute();
    });
  }

  /**
   * Obtiene un usuario con el nombre de su rol asociado.
   */
  async obtenerUsuarioConRol(idUsuario: number): Promise<{
    usuario: Usuario;
    rolNombre: string | null;
  } | null> {
    const fila = await this.db
      .selectFrom('usuario as u')
      .leftJoin('usuario_rol as ur', 'ur.id_usuario', 'u.id_usuario')
      .leftJoin('rol as r', 'r.id_rol', 'ur.id_rol')
      .select([
        'u.id_usuario',
        'u.nombre',
        'u.telefono',
        'u.correo',
        'u.contrasena',
        'u.id_rol',
        'u.estado',
        'u.tipo',
        'r.nombre as rol_nombre',
      ])
      .where('u.id_usuario', '=', idUsuario)
      .executeTakeFirst();

    if (!fila) {
      return null;
    }

    const { rol_nombre, ...usuarioData } = fila;
    return {
      usuario: usuarioData as Usuario,
      rolNombre: rol_nombre ?? null,
    };
  }

  /**
   * Actualiza el estado de una cuenta (activo, inactivo, bloqueado, pendiente).
   */
  async actualizarEstado(idUsuario: number, estado: EnumEstadoUsuario): Promise<void> {
    await this.db
      .updateTable('usuario')
      .set({ estado })
      .where('id_usuario', '=', idUsuario)
      .execute();
  }

  /**
   * Actualiza la información personal del usuario.
   */
  async actualizarUsuario(idUsuario: number, datos: UsuarioUpdate): Promise<void> {
    await this.db
      .updateTable('usuario')
      .set(datos)
      .where('id_usuario', '=', idUsuario)
      .execute();
  }

  /**
   * Actualiza el hash de la contraseña tras verificación de seguridad.
   */
  async actualizarContrasena(idUsuario: number, nuevoHash: string): Promise<void> {
    await this.db
      .updateTable('usuario')
      .set({ contrasena: nuevoHash })
      .where('id_usuario', '=', idUsuario)
      .execute();
  }

  /**
   * Actualiza la dirección de correo electrónico del usuario.
   */
  async actualizarCorreo(idUsuario: number, nuevoCorreo: string): Promise<void> {
    await this.db
      .updateTable('usuario')
      .set({ correo: nuevoCorreo.trim().toLowerCase() })
      .where('id_usuario', '=', idUsuario)
      .execute();
  }
}
