<template>
  <div class="space-y-6 p-6 lg:p-8">
    <EncabezadoSeccion
      titulo="Gestión de productos"
      descripcion="Administra tu catálogo de productos: agrega, edita y organiza todos tus productos en un solo lugar."
    >
      <template #acciones>
        <Button variant="outline" :icon="Download" @click="irA('/admin/catalogo/productos/exportar')">
          Exportar
        </Button>
        <Button variant="conversion" :icon="Plus" @click="irA('/admin/catalogo/productos/nuevo')">
          Nuevo producto
        </Button>
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
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { Plus, Download } from 'lucide-vue-next';
import { Button } from '@/core/components';
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
  hayFiltrosActivos,
  aplicarFiltros,
  ordenarPor,
  irAPagina,
  limpiarFiltros,
} = useProductos();

// Navegación del panel: la provee el router (dashboardCatalogoRoutes).
const { irA } = usePanelNavegacion();
</script>
