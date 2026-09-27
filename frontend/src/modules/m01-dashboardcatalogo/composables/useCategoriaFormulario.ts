import { storeToRefs } from 'pinia';
import { useCategoriaFormularioStore } from '../store/categoria-formulario.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DEL FORMULARIO DE CATEGORÍA (useCategoriaFormulario)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useCategoriaFormulario.ts
 *
 * Punto de entrada de las maquetas "ADMIN 10 - Crear / editar categoría" y
 * "ADMIN 11 - Crear nueva subcategoría". No autocarga: la vista llama
 * `inicializar({ id, tipo })` cuando conoce la ruta.
 * ==============================================================================
 */
export function useCategoriaFormulario() {
  const store = useCategoriaFormularioStore();
  const {
    formulario,
    opciones,
    resumenImpacto,
    modo,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    esSubcategoria,
    rutaJerarquia,
  } = storeToRefs(store);

  return {
    // estado
    formulario,
    opciones,
    resumenImpacto,
    modo,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    // getters
    esSubcategoria,
    rutaJerarquia,
    // acciones
    inicializar: store.inicializar,
    actualizar: store.actualizar,
    alternarLista: store.alternarLista,
    agregarEtiqueta: store.agregarEtiqueta,
    quitarEtiqueta: store.quitarEtiqueta,
    guardarBorrador: store.guardarBorrador,
    guardarCambios: store.guardarCambios,
    reiniciar: store.reiniciar,
    // presentación
    ...useFormatoCatalogo(),
  };
}
