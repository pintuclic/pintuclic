import { EnumEstadoOrden } from '../../../core/db/types';
import { AppError } from '../../../core/middlewares/errorHandler';
import { MotivoDenegacion } from '../../m20-seguridad/interfaces/seguridad.interfaces';
import { OrdenesService } from '../services/ordenes.service';
import { CodigoPedidoService } from '../services/codigo-pedido.service';
import { OrdenesRepository } from '../repositories/ordenes.repository';
import { CodigoOrdenDto, ListarOrdenesGestionDto } from '../dtos/ordenes.dto';
import {
  CabeceraOrden,
  ContactoCliente,
  FilaConteoEstado,
  FilaLineaOrden,
  FilaResumenOrden,
  FilaResumenOrdenGestion,
  FiltrosGestionOrdenes,
  OrdenListado,
  RegistroAccesosDenegados,
} from '../interfaces/m08.interfaces';

type UsuarioFake = { readonly id_usuario: number } & ContactoCliente;

/** AAAA-MM-DD con la fecha local, igual que la columna DATE de la orden. */
function aFechaTexto(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

// ==============================================================================
// M08 - SUITE DE VALIDACIÓN DE CRITERIOS DE ACEPTACIÓN (HU-ORD-02/04/05/06/07/08/09/11)
// Repositorio falso en memoria: valida la lógica del servicio sin BD real
// (titularidad, agrupación, forma de la respuesta). Las consultas SQL se validan en QA.
// Ejecutar: npx tsx src/modules/m08-ordenes/__tests__/m08.test.ts
// ==============================================================================

class RepoFake extends OrdenesRepository {
  public llamadasListar: Array<{ idUsuario: number; termino: string | undefined }> = [];

  constructor(
    private readonly ordenes: CabeceraOrden[],
    private readonly lineas: Record<number, FilaLineaOrden[]> = {},
    private readonly usuarios: UsuarioFake[] = []
  ) {
    super(undefined as never); // no se usa la BD en el fake
  }

  override async buscarContactoCliente(idUsuario: number): Promise<ContactoCliente | undefined> {
    const usuario = this.usuarios.find((u) => u.id_usuario === idUsuario);
    return usuario ? { nombre: usuario.nombre, correo: usuario.correo, telefono: usuario.telefono } : undefined;
  }

  override async contarPorEstado(): Promise<FilaConteoEstado[]> {
    const conteo = new Map<EnumEstadoOrden, number>();
    for (const o of this.ordenes) conteo.set(o.estado, (conteo.get(o.estado) ?? 0) + 1);
    return [...conteo].map(([estado, total]) => ({ estado, total }));
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

  public llamadasGestion: Array<{
    filtros: FiltrosGestionOrdenes;
    limite: number;
    offset: number;
    orden: OrdenListado;
  }> = [];

  /**
   * Réplica en memoria de los filtros del SQL: AND entre filtros, periodo con extremos
   * incluidos, correo sin distinguir mayúsculas y teléfono exacto sin espacios.
   */
  private filtrar(f: FiltrosGestionOrdenes): CabeceraOrden[] {
    return this.ordenes.filter((o) => {
      const fecha = aFechaTexto(o.fecha);
      const titular = this.usuarios.find((u) => u.id_usuario === o.id_usuario);
      return (
        (!f.codigo || o.codigo_visible.toLowerCase().includes(f.codigo.toLowerCase())) &&
        (!f.estado || o.estado === f.estado) &&
        (f.idCliente === undefined || o.id_usuario === f.idCliente) &&
        (f.excluirIdOrden === undefined || o.id_orden !== f.excluirIdOrden) &&
        (!f.desde || fecha >= f.desde) &&
        (!f.hasta || fecha <= f.hasta) &&
        (!f.correoCliente || titular?.correo.toLowerCase() === f.correoCliente.toLowerCase()) &&
        (!f.telefonoCliente || (titular?.telefono ?? '').replace(/\s+/g, '') === f.telefonoCliente)
      );
    });
  }

  override async listarParaPersonal(
    filtros: FiltrosGestionOrdenes,
    limite: number,
    offset: number,
    orden: OrdenListado = 'recientes'
  ): Promise<FilaResumenOrdenGestion[]> {
    this.llamadasGestion.push({ filtros, limite, offset, orden });
    const signo = orden === 'antiguedad' ? 1 : -1;
    return this.filtrar(filtros)
      .sort((a, b) => signo * (a.fecha.getTime() - b.fecha.getTime() || a.id_orden - b.id_orden))
      .slice(offset, offset + limite)
      .map((o) => ({
        codigo_visible: o.codigo_visible,
        fecha: o.fecha,
        total: o.total,
        estado: o.estado,
        id_usuario: o.id_usuario,
      }));
  }

  override async contarParaPersonal(filtros: FiltrosGestionOrdenes): Promise<number> {
    return this.filtrar(filtros).length;
  }
}

class RegistroFake implements RegistroAccesosDenegados {
  public denegados: Array<{ idUsuario: number | null; operacion: string; motivo: MotivoDenegacion }> = [];

  registrarAccesoDenegado(idUsuario: number | null, operacion: string, motivo: MotivoDenegacion): void {
    this.denegados.push({ idUsuario, operacion, motivo });
  }
}

function orden(
  id: number,
  idUsuario: number,
  estado: EnumEstadoOrden,
  fecha: Date = new Date(2026, 8, 1)
): CabeceraOrden {
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
    fecha,
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

    // CA-ORD-08-01 / CA-ORD-06-02: el identificador lleva a la orden correcta y a ninguna otra.
    {
      const repo = new RepoFake([orden(1, 2, 'pagado'), orden(2, 4, 'en_preparacion')]);
      const servicio = new OrdenesService(repo, new RegistroFake());
      const detalle = await servicio.detallePedidoParaPersonal('ORD-2026-0002');
      assert(
        detalle.codigo === 'ORD-2026-0002' && detalle.id_cliente === 4 && detalle.estado === 'en_preparacion',
        'CA-ORD-08-01 / CA-ORD-06-02: buscar por identificador lleva a la orden correcta'
      );
    }

    // CA-ORD-08-01: un identificador inexistente responde como recurso no encontrado.
    {
      const repo = new RepoFake([]);
      const error = await capturarError(() => new OrdenesService(repo, new RegistroFake()).detallePedidoParaPersonal('NO-EXISTE'));
      assert(esNoEncontrado(error), 'CA-ORD-08-01: identificador inexistente responde 404 genérico');
    }

    // RF-ORD-06-01: el código visible se valida por longitud de columna (VARCHAR 50) y no admite vacío.
    {
      assert(CodigoOrdenDto.safeParse({ codigo: ' ORD-2026-0001 ' }).success, 'RF-ORD-06-01: un código válido se acepta recortado');
      assert(!CodigoOrdenDto.safeParse({ codigo: '   ' }).success, 'RF-ORD-06-01: un código vacío se rechaza');
      assert(!CodigoOrdenDto.safeParse({ codigo: 'X'.repeat(51) }).success, 'RF-ORD-06-01: un código de más de 50 caracteres se rechaza');
    }

    // --- HU-ORD-07: clasificación tras la definición del 23/09 ----------------

    // CA-ORD-07-01 escenario 2: Despachado (hoy `enviado`) ya cuenta como finalizado.
    {
      const repo = new RepoFake([orden(1, 2, 'enviado')]);
      const pedidos = await new OrdenesService(repo, new RegistroFake()).listarPedidosDeCliente(2, undefined);
      assert(
        pedidos.en_curso.length === 0 && pedidos.finalizados.length === 1,
        'CA-ORD-07-01 esc. 2: un pedido despachado aparece entre los finalizados'
      );
    }

    // --- HU-ORD-05: listado del personal con filtros ---------------------------

    const ordenesGestion = [
      orden(1, 2, 'pagado', new Date(2026, 8, 1)),
      orden(2, 4, 'en_preparacion', new Date(2026, 8, 10)),
      orden(3, 2, 'entregado', new Date(2026, 8, 20)),
      orden(4, 5, 'pagado', new Date(2026, 8, 30)),
    ];

    // HU-ORD-05 (bandeja): filtrar por estado muestra solo ese estado.
    {
      const repo = new RepoFake(ordenesGestion);
      const pagina = await new OrdenesService(repo, new RegistroFake()).listarOrdenesParaPersonal(
        { estado: 'pagado' },
        undefined,
        undefined
      );
      assert(
        pagina.total === 2 && pagina.items.every((o) => o.estado === 'pagado'),
        'HU-ORD-05 (bandeja): el filtro por estado devuelve solo órdenes de ese estado'
      );
    }

    // HU-ORD-05 (bandeja): filtrar por periodo, con ambos extremos incluidos (más recientes primero).
    {
      const repo = new RepoFake(ordenesGestion);
      const pagina = await new OrdenesService(repo, new RegistroFake()).listarOrdenesParaPersonal(
        { desde: '2026-09-10', hasta: '2026-09-20' },
        undefined,
        undefined
      );
      const codigos = pagina.items.map((o) => o.codigo).join(',');
      assert(
        codigos === 'ORD-2026-0003,ORD-2026-0002',
        'HU-ORD-05 (bandeja): el filtro por periodo incluye los dos extremos y excluye el resto'
      );
    }

    // HU-ORD-05 / HU-ORD-11: filtrar por cliente muestra solo sus órdenes.
    {
      const repo = new RepoFake(ordenesGestion);
      const pagina = await new OrdenesService(repo, new RegistroFake()).listarOrdenesParaPersonal(
        { idCliente: 2 },
        undefined,
        undefined
      );
      assert(
        pagina.total === 2 && pagina.items.every((o) => o.id_cliente === 2),
        'HU-ORD-05 / HU-ORD-11: el filtro por cliente devuelve solo las órdenes de ese cliente'
      );
    }

    // CA-ORD-08-01 (listado): el identificador localiza la orden correcta.
    {
      const repo = new RepoFake(ordenesGestion);
      const pagina = await new OrdenesService(repo, new RegistroFake()).listarOrdenesParaPersonal(
        { codigo: '0003' },
        undefined,
        undefined
      );
      assert(
        pagina.total === 1 && pagina.items[0]?.codigo === 'ORD-2026-0003',
        'CA-ORD-08-01: buscar por identificador en el listado lleva a la orden correcta'
      );
    }

    // HU-ORD-05: paginación por defecto y límite máximo (mismo criterio que M02).
    {
      const repo = new RepoFake(ordenesGestion);
      const servicio = new OrdenesService(repo, new RegistroFake());
      const porDefecto = await servicio.listarOrdenesParaPersonal({}, undefined, undefined);
      await servicio.listarOrdenesParaPersonal({}, 3, 999);
      assert(
        porDefecto.pagina === 1 && porDefecto.limite === 20 && porDefecto.total_paginas === 1,
        'HU-ORD-05: página 1 y límite 20 por defecto'
      );
      assert(
        repo.llamadasGestion[1]?.limite === 100 && repo.llamadasGestion[1]?.offset === 200,
        'HU-ORD-05: el límite se acota a 100 y el offset se calcula con la página'
      );
    }

    // HU-SEG-06: el listado del personal no expone clave primaria ni datos de pago.
    {
      const repo = new RepoFake(ordenesGestion);
      const pagina = await new OrdenesService(repo, new RegistroFake()).listarOrdenesParaPersonal({}, undefined, undefined);
      const claves = Object.keys(pagina.items[0] ?? {});
      assert(
        claves.join(',') === 'codigo,fecha,total,estado,id_cliente,dias_esperando',
        'HU-SEG-06: cada orden del listado solo trae código, fecha, total, estado, cliente y días esperando'
      );
    }

    // HU-ORD-05: validación de la query del listado.
    {
      assert(
        ListarOrdenesGestionDto.safeParse({ cliente: '4', desde: '2026-09-01', hasta: '2026-09-01' }).success,
        'HU-ORD-05: un periodo de un solo día y un cliente numérico se aceptan'
      );
      assert(
        !ListarOrdenesGestionDto.safeParse({ desde: '2026-09-20', hasta: '2026-09-10' }).success,
        'HU-ORD-05: un periodo con inicio posterior al final se rechaza'
      );
      assert(
        !ListarOrdenesGestionDto.safeParse({ desde: '10/09/2026' }).success,
        'HU-ORD-05: una fecha fuera del formato AAAA-MM-DD se rechaza'
      );
      assert(
        !ListarOrdenesGestionDto.safeParse({ estado: 'inventado' }).success,
        'HU-ORD-05: un estado que no existe se rechaza'
      );
    }

    // --- HU-ORD-05 / 08 / 09 / 11: definiciones del 27/09 --------------------------

    const usuariosPrueba: UsuarioFake[] = [
      { id_usuario: 2, nombre: 'Cliente Activo', correo: 'cliente@pintuclic.co', telefono: '3109876543' },
      { id_usuario: 4, nombre: 'Pinturas del Valle', correo: 'contacto@pinturasvalle.co', telefono: '320 888 9900' },
    ];
    const ordenesBandeja = [
      orden(1, 2, 'pagado', new Date(2026, 8, 1)),
      orden(2, 4, 'pagado', new Date(2026, 8, 20)),
      orden(3, 2, 'en_preparacion', new Date(2026, 8, 10)),
      orden(4, 2, 'entregado', new Date(2026, 8, 25)),
    ];
    // Reloj fijo: 28/09/2026 a mediodía en Bogotá (17:00 UTC).
    const reloj = (): Date => new Date('2026-09-28T17:00:00Z');

    // CA-ORD-08-02: el correo del cliente encuentra sus pedidos, sin distinguir mayúsculas.
    {
      const repo = new RepoFake(ordenesBandeja, {}, usuariosPrueba);
      const pagina = await new OrdenesService(repo, new RegistroFake(), reloj).listarOrdenesParaPersonal(
        { correoCliente: 'CLIENTE@pintuclic.co' },
        undefined,
        undefined
      );
      assert(
        pagina.total === 3 && pagina.items.every((o) => o.id_cliente === 2),
        'CA-ORD-08-02: buscar por el correo del cliente encuentra sus pedidos, sin distinguir mayúsculas'
      );
    }

    // HU-ORD-08: el teléfono se busca sin los espacios con que lo dicte el cliente.
    {
      const dto = ListarOrdenesGestionDto.parse({ telefono: ' 320 888 9900 ' });
      const repo = new RepoFake(ordenesBandeja, {}, usuariosPrueba);
      const pagina = await new OrdenesService(repo, new RegistroFake(), reloj).listarOrdenesParaPersonal(
        { telefonoCliente: dto.telefono ?? '' },
        undefined,
        undefined
      );
      assert(
        dto.telefono === '3208889900' && pagina.total === 1 && pagina.items[0]?.codigo === 'ORD-2026-0002',
        'HU-ORD-08: buscar por teléfono ignora los espacios y encuentra los pedidos del cliente'
      );
    }

    // Validación de los datos de búsqueda y del orden del listado.
    {
      assert(!ListarOrdenesGestionDto.safeParse({ correo: 'no-es-correo' }).success, 'CA-ORD-08-02: un correo mal escrito se rechaza');
      assert(!ListarOrdenesGestionDto.safeParse({ telefono: '310-ABC' }).success, 'HU-ORD-08: un teléfono con letras se rechaza');
      const ordenInvalido = ListarOrdenesGestionDto.safeParse({ orden: 'aleatorio' });
      assert(
        !ordenInvalido.success && ordenInvalido.error.issues[0]?.message === 'El orden debe ser «recientes» o «antiguedad»',
        'CA-ORD-05-07: un orden de listado desconocido se rechaza con un mensaje en español'
      );
    }

    // CA-ORD-11-01: desde un pedido se ven las otras compras del cliente, más recientes primero.
    {
      const repo = new RepoFake(ordenesBandeja, {}, usuariosPrueba);
      const historial = await new OrdenesService(repo, new RegistroFake(), reloj).historialDelCliente(
        'ORD-2026-0003',
        undefined,
        undefined
      );
      const codigos = historial.items.map((o) => o.codigo).join(',');
      const primera = historial.items[0];
      assert(
        codigos === 'ORD-2026-0004,ORD-2026-0001',
        'CA-ORD-11-01: el historial muestra las otras compras del cliente, de la más reciente a la más antigua'
      );
      assert(
        primera !== undefined && primera.fecha === '2026-09-25' && primera.total === '171800.00' && primera.estado === 'entregado',
        'CA-ORD-11-01: cada compra anterior trae su fecha, su importe y su estado'
      );
    }

    // HU-ORD-11: el historial de una orden inexistente responde como recurso no encontrado.
    {
      const error = await capturarError(() =>
        new OrdenesService(new RepoFake(ordenesBandeja), new RegistroFake(), reloj).historialDelCliente('NO-EXISTE', undefined, undefined)
      );
      assert(esNoEncontrado(error), 'HU-ORD-11: el historial de una orden inexistente responde 404 genérico');
    }

    // CA-ORD-05-05: contadores por estado para la navegación del panel, incluidos los ceros.
    {
      const resumen = await new OrdenesService(new RepoFake(ordenesBandeja), new RegistroFake(), reloj).resumenPorEstado();
      assert(
        resumen.por_estado.pagado === 2 &&
          resumen.por_estado.en_preparacion === 1 &&
          resumen.por_estado.entregado === 1 &&
          resumen.total === 4,
        'CA-ORD-05-05: los contadores muestran cuántas órdenes hay en cada estado'
      );
      assert(
        resumen.por_estado.cancelado === 0 && Object.keys(resumen.por_estado).length === 6,
        'CA-ORD-05-05: los estados sin órdenes aparecen con cero'
      );
    }

    // CA-ORD-05-07: bandeja por antigüedad y días que lleva esperando cada orden.
    {
      const repo = new RepoFake(ordenesBandeja, {}, usuariosPrueba);
      const pagina = await new OrdenesService(repo, new RegistroFake(), reloj).listarOrdenesParaPersonal(
        { estado: 'pagado' },
        undefined,
        undefined,
        'antiguedad'
      );
      assert(
        pagina.items.map((o) => o.codigo).join(',') === 'ORD-2026-0001,ORD-2026-0002',
        'CA-ORD-05-07: con orden por antigüedad la orden más antigua aparece primero'
      );
      assert(
        pagina.items[0]?.dias_esperando === 27 && pagina.items[1]?.dias_esperando === 8,
        'CA-ORD-05-07: cada fila indica cuántos días lleva esperando'
      );
    }

    // CA-ORD-05-07: los días se cuentan con la fecha de Colombia. El 28/09 a las 23:30 en
    // Bogotá ya es 29/09 en UTC, pero una orden del 28/09 lleva 0 días.
    {
      const casiMedianoche = (): Date => new Date('2026-09-29T04:30:00Z');
      const repo = new RepoFake([orden(1, 2, 'pagado', new Date(2026, 8, 28))]);
      const pagina = await new OrdenesService(repo, new RegistroFake(), casiMedianoche).listarOrdenesParaPersonal(
        {},
        undefined,
        undefined
      );
      assert(pagina.items[0]?.dias_esperando === 0, 'CA-ORD-05-07: los días esperando se cuentan con la fecha de Colombia, no la UTC');
    }

    // CA-ORD-09-01: el detalle del personal incluye el contacto del cliente y la dirección.
    {
      const repo = new RepoFake(ordenesBandeja, {}, usuariosPrueba);
      const detalle = await new OrdenesService(repo, new RegistroFake(), reloj).detallePedidoParaPersonal('ORD-2026-0002');
      assert(
        detalle.cliente?.nombre === 'Pinturas del Valle' &&
          detalle.cliente?.correo === 'contacto@pinturasvalle.co' &&
          detalle.cliente?.telefono === '320 888 9900' &&
          detalle.direccion.length > 0,
        'CA-ORD-09-01: el detalle del personal trae el contacto del cliente y la dirección'
      );
      assert(
        Object.keys(detalle.cliente ?? {}).join(',') === 'nombre,correo,telefono',
        'HU-SEG-06: del cliente solo viajan nombre, correo y teléfono'
      );
    }

    // CA-ORD-09-01: si la cuenta del cliente ya no existe, el detalle responde igual, sin contacto.
    {
      const detalle = await new OrdenesService(new RepoFake(ordenesBandeja), new RegistroFake(), reloj).detallePedidoParaPersonal(
        'ORD-2026-0001'
      );
      assert(detalle.cliente === null, 'CA-ORD-09-01: sin cuenta de cliente el detalle sigue respondiendo, con el contacto vacío');
    }

    // --- HU-ORD-06: formato del código PC-AAAA-NNNNN (D04) -----------------------

    {
      const codigos = new CodigoPedidoService();
      const junio2026 = new Date('2026-06-15T12:00:00Z');

      assert(codigos.formatear(123, junio2026) === 'PC-2026-00123', 'CA-ORD-06-01: el código tiene la forma PC-AAAA-NNNNN');

      // 31/12/2026 23:30 en Bogotá ya es 01/01/2027 04:30 en UTC: manda la fecha de Colombia.
      const finDeAnioBogota = new Date('2027-01-01T04:30:00Z');
      const inicioDeAnioBogota = new Date('2027-01-01T05:00:00Z');
      assert(
        codigos.anioColombia(finDeAnioBogota) === 2026 && codigos.anioColombia(inicioDeAnioBogota) === 2027,
        'CA-ORD-06-01 esc. 1: el año corresponde a la fecha de Colombia, no a la UTC'
      );
      assert(
        codigos.formatear(124, inicioDeAnioBogota) === 'PC-2027-00124',
        'CA-ORD-06-01 esc. 2: al cambiar de año el consecutivo continúa, no se reinicia'
      );
      assert(
        codigos.formatear(100000, junio2026) === 'PC-2026-100000',
        'HU-ORD-06: por encima de 99999 conserva todas las cifras en lugar de truncar'
      );

      let rechazaInvalidos = true;
      for (const invalido of [0, -1, 1.5, Number.NaN]) {
        try {
          codigos.formatear(invalido, junio2026);
          rechazaInvalidos = false;
        } catch (error) {
          if (!(error instanceof RangeError)) rechazaInvalidos = false;
        }
      }
      assert(rechazaInvalidos, 'HU-ORD-06: un consecutivo que no es entero positivo se rechaza');
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
