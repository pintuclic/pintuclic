import { Kysely } from 'kysely';
import { Database } from '../../../core/db/types';
import { PermisoDetalle, AreaFuncional } from '../interfaces/m17.interfaces';

// ==============================================================================
// M17 - REPOSITORIO DE PERMISOS
// Gestiona el catalogo maestro y la asignacion/revocacion de permisos por rol individual.
// ==============================================================================

export class PermisosRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /**
   * Retorna el catalogo completo de permisos activos, con el area funcional
   * inferida desde el prefijo del nombre (RF-ADM-02-01).
   */
  async obtenerCatalogoCompleto(): Promise<PermisoDetalle[]> {
    const filas = await this.db
      .selectFrom('permisos')
      .select(['id_permiso', 'nombre', 'descripcion'])
      .where('estado', '=', 'activo')
      .orderBy('nombre', 'asc')
      .execute();

    return filas.map((fila) => ({
      id_permiso: fila.id_permiso,
      nombre: fila.nombre,
      descripcion: fila.descripcion,
      area: this.inferirArea(fila.nombre),
    }));
  }

  /**
   * Retorna los permisos asignados a un rol individual (nombres de permiso).
   */
  async obtenerPermisosDeRol(idRol: number): Promise<string[]> {
    const filas = await this.db
      .selectFrom('asignacion_permiso as ap')
      .innerJoin('permisos as p', 'p.id_permiso', 'ap.id_permiso')
      .select('p.nombre')
      .where('ap.id_rol', '=', idRol)
      .where('p.estado', '=', 'activo')
      .execute();

    return filas.map((f) => f.nombre);
  }

  /**
   * Retorna el id_permiso de un permiso por nombre. Null si no existe.
   */
  async obtenerIdPorNombre(nombre: string): Promise<number | null> {
    const fila = await this.db
      .selectFrom('permisos')
      .select('id_permiso')
      .where('nombre', '=', nombre)
      .where('estado', '=', 'activo')
      .executeTakeFirst();

    return fila?.id_permiso ?? null;
  }

  /**
   * Asigna un permiso a un rol individual. Idempotente (ON CONFLICT DO NOTHING).
   */
  async asignarPermiso(idRol: number, idPermiso: number): Promise<void> {
    await this.db
      .insertInto('asignacion_permiso')
      .values({ id_rol: idRol, id_permiso: idPermiso })
      .onConflict((oc) => oc.columns(['id_rol', 'id_permiso']).doNothing())
      .execute();
  }

  /**
   * Revoca un permiso de un rol individual.
   */
  async revocarPermiso(idRol: number, idPermiso: number): Promise<void> {
    await this.db
      .deleteFrom('asignacion_permiso')
      .where('id_rol', '=', idRol)
      .where('id_permiso', '=', idPermiso)
      .execute();
  }

  /**
   * Revoca TODOS los permisos de un rol individual (para reemplazo completo).
   */
  async revocarTodosLosPermisos(idRol: number): Promise<void> {
    await this.db
      .deleteFrom('asignacion_permiso')
      .where('id_rol', '=', idRol)
      .execute();
  }

  /**
   * Infiere el area funcional desde el prefijo del nombre del permiso.
   * Patron: 'area.accion' (e.g., 'catalogo.ver' -> 'catalogo').
   */
  private inferirArea(nombre: string): AreaFuncional {
    const prefijo = nombre.split('.')[0] as AreaFuncional;
    const areasValidas: AreaFuncional[] = ['catalogo', 'ventas', 'personal', 'seguridad', 'configuracion'];
    return areasValidas.includes(prefijo) ? prefijo : 'configuracion';
  }
}
