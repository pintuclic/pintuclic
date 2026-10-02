import { AppError } from '../../../core/middlewares/errorHandler';
import { Carrito } from '../../../core/db/types';
import { CarritoRepository } from '../repositories/carrito.repository';
import { LineaCarritoRepository } from '../repositories/linea-carrito.repository';
import { AgregarItemDTO, ActualizarItemDTO, FusionarCarritoDTO, CANTIDAD_MAXIMA_POR_LINEA } from '../dtos';
import {
  CarritoVivo,
  ResultadoRevalidacion,
  ResultadoFusion,
  AlertaRevalidacion,
  AvisoFusion,
  OrigenCarrito,
} from '../interfaces/m05.interfaces';

// ==============================================================================
// M05 - SERVICIO DEL CARRITO DE COMPRAS (HU-CAR-01 / HU-CAR-02 / HU-CAR-04 / HU-CAR-05)
// Lógica de negocio: carrito vivo, gestión de líneas, fusión y revalidación
// ==============================================================================

export class CarritoService {
  constructor(
    private readonly carritoRepo: CarritoRepository,
    private readonly lineaRepo: LineaCarritoRepository
  ) {}

  // ============================================================================
  // MÉTODO PRIVADO: construye la vista completa del carrito vivo
  // ============================================================================

  private async construirCarritoVivo(idCarrito: number, origen: OrigenCarrito): Promise<CarritoVivo> {
    const cabecera = await this.carritoRepo.buscarPorId(idCarrito);
    if (!cabecera) {
      throw new AppError('Carrito no encontrado', 404, 'NOT_FOUND');
    }

    const lineas = await this.lineaRepo.listarLineasVivas(idCarrito);

    const total = lineas
      .reduce((acc, l) => acc + Number(l.subtotal), 0)
      .toFixed(2);

    return {
      id_carrito: cabecera.id_carrito,
      origen,
      token_visitante: cabecera.token_visitante,
      id_usuario: cabecera.id_usuario,
      fecha_ultima_actividad: cabecera.fecha_ultima_actividad,
      lineas,
      total,
      total_lineas: lineas.length,
    };
  }

  // ============================================================================
  // HU-CAR-01: Obtener o crear carrito de visitante anónimo
  // ============================================================================

  /**
   * Retorna el carrito existente del visitante o crea uno nuevo si no existe (RF-CAR-01-03).
   * El token opaco identifica al dispositivo sin exponer ni exigir datos personales (RNF-CAR-01-01).
   */
  async obtenerOCrearCarritoVisitante(tokenVisitante: string): Promise<CarritoVivo> {
    const carrito = await this.asegurarCarritoVisitante(tokenVisitante);
    await this.carritoRepo.refrescarActividad(carrito.id_carrito);
    return this.construirCarritoVivo(carrito.id_carrito, 'visitante');
  }

  /**
   * Retorna el carrito de un cliente autenticado (HU-CAR-04 / RF-CAR-04-01).
   * Si no tiene carrito previo, crea uno asociado a su cuenta.
   */
  async obtenerOCrearCarritoCliente(idUsuario: number): Promise<CarritoVivo> {
    const carrito = await this.asegurarCarritoCliente(idUsuario);
    await this.carritoRepo.refrescarActividad(carrito.id_carrito);
    return this.construirCarritoVivo(carrito.id_carrito, 'cliente');
  }

  /** Cabecera del carrito del visitante; la crea si el token todavía no tiene una. */
  private async asegurarCarritoVisitante(tokenVisitante: string): Promise<Carrito> {
    const carrito = await this.carritoRepo.buscarPorToken(tokenVisitante);
    return carrito ?? this.carritoRepo.crear({ token_visitante: tokenVisitante, id_usuario: null });
  }

  /** Cabecera del carrito del cliente; la crea si la cuenta todavía no tiene una. */
  private async asegurarCarritoCliente(idUsuario: number): Promise<Carrito> {
    const carrito = await this.carritoRepo.buscarPorUsuario(idUsuario);
    return carrito ?? this.carritoRepo.crear({ token_visitante: null, id_usuario: idUsuario });
  }

  // ============================================================================
  // HU-CAR-02: Gestión de líneas del carrito (agregar, actualizar, eliminar)
  // ============================================================================

  /**
   * Agrega una variante al carrito del visitante o acumula si ya existe (RF-CAR-02-0X).
   * Si el token todavía no tiene carrito, lo crea: agregar no exige un GET previo.
   * Diferida la autenticación estrictamente al momento del checkout (RF-CAR-01-02).
   */
  async agregarItemVisitante(
    tokenVisitante: string,
    datos: AgregarItemDTO
  ): Promise<CarritoVivo> {
    await this.validarVarianteVendible(datos.id_variante);
    const carrito = await this.asegurarCarritoVisitante(tokenVisitante);
    return this.procesarAgregarItem(carrito.id_carrito, datos, 'visitante');
  }

  /**
   * Agrega una variante al carrito del cliente autenticado o acumula si ya existe (RF-CAR-02-0X).
   * Si la cuenta todavía no tiene carrito, lo crea.
   */
  async agregarItemCliente(
    idUsuario: number,
    datos: AgregarItemDTO
  ): Promise<CarritoVivo> {
    await this.validarVarianteVendible(datos.id_variante);
    const carrito = await this.asegurarCarritoCliente(idUsuario);
    return this.procesarAgregarItem(carrito.id_carrito, datos, 'cliente');
  }

  /**
   * Solo se agregan variantes que existen y están a la venta. Sin esta comprobación, un id
   * inválido llegaba a la llave foránea y respondía 500. Se valida antes de crear el
   * carrito, para que una petición rechazada no deje carritos vacíos.
   */
  private async validarVarianteVendible(idVariante: number): Promise<void> {
    const variante = await this.lineaRepo.buscarVariante(idVariante);
    if (!variante) {
      throw new AppError('La variante solicitada no existe', 404, 'VARIANTE_NO_ENCONTRADA');
    }
    if (variante.estado !== 'activo') {
      throw new AppError('La variante solicitada no está disponible para la venta', 422, 'VARIANTE_NO_DISPONIBLE');
    }
  }

  /**
   * Lógica común de agregar o acumular ítem (compartida visitante/cliente).
   */
  private async procesarAgregarItem(
    idCarrito: number,
    datos: AgregarItemDTO,
    origen: OrigenCarrito
  ): Promise<CarritoVivo> {
    // Insertar o acumular en una sola sentencia atómica, sin superar el tope por línea.
    const linea = await this.lineaRepo.agregarOAcumular(
      idCarrito,
      datos.id_variante,
      datos.cantidad,
      CANTIDAD_MAXIMA_POR_LINEA
    );
    if (!linea) {
      const actual = await this.lineaRepo.buscarPorVariante(idCarrito, datos.id_variante);
      throw new AppError(
        `La cantidad total de la línea no puede superar ${CANTIDAD_MAXIMA_POR_LINEA} unidades`,
        422,
        'CANTIDAD_MAXIMA_EXCEDIDA',
        { maximo: CANTIDAD_MAXIMA_POR_LINEA, cantidad_actual: actual?.cantidad ?? 0 }
      );
    }

    await this.carritoRepo.refrescarActividad(idCarrito);
    return this.construirCarritoVivo(idCarrito, origen);
  }

  /**
   * Actualiza la cantidad de una línea existente del carrito de visitante (HU-CAR-02).
   * Si cantidad === 0, elimina la línea.
   */
  async actualizarItemVisitante(
    tokenVisitante: string,
    idLineaCarrito: number,
    datos: ActualizarItemDTO
  ): Promise<CarritoVivo> {
    const carrito = await this.carritoRepo.buscarPorToken(tokenVisitante);
    if (!carrito) {
      throw new AppError('Carrito de visitante no encontrado', 404, 'NOT_FOUND');
    }
    return this.procesarActualizarItem(carrito.id_carrito, idLineaCarrito, datos, 'visitante');
  }

  /**
   * Actualiza la cantidad de una línea existente del carrito de cliente (HU-CAR-02).
   * Si cantidad === 0, elimina la línea.
   */
  async actualizarItemCliente(
    idUsuario: number,
    idLineaCarrito: number,
    datos: ActualizarItemDTO
  ): Promise<CarritoVivo> {
    const carrito = await this.carritoRepo.buscarPorUsuario(idUsuario);
    if (!carrito) {
      throw new AppError('Carrito de cliente no encontrado', 404, 'NOT_FOUND');
    }
    return this.procesarActualizarItem(carrito.id_carrito, idLineaCarrito, datos, 'cliente');
  }

  /**
   * Lógica común de actualización/eliminación de línea (compartida visitante/cliente).
   */
  private async procesarActualizarItem(
    idCarrito: number,
    idLineaCarrito: number,
    datos: ActualizarItemDTO,
    origen: OrigenCarrito
  ): Promise<CarritoVivo> {
    const linea = await this.lineaRepo.buscarPorId(idLineaCarrito);
    if (!linea || linea.id_carrito !== idCarrito) {
      throw new AppError('Línea del carrito no encontrada o no pertenece a este carrito', 404, 'NOT_FOUND');
    }

    if (datos.cantidad === 0) {
      await this.lineaRepo.eliminar(idLineaCarrito);
    } else {
      await this.lineaRepo.actualizarCantidad(idLineaCarrito, { cantidad: datos.cantidad });
    }

    await this.carritoRepo.refrescarActividad(idCarrito);
    return this.construirCarritoVivo(idCarrito, origen);
  }

  /**
   * Elimina una línea específica del carrito de visitante (HU-CAR-02).
   */
  async eliminarItemVisitante(
    tokenVisitante: string,
    idLineaCarrito: number
  ): Promise<CarritoVivo> {
    const carrito = await this.carritoRepo.buscarPorToken(tokenVisitante);
    if (!carrito) {
      throw new AppError('Carrito de visitante no encontrado', 404, 'NOT_FOUND');
    }
    return this.procesarEliminarItem(carrito.id_carrito, idLineaCarrito, 'visitante');
  }

  /**
   * Elimina una línea específica del carrito de cliente (HU-CAR-02).
   */
  async eliminarItemCliente(
    idUsuario: number,
    idLineaCarrito: number
  ): Promise<CarritoVivo> {
    const carrito = await this.carritoRepo.buscarPorUsuario(idUsuario);
    if (!carrito) {
      throw new AppError('Carrito de cliente no encontrado', 404, 'NOT_FOUND');
    }
    return this.procesarEliminarItem(carrito.id_carrito, idLineaCarrito, 'cliente');
  }

  /**
   * Lógica común de eliminación de línea.
   */
  private async procesarEliminarItem(
    idCarrito: number,
    idLineaCarrito: number,
    origen: OrigenCarrito
  ): Promise<CarritoVivo> {
    const linea = await this.lineaRepo.buscarPorId(idLineaCarrito);
    if (!linea || linea.id_carrito !== idCarrito) {
      throw new AppError('Línea del carrito no encontrada o no pertenece a este carrito', 404, 'NOT_FOUND');
    }

    await this.lineaRepo.eliminar(idLineaCarrito);
    await this.carritoRepo.refrescarActividad(idCarrito);
    return this.construirCarritoVivo(idCarrito, origen);
  }

  // ============================================================================
  // HU-CAR-04: Fusión del carrito de visitante con la cuenta del cliente
  // ============================================================================

  /**
   * Al autenticarse, asocia el carrito de visitante a la cuenta del cliente (RF-CAR-04-01).
   * Si el cliente ya tiene carrito propio, fusiona inteligentemente las líneas (RF-CAR-04-03):
   * - Líneas nuevas se transfieren al carrito del cliente.
   * - Líneas duplicadas acumulan cantidad en el carrito del cliente.
   * Tras la fusión, el carrito del visitante se elimina.
   */
  async fusionarCarritoConCuenta(
    idUsuario: number,
    datos: FusionarCarritoDTO
  ): Promise<ResultadoFusion> {
    const carritoVisitante = await this.carritoRepo.buscarPorToken(datos.token_visitante);
    if (!carritoVisitante) {
      // No existe carrito para ese token: retornar el carrito del cliente sin cambios
      const carritoCliente = await this.obtenerOCrearCarritoCliente(idUsuario);
      return { carrito: carritoCliente, lineas_acumuladas: 0, lineas_transferidas: 0 };
    }

    let carritoCliente = await this.carritoRepo.buscarPorUsuario(idUsuario);

    if (!carritoCliente) {
      // El cliente no tiene carrito propio: simplemente asociar el carrito visitante
      carritoCliente = await this.carritoRepo.actualizar(carritoVisitante.id_carrito, {
        id_usuario: idUsuario,
        token_visitante: null,
      }) ?? carritoVisitante;

      const carritoVivo = await this.construirCarritoVivo(carritoCliente.id_carrito, 'cliente');
      return { carrito: carritoVivo, lineas_acumuladas: 0, lineas_transferidas: carritoVivo.total_lineas };
    }

    // Fusión: el cliente ya tiene su propio carrito. La transferencia de líneas y el
    // borrado del carrito de visitante ocurren en una sola transacción. Si una suma
    // supera el tope por línea, queda en el máximo y se avisa (decisión provisional
    // mientras se define RF-CAR-04-03: no se bloquea el inicio de sesión).
    const { acumuladas, transferidas, ajustadas } = await this.lineaRepo.transferirLineasYEliminarOrigen(
      carritoVisitante.id_carrito,
      carritoCliente.id_carrito,
      CANTIDAD_MAXIMA_POR_LINEA
    );

    const carritoVivo = await this.construirCarritoVivo(carritoCliente.id_carrito, 'cliente');
    const resultado: ResultadoFusion = {
      carrito: carritoVivo,
      lineas_acumuladas: acumuladas,
      lineas_transferidas: transferidas,
    };
    if (ajustadas.length > 0) {
      resultado.avisos = ajustadas.map(
        (a): AvisoFusion => ({
          tipo: 'cantidad_ajustada_al_maximo',
          id_variante: a.id_variante,
          cantidad_solicitada: a.cantidad_solicitada,
          cantidad_aplicada: a.cantidad_aplicada,
          descripcion: `La variante ${a.id_variante} sumaba ${a.cantidad_solicitada} unidades y quedó en el máximo de ${a.cantidad_aplicada} por línea.`,
        })
      );
    }
    return resultado;
  }

  // ============================================================================
  // HU-CAR-05: Revalidación previa al checkout (carrito vivo)
  // ============================================================================

  /**
   * Revalida precio vigente y existencia de todas las líneas del carrito del cliente
   * justo antes de proceder al pago (RF-CAR-05-01 / RF-CAR-05-02 / RF-CAR-05-05).
   * El carrito es una referencia viva: NO guarda precios históricos (RF-CAR-05-04).
   */
  async revalidarCarritoCliente(idUsuario: number): Promise<ResultadoRevalidacion> {
    const carrito = await this.carritoRepo.buscarPorUsuario(idUsuario);
    if (!carrito) {
      throw new AppError('No se encontró un carrito activo para revalidar', 404, 'NOT_FOUND');
    }

    const lineasVivas = await this.lineaRepo.listarLineasVivas(carrito.id_carrito);
    const alertas: AlertaRevalidacion[] = [];

    for (const linea of lineasVivas) {
      // RF-CAR-05-02: verificar stock suficiente
      if (linea.existencia_referencial < linea.cantidad) {
        alertas.push({
          id_linea_carrito: linea.id_linea_carrito,
          id_variante: linea.id_variante,
          tipo: 'stock_insuficiente',
          descripcion: `Stock insuficiente para la variante ${linea.id_variante}. Disponible: ${linea.existencia_referencial}, solicitado: ${linea.cantidad}.`,
          cantidad_solicitada: linea.cantidad,
          existencia_disponible: linea.existencia_referencial,
        });
      }

      // RF-CAR-05-01 / RF-CAR-05-02: variante no disponible en catálogo
      if (linea.estado_variante !== 'activo') {
        alertas.push({
          id_linea_carrito: linea.id_linea_carrito,
          id_variante: linea.id_variante,
          tipo: 'variante_no_disponible',
          descripcion: `La variante ${linea.id_variante} ya no está disponible en el catálogo (estado: ${linea.estado_variante}).`,
        });
      }
    }

    const carritoVivo = await this.construirCarritoVivo(carrito.id_carrito, 'cliente');

    return {
      valido: alertas.length === 0,
      alertas,
      carrito: carritoVivo,
    };
  }
}
