<template>
  <div class="flex min-h-screen bg-neutral-lightest">
    <BarraLateralAdmin item-activo="marcas" @navegar="irA" />

    <div class="flex min-w-0 flex-1 flex-col">
      <BarraSuperiorAdmin
        v-model:termino-busqueda="busquedaGlobal"
        seccion="Marcas"
        nombre-usuario="Carlos Álvarez"
        rol-usuario="Administrador"
        :notificaciones="3"
      />

      <main class="flex-1 space-y-6 p-6 lg:p-8">
        <EncabezadoSeccion
          titulo="Marcas"
          descripcion="Gestiona las marcas de tu catálogo. Agrega, edita o desactiva marcas según tus necesidades."
        >
          <template #acciones>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-button bg-action px-4 py-2 text-sm font-medium text-neutral-white hover:bg-action-hover"
              @click="irA('/admin/catalogo/marcas/nueva')"
            >
              <Plus class="h-4 w-4" aria-hidden="true" />
              Nueva marca
            </button>
          </template>
        </EncabezadoSeccion>

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
          <button
            type="button"
            class="rounded-button px-3 py-2 text-sm font-medium text-action hover:bg-subaction disabled:cursor-not-allowed disabled:text-neutral-medium disabled:hover:bg-transparent"
            :disabled="!hayFiltrosActivos"
            @click="limpiarFiltros"
          >
            Limpiar filtros
          </button>
        </section>

        <TablaMarcas
          v-if="pagina"
          :pagina="pagina"
          :cargando="cargando"
          @editar="(marca) => irA(`/admin/catalogo/marcas/${marca.id}/editar`)"
          @menu="(id) => irA(`/admin/catalogo/marcas/${id}`)"
          @ir-pagina="irAPagina"
        />
      </main>
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
  </div>
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
import { ref } from 'vue';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { Plus, Search, Bookmark, Package, Layers, Droplet } from 'lucide-vue-next';
import BarraLateralAdmin from '../components/BarraLateralAdmin.vue';
import BarraSuperiorAdmin from '../components/BarraSuperiorAdmin.vue';
import EncabezadoSeccion from '../components/EncabezadoSeccion.vue';
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

const busquedaGlobal = ref('');

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
