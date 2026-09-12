import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useProductosStore } from '../store/productos.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DEL LISTADO DE PRODUCTOS (useProductos)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useProductos.ts
 *
 * Punto de entrada de la vista "ADMIN 02 - Productos": expone el estado del
 * store ya desreferenciado, las acciones de filtro/orden/paginación y los
 * formateadores de presentación.
 * ==============================================================================
 */
export function useProductos(opciones: { autoCargar?: boolean } = {}) {
  const { autoCargar = true } = opciones;

  const store = useProductosStore();
  const {
    filtros,
    pagina,
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
    // estado
    filtros,
    pagina,
    opcionesFiltro,
    cargando,
    error,
    usandoDatosDemo,
    items,
    total,
    totalPaginas,
    hayFiltrosActivos,
    cargado,
    // acciones
    inicializar: store.inicializar,
    recargar: store.cargar,
    aplicarFiltros: store.aplicarFiltros,
    ordenarPor: store.ordenarPor,
    irAPagina: store.irAPagina,
    limpiarFiltros: store.limpiarFiltros,
    // presentación
    ...useFormatoCatalogo(),
  };
}
