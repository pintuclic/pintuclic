<template>
  <div class="flex min-h-screen bg-neutral-lightest">
    <BarraLateralAdmin item-activo="busquedas" @navegar="irA" />

    <div class="flex min-w-0 flex-1 flex-col">
      <BarraSuperiorAdmin
        v-model:termino-busqueda="busquedaGlobal"
        seccion="Búsquedas"
        nombre-usuario="Carlos Álvarez"
        rol-usuario="Administrador"
        :notificaciones="3"
      />

      <main class="flex-1 space-y-6 p-6 lg:p-8">
        <EncabezadoSeccion
          titulo="Búsquedas sin resultado"
          descripcion="Identifica qué productos buscan tus clientes y no están en el catálogo, para detectar oportunidades de negocio."
        />

        <p
          v-if="error"
          class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
        >
          {{ error }}
        </p>

        <!-- Filtros -->
        <section class="flex flex-wrap items-end gap-3 rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm" aria-label="Filtros de búsquedas">
          <label class="flex min-w-[9rem] flex-col gap-1 text-xs font-medium text-neutral-medium">
            Periodo
            <select
              :value="filtros.periodo"
              :class="claseSelect"
              @change="setFiltro({ periodo: onPeriodo(($event.target as HTMLSelectElement).value) })"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="todo">Todo el histórico</option>
            </select>
          </label>
          <label class="flex min-w-[11rem] flex-col gap-1 text-xs font-medium text-neutral-medium">
            Categoría relacionada
            <select
              :value="filtros.categoriaId ?? ''"
              :class="claseSelect"
              @change="setFiltro({ categoriaId: aTextoONull(($event.target as HTMLSelectElement).value) })"
            >
              <option value="">Todas las categorías</option>
              <option v-for="op in opcionesFiltro.categorias" :key="op.valor" :value="op.valor">{{ op.etiqueta }}</option>
            </select>
          </label>
          <label class="flex min-w-[9rem] flex-col gap-1 text-xs font-medium text-neutral-medium">
            Frecuencia
            <select
              :value="filtros.frecuencia"
              :class="claseSelect"
              @change="setFiltro({ frecuencia: onFrecuencia(($event.target as HTMLSelectElement).value) })"
            >
              <option value="todas">Todas</option>
              <option value="alta">Alta (10+)</option>
              <option value="media">Media (4–9)</option>
              <option value="baja">Baja (1–3)</option>
            </select>
          </label>
          <label class="flex min-w-[12rem] flex-1 flex-col gap-1 text-xs font-medium text-neutral-medium">
            Buscar término
            <div class="relative">
              <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-medium" aria-hidden="true" />
              <input
                :value="filtros.busqueda"
                type="search"
                placeholder="Escribe un término…"
                class="w-full rounded-input border border-neutral-light bg-neutral-white py-2 pl-9 pr-3 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
                @input="setFiltro({ busqueda: ($event.target as HTMLInputElement).value })"
                @keydown.enter="aplicarFiltros"
              />
            </div>
          </label>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-button bg-action px-4 py-2 text-sm font-medium text-neutral-white hover:bg-action-hover"
            @click="aplicarFiltros"
          >
            <Filter class="h-4 w-4" aria-hidden="true" />
            Filtrar
          </button>
          <button
            type="button"
            class="rounded-button px-3 py-2 text-sm font-medium text-action hover:bg-subaction disabled:cursor-not-allowed disabled:text-neutral-medium disabled:hover:bg-transparent"
            :disabled="!hayFiltrosActivos"
            @click="limpiarFiltros"
          >
            Limpiar filtros
          </button>
        </section>

        <!-- KPIs -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm">
            <div class="flex items-center gap-2.5">
              <span class="flex h-8 w-8 items-center justify-center rounded-card bg-subaction text-corporate"><Search class="h-4 w-4" aria-hidden="true" /></span>
              <span class="text-xs font-medium text-neutral-medium">Total de términos</span>
            </div>
            <p class="mt-2.5 text-2xl font-bold text-neutral-black tabular-nums">{{ formatearNumero(resumen.totalTerminos.valor) }}</p>
            <p class="mt-1 flex items-center gap-1 text-xs text-neutral-medium">
              <TrendingUp class="h-3.5 w-3.5 text-conversion" aria-hidden="true" />
              <span class="font-semibold text-conversion">{{ formatearVariacion(resumen.totalTerminos.variacionPorcentaje) }}</span> vs. mes anterior
            </p>
          </article>

          <article class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm">
            <div class="flex items-center gap-2.5">
              <span class="flex h-8 w-8 items-center justify-center rounded-card bg-subaction text-corporate"><Flame class="h-4 w-4" aria-hidden="true" /></span>
              <span class="text-xs font-medium text-neutral-medium">Más repetido</span>
            </div>
            <p class="mt-2.5 truncate text-base font-semibold text-neutral-black">{{ resumen.masRepetido.termino }}</p>
            <p class="mt-1 text-xs text-neutral-medium">{{ resumen.masRepetido.frecuencia }} búsquedas</p>
          </article>

          <article class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm">
            <div class="flex items-center gap-2.5">
              <span class="flex h-8 w-8 items-center justify-center rounded-card bg-subaction text-corporate"><Clock class="h-4 w-4" aria-hidden="true" /></span>
              <span class="text-xs font-medium text-neutral-medium">Última búsqueda</span>
            </div>
            <p class="mt-2.5 text-base font-semibold text-neutral-black">{{ formatearFechaHora(resumen.ultimaBusqueda.fechaHora) }}</p>
            <p class="mt-1 truncate text-xs text-neutral-medium">{{ resumen.ultimaBusqueda.termino }}</p>
          </article>

          <article class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm">
            <div class="flex items-center gap-2.5">
              <span class="flex h-8 w-8 items-center justify-center rounded-card bg-subaction text-corporate"><BarChart3 class="h-4 w-4" aria-hidden="true" /></span>
              <span class="text-xs font-medium text-neutral-medium">Oportunidades detectadas</span>
            </div>
            <p class="mt-2.5 text-2xl font-bold text-neutral-black tabular-nums">{{ formatearNumero(resumen.oportunidadesDetectadas.valor) }}</p>
            <p class="mt-1 flex items-center gap-1 text-xs text-neutral-medium">
              <TrendingUp class="h-3.5 w-3.5 text-conversion" aria-hidden="true" />
              <span class="font-semibold text-conversion">{{ formatearVariacion(resumen.oportunidadesDetectadas.variacionPorcentaje) }}</span> vs. mes anterior
            </p>
          </article>
        </div>

        <TablaBusquedasSinResultado
          v-if="pagina"
          :pagina="pagina"
          :cargando="cargando"
          @accion="onAccion"
          @menu="(id) => irA(`/admin/catalogo/busquedas-sin-resultado/${id}`)"
          @ir-pagina="irAPagina"
          @exportar="irA('/admin/catalogo/busquedas-sin-resultado/exportar')"
        />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: BÚSQUEDAS SIN RESULTADO  (maqueta "ADMIN 08")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaBusquedas.vue
 *
 * Reporte del catálogo alimentado por M02 (Búsqueda): términos que los clientes
 * buscaron sin encontrar, con acción sugerida (crear producto / agregar
 * sinónimo) y estado de gestión.
 *
 * Permiso requerido: «Gestión del catálogo» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { ref } from 'vue';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { Search, Filter, TrendingUp, Flame, Clock, BarChart3 } from 'lucide-vue-next';
import BarraLateralAdmin from '../components/BarraLateralAdmin.vue';
import BarraSuperiorAdmin from '../components/BarraSuperiorAdmin.vue';
import EncabezadoSeccion from '../components/EncabezadoSeccion.vue';
import TablaBusquedasSinResultado from '../components/TablaBusquedasSinResultado.vue';
import { useBusquedas } from '../composables/useBusquedas';
import type { AccionSugerida, FrecuenciaBusqueda, PeriodoBusqueda } from '../interfaces';

const {
  filtros,
  pagina,
  opcionesFiltro,
  resumen,
  cargando,
  error,
  hayFiltrosActivos,
  setFiltro,
  aplicarFiltros,
  irAPagina,
  limpiarFiltros,
  formatearNumero,
  formatearVariacion,
  formatearFechaHora,
} = useBusquedas();

const busquedaGlobal = ref('');

const claseSelect =
  'rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30';

function aTextoONull(valor: string): string | null {
  return valor === '' ? null : valor;
}
function onPeriodo(valor: string): PeriodoBusqueda {
  return valor === '7d' || valor === '90d' || valor === 'todo' ? valor : '30d';
}
function onFrecuencia(valor: string): FrecuenciaBusqueda {
  return valor === 'alta' || valor === 'media' || valor === 'baja' ? valor : 'todas';
}

function onAccion(payload: { id: string; tipo: AccionSugerida }): void {
  irA(
    payload.tipo === 'crear_producto'
      ? `/admin/catalogo/productos/nuevo?termino=${payload.id}`
      : `/admin/catalogo/busquedas-sin-resultado/${payload.id}/sinonimo`
  );
}

const { irA } = usePanelNavegacion();
</script>
