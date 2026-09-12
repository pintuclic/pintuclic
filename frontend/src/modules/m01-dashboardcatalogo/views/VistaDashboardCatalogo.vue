<template>
  <div class="flex min-h-screen bg-neutral-lightest">
    <BarraLateralAdmin item-activo="dashboard" @navegar="irA" />

    <div class="flex min-w-0 flex-1 flex-col">
      <BarraSuperiorAdmin
        v-model:termino-busqueda="terminoBusqueda"
        seccion="Dashboard"
        :nombre-usuario="nombreUsuario"
        rol-usuario="Administrador"
        :notificaciones="3"
      />

      <main class="flex-1 space-y-8 p-6 lg:p-8">
        <header class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-neutral-black sm:text-3xl">
              ¡Hola, {{ primerNombre }}! <span aria-hidden="true">👋</span>
            </h1>
            <p class="mt-1 text-sm text-neutral-medium">
              Aquí tienes un resumen de tu catálogo. Todo en orden para seguir pintando grandes proyectos.
            </p>
          </div>
          <div class="text-sm text-neutral-medium sm:text-right">
            <p class="font-medium capitalize text-neutral-dark">{{ fechaLegible }}</p>
            <p>Pintu Clic Admin</p>
          </div>
        </header>

        <p
          v-if="error"
          class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
        >
          {{ error }}
        </p>

        <PanelMetricas :metricas="metricas" :cargando="cargando && !cargado" />

        <PanelAccesosRapidos
          :accesos="accesosRapidos"
          @navegar="irA"
          @ver-mas="irA('/admin/catalogo/acciones')"
        />

        <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div class="xl:col-span-2">
            <TablaActividadReciente
              :registros="actividadReciente"
              :cargando="cargando && !cargado"
              @ver-todo="irA('/admin/catalogo/actividad')"
            />
          </div>
          <GraficoEstadoCatalogo :estado="estadoCatalogo" :cargando="cargando && !cargado" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: DASHBOARD DE CATÁLOGO  (maqueta "ADMIN 01 - Dashboard de catálogo")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaDashboardCatalogo.vue
 *
 * Tablero de entrada del panel de catálogo. Consolida las métricas del
 * portafolio (productos, variantes, categorías, marcas, colores), los accesos
 * rápidos de administración, la actividad reciente y la distribución de
 * productos por estado del ciclo de vida (HU-CAT-09).
 *
 * Permiso requerido: «Gestión del catálogo» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { computed, ref } from 'vue';
import BarraLateralAdmin from '../components/BarraLateralAdmin.vue';
import BarraSuperiorAdmin from '../components/BarraSuperiorAdmin.vue';
import PanelMetricas from '../components/PanelMetricas.vue';
import PanelAccesosRapidos from '../components/PanelAccesosRapidos.vue';
import TablaActividadReciente from '../components/TablaActividadReciente.vue';
import GraficoEstadoCatalogo from '../components/GraficoEstadoCatalogo.vue';
import { useDashboardCatalogo } from '../composables/useDashboardCatalogo';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { formatearFecha } from '../composables/useFormatoCatalogo';

const {
  cargando,
  cargado,
  error,
  metricas,
  accesosRapidos,
  actividadReciente,
  estadoCatalogo,
} = useDashboardCatalogo();

const terminoBusqueda = ref('');

// Navegación del panel: la provee `VistaPanelCatalogo.vue` (shell) mientras no
// exista `vue-router` montado.
const { irA } = usePanelNavegacion();

// TODO(M04): tomar el nombre real desde el store de sesión cuando el panel
// admin comparta la autenticación.
const nombreUsuario = 'Carlos Álvarez';
const primerNombre = computed(() => nombreUsuario.trim().split(/\s+/)[0] || 'Administrador');
const fechaLegible = computed(() => formatearFecha(new Date().toISOString()));
</script>
