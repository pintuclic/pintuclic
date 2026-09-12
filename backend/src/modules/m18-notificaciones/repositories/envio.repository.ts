import { randomUUID } from 'crypto';
import {
  IRegistroEnvio,
  EstadoEnvioNotificacion,
  TipoEventoNotificacion,
  IEstadisticasEntregabilidad,
} from '../interfaces/notificaciones.interfaces';

// ==============================================================================
// M18 - REPOSITORIO DE ENVÍOS Y TRAZABILIDAD (RF-NOT-01-04, HU-NOT-04)
// Registro auditable de despachos y diagnósticos de entregabilidad (HU-SEG-06)
// ==============================================================================

export class EnvioRepository {
  private readonly registros: Map<string, IRegistroEnvio>;

  constructor() {
    this.registros = new Map();
  }

  /**
   * Crea un nuevo registro de envío en estado inicial ('pendiente').
   */
  async crearRegistro(datos: {
    idUsuario?: number | null | undefined;
    destinatario: string;
    evento: TipoEventoNotificacion;
    codigoPlantilla: string;
    asunto: string;
    maxIntentos: number;
    metadata?: Record<string, unknown> | undefined;
  }): Promise<IRegistroEnvio> {
    const ahora = new Date().toISOString();
    const id = randomUUID();

    const nuevoRegistro: IRegistroEnvio = {
      id,
      idUsuario: datos.idUsuario ?? null,
      destinatario: datos.destinatario,
      evento: datos.evento,
      codigoPlantilla: datos.codigoPlantilla,
      asunto: datos.asunto,
      estado: 'pendiente',
      intentos: 0,
      maxIntentos: datos.maxIntentos,
      error: null,
      metadata: datos.metadata,
      fechaCreacion: ahora,
      fechaUltimoIntento: ahora,
    };

    this.registros.set(id, nuevoRegistro);
    return { ...nuevoRegistro };
  }

  /**
   * Actualiza el estado y contador de intentos de un despacho.
   */
  async actualizarEstado(
    id: string,
    nuevoEstado: EstadoEnvioNotificacion,
    intentos: number,
    error?: string | null | undefined
  ): Promise<IRegistroEnvio | null> {
    const registro = this.registros.get(id);
    if (!registro) return null;

    registro.estado = nuevoEstado;
    registro.intentos = intentos;
    registro.fechaUltimoIntento = new Date().toISOString();
    if (error !== undefined) {
      registro.error = error;
    }

    this.registros.set(id, registro);
    return { ...registro };
  }

  /**
   * Busca un registro por su identificador UUID.
   */
  async obtenerPorId(id: string): Promise<IRegistroEnvio | null> {
    const registro = this.registros.get(id);
    if (!registro) return null;
    return { ...registro };
  }

  /**
   * Lista registros aplicando filtros opcionales de estado, evento y destinatario con paginación.
   */
  async listar(filtros?: {
    estado?: string | undefined;
    evento?: string | undefined;
    destinatario?: string | undefined;
    limite?: number | undefined;
    pagina?: number | undefined;
  }): Promise<{ total: number; envios: IRegistroEnvio[] }> {
    let items = Array.from(this.registros.values());

    if (filtros?.estado) {
      items = items.filter((r) => r.estado === filtros.estado);
    }
    if (filtros?.evento) {
      items = items.filter((r) => r.evento === filtros.evento);
    }
    if (filtros?.destinatario) {
      const destBusqueda = filtros.destinatario.toLowerCase();
      items = items.filter((r) => r.destinatario.toLowerCase().includes(destBusqueda));
    }

    // Orden cronológico descendente (más recientes primero)
    items.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());

    const total = items.length;
    const limite = Math.max(1, filtros?.limite ?? 20);
    const pagina = Math.max(1, filtros?.pagina ?? 1);
    const offset = (pagina - 1) * limite;
    const paginados = items.slice(offset, offset + limite);

    return { total, envios: paginados };
  }

  /**
   * Calcula métricas globales de entregabilidad (HU-NOT-04).
   */
  async obtenerEstadisticas(): Promise<IEstadisticasEntregabilidad> {
    const todos = Array.from(this.registros.values());
    const totalEnvios = todos.length;
    const enviadosExitosos = todos.filter((r) => r.estado === 'enviado').length;
    const fallidosDefinitivos = todos.filter((r) => r.estado === 'fallido').length;
    const reintentosTotales = todos.reduce((acc, r) => acc + Math.max(0, r.intentos - 1), 0);

    const tasaEntregabilidad = totalEnvios > 0
      ? Number(((enviadosExitosos / totalEnvios) * 100).toFixed(2))
      : 100;

    return {
      totalEnvios,
      enviadosExitosos,
      fallidosDefinitivos,
      reintentosTotales,
      tasaEntregabilidad,
    };
  }
}
