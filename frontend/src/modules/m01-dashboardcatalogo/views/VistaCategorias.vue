<template>
  <div class="space-y-6 p-6 lg:p-8">
    <PageHeader
      title="Categorías y subcategorías"
      description="Organiza y gestiona la estructura de tu catálogo. Crea, edita y ordena categorías para una mejor experiencia de navegación."
    >
      <template #default>
        <Button variant="outline" :icon="Plus" @click="irA('/admin/catalogo/categorias/subcategorias/nueva')">
          Nueva subcategoría
        </Button>
        <Button variant="action" :icon="Plus" @click="irA('/admin/catalogo/categorias/nueva')">
          Nueva categoría
        </Button>
      </template>
    </PageHeader>

    <p
      v-if="error"
      class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
    >
      {{ error }}
    </p>

    <!--
      Sin sticky/fixed a propósito: el árbol y el panel de detalle se
      desplazan junto con el resto de la página, como cualquier contenido
      normal. `min-w-0` evita que la tabla de elementos empuje el ancho de
      la columna y genere scroll horizontal.
    -->
    <div class="flex flex-col gap-6 lg:flex-row">
      <ArbolCategorias
        :arbol="arbolFiltrado"
        :seleccionada-id="seleccionadaId"
        :expandidas="expandidas"
        :busqueda="busquedaArbol"
        :cargando="cargando"
        class="min-w-0 lg:w-80 lg:shrink-0"
        @seleccionar="seleccionar"
        @alternar="alternarExpandida"
        @buscar="buscarEnArbol"
      />

      <PanelDetalleCategoria
        v-model:seleccion="seleccion"
        :detalle="detalle"
        :elementos="elementosFiltrados"
        :filtros="filtrosElementos"
        :total-elementos="totalElementos"
        :cargando="cargandoDetalle"
        class="min-w-0 flex-1"
        @editar="(id) => irA(`/admin/catalogo/categorias/${id}/editar`)"
        @menu="pedirDesactivar"
        @menu-elemento="pedirDesactivar"
        @ordenar="ordenarElementosPor"
        @buscar="(t) => aplicarFiltroElementos({ busqueda: t })"
        @filtrar-tipo="onFiltrarTipo"
      />
    </div>

    <BarraAccionesMasivas
      :cantidad="seleccion.length"
      @limpiar="seleccion = []"
      @activar-lote="seleccion = []"
      @desactivar-lote="seleccion = []"
      @exportar-lote="seleccion = []"
    />
  </div>

  <!-- ADMIN 12 - Modal desactivar categoría/subcategoría -->
  <div
    v-if="impactoDesactivar"
    class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-black/40 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="titulo-desactivar-categoria"
    @click.self="cancelarDesactivar"
  >
    <div class="w-full max-w-lg rounded-card bg-neutral-white shadow-xl">
      <div class="flex items-start gap-3 p-5">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-highlight/15 text-highlight">
          <AlertTriangle class="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="titulo-desactivar-categoria" class="text-base font-semibold text-neutral-black">
            ¿Desactivar {{ impactoDesactivar.tipo === 'subcategoria' ? 'subcategoría' : 'categoría' }}?
          </h2>
          <p class="mt-1 text-sm text-neutral-medium">
            Estás a punto de desactivar el siguiente elemento:
          </p>
        </div>
        <button
          type="button"
          class="ml-auto grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-lightest"
          aria-label="Cerrar"
          @click="cancelarDesactivar"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div class="space-y-4 px-5">
        <div class="flex items-center gap-3 rounded-card border border-neutral-light bg-neutral-lightest p-3">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-card bg-subaction text-corporate">
            <Layers class="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p class="flex items-center gap-2 font-medium text-neutral-black">
              {{ impactoDesactivar.nombre }}
              <span class="rounded-button bg-neutral-light px-1.5 py-0.5 text-[11px] font-medium text-neutral-medium">
                {{ impactoDesactivar.tipo === 'subcategoria' ? 'Subcategoría' : 'Categoría' }}
              </span>
            </p>
            <p class="text-xs text-neutral-medium">{{ impactoDesactivar.ruta }}</p>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-card border border-neutral-light p-3">
            <p class="text-xl font-bold text-neutral-black tabular-nums">
              {{ formatearNumero(impactoDesactivar.productosAfectados) }}
            </p>
            <p class="text-xs text-neutral-medium">
              Productos afectados. Dejarán de mostrarse en el catálogo público si no tienen otra
              categoría activa.
            </p>
          </div>
          <div class="rounded-card border border-neutral-light p-3">
            <p class="text-xl font-bold text-neutral-black tabular-nums">
              {{ impactoDesactivar.subcategoriasAfectadas }}
            </p>
            <p class="text-xs text-neutral-medium">
              Subcategorías afectadas por la baja en cascada.
            </p>
          </div>
        </div>

        <p class="flex items-start gap-2 rounded-card bg-highlight/10 px-3 py-2 text-xs text-neutral-dark">
          <Info class="mt-0.5 h-3.5 w-3.5 shrink-0 text-highlight" aria-hidden="true" />
          Los productos que no tengan otra categoría activa dejarán de aparecer en el catálogo
          público de Pintu Clic, pero conservarán su información, historial de ventas y registros.
        </p>

        <label class="flex items-start gap-2 text-sm text-neutral-dark">
          <input v-model="entiendoImpacto" type="checkbox" class="mt-0.5 accent-action" />
          Entiendo el impacto de esta acción y deseo continuar.
        </label>
      </div>

      <div class="flex flex-wrap justify-end gap-3 p-5">
        <Button variant="text" :disabled="desactivando" @click="cancelarDesactivar">
          Cancelar
        </Button>
        <Button variant="outline" :icon="Eye" @click="verProductosAfectados">
          Ver productos afectados
        </Button>
        <Button variant="corporate" :icon="Power" :disabled="!entiendoImpacto || desactivando" @click="onConfirmarDesactivar">
          Desactivar
        </Button>
      </div>
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
import { onUnmounted, ref } from 'vue';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { Plus, AlertTriangle, Info, X, Layers, Eye, Power } from 'lucide-vue-next';
import { Button, PageHeader } from '@/core/components';
import ArbolCategorias from '../components/ArbolCategorias.vue';
import PanelDetalleCategoria from '../components/PanelDetalleCategoria.vue';
import BarraAccionesMasivas from '../components/BarraAccionesMasivas.vue';
import { useCategorias } from '../composables/useCategorias';
import { useProductosStore } from '../store/productos.store';
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
  impactoDesactivar,
  desactivando,
  seleccionar,
  alternarExpandida,
  buscarEnArbol,
  aplicarFiltroElementos,
  ordenarElementosPor,
  pedirDesactivar,
  cancelarDesactivar,
  confirmarDesactivar,
  formatearNumero,
} = useCategorias();

const entiendoImpacto = ref(false);

/**
 * Selección de la tabla de elementos para las acciones masivas. Ninguna de
 * ellas tiene endpoint por lotes en la API real (y categorías tampoco tiene
 * ruta de exportación propia): todas se limitan a limpiar la selección en vez
 * de simular un resultado inexistente.
 */
const seleccion = ref<string[]>([]);

function onFiltrarTipo(valor: string): void {
  const tipo = valor === '' ? null : (valor as TipoNodoCategoria);
  aplicarFiltroElementos({ tipo });
}

// Store de productos: solo para preseleccionar el filtro por categoría antes
// de navegar (el listado real vive en VistaProductos / useProductos).
const productosStore = useProductosStore();

/** «Ver productos afectados»: filtra el listado por la categoría y cierra el modal (el store no se resetea solo al navegar). */
function verProductosAfectados(): void {
  if (impactoDesactivar.value) {
    void productosStore.aplicarFiltros({ categoriaId: impactoDesactivar.value.id });
  }
  cancelarDesactivar();
  entiendoImpacto.value = false;
  irA('/admin/catalogo/productos');
}

async function onConfirmarDesactivar(): Promise<void> {
  const ok = await confirmarDesactivar();
  if (ok) entiendoImpacto.value = false;
}

const { irA } = usePanelNavegacion();

// El modal de desactivar vive en el store (Pinia, no se resetea al desmontar
// la vista): si el usuario sale por cualquier otro camino con el modal
// abierto, lo cerramos para no encontrarlo reaparecido al volver.
onUnmounted(() => {
  cancelarDesactivar();
});
</script>
