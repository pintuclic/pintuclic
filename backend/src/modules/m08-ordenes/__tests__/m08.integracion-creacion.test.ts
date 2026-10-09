import { Kysely, sql } from 'kysely';
import { db } from '../../../core/db/connection';
import { Database } from '../../../core/db/types';
import { AppError } from '../../../core/middlewares/errorHandler';
import { OrdenesRepository } from '../repositories/ordenes.repository';
import { OrdenesService } from '../services/ordenes.service';
import { CreacionOrdenService } from '../services/creacion-orden.service';
import { CodigoPedidoService } from '../services/codigo-pedido.service';
import {
  NotificadorEstadoOrden,
  RegistroAccesosDenegados,
  ResultadoCreacionOrden,
  SolicitudPagoConfirmado,
} from '../interfaces/m08.interfaces';

// ==============================================================================
// M08 - PRUEBAS DE INTEGRACIÓN DE LA CREACIÓN DE ÓRDENES (HU-ORD-01, se deshacen siempre)
// Crea órdenes reales en PostgreSQL dentro de transacciones que terminan SIEMPRE con
// ROLLBACK, también las dos que se ejecutan a la vez para probar el consecutivo. Al final
// comprueba que las tablas y el consecutivo quedaron exactamente como estaban.
// Requiere el esquema 3.9 o posterior (`npm run db`) y el seed (`npm run db:seed`).
// Ejecutar: npx tsx src/modules/m08-ordenes/__tests__/m08.integracion-creacion.test.ts
// ==============================================================================

const ID_ADMIN = 1; // usuario del seed con todos los permisos
const ID_CLIENTE = 2; // Cliente Activo del seed
const ID_COTIZACION = 1; // cotización del seed
const INEXISTENTE = 999999;

const registroSilencioso: RegistroAccesosDenegados = { registrarAccesoDenegado: () => undefined };
const notificadorSilencioso: NotificadorEstadoOrden = {
  notificarCambioEstadoOrden: async () => ({ exitoso: true, idEnvio: 'prueba', intentos: 0, mensaje: 'sin envío' }),
};

/** Señal para terminar la transacción con ROLLBACK después de las comprobaciones. */
class DeshacerCambios extends Error {}

function ignorarDeshacer(error: unknown): void {
  if (!(error instanceof DeshacerCambios)) throw error;
}

function pausa(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

/** Solicitud de prueba con el año 2099 en el código SOL para no chocar con datos reales. */
function solicitud(codigoSolicitud: string, cambios: Partial<SolicitudPagoConfirmado> = {}): SolicitudPagoConfirmado {
  return {
    codigoSolicitud,
    idCliente: ID_CLIENTE,
    origen: 'carrito',
    modoEntrega: 'domicilio',
    direccion: 'Calle 45 # 12-34, Bogotá',
    costoEntrega: '12000.00',
    subTotal: '275900.00',
    descuento: '14590.00',
    total: '273310.00',
    baseSinImpuesto: '229672.27',
    importeIva: '43637.73',
    tasaIva: 19,
    lineas: [
      {
        nombreProducto: 'Viniltex Máxima Protección Antibacterial',
        varianteCopia: 'Galón - Azul Océano',
        cantidad: 1,
        precioInicial: '95900.00',
        precioAplicado: '81310.00',
        colorSolicitado: 'Azul Océano',
        idVarianteRef: 2,
        descuentos: [
          { origen: 'Promoción Viniltex', porcentaje: 10, importe: '9590.00' },
          { origen: 'Cupón de bienvenida', importe: 5000 },
        ],
      },
      {
        nombreProducto: 'Pintura Entonada de Carta',
        varianteCopia: 'Galón - Base A',
        cantidad: 1,
        precioInicial: 120000,
        precioAplicado: 120000,
        colorSolicitado: 'Amarillo Sol',
        esEntonado: true,
        baseConsumida: 'Base A - Galón',
      },
      {
        nombreProducto: 'Esmalte Sintético Brillante',
        varianteCopia: 'Cuarto de Galón - Rojo Colonial',
        cantidad: 2,
        precioInicial: 30000,
        precioAplicado: 30000,
        idVarianteRef: 9999, // no existe: producto retirado del catálogo
      },
    ],
    confirmacion: { medio: 'pasarela', transaccionId: `TRX-${codigoSolicitud}`, montoConfirmado: '273310.00' },
    ...cambios,
  };
}

function crear(conexion: Kysely<Database>, datos: SolicitudPagoConfirmado): Promise<ResultadoCreacionOrden> {
  return new CreacionOrdenService(new OrdenesRepository(conexion), notificadorSilencioso).crearDesdePagoConfirmado(datos);
}

async function valorConsecutivo(conexion: Kysely<Database>): Promise<number> {
  const fila = await conexion
    .selectFrom('consecutivo')
    .select('ultimo_valor')
    .where('nombre', '=', 'orden')
    .executeTakeFirst();
  return Number(fila?.ultimo_valor ?? 0);
}

/** Filas de las tablas que toca la creación, para comprobar que nada quedó escrito. */
async function huella(conexion: Kysely<Database>): Promise<string> {
  const r = await sql<{ huella: string }>`
    SELECT concat_ws('/',
      (SELECT count(*) FROM orden), (SELECT count(*) FROM linea_orden),
      (SELECT count(*) FROM linea_orden_descuento), (SELECT count(*) FROM historial_estado_orden),
      (SELECT coalesce(max(ultimo_valor), 0) FROM consecutivo WHERE nombre = 'orden')) AS huella
  `.execute(conexion);
  return r.rows[0]?.huella ?? '';
}

async function ejecutarPruebasCreacionM08(): Promise<void> {
  console.log('🚀 Iniciando pruebas de creación de órdenes de M08 contra PostgreSQL (todo se deshace al final)...\n');

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
    const tablaConsecutivo = await sql<{ existe: boolean }>`SELECT to_regclass('consecutivo') IS NOT NULL AS existe`.execute(db);
    if (!tablaConsecutivo.rows[0]?.existe) {
      console.error('💥 La base no tiene el esquema 3.9 (falta la tabla consecutivo). Ejecuta npm run db y npm run db:seed.');
      process.exitCode = 1;
      return;
    }

    const huellaInicial = await huella(db);
    const inicial = await valorConsecutivo(db);
    const codigos = new CodigoPedidoService();
    const esperado = (n: number): string => codigos.formatear(n, new Date());

    // --- Creación, copia histórica e idempotencia (una transacción, ROLLBACK) ---------
    await db
      .transaction()
      .execute(async (trx) => {
        const consultas = new OrdenesService(new OrdenesRepository(trx), registroSilencioso);

        const r1 = await crear(trx, solicitud('SOL-2099-90001'));
        assert(
          r1.creada && r1.codigo === esperado(inicial + 1) && r1.estado === 'orden_confirmada',
          `CA-ORD-01-01: la orden se crea con el código siguiente del consecutivo (${r1.codigo})`
        );

        const d = await consultas.detallePedidoParaPersonal(r1.codigo);
        const [l1, l2, l3] = d.lineas;
        assert(
          d.codigo_solicitud === 'SOL-2099-90001' &&
            d.modo_entrega === 'domicilio' &&
            d.direccion === 'Calle 45 # 12-34, Bogotá' &&
            d.total === '273310.00' &&
            d.costo_entrega === '12000.00' &&
            d.tasa_iva === '19.00' &&
            d.id_cliente === ID_CLIENTE,
          'D07: la cabecera guardada es la copia exacta de la solicitud'
        );
        assert(
          l1?.descuentos.map((x) => `${x.orden}:${x.porcentaje}:${x.importe}`).join('|') === '1:10.00:9590.00|2:null:5000.00' &&
            l2?.es_entonado === true &&
            l2.base_consumida === 'Base A - Galón' &&
            l3?.cantidad === 2 &&
            l3.retirado === true &&
            l1.retirado === false,
          'RF-ORD-02-01/02: líneas, descuentos en orden, entonado y producto retirado quedan como se cobraron'
        );
        assert(
          d.historial.length === 1 &&
            d.historial[0]?.estado_anterior === null &&
            d.historial[0]?.estado_nuevo === 'orden_confirmada' &&
            d.historial[0]?.autor === null &&
            d.transiciones_permitidas.join() === 'revision_disponibilidad',
          'CA-ORD-03-04: la orden nace con su primer registro de historial, hecho por el sistema'
        );

        const cruda = await sql<{ fecha: string; hoy: string; transaccion: string | null; referencia: string | null }>`
          SELECT o.fecha::text AS fecha,
                 to_char(now() AT TIME ZONE 'America/Bogota', 'YYYY-MM-DD') AS hoy,
                 o.transaccion_pago_id AS transaccion, h.referencia_externa AS referencia
          FROM orden o JOIN historial_estado_orden h ON h.id_orden = o.id_orden
          WHERE o.codigo_visible = ${r1.codigo}
        `.execute(trx);
        const fila = cruda.rows[0];
        assert(
          fila?.fecha === fila?.hoy && fila?.transaccion === 'TRX-SOL-2099-90001' && fila?.referencia === 'TRX-SOL-2099-90001',
          'CA-ORD-06-01: la fecha es la de Colombia y la transacción de la pasarela queda registrada'
        );

        const repetida = await crear(trx, solicitud('SOL-2099-90001'));
        assert(
          !repetida.creada && repetida.codigo === r1.codigo && (await valorConsecutivo(trx)) === inicial + 1,
          'CA-ORD-01-05: la confirmación repetida devuelve la misma orden y no consume número'
        );

        const r2 = await crear(
          trx,
          solicitud('SOL-2099-90002', {
            modoEntrega: 'recogida',
            direccion: null,
            costoEntrega: 0,
            total: '261310.00',
            confirmacion: { medio: 'verificacion_manual', idEmpleado: ID_ADMIN, referencia: 'Comprobante 7781', montoConfirmado: '261310.00' },
          })
        );
        const d2 = await consultas.detallePedidoParaPersonal(r2.codigo);
        assert(
          r2.codigo === esperado(inicial + 2) &&
            d2.modo_entrega === 'recogida' &&
            d2.direccion === null &&
            d2.historial[0]?.autor === 'Admin Pruebas' &&
            d2.transiciones_permitidas.join() === 'revision_disponibilidad',
          'CA-ORD-01-03 / RF-ORD-06-04: el pago verificado por un empleado crea la orden con el número siguiente'
        );

        const r3 = await crear(trx, solicitud('SOL-2099-90003', { origen: 'cotizacion', idCotizacion: ID_COTIZACION }));
        const cotizacion = await trx
          .selectFrom('orden')
          .select(['origen', 'id_cotizacion', 'carrito_o_cotizacion'])
          .where('codigo_visible', '=', r3.codigo)
          .executeTakeFirst();
        assert(
          cotizacion?.origen === 'cotizacion' &&
            cotizacion.id_cotizacion === ID_COTIZACION &&
            cotizacion.carrito_o_cotizacion === 'cotizacion_aprobada',
          'CA-ORD-01-04: la orden registra la cotización de la que procede'
        );

        const cliente = await consultas.detallePedidoDeCliente(ID_CLIENTE, r1.codigo, 'prueba');
        const bandeja = await consultas.listarOrdenesParaPersonal({ codigo: r1.codigo }, undefined, undefined);
        assert(
          cliente.historial.length === 1 &&
            cliente.lineas.length === 3 &&
            bandeja.items[0]?.cliente === 'Cliente Activo' &&
            bandeja.items[0]?.modo_entrega === 'domicilio' &&
            bandeja.items[0]?.dias_esperando === 0,
          'HU-ORD-04 / HU-ORD-05: la orden nueva aparece al instante para el cliente y en la bandeja'
        );

        throw new DeshacerCambios();
      })
      .catch(ignorarDeshacer);

    // --- Referencias inexistentes: cada intento en su propia transacción ---------------
    const casos: Array<[string, SolicitudPagoConfirmado, string]> = [
      ['un cliente', solicitud('SOL-2099-90010', { idCliente: INEXISTENTE }), 'El cliente de la solicitud no existe'],
      [
        'una cotización',
        solicitud('SOL-2099-90011', { origen: 'cotizacion', idCotizacion: INEXISTENTE }),
        'La cotización de origen no existe',
      ],
      [
        'un empleado',
        solicitud('SOL-2099-90012', {
          confirmacion: { medio: 'verificacion_manual', idEmpleado: INEXISTENTE, montoConfirmado: '273310.00' },
        }),
        'El empleado que verificó el pago no existe',
      ],
    ];
    for (const [nombre, datos, mensaje] of casos) {
      let error: unknown;
      try {
        await crear(db, datos);
      } catch (e) {
        error = e;
      }
      assert(
        error instanceof AppError && error.code === 'REFERENCIA_INEXISTENTE' && error.message === mensaje,
        `HU-ORD-01: ${nombre} inexistente se rechaza con un mensaje claro`
      );
    }
    assert(
      (await huella(db)) === huellaInicial,
      'CA-ORD-01-06 / RF-ORD-06-04: un intento fallido no deja orden, líneas ni historial, y no gasta número'
    );

    // --- Dos creaciones a la vez: la segunda espera y, si la primera se deshace, toma su número
    let avisarCreadaT1: () => void = () => undefined;
    const t1Creada = new Promise<void>((resolver) => {
      avisarCreadaT1 = resolver;
    });
    let codigoT1 = '';
    let codigoT2 = '';
    let finT1 = 0;
    let finCreacionT2 = 0;
    const t1 = db
      .transaction()
      .execute(async (trx) => {
        codigoT1 = (await crear(trx, solicitud('SOL-2099-90020'))).codigo;
        avisarCreadaT1();
        await pausa(600);
        finT1 = Date.now();
        throw new DeshacerCambios();
      })
      .catch((error: unknown) => {
        avisarCreadaT1();
        ignorarDeshacer(error);
      });
    await t1Creada;
    const t2 = db
      .transaction()
      .execute(async (trx) => {
        codigoT2 = (await crear(trx, solicitud('SOL-2099-90021'))).codigo;
        finCreacionT2 = Date.now();
        throw new DeshacerCambios();
      })
      .catch(ignorarDeshacer);
    await Promise.all([t1, t2]);
    assert(
      codigoT1 === esperado(inicial + 1) && finCreacionT2 >= finT1,
      'RF-ORD-06-04: dos creaciones simultáneas no toman el mismo número: la segunda espera a la primera'
    );
    assert(
      codigoT2 === codigoT1,
      'RF-ORD-06-04: si la primera se deshace, la segunda usa ese número y el consecutivo no deja huecos'
    );

    assert(
      (await huella(db)) === huellaInicial,
      'ROLLBACK: órdenes, líneas, descuentos, historial y consecutivo quedan exactamente como estaban'
    );

    console.log(`\n======================================================`);
    console.log(`🎯 RESULTADOS: Superadas: ${superadas} | Fallidas: ${fallidas}`);
    console.log(`======================================================\n`);
    if (fallidas > 0) process.exitCode = 1;
  } catch (err) {
    console.error('💥 Excepción no controlada durante las pruebas de creación:', err);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}

void ejecutarPruebasCreacionM08();
