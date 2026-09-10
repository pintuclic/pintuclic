import { BusquedaService } from '../services/busqueda.service';
import { BusquedaRepository, FilaProductoBusqueda } from '../repositories/busqueda.repository';

// ==============================================================================
// M02 - SUITE DE VALIDACIÓN DE CRITERIOS DE ACEPTACIÓN (HU-BUS-01)
// Repositorio falso en memoria: valida la lógica del servicio (normalización del
// término y cálculo de paginación) sin BD real. El matching SQL (unaccent +
// pg_trgm) se valida contra la BD en QA.
// Ejecutar: npx tsx src/modules/m02-busqueda/__tests__/m02.test.ts
// ==============================================================================

interface LlamadaBuscar {
  termino: string | undefined;
  limite: number;
  offset: number;
}

class RepoFake extends BusquedaRepository {
  public ultimaBusqueda: LlamadaBuscar | undefined;
  public ultimoContar: string | undefined;

  constructor(private readonly filas: FilaProductoBusqueda[]) {
    super(undefined as never); // no se usa la BD en el fake
  }

  override async buscar(termino: string | undefined, limite: number, offset: number): Promise<FilaProductoBusqueda[]> {
    this.ultimaBusqueda = { termino, limite, offset };
    return this.filas.slice(offset, offset + limite);
  }

  override async contar(termino: string | undefined): Promise<number> {
    this.ultimoContar = termino;
    return this.filas.length;
  }
}

function producto(id: number): FilaProductoBusqueda {
  return { id_producto: id, nombre: `Producto ${id}`, id_marca: 1, clase_color: 'sin_color' };
}

async function ejecutarPruebasM02(): Promise<void> {
  console.log('🚀 Iniciando suite de validación técnica de M02: Búsqueda (HU-BUS-01)...\n');

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
    // RF-BUS-01-01: término vacío o solo espacios => catálogo completo (sin término).
    {
      const repo = new RepoFake([producto(1), producto(2)]);
      const service = new BusquedaService(repo);
      await service.buscar({ termino: '   ' });
      assert(repo.ultimaBusqueda?.termino === undefined, 'RF-BUS-01-01: término en blanco se trata como catálogo completo');
    }

    // RF-BUS-01-01: término con espacios alrededor se recorta.
    {
      const repo = new RepoFake([producto(1)]);
      const service = new BusquedaService(repo);
      await service.buscar({ termino: '  vinilo  ' });
      assert(repo.ultimaBusqueda?.termino === 'vinilo', 'RF-BUS-01-01: el término se recorta antes de buscar');
    }

    // HU-BUS-05: paginación por defecto (página 1, límite 20, offset 0).
    {
      const repo = new RepoFake([]);
      const service = new BusquedaService(repo);
      const pagina = await service.buscar({});
      assert(pagina.pagina === 1 && pagina.limite === 20, 'HU-BUS-05: valores por defecto de página y límite');
      assert(repo.ultimaBusqueda?.offset === 0, 'HU-BUS-05: offset inicial es 0');
    }

    // HU-BUS-05: offset calculado a partir de la página solicitada.
    {
      const repo = new RepoFake([]);
      const service = new BusquedaService(repo);
      await service.buscar({ pagina: 3, limite: 10 });
      assert(repo.ultimaBusqueda?.offset === 20, 'HU-BUS-05: offset = (pagina-1) * limite');
    }

    // HU-BUS-05: el límite se acota al máximo (100).
    {
      const repo = new RepoFake([]);
      const service = new BusquedaService(repo);
      const pagina = await service.buscar({ limite: 999 });
      assert(pagina.limite === 100, 'HU-BUS-05: límite acotado al máximo permitido');
    }

    // RF-BUS-01-04: el total refleja el conteo y los items respetan el límite.
    {
      const filas = Array.from({ length: 25 }, (_, i) => producto(i + 1));
      const repo = new RepoFake(filas);
      const service = new BusquedaService(repo);
      const pagina = await service.buscar({ limite: 20 });
      assert(pagina.total === 25, 'RF-BUS-01-04: total refleja todos los coincidentes');
      assert(pagina.items.length === 20, 'HU-BUS-05: la primera página entrega solo el tamaño pedido');
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
