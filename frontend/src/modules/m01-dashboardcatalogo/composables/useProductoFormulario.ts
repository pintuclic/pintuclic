import { storeToRefs } from 'pinia';
import { useProductoFormularioStore } from '../store/producto-formulario.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DEL FORMULARIO DE PRODUCTO (useProductoFormulario)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useProductoFormulario.ts
 *
 * Punto de entrada de la vista "ADMIN 03 - Productos · Crear / editar". No
 * autocarga: la vista llama `inicializar(id?)` cuando conoce la ruta.
 * ==============================================================================
 */
export function useProductoFormulario() {
  const store = useProductoFormularioStore();
  const {
    formulario,
    opciones,
    modo,
    detalleEdicion,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    desactivado,
    subcategoriasDisponibles,
    lineasDisponibles,
    coloresDeLaMarca,
    colorPrincipal,
    coloresDisponibles,
    requiereLinea,
    usaColor,
    checklist,
    progresoChecklist,
    puedePublicar,
  } = storeToRefs(store);

  return {
    // estado
    formulario,
    opciones,
    modo,
    detalleEdicion,
    cargando,
    guardando,
    error,
    erroresValidacion,
    usandoDatosDemo,
    guardadoOk,
    desactivado,
    // getters
    subcategoriasDisponibles,
    lineasDisponibles,
    coloresDeLaMarca,
    colorPrincipal,
    coloresDisponibles,
    requiereLinea,
    usaColor,
    checklist,
    progresoChecklist,
    puedePublicar,
    // acciones
    inicializar: store.inicializar,
    actualizar: store.actualizar,
    definirColorPrincipal: store.definirColorPrincipal,
    alternarColorDisponible: store.alternarColorDisponible,
    agregarEtiqueta: store.agregarEtiqueta,
    quitarEtiqueta: store.quitarEtiqueta,
    agregarImagen: store.agregarImagen,
    quitarImagen: store.quitarImagen,
    marcarImagenPrincipal: store.marcarImagenPrincipal,
    guardarBorrador: store.guardarBorrador,
    publicar: store.publicar,
    desactivar: store.desactivar,
    reiniciar: store.reiniciar,
    // presentación
    ...useFormatoCatalogo(),
  };
}
