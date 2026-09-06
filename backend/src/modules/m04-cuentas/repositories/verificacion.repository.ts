import { randomUUID } from 'crypto';
import { RegistroCodigoOTP, TipoCodigoOTP } from '../interfaces/cuentas.interfaces';

// ==============================================================================
// M04 - REPOSITORIO DE CÓDIGOS DE VERIFICACIÓN OTP
// Almacén seguro con TTL de 15 minutos y límite de intentos (HU-CUE-01, HU-CUE-05)
// ==============================================================================

const VIGENCIA_CODIGO_MINUTOS = 15;
const MAX_INTENTOS_POR_DEFECTO = 3;

export class VerificacionRepository {
  private readonly codigos: Map<string, RegistroCodigoOTP> = new Map();

  private generarClave(correo: string, tipo: TipoCodigoOTP): string {
    return `${correo.trim().toLowerCase()}:${tipo}`;
  }

  /**
   * Guarda o reemplaza un código OTP con vigencia y datos opcionales.
   */
  async guardarCodigo(
    correo: string,
    codigo: string,
    tipo: TipoCodigoOTP,
    datosTemporales?: Record<string, unknown> | null,
    vigenciaMinutos: number = VIGENCIA_CODIGO_MINUTOS
  ): Promise<RegistroCodigoOTP> {
    const clave = this.generarClave(correo, tipo);
    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + vigenciaMinutos * 60 * 1000);

    const registro: RegistroCodigoOTP = {
      id: randomUUID(),
      correo: correo.trim().toLowerCase(),
      codigo: codigo.trim(),
      tipo,
      expiracion,
      intentos: 0,
      max_intentos: MAX_INTENTOS_POR_DEFECTO,
      datos_temporales: datosTemporales ?? null,
    };

    this.codigos.set(clave, registro);
    return registro;
  }

  /**
   * Obtiene el código OTP activo si no ha expirado.
   */
  async obtenerCodigo(correo: string, tipo: TipoCodigoOTP): Promise<RegistroCodigoOTP | null> {
    const clave = this.generarClave(correo, tipo);
    const registro = this.codigos.get(clave);

    if (!registro) {
      return null;
    }

    // Verificar si expiró
    if (registro.expiracion.getTime() < Date.now()) {
      this.codigos.delete(clave);
      return null;
    }

    return registro;
  }

  /**
   * Incrementa el contador de intentos fallidos.
   */
  async incrementarIntentos(correo: string, tipo: TipoCodigoOTP): Promise<number> {
    const clave = this.generarClave(correo, tipo);
    const registro = this.codigos.get(clave);

    if (!registro) {
      return 0;
    }

    registro.intentos += 1;
    if (registro.intentos >= registro.max_intentos) {
      this.codigos.delete(clave);
      return registro.intentos;
    }

    return registro.intentos;
  }

  /**
   * Invalida y elimina el código tras su uso exitoso (un solo uso, RF-CUE-05-02).
   */
  async consumirCodigo(correo: string, tipo: TipoCodigoOTP): Promise<boolean> {
    const clave = this.generarClave(correo, tipo);
    return this.codigos.delete(clave);
  }

  /**
   * Barrido de registros caducados.
   */
  limpiarExpirados(): void {
    const ahora = Date.now();
    for (const [clave, reg] of this.codigos.entries()) {
      if (reg.expiracion.getTime() < ahora) {
        this.codigos.delete(clave);
      }
    }
  }
}
