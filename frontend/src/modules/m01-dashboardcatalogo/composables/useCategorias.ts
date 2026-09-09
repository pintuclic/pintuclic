import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useCategoriasStore } from '../store/categorias.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DE CATEGORÍAS (useCategorias)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useCategorias.ts
 * ==============================================================================
 */
export function useCategorias(opciones: { autoCargar?: boolean } = {}) {
  const { autoCargar = true } = opciones;

  const store = useCategoriasStore();
  const {
    arbol,
    seleccionadaId,
    detalle,
    busquedaArbol,
    expandidas,
    filtrosElementos,
    cargando,
    cargandoDetalle,
    error,
    usandoDatosDemo,
    arbolFiltrado,
    elementosFiltrados,
    totalElementos,
  } = storeToRefs(store);

  if (autoCargar) {
    onMounted(() => {
      void store.inicializar();
    });
  }

  return {
    arbol,
    seleccionadaId,
    detalle,
    busquedaArbol,
    expandidas,
    filtrosElementos,
    cargando,
    cargandoDetalle,
    error,
    usandoDatosDemo,
    arbolFiltrado,
    elementosFiltrados,
    totalElementos,
    inicializar: store.inicializar,
    seleccionar: store.seleccionar,
    alternarExpandida: store.alternarExpandida,
    buscarEnArbol: store.buscarEnArbol,
    aplicarFiltroElementos: store.aplicarFiltroElementos,
    ordenarElementosPor: store.ordenarElementosPor,
    limpiarFiltroElementos: store.limpiarFiltroElementos,
    ...useFormatoCatalogo(),
  };
}
