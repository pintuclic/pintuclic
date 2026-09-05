import { IPlantillaNotificacion } from '../interfaces/notificaciones.interfaces';

// ==============================================================================
// M18 - REPOSITORIO DE PLANTILLAS DE COMUNICACIÓN (HU-NOT-03)
// Catálogo administrable de plantillas y variables obligatorias (RF-NOT-03-01 a RF-NOT-03-04)
// ==============================================================================

export class PlantillaRepository {
  private readonly plantillas: Map<string, IPlantillaNotificacion>;

  constructor() {
    this.plantillas = new Map();
    this.cargarPlantillasIniciales();
  }

  /**
   * Obtiene la lista completa de plantillas registradas.
   */
  async obtenerTodas(): Promise<IPlantillaNotificacion[]> {
    return Array.from(this.plantillas.values());
  }

  /**
   * Obtiene una plantilla por su código único. Retorna null si no existe.
   */
  async obtenerPorCodigo(codigo: string): Promise<IPlantillaNotificacion | null> {
    const encontrada = this.plantillas.get(codigo);
    if (!encontrada) return null;
    return { ...encontrada };
  }

  /**
   * Actualiza el contenido (asunto, cuerpoHtml, cuerpoTexto) de una plantilla.
   */
  async actualizar(
    codigo: string,
    datos: {
      asunto: string;
      cuerpoHtml: string;
      cuerpoTexto?: string | undefined;
      actualizadoPor?: string | null | undefined;
    }
  ): Promise<IPlantillaNotificacion | null> {
    const existente = this.plantillas.get(codigo);
    if (!existente) return null;

    const actualizada: IPlantillaNotificacion = {
      ...existente,
      asunto: datos.asunto,
      cuerpoHtml: datos.cuerpoHtml,
      cuerpoTexto: datos.cuerpoTexto ?? datos.cuerpoHtml.replace(/<[^>]+>/g, ' ').trim(),
      fechaActualizacion: new Date().toISOString(),
      actualizadoPor: datos.actualizadoPor !== undefined ? datos.actualizadoPor : (existente.actualizadoPor ?? null),
    };

    this.plantillas.set(codigo, actualizada);
    return { ...actualizada };
  }

  /**
   * Restablece una plantilla a sus valores por defecto.
   */
  async restablecer(codigo: string): Promise<IPlantillaNotificacion | null> {
    const porDefecto = this.obtenerPlantillaPorDefecto(codigo);
    if (!porDefecto) return null;
    this.plantillas.set(codigo, porDefecto);
    return { ...porDefecto };
  }

  // ---------------------------------------------------------------------------
  // Catálogo inicial con estándares y variables obligatorias del sistema
  // ---------------------------------------------------------------------------
  private cargarPlantillasIniciales(): void {
    const catalogo: IPlantillaNotificacion[] = [
      {
        codigo: 'registro_cliente',
        nombre: 'Activación de Cuenta de Cliente',
        descripcion: 'Envío de código y enlace de verificación para nuevos usuarios particulares (M04 / HU-CUE-01)',
        asunto: '¡Bienvenido a Pintu Clic! Confirma tu cuenta',
        cuerpoHtml: '<div style="font-family:sans-serif;max-width:600px;margin:auto;"><h2>¡Hola {{nombre}}!</h2><p>Gracias por unirte a Pintu Clic. Tu código de activación es: <strong>{{codigo}}</strong></p><p><a href="{{enlace_verificacion}}" style="background:#003366;color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:4px;">Activar mi cuenta</a></p></div>',
        cuerpoTexto: '¡Hola {{nombre}}! Gracias por unirte a Pintu Clic. Tu código de activación es: {{codigo}}. Enlace de activación: {{enlace_verificacion}}',
        variablesDisponibles: ['nombre', 'codigo', 'enlace_verificacion'],
        variablesObligatorias: ['codigo', 'enlace_verificacion'],
        fechaActualizacion: new Date().toISOString(),
      },
      {
        codigo: 'recuperacion_password',
        nombre: 'Recuperación de Contraseña',
        descripcion: 'Enlace con token efímero para restablecer clave de acceso (M04 / HU-CUE-05)',
        asunto: 'Restablecimiento de contraseña en Pintu Clic',
        cuerpoHtml: '<div style="font-family:sans-serif;max-width:600px;margin:auto;"><h2>Recuperación de Acceso</h2><p>Hola {{nombre}}, recibimos una solicitud para restablecer tu contraseña.</p><p><a href="{{enlace_recuperacion}}" style="background:#d9534f;color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:4px;">Restablecer contraseña</a></p><p>Este enlace es válido por {{tiempo_validez}} minutos.</p></div>',
        cuerpoTexto: 'Hola {{nombre}}, recibimos una solicitud para restablecer tu contraseña. Enlace: {{enlace_recuperacion}} (Válido por {{tiempo_validez}} minutos).',
        variablesDisponibles: ['nombre', 'enlace_recuperacion', 'tiempo_validez'],
        variablesObligatorias: ['enlace_recuperacion'],
        fechaActualizacion: new Date().toISOString(),
      },
      {
        codigo: 'solicitud_empresa_recibida',
        nombre: 'Solicitud de Cuenta Empresa en Revisión',
        descripcion: 'Aviso al cliente corporativo de que su registro entró en cola de revisión (M04 / HU-CUE-03)',
        asunto: 'Hemos recibido tu solicitud de cuenta empresa',
        cuerpoHtml: '<div style="font-family:sans-serif;max-width:600px;margin:auto;"><h2>Solicitud en Revisión</h2><p>Estimado equipo de {{nombre_empresa}} (NIT: {{nit}}):</p><p>Su solicitud ha sido radicada con éxito y está siendo evaluada por nuestro equipo comercial.</p></div>',
        cuerpoTexto: 'Estimado equipo de {{nombre_empresa}} (NIT: {{nit}}): Su solicitud ha sido radicada con éxito y está en evaluación.',
        variablesDisponibles: ['nombre_empresa', 'nit'],
        variablesObligatorias: ['nombre_empresa'],
        fechaActualizacion: new Date().toISOString(),
      },
      {
        codigo: 'solicitud_empresa_decision',
        nombre: 'Resolución de Solicitud de Cuenta Empresa',
        descripcion: 'Notificación del dictamen de aprobación o rechazo de empresa (M04 / HU-CUE-09)',
        asunto: 'Resolución sobre tu solicitud de cuenta empresa en Pintu Clic',
        cuerpoHtml: '<div style="font-family:sans-serif;max-width:600px;margin:auto;"><h2>Estado de Solicitud</h2><p>Empresa: {{nombre_empresa}}</p><p>Decisión tomada: <strong>{{decision}}</strong></p><p>{{motivo}}</p></div>',
        cuerpoTexto: 'Empresa: {{nombre_empresa}}. Decisión tomada: {{decision}}. Motivo/Detalles: {{motivo}}',
        variablesDisponibles: ['nombre_empresa', 'decision', 'motivo'],
        variablesObligatorias: ['decision'],
        fechaActualizacion: new Date().toISOString(),
      },
      {
        codigo: 'cambio_estado_orden',
        nombre: 'Actualización del Estado de Pedido',
        descripcion: 'Notificación de transición en el ciclo de vida de la orden (M08 / HU-NOT-02)',
        asunto: 'Tu pedido #{{numero_orden}} ha cambiado de estado',
        cuerpoHtml: '<div style="font-family:sans-serif;max-width:600px;margin:auto;"><h2>Hola {{nombre_cliente}}</h2><p>Tu orden <strong>#{{numero_orden}}</strong> ha pasado al estado: <strong>{{nuevo_estado}}</strong> (Fecha: {{fecha}}).</p><p>{{comentarios}}</p></div>',
        cuerpoTexto: 'Hola {{nombre_cliente}}. Tu orden #{{numero_orden}} ha pasado al estado: {{nuevo_estado}} (Fecha: {{fecha}}). {{comentarios}}',
        variablesDisponibles: ['nombre_cliente', 'numero_orden', 'nuevo_estado', 'fecha', 'comentarios'],
        variablesObligatorias: ['numero_orden', 'nuevo_estado'],
        fechaActualizacion: new Date().toISOString(),
      },
      {
        codigo: 'demora_orden_stock',
        nombre: 'Aviso de Demora por Inventario',
        descripcion: 'Aviso preventivo de retraso en despacho por abastecimiento de stock (M08 / HU-NOT-02)',
        asunto: 'Aviso importante sobre el tiempo de entrega de tu pedido #{{numero_orden}}',
        cuerpoHtml: '<div style="font-family:sans-serif;max-width:600px;margin:auto;"><h2>Aviso de Demora en tu Pedido</h2><p>Estimado/a {{nombre_cliente}}:</p><p>Estamos gestionando el abastecimiento de pintura para tu pedido #{{numero_orden}}. El tiempo adicional estimado es de <strong>{{tiempo_estimado_dias}} días hábiles</strong>.</p><p>{{motivo}}</p></div>',
        cuerpoTexto: 'Estimado/a {{nombre_cliente}}: Estamos gestionando el abastecimiento para tu orden #{{numero_orden}}. Tiempo adicional estimado: {{tiempo_estimado_dias}} días hábiles. {{motivo}}',
        variablesDisponibles: ['nombre_cliente', 'numero_orden', 'tiempo_estimado_dias', 'motivo'],
        variablesObligatorias: ['numero_orden'],
        fechaActualizacion: new Date().toISOString(),
      },
      {
        codigo: 'cotizacion_evento',
        nombre: 'Novedades de Cotización Comercial',
        descripcion: 'Notificación de respuesta, rechazo o vencimiento de cotizaciones (M21 / HU-NOT-02)',
        asunto: 'Novedad sobre tu cotización #{{numero_cotizacion}}',
        cuerpoHtml: '<div style="font-family:sans-serif;max-width:600px;margin:auto;"><h2>Novedad de Cotización</h2><p>Hola {{nombre_cliente}}, tu cotización #{{numero_cotizacion}} se encuentra en estado: <strong>{{estado_cotizacion}}</strong>.</p><p>Vigencia: {{vigencia}}</p><p>{{observaciones}}</p></div>',
        cuerpoTexto: 'Hola {{nombre_cliente}}, tu cotización #{{numero_cotizacion}} se encuentra en estado: {{estado_cotizacion}}. Vigencia: {{vigencia}}. {{observaciones}}',
        variablesDisponibles: ['nombre_cliente', 'numero_cotizacion', 'estado_cotizacion', 'vigencia', 'observaciones'],
        variablesObligatorias: ['numero_cotizacion'],
        fechaActualizacion: new Date().toISOString(),
      },
      {
        codigo: 'prueba_sistema',
        nombre: 'Mensaje de Verificación de Conectividad',
        descripcion: 'Envío de prueba para verificar entregabilidad y conexión SMTP',
        asunto: 'Prueba de servicio SMTP Pintu Clic',
        cuerpoHtml: '<div style="font-family:sans-serif;max-width:600px;margin:auto;"><h2>Prueba de Conectividad Exitosa</h2><p>Mensaje: {{mensaje_prueba}}</p><p>Fecha del sistema: {{fecha}}</p></div>',
        cuerpoTexto: 'Prueba de Conectividad Exitosa. Mensaje: {{mensaje_prueba}}. Fecha: {{fecha}}',
        variablesDisponibles: ['fecha', 'mensaje_prueba'],
        variablesObligatorias: ['mensaje_prueba'],
        fechaActualizacion: new Date().toISOString(),
      },
    ];

    for (const plantilla of catalogo) {
      this.plantillas.set(plantilla.codigo, plantilla);
    }
  }

  private obtenerPlantillaPorDefecto(codigo: string): IPlantillaNotificacion | null {
    this.cargarPlantillasIniciales();
    return this.plantillas.get(codigo) ?? null;
  }
}
