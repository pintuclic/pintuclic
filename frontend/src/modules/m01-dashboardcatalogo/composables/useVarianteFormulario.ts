import { storeToRefs } from 'pinia';
import { useVarianteFormularioStore } from '../store/variante-formulario.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DEL FORMULARIO DE VARIANTE (useVarianteFormulario)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useVarianteFormulario.ts
 *
 * Punto de entrada de las vistas "ADMIN 07 - Crear variante" y
 * "ADMIN 08 - Editar variante". No autocarga: la vista llama `inicializar(id?)`
 * cuando conoce la ruta.
 * ==============================================================================
 */
export function useVarianteFormulario() {
  const store = useVarianteFormularioStore();
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
    productoAsociado,
    colorAsociado,
    margenEstimado,
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
    productoAsociado,
    colorAsociado,
    margenEstimado,
    checklist,
    progresoChecklist,
    puedePublicar,
    // acciones
    inicializar: store.inicializar,
    actualizar: store.actualizar,
    definirColor: store.definirColor,
    agregarImagen: store.agregarImagen,
    quitarImagen: store.quitarImagen,
    marcarImagenPrincipal: store.marcarImagenPrincipal,
    guardarBorrador: store.guardarBorrador,
    publicar: store.publicar,
    guardarCambios: store.guardarCambios,
    desactivar: store.desactivar,
    reiniciar: store.reiniciar,
    // presentación
    ...useFormatoCatalogo(),
  };
}
