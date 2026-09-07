import { ref } from 'vue';
import axios from 'axios';
import { CuentasService } from '../services/cuentas.service';
import { useAuthStore } from '../store/auth.store';
import type {
  RegistroNaturalPayload,
  RegistroEmpresaPayload,
  VerificarCodigoPayload,
  LoginPayload,
  ResultadoLogin,
  ResultadoRegistroParticular,
  ResultadoRegistroEmpresa,
  ResultadoVerificacion,
  ResultadoReenvio,
  ApiErrorResponse,
} from '../interfaces/registro.interface';

/**
 * ==============================================================================
 * M04 - COMPOSABLE REACTIVO DE CUENTAS (useCuentas)
 * Orquestador reactivo de estado de peticiones (loading, error, DTOs y feedback).
 * Aísla completamente los componentes visuales de la gestión manual de errores Axios.
 * ==============================================================================
 */
export function useCuentas() {
  const cargando = ref<boolean>(false);
  const errorMensaje = ref<string | null>(null);
  const codigoError = ref<string | null>(null);
  const erroresValidacion = ref<Record<string, string>>({});

  const authStore = useAuthStore();

  /**
   * Restablece los estados de error reactivos.
   */
  function limpiarErrores(): void {
    errorMensaje.value = null;
    codigoError.value = null;
    erroresValidacion.value = {};
  }

  /**
   * Parser universal de errores que interpreta el contrato de error del backend.
   */
  function procesarErrorApi(error: unknown, fallback: string): void {
    limpiarErrores();

    if (axios.isAxiosError(error) && error.response?.data) {
      const apiError = error.response.data as ApiErrorResponse;
      if (apiError.error) {
        codigoError.value = apiError.error.code || 'UNKNOWN_ERROR';
        errorMensaje.value = apiError.error.message || fallback;

        if (Array.isArray(apiError.error.details)) {
          for (const item of apiError.error.details) {
            if (item.field) {
              erroresValidacion.value[item.field] = item.issue || item.message || '';
            }
          }
        }
        return;
      }
    }

    errorMensaje.value = fallback;
  }

  /**
   * Inicia sesión con credenciales (HU-CUE-04).
   */
  async function iniciarSesion(payload: LoginPayload): Promise<ResultadoLogin | null> {
    try {
      cargando.value = true;
      limpiarErrores();

      const response = await CuentasService.login(payload);
      const resultado = response.data;

      // Persistir token y datos de usuario en Pinia
      authStore.setAuthData(resultado.sesion.accessToken, resultado.usuario, resultado.sesion.idSesion);

      return resultado;
    } catch (error) {
      procesarErrorApi(error, 'Credenciales incorrectas o error al iniciar sesión.');
      return null;
    } finally {
      cargando.value = false;
    }
  }

  /**
   * Registra un cliente particular (HU-CUE-01).
   */
  async function registrarParticular(
    payload: RegistroNaturalPayload
  ): Promise<ResultadoRegistroParticular | null> {
    try {
      cargando.value = true;
      limpiarErrores();

      const response = await CuentasService.registrarParticular(payload);
      return response.data;
    } catch (error) {
      procesarErrorApi(error, 'Error al procesar el registro particular.');
      return null;
    } finally {
      cargando.value = false;
    }
  }

  /**
   * Registra un cliente corporativo / empresa (HU-CUE-03).
   */
  async function registrarEmpresa(
    payload: RegistroEmpresaPayload
  ): Promise<ResultadoRegistroEmpresa | null> {
    try {
      cargando.value = true;
      limpiarErrores();

      const response = await CuentasService.registrarEmpresa(payload);
      return response.data;
    } catch (error) {
      procesarErrorApi(error, 'Error al registrar la solicitud empresarial.');
      return null;
    } finally {
      cargando.value = false;
    }
  }

  /**
   * Valida el código de verificación OTP (HU-CUE-01 / CA-CUE-01-02).
   */
  async function verificarCodigoActivacion(
    payload: VerificarCodigoPayload
  ): Promise<ResultadoVerificacion | null> {
    try {
      cargando.value = true;
      limpiarErrores();

      const response = await CuentasService.verificarCodigo(payload);
      return response.data;
    } catch (error) {
      procesarErrorApi(error, 'Código incorrecto o expirado.');
      return null;
    } finally {
      cargando.value = false;
    }
  }

  /**
   * Reenvía el código de verificación OTP (HU-CUE-01 / RF-CUE-01-04).
   */
  async function reenviarCodigoActivacion(correo: string): Promise<ResultadoReenvio | null> {
    try {
      cargando.value = true;
      limpiarErrores();

      const response = await CuentasService.reenviarCodigo({ correo });
      return response.data;
    } catch (error) {
      procesarErrorApi(error, 'Error al reenviar el código de activación.');
      return null;
    } finally {
      cargando.value = false;
    }
  }

  /**
   * Cierra la sesión activa.
   */
  async function cerrarSesion(): Promise<boolean> {
    try {
      cargando.value = true;
      await CuentasService.logout();
      authStore.logout();
      return true;
    } catch {
      authStore.logout();
      return false;
    } finally {
      cargando.value = false;
    }
  }

  return {
    cargando,
    errorMensaje,
    codigoError,
    erroresValidacion,
    limpiarErrores,
    iniciarSesion,
    registrarParticular,
    registrarEmpresa,
    verificarCodigoActivacion,
    reenviarCodigoActivacion,
    cerrarSesion,
  };
}
