import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useBusquedasStore } from '../store/busquedas.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DEL REPORTE DE BÚSQUEDAS SIN RESULTADO (useBusquedas)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useBusquedas.ts
 * ==============================================================================
 */
export function useBusquedas(opciones: { autoCargar?: boolean } = {}) {
  const { autoCargar = true } = opciones;

  const store = useBusquedasStore();
  const {
    filtros,
    pagina,
    opciones: opcionesFiltro,
    resumen,
    cargando,
    error,
    usandoDatosDemo,
    items,
    total,
    totalPaginas,
    hayFiltrosActivos,
  } = storeToRefs(store);

  if (autoCargar) {
    onMounted(() => {
      void store.inicializar();
    });
  }

  return {
    filtros,
    pagina,
    opcionesFiltro,
    resumen,
    cargando,
    error,
    usandoDatosDemo,
    items,
    total,
    totalPaginas,
    hayFiltrosActivos,
    setFiltro: store.setFiltro,
    aplicarFiltros: store.aplicarFiltros,
    irAPagina: store.irAPagina,
    limpiarFiltros: store.limpiarFiltros,
    ...useFormatoCatalogo(),
  };
}
