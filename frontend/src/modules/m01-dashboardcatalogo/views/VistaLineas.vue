<template>
  <div class="flex min-h-screen bg-neutral-lightest">
    <BarraLateralAdmin item-activo="lineas" @navegar="irA" />

    <div class="flex min-w-0 flex-1 flex-col">
      <BarraSuperiorAdmin
        v-model:termino-busqueda="busquedaGlobal"
        seccion="Líneas comerciales"
        nombre-usuario="Carlos Álvarez"
        rol-usuario="Administrador"
        :notificaciones="3"
      />

      <main class="flex-1 space-y-6 p-6 lg:p-8">
        <EncabezadoSeccion
          titulo="Gestión de líneas comerciales"
          descripcion="Organiza y administra las líneas comerciales de tus marcas. Define gamas, asocia productos y gestiona su visibilidad."
        >
          <template #acciones>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-button bg-conversion px-4 py-2 text-sm font-medium text-neutral-white transition-colors hover:bg-conversion-hover focus:outline-none focus:ring-2 focus:ring-conversion focus:ring-offset-2"
              @click="irA('/admin/catalogo/lineas/nueva')"
            >
              <Plus class="h-4 w-4" aria-hidden="true" />
              Nueva línea
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-button border border-neutral-light bg-neutral-white px-4 py-2 text-sm font-medium text-neutral-dark transition-colors hover:bg-neutral-lightest focus:outline-none focus:ring-2 focus:ring-action focus:ring-offset-2"
              @click="irA('/admin/catalogo/lineas/exportar')"
            >
              <Download class="h-4 w-4" aria-hidden="true" />
              Exportar
            </button>
          </template>
        </EncabezadoSeccion>

        <p
          v-if="error"
          class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
        >
          {{ error }}
        </p>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="kpi in kpis"
            :key="kpi.etiqueta"
            class="flex items-center gap-3 rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm"
          >
            <span
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-card"
              :class="kpi.clasesIcono"
            >
              <component :is="kpi.icono" class="h-5 w-5" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <p class="text-2xl font-bold leading-tight text-neutral-black tabular-nums">
                {{ formatearNumero(kpi.valor) }}
              </p>
              <p class="text-sm font-medium text-neutral-dark">{{ kpi.etiqueta }}</p>
              <p class="truncate text-xs text-neutral-medium">{{ kpi.subtitulo }}</p>
            </div>
          </article>
        </div>

        <!-- Filtros -->
        <section
          class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm"
          aria-label="Filtros de líneas comerciales"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div class="relative flex-1">
              <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-medium" aria-hidden="true" />
              <input
                :value="filtros.busqueda"
                type="search"
                placeholder="Buscar por nombre de línea, marca o gama…"
                class="w-full rounded-input border border-neutral-light bg-neutral-lightest py-2 pl-9 pr-3 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
                aria-label="Buscar líneas comerciales"
                @input="onBuscar(($event.target as HTMLInputElement).value)"
              />
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-1.5 self-start rounded-button px-3 py-2 text-sm font-medium text-action hover:bg-subaction disabled:cursor-not-allowed disabled:text-neutral-medium disabled:hover:bg-transparent sm:self-auto"
              :disabled="!hayFiltrosActivos"
              @click="limpiarFiltros"
            >
              <FilterX class="h-4 w-4" aria-hidden="true" />
              Limpiar filtros
            </button>
          </div>

          <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label class="flex flex-col gap-1 text-xs font-medium text-neutral-medium">
              Marca
              <select
                :value="filtros.marca ?? ''"
                class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
                @change="aplicarFiltros({ marca: opcionONull(($event.target as HTMLSelectElement).value) })"
              >
                <option value="">Todas las marcas</option>
                <option v-for="op in opcionesFiltro.marcas" :key="op.valor" :value="op.etiqueta">
                  {{ op.etiqueta }}
                </option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-xs font-medium text-neutral-medium">
              Estado
              <select
                :value="filtros.estado ?? ''"
                class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
                @change="aplicarFiltros({ estado: onEstado(($event.target as HTMLSelectElement).value) })"
              >
                <option value="">Todos los estados</option>
                <option value="activa">Activa</option>
                <option value="pausada">Pausada</option>
                <option value="inactiva">Inactiva</option>
              </select>
            </label>

            <label class="flex flex-col gap-1 text-xs font-medium text-neutral-medium">
              Segmento / Categoría
              <select
                :value="filtros.segmento ?? ''"
                class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
                @change="aplicarFiltros({ segmento: opcionONull(($event.target as HTMLSelectElement).value) })"
              >
                <option value="">Todos los segmentos</option>
                <option v-for="op in opcionesFiltro.segmentos" :key="op.valor" :value="op.etiqueta">
                  {{ op.etiqueta }}
                </option>
              </select>
            </label>
          </div>
        </section>

        <TablaLineas
          v-if="pagina"
          :pagina="pagina"
          :orden="filtros.orden"
          :cargando="cargando"
          @editar="(linea) => irA(`/admin/catalogo/lineas/${linea.id}/editar`)"
          @desactivar="(linea) => (lineaADesactivar = linea)"
          @ordenar="(orden) => aplicarFiltros({ orden })"
          @ir-pagina="irAPagina"
        />
      </main>
    </div>

    <!-- ADMIN 17 - Modal desactivar línea -->
    <ModalDesactivarLinea
      v-if="lineaADesactivar"
      :linea="lineaADesactivar"
      @cerrar="lineaADesactivar = null"
      @ver-dependencias="(linea) => irA(`/admin/catalogo/lineas/${linea.id}/editar`)"
      @confirmar="onDesactivar"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: LÍNEAS COMERCIALES · LISTADO  (maqueta "ADMIN 15")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaLineas.vue
 *
 * Listado administrativo de líneas comerciales (gamas) con KPIs, búsqueda,
 * filtros (marca, estado, segmento), ordenamiento y paginación del lado
 * servidor (RF-CAT-11). Sección propia del panel de catálogo.
 *
 * Permiso requerido: «Gestión del catálogo» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { computed, ref } from 'vue';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { Plus, Download, Search, FilterX, Boxes, Tag, Layers, Settings } from 'lucide-vue-next';
import type { Component } from 'vue';
import BarraLateralAdmin from '../components/BarraLateralAdmin.vue';
import BarraSuperiorAdmin from '../components/BarraSuperiorAdmin.vue';
import EncabezadoSeccion from '../components/EncabezadoSeccion.vue';
import TablaLineas from '../components/TablaLineas.vue';
import ModalDesactivarLinea from '../components/ModalDesactivarLinea.vue';
import { useLineas } from '../composables/useLineas';
import type { EstadoLinea, LineaListado } from '../interfaces';

const {
  filtros,
  pagina,
  resumen,
  opcionesFiltro,
  cargando,
  error,
  hayFiltrosActivos,
  aplicarFiltros,
  irAPagina,
  limpiarFiltros,
  formatearNumero,
} = useLineas();

const busquedaGlobal = ref('');
const lineaADesactivar = ref<LineaListado | null>(null);

// KPIs de la maqueta ADMIN 15: ícono en caja de color + número + etiqueta +
// subtítulo. Colores solo con tokens oficiales (sin morado/rojo del mockup).
interface Kpi {
  etiqueta: string;
  subtitulo: string;
  valor: number;
  icono: Component;
  clasesIcono: string;
}
const kpis = computed<Kpi[]>(() => [
  {
    etiqueta: 'Líneas activas',
    subtitulo: `de ${resumen.value.lineasActivas.total} líneas totales`,
    valor: resumen.value.lineasActivas.valor,
    icono: Boxes,
    clasesIcono: 'bg-conversion/10 text-conversion',
  },
  {
    etiqueta: 'Marcas asociadas',
    subtitulo: 'con líneas comerciales',
    valor: resumen.value.marcasAsociadas.valor,
    icono: Tag,
    clasesIcono: 'bg-subaction text-corporate',
  },
  {
    etiqueta: 'Productos vinculados',
    subtitulo: 'en todas las líneas',
    valor: resumen.value.productosVinculados.valor,
    icono: Layers,
    clasesIcono: 'bg-action/10 text-action',
  },
  {
    etiqueta: 'Reglas dependientes',
    subtitulo: 'de precios y promociones',
    valor: resumen.value.reglasDependientes.valor,
    icono: Settings,
    clasesIcono: 'bg-corporate/10 text-corporate',
  },
]);

/** Desactivación optimista en memoria (sin backend): marca la fila como inactiva. */
function onDesactivar(linea: LineaListado): void {
  const fila = pagina.value?.items.find((l) => l.id === linea.id);
  if (fila) fila.estado = 'inactiva';
  lineaADesactivar.value = null;
}

let temporizador: ReturnType<typeof setTimeout> | undefined;
function onBuscar(valor: string): void {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => aplicarFiltros({ busqueda: valor }), 300);
}

function opcionONull(valor: string): string | null {
  return valor === '' ? null : valor;
}

function onEstado(valor: string): EstadoLinea | null {
  return valor === 'activa' || valor === 'inactiva' || valor === 'pausada' ? valor : null;
}

const { irA } = usePanelNavegacion();
</script>
