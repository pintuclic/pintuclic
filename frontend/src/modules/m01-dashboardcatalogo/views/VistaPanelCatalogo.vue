<template>
  <component :is="COMPONENTES[vistaActiva]" :key="claveInstancia" v-bind="propsVista" />
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - SHELL DEL PANEL DE CATÁLOGO
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaPanelCatalogo.vue
 *
 * Punto de entrada del panel mientras no exista `vue-router` montado. Mantiene
 * la vista activa y la cambia con `<component :is>` cuando cualquier vista/
 * componente llama a `irA()` (provisto por `usePanelNavegacion`).
 *
 * Al integrar el router: registrar `dashboardCatalogoRoutes` y usar este archivo
 * solo como referencia, o dejarlo como layout que renderiza `<router-view>`.
 * ==============================================================================
 */
import { computed, provide, ref } from 'vue';
import type { Component } from 'vue';
import VistaDashboardCatalogo from './VistaDashboardCatalogo.vue';
import VistaProductos from './VistaProductos.vue';
import VistaProductoFormulario from './VistaProductoFormulario.vue';
import VistaVariantes from './VistaVariantes.vue';
import VistaCategorias from './VistaCategorias.vue';
import VistaMarcas from './VistaMarcas.vue';
import VistaColores from './VistaColores.vue';
import VistaBusquedas from './VistaBusquedas.vue';
import {
  NAV_PANEL_CATALOGO,
  resolverRutaPanel,
} from '../composables/usePanelNavegacion';
import type { ClaveVistaPanel } from '../composables/usePanelNavegacion';

const COMPONENTES: Record<ClaveVistaPanel, Component> = {
  dashboard: VistaDashboardCatalogo,
  productos: VistaProductos,
  'producto-formulario': VistaProductoFormulario,
  variantes: VistaVariantes,
  categorias: VistaCategorias,
  marcas: VistaMarcas,
  colores: VistaColores,
  busquedas: VistaBusquedas,
};

const vistaActiva = ref<ClaveVistaPanel>('dashboard');
const parametro = ref<string | null>(null);

function irA(destino: string): void {
  const { clave, parametro: p } = resolverRutaPanel(destino);
  if (!clave) return;
  vistaActiva.value = clave;
  parametro.value = p;
  globalThis.scrollTo?.({ top: 0 });
}

provide(NAV_PANEL_CATALOGO, { vistaActiva, parametro, irA });

// `:key` fuerza el remonte al cambiar de vista o de parámetro (recarga datos).
const claveInstancia = computed(() => `${vistaActiva.value}:${parametro.value ?? ''}`);

const propsVista = computed<Record<string, unknown>>(() =>
  vistaActiva.value === 'producto-formulario'
    ? { productoId: parametro.value ?? undefined }
    : {}
);
</script>
