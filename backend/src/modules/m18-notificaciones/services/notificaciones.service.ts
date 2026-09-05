import { PlantillaRepository } from '../repositories/plantilla.repository';
import { EnvioRepository } from '../repositories/envio.repository';
import { SmtpService } from './smtp.service';
import { PlantillaService } from './plantilla.service';
import {
  TipoEventoNotificacion,
  IResultadoEnvio,
  IRegistroEnvio,
  IEstadisticasEntregabilidad,
  EventoCambioEstadoOrdenPayload,
  EventoDemoraStockPayload,
  EventoCotizacionPayload,
} from '../interfaces/notificaciones.interfaces';

// ==============================================================================
// M18 - SERVICIO ORQUESTADOR DE NOTIFICACIONES (HU-NOT-01 a HU-NOT-04)
// Implementa el flujo oficial de despacho transaccional, reintentos y trazabilidad
// ==============================================================================

export class NotificacionesService {
  constructor(
    private readonly plantillaRepo: PlantillaRepository,
    private readonly envioRepo: EnvioRepository,
    private readonly smtpService: SmtpService,
    private readonly plantillaService: PlantillaService
  ) {}

  /**
   * Mapeo entre eventos de negocio y códigos de plantillas (RF-NOT-01-02).
   */
  private resolverCodigoPlantilla(evento: TipoEventoNotificacion): string {
    const mapeo: Record<TipoEventoNotificacion, string> = {
      REGISTRO_CLIENTE: 'registro_cliente',
      RECUPERACION_PASSWORD: 'recuperacion_password',
      SOLICITUD_EMPRESA_RECIBIDA: 'solicitud_empresa_recibida',
      SOLICITUD_EMPRESA_DECISION: 'solicitud_empresa_decision',
      CAMBIO_ESTADO_ORDEN: 'cambio_estado_orden',
      DEMORA_ORDEN_STOCK: 'demora_orden_stock',
      COTIZACION_RESPONDIDA: 'cotizacion_evento',
      COTIZACION_RECHAZADA: 'cotizacion_evento',
      COTIZACION_PROXIMA_VENCER: 'cotizacion_evento',
      PRUEBA_SISTEMA: 'prueba_sistema',
    };
    return mapeo[evento] ?? 'prueba_sistema';
  }

  /**
   * Procesa un evento de notificación siguiendo el Diagrama HU-NOT-01:
   * 1. Registrar evento de comunicación
   * 2. Crear registro de envío (pendiente)
   * 3. Enviar al correo registrado del cliente con política de reintentos
   * 4. Si exitoso -> Marcar como enviado y registrar resultado
   * 5. Si fallido -> Registrar error y marcar como fallido definitivo
   */
  async procesarEvento(
    evento: TipoEventoNotificacion,
    destinatario: string,
    variables: Record<string, string | number>,
    idUsuario?: number | undefined,
    metadata?: Record<string, unknown> | undefined
  ): Promise<IResultadoEnvio> {
    const codigoPlantilla = this.resolverCodigoPlantilla(evento);
    const plantilla = await this.plantillaRepo.obtenerPorCodigo(codigoPlantilla);

    if (!plantilla) {
      return {
        exitoso: false,
        idEnvio: '',
        intentos: 0,
        mensaje: `No existe plantilla configurada para el evento '${evento}' (código: '${codigoPlantilla}')`,
        error: 'PLANTILLA_NO_ENCONTRADA',
      };
    }

    // Renderizar plantilla con las variables provistas
    const { asunto, cuerpoHtml, cuerpoTexto } = this.plantillaService.renderizar(plantilla, variables);

    // 2. Crear Registro de Envío para trazabilidad (RF-NOT-01-04)
    const configSmtp = this.smtpService.obtenerConfig();
    const registro = await this.envioRepo.crearRegistro({
      idUsuario: idUsuario !== undefined ? idUsuario : null,
      destinatario,
      evento,
      codigoPlantilla,
      asunto,
      maxIntentos: configSmtp.maxReintentos,
      metadata: {
        ...(metadata ?? {}),
        evento,
        plantillaUsada: codigoPlantilla,
      },
    });

    // 3. Enviar con política de reintentos (RF-NOT-01-03, CA-NOT-01-02)
    const resultadoEnvio = await this.smtpService.enviarConReintentos(
      {
        para: destinatario,
        asunto,
        html: cuerpoHtml,
        texto: cuerpoTexto,
      },
      async (intentoFallido, errorDetalle) => {
        // En cada intento fallido, actualizar estado a 'reintentando'
        await this.envioRepo.actualizarEstado(
          registro.id,
          'reintentando',
          intentoFallido,
          this.sanearError(errorDetalle)
        );
      }
    );

    // 4. Marcar resultado final
    if (resultadoEnvio.exitoso) {
      await this.envioRepo.actualizarEstado(
        registro.id,
        'enviado',
        resultadoEnvio.intentosRealizados,
        null
      );

      return {
        exitoso: true,
        idEnvio: registro.id,
        intentos: resultadoEnvio.intentosRealizados,
        mensaje: `Notificación enviada exitosamente a ${destinatario}`,
      };
    }

    // 5. Marcar como Fallido Definitivo si se agotaron los intentos (CA-NOT-01-03)
    const errorFinalSaneado = this.sanearError(resultadoEnvio.errorFinal);
    await this.envioRepo.actualizarEstado(
      registro.id,
      'fallido',
      resultadoEnvio.intentosRealizados,
      errorFinalSaneado
    );

    return {
      exitoso: false,
      idEnvio: registro.id,
      intentos: resultadoEnvio.intentosRealizados,
      mensaje: `Fallo el envío tras ${resultadoEnvio.intentosRealizados} intento(s)`,
      error: errorFinalSaneado,
    };
  }

  // ---------------------------------------------------------------------------
  // HU-NOT-02 — Eventos de M08 (Órdenes) y M21 (Cotizaciones)
  // ---------------------------------------------------------------------------

  /**
   * Notifica al cliente cuando cambia el estado de su orden (CA-NOT-02-01).
   */
  async notificarCambioEstadoOrden(payload: EventoCambioEstadoOrdenPayload): Promise<IResultadoEnvio> {
    return this.procesarEvento(
      'CAMBIO_ESTADO_ORDEN',
      payload.destinatario,
      {
        nombre_cliente: payload.nombreCliente,
        numero_orden: payload.numeroOrden,
        nuevo_estado: payload.nuevoEstado,
        fecha: payload.fechaCambio,
        comentarios: payload.comentarios ?? 'Sin comentarios adicionales.',
      },
      payload.idUsuario,
      { orden: payload.numeroOrden, nuevoEstado: payload.nuevoEstado }
    );
  }

  /**
   * Notifica al cliente cuando existe demora por falta de stock (RF-NOT-02-02, CA-NOT-02-02).
   */
  async notificarDemoraStock(payload: EventoDemoraStockPayload): Promise<IResultadoEnvio> {
    return this.procesarEvento(
      'DEMORA_ORDEN_STOCK',
      payload.destinatario,
      {
        nombre_cliente: payload.nombreCliente,
        numero_orden: payload.numeroOrden,
        tiempo_estimado_dias: payload.tiempoEstimadoDias,
        motivo: payload.motivoDemora ?? 'Abastecimiento de insumos en proceso.',
      },
      payload.idUsuario,
      { orden: payload.numeroOrden, demoraDias: payload.tiempoEstimadoDias }
    );
  }

  /**
   * Notifica novedades de cotización comercial (RF-NOT-02-03, CA-NOT-02-03).
   */
  async notificarEventoCotizacion(payload: EventoCotizacionPayload): Promise<IResultadoEnvio> {
    const eventoTipo: TipoEventoNotificacion =
      payload.estadoCotizacion === 'rechazada'
        ? 'COTIZACION_RECHAZADA'
        : payload.estadoCotizacion === 'proxima_a_caducar'
        ? 'COTIZACION_PROXIMA_VENCER'
        : 'COTIZACION_RESPONDIDA';

    return this.procesarEvento(
      eventoTipo,
      payload.destinatario,
      {
        nombre_cliente: payload.nombreCliente,
        numero_cotizacion: payload.numeroCotizacion,
        estado_cotizacion: payload.estadoCotizacion,
        vigencia: payload.fechaVigencia ?? '15 días calendario',
        observaciones: payload.observaciones ?? 'Cotización generada por el equipo comercial.',
      },
      payload.idUsuario,
      { cotizacion: payload.numeroCotizacion, estado: payload.estadoCotizacion }
    );
  }

  // ---------------------------------------------------------------------------
  // HU-NOT-04 — Trazabilidad y Diagnósticos
  // ---------------------------------------------------------------------------

  /**
   * Consulta la bitácora de envíos con filtros y paginación.
   */
  async consultarBitacora(filtros?: {
    estado?: string | undefined;
    evento?: string | undefined;
    destinatario?: string | undefined;
    limite?: number | undefined;
    pagina?: number | undefined;
  }): Promise<{ total: number; envios: IRegistroEnvio[] }> {
    return this.envioRepo.listar(filtros);
  }

  /**
   * Obtiene el detalle de un envío por su ID.
   */
  async obtenerDetalleEnvio(id: string): Promise<IRegistroEnvio | null> {
    return this.envioRepo.obtenerPorId(id);
  }

  /**
   * Obtiene métricas agregadas de entregabilidad.
   */
  async obtenerEstadisticas(): Promise<IEstadisticasEntregabilidad> {
    return this.envioRepo.obtenerEstadisticas();
  }

  /**
   * Verifica la conectividad con el servidor SMTP configurado.
   */
  async probarConexionSmtp(): Promise<{ conectado: boolean; detalle: string }> {
    return this.smtpService.verificarConexion();
  }

  /**
   * Sanea los mensajes de error para no exponer información sensible en logs (HU-SEG-06).
   */
  private sanearError(error?: string | null): string {
    if (!error) return 'Error de despacho desconocido';
    return error
      .replace(/password[:=]\s*\S+/gi, 'password=***')
      .replace(/token[:=]\s*\S+/gi, 'token=***')
      .replace(/auth[:=]\s*\S+/gi, 'auth=***');
  }
}
