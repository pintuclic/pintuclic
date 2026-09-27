import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useVariantesStore } from '../store/variantes.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DEL LISTADO DE VARIANTES (useVariantes)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useVariantes.ts
 * ==============================================================================
 */
export function useVariantes(opciones: { autoCargar?: boolean } = {}) {
  const { autoCargar = true } = opciones;

  const store = useVariantesStore();
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
    cargado,
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
    cargado,
    inicializar: store.inicializar,
    recargar: store.cargar,
    aplicarFiltros: store.aplicarFiltros,
    ordenarPor: store.ordenarPor,
    irAPagina: store.irAPagina,
    cambiarPorPagina: store.cambiarPorPagina,
    limpiarFiltros: store.limpiarFiltros,
    ...useFormatoCatalogo(),
  };
}
