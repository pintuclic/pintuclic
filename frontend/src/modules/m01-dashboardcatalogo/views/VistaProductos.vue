<template>
  <div class="space-y-6 p-6 lg:p-8">
    <PageHeader
      title="Gestión de productos"
      description="Administra tu catálogo de productos: agrega, edita y organiza todos tus productos en un solo lugar."
    >
      <template #default>
        <Button variant="outline" :icon="Download" @click="irA('/admin/catalogo/productos/exportar')">
          Exportar
        </Button>
        <Button variant="conversion" :icon="Plus" @click="irA('/admin/catalogo/productos/nuevo')">
          Nuevo producto
        </Button>
      </template>
    </PageHeader>

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
      v-model:seleccion="seleccion"
      :pagina="pagina"
      :filtros="filtros"
      :cargando="cargando"
      @ordenar="ordenarPor"
      @ir-pagina="irAPagina"
      @abrir="(id) => irA(`/admin/catalogo/productos/${id}`)"
      @editar="(id) => irA(`/admin/catalogo/productos/${id}/editar`)"
      @duplicar="() => irA('/admin/catalogo/productos/nuevo')"
    />

    <BarraAccionesMasivas
      :cantidad="seleccion.length"
      @limpiar="seleccion = []"
      @activar-lote="seleccion = []"
      @desactivar-lote="seleccion = []"
      @exportar-lote="exportarSeleccion"
    />
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
import { Button, PageHeader } from '@/core/components';
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

// Navegación del panel: la provee el router (dashboardCatalogoRoutes).
const { irA } = usePanelNavegacion();

/**
 * Selección de filas para las acciones masivas. «Activar»/«Desactivar» en lote
 * no tienen endpoint por lotes en la API real: solo limpian la selección (no
 * se simula un guardado que no ocurre). «Exportar» reutiliza la misma ruta que
 * el botón «Exportar» de la cabecera.
 */
const seleccion = ref<string[]>([]);

function exportarSeleccion(): void {
  irA('/admin/catalogo/productos/exportar');
  seleccion.value = [];
}
</script>
