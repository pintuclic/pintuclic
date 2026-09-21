import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { MarcaFormularioService } from '../services/marca-formulario.service';
import { FORMULARIO_MARCA_DEMO, formularioMarcaVacio } from '../services/marca-formulario.mock';
import { validarMarcaFormulario } from '../dtos/marca-formulario.dto';
import type {
  FormularioMarca,
  ModoFormularioMarca,
  SeccionChecklistMarca,
  ProgresoChecklist,
  EstadoMarca,
  ApiErrorResponse,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - STORE DEL FORMULARIO DE MARCA (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/marca-formulario.store.ts
 *
 * Estado de la maqueta "ADMIN 13 - Crear / editar marca": modelo editable
 * (nombre + logotipo), checklist de publicación derivado y guardado. Ante
 * fallo o ausencia de endpoint usa la semilla local.
 * ==============================================================================
 */
export const useMarcaFormularioStore = defineStore('m01-marca-formulario', () => {
  const formulario = ref<FormularioMarca>(formularioMarcaVacio());
  const modo = ref<ModoFormularioMarca>('crear');
  const marcaId = ref<string | null>(null);

  const cargando = ref<boolean>(false);
  const guardando = ref<boolean>(false);
  const error = ref<string | null>(null);
  const erroresValidacion = ref<Record<string, string>>({});
  const usandoDatosDemo = ref<boolean>(false);
  const guardadoOk = ref<boolean>(false);

  const checklist = computed<SeccionChecklistMarca[]>(() => {
    const f = formulario.value;
    return [
      { clave: 'nombre', etiqueta: 'Nombre de la marca', completa: f.nombre.trim().length > 0, opcional: false },
      { clave: 'logo', etiqueta: 'Logotipo', completa: Boolean(f.logoUrl), opcional: false },
    ];
  });

  const progresoChecklist = computed<ProgresoChecklist>(() => ({
    completas: checklist.value.filter((s) => s.completa).length,
    total: checklist.value.length,
  }));

  const puedePublicar = computed(() => checklist.value.every((s) => s.completa));

  // --- Acciones -----------------------------------------------------------
  async function inicializar(id?: string): Promise<void> {
    cargando.value = true;
    error.value = null;
    erroresValidacion.value = {};
    guardadoOk.value = false;
    usandoDatosDemo.value = false;

    if (id) {
      modo.value = 'editar';
      marcaId.value = id;
      try {
        const respuesta = await MarcaFormularioService.obtenerMarca(id);
        formulario.value = respuesta.data;
      } catch {
        formulario.value = { ...FORMULARIO_MARCA_DEMO };
        usandoDatosDemo.value = true;
      }
    } else {
      modo.value = 'crear';
      marcaId.value = null;
      formulario.value = formularioMarcaVacio();
    }

    cargando.value = false;
  }

  function actualizar(parcial: Partial<FormularioMarca>): void {
    formulario.value = { ...formulario.value, ...parcial };
    for (const campo of Object.keys(parcial)) delete erroresValidacion.value[campo];
  }

  function quitarLogo(): void {
    actualizar({ logoUrl: null });
  }

  function validar(): boolean {
    const { valido, errores } = validarMarcaFormulario(formulario.value);
    erroresValidacion.value = errores;
    return valido;
  }

  async function guardar(estado: EstadoMarca): Promise<boolean> {
    formulario.value = { ...formulario.value, estado };
    if (!validar()) {
      error.value = 'Revisa los campos marcados antes de continuar.';
      return false;
    }

    guardando.value = true;
    error.value = null;
    try {
      const respuesta =
        modo.value === 'editar' && marcaId.value
          ? await MarcaFormularioService.actualizar(marcaId.value, formulario.value)
          : await MarcaFormularioService.crear(formulario.value);
      marcaId.value = respuesta.data.id;
      modo.value = 'editar';
      guardadoOk.value = true;
      return true;
    } catch (e) {
      if (usandoDatosDemo.value) {
        guardadoOk.value = true;
        return true;
      }
      error.value = extraerMensajeError(e);
      return false;
    } finally {
      guardando.value = false;
    }
  }

  const guardarBorrador = () => guardar('inactiva');
  const guardarCambios = () => guardar(formulario.value.estado === 'inactiva' ? 'inactiva' : 'activa');

  function reiniciar(): void {
    formulario.value = formularioMarcaVacio();
    modo.value = 'crear';
    marcaId.value = null;
    error.value = null;
    erroresValidacion.value = {};
    guardadoOk.value = false;
    usandoDatosDemo.value = false;
  }

  return {
    formulario,
    modo,
    marcaId,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    checklist,
    progresoChecklist,
    puedePublicar,
    inicializar,
    actualizar,
    quitarLogo,
    validar,
    guardarBorrador,
    guardarCambios,
    reiniciar,
  };
});

function extraerMensajeError(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const apiError = error.response.data as ApiErrorResponse;
    if (apiError.error?.message) return apiError.error.message;
  }
  return 'No fue posible guardar la marca.';
}
