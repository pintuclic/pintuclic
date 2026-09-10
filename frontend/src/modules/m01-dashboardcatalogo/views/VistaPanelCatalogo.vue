<template>
  <component :is="COMPONENTES[vistaActiva]" :key="claveInstancia" v-bind="propsVista" />
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - SHELL DEL PANEL DE CATÁLOGO (alternativa sin router)
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaPanelCatalogo.vue
 *
 * La app ya monta `vue-router` y `dashboardCatalogoRoutes` registra una URL por
 * vista, así que este shell no está en uso. Se conserva como opción para montar
 * el panel de forma autocontenida (una sola ruta) sin depender del router:
 * mantiene la vista activa y la cambia con `<component :is>` cuando alguien
 * llama a `irA()` (provisto por `usePanelNavegacion`).
 * ==============================================================================
 */
import { computed, provide, ref } from 'vue';
import type { Component } from 'vue';
import VistaDashboardCatalogo from './VistaDashboardCatalogo.vue';
import VistaProductos from './VistaProductos.vue';
import VistaProductoFormulario from './VistaProductoFormulario.vue';
import VistaProductoDetalle from './VistaProductoDetalle.vue';
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
  'producto-detalle': VistaProductoDetalle,
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
  vistaActiva.value === 'producto-formulario' || vistaActiva.value === 'producto-detalle'
    ? { productoId: parametro.value ?? undefined }
    : {}
);
</script>
