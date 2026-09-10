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
            @menu="pedirDesactivar"
            @menu-elemento="pedirDesactivar"
            @ordenar="ordenarElementosPor"
            @buscar="(t) => aplicarFiltroElementos({ busqueda: t })"
            @filtrar-tipo="onFiltrarTipo"
          />
        </div>
      </main>
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
          <button
            type="button"
            class="rounded-button px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
            :disabled="desactivando"
            @click="cancelarDesactivar"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-button border border-neutral-light bg-neutral-white px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
            @click="irA('/admin/catalogo/productos')"
          >
            <Eye class="h-4 w-4" aria-hidden="true" />
            Ver productos afectados
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-button bg-corporate px-4 py-2 text-sm font-medium text-neutral-white hover:bg-corporate/90 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!entiendoImpacto || desactivando"
            @click="onConfirmarDesactivar"
          >
            <Power class="h-4 w-4" aria-hidden="true" />
            Desactivar
          </button>
        </div>
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
import { ref } from 'vue';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { Plus, AlertTriangle, Info, X, Layers, Eye, Power } from 'lucide-vue-next';
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

const busquedaGlobal = ref('');
const entiendoImpacto = ref(false);

function onFiltrarTipo(valor: string): void {
  const tipo = valor === '' ? null : (valor as TipoNodoCategoria);
  aplicarFiltroElementos({ tipo });
}

async function onConfirmarDesactivar(): Promise<void> {
  const ok = await confirmarDesactivar();
  if (ok) entiendoImpacto.value = false;
}

const { irA } = usePanelNavegacion();
</script>
