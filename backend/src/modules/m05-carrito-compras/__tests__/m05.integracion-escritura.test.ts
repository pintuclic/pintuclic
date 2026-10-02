import { Kysely, sql } from 'kysely';
import { db } from '../../../core/db/connection';
import { Database } from '../../../core/db/types';
import { AppError } from '../../../core/middlewares/errorHandler';
import { CarritoRepository } from '../repositories/carrito.repository';
import { LineaCarritoRepository } from '../repositories/linea-carrito.repository';
import { CarritoService } from '../services/carrito.service';

// ==============================================================================
// M05 - PRUEBAS DE INTEGRACIÓN DE ESCRITURA CONTRA POSTGRESQL (se deshacen siempre)
// Ejecuta las escrituras reales del carrito dentro de una transacción que termina
// SIEMPRE con ROLLBACK: la base queda exactamente como estaba. Comprueba al final
// que no quedó nada escrito.
// Requiere la base creada con `npm run db` y sembrada con `npm run db:seed`.
// Depende de las variantes 1 y 2 del seed, ambas en estado 'activo'.
// Ejecutar: npx tsx src/modules/m05-carrito-compras/__tests__/m05.integracion-escritura.test.ts
// ==============================================================================

const TOKEN_VISITANTE = '3f1c2b9a-6d4e-4f8a-9b7c-1a2b3c4d5e6f';
const VARIANTE_INEXISTENTE = 2_000_000_000;

/** Señal para terminar la transacción con ROLLBACK después de las comprobaciones. */
class DeshacerCambios extends Error {}

/** Huella de las tablas que tocan las pruebas, para comprobar que el ROLLBACK las dejó igual. */
async function huella(conexion: Kysely<Database>): Promise<string> {
  const [carritos, lineas, variante1] = await Promise.all([
    conexion.selectFrom('carrito').select(({ fn }) => fn.countAll<string>().as('t')).executeTakeFirstOrThrow(),
    conexion.selectFrom('linea_carrito').select(({ fn }) => fn.countAll<string>().as('t')).executeTakeFirstOrThrow(),
    conexion.selectFrom('variante').select('estado').where('id_variante', '=', 1).executeTakeFirstOrThrow(),
  ]);
  return `${carritos.t}/${lineas.t}/${variante1.estado}`;
}

function servicioSobre(conexion: Kysely<Database>): CarritoService {
  return new CarritoService(new CarritoRepository(conexion), new LineaCarritoRepository(conexion));
}

async function ejecutarPruebasIntegracionEscrituraM05(): Promise<void> {
  console.log('🚀 Iniciando pruebas de integración de escritura de M05 contra PostgreSQL (con ROLLBACK)...\n');

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

  async function esperarError(
    operacion: () => Promise<unknown>,
    estado: number,
    codigo: string,
    descripcion: string
  ): Promise<void> {
    try {
      await operacion();
      assert(false, `${descripcion} (no lanzó error)`);
    } catch (error) {
      const coincide = error instanceof AppError && error.statusCode === estado && error.code === codigo;
      const obtenido = error instanceof AppError ? `${error.statusCode} ${error.code}` : String(error);
      assert(coincide, coincide ? descripcion : `${descripcion} (obtuvo ${obtenido})`);
    }
  }

  try {
    try {
      await sql`select 1`.execute(db);
    } catch (error) {
      console.error('💥 No se pudo conectar a PostgreSQL con los datos de backend/.env.');
      console.error('   Comprueba que el servicio esté en marcha y que la base esté creada y sembrada.');
      console.error('  ', error instanceof Error ? error.message : error);
      process.exitCode = 1;
      return;
    }

    const huellaInicial = await huella(db);

    // -------------------------------------------------------------------------
    // D1: la variante debe existir y estar activa (antes respondía 500 por la FK)
    // -------------------------------------------------------------------------
    console.log('--- D1: Validación de la variante contra el catálogo real ---');
    try {
      await db.transaction().execute(async (trx) => {
        const servicio = servicioSobre(trx);
        await servicio.obtenerOCrearCarritoVisitante(TOKEN_VISITANTE);

        await esperarError(
          () => servicio.agregarItemVisitante(TOKEN_VISITANTE, { id_variante: VARIANTE_INEXISTENTE, cantidad: 1 }),
          404,
          'VARIANTE_NO_ENCONTRADA',
          'D1-INT-01: una variante inexistente responde 404 y no llega a la llave foránea'
        );

        await trx.updateTable('variante').set({ estado: 'inactivo' }).where('id_variante', '=', 1).execute();
        await esperarError(
          () => servicio.agregarItemVisitante(TOKEN_VISITANTE, { id_variante: 1, cantidad: 1 }),
          422,
          'VARIANTE_NO_DISPONIBLE',
          'D1-INT-02: una variante inactiva responde 422'
        );

        const carrito = await servicio.agregarItemVisitante(TOKEN_VISITANTE, { id_variante: 2, cantidad: 3 });
        assert(
          carrito.total_lineas === 1 && carrito.lineas[0]?.cantidad === 3,
          'D1-INT-03: una variante activa se agrega con normalidad'
        );

        throw new DeshacerCambios();
      });
    } catch (error) {
      if (!(error instanceof DeshacerCambios)) throw error;
    }

    // -------------------------------------------------------------------------
    // D2: el tope de 999 por línea se respeta al acumular
    // -------------------------------------------------------------------------
    console.log('\n--- D2: Tope por línea al acumular ---');
    try {
      await db.transaction().execute(async (trx) => {
        const servicio = servicioSobre(trx);
        await servicio.obtenerOCrearCarritoVisitante(TOKEN_VISITANTE);
        await servicio.agregarItemVisitante(TOKEN_VISITANTE, { id_variante: 2, cantidad: 995 });

        await esperarError(
          () => servicio.agregarItemVisitante(TOKEN_VISITANTE, { id_variante: 2, cantidad: 5 }),
          422,
          'CANTIDAD_MAXIMA_EXCEDIDA',
          'D2-INT-01: 995 + 5 responde 422 y no escribe 1000 unidades'
        );
        const carrito = await servicio.agregarItemVisitante(TOKEN_VISITANTE, { id_variante: 2, cantidad: 4 });
        assert(carrito.lineas[0]?.cantidad === 999, 'D2-INT-02: 995 + 4 = 999 queda guardado');

        throw new DeshacerCambios();
      });
    } catch (error) {
      if (!(error instanceof DeshacerCambios)) throw error;
    }

    // -------------------------------------------------------------------------
    // La base debe quedar exactamente como estaba
    // -------------------------------------------------------------------------
    console.log('\n--- Limpieza ---');
    assert((await huella(db)) === huellaInicial, 'El ROLLBACK dejó carritos, líneas y variantes como estaban');
  } finally {
    await db.destroy();
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Total: ${superadas + fallidas} pruebas | ✅ ${superadas} superadas | ❌ ${fallidas} fallidas`);
  console.log('='.repeat(60));

  if (fallidas > 0) {
    process.exitCode = 1;
  }
}

ejecutarPruebasIntegracionEscrituraM05().catch((err: unknown) => {
  console.error('Error inesperado en la suite:', err);
  process.exitCode = 1;
});
