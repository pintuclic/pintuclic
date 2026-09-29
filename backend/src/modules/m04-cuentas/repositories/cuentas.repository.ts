import { Kysely } from 'kysely';
import {
  Database,
  Usuario,
  NewUsuario,
  UsuarioUpdate,
  EnumEstadoUsuario,
  UsuarioIdentidadExterna,
  NewUsuarioIdentidadExterna,
} from '../../../core/db/types';

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
   * Crea un nuevo registro de usuario en la base de datos PostgreSQL.
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
   * Asigna un rol a un usuario en la tabla relacional usuario_rol.
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

      await trx
        .updateTable('usuario')
        .set({ id_rol: idRol })
        .where('id_usuario', '=', idUsuario)
        .execute();
    });
  }

  /**
   * Obtiene el nombre del rol principal asociado al usuario.
   */
  async obtenerRolPrincipal(idUsuario: number): Promise<string | null> {
    const resultado = await this.db
      .selectFrom('usuario_rol')
      .innerJoin('rol', 'rol.id_rol', 'usuario_rol.id_rol')
      .select('rol.nombre')
      .where('usuario_rol.id_usuario', '=', idUsuario)
      .executeTakeFirst();

    return resultado?.nombre ?? null;
  }

  /**
   * Obtiene un usuario con el nombre de su rol asociado.
   */
  async obtenerUsuarioConRol(idUsuario: number): Promise<{
    usuario: Usuario;
    rolNombre: string | null;
  } | null> {
    const usuario = await this.buscarPorId(idUsuario);
    if (!usuario) return null;

    const rolNombre = await this.obtenerRolPrincipal(idUsuario);
    return {
      usuario,
      rolNombre,
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

  /**
   * Busca una vinculación federada externa por proveedor e identificador de proveedor (HU-CUE-02).
   */
  async buscarIdentidadExterna(
    proveedor: string,
    idProveedor: string
  ): Promise<UsuarioIdentidadExterna | undefined> {
    return this.db
      .selectFrom('usuario_identidad_externa')
      .selectAll()
      .where('proveedor', '=', proveedor)
      .where('id_proveedor', '=', idProveedor)
      .executeTakeFirst();
  }

  /**
   * Busca la vinculación federada de un usuario por su ID y proveedor (HU-CUE-02).
   */
  async buscarIdentidadPorUsuario(
    idUsuario: number,
    proveedor: string
  ): Promise<UsuarioIdentidadExterna | undefined> {
    return this.db
      .selectFrom('usuario_identidad_externa')
      .selectAll()
      .where('id_usuario', '=', idUsuario)
      .where('proveedor', '=', proveedor)
      .executeTakeFirst();
  }

  /**
   * Registra una vinculación de identidad federada (Google Identity) en PostgreSQL (HU-CUE-02).
   */
  async vincularIdentidadExterna(
    datos: NewUsuarioIdentidadExterna
  ): Promise<UsuarioIdentidadExterna> {
    return this.db
      .insertInto('usuario_identidad_externa')
      .values(datos)
      .onConflict((oc) =>
        oc.columns(['id_usuario', 'proveedor']).doUpdateSet({
          id_proveedor: datos.id_proveedor,
          correo_proveedor: datos.correo_proveedor,
          fecha_vinculacion: new Date(),
        })
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Elimina la vinculación federada de un usuario con un proveedor.
   */
  async desvincularIdentidadExterna(idUsuario: number, proveedor: string): Promise<void> {
    await this.db
      .deleteFrom('usuario_identidad_externa')
      .where('id_usuario', '=', idUsuario)
      .where('proveedor', '=', proveedor)
      .execute();
  }
}
