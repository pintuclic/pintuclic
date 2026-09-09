import { CategoriasService } from '../services/categorias.service';
import { SubcategoriasService } from '../services/subcategorias.service';
import { LineasService } from '../services/lineas.service';
import { MarcasService } from '../services/marcas.service';
import { BasesService } from '../services/bases.service';
import { ColoresService, cielabAHex } from '../services/colores.service';
import { TipoResinasService } from '../services/resinas.service';
import { ProductosService } from '../services/productos.service';
import { PresentacionesService } from '../services/presentaciones.service';
import { VariantesService } from '../services/variantes.service';
import { CrearCategoriaDto } from '../dtos/categorias.dto';
import { CrearMarcaDto } from '../dtos/marcas.dto';
import { CrearColorDto } from '../dtos/colores.dto';
import { CrearProductoDto } from '../dtos/productos.dto';
import { CrearVarianteDto } from '../dtos/variantes.dto';
import { MarcaResumen } from '../interfaces/m01.interfaces';
import {
  Categoria,
  Subcategoria,
  NewCategoria,
  CategoriaUpdate,
  NewSubcategoria,
  SubcategoriaUpdate,
  Linea,
  NewLinea,
  LineaUpdate,
  Base,
  NewBase,
  BaseUpdate,
  Color,
  NewColor,
  ColorUpdate,
  TipoResina,
  NewTipoResina,
  TipoResinaUpdate,
  Producto,
  NewProducto,
  ProductoUpdate,
  Presentacion,
  NewPresentacion,
  PresentacionUpdate,
  Variante,
  NewVariante,
  VarianteUpdate,
} from '../../../core/db/types';

// ==============================================================================
// M01 - SUITE DE VALIDACIÓN DE CRITERIOS DE ACEPTACIÓN (HU-CAT-01)
// Repositorios mockeados en memoria para probar la lógica de servicio sin BD real.
// ==============================================================================

async function ejecutarPruebasM01(): Promise<void> {
  console.log('🚀 Iniciando suite de validación técnica de M01: Catálogo (HU-CAT-01)...\n');

  let superadas = 0;
  let fallidas = 0;

  function assert(condicion: boolean, descripcion: string): void {
    if (condicion) {
      console.log(`  ✅ [PASS] ${descripcion}`);
      superadas++;
    } else {
      console.error(`  ❌ [FAIL] ${descripcion}`);
      fallidas++;
    }
  }

  async function assertLanza(fn: () => Promise<unknown>, descripcion: string): Promise<void> {
    try {
      await fn();
      assert(false, descripcion);
    } catch {
      assert(true, descripcion);
    }
  }

  // ----------------------------------------------------------------------------
  // Estado en memoria
  // ----------------------------------------------------------------------------
  const categorias: Map<number, Categoria> = new Map();
  const subcategorias: Map<number, Subcategoria> = new Map();
  const productosAfectadosPorSubcategoria: Map<number, number> = new Map();
  let seqCategoria = 1;
  let seqSubcategoria = 1;

  const mockCategoriasRepo = {
    crear: async (data: NewCategoria): Promise<Categoria> => {
      const categoria: Categoria = {
        id_categoria: seqCategoria++,
        nombre: data.nombre,
        orden: data.orden ?? 0,
        estado: 'activo',
      };
      categorias.set(categoria.id_categoria, categoria);
      return categoria;
    },
    listar: async (): Promise<Categoria[]> => Array.from(categorias.values()),
    obtenerPorId: async (id: number) => categorias.get(id),
    obtenerPorNombre: async (nombre: string, excluirId?: number) =>
      Array.from(categorias.values()).find((c) => c.nombre === nombre && c.id_categoria !== excluirId),
    actualizar: async (id: number, data: CategoriaUpdate) => {
      const actual = categorias.get(id);
      if (!actual) return undefined;
      const actualizada = { ...actual, ...data } as Categoria;
      categorias.set(id, actualizada);
      return actualizada;
    },
    cambiarEstado: async (id: number, estado: 'activo' | 'inactivo') => {
      const c = categorias.get(id);
      if (c) categorias.set(id, { ...c, estado });
    },
    contarSubcategoriasActivas: async (idCategoria: number) =>
      Array.from(subcategorias.values()).filter((s) => s.id_categoria === idCategoria && s.estado === 'activo').length,
    contarProductosAfectados: async (idCategoria: number) => {
      const hijas = Array.from(subcategorias.values()).filter((s) => s.id_categoria === idCategoria);
      return hijas.reduce((acc, s) => acc + (productosAfectadosPorSubcategoria.get(s.id_subcategoria) ?? 0), 0);
    },
    desactivarSubcategoriasDe: async (idCategoria: number) => {
      for (const s of subcategorias.values()) {
        if (s.id_categoria === idCategoria) subcategorias.set(s.id_subcategoria, { ...s, estado: 'inactivo' });
      }
    },
  };

  const mockSubcategoriasRepo = {
    crear: async (data: NewSubcategoria): Promise<Subcategoria> => {
      const subcategoria: Subcategoria = {
        id_subcategoria: seqSubcategoria++,
        id_categoria: data.id_categoria,
        nombre: data.nombre,
        orden: data.orden ?? 0,
        estado: 'activo',
      };
      subcategorias.set(subcategoria.id_subcategoria, subcategoria);
      return subcategoria;
    },
    listarPorCategoria: async (idCategoria: number) =>
      Array.from(subcategorias.values()).filter((s) => s.id_categoria === idCategoria),
    obtenerPorId: async (id: number) => subcategorias.get(id),
    obtenerPorNombreYCategoria: async (nombre: string, idCategoria: number, excluirId?: number) =>
      Array.from(subcategorias.values()).find(
        (s) => s.nombre === nombre && s.id_categoria === idCategoria && s.id_subcategoria !== excluirId
      ),
    actualizar: async (id: number, data: SubcategoriaUpdate) => {
      const actual = subcategorias.get(id);
      if (!actual) return undefined;
      const actualizada = { ...actual, ...data } as Subcategoria;
      subcategorias.set(id, actualizada);
      return actualizada;
    },
    cambiarEstado: async (id: number, estado: 'activo' | 'inactivo') => {
      const s = subcategorias.get(id);
      if (s) subcategorias.set(id, { ...s, estado });
    },
    contarProductosAfectados: async (idSubcategoria: number) => productosAfectadosPorSubcategoria.get(idSubcategoria) ?? 0,
  };

  // ----------------------------------------------------------------------------
  // Estado en memoria: marcas y líneas (HU-CAT-11)
  // ----------------------------------------------------------------------------
  const marcas: Map<number, MarcaResumen> = new Map();
  const lineas: Map<number, Linea> = new Map();
  const productosAfectadosPorLinea: Map<number, number> = new Map();
  let seqMarca = 1;
  let seqLinea = 1;

  function crearMarcaDirecto(nombre: string): MarcaResumen {
    const marca: MarcaResumen = { id_marca: seqMarca++, nombre, logotipo_mime_type: 'image/png', estado: 'activo' };
    marcas.set(marca.id_marca, marca);
    return marca;
  }

  const mockMarcasRepo = {
    crear: async (data: { nombre: string; logotipo: Buffer; logotipo_mime_type: string }): Promise<MarcaResumen> => {
      const marca: MarcaResumen = {
        id_marca: seqMarca++,
        nombre: data.nombre,
        logotipo_mime_type: data.logotipo_mime_type,
        estado: 'activo',
      };
      marcas.set(marca.id_marca, marca);
      return marca;
    },
    listar: async () => Array.from(marcas.values()),
    obtenerPorId: async (id: number) => marcas.get(id),
    obtenerPorNombre: async (nombre: string, excluirId?: number) =>
      Array.from(marcas.values()).find((m) => m.nombre === nombre && m.id_marca !== excluirId),
    obtenerLogotipo: async (id: number) =>
      marcas.has(id) ? { logotipo: Buffer.from('fake'), logotipo_mime_type: marcas.get(id)!.logotipo_mime_type } : undefined,
    actualizar: async (id: number, data: { nombre?: string; logotipo_mime_type?: string }) => {
      const actual = marcas.get(id);
      if (!actual) return undefined;
      const actualizada: MarcaResumen = {
        ...actual,
        nombre: data.nombre ?? actual.nombre,
        logotipo_mime_type: data.logotipo_mime_type ?? actual.logotipo_mime_type,
      };
      marcas.set(id, actualizada);
      return actualizada;
    },
    cambiarEstado: async (id: number, estado: 'activo' | 'inactivo') => {
      const m = marcas.get(id);
      if (m) marcas.set(id, { ...m, estado });
    },
  };

  const mockLineasRepo = {
    crear: async (data: NewLinea): Promise<Linea> => {
      const linea: Linea = {
        id_linea: seqLinea++,
        id_marca: data.id_marca,
        id_sub_subcategoria: data.id_sub_subcategoria ?? null,
        nombre: data.nombre,
        gama_comercial: data.gama_comercial ?? null,
        estado: 'activo',
      };
      lineas.set(linea.id_linea, linea);
      return linea;
    },
    listarPorMarca: async (idMarca: number) => Array.from(lineas.values()).filter((l) => l.id_marca === idMarca),
    obtenerPorId: async (id: number) => lineas.get(id),
    obtenerPorNombreYMarca: async (nombre: string, idMarca: number, excluirId?: number) =>
      Array.from(lineas.values()).find((l) => l.nombre === nombre && l.id_marca === idMarca && l.id_linea !== excluirId),
    actualizar: async (id: number, data: LineaUpdate) => {
      const actual = lineas.get(id);
      if (!actual) return undefined;
      const actualizada = { ...actual, ...data } as Linea;
      lineas.set(id, actualizada);
      return actualizada;
    },
    cambiarEstado: async (id: number, estado: 'activo' | 'inactivo') => {
      const l = lineas.get(id);
      if (l) lineas.set(id, { ...l, estado });
    },
    contarProductosAfectados: async (idLinea: number) => productosAfectadosPorLinea.get(idLinea) ?? 0,
    desactivarLineasDeMarca: async (idMarca: number) => {
      for (const l of lineas.values()) {
        if (l.id_marca === idMarca) lineas.set(l.id_linea, { ...l, estado: 'inactivo' });
      }
    },
  };

  // ----------------------------------------------------------------------------
  // Estado en memoria: bases (HU-CAT-12)
  // ----------------------------------------------------------------------------
  const bases: Map<number, Base> = new Map();
  let seqBase = 1;

  const mockBasesRepo = {
    crear: async (data: NewBase): Promise<Base> => {
      const base: Base = { id_base: seqBase++, id_marca: data.id_marca, nombre: data.nombre, estado: 'activo' };
      bases.set(base.id_base, base);
      return base;
    },
    listarPorMarca: async (idMarca: number) => Array.from(bases.values()).filter((b) => b.id_marca === idMarca),
    obtenerPorId: async (id: number) => bases.get(id),
    obtenerPorNombreYMarca: async (nombre: string, idMarca: number, excluirId?: number) =>
      Array.from(bases.values()).find((b) => b.nombre === nombre && b.id_marca === idMarca && b.id_base !== excluirId),
    actualizar: async (id: number, data: BaseUpdate) => {
      const actual = bases.get(id);
      if (!actual) return undefined;
      const actualizada = { ...actual, ...data } as Base;
      bases.set(id, actualizada);
      return actualizada;
    },
    cambiarEstado: async (id: number, estado: 'activo' | 'inactivo') => {
      const b = bases.get(id);
      if (b) bases.set(id, { ...b, estado });
    },
    desactivarBasesDeMarca: async (idMarca: number) => {
      for (const b of bases.values()) {
        if (b.id_marca === idMarca) bases.set(b.id_base, { ...b, estado: 'inactivo' });
      }
    },
  };

  // ----------------------------------------------------------------------------
  // Estado en memoria: colores (HU-CAT-05)
  // ----------------------------------------------------------------------------
  const colores: Map<number, Color> = new Map();
  let seqColor = 1;

  const mockColoresRepo = {
    crear: async (data: NewColor): Promise<Color> => {
      const color: Color = {
        id_color: seqColor++,
        id_marca: data.id_marca,
        nombre: data.nombre,
        codigo: data.codigo ?? null,
        cie_l: String(data.cie_l),
        cie_a: String(data.cie_a),
        cie_b: String(data.cie_b),
        estado: 'activo',
      };
      colores.set(color.id_color, color);
      return color;
    },
    listarPorMarca: async (idMarca: number, busqueda?: string): Promise<Color[]> =>
      Array.from(colores.values()).filter(
        (c) =>
          c.id_marca === idMarca &&
          (!busqueda ||
            c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
            (c.codigo ?? '').toLowerCase().includes(busqueda.toLowerCase()))
      ),
    obtenerPorId: async (id: number) => colores.get(id),
    obtenerPorNombreYMarca: async (nombre: string, idMarca: number, excluirId?: number) =>
      Array.from(colores.values()).find(
        (c) => c.nombre === nombre && c.id_marca === idMarca && c.id_color !== excluirId
      ),
    actualizar: async (id: number, data: ColorUpdate) => {
      const actual = colores.get(id);
      if (!actual) return undefined;
      const actualizado = {
        ...actual,
        ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
        ...(data.codigo !== undefined ? { codigo: data.codigo } : {}),
        ...(data.cie_l !== undefined ? { cie_l: String(data.cie_l) } : {}),
        ...(data.cie_a !== undefined ? { cie_a: String(data.cie_a) } : {}),
        ...(data.cie_b !== undefined ? { cie_b: String(data.cie_b) } : {}),
      } as Color;
      colores.set(id, actualizado);
      return actualizado;
    },
    cambiarEstado: async (id: number, estado: 'activo' | 'inactivo') => {
      const c = colores.get(id);
      if (c) colores.set(id, { ...c, estado });
    },
    desactivarColoresDeMarca: async (idMarca: number) => {
      for (const c of colores.values()) {
        if (c.id_marca === idMarca) colores.set(c.id_color, { ...c, estado: 'inactivo' });
      }
    },
  };

  // ----------------------------------------------------------------------------
  // Estado en memoria: tipos de resina y productos (HU-CAT-02)
  // ----------------------------------------------------------------------------
  const resinas: Map<number, TipoResina> = new Map();
  let seqResina = 1;

  const mockResinasRepo = {
    crear: async (data: NewTipoResina): Promise<TipoResina> => {
      const resina: TipoResina = { id_tipo_resina: seqResina++, nombre: data.nombre, estado: 'activo' };
      resinas.set(resina.id_tipo_resina, resina);
      return resina;
    },
    listar: async () => Array.from(resinas.values()),
    obtenerPorId: async (id: number) => resinas.get(id),
    obtenerPorNombre: async (nombre: string, excluirId?: number) =>
      Array.from(resinas.values()).find((r) => r.nombre === nombre && r.id_tipo_resina !== excluirId),
    actualizar: async (id: number, data: TipoResinaUpdate) => {
      const actual = resinas.get(id);
      if (!actual) return undefined;
      const actualizada = { ...actual, ...data } as TipoResina;
      resinas.set(id, actualizada);
      return actualizada;
    },
    cambiarEstado: async (id: number, estado: 'activo' | 'inactivo') => {
      const r = resinas.get(id);
      if (r) resinas.set(id, { ...r, estado });
    },
  };

  const productos: Map<number, Producto> = new Map();
  const productoSubcats: Map<number, number[]> = new Map();
  const varianteStats: Map<number, { total: number; activas: number }> = new Map();
  let seqProducto = 1;

  const mockProductosRepo = {
    crear: async (data: NewProducto, idSubcategorias: number[]): Promise<Producto> => {
      const producto: Producto = {
        id_producto: seqProducto++,
        id_marca: data.id_marca,
        id_linea: data.id_linea ?? null,
        id_tipo_resina: data.id_tipo_resina ?? null,
        nombre: data.nombre,
        descripcion: data.descripcion ?? null,
        clase_color: data.clase_color,
        estado: 'activo',
        publicado: false,
      };
      productos.set(producto.id_producto, producto);
      productoSubcats.set(producto.id_producto, [...idSubcategorias]);
      return producto;
    },
    listar: async (filtros?: { busqueda?: string; idMarca?: number }) =>
      Array.from(productos.values()).filter(
        (p) =>
          (filtros?.idMarca === undefined || p.id_marca === filtros.idMarca) &&
          (!filtros?.busqueda || p.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase()))
      ),
    obtenerPorId: async (id: number) => productos.get(id),
    listarSubcategorias: async (id: number) => productoSubcats.get(id) ?? [],
    actualizar: async (id: number, data: ProductoUpdate, idSubcategorias?: number[]) => {
      const actual = productos.get(id);
      if (!actual) return undefined;
      const actualizado = { ...actual, ...data } as Producto;
      productos.set(id, actualizado);
      if (idSubcategorias !== undefined) productoSubcats.set(id, [...idSubcategorias]);
      return actualizado;
    },
    cambiarEstado: async (id: number, estado: 'activo' | 'inactivo') => {
      const p = productos.get(id);
      if (p) productos.set(id, { ...p, estado });
    },
    cambiarPublicado: async (id: number, publicado: boolean) => {
      const p = productos.get(id);
      if (p) productos.set(id, { ...p, publicado });
    },
    contarVariantes: async (id: number) => varianteStats.get(id)?.total ?? 0,
    contarVariantesActivas: async (id: number) => varianteStats.get(id)?.activas ?? 0,
  };

  // ----------------------------------------------------------------------------
  // Estado en memoria: presentaciones y variantes (HU-CAT-03)
  // ----------------------------------------------------------------------------
  const presentaciones: Map<number, Presentacion> = new Map();
  let seqPresentacion = 1;

  const mockPresentacionesRepo = {
    crear: async (data: NewPresentacion): Promise<Presentacion> => {
      const p: Presentacion = { id_presentacion: seqPresentacion++, nombre: data.nombre, volumen: String(data.volumen), estado: 'activo' };
      presentaciones.set(p.id_presentacion, p);
      return p;
    },
    listar: async () => Array.from(presentaciones.values()),
    obtenerPorId: async (id: number) => presentaciones.get(id),
    obtenerPorNombre: async (nombre: string, excluirId?: number) =>
      Array.from(presentaciones.values()).find((p) => p.nombre === nombre && p.id_presentacion !== excluirId),
    actualizar: async (id: number, data: PresentacionUpdate) => {
      const actual = presentaciones.get(id);
      if (!actual) return undefined;
      const actualizada = {
        ...actual,
        ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
        ...(data.volumen !== undefined ? { volumen: String(data.volumen) } : {}),
      } as Presentacion;
      presentaciones.set(id, actualizada);
      return actualizada;
    },
    cambiarEstado: async (id: number, estado: 'activo' | 'inactivo') => {
      const p = presentaciones.get(id);
      if (p) presentaciones.set(id, { ...p, estado });
    },
  };

  const variantes: Map<number, Variante> = new Map();
  let seqVariante = 1;

  const mockVariantesRepo = {
    crear: async (data: NewVariante): Promise<Variante> => {
      const v: Variante = {
        id_variante: seqVariante++,
        id_producto: data.id_producto,
        id_presentacion: data.id_presentacion,
        id_color: data.id_color ?? null,
        id_base: data.id_base ?? null,
        precio_vigente: String(data.precio_vigente),
        existencia_referencial: typeof data.existencia_referencial === 'number' ? data.existencia_referencial : 0,
        codigo_proveedor: data.codigo_proveedor ?? null,
        estado: 'activo',
      };
      variantes.set(v.id_variante, v);
      return v;
    },
    listarPorProducto: async (idProducto: number) =>
      Array.from(variantes.values()).filter((v) => v.id_producto === idProducto),
    obtenerPorId: async (id: number) => variantes.get(id),
    obtenerPorCodigoProveedor: async (codigo: string, excluirId?: number) =>
      Array.from(variantes.values()).find((v) => v.codigo_proveedor === codigo && v.id_variante !== excluirId),
    existeForma: async (
      idProducto: number,
      idBase: number | null,
      idColor: number | null,
      idPresentacion: number,
      excluirId?: number
    ) =>
      Array.from(variantes.values()).some(
        (v) =>
          v.id_producto === idProducto &&
          v.id_presentacion === idPresentacion &&
          v.id_base === idBase &&
          v.id_color === idColor &&
          v.id_variante !== excluirId
      ),
    actualizar: async (id: number, data: VarianteUpdate) => {
      const actual = variantes.get(id);
      if (!actual) return undefined;
      const actualizada = {
        ...actual,
        ...(data.id_presentacion !== undefined ? { id_presentacion: data.id_presentacion } : {}),
        ...(data.precio_vigente !== undefined ? { precio_vigente: String(data.precio_vigente) } : {}),
        ...(data.existencia_referencial !== undefined ? { existencia_referencial: data.existencia_referencial as number } : {}),
        ...(data.id_base !== undefined ? { id_base: data.id_base } : {}),
        ...(data.id_color !== undefined ? { id_color: data.id_color } : {}),
        ...(data.codigo_proveedor !== undefined ? { codigo_proveedor: data.codigo_proveedor } : {}),
      } as Variante;
      variantes.set(id, actualizada);
      return actualizada;
    },
    cambiarEstado: async (id: number, estado: 'activo' | 'inactivo') => {
      const v = variantes.get(id);
      if (v) variantes.set(id, { ...v, estado });
    },
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoriasService = new CategoriasService(mockCategoriasRepo as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subcategoriasService = new SubcategoriasService(mockSubcategoriasRepo as any, mockCategoriasRepo as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineasService = new LineasService(mockLineasRepo as any, mockMarcasRepo as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const marcasService = new MarcasService(mockMarcasRepo as any, mockLineasRepo as any, mockBasesRepo as any, mockColoresRepo as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const basesService = new BasesService(mockBasesRepo as any, mockMarcasRepo as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coloresService = new ColoresService(mockColoresRepo as any, mockMarcasRepo as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resinasService = new TipoResinasService(mockResinasRepo as any);
  const productosService = new ProductosService(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockProductosRepo as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockMarcasRepo as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockLineasRepo as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockResinasRepo as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockSubcategoriasRepo as any
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const presentacionesService = new PresentacionesService(mockPresentacionesRepo as any);
  const variantesService = new VariantesService(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockVariantesRepo as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockProductosRepo as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockPresentacionesRepo as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockBasesRepo as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockColoresRepo as any
  );

  try {
    // --------------------------------------------------------------------------
    // CA-CAT-01-01 / CA-CAT-01-02: creación de categoría
    // --------------------------------------------------------------------------
    const pinturas = await categoriasService.crear({ nombre: 'Pinturas' });
    assert(pinturas.id_categoria > 0 && pinturas.estado === 'activo', 'CA-CAT-01-01: categoría creada activa');

    const nombreLargoRechazado = !CrearCategoriaDto.safeParse({ nombre: 'x'.repeat(101) }).success;
    assert(nombreLargoRechazado, 'RF-CAT-01-01: el DTO Zod rechaza nombres de más de 100 caracteres');

    // --------------------------------------------------------------------------
    // CA-CAT-01-03: unicidad de categoría raíz
    // --------------------------------------------------------------------------
    await assertLanza(
      () => categoriasService.crear({ nombre: 'Pinturas' }),
      'CA-CAT-01-03: rechaza categoría raíz duplicada'
    );

    const esmaltes = await categoriasService.crear({ nombre: 'Esmaltes' });
    assert(esmaltes.id_categoria !== pinturas.id_categoria, 'CA-CAT-01-03: admite nombres distintos entre categorías');

    // --------------------------------------------------------------------------
    // CA-CAT-01-01 / CA-CAT-01-03: subcategorías
    // --------------------------------------------------------------------------
    const interiores = await subcategoriasService.crear({ nombre: 'Interior', id_categoria: pinturas.id_categoria });
    assert(interiores.id_categoria === pinturas.id_categoria, 'CA-CAT-01-01: subcategoría queda bajo su categoría padre');

    await assertLanza(
      () => subcategoriasService.crear({ nombre: 'Interior', id_categoria: pinturas.id_categoria }),
      'CA-CAT-01-03: rechaza subcategoría duplicada bajo el mismo padre'
    );

    const interioresEsmaltes = await subcategoriasService.crear({ nombre: 'Interior', id_categoria: esmaltes.id_categoria });
    assert(
      interioresEsmaltes.id_subcategoria !== interiores.id_subcategoria,
      'CA-CAT-01-03: admite el mismo nombre bajo un padre distinto'
    );

    await assertLanza(
      () => subcategoriasService.crear({ nombre: 'Fantasma', id_categoria: 9999 }),
      'RF-CAT-01-02: rechaza subcategoría bajo una categoría padre inexistente'
    );

    // --------------------------------------------------------------------------
    // RF-CAT-01-04 / CA-CAT-01-05: desactivación de categoría con advertencia previa
    // --------------------------------------------------------------------------
    productosAfectadosPorSubcategoria.set(interiores.id_subcategoria, 7);

    const impacto = await categoriasService.solicitarDesactivacion(pinturas.id_categoria, false);
    assert(
      'requiere_confirmacion' in impacto && impacto.productos_afectados === 7 && impacto.subcategorias_afectadas === 1,
      'CA-CAT-01-05: informa productos y subcategorías afectados antes de confirmar'
    );

    const categoriaTrasImpacto = await categoriasService.obtenerPorId(pinturas.id_categoria);
    assert(categoriaTrasImpacto.estado === 'activo', 'CA-CAT-01-05: no desactiva sin confirmación');

    const desactivacion = await categoriasService.solicitarDesactivacion(pinturas.id_categoria, true);
    assert('desactivado' in desactivacion, 'RF-CAT-01-04: confirma y desactiva la categoría');

    const categoriaDesactivada = await categoriasService.obtenerPorId(pinturas.id_categoria);
    assert(categoriaDesactivada.estado === 'inactivo', 'RF-CAT-01-04: la categoría queda inactiva');

    const subcategoriaEnCascada = await subcategoriasService.obtenerPorId(interiores.id_subcategoria);
    assert(subcategoriaEnCascada.estado === 'inactivo', 'RF-CAT-01-04: desactiva en cascada sus subcategorías');

    // --------------------------------------------------------------------------
    // CA-CAT-01-06: otra subcategoría de otro padre sigue activa
    // --------------------------------------------------------------------------
    const subcategoriaHermana = await subcategoriasService.obtenerPorId(interioresEsmaltes.id_subcategoria);
    assert(subcategoriaHermana.estado === 'activo', 'CA-CAT-01-06: subcategorías de otras categorías no se ven afectadas');

    // --------------------------------------------------------------------------
    // RF-CAT-09-04: no se puede reactivar una subcategoría con la categoría padre inactiva
    // --------------------------------------------------------------------------
    await assertLanza(
      () => subcategoriasService.reactivar(interiores.id_subcategoria),
      'RF-CAT-09-04: rechaza reactivar subcategoría con categoría padre inactiva'
    );

    const reactivacionCategoria = await categoriasService.reactivar(pinturas.id_categoria);
    assert('reactivado' in reactivacionCategoria, 'La categoría se reactiva correctamente');

    const reactivacionSubcategoria = await subcategoriasService.reactivar(interiores.id_subcategoria);
    assert(
      'reactivado' in reactivacionSubcategoria,
      'RF-CAT-09-04: reactiva la subcategoría una vez su categoría padre está activa'
    );

    // --------------------------------------------------------------------------
    // HU-CAT-11: Gestión de líneas
    // --------------------------------------------------------------------------
    const pintuco = crearMarcaDirecto('Pintuco');
    const interpinturas = crearMarcaDirecto('Interpinturas');

    await assertLanza(
      () => lineasService.crear({ nombre: 'Viniltex', id_marca: 9999 }),
      'RF-CAT-11-01: rechaza línea con marca inexistente'
    );

    const viniltex = await lineasService.crear({ nombre: 'Viniltex', id_marca: pintuco.id_marca });
    assert(
      viniltex.id_marca === pintuco.id_marca && viniltex.estado === 'activo',
      'CA-CAT-11-01: línea creada activa y asociada a su marca'
    );

    await assertLanza(
      () => lineasService.crear({ nombre: 'Viniltex', id_marca: pintuco.id_marca }),
      'CA-CAT-11-03: rechaza línea duplicada dentro de la misma marca'
    );

    const viniltexOtraMarca = await lineasService.crear({ nombre: 'Viniltex', id_marca: interpinturas.id_marca });
    assert(
      viniltexOtraMarca.id_linea !== viniltex.id_linea,
      'CA-CAT-11-03: admite el mismo nombre de línea en una marca distinta'
    );

    await assertLanza(
      () => lineasService.actualizar(99999, { nombre: 'x' }),
      'Rechaza actualizar una línea con un id inexistente'
    );

    productosAfectadosPorLinea.set(viniltex.id_linea, 4);
    const impactoLinea = await lineasService.solicitarDesactivacion(viniltex.id_linea, false);
    assert(
      'requiere_confirmacion' in impactoLinea && impactoLinea.productos_afectados === 4 && impactoLinea.reglas_afectadas === 0,
      'RF-CAT-11-03: informa productos y reglas M06 afectadas antes de confirmar (M06 aún no existe, reporta 0)'
    );

    const lineaTrasImpacto = await lineasService.obtenerPorId(viniltex.id_linea);
    assert(lineaTrasImpacto.estado === 'activo', 'No desactiva la línea sin confirmación');

    const desactivacionLinea = await lineasService.solicitarDesactivacion(viniltex.id_linea, true);
    assert('desactivado' in desactivacionLinea, 'RF-CAT-11-03: confirma y desactiva la línea');

    marcas.set(pintuco.id_marca, { ...pintuco, estado: 'inactivo' });
    await assertLanza(
      () => lineasService.reactivar(viniltex.id_linea),
      'RF-CAT-09-04: rechaza reactivar línea con marca inactiva'
    );

    marcas.set(pintuco.id_marca, { ...pintuco, estado: 'activo' });
    const reactivacionLinea = await lineasService.reactivar(viniltex.id_linea);
    assert('reactivado' in reactivacionLinea, 'RF-CAT-09-04: reactiva la línea una vez su marca está activa');

    // --------------------------------------------------------------------------
    // HU-CAT-04: Gestión de marcas
    // --------------------------------------------------------------------------
    const LOGO_PNG_1X1 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

    const nombreLogoInvalidoRechazado = !CrearMarcaDto.safeParse({ nombre: 'Sika', logotipo: 'no-es-una-data-url' }).success;
    assert(nombreLogoInvalidoRechazado, 'RF-CAT-04-02: el DTO Zod rechaza un logotipo que no es una data URL de imagen válida');

    const logoDemasiadoGrandeRechazado = !CrearMarcaDto.safeParse({
      nombre: 'Sika',
      logotipo: `data:image/png;base64,${'A'.repeat(7_000_000)}`,
    }).success;
    assert(logoDemasiadoGrandeRechazado, 'RF-CAT-04-02: el DTO Zod rechaza un logotipo de más de 5MB');

    const sika = await marcasService.crear({ nombre: 'Sika', logotipo: CrearMarcaDto.parse({ nombre: 'Sika', logotipo: LOGO_PNG_1X1 }).logotipo });
    assert(sika.id_marca > 0 && sika.estado === 'activo', 'CA-CAT-04-01: marca creada activa con nombre y logotipo válidos');

    await assertLanza(
      () => marcasService.crear({ nombre: 'Sika', logotipo: CrearMarcaDto.parse({ nombre: 'Sika', logotipo: LOGO_PNG_1X1 }).logotipo }),
      'CA-CAT-04-02: rechaza marca duplicada'
    );

    const logotipoObtenido = await marcasService.obtenerLogotipo(sika.id_marca);
    assert(logotipoObtenido.logotipo_mime_type === 'image/png', 'El logotipo se puede recuperar aparte del listado');

    const lineaSika = await lineasService.crear({ nombre: 'SikaTop', id_marca: sika.id_marca });
    const desactivacionMarca = await marcasService.desactivar(sika.id_marca);
    assert('desactivado' in desactivacionMarca, 'RF-CAT-04-03: desactiva la marca sin pedir confirmación (según el diagrama)');

    const lineaTrasDesactivarMarca = await lineasService.obtenerPorId(lineaSika.id_linea);
    assert(
      lineaTrasDesactivarMarca.estado === 'inactivo',
      'RF-CAT-04-03: desactiva en cascada las líneas de la marca'
    );

    const reactivacionMarca = await marcasService.reactivar(sika.id_marca);
    assert('reactivado' in reactivacionMarca, 'La marca se reactiva correctamente');

    // --------------------------------------------------------------------------
    // HU-CAT-12: Gestión de bases (solo el registro de bases; sin tipo de
    // resina —excluido a petición del PO— y sin asignación a productos/colores
    // —depende de HU-CAT-02/HU-CAT-05, aún no implementadas—).
    // --------------------------------------------------------------------------
    const comex = await marcasService.crear({
      nombre: 'Comex',
      logotipo: CrearMarcaDto.parse({ nombre: 'Comex', logotipo: LOGO_PNG_1X1 }).logotipo,
    });

    await assertLanza(
      () => basesService.crear({ nombre: 'Base A', id_marca: 9999 }),
      'RF-CAT-12-01: rechaza base con marca inexistente'
    );

    const baseA = await basesService.crear({ nombre: 'Base A', id_marca: sika.id_marca });
    assert(baseA.id_marca === sika.id_marca && baseA.estado === 'activo', 'RF-CAT-12-01: base creada activa y asociada a su marca');

    await assertLanza(
      () => basesService.crear({ nombre: 'Base A', id_marca: sika.id_marca }),
      'RF-CAT-12-01: rechaza base duplicada dentro de la misma marca'
    );

    const baseAotraMarca = await basesService.crear({ nombre: 'Base A', id_marca: comex.id_marca });
    assert(baseAotraMarca.id_base !== baseA.id_base, 'RF-CAT-12-01: admite el mismo nombre de base en una marca distinta');

    const desactivacionBase = await basesService.desactivar(baseA.id_base);
    assert('desactivado' in desactivacionBase, 'Desactiva la base sin pedir confirmación (según el diagrama)');

    const reactivacionBase = await basesService.reactivar(baseA.id_base);
    assert('reactivado' in reactivacionBase, 'Reactiva la base cuando su marca está activa');

    await marcasService.desactivar(sika.id_marca);
    const baseTrasDesactivarMarca = await basesService.obtenerPorId(baseA.id_base);
    assert(
      baseTrasDesactivarMarca.estado === 'inactivo',
      'RF-CAT-04-03: desactivar la marca también desactiva en cascada sus bases'
    );

    await assertLanza(
      () => basesService.reactivar(baseA.id_base),
      'RF-CAT-09-04: rechaza reactivar base con marca inactiva'
    );

    // --------------------------------------------------------------------------
    // HU-CAT-05: Gestión de colores (alcance aprobado: registro por marca +
    // CIELAB obligatorio + muestra derivada; sin familias ni uso en producto).
    // --------------------------------------------------------------------------
    await assertLanza(
      () => coloresService.crear({ nombre: 'Rojo', id_marca: 9999, cielab: { l: 50, a: 60, b: 40 } }),
      'RF-CAT-05-01: rechaza color con marca inexistente'
    );

    const blanco = await coloresService.crear({
      nombre: 'Blanco Puro',
      id_marca: comex.id_marca,
      codigo: 'CMX-01',
      cielab: { l: 100, a: 0, b: 0 },
    });
    assert(
      blanco.estado === 'activo' && blanco.id_marca === comex.id_marca,
      'CA-CAT-05-01: color creado activo y asociado a su marca'
    );
    assert(blanco.muestra_hex === '#FFFFFF', 'RF-CAT-05-02: la muestra visual se deriva del CIELAB (L=100 → blanco)');

    const sinCodigo = await coloresService.crear({
      nombre: 'Azul Marino',
      id_marca: comex.id_marca,
      cielab: { l: 30, a: 10, b: -45 },
    });
    assert(sinCodigo.codigo === null, 'CA-CAT-05-02: admite registrar un color sin código');

    await assertLanza(
      () => coloresService.crear({ nombre: 'Blanco Puro', id_marca: comex.id_marca, cielab: { l: 100, a: 0, b: 0 } }),
      'CA-CAT-05-01: rechaza color duplicado dentro de la misma marca'
    );

    const blancoOtraMarca = await coloresService.crear({
      nombre: 'Blanco Puro',
      id_marca: interpinturas.id_marca,
      cielab: { l: 100, a: 0, b: 0 },
    });
    assert(
      blancoOtraMarca.id_color !== blanco.id_color,
      'CA-CAT-05-01: admite el mismo nombre de color en una marca distinta'
    );

    const sinCielabRechazado = !CrearColorDto.safeParse({ nombre: 'X', id_marca: comex.id_marca }).success;
    assert(sinCielabRechazado, 'RF-CAT-05-02: el DTO Zod exige el valor CIELAB');

    const cielabFueraRangoRechazado = !CrearColorDto.safeParse({
      nombre: 'X',
      id_marca: comex.id_marca,
      cielab: { l: 150, a: 0, b: 0 },
    }).success;
    assert(cielabFueraRangoRechazado, 'RF-CAT-05-02: el DTO Zod rechaza L* fuera de rango');

    assert(cielabAHex(0, 0, 0) === '#000000', 'RF-CAT-05-02: L=0 deriva la muestra negra');

    const soloAzul = await coloresService.listarPorMarca(comex.id_marca, 'azul');
    assert(soloAzul.length === 1 && soloAzul[0]?.nombre === 'Azul Marino', 'CA-CAT-05-05: la búsqueda filtra por nombre');

    const desactivacionColor = await coloresService.desactivar(blanco.id_color);
    assert('desactivado' in desactivacionColor, 'RF-CAT-05-01: desactiva el color');

    const reactivacionColor = await coloresService.reactivar(blanco.id_color);
    assert('reactivado' in reactivacionColor, 'RF-CAT-09-04: reactiva el color cuando su marca está activa');

    const acme = await marcasService.crear({
      nombre: 'Acme',
      logotipo: CrearMarcaDto.parse({ nombre: 'Acme', logotipo: LOGO_PNG_1X1 }).logotipo,
    });
    const colorAcme = await coloresService.crear({
      nombre: 'Verde Bosque',
      id_marca: acme.id_marca,
      cielab: { l: 55, a: -40, b: 35 },
    });
    await marcasService.desactivar(acme.id_marca);
    const colorTrasDesactivarMarca = await coloresService.obtenerPorId(colorAcme.id_color);
    assert(
      colorTrasDesactivarMarca.estado === 'inactivo',
      'RF-CAT-04-03: desactivar la marca también desactiva en cascada sus colores'
    );
    await assertLanza(
      () => coloresService.reactivar(colorAcme.id_color),
      'RF-CAT-09-04: rechaza reactivar color con marca inactiva'
    );

    // --------------------------------------------------------------------------
    // HU-CAT-02: Gestión de productos (con 'publicar' parcial: valida variante
    // activa; la exigencia de imagen queda diferida a HU-CAT-07).
    // --------------------------------------------------------------------------
    const resinaAgua = await resinasService.crear({ nombre: 'Base Agua' });
    assert(resinaAgua.estado === 'activo', 'RF-CAT-02-04: tipo de resina creado activo');
    await assertLanza(() => resinasService.crear({ nombre: 'Base Agua' }), 'RF-CAT-02-04: rechaza tipo de resina duplicado');

    const lineaComex = await lineasService.crear({ nombre: 'ComexLinea', id_marca: comex.id_marca });

    const sinSubcatRechazado = !CrearProductoDto.safeParse({
      nombre: 'X',
      id_marca: comex.id_marca,
      clase_color: 'sin_color',
      id_subcategorias: [],
    }).success;
    assert(sinSubcatRechazado, 'RF-CAT-02-02: el DTO exige al menos una subcategoría');

    const brocha = await productosService.crear({
      nombre: 'Brocha Profesional 3"',
      id_marca: comex.id_marca,
      clase_color: 'sin_color',
      id_subcategorias: [interioresEsmaltes.id_subcategoria],
    });
    assert(
      brocha.clase_color === 'sin_color' && brocha.id_linea === null && brocha.id_subcategorias.length === 1,
      'CA-CAT-02-03: una brocha (sin_color) se registra sin línea ni resina'
    );

    await assertLanza(
      () =>
        productosService.crear({
          nombre: 'Vinilo A',
          id_marca: comex.id_marca,
          clase_color: 'colores_fijos',
          id_subcategorias: [interioresEsmaltes.id_subcategoria],
        }),
      'RF-CAT-02-02: una pintura exige línea y resina'
    );

    await assertLanza(
      () =>
        productosService.crear({
          nombre: 'Vinilo B',
          id_marca: comex.id_marca,
          clase_color: 'colores_fijos',
          id_subcategorias: [interioresEsmaltes.id_subcategoria],
          id_linea: viniltexOtraMarca.id_linea,
          id_tipo_resina: resinaAgua.id_tipo_resina,
        }),
      'CA-CAT-11-02: rechaza asignar al producto una línea de otra marca'
    );

    const vinilo = await productosService.crear({
      nombre: 'Vinilo Premium',
      id_marca: comex.id_marca,
      clase_color: 'colores_fijos',
      id_subcategorias: [interioresEsmaltes.id_subcategoria],
      id_linea: lineaComex.id_linea,
      id_tipo_resina: resinaAgua.id_tipo_resina,
    });
    assert(
      vinilo.id_linea === lineaComex.id_linea && vinilo.id_tipo_resina === resinaAgua.id_tipo_resina,
      'CA-CAT-02-01: pintura registrada con marca, línea, resina y subcategoría'
    );

    await assertLanza(
      () =>
        productosService.crear({
          nombre: 'Fantasma',
          id_marca: comex.id_marca,
          clase_color: 'sin_color',
          id_subcategorias: [99999],
        }),
      'RF-CAT-02-02: rechaza una subcategoría inexistente'
    );

    const viniloEntonable = await productosService.actualizar(vinilo.id_producto, { clase_color: 'entonable' });
    assert(viniloEntonable.clase_color === 'entonable', 'RF-CAT-02-03: permite cambiar la clase cuando no hay variantes');

    varianteStats.set(vinilo.id_producto, { total: 2, activas: 1 });
    await assertLanza(
      () => productosService.actualizar(vinilo.id_producto, { clase_color: 'colores_fijos' }),
      'RF-CAT-02-03: impide cambiar la clase si el producto ya tiene variantes'
    );

    await assertLanza(
      () => productosService.publicar(brocha.id_producto),
      'RF-CAT-02-05: no publica un producto sin variante activa'
    );

    const publicado = await productosService.publicar(vinilo.id_producto);
    assert(publicado.publicado === true, 'RF-CAT-02-05: publica cuando hay variante activa (imagen diferida a HU-CAT-07)');

    const desactivacionProducto = await productosService.desactivar(brocha.id_producto);
    assert('desactivado' in desactivacionProducto, 'RF-CAT-02-01: desactiva el producto');

    const reactivacionProducto = await productosService.reactivar(brocha.id_producto);
    assert('reactivado' in reactivacionProducto, 'RF-CAT-09-04: reactiva el producto con su marca activa');

    const encontrados = await productosService.listar({ idMarca: comex.id_marca, busqueda: 'premium' });
    assert(
      encontrados.length === 1 && encontrados[0]?.nombre === 'Vinilo Premium',
      'RF-CAT-02-01: la búsqueda de productos filtra por nombre'
    );

    // --------------------------------------------------------------------------
    // HU-CAT-03: Gestión de variantes y presentaciones
    // --------------------------------------------------------------------------
    const galon = await presentacionesService.crear({ nombre: 'Galón', volumen: 3.785 });
    assert(galon.volumen === 3.785 && galon.estado === 'activo', 'RF-CAT-03-05: presentación creada con volumen numérico');
    await assertLanza(() => presentacionesService.crear({ nombre: 'Galón', volumen: 1 }), 'RF-CAT-03-05: rechaza presentación duplicada');

    const baseComex = await basesService.crear({ nombre: 'Base Neutra', id_marca: comex.id_marca });
    const baseInter = await basesService.crear({ nombre: 'Base Inter', id_marca: interpinturas.id_marca });

    const prodEntonable = await productosService.crear({
      nombre: 'Vinilo Tono',
      id_marca: comex.id_marca,
      clase_color: 'entonable',
      id_subcategorias: [interioresEsmaltes.id_subcategoria],
      id_linea: lineaComex.id_linea,
      id_tipo_resina: resinaAgua.id_tipo_resina,
    });
    const prodFijo = await productosService.crear({
      nombre: 'Esmalte Fijo',
      id_marca: comex.id_marca,
      clase_color: 'colores_fijos',
      id_subcategorias: [interioresEsmaltes.id_subcategoria],
      id_linea: lineaComex.id_linea,
      id_tipo_resina: resinaAgua.id_tipo_resina,
    });

    const varEnt = await variantesService.crear({
      id_producto: prodEntonable.id_producto,
      id_presentacion: galon.id_presentacion,
      id_base: baseComex.id_base,
      precio_vigente: 90000,
      existencia_referencial: 10,
    });
    assert(
      varEnt.id_base === baseComex.id_base && varEnt.id_color === null && varEnt.estado === 'activo',
      'RF-CAT-03-02: variante de producto entonable lleva base y no color'
    );

    await assertLanza(
      () =>
        variantesService.crear({
          id_producto: prodEntonable.id_producto,
          id_presentacion: galon.id_presentacion,
          id_base: baseComex.id_base,
          id_color: blanco.id_color,
          precio_vigente: 1,
        }),
      'CA-CAT-03-03: rechaza asignar un color a una variante entonable'
    );

    await assertLanza(
      () =>
        variantesService.crear({
          id_producto: prodEntonable.id_producto,
          id_presentacion: galon.id_presentacion,
          precio_vigente: 1,
        }),
      'RF-CAT-03-02: una variante entonable exige base'
    );

    await assertLanza(
      () =>
        variantesService.crear({
          id_producto: prodEntonable.id_producto,
          id_presentacion: galon.id_presentacion,
          id_base: baseComex.id_base,
          precio_vigente: 1,
        }),
      'CA-CAT-03-02: rechaza una variante idéntica del mismo producto'
    );

    await assertLanza(
      () =>
        variantesService.crear({
          id_producto: prodEntonable.id_producto,
          id_presentacion: galon.id_presentacion,
          id_base: baseInter.id_base,
          precio_vigente: 1,
        }),
      'CA-CAT-03-06: rechaza una base de otra marca'
    );

    const varFijo = await variantesService.crear({
      id_producto: prodFijo.id_producto,
      id_presentacion: galon.id_presentacion,
      id_color: blanco.id_color,
      precio_vigente: 50000,
      codigo_proveedor: 'SAMIT-001',
    });
    assert(
      varFijo.id_color === blanco.id_color && varFijo.id_base === null,
      'RF-CAT-03-02: variante de colores fijos lleva color y no base'
    );

    await assertLanza(
      () =>
        variantesService.crear({
          id_producto: prodFijo.id_producto,
          id_presentacion: galon.id_presentacion,
          id_color: sinCodigo.id_color,
          precio_vigente: 1,
          codigo_proveedor: 'SAMIT-001',
        }),
      'CA-CAT-03-08: rechaza un código de proveedor duplicado'
    );

    const existenciaNegativaRechazada = !CrearVarianteDto.safeParse({
      id_producto: prodFijo.id_producto,
      id_presentacion: galon.id_presentacion,
      id_color: blanco.id_color,
      precio_vigente: 1,
      existencia_referencial: -5,
    }).success;
    assert(existenciaNegativaRechazada, 'CA-CAT-03-11: el DTO rechaza existencia referencial negativa');

    await assertLanza(
      () =>
        variantesService.crear({
          id_producto: brocha.id_producto,
          id_presentacion: galon.id_presentacion,
          id_base: baseComex.id_base,
          precio_vigente: 1,
        }),
      'CA-CAT-03-04: un producto sin color no admite base en su variante'
    );

    const varBrocha = await variantesService.crear({
      id_producto: brocha.id_producto,
      id_presentacion: galon.id_presentacion,
      precio_vigente: 12000,
    });
    assert(varBrocha.id_base === null && varBrocha.id_color === null, 'CA-CAT-03-04: variante de brocha sin base ni color se registra');

    const desactivacionVariante = await variantesService.desactivar(varEnt.id_variante);
    assert('desactivado' in desactivacionVariante, 'RF-CAT-03-01: desactiva la variante (sin borrado físico)');

    await basesService.desactivar(baseComex.id_base);
    await assertLanza(
      () => variantesService.reactivar(varEnt.id_variante),
      'RF-CAT-09-05: rechaza reactivar una variante entonable con la base inactiva'
    );

    console.log(`\n======================================================`);
    console.log(`🎯 RESULTADOS: Superadas: ${superadas} | Fallidas: ${fallidas}`);
    console.log(`======================================================\n`);
    if (fallidas > 0) process.exit(1);
  } catch (err) {
    console.error('💥 Excepción no controlada durante las pruebas:', err);
    process.exit(1);
  }
}

void ejecutarPruebasM01();
