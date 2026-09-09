import { CatalogoPublicoRepository, FilaVariantePublica, FilaImagenPublica } from '../repositories/catalogo-publico.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import {
  CategoriaPublica,
  PaginaProductosPublicos,
  FichaProductoPublico,
  VariantePublica,
  ImagenDetalle,
  ProductoPublicoResumen,
} from '../interfaces/m01.interfaces';

const MAX_COMPLEMENTARIOS = 4;

// ==============================================================================
// M01 - SERVICIO DE CONSULTA PÚBLICA (HU-CAT-06)
// Expone el catálogo sin autenticación, mostrando solo elementos activos y
// publicados (RF-CAT-06-01, RF-CAT-09-02). El listado se pagina (RNF-CAT-06-01).
//
// FUERA DE ALCANCE (documentado):
// - Carta por familia cromática (RF-CAT-06-03): las familias se difirieron en HU-CAT-05.
// - Solo colores preparables sobre una base activa (RF-CAT-06-04): depende de la
//   asociación color↔base (HU-CAT-12 flujo 3), pendiente de RF-CAT-12-12.
// ==============================================================================

const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;

export class CatalogoPublicoService {
  constructor(private readonly repo: CatalogoPublicoRepository) {}

  async listarCategorias(): Promise<CategoriaPublica[]> {
    const filas = await this.repo.listarCategoriasConProductos();
    const porCategoria = new Map<number, CategoriaPublica>();
    for (const f of filas) {
      let categoria = porCategoria.get(f.id_categoria);
      if (!categoria) {
        categoria = { id_categoria: f.id_categoria, nombre: f.categoria_nombre, subcategorias: [] };
        porCategoria.set(f.id_categoria, categoria);
      }
      (categoria.subcategorias as { id_subcategoria: number; nombre: string }[]).push({
        id_subcategoria: f.id_subcategoria,
        nombre: f.subcategoria_nombre,
      });
    }
    return Array.from(porCategoria.values());
  }

  async listarProductos(opciones: {
    idSubcategoria?: number;
    busqueda?: string;
    pagina?: number;
    limite?: number;
  }): Promise<PaginaProductosPublicos> {
    const pagina = opciones.pagina && opciones.pagina > 0 ? Math.floor(opciones.pagina) : 1;
    const limite = Math.min(opciones.limite && opciones.limite > 0 ? Math.floor(opciones.limite) : LIMITE_POR_DEFECTO, LIMITE_MAXIMO);
    const offset = (pagina - 1) * limite;

    const filtros = {
      ...(opciones.idSubcategoria !== undefined ? { idSubcategoria: opciones.idSubcategoria } : {}),
      ...(opciones.busqueda ? { busqueda: opciones.busqueda } : {}),
      limite,
      offset,
    };

    const [productos, total] = await Promise.all([this.repo.listarProductos(filtros), this.repo.contarProductos(filtros)]);
    return {
      items: productos.map((p) => ({
        id_producto: p.id_producto,
        nombre: p.nombre,
        id_marca: p.id_marca,
        clase_color: p.clase_color,
      })),
      total,
      pagina,
      limite,
    };
  }

  async obtenerFicha(id: number): Promise<FichaProductoPublico> {
    const producto = await this.repo.obtenerProductoPublico(id);
    if (!producto) {
      throw new AppError('Producto no disponible', 404, 'PRODUCTO_NO_DISPONIBLE');
    }
    const [variantes, imagenes] = await Promise.all([
      this.repo.listarVariantesPublicas(id),
      this.repo.listarImagenesPublicas(id),
    ]);
    return {
      id_producto: producto.id_producto,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      id_marca: producto.id_marca,
      clase_color: producto.clase_color,
      rendimiento_min: producto.rendimiento_min === null ? null : Number(producto.rendimiento_min),
      rendimiento_max: producto.rendimiento_max === null ? null : Number(producto.rendimiento_max),
      variantes: variantes.map(aVariantePublica),
      imagenes: imagenes.map(aImagenDetalle),
    };
  }

  /**
   * RF-CAT-08-02/03: hasta 4 productos complementarios, patrocinados primero. Se
   * toman de la categoría configurada en el producto; si no hay categoría o no
   * arroja resultados, se cae a los productos patrocinados. Excluye el propio
   * producto (CA-CAT-08-04) y solo considera activos+publicados. Si no hay
   * ninguno, devuelve lista vacía (el front oculta la sección, CA-CAT-08-03).
   */
  async complementarios(idProducto: number): Promise<ProductoPublicoResumen[]> {
    const producto = await this.repo.obtenerProductoPublico(idProducto);
    if (!producto) {
      throw new AppError('Producto no disponible', 404, 'PRODUCTO_NO_DISPONIBLE');
    }

    let candidatos =
      producto.id_categoria_complementaria !== null
        ? await this.repo.complementariosPorCategoria(producto.id_categoria_complementaria, idProducto, MAX_COMPLEMENTARIOS)
        : [];

    if (candidatos.length === 0) {
      candidatos = await this.repo.patrocinados(idProducto, MAX_COMPLEMENTARIOS);
    }

    return candidatos.map((p) => ({
      id_producto: p.id_producto,
      nombre: p.nombre,
      id_marca: p.id_marca,
      clase_color: p.clase_color,
    }));
  }
}

function aVariantePublica(v: FilaVariantePublica): VariantePublica {
  return {
    id_variante: v.id_variante,
    id_presentacion: v.id_presentacion,
    presentacion: v.presentacion,
    volumen: Number(v.volumen),
    id_color: v.id_color,
    color: v.color,
    id_base: v.id_base,
    base: v.base,
    precio_vigente: Number(v.precio_vigente),
    existencia_referencial: v.existencia_referencial,
  };
}

function aImagenDetalle(i: FilaImagenPublica): ImagenDetalle {
  return {
    id_imagen: i.id_imagen,
    id_producto: i.id_producto,
    id_variante: i.id_variante,
    id_color: i.id_color,
    mime_type: i.mime_type,
    orden: i.orden,
    es_principal: i.es_principal,
    contenido_url: `/api/catalogo/imagenes/${i.id_imagen}/contenido`,
  };
}
