<template>
  <header
    class="flex h-20 items-center gap-3 border-b border-neutral-light bg-neutral-white px-4 sm:gap-4 sm:px-6"
  >
    <!-- Botón menú (móvil / tablet) -->
    <button
      type="button"
      class="-ml-1 shrink-0 rounded-button p-2 text-neutral-dark hover:bg-neutral-lightest lg:hidden"
      aria-label="Abrir menú"
      @click="alternar"
    >
      <Menu class="h-6 w-6" aria-hidden="true" />
    </button>

    <!-- Migas -->
    <nav class="hidden items-center gap-2 text-sm text-neutral-medium md:flex" aria-label="Ruta">
      <span>Admin</span>
      <ChevronRight class="h-4 w-4" aria-hidden="true" />
      <span class="font-medium text-neutral-dark">{{ seccion }}</span>
    </nav>

    <!-- Buscador -->
    <div class="relative flex-1 md:max-w-md">
      <Search
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-medium"
        aria-hidden="true"
      />
      <input
        type="search"
        :value="terminoBusqueda"
        placeholder="Buscar productos, marcas, categorías o pedidos…"
        class="w-full rounded-input border border-neutral-light bg-neutral-lightest py-2 pl-9 pr-3 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
        @input="$emit('update:terminoBusqueda', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Acciones -->
    <div class="ml-auto flex items-center gap-4">
      <button
        type="button"
        class="relative rounded-full p-2 text-neutral-medium hover:bg-neutral-lightest"
        aria-label="Notificaciones"
        @click="$emit('abrirNotificaciones')"
      >
        <Bell class="h-5 w-5" aria-hidden="true" />
        <span
          v-if="notificaciones > 0"
          class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-action px-1 text-[10px] font-bold text-neutral-white"
        >
          {{ notificaciones > 9 ? '9+' : notificaciones }}
        </span>
      </button>

      <div class="h-8 w-px bg-neutral-light" aria-hidden="true" />

      <button
        type="button"
        class="flex items-center gap-3 rounded-button px-1.5 py-1 hover:bg-neutral-lightest"
        @click="$emit('abrirPerfil')"
      >
        <span
          class="flex h-9 w-9 items-center justify-center rounded-full bg-corporate text-sm font-semibold text-neutral-white"
        >
          {{ iniciales }}
        </span>
        <span class="hidden text-left leading-tight sm:block">
          <span class="block text-sm font-medium text-neutral-black">{{ nombreUsuario }}</span>
          <span class="block text-xs text-neutral-medium">{{ rolUsuario }}</span>
        </span>
        <ChevronDown class="hidden h-4 w-4 text-neutral-medium sm:block" aria-hidden="true" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ChevronRight, ChevronDown, Search, Bell, Menu } from 'lucide-vue-next';
import { useMenuMovil } from '../composables/useMenuMovil';

const { alternar } = useMenuMovil();

const props = withDefaults(
  defineProps<{
    seccion?: string;
    nombreUsuario?: string;
    rolUsuario?: string;
    notificaciones?: number;
    terminoBusqueda?: string;
  }>(),
  {
    seccion: 'Dashboard',
    nombreUsuario: 'Administrador',
    rolUsuario: 'Administrador',
    notificaciones: 0,
    terminoBusqueda: '',
  }
);

defineEmits<{
  (e: 'update:terminoBusqueda', valor: string): void;
  (e: 'abrirNotificaciones'): void;
  (e: 'abrirPerfil'): void;
}>();

const iniciales = computed(() =>
  props.nombreUsuario
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('')
);
</script>
