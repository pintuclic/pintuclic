import { CatalogoPublicoRepository, FilaVariantePublica, FilaImagenPublica, FilaProductoResumenPublico } from '../repositories/catalogo-publico.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import {
  CategoriaPublica,
  PaginaProductosPublicos,
  FichaProductoPublico,
  VariantePublica,
  ImagenDetalle,
  ProductoPublicoResumen,
  PaginaColoresProductoPublico,
  ColorProductoPublico,
} from '../interfaces/m01.interfaces';
import { cielabAHex, clasificarFamiliaCromatica } from './colores.service';

const MAX_COMPLEMENTARIOS = 4;

// ==============================================================================
// M01 - SERVICIO DE CONSULTA PÚBLICA (HU-CAT-06)
// Expone el catálogo sin autenticación, mostrando solo elementos activos y
// publicados (RF-CAT-06-01, RF-CAT-09-02). El listado se pagina (RNF-CAT-06-01).
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
      items: productos.map(aProductoPublicoResumen),
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
   * RF-CAT-06-03: Endpoint paginado para colores. Filtro opcional por familia y búsqueda.
   */
  async obtenerColoresPaginados(idProducto: number, opciones: { q?: string; familia?: string; pagina?: number; limite?: number }): Promise<PaginaColoresProductoPublico> {
    const producto = await this.repo.obtenerProductoPublico(idProducto);
    if (!producto) {
      throw new AppError('Producto no disponible', 404, 'PRODUCTO_NO_DISPONIBLE');
    }

    const pagina = opciones.pagina && opciones.pagina > 0 ? Math.floor(opciones.pagina) : 1;
    const limite = Math.min(opciones.limite && opciones.limite > 0 ? Math.floor(opciones.limite) : 100, 500);

    const filas = await this.repo.listarColoresActivosDeProducto(idProducto, producto.id_marca, producto.clase_color);

    let colores: ColorProductoPublico[] = filas.map((c) => {
      const l = Number(c.cie_l);
      const a = Number(c.cie_a);
      const b = Number(c.cie_b);
      return {
        id_color: c.id_color,
        nombre: c.nombre,
        codigo_color: c.codigo ?? null,
        muestra_hex: cielabAHex(l, a, b),
        familia_color: clasificarFamiliaCromatica(l, a, b),
      };
    });

    if (opciones.q) {
      const qLower = opciones.q.toLowerCase();
      colores = colores.filter((c) => c.nombre.toLowerCase().includes(qLower) || c.codigo_color?.toLowerCase().includes(qLower));
    }
    if (opciones.familia) {
      const famLower = opciones.familia.toLowerCase();
      colores = colores.filter((c) => c.familia_color.toLowerCase() === famLower);
    }

    colores.sort((a, b) => a.nombre.localeCompare(b.nombre));

    const total = colores.length;
    const items = colores.slice((pagina - 1) * limite, pagina * limite);

    return {
      items,
      total,
      pagina,
      limite,
    };
  }

  /**
   * RF-CAT-08-02/03: hasta 4 productos complementarios, patrocinados primero.
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

    if (candidatos.length === 0) return [];

    const idsCandidatos = candidatos.map((c) => c.id_producto);
    const paginados = await this.repo.listarProductos({ ids: idsCandidatos, limite: MAX_COMPLEMENTARIOS, offset: 0 });

    const map = new Map(paginados.map((p) => [p.id_producto, p]));
    return candidatos
      .map((c) => map.get(c.id_producto))
      .filter((p): p is FilaProductoResumenPublico => p !== undefined)
      .map(aProductoPublicoResumen);
  }
}

function aProductoPublicoResumen(p: FilaProductoResumenPublico): ProductoPublicoResumen {
  return {
    id_producto: p.id_producto,
    nombre: p.nombre,
    id_marca: p.id_marca,
    marca: p.marca,
    clase_color: p.clase_color,
    precio_desde: p.precio_desde === null ? null : Number(p.precio_desde),
    imagen_principal_url: p.id_imagen_principal ? `/api/catalogo/imagenes/${p.id_imagen_principal}/contenido` : null,
    cantidad_colores: Number(p.cantidad_colores),
    patrocinado: p.patrocinado,
  };
}

function aVariantePublica(v: FilaVariantePublica): VariantePublica {
  let hex: string | null = null;
  let familia: string | null = null;

  if (v.id_color !== null && v.cie_l !== null && v.cie_l !== undefined) {
    const l = Number(v.cie_l);
    const a = Number(v.cie_a);
    const b = Number(v.cie_b);
    hex = cielabAHex(l, a, b);
    familia = clasificarFamiliaCromatica(l, a, b);
  }

  return {
    id_variante: v.id_variante,
    id_presentacion: v.id_presentacion,
    presentacion: v.presentacion,
    volumen: Number(v.volumen),
    id_color: v.id_color,
    color: v.color,
    codigo_color: v.codigo_color ?? null,
    muestra_hex: hex,
    familia_color: familia,
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
