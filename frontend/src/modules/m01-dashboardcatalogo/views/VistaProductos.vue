<template>
  <div class="flex min-h-screen bg-neutral-lightest">
    <BarraLateralAdmin item-activo="productos" @navegar="irA" />

    <div class="flex min-w-0 flex-1 flex-col">
      <BarraSuperiorAdmin
        v-model:termino-busqueda="busquedaGlobal"
        seccion="Productos"
        nombre-usuario="Carlos Álvarez"
        rol-usuario="Administrador"
        :notificaciones="3"
      />

      <main class="flex-1 space-y-6 p-6 lg:p-8">
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
          v-if="usandoDatosDemo"
          class="rounded-card border border-highlight/40 bg-highlight/10 px-4 py-3 text-sm text-neutral-dark"
        >
          Mostrando datos de ejemplo. El listado se conectará a
          <code class="font-medium">GET /api/catalogo/productos</code> cuando el backend de M01
          lo publique.
        </p>
        <p
          v-else-if="error"
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
          @menu="(id) => irA(`/admin/catalogo/productos/${id}/acciones`)"
          @seleccion="onSeleccion"
        />
      </main>
    </div>
  </div>
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
import BarraLateralAdmin from '../components/BarraLateralAdmin.vue';
import BarraSuperiorAdmin from '../components/BarraSuperiorAdmin.vue';
import EncabezadoSeccion from '../components/EncabezadoSeccion.vue';
import FiltrosProductos from '../components/FiltrosProductos.vue';
import TablaProductos from '../components/TablaProductos.vue';
import { useProductos } from '../composables/useProductos';

const {
  filtros,
  pagina,
  opcionesFiltro,
  cargando,
  error,
  usandoDatosDemo,
  hayFiltrosActivos,
  aplicarFiltros,
  ordenarPor,
  irAPagina,
  limpiarFiltros,
} = useProductos();

const busquedaGlobal = ref('');
const seleccionados = ref<string[]>([]);
function onSeleccion(ids: string[]): void {
  seleccionados.value = ids;
}

// Navegación provisional hasta montar el router del panel admin.
const { irA } = usePanelNavegacion();
</script>
