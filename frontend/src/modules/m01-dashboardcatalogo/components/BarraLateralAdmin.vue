<template>
  <!-- Backdrop (solo móvil/tablet, cuando el panel está abierto) -->
  <transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-active-class="transition-opacity duration-200"
    leave-to-class="opacity-0"
  >
    <div
      v-if="abierto"
      class="fixed inset-0 z-30 bg-neutral-black/50 lg:hidden"
      aria-hidden="true"
      @click="cerrar"
    />
  </transition>

  <aside
    class="fixed inset-y-0 left-0 z-40 flex h-screen w-72 max-w-[85vw] shrink-0 flex-col overflow-y-auto border-r border-neutral-light bg-neutral-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:w-60 lg:max-w-none lg:translate-x-0 lg:transition-none"
    :class="abierto ? 'translate-x-0 shadow-2xl' : '-translate-x-full'"
    aria-label="Navegación del panel de catálogo"
  >
    <div class="flex h-20 items-center justify-between px-6">
      <img src="@/assets/logo.png" alt="Pintu Clic" class="h-9 object-contain" />
      <button
        type="button"
        class="-mr-2 rounded-button p-2 text-neutral-medium hover:bg-neutral-lightest lg:hidden"
        aria-label="Cerrar menú"
        @click="cerrar"
      >
        <X class="h-5 w-5" aria-hidden="true" />
      </button>
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
        @click="onNavegar(item.destino)"
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
import { onMounted, onUnmounted } from 'vue';
import {
  LayoutDashboard,
  Package,
  Layers,
  LayoutGrid,
  Tag,
  Rows3,
  Droplet,
  Search,
  BarChart3,
  Settings,
  X,
} from 'lucide-vue-next';
import type { Component } from 'vue';
import { useMenuMovil } from '../composables/useMenuMovil';

/**
 * Chrome de navegación del panel administrativo de catálogo.
 *
 * En escritorio (lg+) es una barra lateral fija. En móvil/tablet se comporta
 * como un panel deslizable (off-canvas) controlado por `useMenuMovil`: el botón
 * hamburguesa de la barra superior lo abre y el backdrop, la «X», la tecla Esc
 * o navegar lo cierran.
 *
 * TODO (arquitectura): cuando exista `core/layouts/DisenoAdmin.vue` compartido
 * entre M01 y M02, extraer esta barra y la superior a ese layout. Por ahora
 * vive en el módulo para que la vista del dashboard sea autocontenida.
 */
withDefaults(
  defineProps<{ itemActivo?: string }>(),
  { itemActivo: 'dashboard' }
);

const emit = defineEmits<{ (e: 'navegar', destino: string): void }>();

const { abierto, cerrar } = useMenuMovil();

function onNavegar(destino: string): void {
  cerrar();
  emit('navegar', destino);
}

function onEsc(evento: KeyboardEvent): void {
  if (evento.key === 'Escape') cerrar();
}

onMounted(() => {
  // Empezar siempre cerrado para que el panel no aparezca abierto tras navegar.
  cerrar();
  globalThis.addEventListener?.('keydown', onEsc);
});

onUnmounted(() => {
  globalThis.removeEventListener?.('keydown', onEsc);
});

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
  { clave: 'lineas', etiqueta: 'Líneas', destino: '/admin/catalogo/lineas', icono: Rows3 },
  { clave: 'colores', etiqueta: 'Colores', destino: '/admin/catalogo/colores', icono: Droplet },
  { clave: 'busquedas', etiqueta: 'Búsquedas', destino: '/admin/catalogo/busquedas-sin-resultado', icono: Search },
  { clave: 'reportes', etiqueta: 'Reportes', destino: '/admin/catalogo/reportes', icono: BarChart3 },
  { clave: 'configuracion', etiqueta: 'Configuración', destino: '/admin/catalogo/configuracion', icono: Settings },
];
</script>
