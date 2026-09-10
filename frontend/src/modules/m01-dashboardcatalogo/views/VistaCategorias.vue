<template>
  <div class="flex min-h-screen bg-neutral-lightest">
    <BarraLateralAdmin item-activo="categorias" @navegar="irA" />

    <div class="flex min-w-0 flex-1 flex-col">
      <BarraSuperiorAdmin
        v-model:termino-busqueda="busquedaGlobal"
        seccion="Categorías"
        nombre-usuario="Carlos Álvarez"
        rol-usuario="Administrador"
        :notificaciones="3"
      />

      <main class="flex-1 space-y-6 p-6 lg:p-8">
        <EncabezadoSeccion
          titulo="Categorías y subcategorías"
          descripcion="Organiza y gestiona la estructura de tu catálogo. Crea, edita y ordena categorías para una mejor experiencia de navegación."
        >
          <template #acciones>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-button border border-neutral-light bg-neutral-white px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
              @click="irA('/admin/catalogo/categorias/subcategorias/nueva')"
            >
              <Plus class="h-4 w-4" aria-hidden="true" />
              Nueva subcategoría
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-button bg-action px-4 py-2 text-sm font-medium text-neutral-white hover:bg-action-hover"
              @click="irA('/admin/catalogo/categorias/nueva')"
            >
              <Plus class="h-4 w-4" aria-hidden="true" />
              Nueva categoría
            </button>
          </template>
        </EncabezadoSeccion>

        <p
          v-if="error"
          class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
        >
          {{ error }}
        </p>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-[20rem_1fr]">
          <ArbolCategorias
            :arbol="arbolFiltrado"
            :seleccionada-id="seleccionadaId"
            :expandidas="expandidas"
            :busqueda="busquedaArbol"
            :cargando="cargando"
            class="lg:sticky lg:top-24 lg:self-start"
            @seleccionar="seleccionar"
            @alternar="alternarExpandida"
            @buscar="buscarEnArbol"
          />

          <PanelDetalleCategoria
            :detalle="detalle"
            :elementos="elementosFiltrados"
            :filtros="filtrosElementos"
            :total-elementos="totalElementos"
            :cargando="cargandoDetalle"
            @editar="(id) => irA(`/admin/catalogo/categorias/${id}/editar`)"
            @menu="(id) => irA(`/admin/catalogo/categorias/${id}/acciones`)"
            @menu-elemento="(id) => irA(`/admin/catalogo/categorias/${id}/acciones`)"
            @ordenar="ordenarElementosPor"
            @buscar="(t) => aplicarFiltroElementos({ busqueda: t })"
            @filtrar-tipo="onFiltrarTipo"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: CATEGORÍAS Y SUBCATEGORÍAS  (maqueta "ADMIN 05")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaCategorias.vue
 *
 * Estructura del catálogo a dos niveles (HU-CAT-01): árbol navegable a la
 * izquierda; a la derecha, detalle de la categoría seleccionada con sus
 * indicadores y la tabla de elementos (categoría + subcategorías).
 *
 * Permiso requerido: «Gestión del catálogo» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { ref } from 'vue';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { Plus } from 'lucide-vue-next';
import BarraLateralAdmin from '../components/BarraLateralAdmin.vue';
import BarraSuperiorAdmin from '../components/BarraSuperiorAdmin.vue';
import EncabezadoSeccion from '../components/EncabezadoSeccion.vue';
import ArbolCategorias from '../components/ArbolCategorias.vue';
import PanelDetalleCategoria from '../components/PanelDetalleCategoria.vue';
import { useCategorias } from '../composables/useCategorias';
import type { TipoNodoCategoria } from '../interfaces';

const {
  seleccionadaId,
  detalle,
  busquedaArbol,
  expandidas,
  filtrosElementos,
  cargando,
  cargandoDetalle,
  error,
  arbolFiltrado,
  elementosFiltrados,
  totalElementos,
  seleccionar,
  alternarExpandida,
  buscarEnArbol,
  aplicarFiltroElementos,
  ordenarElementosPor,
} = useCategorias();

const busquedaGlobal = ref('');

function onFiltrarTipo(valor: string): void {
  const tipo = valor === '' ? null : (valor as TipoNodoCategoria);
  aplicarFiltroElementos({ tipo });
}

const { irA } = usePanelNavegacion();
</script>
