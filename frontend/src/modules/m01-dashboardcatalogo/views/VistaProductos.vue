<template>
  <DisenoAdmin>
    <div class="space-y-6 p-6 lg:p-8">
      <EncabezadoSeccion
        titulo="Gestión de productos"
        descripcion="Administra tu catálogo de productos: agrega, edita y organiza todos tus productos en un solo lugar."
      >
        <template #acciones>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-button bg-conversion px-4 py-2 text-sm font-medium text-neutral-white transition-colors hover:bg-conversion-hover focus:outline-none focus:ring-2 focus:ring-conversion focus:ring-offset-2"
            @click="irA('/admin/catalogo/productos/nuevo')"
          >
            <Plus class="h-4 w-4" aria-hidden="true" />
            Nuevo producto
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-button border border-neutral-light bg-neutral-white px-4 py-2 text-sm font-medium text-neutral-dark transition-colors hover:bg-neutral-lightest focus:outline-none focus:ring-2 focus:ring-action focus:ring-offset-2"
            @click="irA('/admin/catalogo/productos/exportar')"
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

      <FiltrosProductos
        :filtros="filtros"
        :opciones="opcionesFiltro"
        :hay-filtros-activos="hayFiltrosActivos"
        @cambiar="aplicarFiltros"
        @limpiar="limpiarFiltros"
      />

      <TablaProductos
        v-if="pagina"
        :pagina="pagina"
        :filtros="filtros"
        :cargando="cargando"
        @ordenar="ordenarPor"
        @ir-pagina="irAPagina"
        @abrir="(id) => irA(`/admin/catalogo/productos/${id}`)"
        @editar="(id) => irA(`/admin/catalogo/productos/${id}/editar`)"
        @duplicar="() => irA('/admin/catalogo/productos/nuevo')"
        @seleccion="onSeleccion"
      />
    </div>

    <BarraAccionesMasivas
      :cantidad="seleccionados.length"
      @limpiar="seleccionados = []"
      @activar-lote="() => {}"
      @desactivar-lote="() => {}"
      @exportar-lote="() => irA('/admin/catalogo/productos/exportar')"
    />
  </DisenoAdmin>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: PRODUCTOS · LISTADO  (maqueta "ADMIN 02 - Productos · Listado")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaProductos.vue
 *
 * Listado administrativo de productos con búsqueda, filtros (categoría, marca,
 * línea, estado, tipo de color), ordenamiento y paginación del lado servidor
 * (HU-CAT-02, HU-CAT-09 / RNF-CAT-06-01).
 *
 * Permiso requerido: «Gestión de productos» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { ref } from 'vue';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { Plus, Download } from 'lucide-vue-next';
import DisenoAdmin from '@/core/layouts/DisenoAdmin.vue';
import EncabezadoSeccion from '../components/EncabezadoSeccion.vue';
import FiltrosProductos from '../components/FiltrosProductos.vue';
import TablaProductos from '../components/TablaProductos.vue';
import BarraAccionesMasivas from '../components/BarraAccionesMasivas.vue';
import { useProductos } from '../composables/useProductos';

const {
  filtros,
  pagina,
  opcionesFiltro,
  cargando,
  error,
  hayFiltrosActivos,
  aplicarFiltros,
  ordenarPor,
  irAPagina,
  limpiarFiltros,
} = useProductos();

const seleccionados = ref<string[]>([]);
function onSeleccion(ids: string[]): void {
  seleccionados.value = ids;
}

// Navegación del panel: la provee el router (dashboardCatalogoRoutes).
const { irA } = usePanelNavegacion();
</script>
