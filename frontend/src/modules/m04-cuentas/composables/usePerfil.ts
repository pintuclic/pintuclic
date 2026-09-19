import { ref } from 'vue';
import axios from 'axios';
import { CuentasService } from '../services/cuentas.service';
import { useAuthStore } from '../store/auth.store';
import type { ActualizarPerfilDTO } from '../dtos/perfil.dto';

/**
 * ==============================================================================
 * M04 - COMPOSABLE DE GESTIÓN DE PERFIL (usePerfil)
 * Principio de Inversión de Dependencias (DIP) y Responsabilidad Única (SRP).
 * Aísla a los componentes visuales de la gestión manual de Axios y protege datos sensibles (HU-SEG-06).
 * ==============================================================================
 */
export function usePerfil() {
  const guardando = ref(false);
  const enviandoSolicitudCorreo = ref(false);
  const errorMensaje = ref<string | null>(null);
  const exitoMensaje = ref<string | null>(null);
  const errorPasswordModal = ref<string | null>(null);

  const authStore = useAuthStore();

  function limpiarAlertas(): void {
    errorMensaje.value = null;
    exitoMensaje.value = null;
    errorPasswordModal.value = null;
  }

  /**
   * Extrae el mensaje de error de la respuesta sin exponer trazas confidenciales (HU-SEG-06).
   */
  function extraerMensajeError(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error) && error.response?.data) {
      const data = error.response.data as {
        mensaje?: string;
        error?: { message?: string };
      };
      return data.mensaje || data.error?.message || fallback;
    }
    return fallback;
  }

  /**
   * Actualiza los datos personales del usuario (HU-CUE-06).
   */
  async function actualizarPerfil(payload: ActualizarPerfilDTO): Promise<boolean> {
    try {
      guardando.value = true;
      errorMensaje.value = null;

      await CuentasService.actualizarPerfil(payload);

      // Sincronizar memoria reactiva de Pinia
      authStore.updateUser({
        nombre: payload.nombre,
        telefono: payload.telefono,
        correo: payload.correo,
      });

      exitoMensaje.value = 'Información actualizada exitosamente.';
      return true;
    } catch (error: unknown) {
      errorMensaje.value = extraerMensajeError(
        error,
        'No se pudo guardar la información. Verifique los datos ingresados.'
      );
      return false;
    } finally {
      guardando.value = false;
    }
  }

  /**
   * Solicita el código OTP para cambio seguro de correo tras validar contraseña actual (RF-CUE-06-03).
   */
  async function solicitarCambioCorreo(
    nuevoCorreo: string,
    contrasenaActual: string
  ): Promise<boolean> {
    try {
      enviandoSolicitudCorreo.value = true;
      errorPasswordModal.value = null;

      await CuentasService.solicitarCambioCorreo(nuevoCorreo, contrasenaActual);
      return true;
    } catch (error: unknown) {
      errorPasswordModal.value = extraerMensajeError(
        error,
        'No se pudo autorizar la solicitud. Verifique su contraseña actual.'
      );
      return false;
    } finally {
      enviandoSolicitudCorreo.value = false;
    }
  }

  /**
   * Confirma el cambio de correo electrónico validando el código OTP (HU-CUE-06).
   */
  async function confirmarCambioCorreo(
    nuevoCorreo: string,
    codigo: string
  ): Promise<boolean> {
    try {
      guardando.value = true;
      errorMensaje.value = null;

      const res = await CuentasService.confirmarCambioCorreo(nuevoCorreo, codigo);
      const correoConfirmado = res.data?.nuevoCorreo || nuevoCorreo;

      authStore.updateUser({
        correo: correoConfirmado,
      });

      exitoMensaje.value =
        'Correo electrónico y perfil actualizados exitosamente. Se ha enviado una notificación de seguridad.';
      return true;
    } catch (error: unknown) {
      errorMensaje.value = extraerMensajeError(
        error,
        'Código de verificación incorrecto o expirado.'
      );
      return false;
    } finally {
      guardando.value = false;
    }
  }

  return {
    guardando,
    enviandoSolicitudCorreo,
    errorMensaje,
    exitoMensaje,
    errorPasswordModal,
    limpiarAlertas,
    actualizarPerfil,
    solicitarCambioCorreo,
    confirmarCambioCorreo,
  };
}
