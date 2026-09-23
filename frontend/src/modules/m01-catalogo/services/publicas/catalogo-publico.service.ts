import { get } from '../http';
import type {
  CatalogoPublicoGateway,
  CategoriaPublica,
  ConsultaCatalogoPublico,
  FichaProductoPublico,
  PaginaProductosPublicos,
  ProductoDestacadoPublico,
  ProductoPublicoResumen,
} from '../../interfaces/publicas/catalogo-publico.interface';

const BASE = '/catalogo/publico';

/** Adaptador público: comparte el transporte HTTP del módulo, sin datos de respaldo. */
export const CatalogoPublicoService: CatalogoPublicoGateway = {
  listarCategorias() {
    return get<CategoriaPublica[]>(`${BASE}/categorias`);
  },
  listarProductos(params: ConsultaCatalogoPublico) {
    return get<PaginaProductosPublicos>(`${BASE}/productos`, params);
  },
  obtenerFicha(idProducto: number) {
    return get<FichaProductoPublico>(`${BASE}/productos/${idProducto}`);
  },
  listarComplementarios(idProducto: number) {
    return get<ProductoPublicoResumen[]>(`${BASE}/productos/${idProducto}/complementarios`);
  },
};

/** Una ficha fallida no descarta los demás resultados de la página recibida. */
export async function enriquecerProductosPublicos(
  resumenes: readonly ProductoPublicoResumen[],
  servicio: Pick<CatalogoPublicoGateway, 'obtenerFicha'>,
): Promise<ProductoDestacadoPublico[]> {
  return Promise.all(resumenes.map(async (producto) => {
    try {
      return { ...producto, detalle: await servicio.obtenerFicha(producto.id_producto) };
    } catch {
      return { ...producto, detalle: null };
    }
  }));
}
