import { PlantillaRepository } from '../repositories/plantilla.repository';
import {
  IPlantillaNotificacion,
  IPrevisualizacionPlantilla,
} from '../interfaces/notificaciones.interfaces';

// ==============================================================================
// M18 - SERVICIO DE PLANTILLAS DE COMUNICACIÓN (HU-NOT-03)
// Renderizado, validación de variables obligatorias y previsualización
// ==============================================================================

export class PlantillaService {
  constructor(private readonly plantillaRepo: PlantillaRepository) {}

  /**
   * Lista todas las plantillas registradas.
   */
  async listarPlantillas(): Promise<IPlantillaNotificacion[]> {
    return this.plantillaRepo.obtenerTodas();
  }

  /**
   * Obtiene el detalle de una plantilla por su código identificador.
   */
  async obtenerPlantilla(codigo: string): Promise<IPlantillaNotificacion | null> {
    return this.plantillaRepo.obtenerPorCodigo(codigo);
  }

  /**
   * Renderiza el asunto, cuerpo HTML y cuerpo texto reemplazando tags {{variable}}.
   */
  renderizar(
    plantilla: IPlantillaNotificacion,
    variables: Record<string, string | number>
  ): { asunto: string; cuerpoHtml: string; cuerpoTexto: string } {
    let asuntoRenderizado = plantilla.asunto;
    let htmlRenderizado = plantilla.cuerpoHtml;
    let textoRenderizado = plantilla.cuerpoTexto;

    for (const [clave, valor] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${clave}\\s*}}`, 'g');
      const valorStr = String(valor ?? '');
      asuntoRenderizado = asuntoRenderizado.replace(regex, valorStr);
      htmlRenderizado = htmlRenderizado.replace(regex, valorStr);
      textoRenderizado = textoRenderizado.replace(regex, valorStr);
    }

    return {
      asunto: asuntoRenderizado,
      cuerpoHtml: htmlRenderizado,
      cuerpoTexto: textoRenderizado,
    };
  }

  /**
   * Valida que una plantilla propuesta no elimine variables obligatorias (RF-NOT-03-04, CA-NOT-03-03).
   * Si falta alguna variable obligatoria en el contenido HTML o Asunto, la operación debe ser rechazada.
   */
  validarVariablesObligatorias(
    plantilla: IPlantillaNotificacion,
    nuevoHtml: string,
    nuevoAsunto?: string | undefined
  ): { valido: boolean; variablesFaltantes: string[] } {
    const faltantes: string[] = [];
    const contenidoTotal = `${nuevoAsunto ?? ''} ${nuevoHtml}`;

    for (const obligatoria of plantilla.variablesObligatorias) {
      const patron = new RegExp(`{{\\s*${obligatoria}\\s*}}`);
      if (!patron.test(contenidoTotal)) {
        faltantes.push(obligatoria);
      }
    }

    return {
      valido: faltantes.length === 0,
      variablesFaltantes: faltantes,
    };
  }

  /**
   * Actualiza una plantilla aplicando la regla de negocio de variables obligatorias (CA-NOT-03-01, CA-NOT-03-03).
   */
  async actualizarPlantilla(
    codigo: string,
    datos: { asunto: string; cuerpoHtml: string; cuerpoTexto?: string | undefined },
    actualizadoPor?: string | null | undefined
  ): Promise<{
    exitoso: boolean;
    plantilla?: IPlantillaNotificacion | undefined;
    error?: string | undefined;
    variablesFaltantes?: string[] | undefined;
  }> {
    const existente = await this.plantillaRepo.obtenerPorCodigo(codigo);
    if (!existente) {
      return { exitoso: false, error: `Plantilla con código '${codigo}' no encontrada` };
    }

    // Validación crítica del Diagrama HU-NOT-03: ¿El cambio elimina un campo variable obligatorio?
    const validacion = this.validarVariablesObligatorias(existente, datos.cuerpoHtml, datos.asunto);
    if (!validacion.valido) {
      return {
        exitoso: false,
        error: `No es posible guardar: faltan campos variables obligatorios (${validacion.variablesFaltantes.join(', ')})`,
        variablesFaltantes: validacion.variablesFaltantes,
      };
    }

    const actualizada = await this.plantillaRepo.actualizar(codigo, {
      asunto: datos.asunto,
      cuerpoHtml: datos.cuerpoHtml,
      cuerpoTexto: datos.cuerpoTexto,
      actualizadoPor,
    });

    if (!actualizada) {
      return { exitoso: false, error: 'Error inesperado al persistir la plantilla' };
    }

    return { exitoso: true, plantilla: actualizada };
  }

  /**
   * Genera una vista previa de la plantilla con datos de ejemplo (RF-NOT-03-03, CA-NOT-03-02).
   */
  async generarVistaPrevia(
    codigo: string,
    nuevoHtml?: string | undefined,
    nuevoAsunto?: string | undefined,
    nuevoTexto?: string | undefined,
    variablesPersonalizadas?: Record<string, string | number> | undefined
  ): Promise<IPrevisualizacionPlantilla | null> {
    const plantilla = await this.plantillaRepo.obtenerPorCodigo(codigo);
    if (!plantilla) return null;

    // Generar datos de ejemplo basados en las variables disponibles de la plantilla
    const datosEjemplo = this.obtenerDatosEjemplo(plantilla.variablesDisponibles);
    const variablesFinales = { ...datosEjemplo, ...(variablesPersonalizadas ?? {}) };

    const plantillaParaPreview: IPlantillaNotificacion = {
      ...plantilla,
      asunto: nuevoAsunto ?? plantilla.asunto,
      cuerpoHtml: nuevoHtml ?? plantilla.cuerpoHtml,
      cuerpoTexto: nuevoTexto ?? plantilla.cuerpoTexto,
    };

    const renderizado = this.renderizar(plantillaParaPreview, variablesFinales);

    return {
      codigo,
      asunto: renderizado.asunto,
      cuerpoHtml: renderizado.cuerpoHtml,
      cuerpoTexto: renderizado.cuerpoTexto,
      variablesAplicadas: variablesFinales,
    };
  }

  /**
   * Diccionario de valores de prueba para previsualización según el nombre de la variable.
   */
  private obtenerDatosEjemplo(variables: readonly string[]): Record<string, string | number> {
    const ejemplos: Record<string, string | number> = {
      nombre: 'Juan Pérez',
      nombre_cliente: 'Carlos Rodríguez',
      nombre_empresa: 'Pinturas del Valle S.A.S.',
      nit: '900.123.456-7',
      codigo: '782914',
      enlace_verificacion: 'https://pintuclic.com/activar?token=mock-token-12345',
      enlace_recuperacion: 'https://pintuclic.com/recuperar?token=mock-reset-67890',
      tiempo_validez: 15,
      numero_orden: 'ORD-2026-0042',
      nuevo_estado: 'En preparación para despacho',
      fecha: new Date().toLocaleDateString('es-CO'),
      comentarios: 'Tu pedido está siendo embalado con los máximos estándares de calidad.',
      tiempo_estimado_dias: 3,
      motivo: 'Abastecimiento de base entonable desde bodega central',
      numero_cotizacion: 'COT-2026-0812',
      estado_cotizacion: 'Aprobada por asesor técnico',
      vigencia: '15 días calendario',
      observaciones: 'Precios con descuento especial mayorista aplicados.',
      mensaje_prueba: 'Prueba de transporte y entregabilidad completada satisfactoriamente.',
      decision: 'Aprobada',
    };

    const resultado: Record<string, string | number> = {};
    for (const v of variables) {
      resultado[v] = ejemplos[v] ?? `[${v}]`;
    }
    return resultado;
  }
}
