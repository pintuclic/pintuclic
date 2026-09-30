import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useColoresStore } from '../store/colores.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DEL LISTADO DE COLORES (useColores)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useColores.ts
 * ==============================================================================
 */
export function useColores(opciones: { autoCargar?: boolean } = {}) {
  const { autoCargar = true } = opciones;

  const store = useColoresStore();
  const {
    filtros,
    pagina,
    familias,
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
    familias,
    opcionesFiltro,
    resumen,
    cargando,
    error,
    usandoDatosDemo,
    items,
    total,
    totalPaginas,
    hayFiltrosActivos,
    aplicarFiltros: store.aplicarFiltros,
    filtrarPorFamilia: store.filtrarPorFamilia,
    irAPagina: store.irAPagina,
    limpiarFiltros: store.limpiarFiltros,
    ...useFormatoCatalogo(),
  };
}
