import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ColoresService } from '../services/colores.service';
import {
  consultarColoresDemo,
  FAMILIAS_CROMATICAS_DEMO,
  OPCIONES_FILTRO_COLORES_DEMO,
  RESUMEN_COLORES_DEMO,
} from '../services/colores.mock';
import {
  FILTROS_COLORES_INICIALES,
  hayFiltrosColoresActivos as calcularFiltrosActivos,
} from '../dtos/colores.dto';
import type { FiltrosColoresDTO } from '../dtos/colores.dto';
import type {
  PaginaColores,
  OpcionesFiltroColores,
  FamiliaCromatica,
  ResumenColores,
} from '../interfaces';

const RESUMEN_VACIO: ResumenColores = {
  totalColores: { valor: 0, variacionPorcentaje: 0 },
  coloresActivos: { valor: 0, variacionPorcentaje: 0 },
  familiasCromaticas: { valor: 0 },
};

/**
 * ==============================================================================
 * M01 - STORE DEL LISTADO DE COLORES (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/colores.store.ts
 * ==============================================================================
 */
export const useColoresStore = defineStore('m01-colores', () => {
  const filtros = ref<FiltrosColoresDTO>({ ...FILTROS_COLORES_INICIALES });
  const pagina = ref<PaginaColores | null>(null);
  const familias = ref<FamiliaCromatica[]>([]);
  const opciones = ref<OpcionesFiltroColores>({ marcas: [], familias: [] });
  const resumen = ref<ResumenColores>({ ...RESUMEN_VACIO });
  const cargando = ref<boolean>(false);
  const error = ref<string | null>(null);
  const usandoDatosDemo = ref<boolean>(false);

  const items = computed(() => pagina.value?.items ?? []);
  const total = computed(() => pagina.value?.total ?? 0);
  const totalPaginas = computed(() => pagina.value?.totalPaginas ?? 1);
  const hayFiltrosActivos = computed(() => calcularFiltrosActivos(filtros.value));

  async function cargarAuxiliares(): Promise<void> {
    try {
      const [fam, opc, res] = await Promise.all([
        ColoresService.familias(),
        ColoresService.opcionesFiltro(),
        ColoresService.resumen(),
      ]);
      familias.value = fam.data;
      opciones.value = opc.data;
      resumen.value = res.data;
    } catch {
      familias.value = FAMILIAS_CROMATICAS_DEMO;
      opciones.value = OPCIONES_FILTRO_COLORES_DEMO;
      resumen.value = RESUMEN_COLORES_DEMO;
    }
  }

  async function cargar(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      const respuesta = await ColoresService.listar(filtros.value);
      pagina.value = respuesta.data;
      usandoDatosDemo.value = false;
    } catch {
      pagina.value = consultarColoresDemo(filtros.value);
      usandoDatosDemo.value = true;
    } finally {
      cargando.value = false;
    }
  }

  async function inicializar(): Promise<void> {
    if (familias.value.length === 0) await cargarAuxiliares();
    await cargar();
  }

  async function aplicarFiltros(parcial: Partial<FiltrosColoresDTO>): Promise<void> {
    filtros.value = { ...filtros.value, ...parcial, pagina: 1 };
    await cargar();
  }

  /** Clic en una familia de la tira superior: alterna el filtro por familia. */
  async function filtrarPorFamilia(clave: string): Promise<void> {
    const siguiente = filtros.value.familiaClave === clave ? null : clave;
    await aplicarFiltros({ familiaClave: siguiente });
  }

  async function irAPagina(numero: number): Promise<void> {
    const destino = Math.min(Math.max(1, numero), totalPaginas.value);
    if (destino === filtros.value.pagina) return;
    filtros.value = { ...filtros.value, pagina: destino };
    await cargar();
  }

  async function limpiarFiltros(): Promise<void> {
    filtros.value = { ...FILTROS_COLORES_INICIALES };
    await cargar();
  }

  function reiniciar(): void {
    filtros.value = { ...FILTROS_COLORES_INICIALES };
    pagina.value = null;
    error.value = null;
    usandoDatosDemo.value = false;
  }

  return {
    filtros,
    pagina,
    familias,
    opciones,
    resumen,
    cargando,
    error,
    usandoDatosDemo,
    items,
    total,
    totalPaginas,
    hayFiltrosActivos,
    inicializar,
    cargar,
    aplicarFiltros,
    filtrarPorFamilia,
    irAPagina,
    limpiarFiltros,
    reiniciar,
  };
});
