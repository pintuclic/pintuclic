import { Kysely } from 'kysely';
import { Database, Imagen, NewImagen, ImagenUpdate } from '../../../core/db/types';

// ==============================================================================
// M01 - REPOSITORIO DE IMÁGENES
// Único punto de acceso SQL (Kysely) para la tabla `imagen`.
// ==============================================================================

/** Metadatos de imagen sin el binario (para listados). */
export type ImagenMetadatos = Omit<Imagen, 'datos'>;

const COLUMNAS_META = [
  'id_imagen',
  'id_producto',
  'id_variante',
  'id_color',
  'mime_type',
  'orden',
  'es_principal',
] as const;

export class ImagenesRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async crear(data: NewImagen): Promise<ImagenMetadatos> {
    return this.db.insertInto('imagen').values(data).returning(COLUMNAS_META).executeTakeFirstOrThrow();
  }

  /** RF-CAT-07-01: imágenes del producto, ordenadas; sin el binario. */
  async listarPorProducto(idProducto: number): Promise<ImagenMetadatos[]> {
    return this.db
      .selectFrom('imagen')
      .select(COLUMNAS_META)
      .where('id_producto', '=', idProducto)
      .orderBy('orden', 'asc')
      .orderBy('id_imagen', 'asc')
      .execute();
  }

  async obtenerMetadatos(id: number): Promise<ImagenMetadatos | undefined> {
    return this.db.selectFrom('imagen').select(COLUMNAS_META).where('id_imagen', '=', id).executeTakeFirst();
  }

  /** Binario para el endpoint dedicado de servir la imagen. */
  async obtenerContenido(id: number): Promise<{ datos: Buffer; mime_type: string } | undefined> {
    return this.db
      .selectFrom('imagen')
      .select(['datos', 'mime_type'])
      .where('id_imagen', '=', id)
      .executeTakeFirst();
  }

  async actualizar(id: number, data: ImagenUpdate): Promise<ImagenMetadatos | undefined> {
    return this.db.updateTable('imagen').set(data).where('id_imagen', '=', id).returning(COLUMNAS_META).executeTakeFirst();
  }

  async eliminar(id: number): Promise<void> {
    await this.db.deleteFrom('imagen').where('id_imagen', '=', id).execute();
  }

  /** Desmarca la principal actual del producto (para poder fijar otra). CA-CAT-07-02. */
  async desmarcarPrincipal(idProducto: number, excluirId?: number): Promise<void> {
    let query = this.db.updateTable('imagen').set({ es_principal: false }).where('id_producto', '=', idProducto).where('es_principal', '=', true);
    if (excluirId !== undefined) {
      query = query.where('id_imagen', '!=', excluirId);
    }
    await query.execute();
  }
}
