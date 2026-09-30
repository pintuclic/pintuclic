import { sql } from 'kysely';
import { db } from '../../../core/db/connection';
import { AppError } from '../../../core/middlewares/errorHandler';
import { OrdenesRepository } from '../repositories/ordenes.repository';
import { OrdenesService } from '../services/ordenes.service';
import { RegistroAccesosDenegados } from '../interfaces/m08.interfaces';

// ==============================================================================
// M08 - PRUEBAS DE INTEGRACIÓN CONTRA POSTGRESQL (solo lectura)
// Ejecuta las consultas reales del repositorio contra la base de backend/.env con
// los datos de bd/sql/seed_pintuclic.sql. No inserta, modifica ni borra nada.
// Requiere la base creada con `npm run db` y sembrada con `npm run db:seed`.
// Depende de las órdenes del seed: ORD-2026-0001 (cliente 2) y ORD-2026-0002 (cliente 4).
// Ejecutar: npx tsx src/modules/m08-ordenes/__tests__/m08.integracion.test.ts
// ==============================================================================

const ORDEN_CLIENTE_2 = 'ORD-2026-0001';
const ORDEN_CLIENTE_4 = 'ORD-2026-0002';

const registroSilencioso: RegistroAccesosDenegados = { registrarAccesoDenegado: () => undefined };

/** AAAA-MM-DD con la fecha local, igual que devuelve `pg` una columna DATE. */
function aFechaTexto(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

async function ejecutarPruebasIntegracionM08(): Promise<void> {
  console.log('🚀 Iniciando pruebas de integración de M08 contra PostgreSQL (solo lectura)...\n');

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
      console.error('   Comprueba que el servicio esté en marcha y que la base esté creada y sembrada.');
      console.error('  ', error instanceof Error ? error.message : error);
      process.exitCode = 1;
      return;
    }

    const repo = new OrdenesRepository(db);
    const servicio = new OrdenesService(repo, registroSilencioso);

    const orden2 = await repo.buscarPorCodigo(ORDEN_CLIENTE_2);
    const orden4 = await repo.buscarPorCodigo(ORDEN_CLIENTE_4);
    if (!orden2 || !orden4) {
      console.error(`💥 Faltan las órdenes del seed (${ORDEN_CLIENTE_2}, ${ORDEN_CLIENTE_4}). Ejecuta npm run db:seed.`);
      process.exitCode = 1;
      return;
    }

    // --- Repositorio: consultas del cliente -------------------------------------

    assert(orden2.id_usuario === 2 && orden4.id_usuario === 4, 'buscarPorCodigo: devuelve la orden exacta con su titular');
    assert((await repo.buscarPorCodigo('NO-EXISTE')) === undefined, 'buscarPorCodigo: un código inexistente no devuelve nada');

    const lineas = await repo.listarLineas(orden2.id_orden);
    assert(
      lineas.length > 0 && lineas.every((l) => l.cantidad > 0 && l.nombre_producto.length > 0),
      'listarLineas: lee la copia histórica de las líneas desde linea_orden'
    );

    const delCliente2 = (await repo.listarDeCliente(2, undefined)).map((o) => o.codigo_visible);
    assert(
      delCliente2.includes(ORDEN_CLIENTE_2) && !delCliente2.includes(ORDEN_CLIENTE_4),
      'CA-SEG-06-05: listarDeCliente solo devuelve órdenes del cliente indicado'
    );

    const primerProducto = lineas[0]?.nombre_producto ?? '';
    const porProducto = (await repo.listarDeCliente(2, primerProducto.slice(0, 6).toUpperCase())).map((o) => o.codigo_visible);
    assert(
      porProducto.includes(ORDEN_CLIENTE_2),
      'CA-ORD-07-03: el buscador encuentra por nombre de producto sin distinguir mayúsculas'
    );
    assert(
      (await repo.listarDeCliente(2, '%')).length === 0 && (await repo.listarDeCliente(2, '_')).length === 0,
      'CA-ORD-07-03: los comodines % y _ se buscan literalmente, no como patrón'
    );

    // --- Repositorio: listado del personal --------------------------------------

    const deCliente4 = await repo.listarParaPersonal({ idCliente: 4 }, 100, 0);
    assert(
      deCliente4.length > 0 && deCliente4.every((o) => o.id_usuario === 4),
      'HU-ORD-05 / HU-ORD-11: el filtro por cliente devuelve solo sus órdenes'
    );

    const porEstado = await repo.listarParaPersonal({ estado: orden2.estado }, 100, 0);
    assert(
      porEstado.length > 0 && porEstado.every((o) => o.estado === orden2.estado),
      'HU-ORD-05 (bandeja): el filtro por estado devuelve solo órdenes de ese estado'
    );

    const dia = aFechaTexto(orden2.fecha);
    const diaSiguiente = aFechaTexto(new Date(orden2.fecha.getFullYear(), orden2.fecha.getMonth(), orden2.fecha.getDate() + 1));
    const mismoDia = (await repo.listarParaPersonal({ desde: dia, hasta: dia }, 100, 0)).map((o) => o.codigo_visible);
    const desdeManana = (await repo.listarParaPersonal({ desde: diaSiguiente }, 100, 0)).map((o) => o.codigo_visible);
    assert(
      mismoDia.includes(ORDEN_CLIENTE_2) && !desdeManana.includes(ORDEN_CLIENTE_2),
      'HU-ORD-05 (bandeja): el periodo incluye sus extremos y excluye lo que queda fuera'
    );

    const porCodigo = await repo.listarParaPersonal({ codigo: ORDEN_CLIENTE_2.slice(-4) }, 100, 0);
    assert(
      porCodigo.some((o) => o.codigo_visible === ORDEN_CLIENTE_2),
      'CA-ORD-08-01: el filtro por identificador encuentra la orden'
    );

    const filtrosConteo = { idCliente: 2 };
    assert(
      (await repo.contarParaPersonal(filtrosConteo)) === (await repo.listarParaPersonal(filtrosConteo, 100, 0)).length,
      'HU-ORD-05: el total coincide con las filas que devuelve el listado'
    );

    // --- Servicio sobre datos reales ---------------------------------------------

    const detalle = await servicio.detallePedidoDeCliente(2, ORDEN_CLIENTE_2, 'GET /integracion');
    assert(detalle.codigo === ORDEN_CLIENTE_2 && detalle.lineas.length === lineas.length, 'HU-ORD-04: el detalle propio se arma con datos reales');

    let ajenaRechazada = false;
    try {
      await servicio.detallePedidoDeCliente(2, ORDEN_CLIENTE_4, 'GET /integracion');
    } catch (error) {
      ajenaRechazada = error instanceof AppError && error.statusCode === 404;
    }
    assert(ajenaRechazada, 'CA-ORD-04-03: la orden de otro cliente responde 404 con datos reales');

    // --- Definiciones del 27/09: búsqueda, bandeja, historial y contacto -------------

    const porCorreo = await repo.listarParaPersonal({ correoCliente: 'CLIENTE@PINTUCLIC.CO' }, 100, 0);
    assert(
      porCorreo.length > 0 && porCorreo.every((o) => o.id_usuario === 2),
      'CA-ORD-08-02: el correo del cliente, escrito en mayúsculas, encuentra sus pedidos'
    );
    assert(
      (await repo.listarParaPersonal({ correoCliente: 'nadie@ejemplo.co' }, 100, 0)).length === 0,
      'CA-ORD-08-02: un correo sin cuenta no devuelve pedidos'
    );

    const contacto2 = await repo.buscarContactoCliente(2);
    const telefono2 = (contacto2?.telefono ?? '').replace(/\s+/g, '');
    const porTelefono = telefono2 ? await repo.listarParaPersonal({ telefonoCliente: telefono2 }, 100, 0) : [];
    assert(
      contacto2?.correo === 'cliente@pintuclic.co' && porTelefono.length > 0 && porTelefono.every((o) => o.id_usuario === 2),
      'HU-ORD-08: el teléfono del cliente encuentra sus pedidos'
    );

    const recientes = (await repo.listarParaPersonal({}, 100, 0, 'recientes')).map((o) => o.codigo_visible);
    const antiguas = (await repo.listarParaPersonal({}, 100, 0, 'antiguedad')).map((o) => o.codigo_visible);
    assert(
      recientes.length > 1 && antiguas.join(',') === [...recientes].reverse().join(','),
      'CA-ORD-05-07: el orden por antigüedad es exactamente el inverso del de recientes'
    );

    const conteo = await repo.contarPorEstado();
    assert(
      conteo.reduce((suma, fila) => suma + fila.total, 0) === (await repo.contarParaPersonal({})),
      'CA-ORD-05-05: los contadores por estado suman el total de órdenes'
    );

    const sinActual = (await repo.listarParaPersonal({ idCliente: 2, excluirIdOrden: orden2.id_orden }, 100, 0)).map(
      (o) => o.codigo_visible
    );
    assert(!sinActual.includes(ORDEN_CLIENTE_2), 'CA-ORD-11-01: el historial abierto desde una orden no la repite');

    const detallePersonal = await servicio.detallePedidoParaPersonal(ORDEN_CLIENTE_4);
    assert(
      detallePersonal.id_cliente === 4 && detallePersonal.cliente?.correo === 'contacto@pinturasvalle.co',
      'CA-ORD-09-01: el detalle del personal trae el contacto real del cliente'
    );

    // --- Esquema 3.8: historial, notas y contactos del seed (v0.3.34.0) ---------------

    const historial4 = await repo.listarHistorial(orden4.id_orden);
    assert(
      historial4.length >= 3 &&
        historial4[0]?.estado_anterior === null &&
        historial4.every((c, i) => i === 0 || (historial4[i - 1]?.fecha.getTime() ?? 0) <= c.fecha.getTime()),
      'CA-ORD-09-02: el historial se lee en orden cronológico y empieza con el nacimiento de la orden'
    );
    assert(
      historial4.some((c) => c.autor === 'Admin Pruebas') && historial4.some((c) => c.autor === null),
      'CA-ORD-09-02: el historial trae el nombre del autor y null en los cambios automáticos del sistema'
    );

    const notas4 = await repo.listarNotas(orden4.id_orden);
    const contactos4 = await repo.listarContactos(orden4.id_orden);
    assert(
      notas4.length >= 1 && notas4.every((n) => n.autor.length > 0 && n.texto.length > 0),
      'CA-ORD-10-02: las notas se leen con el nombre de quien las escribió'
    );
    assert(
      contactos4.length >= 1 && contactos4.every((c) => c.medio.length > 0 && c.autor.length > 0),
      'CA-ORD-09-03: los contactos registrados se leen con su medio y su autor'
    );

    const conCambio = (await repo.listarParaPersonal({ idCliente: 4 }, 100, 0)).find((o) => o.codigo_visible === ORDEN_CLIENTE_4);
    const ultimoHistorial = historial4[historial4.length - 1]?.fecha.getTime();
    assert(
      conCambio?.ultimo_cambio instanceof Date && conCambio.ultimo_cambio.getTime() === ultimoHistorial,
      'CA-ORD-05-07: el listado trae el momento del último cambio de estado'
    );

    assert(
      detallePersonal.historial.length === historial4.length &&
        detallePersonal.notas.length === notas4.length &&
        detallePersonal.contactos.length === contactos4.length &&
        detallePersonal.transiciones_permitidas.length > 0,
      'HU-ORD-09: el detalle del personal reúne historial, notas, contactos y siguientes estados'
    );

    const vistaCliente4 = await servicio.detallePedidoDeCliente(4, ORDEN_CLIENTE_4, 'GET /integracion');
    assert(
      !('notas' in vistaCliente4) && !('contactos' in vistaCliente4),
      'CA-ORD-10-01: la vista del cliente no incluye notas ni contactos'
    );
    assert(
      vistaCliente4.historial.length === historial4.length &&
        vistaCliente4.historial.every((h) => Object.keys(h).join(',') === 'estado,fecha') &&
        !JSON.stringify(vistaCliente4.historial).includes('Admin'),
      'RF-ORD-04-01: el cliente ve la historia de estados con su fecha, sin el autor'
    );

    const filaConNombre = (await repo.listarParaPersonal({ idCliente: 4 }, 100, 0))[0];
    assert(
      filaConNombre?.nombre_cliente === 'Pinturas del Valle S.A.S.',
      'RF-ORD-05-05: la bandeja trae el nombre real del cliente'
    );

    // --- Esquema 3.9: copia histórica completa (ORD-2026-0003 del seed) ---------------

    const ORDEN_COPIA = 'ORD-2026-0003';
    if (!(await repo.buscarPorCodigo(ORDEN_COPIA))) {
      assert(false, `Falta ${ORDEN_COPIA} del seed v3.9: ejecuta npm run db y npm run db:seed`);
    } else {
      const copiaCliente = await servicio.detallePedidoDeCliente(2, ORDEN_COPIA, 'GET /integracion');
      const copiaPersonal = await servicio.detallePedidoParaPersonal(ORDEN_COPIA);
      const [vigente, entonada, retirada] = copiaCliente.lineas;

      assert(
        copiaCliente.modo_entrega === 'recogida' &&
          copiaCliente.direccion === null &&
          copiaCliente.codigo_solicitud === 'SOL-2026-00001' &&
          copiaCliente.costo_entrega === '0.00',
        'CA-ORD-04-01: la orden de recogida trae su modo de entrega, sin dirección, y la solicitud de origen'
      );
      assert(
        copiaCliente.tasa_iva === '19.00' && copiaCliente.base_sin_impuesto === '219588.24' && copiaCliente.importe_iva === '41721.76',
        'CA-ORD-02-05: la orden conserva la tasa y los importes de IVA con que se cobró'
      );
      assert(
        vigente?.precio_inicial === '95900.00' &&
          vigente.descuentos.map((d) => `${d.orden}:${d.origen}:${d.importe}`).join(' | ') ===
            '1:Promoción Viniltex:9590.00 | 2:Cupón de bienvenida:5000.00' &&
          vigente.descuentos[1]?.porcentaje === null,
        'CA-ORD-02-02: los descuentos se leen con su origen, importe y orden de aplicación'
      );
      assert(
        entonada?.es_entonado === true && entonada.color_solicitado === 'Amarillo Sol',
        'CA-ORD-04-02: la línea entonada trae el color pedido'
      );
      assert(
        vigente?.retirado === false && vigente.id_producto === 1 && retirada?.retirado === true && retirada.id_producto === null,
        'CA-ORD-04-04: la variante inexistente se marca como retirada y sin enlace; la vigente enlaza a su producto'
      );
      assert(
        copiaPersonal.lineas[1]?.base_consumida === 'Base A - Galón' && copiaCliente.lineas.every((l) => !('base_consumida' in l)),
        'RF-ORD-09-01: la base que consume la línea entonada solo llega al personal'
      );

      const filaCopia = (await repo.listarParaPersonal({ codigo: ORDEN_COPIA }, 10, 0))[0];
      assert(filaCopia?.modo_entrega === 'recogida', 'RF-ORD-05-05: la bandeja trae el modo de entrega');
    }

    console.log(`\n======================================================`);
    console.log(`🎯 RESULTADOS: Superadas: ${superadas} | Fallidas: ${fallidas}`);
    console.log(`======================================================\n`);
    if (fallidas > 0) process.exitCode = 1;
  } catch (err) {
    console.error('💥 Excepción no controlada durante las pruebas de integración:', err);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}

void ejecutarPruebasIntegracionM08();
