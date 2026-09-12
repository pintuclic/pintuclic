import { Kysely } from 'kysely';
import { Database } from '../../../core/db/types';
import { IdentidadVigente } from '../interfaces/seguridad.interfaces';

/**
 * Repositorio de consultas de seguridad (M20).
 *
 * Único punto del módulo que habla con PostgreSQL vía Kysely, conforme al
 * principio de Responsabilidad Única de `backend/infraestructura.md`.
 * No expone jamás la columna `usuario.contrasena` (RF-SEG-01-04, RF-SEG-06-01).
 */
export class SeguridadRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /**
   * Resuelve la identidad vigente del usuario consultando la base de datos en el
   * momento de la petición. No se apoya en los claims del token: es lo que permite
   * que una cuenta desactivada o un permiso retirado surtan efecto de inmediato
   * (CA-SEG-02-04, CA-SEG-02-05, CA-SEG-03-04).
   *
   * @returns La identidad vigente, o `null` si el usuario ya no existe.
   */
  async obtenerIdentidadVigente(idUsuario: number): Promise<IdentidadVigente | null> {
    const usuario = await this.db
      .selectFrom('usuario as u')
      .leftJoin('usuario_rol as ur', 'ur.id_usuario', 'u.id_usuario')
      .select(['u.id_usuario', 'u.estado', 'u.id_rol as rol_directo', 'ur.id_rol as rol_asignado'])
      .where('u.id_usuario', '=', idUsuario)
      .executeTakeFirst();

    if (!usuario) {
      return null;
    }

    // `usuario_rol` es la asignación explícita (UNIQUE por usuario) y tiene prioridad
    // sobre `usuario.id_rol`, que el DDL documenta como "rol directo por defecto".
    const idRol = usuario.rol_asignado ?? usuario.rol_directo;
    const permisos = idRol === null ? [] : await this.obtenerPermisosDeRol(idRol);

    return {
      id_usuario: usuario.id_usuario,
      estado: usuario.estado,
      id_rol: idRol,
      permisos,
    };
  }

  /**
   * Devuelve los nombres de los permisos activos concedidos a un rol.
   * Un permiso desactivado (`permisos.estado = 'inactivo'`) deja de conceder acceso.
   */
  async obtenerPermisosDeRol(idRol: number): Promise<string[]> {
    const filas = await this.db
      .selectFrom('asignacion_permiso as ap')
      .innerJoin('permisos as p', 'p.id_permiso', 'ap.id_permiso')
      .select('p.nombre')
      .where('ap.id_rol', '=', idRol)
      .where('p.estado', '=', 'activo')
      .execute();

    return filas.map((fila) => fila.nombre);
  }

  /**
   * Recupera el hash de la contraseña para verificarlo durante un cambio de credencial.
   * Su retorno NUNCA debe alcanzar una respuesta HTTP (RF-SEG-01-04, HU-SEG-06).
   */
  async obtenerHashContrasena(idUsuario: number): Promise<string | null> {
    const fila = await this.db
      .selectFrom('usuario')
      .select('contrasena')
      .where('id_usuario', '=', idUsuario)
      .executeTakeFirst();

    return fila?.contrasena ?? null;
  }

  /**
   * Recupera la credencial asociada a un correo para verificar un intento de acceso.
   *
   * Su retorno contiene el hash y por tanto NUNCA debe alcanzar una respuesta HTTP
   * (RF-SEG-01-04, HU-SEG-06). El correo se compara en minúsculas para que la
   * unicidad de cuentas no dependa de cómo lo escriba el usuario (HU-CUE-08).
   */
  async obtenerCredencialPorCorreo(
    correo: string
  ): Promise<{ id_usuario: number; correo: string; contrasena: string } | undefined> {
    return this.db
      .selectFrom('usuario')
      .select(['id_usuario', 'correo', 'contrasena'])
      .where((eb) => eb(eb.fn('lower', ['correo']), '=', correo.trim().toLowerCase()))
      .executeTakeFirst();
  }

  /**
   * Persiste el nuevo hash de contraseña derivado con BCrypt (RF-SEG-01-01).
   */
  async actualizarHashContrasena(idUsuario: number, hash: string): Promise<void> {
    await this.db
      .updateTable('usuario')
      .set({ contrasena: hash })
      .where('id_usuario', '=', idUsuario)
      .execute();
  }
}
