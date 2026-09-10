import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { BusquedasService } from '../services/busquedas.service';
import {
  consultarBusquedasDemo,
  OPCIONES_FILTRO_BUSQUEDAS_DEMO,
  RESUMEN_BUSQUEDAS_DEMO,
} from '../services/busquedas.mock';
import {
  FILTROS_BUSQUEDAS_INICIALES,
  hayFiltrosBusquedasActivos as calcularFiltrosActivos,
} from '../dtos/busquedas.dto';
import type { FiltrosBusquedasDTO } from '../dtos/busquedas.dto';
import type {
  PaginaBusquedas,
  OpcionesFiltroBusquedas,
  ResumenBusquedas,
} from '../interfaces';

const RESUMEN_VACIO: ResumenBusquedas = {
  totalTerminos: { valor: 0, variacionPorcentaje: 0 },
  masRepetido: { termino: '—', frecuencia: 0 },
  ultimaBusqueda: { termino: '—', fechaHora: new Date().toISOString() },
  oportunidadesDetectadas: { valor: 0, variacionPorcentaje: 0 },
};

/**
 * ==============================================================================
 * M01 - STORE DEL REPORTE DE BÚSQUEDAS SIN RESULTADO (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/busquedas.store.ts
 * ==============================================================================
 */
export const useBusquedasStore = defineStore('m01-busquedas', () => {
  const filtros = ref<FiltrosBusquedasDTO>({ ...FILTROS_BUSQUEDAS_INICIALES });
  /** Filtros aplicados (los del `filtros` reactivo se confirman con "Filtrar"). */
  const pagina = ref<PaginaBusquedas | null>(null);
  const opciones = ref<OpcionesFiltroBusquedas>({ categorias: [] });
  const resumen = ref<ResumenBusquedas>({ ...RESUMEN_VACIO });
  const cargando = ref<boolean>(false);
  const error = ref<string | null>(null);
  const usandoDatosDemo = ref<boolean>(false);

  const items = computed(() => pagina.value?.items ?? []);
  const total = computed(() => pagina.value?.total ?? 0);
  const totalPaginas = computed(() => pagina.value?.totalPaginas ?? 1);
  const hayFiltrosActivos = computed(() => calcularFiltrosActivos(filtros.value));

  async function cargarAuxiliares(): Promise<void> {
    try {
      const [opc, res] = await Promise.all([
        BusquedasService.opcionesFiltro(),
        BusquedasService.resumen(),
      ]);
      opciones.value = opc.data;
      resumen.value = res.data;
    } catch {
      opciones.value = OPCIONES_FILTRO_BUSQUEDAS_DEMO;
      resumen.value = RESUMEN_BUSQUEDAS_DEMO;
    }
  }

  async function cargar(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      const respuesta = await BusquedasService.listar(filtros.value);
      pagina.value = respuesta.data;
      usandoDatosDemo.value = false;
    } catch {
      pagina.value = consultarBusquedasDemo(filtros.value);
      usandoDatosDemo.value = true;
    } finally {
      cargando.value = false;
    }
  }

  async function inicializar(): Promise<void> {
    if (opciones.value.categorias.length === 0) await cargarAuxiliares();
    await cargar();
  }

  /** Actualiza los filtros en memoria (sin recargar; la vista usa "Filtrar"). */
  function setFiltro(parcial: Partial<FiltrosBusquedasDTO>): void {
    filtros.value = { ...filtros.value, ...parcial };
  }

  async function aplicarFiltros(): Promise<void> {
    filtros.value = { ...filtros.value, pagina: 1 };
    await cargar();
  }

  async function irAPagina(numero: number): Promise<void> {
    const destino = Math.min(Math.max(1, numero), totalPaginas.value);
    if (destino === filtros.value.pagina) return;
    filtros.value = { ...filtros.value, pagina: destino };
    await cargar();
  }

  async function limpiarFiltros(): Promise<void> {
    filtros.value = { ...FILTROS_BUSQUEDAS_INICIALES };
    await cargar();
  }

  function reiniciar(): void {
    filtros.value = { ...FILTROS_BUSQUEDAS_INICIALES };
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
    inicializar,
    cargar,
    setFiltro,
    aplicarFiltros,
    irAPagina,
    limpiarFiltros,
    reiniciar,
  };
});
