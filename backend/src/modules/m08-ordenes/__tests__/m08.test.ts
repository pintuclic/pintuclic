import { EnumEstadoOrden } from '../../../core/db/types';
import { AppError } from '../../../core/middlewares/errorHandler';
import { MotivoDenegacion } from '../../m20-seguridad/interfaces/seguridad.interfaces';
import type {
  EventoCambioEstadoOrdenPayload,
  IResultadoEnvio,
} from '../../m18-notificaciones/interfaces/notificaciones.interfaces';
import { OrdenesService } from '../services/ordenes.service';
import { GestionOrdenesService } from '../services/gestion-ordenes.service';
import { ESTADOS_NO_HABILITADOS, TRANSICIONES } from '../services/ciclo-estados';
import { CodigoPedidoService } from '../services/codigo-pedido.service';
import { OrdenesRepository } from '../repositories/ordenes.repository';
import { OrdenesController } from '../controllers/ordenes.controller';
import {
  CambiarEstadoDto,
  CodigoOrdenDto,
  CrearNotaDto,
  ListarOrdenesGestionDto,
  RegistrarContactoDto,
} from '../dtos/ordenes.dto';
import {
  CabeceraOrden,
  ContactoCliente,
  FilaConteoEstado,
  FilaContactoOrden,
  FilaHistorialEstado,
  FilaLineaOrden,
  FilaNotaOrden,
  FilaResumenOrden,
  FilaResumenOrdenGestion,
  FiltrosGestionOrdenes,
  NotificadorEstadoOrden,
  OrdenListado,
  RegistroAccesosDenegados,
  SolicitudCambioEstado,
} from '../interfaces/m08.interfaces';

type UsuarioFake = { readonly id_usuario: number } & ContactoCliente;

/** AAAA-MM-DD con la fecha local, igual que la columna DATE de la orden. */
function aFechaTexto(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

// ==============================================================================
// M08 - SUITE DE VALIDACIÓN DE CRITERIOS DE ACEPTACIÓN (HU-ORD-02/03/04/05/06/07/08/09/10/11)
// Repositorio falso en memoria: valida la lógica del servicio sin BD real
// (titularidad, agrupación, forma de la respuesta). Las consultas SQL se validan en QA.
// Ejecutar: npx tsx src/modules/m08-ordenes/__tests__/m08.test.ts
// ==============================================================================

/** Momento fijo con el que el fake registra historial, notas y contactos. */
const MOMENTO_ESCRITURA = new Date('2026-09-28T17:00:00Z');

class RepoFake extends OrdenesRepository {
  public llamadasListar: Array<{ idUsuario: number; termino: string | undefined }> = [];
  public readonly historial = new Map<number, FilaHistorialEstado[]>();
  public readonly notas = new Map<number, FilaNotaOrden[]>();
  public readonly contactos = new Map<number, FilaContactoOrden[]>();
  /** Se ejecuta justo antes de escribir un cambio de estado; sirve para simular a otra persona. */
  public antesDeCambiar: (() => void) | undefined;
  private readonly ordenes: CabeceraOrden[];

  constructor(
    ordenes: CabeceraOrden[],
    private readonly lineas: Record<number, FilaLineaOrden[]> = {},
    private readonly usuarios: UsuarioFake[] = []
  ) {
    super(undefined as never); // no se usa la BD en el fake
    // Copia propia: un cambio de estado en una prueba no altera los datos de las demás.
    this.ordenes = ordenes.map((o) => ({ ...o }));
  }

  /** Cambia el estado de una orden por fuera del servicio, como haría otra persona. */
  forzarEstado(idOrden: number, estado: EnumEstadoOrden): void {
    const i = this.ordenes.findIndex((o) => o.id_orden === idOrden);
    const actual = this.ordenes[i];
    if (actual) this.ordenes[i] = { ...actual, estado };
  }

  private nombreDe(idUsuario: number): string {
    return this.usuarios.find((u) => u.id_usuario === idUsuario)?.nombre ?? `Usuario ${idUsuario}`;
  }

  private agregar<T>(mapa: Map<number, T[]>, idOrden: number, fila: T): void {
    mapa.set(idOrden, [...(mapa.get(idOrden) ?? []), fila]);
  }

  override async listarHistorial(idOrden: number): Promise<FilaHistorialEstado[]> {
    return this.historial.get(idOrden) ?? [];
  }

  override async listarNotas(idOrden: number): Promise<FilaNotaOrden[]> {
    return this.notas.get(idOrden) ?? [];
  }

  override async listarContactos(idOrden: number): Promise<FilaContactoOrden[]> {
    return this.contactos.get(idOrden) ?? [];
  }

  /** Réplica del UPDATE condicionado: solo cambia si la orden sigue en el estado leído. */
  override async cambiarEstado(s: SolicitudCambioEstado): Promise<Date | undefined> {
    this.antesDeCambiar?.();
    const i = this.ordenes.findIndex((o) => o.id_orden === s.idOrden);
    const actual = this.ordenes[i];
    if (!actual || actual.estado !== s.estadoActual) return undefined;
    this.ordenes[i] = { ...actual, estado: s.estadoNuevo };
    this.agregar(this.historial, s.idOrden, {
      estado_anterior: s.estadoActual,
      estado_nuevo: s.estadoNuevo,
      autor: this.nombreDe(s.idAutor),
      motivo: s.motivo,
      fecha: MOMENTO_ESCRITURA,
    });
    return MOMENTO_ESCRITURA;
  }

  override async crearNota(idOrden: number, idAutor: number, texto: string): Promise<FilaNotaOrden> {
    const fila = { texto, autor: this.nombreDe(idAutor), fecha: MOMENTO_ESCRITURA };
    this.agregar(this.notas, idOrden, fila);
    return fila;
  }

  override async registrarContacto(
    idOrden: number,
    idAutor: number,
    medio: string,
    detalle: string | null
  ): Promise<FilaContactoOrden> {
    const fila = { medio, detalle, autor: this.nombreDe(idAutor), fecha: MOMENTO_ESCRITURA };
    this.agregar(this.contactos, idOrden, fila);
    return fila;
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
      .map((o) => {
        const cambios = this.historial.get(o.id_orden) ?? [];
        const ultimo = cambios.reduce<Date | null>((max, c) => (max && max > c.fecha ? max : c.fecha), null);
        return {
          codigo_visible: o.codigo_visible,
          fecha: o.fecha,
          total: o.total,
          estado: o.estado,
          id_usuario: o.id_usuario,
          ultimo_cambio: ultimo,
        };
      });
  }

  override async contarParaPersonal(filtros: FiltrosGestionOrdenes): Promise<number> {
    return this.filtrar(filtros).length;
  }
}

/** Sustituto de M18: guarda los avisos pedidos y, si se indica, simula que el correo falla. */
class NotificadorFake implements NotificadorEstadoOrden {
  public readonly avisos: EventoCambioEstadoOrdenPayload[] = [];

  constructor(private readonly falla: boolean = false) {}

  async notificarCambioEstadoOrden(payload: EventoCambioEstadoOrdenPayload): Promise<IResultadoEnvio> {
    this.avisos.push(payload);
    if (this.falla) throw new Error('SMTP no disponible');
    return { exitoso: true, idEnvio: 'fake-1', intentos: 1, mensaje: 'Enviado' };
  }
}

/** Deja que terminen las tareas en segundo plano (el aviso a M18 no bloquea la respuesta). */
async function esperarTareasPendientes(): Promise<void> {
  await new Promise((resolver) => setImmediate(resolver));
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
      const repo = new RepoFake([orden(1, 2, 'orden_confirmada'), orden(2, 2, 'entregado'), orden(3, 2, 'en_preparacion')]);
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
          primero.estado === 'orden_confirmada',
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
      const repo = new RepoFake([orden(1, 2, 'orden_confirmada'), orden(2, 4, 'orden_confirmada')]);
      const pedidos = await new OrdenesService(repo, new RegistroFake()).listarPedidosDeCliente(2, undefined);
      assert(
        repo.llamadasListar[0]?.idUsuario === 2 && pedidos.en_curso.length === 1,
        'CA-SEG-06-05: el listado no incluye pedidos de otros clientes'
      );
    }

    // --- HU-ORD-04: detalle de un pedido ------------------------------------

    // CA-ORD-04-01 / CA-ORD-04-02: productos, variante (con su color), cantidades, precios, total y estado.
    {
      const repo = new RepoFake([orden(1, 2, 'orden_confirmada')], {
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
          detalle.estado === 'orden_confirmada',
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
      const repo = new RepoFake([orden(1, 4, 'orden_confirmada')]);
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
      const repo = new RepoFake([orden(1, 4, 'orden_confirmada')]);
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
      const repo = new RepoFake([orden(1, 2, 'orden_confirmada')]);
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
      const repo = new RepoFake([orden(1, 2, 'orden_confirmada'), orden(2, 4, 'en_preparacion')]);
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

    // --- HU-ORD-07: clasificación con los estados del esquema v3.8 ---------------

    // CA-ORD-07-01 escenario 2: Despachado ya cuenta como finalizado (D02, CA-ORD-03-06).
    {
      const repo = new RepoFake([orden(1, 2, 'despachado')]);
      const pedidos = await new OrdenesService(repo, new RegistroFake()).listarPedidosDeCliente(2, undefined);
      assert(
        pedidos.en_curso.length === 0 && pedidos.finalizados.length === 1,
        'CA-ORD-07-01 esc. 2: un pedido despachado aparece entre los finalizados'
      );
    }

    // HU-ORD-03 / CA-ORD-07-01: los estados intermedios siguen en curso y los terminales finalizan.
    {
      const repo = new RepoFake([
        orden(1, 2, 'revision_disponibilidad'),
        orden(2, 2, 'preparada'),
        orden(3, 2, 'devuelto'),
      ]);
      const pedidos = await new OrdenesService(repo, new RegistroFake()).listarPedidosDeCliente(2, undefined);
      assert(
        pedidos.en_curso.map((p) => p.estado).sort().join(',') === 'preparada,revision_disponibilidad' &&
          pedidos.finalizados.map((p) => p.estado).join(',') === 'devuelto',
        'HU-ORD-03: revisión de disponibilidad y preparada van en curso; devuelto va en finalizados'
      );
    }

    // --- HU-ORD-05: listado del personal con filtros ---------------------------

    const ordenesGestion = [
      orden(1, 2, 'orden_confirmada', new Date(2026, 8, 1)),
      orden(2, 4, 'en_preparacion', new Date(2026, 8, 10)),
      orden(3, 2, 'entregado', new Date(2026, 8, 20)),
      orden(4, 5, 'orden_confirmada', new Date(2026, 8, 30)),
    ];

    // HU-ORD-05 (bandeja): filtrar por estado muestra solo ese estado.
    {
      const repo = new RepoFake(ordenesGestion);
      const pagina = await new OrdenesService(repo, new RegistroFake()).listarOrdenesParaPersonal(
        { estado: 'orden_confirmada' },
        undefined,
        undefined
      );
      assert(
        pagina.total === 2 && pagina.items.every((o) => o.estado === 'orden_confirmada'),
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
      orden(1, 2, 'orden_confirmada', new Date(2026, 8, 1)),
      orden(2, 4, 'orden_confirmada', new Date(2026, 8, 20)),
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
        resumen.por_estado.orden_confirmada === 2 &&
          resumen.por_estado.en_preparacion === 1 &&
          resumen.por_estado.entregado === 1 &&
          resumen.total === 4,
        'CA-ORD-05-05: los contadores muestran cuántas órdenes hay en cada estado'
      );
      assert(
        resumen.por_estado.cancelado === 0 && Object.keys(resumen.por_estado).length === 8,
        'CA-ORD-05-05: los estados sin órdenes aparecen con cero'
      );
    }

    // CA-ORD-05-07: bandeja por antigüedad y días que lleva esperando cada orden.
    {
      const repo = new RepoFake(ordenesBandeja, {}, usuariosPrueba);
      const pagina = await new OrdenesService(repo, new RegistroFake(), reloj).listarOrdenesParaPersonal(
        { estado: 'orden_confirmada' },
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
      const repo = new RepoFake([orden(1, 2, 'orden_confirmada', new Date(2026, 8, 28))]);
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

    // --- HU-ORD-03 / 05 / 09 / 10: operación de la orden por el personal ----------------

    const personal: UsuarioFake[] = [
      ...usuariosPrueba,
      { id_usuario: 1, nombre: 'Admin Pruebas', correo: 'admin@pintuclic.co', telefono: '3001234567' },
      { id_usuario: 5, nombre: 'Operaria Bodega', correo: 'bodega@pintuclic.co', telefono: null },
    ];
    const ADMIN = 1;
    const OPERARIA = 5;

    function esError(error: unknown, estado: number, codigo: string): boolean {
      return error instanceof AppError && error.statusCode === estado && error.code === codigo;
    }

    // CA-ORD-05-01 / CA-ORD-03-04: avanzar una orden registra el cambio con su autor y fecha.
    {
      const repo = new RepoFake(ordenesBandeja, {}, personal);
      const gestion = new GestionOrdenesService(repo, new NotificadorFake());
      const resultado = await gestion.cambiarEstado('ORD-2026-0001', 'revision_disponibilidad', ADMIN, undefined);
      assert(
        resultado.estado_anterior === 'orden_confirmada' &&
          resultado.estado === 'revision_disponibilidad' &&
          resultado.fecha === '2026-09-28T17:00:00.000Z' &&
          resultado.transiciones_permitidas.join(',') === 'en_preparacion',
        'CA-ORD-05-01: el personal hace avanzar la orden y recibe el estado nuevo y los siguientes posibles'
      );
      const cambios = repo.historial.get(1) ?? [];
      assert(
        cambios.length === 1 && cambios[0]?.autor === 'Admin Pruebas' && cambios[0]?.estado_anterior === 'orden_confirmada',
        'CA-ORD-03-04: el cambio de estado queda registrado con quién lo hizo'
      );
    }

    // CA-ORD-03-01: la orden recorre el ciclo normal y su estado refleja cada paso.
    {
      const repo = new RepoFake(ordenesBandeja, {}, personal);
      const gestion = new GestionOrdenesService(repo, new NotificadorFake());
      for (const siguiente of ['revision_disponibilidad', 'en_preparacion', 'preparada', 'despachado', 'entregado'] as const) {
        await gestion.cambiarEstado('ORD-2026-0002', siguiente, ADMIN, undefined);
      }
      const detalle = await new OrdenesService(repo, new RegistroFake()).detallePedidoParaPersonal('ORD-2026-0002');
      assert(
        detalle.estado === 'entregado' &&
          detalle.historial.map((c) => c.estado_nuevo).join(',') ===
            'revision_disponibilidad,en_preparacion,preparada,despachado,entregado' &&
          detalle.transiciones_permitidas.length === 0,
        'CA-ORD-03-01: tras cada paso el estado refleja la situación real y Entregado es final'
      );
    }

    // D02: la recogida en tienda pasa de Preparada a Entregado en una sola acción, sin despacho.
    {
      const repo = new RepoFake([orden(1, 2, 'preparada')], {}, personal);
      const resultado = await new GestionOrdenesService(repo, new NotificadorFake()).cambiarEstado(
        'ORD-2026-0001',
        'entregado',
        ADMIN,
        undefined
      );
      assert(resultado.estado === 'entregado', 'D02: una orden preparada puede entregarse directamente (recogida)');
    }

    // HU-ORD-03: un salto que el ciclo no permite se rechaza y no cambia nada.
    {
      const repo = new RepoFake(ordenesBandeja, {}, personal);
      const error = await capturarError(() =>
        new GestionOrdenesService(repo, new NotificadorFake()).cambiarEstado('ORD-2026-0001', 'despachado', ADMIN, undefined)
      );
      const sigue = await repo.buscarPorCodigo('ORD-2026-0001');
      assert(
        esError(error, 409, 'TRANSICION_NO_PERMITIDA') &&
          error instanceof AppError &&
          error.message === 'Una orden en «Orden confirmada» no puede pasar a «Despachado»' &&
          sigue?.estado === 'orden_confirmada' &&
          (repo.historial.get(1) ?? []).length === 0,
        'HU-ORD-03: saltarse pasos del ciclo se rechaza con un mensaje claro y sin registrar nada'
      );
    }

    // HU-ORD-03: pedir el mismo estado en que ya está la orden se rechaza.
    {
      const error = await capturarError(() =>
        new GestionOrdenesService(new RepoFake(ordenesBandeja, {}, personal), new NotificadorFake()).cambiarEstado(
          'ORD-2026-0003',
          'en_preparacion',
          ADMIN,
          undefined
        )
      );
      assert(esError(error, 409, 'ESTADO_SIN_CAMBIO'), 'HU-ORD-03: pedir el estado actual se rechaza como sin cambio');
    }

    // Cancelar y devolver aún no están habilitados (política M11, CA-ORD-03-05).
    {
      const gestion = new GestionOrdenesService(new RepoFake(ordenesBandeja, {}, personal), new NotificadorFake());
      const cancelar = await capturarError(() => gestion.cambiarEstado('ORD-2026-0001', 'cancelado', ADMIN, 'Cliente desiste'));
      const devolver = await capturarError(() => gestion.cambiarEstado('ORD-2026-0004', 'devuelto', ADMIN, 'Producto dañado'));
      assert(
        esError(cancelar, 409, 'OPERACION_NO_HABILITADA') && esError(devolver, 409, 'OPERACION_NO_HABILITADA'),
        'CA-ORD-03-05: cancelar y devolver se rechazan hasta que exista su política y el registro del dinero'
      );
    }

    // D01: volver de Preparada a En preparación exige motivo, y el motivo queda en el historial.
    {
      const repo = new RepoFake([orden(1, 2, 'preparada')], {}, personal);
      const gestion = new GestionOrdenesService(repo, new NotificadorFake());
      const sinMotivo = await capturarError(() => gestion.cambiarEstado('ORD-2026-0001', 'en_preparacion', ADMIN, '   '));
      await gestion.cambiarEstado('ORD-2026-0001', 'en_preparacion', ADMIN, '  Falta una lata del color pedido  ');
      assert(
        esError(sinMotivo, 400, 'MOTIVO_REQUERIDO') &&
          repo.historial.get(1)?.[0]?.motivo === 'Falta una lata del color pedido',
        'D01: volver a En preparación sin motivo se rechaza; con motivo queda registrado'
      );
    }

    // CA-ORD-05-08: dos empleados operan la misma orden; si uno la cambió antes, el otro no la pisa.
    {
      const repo = new RepoFake(ordenesBandeja, {}, personal);
      repo.antesDeCambiar = () => repo.forzarEstado(1, 'revision_disponibilidad');
      const error = await capturarError(() =>
        new GestionOrdenesService(repo, new NotificadorFake()).cambiarEstado(
          'ORD-2026-0001',
          'revision_disponibilidad',
          OPERARIA,
          undefined
        )
      );
      assert(
        esError(error, 409, 'ESTADO_CAMBIADO') && (repo.historial.get(1) ?? []).length === 0,
        'CA-ORD-05-08: si otra persona cambió la orden entre medias, el cambio se rechaza sin sobrescribirla'
      );
    }

    // CA-ORD-05-08: cada paso queda con el nombre de quien lo hizo, aunque sean personas distintas.
    {
      const repo = new RepoFake(ordenesBandeja, {}, personal);
      const gestion = new GestionOrdenesService(repo, new NotificadorFake());
      await gestion.cambiarEstado('ORD-2026-0001', 'revision_disponibilidad', ADMIN, undefined);
      await gestion.cambiarEstado('ORD-2026-0001', 'en_preparacion', OPERARIA, undefined);
      assert(
        (repo.historial.get(1) ?? []).map((c) => c.autor).join(',') === 'Admin Pruebas,Operaria Bodega',
        'CA-ORD-05-08: el historial registra quién hizo cada paso'
      );
    }

    // HU-ORD-03: cambiar el estado de una orden inexistente responde como recurso no encontrado.
    {
      const error = await capturarError(() =>
        new GestionOrdenesService(new RepoFake(ordenesBandeja), new NotificadorFake()).cambiarEstado(
          'NO-EXISTE',
          'revision_disponibilidad',
          ADMIN,
          undefined
        )
      );
      assert(esNoEncontrado(error), 'HU-ORD-03: una orden inexistente responde 404 genérico al cambiar su estado');
    }

    // D05 / HU-NOT-02: al despachar se avisa al cliente por correo; en los demás pasos no.
    {
      const repo = new RepoFake([orden(1, 2, 'en_preparacion')], {}, personal);
      const notificador = new NotificadorFake();
      const gestion = new GestionOrdenesService(repo, notificador);
      await gestion.cambiarEstado('ORD-2026-0001', 'preparada', ADMIN, undefined);
      await gestion.cambiarEstado('ORD-2026-0001', 'despachado', ADMIN, undefined);
      await esperarTareasPendientes();
      const aviso = notificador.avisos[0];
      assert(
        notificador.avisos.length === 1 &&
          aviso?.destinatario === 'cliente@pintuclic.co' &&
          aviso?.nombreCliente === 'Cliente Activo' &&
          aviso?.numeroOrden === 'ORD-2026-0001' &&
          aviso?.nuevoEstado === 'Despachado',
        'D05: solo el despacho envía correo al cliente, con su nombre, su pedido y el estado'
      );
    }

    // D05: si el correo falla, el cambio de estado sigue registrado y el fallo queda en el log.
    {
      const repo = new RepoFake([orden(1, 2, 'preparada')], {}, personal);
      const erroresRegistrados: unknown[][] = [];
      const errorOriginal = console.error;
      console.error = (...args: unknown[]): void => {
        erroresRegistrados.push(args);
      };
      let estadoDevuelto: EnumEstadoOrden | undefined;
      try {
        const resultado = await new GestionOrdenesService(repo, new NotificadorFake(true)).cambiarEstado(
          'ORD-2026-0001',
          'despachado',
          ADMIN,
          undefined
        );
        estadoDevuelto = resultado.estado;
        await esperarTareasPendientes();
      } finally {
        console.error = errorOriginal;
      }
      assert(
        estadoDevuelto === 'despachado' &&
          (await repo.buscarPorCodigo('ORD-2026-0001'))?.estado === 'despachado' &&
          erroresRegistrados.length === 1,
        'D05: un fallo del correo no deshace el cambio de estado y queda registrado en el log'
      );
    }

    // CA-ORD-09-02: el detalle del personal muestra quién hizo cada cambio y cuándo; NULL es el sistema.
    {
      const repo = new RepoFake(ordenesBandeja, {}, personal);
      repo.historial.set(2, [
        { estado_anterior: null, estado_nuevo: 'orden_confirmada', autor: null, motivo: null, fecha: new Date('2026-09-20T15:00:00Z') },
      ]);
      const detalle = await new OrdenesService(repo, new RegistroFake()).detallePedidoParaPersonal('ORD-2026-0002');
      const primero = detalle.historial[0];
      assert(
        primero?.autor === null && primero.estado_nuevo === 'orden_confirmada' && primero.fecha === '2026-09-20T15:00:00.000Z',
        'CA-ORD-09-02: cada cambio trae su autor (null = sistema) y su fecha'
      );
      assert(
        detalle.transiciones_permitidas.join(',') === 'revision_disponibilidad',
        'HU-ORD-03: el detalle indica a qué estados se puede pasar desde el actual'
      );
    }

    // CA-ORD-10-02: la nota se ve con el nombre de quien la escribió y el momento.
    {
      const repo = new RepoFake(ordenesBandeja, {}, personal);
      const gestion = new GestionOrdenesService(repo, new NotificadorFake());
      const nota = await gestion.crearNota('ORD-2026-0002', OPERARIA, 'El cliente pidió entregar después de las 2 p. m.');
      const detalle = await new OrdenesService(repo, new RegistroFake()).detallePedidoParaPersonal('ORD-2026-0002');
      assert(
        nota.autor === 'Operaria Bodega' &&
          nota.fecha === '2026-09-28T17:00:00.000Z' &&
          detalle.notas.length === 1 &&
          detalle.notas[0]?.texto === 'El cliente pidió entregar después de las 2 p. m.',
        'CA-ORD-10-02: al abrir el pedido la nota aparece con su autor y su momento'
      );
    }

    // CA-ORD-10-01: la nota interna no aparece cuando el cliente consulta su pedido.
    {
      const repo = new RepoFake(ordenesBandeja, {}, personal);
      await new GestionOrdenesService(repo, new NotificadorFake()).crearNota('ORD-2026-0002', ADMIN, 'Revisar NIT de la factura');
      const vistaCliente = await new OrdenesService(repo, new RegistroFake()).detallePedidoDeCliente(4, 'ORD-2026-0002', 'GET /test');
      const texto = JSON.stringify(vistaCliente);
      assert(
        !('notas' in vistaCliente) && !('historial' in vistaCliente) && !('contactos' in vistaCliente) && !texto.includes('NIT'),
        'CA-ORD-10-01: la vista del cliente no incluye notas internas, historial interno ni contactos'
      );
    }

    // CA-ORD-10-03: una nota no se puede borrar ni editar; el sistema indica añadir otra.
    {
      const controlador = new OrdenesController(
        new OrdenesService(new RepoFake([]), new RegistroFake()),
        new GestionOrdenesService(new RepoFake([]), new NotificadorFake())
      );
      let error: unknown;
      try {
        controlador.notaNoModificable();
      } catch (e) {
        error = e;
      }
      assert(
        esError(error, 405, 'NOTA_INMUTABLE') && error instanceof AppError && error.message.includes('añade otra'),
        'CA-ORD-10-03: borrar o editar una nota se impide y el mensaje indica añadir otra'
      );
    }

    // CA-ORD-09-03: registrar un contacto deja constancia de quién, cuándo y por qué medio.
    {
      const repo = new RepoFake(ordenesBandeja, {}, personal);
      const contacto = await new GestionOrdenesService(repo, new NotificadorFake()).registrarContacto(
        'ORD-2026-0001',
        ADMIN,
        'whatsapp',
        '  Se avisó de la demora en el color  '
      );
      const sinDetalle = await new GestionOrdenesService(repo, new NotificadorFake()).registrarContacto(
        'ORD-2026-0001',
        OPERARIA,
        'telefono',
        '   '
      );
      const detalle = await new OrdenesService(repo, new RegistroFake()).detallePedidoParaPersonal('ORD-2026-0001');
      assert(
        contacto.autor === 'Admin Pruebas' &&
          contacto.medio === 'whatsapp' &&
          contacto.detalle === 'Se avisó de la demora en el color' &&
          sinDetalle.detalle === null &&
          detalle.contactos.length === 2,
        'CA-ORD-09-03: el contacto queda registrado con autor, medio, detalle y fecha'
      );
    }

    // CA-ORD-05-07: los días esperando se cuentan desde el último cambio de estado, no desde la compra.
    {
      const repo = new RepoFake([orden(1, 2, 'en_preparacion', new Date(2026, 8, 1))], {}, personal);
      repo.historial.set(1, [
        { estado_anterior: null, estado_nuevo: 'orden_confirmada', autor: null, motivo: null, fecha: new Date('2026-09-01T15:00:00Z') },
        { estado_anterior: 'orden_confirmada', estado_nuevo: 'en_preparacion', autor: 'Admin Pruebas', motivo: null, fecha: new Date('2026-09-26T15:00:00Z') },
      ]);
      const pagina = await new OrdenesService(repo, new RegistroFake(), reloj).listarOrdenesParaPersonal({}, undefined, undefined);
      assert(pagina.items[0]?.dias_esperando === 2, 'CA-ORD-05-07: la espera se mide desde el último cambio de estado');
    }

    // El último cambio se lleva a la fecha de Colombia: el 26/09 a las 23:30 en Bogotá ya es 27/09 en UTC.
    {
      const repo = new RepoFake([orden(1, 2, 'en_preparacion', new Date(2026, 8, 1))], {}, personal);
      repo.historial.set(1, [
        { estado_anterior: 'orden_confirmada', estado_nuevo: 'en_preparacion', autor: null, motivo: null, fecha: new Date('2026-09-27T04:30:00Z') },
      ]);
      const pagina = await new OrdenesService(repo, new RegistroFake(), reloj).listarOrdenesParaPersonal({}, undefined, undefined);
      assert(pagina.items[0]?.dias_esperando === 2, 'CA-ORD-05-07: el último cambio se cuenta con la fecha de Colombia');
    }

    // Validación de los cuerpos de las operaciones.
    {
      const estadoInventado = CambiarEstadoDto.safeParse({ estado: 'en_camino' });
      assert(
        !estadoInventado.success && estadoInventado.error.issues[0]?.message.startsWith('El estado debe ser uno de:') === true,
        'HU-ORD-03: un estado desconocido se rechaza con un mensaje en español'
      );
      assert(
        !CambiarEstadoDto.safeParse({ estado: 'preparada', motivo: 'x'.repeat(501) }).success,
        'HU-ORD-03: un motivo de más de 500 caracteres se rechaza'
      );
      assert(
        !CrearNotaDto.safeParse({ texto: '    ' }).success && !CrearNotaDto.safeParse({ texto: 'x'.repeat(2001) }).success,
        'HU-ORD-10: una nota vacía o de más de 2000 caracteres se rechaza'
      );
      const sinTexto = CrearNotaDto.safeParse({});
      assert(
        !sinTexto.success && sinTexto.error.issues[0]?.message === 'Escribe el texto de la nota',
        'HU-ORD-10: una nota sin texto se rechaza con un mensaje en español'
      );
      assert(
        !RegistrarContactoDto.safeParse({ medio: 'fax' }).success && RegistrarContactoDto.safeParse({ medio: 'correo' }).success,
        'CA-ORD-09-03: solo se aceptan los medios de contacto previstos'
      );
    }

    // Coherencia del ciclo: los estados finales no tienen salida y cancelar/devolver no son destino manual.
    {
      const destinos = Object.values(TRANSICIONES).flat();
      assert(
        TRANSICIONES.entregado.length === 0 &&
          TRANSICIONES.cancelado.length === 0 &&
          TRANSICIONES.devuelto.length === 0 &&
          ESTADOS_NO_HABILITADOS.every((e) => !destinos.includes(e)),
        'HU-ORD-03: los estados finales no tienen salida y cancelar/devolver no están en el ciclo manual'
      );
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
