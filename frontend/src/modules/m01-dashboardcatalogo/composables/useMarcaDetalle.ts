import { storeToRefs } from 'pinia';
import { useMarcaDetalleStore } from '../store/marca-detalle.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DEL DETALLE DE MARCA (useMarcaDetalle)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useMarcaDetalle.ts
 *
 * Punto de entrada de la maqueta "ADMIN 14 - Detalle de marca". No autocarga:
 * la vista llama `inicializar(id)` cuando conoce la ruta.
 * ==============================================================================
 */
export function useMarcaDetalle() {
  const store = useMarcaDetalleStore();
  const { detalle, pestanaActiva, cargando, guardando, error, usandoDatosDemo, desactivado } =
    storeToRefs(store);

  return {
    detalle,
    pestanaActiva,
    cargando,
    guardando,
    error,
    usandoDatosDemo,
    desactivado,
    inicializar: store.inicializar,
    setPestana: store.setPestana,
    desactivar: store.desactivar,
    reiniciar: store.reiniciar,
    ...useFormatoCatalogo(),
  };
}
