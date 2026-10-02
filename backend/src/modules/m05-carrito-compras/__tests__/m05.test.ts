import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { CarritoService } from '../services/carrito.service';
import { CarritoController } from '../controllers/carrito.controller';
import { CarritoRepository } from '../repositories/carrito.repository';
import { LineaCarritoRepository } from '../repositories/linea-carrito.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { Carrito, EnumEstadoProducto, LineaCarrito } from '../../../core/db/types';
import {
  LineaAjustadaEnFusion,
  LineaCarritoViva,
  ResultadoTransferencia,
  VarianteParaCarrito,
} from '../interfaces/m05.interfaces';

// ==============================================================================
// M05 - SUITE DE VALIDACIÓN DE CRITERIOS DE ACEPTACIÓN
// (HU-CAR-01, HU-CAR-02, HU-CAR-04, HU-CAR-05)
// Repositorios fake en memoria — sin conexión real a PostgreSQL
// Ejecutar: npx tsx src/modules/m05-carrito-compras/__tests__/m05.test.ts
// ==============================================================================

// ---- Datos base de prueba ---------------------------------------------------

let secuenciaCarrito = 1;
let secuenciaLinea = 1;

function nuevoCarrito(overrides: Partial<Carrito> = {}): Carrito {
  return {
    id_carrito: secuenciaCarrito++,
    token_visitante: null,
    id_usuario: null,
    fecha_ultima_actividad: new Date(),
    ...overrides,
  };
}

function nuevaLinea(overrides: Partial<LineaCarrito> = {}): LineaCarrito {
  return {
    id_linea_carrito: secuenciaLinea++,
    id_carrito: 1,
    id_variante: 10,
    ref_viva: 1,
    cantidad: 1,
    ...overrides,
  };
}

function lineaViva(overrides: Partial<LineaCarritoViva> = {}): LineaCarritoViva {
  return {
    id_linea_carrito: 1,
    id_variante: 10,
    cantidad: 2,
    precio_unitario_vigente: '50000.00',
    subtotal: '100000.00',
    existencia_referencial: 20,
    estado_variante: 'activo',
    ...overrides,
  };
}

// ---- Fakes de HTTP para probar el controlador --------------------------------

type PeticionFalsa = {
  headers: Record<string, string | string[] | undefined>;
  params?: Record<string, string>;
  body?: unknown;
  user?: { id: number };
};

function peticion(datos: PeticionFalsa): Request {
  return { params: {}, body: {}, ...datos } as unknown as Request;
}

/** Respuesta falsa que guarda el código y el cuerpo que escribe `sendSuccess`. */
class RespuestaFalsa {
  public codigo = 0;
  public cuerpo: unknown;
  status(codigo: number): this {
    this.codigo = codigo;
    return this;
  }
  json(cuerpo: unknown): this {
    this.cuerpo = cuerpo;
    return this;
  }
  comoResponse(): Response {
    return this as unknown as Response;
  }
}

// ---- Fakes de repositorios --------------------------------------------------

class CarritoRepoFake extends CarritoRepository {
  public tabla: Map<number, Carrito> = new Map();

  constructor() {
    super(undefined as never);
  }

  override async buscarPorToken(token: string): Promise<Carrito | undefined> {
    for (const c of this.tabla.values()) {
      if (c.token_visitante === token) return { ...c };
    }
    return undefined;
  }

  override async buscarPorUsuario(idUsuario: number): Promise<Carrito | undefined> {
    for (const c of this.tabla.values()) {
      if (c.id_usuario === idUsuario) return { ...c };
    }
    return undefined;
  }

  override async buscarPorId(id: number): Promise<Carrito | undefined> {
    const c = this.tabla.get(id);
    return c ? { ...c } : undefined;
  }

  override async crear(datos: { token_visitante: string | null; id_usuario: number | null }): Promise<Carrito> {
    const c = nuevoCarrito({ ...datos });
    this.tabla.set(c.id_carrito, c);
    return { ...c };
  }

  override async actualizar(idCarrito: number, cambios: Partial<Carrito>): Promise<Carrito | undefined> {
    const c = this.tabla.get(idCarrito);
    if (!c) return undefined;
    const actualizado = { ...c, ...cambios };
    this.tabla.set(idCarrito, actualizado);
    return { ...actualizado };
  }

  override async refrescarActividad(_idCarrito: number): Promise<void> {
    // no-op en tests
  }

  /** Cuántas veces el servicio pidió borrar un carrito por fuera de la fusión transaccional. */
  public llamadasEliminar = 0;

  override async eliminar(idCarrito: number): Promise<void> {
    this.llamadasEliminar++;
    this.tabla.delete(idCarrito);
  }
}

class LineaRepoFake extends LineaCarritoRepository {
  public tabla: Map<number, LineaCarrito> = new Map();
  public lineasVivasOverride: LineaCarritoViva[] | null = null;
  /** Si es true, la fusión falla después de calcular las líneas y no aplica nada (simula el ROLLBACK). */
  public fallarFusion = false;
  /** Catálogo falso: id de variante → estado. Las pruebas usan las variantes 10 y 20. */
  public variantes: Map<number, EnumEstadoProducto> = new Map([
    [10, 'activo'],
    [20, 'activo'],
  ]);

  /** La fusión borra el carrito origen, que vive en el fake de cabeceras. */
  constructor(private readonly carritos?: CarritoRepoFake) {
    super(undefined as never);
  }

  override async listarLineasVivas(idCarrito: number): Promise<LineaCarritoViva[]> {
    if (this.lineasVivasOverride !== null) return this.lineasVivasOverride;
    const result: LineaCarritoViva[] = [];
    for (const l of this.tabla.values()) {
      if (l.id_carrito === idCarrito) {
        result.push(lineaViva({
          id_linea_carrito: l.id_linea_carrito,
          id_variante: l.id_variante,
          cantidad: l.cantidad,
          subtotal: (50000 * l.cantidad).toFixed(2),
        }));
      }
    }
    return result;
  }

  /** Llamadas al camino no atómico (crear / actualizar) desde el agregado de ítems. */
  public llamadasNoAtomicas = 0;
  public llamadasAgregarOAcumular = 0;

  override async agregarOAcumular(
    idCarrito: number,
    idVariante: number,
    cantidad: number,
    cantidadMaxima: number
  ): Promise<LineaCarrito | undefined> {
    this.llamadasAgregarOAcumular++;
    const existente = [...this.tabla.values()].find((l) => l.id_carrito === idCarrito && l.id_variante === idVariante);
    if (!existente) {
      const nueva = nuevaLinea({ id_carrito: idCarrito, id_variante: idVariante, cantidad });
      this.tabla.set(nueva.id_linea_carrito, nueva);
      return { ...nueva };
    }
    if (existente.cantidad + cantidad > cantidadMaxima) return undefined;
    existente.cantidad += cantidad;
    return { ...existente };
  }

  override async buscarVariante(idVariante: number): Promise<VarianteParaCarrito | undefined> {
    const estado = this.variantes.get(idVariante);
    return estado ? { id_variante: idVariante, estado } : undefined;
  }

  override async buscarPorVariante(idCarrito: number, idVariante: number): Promise<LineaCarrito | undefined> {
    for (const l of this.tabla.values()) {
      if (l.id_carrito === idCarrito && l.id_variante === idVariante) return { ...l };
    }
    return undefined;
  }

  override async buscarPorId(id: number): Promise<LineaCarrito | undefined> {
    const l = this.tabla.get(id);
    return l ? { ...l } : undefined;
  }

  override async crear(datos: { id_carrito: number; id_variante: number; cantidad: number }): Promise<LineaCarrito> {
    this.llamadasNoAtomicas++;
    const l = nuevaLinea({ ...datos });
    this.tabla.set(l.id_linea_carrito, l);
    return { ...l };
  }

  override async actualizarCantidad(id: number, cambios: { cantidad?: number }): Promise<LineaCarrito | undefined> {
    const l = this.tabla.get(id);
    if (!l) return undefined;
    const actualizada = { ...l, ...cambios };
    this.tabla.set(id, actualizada);
    return { ...actualizada };
  }

  override async eliminar(id: number): Promise<void> {
    this.tabla.delete(id);
  }

  /** Emula la transacción: calcula todo sobre una copia y solo la aplica si nada falla. */
  override async transferirLineasYEliminarOrigen(
    idOrigen: number,
    idDestino: number,
    cantidadMaxima: number
  ): Promise<ResultadoTransferencia> {
    const copia = new Map([...this.tabla].map(([id, l]) => [id, { ...l }]));
    let acumuladas = 0;
    let transferidas = 0;
    const ajustadas: LineaAjustadaEnFusion[] = [];
    const limitar = (idVariante: number, solicitada: number): number => {
      if (solicitada <= cantidadMaxima) return solicitada;
      ajustadas.push({ id_variante: idVariante, cantidad_solicitada: solicitada, cantidad_aplicada: cantidadMaxima });
      return cantidadMaxima;
    };
    for (const l of [...copia.values()].filter((linea) => linea.id_carrito === idOrigen)) {
      const existe = [...copia.values()].find((d) => d.id_carrito === idDestino && d.id_variante === l.id_variante);
      if (existe) {
        existe.cantidad = limitar(l.id_variante, existe.cantidad + l.cantidad);
        acumuladas++;
      } else {
        const nueva = nuevaLinea({ id_carrito: idDestino, id_variante: l.id_variante, cantidad: limitar(l.id_variante, l.cantidad) });
        copia.set(nueva.id_linea_carrito, nueva);
        transferidas++;
      }
      copia.delete(l.id_linea_carrito);
    }
    if (this.fallarFusion) {
      throw new Error('Fallo simulado durante la fusión');
    }
    this.tabla = copia;
    this.carritos?.tabla.delete(idOrigen);
    return { acumuladas, transferidas, ajustadas };
  }
}

// ---- Suite de pruebas -------------------------------------------------------

async function ejecutarPruebasM05(): Promise<void> {
  console.log('🚀 Iniciando suite de validación técnica de M05: Carrito de Compras...\n');

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

  /** Comprueba que la operación falle con un AppError del estado y código esperados. */
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

  // ---------------------------------------------------------------------------
  // HU-CAR-01: Carrito de visitante
  // ---------------------------------------------------------------------------
  console.log('--- HU-CAR-01: Carrito de visitante ---');
  {
    const carritoRepo = new CarritoRepoFake();
    const lineaRepo = new LineaRepoFake();
    const service = new CarritoService(carritoRepo, lineaRepo);

    const TOKEN = 'tok-abc-123';
    // RF-CAR-01-03: Crear carrito nuevo si no existe para ese token
    const carrito1 = await service.obtenerOCrearCarritoVisitante(TOKEN);
    assert(carrito1.token_visitante === TOKEN, 'CA-CAR-01-01: carrito creado con token_visitante correcto');
    assert(carrito1.id_usuario === null, 'CA-CAR-01-02: carrito anónimo no tiene id_usuario');
    assert(carrito1.origen === 'visitante', 'CA-CAR-01-03: origen del carrito es "visitante"');

    // RF-CAR-01-03: Reutilizar el carrito existente en vez de crear uno nuevo
    const carrito2 = await service.obtenerOCrearCarritoVisitante(TOKEN);
    assert(carrito1.id_carrito === carrito2.id_carrito, 'CA-CAR-01-04: el mismo token siempre retorna el mismo carrito');

    // RNF-CAR-01-01: Dos tokens distintos dan carritos distintos
    const carritoOtro = await service.obtenerOCrearCarritoVisitante('tok-xyz-999');
    assert(carritoOtro.id_carrito !== carrito1.id_carrito, 'CA-CAR-01-05: tokens distintos producen carritos distintos');
  }

  // ---------------------------------------------------------------------------
  // HU-CAR-02: Gestión de líneas — agregar y acumular
  // ---------------------------------------------------------------------------
  console.log('\n--- HU-CAR-02: Gestión de líneas ---');
  {
    const carritoRepo = new CarritoRepoFake();
    const lineaRepo = new LineaRepoFake();
    const service = new CarritoService(carritoRepo, lineaRepo);

    const TOKEN = 'tok-gestion';
    await service.obtenerOCrearCarritoVisitante(TOKEN);

    // Agregar primera vez
    const tras1 = await service.agregarItemVisitante(TOKEN, { id_variante: 10, cantidad: 2 });
    const linea1 = tras1.lineas.find((l) => l.id_variante === 10);
    assert(linea1 !== undefined, 'CA-CAR-02-01: ítem agregado correctamente');
    assert(linea1?.cantidad === 2, 'CA-CAR-02-02: cantidad de la línea es 2 tras la primera adición');

    // RF-CAR-02-0X: Acumular si la variante ya existe
    const tras2 = await service.agregarItemVisitante(TOKEN, { id_variante: 10, cantidad: 3 });
    const linea2 = tras2.lineas.find((l) => l.id_variante === 10);
    assert(linea2?.cantidad === 5, 'CA-CAR-02-03: acumula cantidad (2+3=5) en vez de crear línea duplicada');
    assert(tras2.total_lineas === 1, 'CA-CAR-02-04: sólo existe una línea para la misma variante');

    // Actualizar cantidad
    const idLinea = linea2?.id_linea_carrito ?? 0;
    const tras3 = await service.actualizarItemVisitante(TOKEN, idLinea, { cantidad: 1 });
    const linea3 = tras3.lineas.find((l) => l.id_linea_carrito === idLinea);
    assert(linea3?.cantidad === 1, 'CA-CAR-02-05: actualizar cantidad a 1 funciona correctamente');

    // Eliminar con cantidad 0
    const tras4 = await service.actualizarItemVisitante(TOKEN, idLinea, { cantidad: 0 });
    assert(tras4.total_lineas === 0, 'CA-CAR-02-06: cantidad 0 elimina la línea del carrito');
  }

  // ---------------------------------------------------------------------------
  // HU-CAR-04: Fusión del carrito de visitante con la cuenta del cliente
  // ---------------------------------------------------------------------------
  console.log('\n--- HU-CAR-04: Fusión de carrito visitante con cliente ---');
  {
    const carritoRepo = new CarritoRepoFake();
    const lineaRepo = new LineaRepoFake();
    const service = new CarritoService(carritoRepo, lineaRepo);

    const TOKEN = 'tok-fusion';
    const ID_USUARIO = 42;

    // Preparar carrito visitante con 2 líneas
    await service.obtenerOCrearCarritoVisitante(TOKEN);
    await service.agregarItemVisitante(TOKEN, { id_variante: 10, cantidad: 2 });
    await service.agregarItemVisitante(TOKEN, { id_variante: 20, cantidad: 1 });

    // El cliente no tiene carrito previo: se asocia directamente
    const resultado = await service.fusionarCarritoConCuenta(ID_USUARIO, { token_visitante: TOKEN });
    assert(resultado.carrito.id_usuario === ID_USUARIO, 'CA-CAR-04-01: carrito asociado al id_usuario correcto');
    assert(resultado.carrito.token_visitante === null, 'CA-CAR-04-02: token_visitante limpiado tras la fusión');
    assert(resultado.carrito.total_lineas >= 2, 'CA-CAR-04-03: el carrito del cliente contiene las líneas del visitante');

    // Token que no existe: retorna carrito del cliente sin cambios
    const resultado2 = await service.fusionarCarritoConCuenta(ID_USUARIO, { token_visitante: 'token-inexistente' });
    assert(resultado2.lineas_acumuladas === 0 && resultado2.lineas_transferidas === 0, 'CA-CAR-04-04: token inexistente no altera el carrito del cliente');
  }

  // ---------------------------------------------------------------------------
  // HU-CAR-05: Revalidación previa al checkout
  // ---------------------------------------------------------------------------
  console.log('\n--- HU-CAR-05: Revalidación previa al checkout ---');
  {
    const carritoRepo = new CarritoRepoFake();
    const lineaRepo = new LineaRepoFake();
    const service = new CarritoService(carritoRepo, lineaRepo);
    const ID_USUARIO = 99;

    await service.obtenerOCrearCarritoCliente(ID_USUARIO);

    // Carrito válido: stock suficiente y variantes activas
    lineaRepo.lineasVivasOverride = [
      lineaViva({ id_variante: 10, cantidad: 2, existencia_referencial: 10, estado_variante: 'activo' }),
    ];
    const revalOk = await service.revalidarCarritoCliente(ID_USUARIO);
    assert(revalOk.valido === true, 'CA-CAR-05-01: carrito sin problemas de stock/precio retorna valido=true');
    assert(revalOk.alertas.length === 0, 'CA-CAR-05-02: carrito válido no genera alertas');

    // Stock insuficiente (RF-CAR-05-02)
    lineaRepo.lineasVivasOverride = [
      lineaViva({ id_variante: 10, cantidad: 15, existencia_referencial: 5, estado_variante: 'activo' }),
    ];
    const revalSinStock = await service.revalidarCarritoCliente(ID_USUARIO);
    assert(revalSinStock.valido === false, 'CA-CAR-05-03: stock insuficiente marca carrito como inválido');
    assert(
      revalSinStock.alertas.some((a) => a.tipo === 'stock_insuficiente'),
      'CA-CAR-05-04: alerta de stock_insuficiente generada correctamente'
    );

    // Variante no disponible (RF-CAR-05-02)
    lineaRepo.lineasVivasOverride = [
      lineaViva({ id_variante: 10, cantidad: 1, existencia_referencial: 10, estado_variante: 'descontinuado' }),
    ];
    const revalNoDisp = await service.revalidarCarritoCliente(ID_USUARIO);
    assert(revalNoDisp.valido === false, 'CA-CAR-05-05: variante descontinuada marca carrito como inválido');
    assert(
      revalNoDisp.alertas.some((a) => a.tipo === 'variante_no_disponible'),
      'CA-CAR-05-06: alerta de variante_no_disponible generada correctamente'
    );
  }

  // ---------------------------------------------------------------------------
  // D1: la variante debe existir y estar activa antes de entrar al carrito
  // ---------------------------------------------------------------------------
  console.log('\n--- D1: Validación de la variante al agregar ---');
  {
    const carritoRepo = new CarritoRepoFake();
    const lineaRepo = new LineaRepoFake();
    const service = new CarritoService(carritoRepo, lineaRepo);
    const TOKEN = 'tok-variante';
    await service.obtenerOCrearCarritoVisitante(TOKEN);

    await esperarError(
      () => service.agregarItemVisitante(TOKEN, { id_variante: 999, cantidad: 1 }),
      404,
      'VARIANTE_NO_ENCONTRADA',
      'D1-01: una variante inexistente responde 404 VARIANTE_NO_ENCONTRADA'
    );

    for (const estado of ['inactivo', 'agotado', 'descontinuado'] as const) {
      lineaRepo.variantes.set(30, estado);
      await esperarError(
        () => service.agregarItemVisitante(TOKEN, { id_variante: 30, cantidad: 1 }),
        422,
        'VARIANTE_NO_DISPONIBLE',
        `D1-02: una variante en estado «${estado}» responde 422 VARIANTE_NO_DISPONIBLE`
      );
    }
    assert(lineaRepo.tabla.size === 0, 'D1-03: ninguna variante rechazada deja una línea en el carrito');

    await service.obtenerOCrearCarritoCliente(7);
    await esperarError(
      () => service.agregarItemCliente(7, { id_variante: 999, cantidad: 1 }),
      404,
      'VARIANTE_NO_ENCONTRADA',
      'D1-04: la misma validación aplica al carrito del cliente'
    );
  }

  // ---------------------------------------------------------------------------
  // D2: al acumular sobre una línea existente no se supera el tope de 999
  // ---------------------------------------------------------------------------
  console.log('\n--- D2: Tope por línea al acumular ---');
  {
    const carritoRepo = new CarritoRepoFake();
    const lineaRepo = new LineaRepoFake();
    const service = new CarritoService(carritoRepo, lineaRepo);
    const TOKEN = 'tok-tope';
    await service.obtenerOCrearCarritoVisitante(TOKEN);

    await service.agregarItemVisitante(TOKEN, { id_variante: 10, cantidad: 990 });
    await esperarError(
      () => service.agregarItemVisitante(TOKEN, { id_variante: 10, cantidad: 10 }),
      422,
      'CANTIDAD_MAXIMA_EXCEDIDA',
      'D2-01: 990 + 10 supera 999 y responde 422 CANTIDAD_MAXIMA_EXCEDIDA'
    );
    const intacto = await service.obtenerOCrearCarritoVisitante(TOKEN);
    assert(intacto.lineas[0]?.cantidad === 990, 'D2-02: la línea conserva su cantidad tras el rechazo');

    const justo = await service.agregarItemVisitante(TOKEN, { id_variante: 10, cantidad: 9 });
    assert(justo.lineas[0]?.cantidad === 999, 'D2-03: 990 + 9 = 999 se acepta (el tope es inclusivo)');
  }

  // ---------------------------------------------------------------------------
  // D3: el token de visitante debe ser un UUID (header y cuerpo de /fusionar)
  // ---------------------------------------------------------------------------
  console.log('\n--- D3: Validación del token de visitante ---');
  {
    const carritoRepo = new CarritoRepoFake();
    const lineaRepo = new LineaRepoFake();
    const ctrl = new CarritoController(new CarritoService(carritoRepo, lineaRepo));
    const UUID = '3f1c2b9a-6d4e-4f8a-9b7c-1a2b3c4d5e6f';

    await esperarError(
      () => ctrl.obtenerCarritoVisitante(peticion({ headers: {} }), new RespuestaFalsa().comoResponse()),
      400,
      'MISSING_VISITOR_TOKEN',
      'D3-01: sin header x-visitor-token responde 400 MISSING_VISITOR_TOKEN'
    );
    for (const invalido of ['tok-abc-123', 'x'.repeat(255), "1' OR '1'='1", '3f1c2b9a6d4e4f8a9b7c1a2b3c4d5e6f']) {
      await esperarError(
        () => ctrl.obtenerCarritoVisitante(peticion({ headers: { 'x-visitor-token': invalido } }), new RespuestaFalsa().comoResponse()),
        400,
        'INVALID_VISITOR_TOKEN',
        `D3-02: el header «${invalido.slice(0, 20)}» no es un UUID y responde 400 INVALID_VISITOR_TOKEN`
      );
    }
    await esperarError(
      () => ctrl.obtenerCarritoVisitante(peticion({ headers: { 'x-visitor-token': [UUID, UUID] } }), new RespuestaFalsa().comoResponse()),
      400,
      'INVALID_VISITOR_TOKEN',
      'D3-03: un header repetido (arreglo) se rechaza'
    );
    assert(carritoRepo.tabla.size === 0, 'D3-04: ningún token rechazado crea un carrito');

    const res = new RespuestaFalsa();
    await ctrl.obtenerCarritoVisitante(peticion({ headers: { 'x-visitor-token': ` ${UUID.toUpperCase()} ` } }), res.comoResponse());
    const creado = [...carritoRepo.tabla.values()][0];
    assert(res.codigo === 200 && creado?.token_visitante === UUID, 'D3-05: un UUID válido se acepta normalizado a minúsculas y sin espacios');

    let rechazoCuerpo = false;
    try {
      await ctrl.fusionarCarrito(peticion({ headers: {}, user: { id: 42 }, body: { token_visitante: 'tok-abc-123' } }), new RespuestaFalsa().comoResponse());
    } catch (error) {
      rechazoCuerpo = error instanceof ZodError;
    }
    assert(rechazoCuerpo, 'D3-06: /fusionar rechaza con ZodError (400) un token_visitante que no es UUID');
  }

  // ---------------------------------------------------------------------------
  // D4: la fusión con un carrito de cliente existente es una sola operación
  // ---------------------------------------------------------------------------
  console.log('\n--- D4: Fusión atómica con carrito de cliente existente ---');
  {
    const prepararFusion = async () => {
      const carritoRepo = new CarritoRepoFake();
      const lineaRepo = new LineaRepoFake(carritoRepo);
      const service = new CarritoService(carritoRepo, lineaRepo);
      await service.obtenerOCrearCarritoCliente(77);
      await service.agregarItemCliente(77, { id_variante: 10, cantidad: 1 });
      const visitante = await service.obtenerOCrearCarritoVisitante('tok-d4');
      await service.agregarItemVisitante('tok-d4', { id_variante: 10, cantidad: 2 });
      await service.agregarItemVisitante('tok-d4', { id_variante: 20, cantidad: 3 });
      return { carritoRepo, lineaRepo, service, idVisitante: visitante.id_carrito };
    };

    const ok = await prepararFusion();
    const resultado = await ok.service.fusionarCarritoConCuenta(77, { token_visitante: 'tok-d4' });
    assert(
      resultado.lineas_acumuladas === 1 && resultado.lineas_transferidas === 1,
      'D4-01: una línea se acumula (variante 10) y otra se transfiere (variante 20)'
    );
    assert(
      resultado.carrito.lineas.find((l) => l.id_variante === 10)?.cantidad === 3,
      'D4-02: la variante repetida suma 1 + 2 = 3 en el carrito del cliente'
    );
    assert(!ok.carritoRepo.tabla.has(ok.idVisitante), 'D4-03: el carrito de visitante desaparece tras la fusión');
    assert(
      ok.carritoRepo.llamadasEliminar === 0,
      'D4-04: el servicio ya no borra el carrito de visitante por fuera de la transacción'
    );

    const falla = await prepararFusion();
    let propagoError = false;
    falla.lineaRepo.fallarFusion = true;
    try {
      await falla.service.fusionarCarritoConCuenta(77, { token_visitante: 'tok-d4' });
    } catch {
      propagoError = true;
    }
    const cliente = await falla.service.obtenerOCrearCarritoCliente(77);
    assert(propagoError, 'D4-05: un fallo en la fusión se propaga al llamador');
    assert(
      falla.carritoRepo.tabla.has(falla.idVisitante) && cliente.total_lineas === 1 && cliente.lineas[0]?.cantidad === 1,
      'D4-06: tras el fallo, el carrito de visitante sigue y el del cliente no cambió'
    );
  }

  // ---------------------------------------------------------------------------
  // B1: la fusión limita al tope de 999 y avisa en un campo opcional
  // ---------------------------------------------------------------------------
  console.log('\n--- B1: Tope de 999 en la fusión, con aviso ---');
  {
    const carritoRepo = new CarritoRepoFake();
    const lineaRepo = new LineaRepoFake(carritoRepo);
    const service = new CarritoService(carritoRepo, lineaRepo);
    await service.obtenerOCrearCarritoCliente(88);
    await service.agregarItemCliente(88, { id_variante: 10, cantidad: 600 });
    await service.agregarItemCliente(88, { id_variante: 20, cantidad: 1 });
    await service.obtenerOCrearCarritoVisitante('tok-b1');
    await service.agregarItemVisitante('tok-b1', { id_variante: 10, cantidad: 500 });
    await service.agregarItemVisitante('tok-b1', { id_variante: 20, cantidad: 2 });

    const resultado = await service.fusionarCarritoConCuenta(88, { token_visitante: 'tok-b1' });
    const cantidad = (idVariante: number) => resultado.carrito.lineas.find((l) => l.id_variante === idVariante)?.cantidad;
    assert(cantidad(10) === 999, 'B1-01: 600 + 500 queda limitado a 999 (no rechaza la fusión)');
    assert(cantidad(20) === 3, 'B1-02: las líneas que no pasan el tope suman normalmente (1 + 2 = 3)');
    assert(
      resultado.avisos?.length === 1 &&
        resultado.avisos[0]?.tipo === 'cantidad_ajustada_al_maximo' &&
        resultado.avisos[0]?.id_variante === 10 &&
        resultado.avisos[0]?.cantidad_solicitada === 1100 &&
        resultado.avisos[0]?.cantidad_aplicada === 999,
      'B1-03: el aviso informa la variante, lo solicitado (1100) y lo aplicado (999)'
    );

    const sinAjuste = new CarritoRepoFake();
    const lineasSinAjuste = new LineaRepoFake(sinAjuste);
    const service2 = new CarritoService(sinAjuste, lineasSinAjuste);
    await service2.obtenerOCrearCarritoCliente(89);
    await service2.agregarItemCliente(89, { id_variante: 10, cantidad: 1 });
    await service2.obtenerOCrearCarritoVisitante('tok-b1-ok');
    await service2.agregarItemVisitante('tok-b1-ok', { id_variante: 10, cantidad: 1 });
    const normal = await service2.fusionarCarritoConCuenta(89, { token_visitante: 'tok-b1-ok' });
    assert(!('avisos' in normal), 'B1-04: sin ajustes, la respuesta no incluye el campo avisos (forma intacta)');
  }

  // ---------------------------------------------------------------------------
  // B2: agregar o acumular en una sola operación atómica
  // ---------------------------------------------------------------------------
  console.log('\n--- B2: Agregado atómico (ON CONFLICT ... DO UPDATE) ---');
  {
    const carritoRepo = new CarritoRepoFake();
    const lineaRepo = new LineaRepoFake();
    const service = new CarritoService(carritoRepo, lineaRepo);
    await service.obtenerOCrearCarritoVisitante('tok-b2');
    await service.agregarItemVisitante('tok-b2', { id_variante: 10, cantidad: 2 });
    const acumulado = await service.agregarItemVisitante('tok-b2', { id_variante: 10, cantidad: 3 });
    assert(
      lineaRepo.llamadasAgregarOAcumular === 2 && lineaRepo.llamadasNoAtomicas === 0,
      'B2-01: agregar usa solo la operación atómica, no la secuencia leer-crear-actualizar'
    );
    assert(acumulado.total_lineas === 1 && acumulado.lineas[0]?.cantidad === 5, 'B2-02: sigue acumulando 2 + 3 = 5 en una sola línea');

    await service.agregarItemVisitante('tok-b2', { id_variante: 10, cantidad: 994 });
    let detalle: unknown;
    try {
      await service.agregarItemVisitante('tok-b2', { id_variante: 10, cantidad: 1 });
    } catch (error) {
      detalle = error instanceof AppError ? error.details : undefined;
    }
    const d = detalle as { maximo?: number; cantidad_actual?: number } | undefined;
    assert(d?.maximo === 999 && d?.cantidad_actual === 999, 'B2-03: el rechazo por tope informa el máximo y la cantidad actual');
  }

  // ---------------------------------------------------------------------------
  // Resumen final
  // ---------------------------------------------------------------------------
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Total: ${superadas + fallidas} pruebas | ✅ ${superadas} superadas | ❌ ${fallidas} fallidas`);
  console.log('='.repeat(60));

  if (fallidas > 0) {
    process.exit(1);
  }
}

ejecutarPruebasM05().catch((err: unknown) => {
  console.error('Error inesperado en la suite:', err);
  process.exit(1);
});
