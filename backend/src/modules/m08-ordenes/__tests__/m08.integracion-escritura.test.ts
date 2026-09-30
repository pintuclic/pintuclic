import { Kysely, sql } from 'kysely';
import { db } from '../../../core/db/connection';
import { Database } from '../../../core/db/types';
import { AppError } from '../../../core/middlewares/errorHandler';
import { OrdenesRepository } from '../repositories/ordenes.repository';
import { OrdenesService } from '../services/ordenes.service';
import { GestionOrdenesService } from '../services/gestion-ordenes.service';
import { transicionesPermitidas } from '../services/ciclo-estados';
import { NotificadorEstadoOrden, RegistroAccesosDenegados } from '../interfaces/m08.interfaces';

// ==============================================================================
// M08 - PRUEBAS DE INTEGRACIÓN DE ESCRITURA CONTRA POSTGRESQL (se deshacen siempre)
// Ejecuta las escrituras reales (cambio de estado, notas y contactos) dentro de una
// transacción que termina SIEMPRE con ROLLBACK: la base queda exactamente como estaba.
// Comprueba al final que no quedó nada escrito.
// Requiere la base creada con `npm run db` y sembrada con `npm run db:seed`.
// Ejecutar: npx tsx src/modules/m08-ordenes/__tests__/m08.integracion-escritura.test.ts
// ==============================================================================

const CODIGO = 'ORD-2026-0001';
const ID_ADMIN = 1; // usuario del seed con todos los permisos

const registroSilencioso: RegistroAccesosDenegados = { registrarAccesoDenegado: () => undefined };
const notificadorSilencioso: NotificadorEstadoOrden = {
  notificarCambioEstadoOrden: async () => ({ exitoso: true, idEnvio: 'prueba', intentos: 0, mensaje: 'sin envío' }),
};

/** Señal para terminar la transacción con ROLLBACK después de las comprobaciones. */
class DeshacerCambios extends Error {}

async function contarFilas(conexion: Kysely<Database>, idOrden: number): Promise<string> {
  const [h, n, c] = await Promise.all([
    conexion.selectFrom('historial_estado_orden').select(({ fn }) => fn.countAll<string>().as('t')).where('id_orden', '=', idOrden).executeTakeFirstOrThrow(),
    conexion.selectFrom('nota_orden').select(({ fn }) => fn.countAll<string>().as('t')).where('id_orden', '=', idOrden).executeTakeFirstOrThrow(),
    conexion.selectFrom('contacto_orden').select(({ fn }) => fn.countAll<string>().as('t')).where('id_orden', '=', idOrden).executeTakeFirstOrThrow(),
  ]);
  return `${h.t}/${n.t}/${c.t}`;
}

/** Códigos de PostgreSQL: CHECK, UNIQUE y FOREIGN KEY. */
type CodigoRestriccion = '23514' | '23505' | '23503';

/**
 * Ejecuta una sentencia que debe fallar por una restricción de la BD, en su propia transacción.
 * Por defecto espera un CHECK (23514).
 */
async function violaRestriccion(
  sentencia: (trx: Kysely<Database>) => Promise<unknown>,
  codigo: CodigoRestriccion = '23514'
): Promise<boolean> {
  try {
    await db.transaction().execute(async (trx) => {
      await sentencia(trx);
      throw new DeshacerCambios();
    });
    return false;
  } catch (error) {
    return !(error instanceof DeshacerCambios) && (error as { code?: string }).code === codigo;
  }
}

async function ejecutarPruebasEscrituraM08(): Promise<void> {
  console.log('🚀 Iniciando pruebas de escritura de M08 contra PostgreSQL (todo se deshace al final)...\n');

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
    try {
      await sql`select 1`.execute(db);
    } catch (error) {
      console.error('💥 No se pudo conectar a PostgreSQL con los datos de backend/.env.');
      console.error('  ', error instanceof Error ? error.message : error);
      process.exitCode = 1;
      return;
    }

    const inicial = await new OrdenesRepository(db).buscarPorCodigo(CODIGO);
    if (!inicial) {
      console.error(`💥 Falta la orden del seed ${CODIGO}. Ejecuta npm run db:seed.`);
      process.exitCode = 1;
      return;
    }
    const siguiente = transicionesPermitidas(inicial.estado)[0];
    if (!siguiente) {
      console.error(`💥 ${CODIGO} está en «${inicial.estado}», que no tiene siguiente estado. Vuelve a sembrar la base.`);
      process.exitCode = 1;
      return;
    }
    const filasAntes = await contarFilas(db, inicial.id_orden);

    try {
      await db.transaction().execute(async (trx) => {
        const repo = new OrdenesRepository(trx);
        const gestion = new GestionOrdenesService(repo, notificadorSilencioso);
        const consultas = new OrdenesService(repo, registroSilencioso);

        // CA-ORD-05-01 / CA-ORD-03-04: el cambio actualiza la orden y queda en el historial.
        const resultado = await gestion.cambiarEstado(CODIGO, siguiente, ID_ADMIN, undefined);
        const tras = await repo.buscarPorCodigo(CODIGO);
        const historial = await repo.listarHistorial(inicial.id_orden);
        const ultimo = historial[historial.length - 1];
        assert(
          resultado.estado === siguiente && tras?.estado === siguiente,
          `CA-ORD-05-01: la orden pasa de «${inicial.estado}» a «${siguiente}» en la base de datos`
        );
        assert(
          ultimo?.estado_anterior === inicial.estado && ultimo.estado_nuevo === siguiente && ultimo.autor === 'Admin Pruebas',
          'CA-ORD-03-04: el historial registra estado anterior, nuevo y autor'
        );

        // CA-ORD-05-08: un cambio basado en un estado ya superado no modifica nada.
        const repetido = await repo.cambiarEstado({
          idOrden: inicial.id_orden,
          estadoActual: inicial.estado,
          estadoNuevo: siguiente,
          idAutor: ID_ADMIN,
          motivo: null,
        });
        assert(
          repetido === undefined && (await repo.listarHistorial(inicial.id_orden)).length === historial.length,
          'CA-ORD-05-08: si la orden ya cambió, el segundo cambio no escribe nada'
        );

        let saltoRechazado = false;
        try {
          await gestion.cambiarEstado(CODIGO, 'entregado', ID_ADMIN, undefined);
        } catch (error) {
          saltoRechazado = error instanceof AppError && error.code === 'TRANSICION_NO_PERMITIDA';
        }
        assert(saltoRechazado, 'HU-ORD-03: saltar pasos del ciclo se rechaza también con datos reales');

        // HU-ORD-10 y CA-ORD-09-03: nota y contacto con autor y fecha del servidor.
        const nota = await gestion.crearNota(CODIGO, ID_ADMIN, 'Nota de prueba de integración');
        const contacto = await gestion.registrarContacto(CODIGO, ID_ADMIN, 'correo', 'Aviso de prueba');
        assert(
          nota.autor === 'Admin Pruebas' && !Number.isNaN(Date.parse(nota.fecha)),
          'CA-ORD-10-02: la nota se guarda con el autor y el momento'
        );
        assert(
          contacto.medio === 'correo' && contacto.detalle === 'Aviso de prueba' && contacto.autor === 'Admin Pruebas',
          'CA-ORD-09-03: el contacto se guarda con medio, detalle y autor'
        );

        const detalle = await consultas.detallePedidoParaPersonal(CODIGO);
        assert(
          detalle.estado === siguiente &&
            detalle.notas.some((n) => n.texto === 'Nota de prueba de integración') &&
            detalle.contactos.some((c) => c.detalle === 'Aviso de prueba'),
          'HU-ORD-09: el detalle del personal refleja al instante lo registrado'
        );

        const pagina = await consultas.listarOrdenesParaPersonal({ codigo: CODIGO }, undefined, undefined);
        assert(
          pagina.items[0]?.dias_esperando === 0,
          'CA-ORD-05-07: justo después de un cambio de estado la orden lleva 0 días esperando'
        );

        throw new DeshacerCambios();
      });
    } catch (error) {
      if (!(error instanceof DeshacerCambios)) throw error;
    }

    // Restricciones de la base de datos (cada una en su transacción, que falla y se deshace).
    assert(
      await violaRestriccion((trx) =>
        trx
          .insertInto('historial_estado_orden')
          .values({ id_orden: inicial.id_orden, estado_anterior: 'preparada', estado_nuevo: 'preparada' })
          .execute()
      ),
      'BD: el historial rechaza un «cambio» al mismo estado (chk_historial_estado_cambio)'
    );
    assert(
      await violaRestriccion((trx) =>
        trx.insertInto('nota_orden').values({ id_orden: inicial.id_orden, id_usuario_autor: ID_ADMIN, texto: '   ' }).execute()
      ),
      'BD: una nota en blanco se rechaza (chk_nota_orden_texto)'
    );

    // Esquema 3.9: copia histórica, solicitud de origen, descuentos y retención de la orden.
    const ordenBase = {
      id_usuario: 2,
      sub_total: 1000,
      descuento: 0,
      total: 1000,
    } as const;
    assert(
      await violaRestriccion((trx) =>
        trx
          .insertInto('orden')
          .values({ ...ordenBase, codigo_visible: 'PRUEBA-DOMICILIO', modo_entrega: 'domicilio', direccion: null })
          .execute()
      ),
      'BD: una orden a domicilio sin dirección se rechaza (chk_orden_direccion_domicilio)'
    );
    assert(
      await violaRestriccion(async (trx) => {
        await trx
          .insertInto('orden')
          .values({ ...ordenBase, codigo_visible: 'PRUEBA-SOL-1', modo_entrega: 'recogida', codigo_solicitud: 'SOL-PRUEBA-1' })
          .execute();
        await trx
          .insertInto('orden')
          .values({ ...ordenBase, codigo_visible: 'PRUEBA-SOL-2', modo_entrega: 'recogida', codigo_solicitud: 'SOL-PRUEBA-1' })
          .execute();
      }, '23505'),
      'BD: una solicitud SOL no puede generar dos órdenes (uq_orden_codigo_solicitud)'
    );
    assert(
      await violaRestriccion((trx) =>
        trx
          .insertInto('orden')
          .values({ ...ordenBase, codigo_visible: 'PRUEBA-IVA', modo_entrega: 'recogida', tasa_iva: 120 })
          .execute()
      ),
      'BD: una tasa de IVA fuera de 0–100 se rechaza (chk_orden_iva)'
    );
    const primeraLinea = await db
      .selectFrom('linea_orden')
      .select('id_linea_orden')
      .where('id_orden', '=', inicial.id_orden)
      .executeTakeFirst();
    if (primeraLinea) {
      assert(
        await violaRestriccion(async (trx) => {
          const descuento = { id_linea_orden: primeraLinea.id_linea_orden, orden_aplicacion: 1, importe: 10 };
          await trx.insertInto('linea_orden_descuento').values({ ...descuento, origen: 'Prueba A' }).execute();
          await trx.insertInto('linea_orden_descuento').values({ ...descuento, origen: 'Prueba B' }).execute();
        }, '23505'),
        'BD: dos descuentos no pueden ocupar la misma posición en una línea (uq_lod_orden_aplicacion)'
      );
      assert(
        await violaRestriccion((trx) => trx.deleteFrom('orden').where('id_orden', '=', inicial.id_orden).execute(), '23503'),
        'BD: una orden con datos asociados no se puede borrar (RF-ORD-02-04)'
      );
      const reglaLineas = await sql<{ al_borrar: string }>`
        SELECT confdeltype::text AS al_borrar FROM pg_constraint WHERE conname = 'fk_lineaorden_orden'
      `.execute(db);
      assert(
        reglaLineas.rows[0]?.al_borrar === 'r',
        'BD: las líneas ya no se borran en cascada con la orden (fk_lineaorden_orden ON DELETE RESTRICT)'
      );
    } else {
      assert(false, `${CODIGO} no tiene líneas en el seed`);
    }

    // Nada de lo anterior quedó escrito.
    const final = await new OrdenesRepository(db).buscarPorCodigo(CODIGO);
    assert(
      final?.estado === inicial.estado && (await contarFilas(db, inicial.id_orden)) === filasAntes,
      'ROLLBACK: la orden, su historial, sus notas y sus contactos quedan exactamente como estaban'
    );

    console.log(`\n======================================================`);
    console.log(`🎯 RESULTADOS: Superadas: ${superadas} | Fallidas: ${fallidas}`);
    console.log(`======================================================\n`);
    if (fallidas > 0) process.exitCode = 1;
  } catch (err) {
    console.error('💥 Excepción no controlada durante las pruebas de escritura:', err);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}

void ejecutarPruebasEscrituraM08();
