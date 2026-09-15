import { EnumEstadoOrden } from '../../../core/db/types';
import { AppError } from '../../../core/middlewares/errorHandler';
import { MotivoDenegacion } from '../../m20-seguridad/interfaces/seguridad.interfaces';
import { OrdenesService } from '../services/ordenes.service';
import { OrdenesRepository } from '../repositories/ordenes.repository';
import { CodigoOrdenDto } from '../dtos/ordenes.dto';
import {
  CabeceraOrden,
  FilaLineaOrden,
  FilaResumenOrden,
  RegistroAccesosDenegados,
} from '../interfaces/m08.interfaces';

// ==============================================================================
// M08 - SUITE DE VALIDACIÓN DE CRITERIOS DE ACEPTACIÓN (HU-ORD-02/04/05/06/07)
// Repositorio falso en memoria: valida la lógica del servicio sin BD real
// (titularidad, agrupación, forma de la respuesta). Las consultas SQL se validan en QA.
// Ejecutar: npx tsx src/modules/m08-ordenes/__tests__/m08.test.ts
// ==============================================================================

class RepoFake extends OrdenesRepository {
  public llamadasListar: Array<{ idUsuario: number; termino: string | undefined }> = [];

  constructor(
    private readonly ordenes: CabeceraOrden[],
    private readonly lineas: Record<number, FilaLineaOrden[]> = {}
  ) {
    super(undefined as never); // no se usa la BD en el fake
  }

  override async buscarPorCodigo(codigo: string): Promise<CabeceraOrden | undefined> {
    return this.ordenes.find((o) => o.codigo_visible === codigo);
  }

  override async listarLineas(idOrden: number): Promise<FilaLineaOrden[]> {
    return this.lineas[idOrden] ?? [];
  }

  override async listarDeCliente(idUsuario: number, termino: string | undefined): Promise<FilaResumenOrden[]> {
    this.llamadasListar.push({ idUsuario, termino });
    return this.ordenes
      .filter((o) => o.id_usuario === idUsuario)
      .map((o) => ({ codigo_visible: o.codigo_visible, fecha: o.fecha, total: o.total, estado: o.estado }));
  }
}

class RegistroFake implements RegistroAccesosDenegados {
  public denegados: Array<{ idUsuario: number | null; operacion: string; motivo: MotivoDenegacion }> = [];

  registrarAccesoDenegado(idUsuario: number | null, operacion: string, motivo: MotivoDenegacion): void {
    this.denegados.push({ idUsuario, operacion, motivo });
  }
}

function orden(id: number, idUsuario: number, estado: EnumEstadoOrden): CabeceraOrden {
  return {
    id_orden: id,
    codigo_visible: `ORD-2026-${String(id).padStart(4, '0')}`,
    id_usuario: idUsuario,
    origen: 'carrito',
    estado,
    direccion: 'Calle 45 # 12-34, Bogotá',
    sub_total: '171800.00',
    descuento: '0.00',
    total: '171800.00',
    observaciones: null,
    fecha: new Date(2026, 8, 1),
  };
}

async function capturarError(accion: () => Promise<unknown>): Promise<unknown> {
  try {
    await accion();
    return undefined;
  } catch (error) {
    return error;
  }
}

function esNoEncontrado(error: unknown): boolean {
  return error instanceof AppError && error.statusCode === 404 && error.code === 'NOT_FOUND';
}

async function ejecutarPruebasM08(): Promise<void> {
  console.log('🚀 Iniciando suite de validación técnica de M08: Orden de venta (consultas)...\n');

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
    // --- HU-ORD-07: sección de pedidos del cliente ----------------------------

    // CA-ORD-07-01: listado separado en curso / finalizados con identificador, fecha, total y estado.
    {
      const repo = new RepoFake([orden(1, 2, 'pagado'), orden(2, 2, 'entregado'), orden(3, 2, 'en_preparacion')]);
      const pedidos = await new OrdenesService(repo, new RegistroFake()).listarPedidosDeCliente(2, undefined);
      const primero = pedidos.en_curso[0];
      assert(
        pedidos.en_curso.length === 2 && pedidos.finalizados.length === 1,
        'CA-ORD-07-01: los pedidos se separan entre en curso y finalizados'
      );
      assert(
        primero !== undefined &&
          primero.codigo === 'ORD-2026-0001' &&
          primero.fecha === '2026-09-01' &&
          primero.total === '171800.00' &&
          primero.estado === 'pagado',
        'CA-ORD-07-01: cada pedido muestra identificador, fecha, total y estado'
      );
    }

    // CA-ORD-07-02: un pedido Entregado aparece entre los finalizados (también el cancelado).
    {
      const repo = new RepoFake([orden(1, 2, 'entregado'), orden(2, 2, 'cancelado')]);
      const pedidos = await new OrdenesService(repo, new RegistroFake()).listarPedidosDeCliente(2, undefined);
      assert(
        pedidos.en_curso.length === 0 && pedidos.finalizados.length === 2,
        'CA-ORD-07-02: entregado y cancelado se listan como finalizados'
      );
    }

    // CA-ORD-07-03: el texto del buscador se recorta y llega al repositorio; vacío lista todo.
    {
      const repo = new RepoFake([]);
      const servicio = new OrdenesService(repo, new RegistroFake());
      await servicio.listarPedidosDeCliente(2, '  viniltex ');
      await servicio.listarPedidosDeCliente(2, '   ');
      assert(repo.llamadasListar[0]?.termino === 'viniltex', 'CA-ORD-07-03: el término del buscador se recorta');
      assert(repo.llamadasListar[1]?.termino === undefined, 'CA-ORD-07-03: un buscador en blanco lista todos los pedidos');
    }

    // CA-SEG-06-05: el listado se pide siempre acotado al cliente autenticado.
    {
      const repo = new RepoFake([orden(1, 2, 'pagado'), orden(2, 4, 'pagado')]);
      const pedidos = await new OrdenesService(repo, new RegistroFake()).listarPedidosDeCliente(2, undefined);
      assert(
        repo.llamadasListar[0]?.idUsuario === 2 && pedidos.en_curso.length === 1,
        'CA-SEG-06-05: el listado no incluye pedidos de otros clientes'
      );
    }

    // --- HU-ORD-04: detalle de un pedido ------------------------------------

    // CA-ORD-04-01 / CA-ORD-04-02: productos, variante (con su color), cantidades, precios, total y estado.
    {
      const repo = new RepoFake([orden(1, 2, 'pagado')], {
        1: [
          {
            nombre_producto: 'Viniltex Antibacterial',
            variante_copia: 'Galón - Azul Océano (entonado)',
            precio_aplicado: '85900.00',
            cantidad: 2,
          },
        ],
      });
      const detalle = await new OrdenesService(repo, new RegistroFake()).detallePedidoDeCliente(2, 'ORD-2026-0001', 'GET /test');
      const linea = detalle.lineas[0];
      assert(
        linea !== undefined &&
          linea.producto === 'Viniltex Antibacterial' &&
          linea.cantidad === 2 &&
          linea.precio_aplicado === '85900.00' &&
          detalle.total === '171800.00' &&
          detalle.estado === 'pagado',
        'CA-ORD-04-01: el detalle muestra productos, cantidades, precios aplicados, total y estado'
      );
      assert(linea?.variante === 'Galón - Azul Océano (entonado)', 'CA-ORD-04-02: el detalle muestra la variante y el color pedidos');
    }

    // CA-ORD-02-01 / CA-ORD-02-04: el detalle devuelve los datos copiados en la compra, sin consultar el catálogo.
    {
      const repo = new RepoFake([orden(1, 2, 'entregado')], {
        1: [{ nombre_producto: 'Producto retirado', variante_copia: 'Cuarto', precio_aplicado: '10000.00', cantidad: 1 }],
      });
      const detalle = await new OrdenesService(repo, new RegistroFake()).detallePedidoDeCliente(2, 'ORD-2026-0001', 'GET /test');
      assert(
        detalle.lineas[0]?.producto === 'Producto retirado' && detalle.lineas[0]?.precio_aplicado === '10000.00',
        'CA-ORD-02-01 / CA-ORD-02-04: la línea conserva nombre y precio tal como se compraron'
      );
    }

    // CA-ORD-04-03: la orden ajena se rechaza y el intento queda registrado (CA-SEG-03-05).
    {
      const registro = new RegistroFake();
      const repo = new RepoFake([orden(1, 4, 'pagado')]);
      const error = await capturarError(() =>
        new OrdenesService(repo, registro).detallePedidoDeCliente(2, 'ORD-2026-0001', 'GET /api/ordenes/mis-pedidos/ORD-2026-0001')
      );
      assert(esNoEncontrado(error), 'CA-ORD-04-03: el detalle de una orden ajena se rechaza');
      assert(
        registro.denegados.length === 1 &&
          registro.denegados[0]?.idUsuario === 2 &&
          registro.denegados[0]?.motivo === 'TITULARIDAD_AJENA',
        'CA-SEG-03-05: el acceso denegado queda registrado con usuario y motivo'
      );
    }

    // CA-SEG-03-06: una orden inexistente responde igual que una ajena.
    {
      const repo = new RepoFake([orden(1, 4, 'pagado')]);
      const servicio = new OrdenesService(repo, new RegistroFake());
      const ajena = await capturarError(() => servicio.detallePedidoDeCliente(2, 'ORD-2026-0001', 'GET /test'));
      const inexistente = await capturarError(() => servicio.detallePedidoDeCliente(2, 'ORD-2026-9999', 'GET /test'));
      assert(
        esNoEncontrado(ajena) &&
          esNoEncontrado(inexistente) &&
          (ajena as AppError).message === (inexistente as AppError).message,
        'CA-SEG-03-06: orden ajena e inexistente dan respuestas indistinguibles'
      );
    }

    // HU-SEG-06: el detalle del cliente no expone clave primaria, titular ni datos de pago.
    {
      const repo = new RepoFake([orden(1, 2, 'pagado')]);
      const detalle = await new OrdenesService(repo, new RegistroFake()).detallePedidoDeCliente(2, 'ORD-2026-0001', 'GET /test');
      const claves = Object.keys(detalle);
      assert(
        !claves.includes('id_orden') && !claves.includes('id_usuario') && !claves.includes('transaccion_pago_id'),
        'HU-SEG-06: el detalle no incluye id interno, id del cliente ni transacción de pago'
      );
    }

    // --- HU-ORD-05 / HU-ORD-06: consulta por identificador --------------------

    // CA-ORD-05-04 / CA-ORD-06-02: el identificador lleva a la orden correcta y a ninguna otra.
    {
      const repo = new RepoFake([orden(1, 2, 'pagado'), orden(2, 4, 'en_preparacion')]);
      const servicio = new OrdenesService(repo, new RegistroFake());
      const detalle = await servicio.detallePedidoParaPersonal('ORD-2026-0002');
      assert(
        detalle.codigo === 'ORD-2026-0002' && detalle.id_cliente === 4 && detalle.estado === 'en_preparacion',
        'CA-ORD-05-04 / CA-ORD-06-02: buscar por identificador lleva a la orden correcta'
      );
    }

    // CA-ORD-05-04: un identificador inexistente responde como recurso no encontrado.
    {
      const repo = new RepoFake([]);
      const error = await capturarError(() => new OrdenesService(repo, new RegistroFake()).detallePedidoParaPersonal('NO-EXISTE'));
      assert(esNoEncontrado(error), 'CA-ORD-05-04: identificador inexistente responde 404 genérico');
    }

    // RF-ORD-06-01: el código visible se valida por longitud de columna (VARCHAR 50) y no admite vacío.
    {
      assert(CodigoOrdenDto.safeParse({ codigo: ' ORD-2026-0001 ' }).success, 'RF-ORD-06-01: un código válido se acepta recortado');
      assert(!CodigoOrdenDto.safeParse({ codigo: '   ' }).success, 'RF-ORD-06-01: un código vacío se rechaza');
      assert(!CodigoOrdenDto.safeParse({ codigo: 'X'.repeat(51) }).success, 'RF-ORD-06-01: un código de más de 50 caracteres se rechaza');
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

void ejecutarPruebasM08();
