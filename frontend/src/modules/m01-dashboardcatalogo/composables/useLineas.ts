import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useLineasStore } from '../store/lineas.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DEL LISTADO DE LÍNEAS COMERCIALES (useLineas)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useLineas.ts
 *
 * Punto de entrada de la vista "ADMIN 15 - Líneas comerciales": expone el estado
 * del store ya desreferenciado, las acciones de filtro/paginación y los
 * formateadores de presentación.
 * ==============================================================================
 */
export function useLineas(opciones: { autoCargar?: boolean } = {}) {
  const { autoCargar = true } = opciones;

  const store = useLineasStore();
  const {
    filtros,
    pagina,
    resumen,
    opciones: opcionesFiltro,
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
    resumen,
    opcionesFiltro,
    cargando,
    error,
    usandoDatosDemo,
    items,
    total,
    totalPaginas,
    hayFiltrosActivos,
    cargado,
    aplicarFiltros: store.aplicarFiltros,
    irAPagina: store.irAPagina,
    limpiarFiltros: store.limpiarFiltros,
    ...useFormatoCatalogo(),
  };
}
