import { CarritoService } from '../services/carrito.service';
import { CarritoRepository } from '../repositories/carrito.repository';
import { LineaCarritoRepository } from '../repositories/linea-carrito.repository';
import { Carrito, LineaCarrito } from '../../../core/db/types';
import { LineaCarritoViva } from '../interfaces/m05.interfaces';

// ==============================================================================
// M05 - SUITE DE VALIDACIÓN DE CRITERIOS DE ACEPTACIÓN
// (HU-CAR-01, HU-CAR-02, HU-CAR-04, HU-CAR-05)
// Repositorios fake en memoria — sin conexión real a PostgreSQL
// Ejecutar: npx tsx src/modules/m05-carritodecompras/__tests__/m05.test.ts
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

  override async eliminar(idCarrito: number): Promise<void> {
    this.tabla.delete(idCarrito);
  }
}

class LineaRepoFake extends LineaCarritoRepository {
  public tabla: Map<number, LineaCarrito> = new Map();
  public lineasVivasOverride: LineaCarritoViva[] | null = null;

  constructor() {
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

  override async transferirLineas(
    idOrigen: number,
    idDestino: number
  ): Promise<{ acumuladas: number; transferidas: number }> {
    let acumuladas = 0;
    let transferidas = 0;
    for (const l of this.tabla.values()) {
      if (l.id_carrito === idOrigen) {
        const existe = await this.buscarPorVariante(idDestino, l.id_variante);
        if (existe) {
          await this.actualizarCantidad(existe.id_linea_carrito, { cantidad: existe.cantidad + l.cantidad });
          acumuladas++;
        } else {
          await this.crear({ id_carrito: idDestino, id_variante: l.id_variante, cantidad: l.cantidad });
          transferidas++;
        }
      }
    }
    return { acumuladas, transferidas };
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
