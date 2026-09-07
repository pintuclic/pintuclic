import nodemailer, { Transporter } from 'nodemailer';
import {
  ISmtpConfig,
  ISmtpTransport,
  IOpcionesEnvioEmail,
  IResultadoTransporteSmtp,
} from '../interfaces/smtp.interfaces';

// ==============================================================================
// M18 - SERVICIO DE TRANSPORTE SMTP (HU-NOT-01, HU-NOT-04)
// Despacho de correos, autenticación segura y política de reintentos (RF-NOT-01-03)
// ==============================================================================

export class SmtpService implements ISmtpTransport {
  private readonly config: ISmtpConfig;
  private transporter: Transporter | null = null;

  constructor(configuracionPersonalizada?: Partial<ISmtpConfig>) {
    const esSimulacion =
      process.env.SMTP_SIMULACION === 'true' ||
      !process.env.SMTP_HOST ||
      process.env.NODE_ENV === 'test';

    const authConfig =
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined;

    this.config = {
      host: process.env.SMTP_HOST ?? 'smtp.example.com',
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: authConfig,
      remitentePorDefecto: process.env.SMTP_FROM ?? 'Pintu Clic <notificaciones@pintuclic.com>',
      direccionRespuesta: process.env.SMTP_REPLY_TO ?? 'soporte@pintuclic.com',
      maxReintentos: Number(process.env.SMTP_MAX_REINTENTOS ?? 3),
      delayReintentoMs: Number(process.env.SMTP_DELAY_REINTENTO_MS ?? 1000),
      modoSimulacion: esSimulacion,
      ...configuracionPersonalizada,
    };

    this.inicializarTransporte();
  }

  private inicializarTransporte(): void {
    if (this.config.modoSimulacion) {
      this.transporter = null;
      return;
    }

    const opciones: Record<string, unknown> = {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
    };

    if (this.config.auth) {
      opciones['auth'] = this.config.auth;
    }

    this.transporter = nodemailer.createTransport(
      opciones as Parameters<typeof nodemailer.createTransport>[0]
    );
  }

  /**
   * Envía un correo individual utilizando el transporte configurado.
   */
  async enviarCorreo(opciones: IOpcionesEnvioEmail): Promise<IResultadoTransporteSmtp> {
    const remitente = opciones.remitentePersonalizado ?? this.config.remitentePorDefecto;
    const replyTo = opciones.replyTo ?? this.config.direccionRespuesta;

    // Modo simulación (desarrollo local o entorno de pruebas sin servidor SMTP activo)
    if (this.config.modoSimulacion || !this.transporter) {
      // Si la dirección termina en @error-simulado.com, provocamos un fallo intencional para tests
      if (opciones.para.includes('error-simulado.com')) {
        return {
          exitoso: false,
          error: 'Fallo de entrega simulado: servidor de destino inalcanzable (bounce)',
          codigoError: 'SIMULATED_BOUNCE',
          reboteDetectado: true,
        };
      }

      return {
        exitoso: true,
        messageId: `simulado-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      };
    }

    try {
      const emailPayload: Record<string, unknown> = {
        from: remitente,
        to: opciones.para,
        subject: opciones.asunto,
        html: opciones.html,
        text: opciones.texto ?? opciones.html.replace(/<[^>]+>/g, ' ').trim(),
      };

      if (replyTo) {
        emailPayload['replyTo'] = replyTo;
      }

      const info = (await this.transporter.sendMail(
        emailPayload as Parameters<Transporter['sendMail']>[0]
      )) as { messageId?: string };

      return {
        exitoso: true,
        messageId: info.messageId,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const codigoError = typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code: unknown }).code)
        : 'SMTP_UNKNOWN_ERROR';

      // Detección de rebotes o direcciones no encontradas (RF-NOT-04-04)
      const esRebote =
        codigoError === 'EENVELOPE' ||
        errorMsg.toLowerCase().includes('mailbox unavailable') ||
        errorMsg.toLowerCase().includes('user unknown');

      return {
        exitoso: false,
        error: errorMsg,
        codigoError,
        reboteDetectado: esRebote,
      };
    }
  }

  /**
   * Ejecuta el envío con política de reintentos configurables (RF-NOT-01-03, CA-NOT-01-02).
   * Si falla, reintenta hasta el límite configurado antes de darlo por fallido.
   */
  async enviarConReintentos(
    opciones: IOpcionesEnvioEmail,
    onIntentoFallido?: (intentoActual: number, error: string) => Promise<void> | void
  ): Promise<{
    exitoso: boolean;
    intentosRealizados: number;
    errorFinal?: string | undefined;
    messageId?: string | undefined;
  }> {
    let intento = 0;
    let ultimoError = '';

    while (intento < this.config.maxReintentos) {
      intento++;
      const resultado = await this.enviarCorreo(opciones);

      if (resultado.exitoso) {
        return {
          exitoso: true,
          intentosRealizados: intento,
          messageId: resultado.messageId,
        };
      }

      ultimoError = resultado.error ?? 'Error desconocido en servidor SMTP';

      if (onIntentoFallido) {
        await onIntentoFallido(intento, ultimoError);
      }

      // Si aún quedan intentos y no es un rebote definitivo por dirección inexistente
      if (intento < this.config.maxReintentos && !resultado.reboteDetectado) {
        // Pausa antes del siguiente reintento (retroceso)
        await new Promise((resolve) => setTimeout(resolve, this.config.delayReintentoMs * intento));
      } else {
        break;
      }
    }

    return {
      exitoso: false,
      intentosRealizados: intento,
      errorFinal: ultimoError,
    };
  }

  /**
   * Valida la conectividad con el servidor SMTP (RF-NOT-04-01).
   */
  async verificarConexion(): Promise<{ conectado: boolean; detalle: string }> {
    if (this.config.modoSimulacion || !this.transporter) {
      return {
        conectado: true,
        detalle: 'Transporte SMTP operando en modo simulación (entorno local de desarrollo)',
      };
    }

    try {
      await this.transporter.verify();
      return {
        conectado: true,
        detalle: `Conexión SMTP exitosa con ${this.config.host}:${this.config.port}`,
      };
    } catch (err: unknown) {
      const detalle = err instanceof Error ? err.message : String(err);
      return {
        conectado: false,
        detalle: `Fallo de conexión SMTP: ${detalle}`,
      };
    }
  }

  obtenerConfig(): ISmtpConfig {
    return { ...this.config };
  }
}
