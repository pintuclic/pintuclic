<template>
  <aside
    class="flex w-60 shrink-0 flex-col border-r border-neutral-light bg-neutral-white"
    aria-label="Navegación del panel de catálogo"
  >
    <div class="flex h-20 items-center px-6">
      <img src="@/assets/logo.png" alt="Pintu Clic" class="h-9 object-contain" />
    </div>

    <nav class="flex-1 space-y-1 px-3 py-4">
      <button
        v-for="item in ITEMS"
        :key="item.clave"
        type="button"
        class="flex w-full items-center gap-3 rounded-button px-3 py-2.5 text-sm font-medium transition-colors"
        :class="
          item.clave === itemActivo
            ? 'bg-action text-neutral-white'
            : 'text-neutral-dark hover:bg-neutral-lightest'
        "
        :aria-current="item.clave === itemActivo ? 'page' : undefined"
        @click="$emit('navegar', item.destino)"
      >
        <component :is="item.icono" class="h-5 w-5 shrink-0" aria-hidden="true" />
        {{ item.etiqueta }}
      </button>
    </nav>

    <div class="border-t border-neutral-light p-4">
      <div class="rounded-card bg-subaction p-4">
        <p class="text-sm font-semibold text-corporate">Hacemos crecer tu negocio</p>
        <p class="mt-1 text-xs text-neutral-medium">Más colores. Más proyectos. Más Colombia.</p>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  LayoutDashboard,
  Package,
  Layers,
  LayoutGrid,
  Tag,
  Droplet,
  Search,
  BarChart3,
  Settings,
} from 'lucide-vue-next';
import type { Component } from 'vue';

/**
 * Chrome de navegación del panel administrativo de catálogo.
 *
 * TODO (arquitectura): cuando exista `core/layouts/DisenoAdmin.vue` compartido
 * entre M01 y M02, extraer esta barra y la superior a ese layout. Por ahora
 * vive en el módulo para que la vista del dashboard sea autocontenida.
 */
withDefaults(
  defineProps<{ itemActivo?: string }>(),
  { itemActivo: 'dashboard' }
);

defineEmits<{ (e: 'navegar', destino: string): void }>();

interface ItemNav {
  clave: string;
  etiqueta: string;
  destino: string;
  icono: Component;
}

const ITEMS: ItemNav[] = [
  { clave: 'dashboard', etiqueta: 'Dashboard', destino: '/admin/catalogo', icono: LayoutDashboard },
  { clave: 'productos', etiqueta: 'Productos', destino: '/admin/catalogo/productos', icono: Package },
  { clave: 'variantes', etiqueta: 'Variantes', destino: '/admin/catalogo/variantes', icono: Layers },
  { clave: 'categorias', etiqueta: 'Categorías', destino: '/admin/catalogo/categorias', icono: LayoutGrid },
  { clave: 'marcas', etiqueta: 'Marcas', destino: '/admin/catalogo/marcas', icono: Tag },
  { clave: 'colores', etiqueta: 'Colores', destino: '/admin/catalogo/colores', icono: Droplet },
  { clave: 'busquedas', etiqueta: 'Búsquedas', destino: '/admin/catalogo/busquedas-sin-resultado', icono: Search },
  { clave: 'reportes', etiqueta: 'Reportes', destino: '/admin/catalogo/reportes', icono: BarChart3 },
  { clave: 'configuracion', etiqueta: 'Configuración', destino: '/admin/catalogo/configuracion', icono: Settings },
];
</script>
