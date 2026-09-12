import { storeToRefs } from 'pinia';
import { useMarcaFormularioStore } from '../store/marca-formulario.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DEL FORMULARIO DE MARCA (useMarcaFormulario)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useMarcaFormulario.ts
 *
 * Punto de entrada de la maqueta "ADMIN 13 - Crear / editar marca". No
 * autocarga: la vista llama `inicializar(id?)` cuando conoce la ruta.
 * ==============================================================================
 */
export function useMarcaFormulario() {
  const store = useMarcaFormularioStore();
  const {
    formulario,
    opciones,
    resumenPrevia,
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
    // estado
    formulario,
    opciones,
    resumenPrevia,
    modo,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    // getters
    checklist,
    progresoChecklist,
    puedePublicar,
    // acciones
    inicializar: store.inicializar,
    actualizar: store.actualizar,
    alternarLista: store.alternarLista,
    agregarEtiqueta: store.agregarEtiqueta,
    quitarEtiqueta: store.quitarEtiqueta,
    quitarLogo: store.quitarLogo,
    guardarBorrador: store.guardarBorrador,
    guardarCambios: store.guardarCambios,
    reiniciar: store.reiniciar,
    // presentación
    ...useFormatoCatalogo(),
  };
}
