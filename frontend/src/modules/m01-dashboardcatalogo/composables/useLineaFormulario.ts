import { storeToRefs } from 'pinia';
import { useLineaFormularioStore } from '../store/linea-formulario.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DEL FORMULARIO DE LÍNEA (useLineaFormulario)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useLineaFormulario.ts
 *
 * Punto de entrada de la maqueta "ADMIN 16 - Crear / editar línea". No
 * autocarga: la vista llama `inicializar(id?)` cuando conoce la ruta.
 * ==============================================================================
 */
export function useLineaFormulario() {
  const store = useLineaFormularioStore();
  const {
    formulario,
    opciones,
    impacto,
    modo,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    checklist,
    progresoChecklist,
    puedePublicar,
  } = storeToRefs(store);

  return {
    formulario,
    opciones,
    impacto,
    modo,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    checklist,
    progresoChecklist,
    puedePublicar,
    inicializar: store.inicializar,
    actualizar: store.actualizar,
    alternarProducto: store.alternarProducto,
    agregarEtiqueta: store.agregarEtiqueta,
    quitarEtiqueta: store.quitarEtiqueta,
    guardarBorrador: store.guardarBorrador,
    guardarCambios: store.guardarCambios,
    reiniciar: store.reiniciar,
    ...useFormatoCatalogo(),
  };
}
