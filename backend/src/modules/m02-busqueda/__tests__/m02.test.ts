import { BusquedaService } from '../services/busqueda.service';
import { BusquedaRepository, FilaProductoBusqueda } from '../repositories/busqueda.repository';
import { BuscarProductosDto } from '../dtos/busqueda.dto';
import { FiltrosBusqueda, OrdenBusqueda, TerminoSinResultado, FacetasBusqueda } from '../interfaces/m02.interfaces';

const FACETAS_VACIAS: FacetasBusqueda = {
  categorias: [],
  subcategorias: [],
  marcas: [],
  lineas: [],
  resinas: [],
  colores: [],
  presentaciones: [],
};

// ==============================================================================
// M02 - SUITE DE VALIDACIÓN DE CRITERIOS DE ACEPTACIÓN (HU-BUS-01, HU-BUS-02)
// Repositorio falso en memoria + parseo del DTO: valida la lógica sin BD real
// (normalización del término, paginación, propagación de filtros y validación
// del rango de precio). El matching SQL (unaccent + pg_trgm) se valida en QA.
// Ejecutar: npx tsx src/modules/m02-busqueda/__tests__/m02.test.ts
// ==============================================================================

interface LlamadaBuscar {
  termino: string | undefined;
  filtros: FiltrosBusqueda | undefined;
  orden: OrdenBusqueda;
  limite: number;
  offset: number;
}

class RepoFake extends BusquedaRepository {
  public ultimaBusqueda: LlamadaBuscar | undefined;
  public terminoRegistrado: string | undefined;
  public desdeConsultado: Date | undefined;

  constructor(private readonly filas: FilaProductoBusqueda[]) {
    super(undefined as never); // no se usa la BD en el fake
  }

  override async buscar(
    termino: string | undefined,
    filtros: FiltrosBusqueda | undefined,
    orden: OrdenBusqueda,
    limite: number,
    offset: number
  ): Promise<FilaProductoBusqueda[]> {
    this.ultimaBusqueda = { termino, filtros, orden, limite, offset };
    return this.filas.slice(offset, offset + limite);
  }

  override async contar(): Promise<number> {
    return this.filas.length;
  }

  override async registrarSinResultado(termino: string): Promise<void> {
    this.terminoRegistrado = termino;
  }

  override async listarSinResultado(desde: Date): Promise<TerminoSinResultado[]> {
    this.desdeConsultado = desde;
    return [];
  }

  public facetasArgs: { termino: string | undefined; filtros: FiltrosBusqueda | undefined } | undefined;
  override async facetas(termino: string | undefined, filtros: FiltrosBusqueda | undefined): Promise<FacetasBusqueda> {
    this.facetasArgs = { termino, filtros };
    return FACETAS_VACIAS;
  }
}

function producto(id: number): FilaProductoBusqueda {
  return { id_producto: id, nombre: `Producto ${id}`, id_marca: 1, clase_color: 'sin_color' };
}

async function ejecutarPruebasM02(): Promise<void> {
  console.log('🚀 Iniciando suite de validación técnica de M02: Búsqueda y filtros (HU-BUS-01/02)...\n');

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

  try {
    // --- HU-BUS-01 -----------------------------------------------------------

    // RF-BUS-01-01: término vacío o solo espacios => catálogo completo (sin término).
    {
      const repo = new RepoFake([producto(1), producto(2)]);
      await new BusquedaService(repo).buscar({ termino: '   ' });
      assert(repo.ultimaBusqueda?.termino === undefined, 'RF-BUS-01-01: término en blanco se trata como catálogo completo');
    }

    // RF-BUS-01-01: término con espacios alrededor se recorta.
    {
      const repo = new RepoFake([producto(1)]);
      await new BusquedaService(repo).buscar({ termino: '  vinilo  ' });
      assert(repo.ultimaBusqueda?.termino === 'vinilo', 'RF-BUS-01-01: el término se recorta antes de buscar');
    }

    // HU-BUS-05: paginación por defecto (página 1, límite 20, offset 0).
    {
      const repo = new RepoFake([]);
      const pagina = await new BusquedaService(repo).buscar({});
      assert(pagina.pagina === 1 && pagina.limite === 20, 'HU-BUS-05: valores por defecto de página y límite');
      assert(repo.ultimaBusqueda?.offset === 0, 'HU-BUS-05: offset inicial es 0');
    }

    // HU-BUS-05: offset calculado a partir de la página solicitada.
    {
      const repo = new RepoFake([]);
      await new BusquedaService(repo).buscar({ pagina: 3, limite: 10 });
      assert(repo.ultimaBusqueda?.offset === 20, 'HU-BUS-05: offset = (pagina-1) * limite');
    }

    // HU-BUS-05: el límite se acota al máximo (100).
    {
      const repo = new RepoFake([]);
      const pagina = await new BusquedaService(repo).buscar({ limite: 999 });
      assert(pagina.limite === 100, 'HU-BUS-05: límite acotado al máximo permitido');
    }

    // RF-BUS-01-04: el total refleja el conteo y los items respetan el límite.
    {
      const filas = Array.from({ length: 25 }, (_, i) => producto(i + 1));
      const repo = new RepoFake(filas);
      const pagina = await new BusquedaService(repo).buscar({ limite: 20 });
      assert(pagina.total === 25, 'RF-BUS-01-04: total refleja todos los coincidentes');
      assert(pagina.items.length === 20, 'HU-BUS-05: la primera página entrega solo el tamaño pedido');
    }

    // --- HU-BUS-02 -----------------------------------------------------------

    // RF-BUS-02-01: los filtros parseados se propagan al repositorio.
    {
      const repo = new RepoFake([]);
      await new BusquedaService(repo).buscar({ filtros: { idMarca: [1, 2], precioMin: 10, precioMax: 50 } });
      const f = repo.ultimaBusqueda?.filtros;
      assert(!!f && f.idMarca?.length === 2 && f.precioMin === 10 && f.precioMax === 50, 'RF-BUS-02-01: los filtros llegan al repositorio');
    }

    // Sin filtros, el servicio no inventa un objeto de filtros.
    {
      const repo = new RepoFake([]);
      await new BusquedaService(repo).buscar({ termino: 'azul' });
      assert(repo.ultimaBusqueda?.filtros === undefined, 'Sin filtros => filtros undefined en el repositorio');
    }

    // RF-BUS-02-01: el DTO acepta multivalor separado por comas.
    {
      const dto = BuscarProductosDto.parse({ marca: '1,2,3' });
      assert(JSON.stringify(dto.marca) === JSON.stringify([1, 2, 3]), 'RF-BUS-02-01: "1,2,3" se parsea como [1,2,3]');
    }

    // RF-BUS-02-01: el DTO acepta multivalor como array de query repetido.
    {
      const dto = BuscarProductosDto.parse({ color: ['4', '5'] });
      assert(JSON.stringify(dto.color) === JSON.stringify([4, 5]), 'RF-BUS-02-01: ?color=4&color=5 se parsea como [4,5]');
    }

    // CA-BUS-02-06 / RF-BUS-02-04: rango con mínimo > máximo se rechaza.
    {
      let rechazado = false;
      try {
        BuscarProductosDto.parse({ precio_min: '100', precio_max: '50' });
      } catch {
        rechazado = true;
      }
      assert(rechazado, 'CA-BUS-02-06: se rechaza el rango con mínimo superior al máximo');
    }

    // RF-BUS-02-04: rango válido (min ≤ max) se acepta y coacciona a número.
    {
      const dto = BuscarProductosDto.parse({ precio_min: '50', precio_max: '100' });
      assert(dto.precio_min === 50 && dto.precio_max === 100, 'RF-BUS-02-04: rango válido se acepta como números');
    }

    // --- HU-BUS-03 -----------------------------------------------------------

    // CA-BUS-03-02 / RF-BUS-03-01: sin criterio se aplica el orden por defecto (relevancia).
    {
      const repo = new RepoFake([]);
      await new BusquedaService(repo).buscar({ termino: 'azul' });
      assert(repo.ultimaBusqueda?.orden === 'relevancia', 'CA-BUS-03-02: sin criterio se aplica el orden por defecto (relevancia)');
    }

    // CA-BUS-03-01 / RF-BUS-03-01: el criterio elegido se propaga al repositorio.
    {
      const repo = new RepoFake([]);
      await new BusquedaService(repo).buscar({ orden: 'precio_asc' });
      assert(repo.ultimaBusqueda?.orden === 'precio_asc', 'CA-BUS-03-01: el criterio elegido llega al repositorio');
    }

    // RF-BUS-03-01: el DTO acepta los criterios válidos y rechaza los inválidos.
    {
      const dto = BuscarProductosDto.parse({ orden: 'novedad' });
      assert(dto.orden === 'novedad', 'RF-BUS-03-01: el DTO acepta un criterio válido');
      let rechazado = false;
      try {
        BuscarProductosDto.parse({ orden: 'popularidad' });
      } catch {
        rechazado = true;
      }
      assert(rechazado, 'RF-BUS-03-01: el DTO rechaza un criterio no soportado');
    }

    // --- HU-BUS-05 -----------------------------------------------------------

    // RF-BUS-05-02: total_paginas = ceil(total / limite).
    {
      const filas = Array.from({ length: 25 }, (_, i) => producto(i + 1));
      const pagina = await new BusquedaService(new RepoFake(filas)).buscar({ limite: 10 });
      assert(pagina.total_paginas === 3, 'RF-BUS-05-02: total_paginas = ceil(total/limite) (25/10 => 3)');
    }

    // RF-BUS-05-02: sin resultados, total_paginas = 0.
    {
      const pagina = await new BusquedaService(new RepoFake([])).buscar({});
      assert(pagina.total === 0 && pagina.total_paginas === 0, 'RF-BUS-05-02: sin resultados total y total_paginas son 0');
    }

    // CA-BUS-05-04: una página que excede el total responde sin error, con items vacío.
    {
      const filas = Array.from({ length: 5 }, (_, i) => producto(i + 1));
      const pagina = await new BusquedaService(new RepoFake(filas)).buscar({ pagina: 99, limite: 10 });
      assert(pagina.items.length === 0 && pagina.total === 5 && pagina.pagina === 99, 'CA-BUS-05-04: página fuera de rango devuelve vacío sin error, con total correcto');
    }

    // --- HU-BUS-06 -----------------------------------------------------------

    // RF-BUS-06-01: una búsqueda con término y sin resultados se registra (normalizada).
    {
      const repo = new RepoFake([]); // total = 0
      await new BusquedaService(repo).buscar({ termino: 'Vinil XZ' });
      assert(repo.terminoRegistrado === 'vinil xz', 'RF-BUS-06-01: término sin resultado se registra en minúsculas');
    }

    // RF-BUS-06-01: si hay resultados, no se registra nada.
    {
      const repo = new RepoFake([producto(1)]); // total = 1
      await new BusquedaService(repo).buscar({ termino: 'vinil' });
      assert(repo.terminoRegistrado === undefined, 'RF-BUS-06-01: con resultados no se registra la búsqueda');
    }

    // RF-BUS-06-01: sin término (catálogo completo) no se registra aunque haya 0 resultados.
    {
      const repo = new RepoFake([]);
      await new BusquedaService(repo).buscar({});
      assert(repo.terminoRegistrado === undefined, 'RF-BUS-06-01: sin término no se registra nada');
    }

    // RF-BUS-06-02: el periodo acota la ventana temporal (diario ≈ hoy - 1 día).
    {
      const repo = new RepoFake([]);
      const antes = Date.now();
      await new BusquedaService(repo).estadisticasSinResultado('diario');
      const dias = (antes - (repo.desdeConsultado?.getTime() ?? 0)) / (24 * 60 * 60 * 1000);
      assert(Math.abs(dias - 1) < 0.01, 'RF-BUS-06-02: periodo diario consulta desde ~1 día atrás');
    }

    // RF-BUS-02-02: las facetas normalizan el término y propagan los filtros vigentes.
    {
      const repo = new RepoFake([]);
      await new BusquedaService(repo).facetas({ termino: '  Vinilo ', filtros: { idMarca: [1] } });
      assert(
        repo.facetasArgs?.termino === 'Vinilo' && repo.facetasArgs?.filtros?.idMarca?.[0] === 1,
        'RF-BUS-02-02: las facetas normalizan el término y propagan los filtros'
      );
    }

    console.log(`\n======================================================`);
    console.log(`🎯 RESULTADOS: Superadas: ${superadas} | Fallidas: ${fallidas}`);
    console.log(`======================================================\n`);
    if (fallidas > 0) process.exit(1);
  } catch (err) {
    console.error('💥 Excepción no controlada durante las pruebas:', err);
    process.exit(1);
  }
}

void ejecutarPruebasM02();
