<template>
  <div class="space-y-6 p-6 lg:p-8">
    <PageHeader
      title="Marcas"
      description="Gestiona las marcas de tu catálogo. Agrega, edita o desactiva marcas según tus necesidades."
    >
      <template #default>
        <Button variant="action" :icon="Plus" @click="irA('/admin/catalogo/marcas/nueva')">
          Nueva marca
        </Button>
      </template>
    </PageHeader>

    <p
      v-if="error"
      class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
    >
      {{ error }}
    </p>

    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <TarjetaEstadistica etiqueta="Marcas activas" :valor="resumen.marcasActivas.valor" :variacion-porcentaje="resumen.marcasActivas.variacionPorcentaje" :icono="Bookmark" />
      <TarjetaEstadistica etiqueta="Total de productos" :valor="resumen.totalProductos.valor" :variacion-porcentaje="resumen.totalProductos.variacionPorcentaje" :icono="Package" />
      <TarjetaEstadistica etiqueta="Líneas de productos" :valor="resumen.lineasProductos.valor" :variacion-porcentaje="resumen.lineasProductos.variacionPorcentaje" :icono="Layers" />
      <TarjetaEstadistica etiqueta="Colores disponibles" :valor="resumen.coloresDisponibles.valor" :variacion-porcentaje="resumen.coloresDisponibles.variacionPorcentaje" :icono="Droplet" />
    </div>

    <section class="flex flex-wrap items-center gap-3 rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm" aria-label="Filtros de marcas">
      <div class="relative min-w-[14rem] flex-1">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-medium" aria-hidden="true" />
        <input
          :value="filtros.busqueda"
          type="search"
          placeholder="Buscar marcas por nombre, descripción…"
          class="w-full rounded-input border border-neutral-light bg-neutral-lightest py-2 pl-9 pr-3 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
          aria-label="Buscar marcas"
          @input="onBuscar(($event.target as HTMLInputElement).value)"
        />
      </div>
      <label class="flex items-center gap-2 text-xs font-medium text-neutral-medium">
        Estado
        <select
          :value="filtros.estado ?? ''"
          class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action"
          @change="aplicarFiltros({ estado: onEstado(($event.target as HTMLSelectElement).value) })"
        >
          <option value="">Todos</option>
          <option value="activa">Activa</option>
          <option value="inactiva">Inactiva</option>
        </select>
      </label>
      <Button variant="text" :disabled="!hayFiltrosActivos" @click="limpiarFiltros">
        Limpiar filtros
      </Button>
    </section>

    <TablaMarcas
      v-if="pagina"
      :pagina="pagina"
      :cargando="cargando"
      @editar="(marca) => irA(`/admin/catalogo/marcas/${marca.id}/editar`)"
      @detalle="(id) => irA(`/admin/catalogo/marcas/${id}`)"
      @ir-pagina="irAPagina"
    />
  </div>

  <PanelEditarMarca
    v-if="marcaEnEdicion"
    :marca="marcaEnEdicion"
    :errores="erroresEdicion"
    :guardando="guardando"
    @cerrar="cerrarEdicion"
    @cambiar="actualizarEdicion"
    @guardar="guardarEdicion"
  />
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: MARCAS  (maqueta "ADMIN 06")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaMarcas.vue
 *
 * Listado de marcas con KPIs, búsqueda y filtro por estado, más panel lateral
 * de edición (logotipo, descripción, estado, líneas) — HU-CAT-04.
 *
 * Permiso requerido: «Gestión del catálogo» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { Plus, Search, Bookmark, Package, Layers, Droplet } from 'lucide-vue-next';
import { Button, PageHeader } from '@/core/components';
import TarjetaEstadistica from '../components/TarjetaEstadistica.vue';
import TablaMarcas from '../components/TablaMarcas.vue';
import PanelEditarMarca from '../components/PanelEditarMarca.vue';
import { useMarcas } from '../composables/useMarcas';
import type { EstadoMarca } from '../interfaces';

const {
  filtros,
  pagina,
  resumen,
  cargando,
  guardando,
  error,
  marcaEnEdicion,
  erroresEdicion,
  hayFiltrosActivos,
  aplicarFiltros,
  irAPagina,
  limpiarFiltros,
  cerrarEdicion,
  actualizarEdicion,
  guardarEdicion,
} = useMarcas();


let temporizador: ReturnType<typeof setTimeout> | undefined;
function onBuscar(valor: string): void {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => aplicarFiltros({ busqueda: valor }), 300);
}

function onEstado(valor: string): EstadoMarca | null {
  return valor === 'activa' || valor === 'inactiva' ? valor : null;
}

const { irA } = usePanelNavegacion();
</script>
