import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { DashboardCatalogoService } from '../services/dashboard.service';
import { RESUMEN_DASHBOARD_DEMO } from '../services/dashboard.mock';
import type { FiltroDashboardDTO } from '../dtos/dashboard.dto';
import type { ResumenDashboardCatalogo } from '../interfaces';

/**
 * ==============================================================================
 * M01 - STORE DEL PANEL DE CATÁLOGO (Pinia, sintaxis setup)
 * Ubicación: src/modules/m01-dashboardcatalogo/store/dashboard.store.ts
 *
 * Caché de sesión del tablero. Centraliza el resumen para que la vista y sus
 * componentes lo consuman sin repetir peticiones al navegar entre pantallas
 * del panel. La orquestación reactiva por componente vive en
 * ../composables/useDashboardCatalogo.ts.
 * ==============================================================================
 */
export const useDashboardCatalogoStore = defineStore('m01-dashboard-catalogo', () => {
  // --- Estado --------------------------------------------------------------
  const resumen = ref<ResumenDashboardCatalogo | null>(null);
  const cargando = ref<boolean>(false);
  const error = ref<string | null>(null);
  /** true cuando se sirvió la semilla local por fallo/ausencia del endpoint. */
  const usandoDatosDemo = ref<boolean>(false);
  const ultimaActualizacion = ref<string | null>(null);

  // --- Getters -----------------------------------------------------------------
  const cargado = computed(() => resumen.value !== null);
  const metricas = computed(() => resumen.value?.metricas ?? []);
  const accesosRapidos = computed(() => resumen.value?.accesosRapidos ?? []);
  const actividadReciente = computed(() => resumen.value?.actividadReciente ?? []);
  const estadoCatalogo = computed(() => resumen.value?.estadoCatalogo ?? null);

  // --- Acciones --------------------------------------------------------------
  /**
   * Carga el resumen del tablero. Idempotente: si ya hay datos y no se fuerza,
   * no vuelve a pedir. Ante error de red / 404, cae a la semilla local.
   */
  async function cargar(
    filtro?: Partial<FiltroDashboardDTO>,
    opciones: { forzar?: boolean } = {}
  ): Promise<void> {
    if (cargando.value) return;
    if (cargado.value && !opciones.forzar) return;

    cargando.value = true;
    error.value = null;

    try {
      const respuesta = await DashboardCatalogoService.obtenerResumen(filtro);
      resumen.value = respuesta.data;
      usandoDatosDemo.value = false;
    } catch {
      // Respaldo transparente: mientras M01 backend no publique el endpoint,
      // se sirve la semilla local sin mostrar aviso.
      resumen.value = RESUMEN_DASHBOARD_DEMO;
      usandoDatosDemo.value = true;
    } finally {
      ultimaActualizacion.value = new Date().toISOString();
      cargando.value = false;
    }
  }

  /** Limpia la caché (p. ej. al cerrar sesión o cambiar de permiso). */
  function reiniciar(): void {
    resumen.value = null;
    error.value = null;
    usandoDatosDemo.value = false;
    ultimaActualizacion.value = null;
  }

  return {
    // estado
    resumen,
    cargando,
    error,
    usandoDatosDemo,
    ultimaActualizacion,
    // getters
    cargado,
    metricas,
    accesosRapidos,
    actividadReciente,
    estadoCatalogo,
    // acciones
    cargar,
    reiniciar,
  };
});
