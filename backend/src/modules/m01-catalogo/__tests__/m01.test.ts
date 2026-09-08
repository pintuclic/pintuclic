import { CategoriasService } from '../services/categorias.service';
import { SubcategoriasService } from '../services/subcategorias.service';
import { LineasService } from '../services/lineas.service';
import { CrearCategoriaDto } from '../dtos/categorias.dto';
import {
  Categoria,
  Subcategoria,
  NewCategoria,
  CategoriaUpdate,
  NewSubcategoria,
  SubcategoriaUpdate,
  Marca,
  Linea,
  NewLinea,
  LineaUpdate,
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
  const marcas: Map<number, Marca> = new Map();
  const lineas: Map<number, Linea> = new Map();
  const productosAfectadosPorLinea: Map<number, number> = new Map();
  let seqMarca = 1;
  let seqLinea = 1;

  function crearMarcaDirecto(nombre: string): Marca {
    const marca: Marca = { id_marca: seqMarca++, nombre, estado: 'activo' };
    marcas.set(marca.id_marca, marca);
    return marca;
  }

  const mockMarcasRepo = {
    obtenerPorId: async (id: number) => marcas.get(id),
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
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoriasService = new CategoriasService(mockCategoriasRepo as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subcategoriasService = new SubcategoriasService(mockSubcategoriasRepo as any, mockCategoriasRepo as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineasService = new LineasService(mockLineasRepo as any, mockMarcasRepo as any);

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
