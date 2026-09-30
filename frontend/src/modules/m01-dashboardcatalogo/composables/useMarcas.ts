import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useMarcasStore } from '../store/marcas.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DE GESTIÓN DE MARCAS (useMarcas)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useMarcas.ts
 * ==============================================================================
 */
export function useMarcas(opciones: { autoCargar?: boolean } = {}) {
  const { autoCargar = true } = opciones;

  const store = useMarcasStore();
  const {
    filtros,
    pagina,
    resumen,
    cargando,
    guardando,
    error,
    usandoDatosDemo,
    marcaEnEdicion,
    erroresEdicion,
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
    resumen,
    cargando,
    guardando,
    error,
    usandoDatosDemo,
    marcaEnEdicion,
    erroresEdicion,
    items,
    total,
    totalPaginas,
    hayFiltrosActivos,
    aplicarFiltros: store.aplicarFiltros,
    irAPagina: store.irAPagina,
    limpiarFiltros: store.limpiarFiltros,
    abrirEdicion: store.abrirEdicion,
    nuevaMarca: store.nuevaMarca,
    cerrarEdicion: store.cerrarEdicion,
    actualizarEdicion: store.actualizarEdicion,
    guardarEdicion: store.guardarEdicion,
    ...useFormatoCatalogo(),
  };
}
