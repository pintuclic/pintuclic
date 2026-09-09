import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { VariantesService } from '../services/variantes.service';
import {
  consultarVariantesDemo,
  OPCIONES_FILTRO_VARIANTES_DEMO,
  RESUMEN_VARIANTES_DEMO,
} from '../services/variantes.mock';
import {
  FILTROS_VARIANTES_INICIALES,
  hayFiltrosVariantesActivos as calcularFiltrosActivos,
} from '../dtos/variantes.dto';
import type { FiltrosVariantesDTO } from '../dtos/variantes.dto';
import type {
  PaginaVariantes,
  OpcionesFiltroVariantes,
  ResumenVariantes,
  CampoOrdenVariantes,
  ApiErrorResponse,
} from '../interfaces';

const RESUMEN_VACIO: ResumenVariantes = {
  activas: { valor: 0, variacionPorcentaje: 0 },
  sinStock: { valor: 0, variacionPorcentaje: 0 },
  borradores: { valor: 0, variacionPorcentaje: 0 },
};

/**
 * ==============================================================================
 * M01 - STORE DEL LISTADO DE VARIANTES (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/variantes.store.ts
 * ==============================================================================
 */
export const useVariantesStore = defineStore('m01-variantes', () => {
  const filtros = ref<FiltrosVariantesDTO>({
    ...FILTROS_VARIANTES_INICIALES,
    orden: { ...FILTROS_VARIANTES_INICIALES.orden },
  });
  const pagina = ref<PaginaVariantes | null>(null);
  const opciones = ref<OpcionesFiltroVariantes>({ productos: [], presentaciones: [], marcas: [] });
  const resumen = ref<ResumenVariantes>({ ...RESUMEN_VACIO });
  const cargando = ref<boolean>(false);
  const error = ref<string | null>(null);
  const usandoDatosDemo = ref<boolean>(false);

  const items = computed(() => pagina.value?.items ?? []);
  const total = computed(() => pagina.value?.total ?? 0);
  const totalPaginas = computed(() => pagina.value?.totalPaginas ?? 1);
  const hayFiltrosActivos = computed(() => calcularFiltrosActivos(filtros.value));
  const cargado = computed(() => pagina.value !== null);

  async function cargarAuxiliares(): Promise<void> {
    try {
      const [opc, res] = await Promise.all([
        VariantesService.opcionesFiltro(),
        VariantesService.resumen(),
      ]);
      opciones.value = opc.data;
      resumen.value = res.data;
    } catch {
      opciones.value = OPCIONES_FILTRO_VARIANTES_DEMO;
      resumen.value = RESUMEN_VARIANTES_DEMO;
    }
  }

  async function cargar(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      const respuesta = await VariantesService.listar(filtros.value);
      pagina.value = respuesta.data;
      usandoDatosDemo.value = false;
    } catch (e) {
      error.value = extraerMensajeError(e);
      pagina.value = consultarVariantesDemo(filtros.value);
      usandoDatosDemo.value = true;
    } finally {
      cargando.value = false;
    }
  }

  async function inicializar(): Promise<void> {
    if (opciones.value.productos.length === 0) await cargarAuxiliares();
    await cargar();
  }

  async function aplicarFiltros(parcial: Partial<FiltrosVariantesDTO>): Promise<void> {
    filtros.value = { ...filtros.value, ...parcial, pagina: 1 };
    await cargar();
  }

  /** Alterna el orden por columna: 1er clic asc, 2º desc, sigue la misma columna. */
  async function ordenarPor(campo: CampoOrdenVariantes): Promise<void> {
    const actual = filtros.value.orden;
    const direccion =
      actual.campo === campo && actual.direccion === 'asc' ? 'desc' : 'asc';
    filtros.value = { ...filtros.value, orden: { campo, direccion }, pagina: 1 };
    await cargar();
  }

  async function irAPagina(numero: number): Promise<void> {
    const destino = Math.min(Math.max(1, numero), totalPaginas.value);
    if (destino === filtros.value.pagina) return;
    filtros.value = { ...filtros.value, pagina: destino };
    await cargar();
  }

  async function cambiarPorPagina(porPagina: number): Promise<void> {
    filtros.value = { ...filtros.value, porPagina, pagina: 1 };
    await cargar();
  }

  async function limpiarFiltros(): Promise<void> {
    filtros.value = {
      ...FILTROS_VARIANTES_INICIALES,
      orden: { ...filtros.value.orden },
    };
    await cargar();
  }

  function reiniciar(): void {
    filtros.value = {
      ...FILTROS_VARIANTES_INICIALES,
      orden: { ...FILTROS_VARIANTES_INICIALES.orden },
    };
    pagina.value = null;
    error.value = null;
    usandoDatosDemo.value = false;
  }

  return {
    filtros,
    pagina,
    opciones,
    resumen,
    cargando,
    error,
    usandoDatosDemo,
    items,
    total,
    totalPaginas,
    hayFiltrosActivos,
    cargado,
    inicializar,
    cargar,
    aplicarFiltros,
    ordenarPor,
    irAPagina,
    cambiarPorPagina,
    limpiarFiltros,
    reiniciar,
  };
});

function extraerMensajeError(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const apiError = error.response.data as ApiErrorResponse;
    if (apiError.error?.message) return apiError.error.message;
  }
  return 'No fue posible cargar el listado de variantes.';
}
