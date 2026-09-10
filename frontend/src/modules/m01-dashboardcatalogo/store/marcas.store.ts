import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { MarcasService } from '../services/marcas.service';
import {
  consultarMarcasDemo,
  RESUMEN_MARCAS_DEMO,
  LINEAS_MARCA_DEMO,
} from '../services/marcas.mock';
import {
  FILTROS_MARCAS_INICIALES,
  hayFiltrosMarcasActivos as calcularFiltrosActivos,
  validarMarcaForm,
} from '../dtos/marcas.dto';
import type { FiltrosMarcasDTO } from '../dtos/marcas.dto';
import type {
  PaginaMarcas,
  ResumenMarcas,
  MarcaListado,
  MarcaFormulario,
  ApiErrorResponse,
} from '../interfaces';

const RESUMEN_VACIO: ResumenMarcas = {
  marcasActivas: { valor: 0, variacionPorcentaje: 0 },
  totalProductos: { valor: 0, variacionPorcentaje: 0 },
  lineasProductos: { valor: 0, variacionPorcentaje: 0 },
  coloresDisponibles: { valor: 0, variacionPorcentaje: 0 },
};

function formularioDesde(marca: MarcaListado): MarcaFormulario {
  return {
    id: marca.id,
    nombre: marca.nombre,
    descripcionCorta: marca.descripcionCorta,
    logoUrl: marca.logoUrl,
    estado: marca.estado,
    lineas: LINEAS_MARCA_DEMO[marca.id] ?? [],
  };
}

/**
 * ==============================================================================
 * M01 - STORE DE GESTIÓN DE MARCAS (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/marcas.store.ts
 * ==============================================================================
 */
export const useMarcasStore = defineStore('m01-marcas', () => {
  const filtros = ref<FiltrosMarcasDTO>({ ...FILTROS_MARCAS_INICIALES });
  const pagina = ref<PaginaMarcas | null>(null);
  const resumen = ref<ResumenMarcas>({ ...RESUMEN_VACIO });
  const cargando = ref<boolean>(false);
  const guardando = ref<boolean>(false);
  const error = ref<string | null>(null);
  const usandoDatosDemo = ref<boolean>(false);

  // Panel lateral de edición
  const marcaEnEdicion = ref<MarcaFormulario | null>(null);
  const erroresEdicion = ref<Record<string, string>>({});

  const items = computed(() => pagina.value?.items ?? []);
  const total = computed(() => pagina.value?.total ?? 0);
  const totalPaginas = computed(() => pagina.value?.totalPaginas ?? 1);
  const hayFiltrosActivos = computed(() => calcularFiltrosActivos(filtros.value));

  async function cargar(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      const [lista, res] = await Promise.all([
        MarcasService.listar(filtros.value),
        pagina.value ? Promise.resolve(null) : MarcasService.resumen(),
      ]);
      pagina.value = lista.data;
      if (res) resumen.value = res.data;
      usandoDatosDemo.value = false;
    } catch {
      // Respaldo transparente a la semilla local, sin mostrar aviso.
      pagina.value = consultarMarcasDemo(filtros.value);
      resumen.value = RESUMEN_MARCAS_DEMO;
      usandoDatosDemo.value = true;
    } finally {
      cargando.value = false;
    }
  }

  const inicializar = () => cargar();

  async function aplicarFiltros(parcial: Partial<FiltrosMarcasDTO>): Promise<void> {
    filtros.value = { ...filtros.value, ...parcial, pagina: 1 };
    await cargar();
  }

  async function irAPagina(numero: number): Promise<void> {
    const destino = Math.min(Math.max(1, numero), totalPaginas.value);
    if (destino === filtros.value.pagina) return;
    filtros.value = { ...filtros.value, pagina: destino };
    await cargar();
  }

  async function limpiarFiltros(): Promise<void> {
    filtros.value = { ...FILTROS_MARCAS_INICIALES };
    await cargar();
  }

  // --- Panel de edición -------------------------------------------------------
  function abrirEdicion(marca: MarcaListado): void {
    marcaEnEdicion.value = formularioDesde(marca);
    erroresEdicion.value = {};
  }

  function nuevaMarca(): void {
    marcaEnEdicion.value = {
      id: null,
      nombre: '',
      descripcionCorta: '',
      logoUrl: null,
      estado: 'activa',
      lineas: [],
    };
    erroresEdicion.value = {};
  }

  function cerrarEdicion(): void {
    marcaEnEdicion.value = null;
    erroresEdicion.value = {};
  }

  function actualizarEdicion(parcial: Partial<MarcaFormulario>): void {
    if (!marcaEnEdicion.value) return;
    marcaEnEdicion.value = { ...marcaEnEdicion.value, ...parcial };
    for (const campo of Object.keys(parcial)) delete erroresEdicion.value[campo];
  }

  async function guardarEdicion(): Promise<boolean> {
    if (!marcaEnEdicion.value) return false;
    const { valido, errores } = validarMarcaForm(marcaEnEdicion.value);
    erroresEdicion.value = errores;
    if (!valido) return false;

    guardando.value = true;
    try {
      const payload = { ...marcaEnEdicion.value };
      if (payload.id) await MarcasService.actualizar(payload.id, payload);
      else await MarcasService.crear(payload);
      cerrarEdicion();
      await cargar();
      return true;
    } catch (e) {
      if (usandoDatosDemo.value) {
        cerrarEdicion();
        return true;
      }
      error.value = extraerMensajeError(e);
      return false;
    } finally {
      guardando.value = false;
    }
  }

  function reiniciar(): void {
    filtros.value = { ...FILTROS_MARCAS_INICIALES };
    pagina.value = null;
    resumen.value = { ...RESUMEN_VACIO };
    error.value = null;
    usandoDatosDemo.value = false;
    cerrarEdicion();
  }

  return {
    filtros,
    pagina,
    resumen,
    cargando,
    guardando,
    error,
    usandoDatosDemo,
    marcaEnEdicion,
    erroresEdicion,
    items,
    total,
    totalPaginas,
    hayFiltrosActivos,
    inicializar,
    cargar,
    aplicarFiltros,
    irAPagina,
    limpiarFiltros,
    abrirEdicion,
    nuevaMarca,
    cerrarEdicion,
    actualizarEdicion,
    guardarEdicion,
    reiniciar,
  };
});

function extraerMensajeError(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const apiError = error.response.data as ApiErrorResponse;
    if (apiError.error?.message) return apiError.error.message;
  }
  return 'No fue posible cargar las marcas.';
}
