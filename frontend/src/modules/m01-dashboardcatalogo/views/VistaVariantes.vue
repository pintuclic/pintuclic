<template>
  <div class="flex min-h-screen bg-neutral-lightest">
    <BarraLateralAdmin item-activo="variantes" @navegar="irA" />

    <div class="flex min-w-0 flex-1 flex-col">
      <BarraSuperiorAdmin
        v-model:termino-busqueda="busquedaGlobal"
        seccion="Variantes"
        nombre-usuario="Carlos Álvarez"
        rol-usuario="Administrador"
        :notificaciones="3"
      />

      <main class="flex-1 space-y-6 p-6 lg:p-8">
        <EncabezadoSeccion
          titulo="Gestión de variantes"
          descripcion="Administra las variantes de tus productos. Edita precios, existencias y estados."
        />

        <p
          v-if="error"
          class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
        >
          {{ error }}
        </p>

        <FiltrosVariantes
          :filtros="filtros"
          :opciones="opcionesFiltro"
          :hay-filtros-activos="hayFiltrosActivos"
          @cambiar="aplicarFiltros"
          @limpiar="limpiarFiltros"
          @nueva="irA('/admin/catalogo/variantes/nueva')"
        />

        <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]">
          <div class="min-w-0">
            <TablaVariantes
              v-if="pagina"
              :pagina="pagina"
              :filtros="filtros"
              :cargando="cargando"
              @ordenar="ordenarPor"
              @ir-pagina="irAPagina"
              @por-pagina="cambiarPorPagina"
              @editar="(id) => irA(`/admin/catalogo/variantes/${id}/editar`)"
              @duplicar="(id) => irA(`/admin/catalogo/variantes/${id}/duplicar`)"
              @alternar="(id) => irA(`/admin/catalogo/variantes/${id}/estado`)"
              @exportar="irA('/admin/catalogo/variantes/exportar')"
            />
          </div>

          <aside
            class="space-y-3 xl:sticky xl:top-24 xl:self-start"
            aria-label="Resumen de variantes"
          >
            <h2 class="text-sm font-semibold text-neutral-black">Resumen de variantes</h2>
            <div class="divide-y divide-neutral-light rounded-card border border-neutral-light bg-neutral-white shadow-sm">
              <div
                v-for="fila in filasResumen"
                :key="fila.etiqueta"
                class="flex items-center gap-2.5 px-3 py-2.5"
              >
                <span class="grid h-7 w-7 shrink-0 place-items-center rounded-card bg-subaction text-corporate">
                  <component :is="fila.icono" class="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-[11px] text-neutral-medium">{{ fila.etiqueta }}</p>
                  <p class="text-base font-bold text-neutral-black tabular-nums leading-tight">
                    {{ fila.valor }}
                    <span
                      class="text-[11px] font-medium"
                      :class="fila.variacion > 0 ? 'text-conversion' : 'text-neutral-medium'"
                    >
                      {{ fila.variacion > 0 ? '+' : '' }}{{ fila.variacion }}%
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: VARIANTES · LISTADO  (maqueta "ADMIN 04")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaVariantes.vue
 *
 * Listado administrativo de variantes con filtros (producto, presentación,
 * estado, marca), ordenamiento por columna y paginación del lado servidor
 * (HU-CAT-03, HU-CAT-09). Panel lateral con el resumen de variantes.
 *
 * Permiso requerido: «Gestión de productos» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { computed, ref } from 'vue';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { Layers, PackageX, FileText } from 'lucide-vue-next';
import BarraLateralAdmin from '../components/BarraLateralAdmin.vue';
import BarraSuperiorAdmin from '../components/BarraSuperiorAdmin.vue';
import EncabezadoSeccion from '../components/EncabezadoSeccion.vue';
import FiltrosVariantes from '../components/FiltrosVariantes.vue';
import TablaVariantes from '../components/TablaVariantes.vue';
import { useVariantes } from '../composables/useVariantes';

const {
  filtros,
  pagina,
  opcionesFiltro,
  resumen,
  cargando,
  error,
  hayFiltrosActivos,
  aplicarFiltros,
  ordenarPor,
  irAPagina,
  cambiarPorPagina,
  limpiarFiltros,
} = useVariantes();

const busquedaGlobal = ref('');

/** Resumen compacto del panel lateral (versión reducida de `TarjetaEstadistica`). */
const filasResumen = computed(() => [
  { etiqueta: 'Variantes activas', valor: resumen.value.activas.valor, variacion: resumen.value.activas.variacionPorcentaje, icono: Layers },
  { etiqueta: 'Sin stock referencial', valor: resumen.value.sinStock.valor, variacion: resumen.value.sinStock.variacionPorcentaje, icono: PackageX },
  { etiqueta: 'Borradores', valor: resumen.value.borradores.valor, variacion: resumen.value.borradores.variacionPorcentaje, icono: FileText },
]);

const { irA } = usePanelNavegacion();
</script>
