<template>
  <div class="flex min-h-screen bg-neutral-lightest">
    <BarraLateralAdmin item-activo="colores" @navegar="irA" />

    <div class="flex min-w-0 flex-1 flex-col">
      <BarraSuperiorAdmin
        v-model:termino-busqueda="busquedaGlobal"
        seccion="Colores"
        nombre-usuario="Carlos Álvarez"
        rol-usuario="Administrador"
        :notificaciones="3"
      />

      <main class="flex-1 space-y-6 p-6 lg:p-8">
        <EncabezadoSeccion
          titulo="Gestión de colores"
          descripcion="Administra la paleta de colores de tu catálogo. Organiza, edita y crea nuevos colores."
        >
          <template #acciones>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-button border border-neutral-light bg-neutral-white px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
              @click="irA('/admin/catalogo/colores/carga-masiva')"
            >
              <Upload class="h-4 w-4" aria-hidden="true" />
              Carga masiva
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-button bg-action px-4 py-2 text-sm font-medium text-neutral-white hover:bg-action-hover"
              @click="irA('/admin/catalogo/colores/nuevo')"
            >
              <Plus class="h-4 w-4" aria-hidden="true" />
              Nuevo color
            </button>
          </template>
        </EncabezadoSeccion>

        <p
          v-if="usandoDatosDemo"
          class="rounded-card border border-highlight/40 bg-highlight/10 px-4 py-3 text-sm text-neutral-dark"
        >
          Mostrando datos de ejemplo. El listado se conectará a
          <code class="font-medium">GET /api/catalogo/colores</code> cuando el backend de M01 lo publique.
        </p>
        <p
          v-else-if="error"
          class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
        >
          {{ error }}
        </p>

        <!-- Tira de familias cromáticas -->
        <section class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm" aria-label="Familias cromáticas">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-neutral-black">Familias cromáticas</h2>
            <button type="button" class="text-xs font-medium text-action hover:underline" @click="limpiarFiltros">
              Ver todas
            </button>
          </div>
          <div class="flex gap-4 overflow-x-auto pb-1">
            <button
              v-for="familia in familias"
              :key="familia.clave"
              type="button"
              class="flex shrink-0 flex-col items-center gap-1.5 rounded-card px-3 py-2 transition-colors"
              :class="filtros.familiaClave === familia.clave ? 'bg-subaction' : 'hover:bg-neutral-lightest'"
              :aria-pressed="filtros.familiaClave === familia.clave"
              @click="filtrarPorFamilia(familia.clave)"
            >
              <!-- Círculo con el hex representativo de la familia (dato de catálogo). -->
              <span class="h-10 w-10 rounded-full border border-neutral-light" :style="{ backgroundColor: familia.hex }" aria-hidden="true" />
              <span class="text-xs font-medium text-neutral-dark">{{ familia.nombre }}</span>
              <span class="text-xs text-neutral-medium tabular-nums">{{ familia.total }}</span>
            </button>
          </div>
        </section>

        <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div class="space-y-4 xl:col-span-2">
            <!-- Filtros -->
            <section class="flex flex-wrap items-center gap-3 rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm" aria-label="Filtros de colores">
              <div class="relative min-w-[14rem] flex-1">
                <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-medium" aria-hidden="true" />
                <input
                  :value="filtros.busqueda"
                  type="search"
                  placeholder="Buscar color por nombre o código…"
                  class="w-full rounded-input border border-neutral-light bg-neutral-lightest py-2 pl-9 pr-3 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
                  aria-label="Buscar colores"
                  @input="onBuscar(($event.target as HTMLInputElement).value)"
                />
              </div>
              <select
                :value="filtros.marcaId ?? ''"
                class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action"
                aria-label="Filtrar por marca"
                @change="aplicarFiltros({ marcaId: aTextoONull(($event.target as HTMLSelectElement).value) })"
              >
                <option value="">Todas las marcas</option>
                <option v-for="op in opcionesFiltro.marcas" :key="op.valor" :value="op.valor">{{ op.etiqueta }}</option>
              </select>
              <select
                :value="filtros.familiaClave ?? ''"
                class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action"
                aria-label="Filtrar por familia cromática"
                @change="aplicarFiltros({ familiaClave: aTextoONull(($event.target as HTMLSelectElement).value) })"
              >
                <option value="">Todas las familias</option>
                <option v-for="op in opcionesFiltro.familias" :key="op.valor" :value="op.valor">{{ op.etiqueta }}</option>
              </select>
              <select
                :value="filtros.estado ?? ''"
                class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action"
                aria-label="Filtrar por estado"
                @change="aplicarFiltros({ estado: onEstado(($event.target as HTMLSelectElement).value) })"
              >
                <option value="">Todos los estados</option>
                <option value="publicado">Publicado</option>
                <option value="borrador">Borrador</option>
              </select>
            </section>

            <TablaColores
              v-if="pagina"
              :pagina="pagina"
              :cargando="cargando"
              @menu="(id) => irA(`/admin/catalogo/colores/${id}/acciones`)"
              @ir-pagina="irAPagina"
            />
          </div>

          <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <h2 class="text-base font-semibold text-neutral-black">Resumen de colores</h2>
            <TarjetaEstadistica etiqueta="Total de colores" :valor="resumen.totalColores.valor" :variacion-porcentaje="resumen.totalColores.variacionPorcentaje" :icono="Palette" />
            <TarjetaEstadistica etiqueta="Colores activos" :valor="resumen.coloresActivos.valor" :variacion-porcentaje="resumen.coloresActivos.variacionPorcentaje" :icono="Droplet" />
            <TarjetaEstadistica etiqueta="Familias cromáticas" :valor="resumen.familiasCromaticas.valor" :icono="LayoutGrid" />
          </aside>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: COLORES  (maqueta "ADMIN 07")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaColores.vue
 *
 * Listado de colores con tira de familias cromáticas, búsqueda y filtros
 * (marca, familia, estado) y panel de resumen. El valor cromático se muestra
 * desde el hex derivado del CIELAB (HU-CAT-05 / RF-CAT-05-02).
 *
 * Permiso requerido: «Gestión del catálogo» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { ref } from 'vue';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { Plus, Upload, Search, Palette, Droplet, LayoutGrid } from 'lucide-vue-next';
import BarraLateralAdmin from '../components/BarraLateralAdmin.vue';
import BarraSuperiorAdmin from '../components/BarraSuperiorAdmin.vue';
import EncabezadoSeccion from '../components/EncabezadoSeccion.vue';
import TarjetaEstadistica from '../components/TarjetaEstadistica.vue';
import TablaColores from '../components/TablaColores.vue';
import { useColores } from '../composables/useColores';
import type { EstadoColor } from '../interfaces';

const {
  filtros,
  pagina,
  familias,
  opcionesFiltro,
  resumen,
  cargando,
  error,
  usandoDatosDemo,
  aplicarFiltros,
  filtrarPorFamilia,
  irAPagina,
  limpiarFiltros,
} = useColores();

const busquedaGlobal = ref('');

let temporizador: ReturnType<typeof setTimeout> | undefined;
function onBuscar(valor: string): void {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => aplicarFiltros({ busqueda: valor }), 300);
}

function aTextoONull(valor: string): string | null {
  return valor === '' ? null : valor;
}
function onEstado(valor: string): EstadoColor | null {
  return valor === 'publicado' || valor === 'borrador' ? valor : null;
}

const { irA } = usePanelNavegacion();
</script>
