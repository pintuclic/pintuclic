import { storeToRefs } from 'pinia';
import { useProductoDetalleStore } from '../store/producto-detalle.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DEL DETALLE DEL PRODUCTO (useProductoDetalle)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useProductoDetalle.ts
 *
 * Punto de entrada de la vista "ADMIN 05 - Detalle administrativo del producto".
 * No autocarga: la vista llama `inicializar(id)` cuando conoce la ruta.
 * ==============================================================================
 */
export function useProductoDetalle() {
  const store = useProductoDetalleStore();
  const { detalle, pestanaActiva, cargando, guardando, error, usandoDatosDemo, desactivado } =
    storeToRefs(store);

  return {
    // estado
    detalle,
    pestanaActiva,
    cargando,
    guardando,
    error,
    usandoDatosDemo,
    desactivado,
    // acciones
    inicializar: store.inicializar,
    setPestana: store.setPestana,
    desactivar: store.desactivar,
    reiniciar: store.reiniciar,
    // presentación
    ...useFormatoCatalogo(),
  };
}
