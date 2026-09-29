// ==============================================================================
// M18 - NOTIFICACIONES Y COMUNICACIONES
// Contratos de transporte y configuración SMTP (0 bytes runtime)
// ==============================================================================

/**
 * Configuración para conexión con el servidor SMTP (RF-NOT-04-01, RF-NOT-04-02).
 */
export interface ISmtpConfig {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly auth?: {
    readonly user: string;
    readonly pass: string;
  } | undefined;
  readonly remitentePorDefecto: string;
  readonly direccionRespuesta?: string | undefined;
  readonly maxReintentos: number;
  readonly delayReintentoMs: number;
  readonly modoSimulacion: boolean;
}

/**
 * Opciones para despachar un correo individual.
 */
export interface IOpcionesEnvioEmail {
  readonly para: string;
  readonly asunto: string;
  readonly html: string;
  readonly texto?: string | undefined;
  readonly replyTo?: string | undefined;
  readonly remitentePersonalizado?: string | undefined;
}

/**
 * Resultado devuelto por el adaptador de transporte SMTP.
 */
export interface IResultadoTransporteSmtp {
  readonly exitoso: boolean;
  readonly messageId?: string | undefined;
  readonly error?: string | undefined;
  readonly codigoError?: string | undefined;
  readonly reboteDetectado?: boolean | undefined;
}

/**
 * Contrato del transporte SMTP (Principio D / Inversión de dependencias).
 */
export interface ISmtpTransport {
  enviarCorreo(opciones: IOpcionesEnvioEmail): Promise<IResultadoTransporteSmtp>;
  verificarConexion(): Promise<{ conectado: boolean; detalle: string }>;
}
