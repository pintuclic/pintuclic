import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useDashboardCatalogoStore } from '../store/dashboard.store';
import { useFormatoCatalogo } from './useFormatoCatalogo';
import type { FiltroDashboardDTO } from '../dtos/dashboard.dto';

/**
 * ==============================================================================
 * M01 - COMPOSABLE REACTIVO DEL PANEL DE CATÁLOGO (useDashboardCatalogo)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useDashboardCatalogo.ts
 *
 * Punto de entrada único para la vista del dashboard: expone el estado del
 * store (resumen, cargando, error, usandoDatosDemo) ya desreferenciado, la
 * acción de recarga y los formateadores de presentación.
 * ==============================================================================
 */
interface OpcionesUseDashboard {
  /** Dispara `cargar` en onMounted. Por defecto true. */
  autoCargar?: boolean;
  /** Filtro temporal inicial (por defecto el backend asume "30d"). */
  filtro?: Partial<FiltroDashboardDTO>;
}

export function useDashboardCatalogo(opciones: OpcionesUseDashboard = {}) {
  const { autoCargar = true, filtro } = opciones;

  const store = useDashboardCatalogoStore();
  const {
    resumen,
    cargando,
    error,
    usandoDatosDemo,
    ultimaActualizacion,
    cargado,
    metricas,
    accesosRapidos,
    actividadReciente,
    estadoCatalogo,
  } = storeToRefs(store);

  /** Fuerza una relectura del tablero (botón "actualizar"). */
  function refrescar(nuevoFiltro?: Partial<FiltroDashboardDTO>) {
    return store.cargar(nuevoFiltro ?? filtro, { forzar: true });
  }

  if (autoCargar) {
    onMounted(() => {
      void store.cargar(filtro);
    });
  }

  return {
    // estado reactivo
    resumen,
    cargando,
    error,
    usandoDatosDemo,
    ultimaActualizacion,
    cargado,
    metricas,
    accesosRapidos,
    actividadReciente,
    estadoCatalogo,
    // acciones
    cargar: store.cargar,
    refrescar,
    reiniciar: store.reiniciar,
    // presentación
    ...useFormatoCatalogo(),
  };
}
