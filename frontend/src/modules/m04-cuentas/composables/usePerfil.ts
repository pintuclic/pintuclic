import { ref } from 'vue';
import axios from 'axios';
import { CuentasService } from '../services/cuentas.service';
import { useAuthStore } from '../store/auth.store';
import type { ActualizarPerfilDTO } from '../dtos/perfil.dto';
import type { DireccionCliente, CrearDireccionPayload } from '../interfaces/direccion.interface';
import type { PerfilUsuarioResponse } from '../interfaces/registro.interface';

/**
 * ==============================================================================
 * M04 - COMPOSABLE DE GESTIÓN DE PERFIL (usePerfil)
 * Principio de Inversión de Dependencias (DIP) y Responsabilidad Única (SRP).
 * Maneja datos de perfil y la dirección única del cliente (HU-CUE-06, HU-CUE-07).
 * ==============================================================================
 */
export interface SolicitudEmpresaLocal {
  nit: string;
  nombre_empresa: string;
  nombre_representante?: string;
  telefono?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fecha_solicitud: string;
}

export interface SolicitudNitLocal {
  nit_nuevo: string;
  documento_adjunto_url?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fecha_solicitud: string;
}

export function usePerfil() {
  const cargando = ref(false);
  const guardando = ref(false);
  const enviandoSolicitudCorreo = ref(false);
  const errorMensaje = ref<string | null>(null);
  const exitoMensaje = ref<string | null>(null);
  const errorPasswordModal = ref<string | null>(null);

  const perfilDetallado = ref<PerfilUsuarioResponse | null>(null);
  const direccionRegistrada = ref<DireccionCliente | null>(null);
  const solicitudEmpresa = ref<SolicitudEmpresaLocal | null>(null);
  const solicitudNit = ref<SolicitudNitLocal | null>(null);

  const authStore = useAuthStore();

  function limpiarAlertas(): void {
    errorMensaje.value = null;
    exitoMensaje.value = null;
    errorPasswordModal.value = null;
  }

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
   * Carga los datos completos del perfil y la dirección registrada desde el backend.
   */
  async function cargarDatos(): Promise<void> {
    cargando.value = true;
    try {
      const [resPerfil, resDirecciones] = await Promise.allSettled([
        CuentasService.obtenerPerfil(),
        CuentasService.listarDirecciones(),
      ]);

      if (resPerfil.status === 'fulfilled' && resPerfil.value.data) {
        const idUsuario = resPerfil.value.data.id_usuario || authStore.user?.id_usuario;
        const docGuardado = idUsuario ? localStorage.getItem(`pintuclic_doc_id_${idUsuario}`) : null;

        perfilDetallado.value = {
          ...resPerfil.value.data,
          documento_identidad: docGuardado || resPerfil.value.data.documento_identidad || null,
        };
        authStore.updateUser({
          nombre: resPerfil.value.data.nombre,
          telefono: resPerfil.value.data.telefono,
          correo: resPerfil.value.data.correo,
          tipo: resPerfil.value.data.tipo,
        });
      }

      if (resDirecciones.status === 'fulfilled' && resDirecciones.value.data) {
        const lista = resDirecciones.value.data;
        // Política de una sola dirección de despacho: tomar la predeterminada o la primera registrada
        direccionRegistrada.value =
          lista.find((d) => d.es_predeterminada) || lista[0] || null;
      }

      // Sincronizar estado visual de solicitudes en trámite del cliente (HU-CUE-06, HU-CUE-10)
      const idUsuarioActual = perfilDetallado.value?.id_usuario || authStore.user?.id_usuario;
      const correoActual = perfilDetallado.value?.correo || authStore.user?.correo;
      const esEmpresaActual = (perfilDetallado.value?.tipo || authStore.user?.tipo)?.toLowerCase() === 'empresa';

      if (idUsuarioActual) {
        if (esEmpresaActual) {
          // Si la cuenta ya fue ascendida a empresa, la solicitud concluyó con éxito
          localStorage.removeItem(`pintuclic_solicitud_empresa_${idUsuarioActual}`);
          solicitudEmpresa.value = null;
        } else {
          // 1. Verificamos si en la base de datos ya existe solicitud asociada retornada por obtenerPerfil
          const nombreEmpresaBd = (perfilDetallado.value?.nombre_empresa as string) || '';
          const nitBd = (perfilDetallado.value?.nit as string) || '';
          const repBd = (perfilDetallado.value?.nombre_representante as string) || perfilDetallado.value?.nombre || '';

          if (nombreEmpresaBd || nitBd) {
            solicitudEmpresa.value = {
              nit: nitBd,
              nombre_empresa: nombreEmpresaBd,
              nombre_representante: repBd,
              telefono: perfilDetallado.value?.telefono || '',
              estado: 'pendiente',
              fecha_solicitud: new Date().toISOString(),
            };
            localStorage.setItem(`pintuclic_solicitud_empresa_${idUsuarioActual}`, JSON.stringify(solicitudEmpresa.value));
          } else if (correoActual) {
            // 2. Si no vino en el objeto perfil, consultar endpoint oficial de estado de solicitud
            try {
              const resEstado = await CuentasService.consultarEstadoSolicitudEmpresa(correoActual);
              if (resEstado.data?.encontrado && resEstado.data.estado === 'pendiente') {
                solicitudEmpresa.value = {
                  nit: resEstado.data.nit || '',
                  nombre_empresa: resEstado.data.nombre_empresa || 'Empresa en revisión',
                  nombre_representante: perfilDetallado.value?.nombre || '',
                  telefono: perfilDetallado.value?.telefono || '',
                  estado: 'pendiente',
                  fecha_solicitud: resEstado.data.fecha_solicitud || new Date().toISOString(),
                };
                localStorage.setItem(`pintuclic_solicitud_empresa_${idUsuarioActual}`, JSON.stringify(solicitudEmpresa.value));
              }
            } catch {
              // Silencioso si no hay solicitud o falla la red
            }
          }

          // 3. Fallback a localStorage si aún no se ha hidratado
          if (!solicitudEmpresa.value) {
            const rawSolEmpresa = localStorage.getItem(`pintuclic_solicitud_empresa_${idUsuarioActual}`);
            if (rawSolEmpresa) {
              try {
                solicitudEmpresa.value = JSON.parse(rawSolEmpresa) as SolicitudEmpresaLocal;
              } catch {
                solicitudEmpresa.value = null;
              }
            }
          }
        }

        // Solicitud de actualización de NIT (HU-CUE-10)
        const rawSolNit = localStorage.getItem(`pintuclic_solicitud_nit_${idUsuarioActual}`);
        if (rawSolNit) {
          try {
            const parsedNit = JSON.parse(rawSolNit) as SolicitudNitLocal;
            if (perfilDetallado.value?.nit === parsedNit.nit_nuevo) {
              // Si el NIT ya fue actualizado en backend, el trámite finalizó exitosamente
              localStorage.removeItem(`pintuclic_solicitud_nit_${idUsuarioActual}`);
              solicitudNit.value = null;
            } else {
              solicitudNit.value = parsedNit;
            }
          } catch {
            solicitudNit.value = null;
          }
        } else {
          solicitudNit.value = null;
        }
      }
    } catch {
      // Si la sesión aún no está hidratada, continúa con el store local
    } finally {
      cargando.value = false;
    }
  }

  /**
   * Actualiza los datos personales del usuario (HU-CUE-06) y su dirección física (HU-CUE-07).
   */
  async function actualizarPerfilYDireccion(
    datosPerfil: ActualizarPerfilDTO,
    datosDireccion?: CrearDireccionPayload
  ): Promise<boolean> {
    try {
      guardando.value = true;
      limpiarAlertas();

      // 1. Actualizar datos de perfil en backend
      const resPerfil = await CuentasService.actualizarPerfil({
        nombre: datosPerfil.nombre,
        telefono: datosPerfil.telefono,
        documento_identidad: datosPerfil.documento_identidad,
        nombre_representante: datosPerfil.nombre_representante,
      });

      // 2. Persistir documento de identidad si fue diligenciado
      const idUsuario = perfilDetallado.value?.id_usuario || authStore.user?.id_usuario;
      if (datosPerfil.documento_identidad && datosPerfil.documento_identidad.trim() !== '') {
        const docLimpio = datosPerfil.documento_identidad.trim();
        if (idUsuario) {
          localStorage.setItem(`pintuclic_doc_id_${idUsuario}`, docLimpio);
        }
      }

      // 3. Si se suministró dirección física, actualizar o crear la dirección única
      if (datosDireccion && datosDireccion.direccion && datosDireccion.direccion.trim() !== '') {
        const idExistente = direccionRegistrada.value?.id_direccion;
        const resDir = await CuentasService.guardarDireccionUnica(
          {
            ...datosDireccion,
            nombre_apellido: datosPerfil.nombre || authStore.user?.nombre || 'Destinatario',
            telefono: datosPerfil.telefono || authStore.user?.telefono || '0000000',
            barrio: datosDireccion.barrio && datosDireccion.barrio.trim() !== '' ? datosDireccion.barrio.trim() : 'Centro',
          },
          idExistente
        );
        if (resDir.data) {
          direccionRegistrada.value = resDir.data;
        }
      }

      // 4. Actualizar memoria reactiva local de perfilDetallado
      const docPersistido = idUsuario
        ? localStorage.getItem(`pintuclic_doc_id_${idUsuario}`)
        : null;

      if (perfilDetallado.value) {
        perfilDetallado.value = {
          ...perfilDetallado.value,
          nombre: datosPerfil.nombre || perfilDetallado.value.nombre,
          telefono: datosPerfil.telefono || perfilDetallado.value.telefono,
          documento_identidad: docPersistido || datosPerfil.documento_identidad || perfilDetallado.value.documento_identidad,
        };
      } else if (resPerfil.data) {
        perfilDetallado.value = {
          ...resPerfil.data,
          documento_identidad: docPersistido || datosPerfil.documento_identidad || null,
        };
      }

      // 5. Sincronizar memoria reactiva de Pinia
      authStore.updateUser({
        nombre: datosPerfil.nombre || perfilDetallado.value?.nombre,
        telefono: datosPerfil.telefono || perfilDetallado.value?.telefono,
      });

      exitoMensaje.value = 'Información y dirección actualizadas exitosamente.';
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
      limpiarAlertas();

      const res = await CuentasService.confirmarCambioCorreo(nuevoCorreo, codigo);
      const correoConfirmado = res.data?.nuevoCorreo || nuevoCorreo;

      authStore.updateUser({
        correo: correoConfirmado,
      });

      exitoMensaje.value =
        'Correo electrónico actualizado exitosamente. Se ha notificado a ambas direcciones.';
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

  function descartarSolicitudEmpresa(): void {
    const idUsuario = perfilDetallado.value?.id_usuario || authStore.user?.id_usuario;
    if (idUsuario) {
      localStorage.removeItem(`pintuclic_solicitud_empresa_${idUsuario}`);
    }
    solicitudEmpresa.value = null;
  }

  function descartarSolicitudNit(): void {
    const idUsuario = perfilDetallado.value?.id_usuario || authStore.user?.id_usuario;
    if (idUsuario) {
      localStorage.removeItem(`pintuclic_solicitud_nit_${idUsuario}`);
    }
    solicitudNit.value = null;
  }

  return {
    cargando,
    guardando,
    enviandoSolicitudCorreo,
    errorMensaje,
    exitoMensaje,
    errorPasswordModal,
    perfilDetallado,
    direccionRegistrada,
    solicitudEmpresa,
    solicitudNit,
    descartarSolicitudEmpresa,
    descartarSolicitudNit,
    limpiarAlertas,
    cargarDatos,
    actualizarPerfilYDireccion,
    solicitarCambioCorreo,
    confirmarCambioCorreo,
  };
}
