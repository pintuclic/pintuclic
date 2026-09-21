import { storeToRefs } from 'pinia';
import { useColorFormularioStore } from '../store/color-formulario.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DEL FORMULARIO DE COLOR (useColorFormulario)
 * Maqueta "ADMIN 18 - Crear / editar color". No autocarga: la vista llama
 * `inicializar(id?)` cuando conoce la ruta.
 * ==============================================================================
 */
export function useColorFormulario() {
  const store = useColorFormularioStore();
  const {
    formulario,
    opciones,
    previa,
    modo,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    rgb,
    cielab,
    familiaNombre,
    marcaNombre,
    impacto,
  } = storeToRefs(store);

  return {
    formulario,
    opciones,
    previa,
    modo,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    rgb,
    cielab,
    familiaNombre,
    marcaNombre,
    impacto,
    inicializar: store.inicializar,
    actualizar: store.actualizar,
    actualizarRgb: store.actualizarRgb,
    guardarBorrador: store.guardarBorrador,
    guardarCambios: store.guardarCambios,
    reiniciar: store.reiniciar,
    ...useFormatoCatalogo(),
  };
}
