import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { LineasService } from '../services/lineas.service';
import {
  consultarLineasDemo,
  RESUMEN_LINEAS_DEMO,
  OPCIONES_FILTRO_LINEAS_DEMO,
} from '../services/lineas.mock';
import {
  FILTROS_LINEAS_INICIALES,
  hayFiltrosLineasActivos as calcularFiltrosActivos,
} from '../dtos/lineas.dto';
import type { FiltrosLineasDTO } from '../dtos/lineas.dto';
import type {
  PaginaLineas,
  ResumenLineas,
  OpcionesFiltroLineas,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - STORE DEL LISTADO DE LÍNEAS COMERCIALES (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/lineas.store.ts
 *
 * Mantiene los filtros vigentes, la página cargada, los KPIs y los catálogos de
 * la barra de filtros. El filtrado/paginado real ocurre en el backend; ante
 * fallo o ausencia del endpoint cae a la semilla local (services/lineas.mock.ts).
 * ==============================================================================
 */
const RESUMEN_VACIO: ResumenLineas = {
  lineasActivas: { valor: 0, total: 0 },
  marcasAsociadas: { valor: 0 },
  productosVinculados: { valor: 0 },
  reglasDependientes: { valor: 0 },
};

export const useLineasStore = defineStore('m01-lineas', () => {
  // --- Estado --------------------------------------------------------------
  const filtros = ref<FiltrosLineasDTO>({ ...FILTROS_LINEAS_INICIALES });
  const pagina = ref<PaginaLineas | null>(null);
  const resumen = ref<ResumenLineas>({ ...RESUMEN_VACIO });
  const opciones = ref<OpcionesFiltroLineas>({ marcas: [], segmentos: [] });
  const cargando = ref<boolean>(false);
  const error = ref<string | null>(null);
  const usandoDatosDemo = ref<boolean>(false);

  // --- Getters -------------------------------------------------------------
  const items = computed(() => pagina.value?.items ?? []);
  const total = computed(() => pagina.value?.total ?? 0);
  const totalPaginas = computed(() => pagina.value?.totalPaginas ?? 1);
  const hayFiltrosActivos = computed(() => calcularFiltrosActivos(filtros.value));
  const cargado = computed(() => pagina.value !== null);

  // --- Acciones ------------------------------------------------------------
  async function cargarOpciones(): Promise<void> {
    if (opciones.value.marcas.length > 0) return;
    try {
      const respuesta = await LineasService.opcionesFiltro();
      opciones.value = respuesta.data;
    } catch {
      opciones.value = OPCIONES_FILTRO_LINEAS_DEMO;
    }
  }

  /** Pide al backend la página actual según `filtros` (+ KPIs la primera vez). */
  async function cargar(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      const [lista, res] = await Promise.all([
        LineasService.listar(filtros.value),
        pagina.value ? Promise.resolve(null) : LineasService.resumen(),
      ]);
      pagina.value = lista.data;
      if (res) resumen.value = res.data;
      usandoDatosDemo.value = false;
    } catch {
      // Respaldo transparente a la semilla local, sin mostrar aviso.
      pagina.value = consultarLineasDemo(filtros.value);
      resumen.value = RESUMEN_LINEAS_DEMO;
      usandoDatosDemo.value = true;
    } finally {
      cargando.value = false;
    }
  }

  /** Carga inicial: catálogos de filtro + primera página. */
  async function inicializar(): Promise<void> {
    await Promise.all([cargarOpciones(), cargar()]);
  }

  async function aplicarFiltros(parcial: Partial<FiltrosLineasDTO>): Promise<void> {
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
    filtros.value = { ...FILTROS_LINEAS_INICIALES };
    await cargar();
  }

  function reiniciar(): void {
    filtros.value = { ...FILTROS_LINEAS_INICIALES };
    pagina.value = null;
    resumen.value = { ...RESUMEN_VACIO };
    error.value = null;
    usandoDatosDemo.value = false;
  }

  return {
    filtros,
    pagina,
    resumen,
    opciones,
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
    irAPagina,
    limpiarFiltros,
    reiniciar,
  };
});
