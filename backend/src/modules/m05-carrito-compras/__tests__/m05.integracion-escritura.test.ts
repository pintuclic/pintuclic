import {
  Kysely,
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  RootOperationNode,
  UnknownRow,
  sql,
} from 'kysely';
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
// Excepción: la sección D4 prueba la transacción PROPIA del repositorio, así que no
// puede ir dentro de otra. Escribe de verdad y borra lo que creó en un `finally`.
// Requiere la base creada con `npm run db` y sembrada con `npm run db:seed`.
// Depende de las variantes 1 y 2 del seed (estado 'activo') y del usuario 4 sin carrito.
// Ejecutar: npx tsx src/modules/m05-carrito-compras/__tests__/m05.integracion-escritura.test.ts
// ==============================================================================

const TOKEN_VISITANTE = '3f1c2b9a-6d4e-4f8a-9b7c-1a2b3c4d5e6f';
const VARIANTE_INEXISTENTE = 2_000_000_000;
const TOKEN_FUSION = '8a7b6c5d-4e3f-4a1b-8c2d-3e4f5a6b7c8d';
const USUARIO_SIN_CARRITO = 4;
const TOKEN_CONCURRENCIA = 'c0ffee00-1234-4abc-8def-0123456789ab';

/** Hace fallar cualquier DELETE: simula una caída justo antes de borrar el carrito de visitante. */
class FallarAlBorrar implements KyselyPlugin {
  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    if (args.node.kind === 'DeleteQueryNode') {
      throw new Error('Fallo simulado al borrar el carrito de visitante');
    }
    return args.node;
  }

  async transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
    return args.result;
  }
}

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
    // B1: la fusión limita al tope de 999 y avisa
    // -------------------------------------------------------------------------
    console.log('\n--- B1: Tope de 999 en la fusión ---');
    try {
      await db.transaction().execute(async (trx) => {
        const servicio = servicioSobre(trx);
        await servicio.obtenerOCrearCarritoCliente(USUARIO_SIN_CARRITO);
        await servicio.agregarItemCliente(USUARIO_SIN_CARRITO, { id_variante: 1, cantidad: 600 });
        await servicio.obtenerOCrearCarritoVisitante(TOKEN_VISITANTE);
        await servicio.agregarItemVisitante(TOKEN_VISITANTE, { id_variante: 1, cantidad: 500 });

        const resultado = await servicio.fusionarCarritoConCuenta(USUARIO_SIN_CARRITO, { token_visitante: TOKEN_VISITANTE });
        assert(
          resultado.carrito.lineas[0]?.cantidad === 999,
          'B1-INT-01: 600 + 500 queda guardado como 999 (respeta el CHECK y el tope)'
        );
        assert(
          resultado.avisos?.[0]?.cantidad_solicitada === 1100 && resultado.avisos[0]?.cantidad_aplicada === 999,
          'B1-INT-02: la respuesta avisa del ajuste'
        );

        throw new DeshacerCambios();
      });
    } catch (error) {
      if (!(error instanceof DeshacerCambios)) throw error;
    }

    // -------------------------------------------------------------------------
    // D4: transferencia y borrado del carrito de visitante en una sola transacción
    // -------------------------------------------------------------------------
    console.log('\n--- D4: Fusión atómica (transacción propia del repositorio) ---');
    const previo = await db
      .selectFrom('carrito')
      .select('id_carrito')
      .where((eb) => eb.or([eb('id_usuario', '=', USUARIO_SIN_CARRITO), eb('token_visitante', '=', TOKEN_FUSION)]))
      .execute();
    if (previo.length > 0) {
      assert(false, `D4-INT: el usuario ${USUARIO_SIN_CARRITO} o el token de prueba ya tienen carrito; se omite la sección`);
    } else {
      const creados: number[] = [];
      try {
        const servicio = servicioSobre(db);
        const visitante = await servicio.obtenerOCrearCarritoVisitante(TOKEN_FUSION);
        creados.push(visitante.id_carrito);
        await servicio.agregarItemVisitante(TOKEN_FUSION, { id_variante: 1, cantidad: 2 });
        await servicio.agregarItemVisitante(TOKEN_FUSION, { id_variante: 2, cantidad: 3 });
        const cliente = await servicio.obtenerOCrearCarritoCliente(USUARIO_SIN_CARRITO);
        creados.push(cliente.id_carrito);
        await servicio.agregarItemCliente(USUARIO_SIN_CARRITO, { id_variante: 1, cantidad: 1 });

        const conFallo = new CarritoService(
          new CarritoRepository(db),
          new LineaCarritoRepository(db.withPlugin(new FallarAlBorrar()))
        );
        let fallo = false;
        try {
          await conFallo.fusionarCarritoConCuenta(USUARIO_SIN_CARRITO, { token_visitante: TOKEN_FUSION });
        } catch {
          fallo = true;
        }
        const lineasCliente = await db
          .selectFrom('linea_carrito')
          .select(['id_variante', 'cantidad'])
          .where('id_carrito', '=', cliente.id_carrito)
          .execute();
        const lineasVisitante = await db
          .selectFrom('linea_carrito')
          .select(({ fn }) => fn.countAll<string>().as('t'))
          .where('id_carrito', '=', visitante.id_carrito)
          .executeTakeFirstOrThrow();
        assert(fallo, 'D4-INT-01: el fallo al borrar el carrito de visitante se propaga');
        assert(
          lineasCliente.length === 1 && lineasCliente[0]?.cantidad === 1,
          'D4-INT-02: tras el fallo, el carrito del cliente no recibió líneas (la transferencia se deshizo)'
        );
        assert(lineasVisitante.t === '2', 'D4-INT-03: tras el fallo, el carrito de visitante conserva sus 2 líneas');

        const resultado = await servicio.fusionarCarritoConCuenta(USUARIO_SIN_CARRITO, { token_visitante: TOKEN_FUSION });
        const sigueVisitante = await db
          .selectFrom('carrito')
          .select('id_carrito')
          .where('id_carrito', '=', visitante.id_carrito)
          .executeTakeFirst();
        const cantidades = Object.fromEntries(resultado.carrito.lineas.map((l) => [l.id_variante, l.cantidad]));
        assert(
          sigueVisitante === undefined && cantidades[1] === 3 && cantidades[2] === 3,
          'D4-INT-04: sin fallo, el visitante desaparece y el cliente queda con 1+2=3 y 3 unidades'
        );
      } finally {
        if (creados.length > 0) {
          await db.deleteFrom('carrito').where('id_carrito', 'in', creados).execute();
        }
      }
    }

    // -------------------------------------------------------------------------
    // B2: agregados simultáneos sobre la misma variante (sin transacción externa,
    // porque una sola conexión serializaría las peticiones; se limpia en `finally`)
    // -------------------------------------------------------------------------
    console.log('\n--- B2: Agregados concurrentes sobre la misma línea ---');
    {
      const servicio = servicioSobre(db);
      const carrito = await servicio.obtenerOCrearCarritoVisitante(TOKEN_CONCURRENCIA);
      try {
        const simultaneos = await Promise.allSettled(
          Array.from({ length: 8 }, () =>
            servicio.agregarItemVisitante(TOKEN_CONCURRENCIA, { id_variante: 3, cantidad: 1 })
          )
        );
        const fallidos = simultaneos.filter((r) => r.status === 'rejected');
        let linea = await db
          .selectFrom('linea_carrito')
          .select('cantidad')
          .where('id_carrito', '=', carrito.id_carrito)
          .where('id_variante', '=', 3)
          .executeTakeFirst();
        assert(
          fallidos.length === 0 && linea?.cantidad === 8,
          `B2-INT-01: 8 agregados simultáneos de 1 unidad dejan una línea con 8 (fallidos: ${fallidos.length}, cantidad: ${linea?.cantidad})`
        );

        const conTope = await Promise.allSettled(
          Array.from({ length: 5 }, () =>
            servicio.agregarItemVisitante(TOKEN_CONCURRENCIA, { id_variante: 3, cantidad: 300 })
          )
        );
        const rechazados = conTope.filter(
          (r) => r.status === 'rejected' && r.reason instanceof AppError && r.reason.code === 'CANTIDAD_MAXIMA_EXCEDIDA'
        );
        linea = await db
          .selectFrom('linea_carrito')
          .select('cantidad')
          .where('id_carrito', '=', carrito.id_carrito)
          .where('id_variante', '=', 3)
          .executeTakeFirst();
        assert(
          rechazados.length === 2 && linea?.cantidad === 908,
          `B2-INT-02: con 5 agregados simultáneos de 300 sobre 8, entran 3 (908) y 2 se rechazan por tope (rechazados: ${rechazados.length}, cantidad: ${linea?.cantidad})`
        );
      } finally {
        await db.deleteFrom('carrito').where('id_carrito', '=', carrito.id_carrito).execute();
      }
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
