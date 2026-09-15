<template>
  <!-- Backdrop (solo móvil/tablet, cuando el panel está abierto) -->
  <div
    v-if="abierto"
    class="fixed inset-0 z-30 bg-neutral-dark/50 lg:hidden"
    aria-hidden="true"
    @click="cerrar"
  />

  <aside
    class="fixed inset-y-0 left-0 z-40 flex h-screen shrink-0 flex-col overflow-y-auto border-r border-subaction bg-neutral-white shadow-[4px_0_24px_rgba(8,119,232,0.05)] transition-all duration-300 lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 lg:transition-[width]"
    :class="[
      colapsado ? 'lg:w-20' : 'w-72 lg:w-60',
      abierto ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
    ]"
    aria-label="Navegación del panel administrativo"
  >
    <div
      class="flex h-20 shrink-0 items-center px-4 transition-all duration-300"
      :class="colapsado ? 'lg:justify-center' : 'justify-between'"
    >
      <router-link to="/admin/catalogo" class="flex h-full items-center justify-center">
        <img
          src="@/assets/logo.png"
          alt="Pintu Clic"
          class="object-contain transition-all duration-300"
          :class="colapsado ? 'lg:h-9 lg:w-9' : 'h-9'"
        />
      </router-link>
      <button
        type="button"
        class="hidden text-neutral-medium transition-colors hover:text-action lg:block"
        :aria-label="colapsado ? 'Expandir menú' : 'Colapsar menú'"
        @click="colapsado = !colapsado"
      >
        <ChevronLeft v-if="!colapsado" class="h-5 w-5" aria-hidden="true" />
        <ChevronRight v-else class="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="-mr-2 rounded-button p-2 text-neutral-medium hover:bg-neutral-lightest lg:hidden"
        aria-label="Cerrar menú"
        @click="cerrar"
      >
        <X class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>

    <nav class="custom-scrollbar flex-1 overflow-y-auto p-4">
      <!-- 1. GESTIÓN ADMINISTRATIVA -->
      <div class="mt-2 flex flex-col">
        <button
          type="button"
          class="group flex w-full items-center rounded-button transition-colors hover:bg-subaction hover:text-action"
          :class="[
            administrativoAbierto ? 'text-action' : 'text-corporate',
            colapsado ? 'justify-center p-3' : 'justify-between px-3 py-2.5',
          ]"
          title="Gestión Administrativa"
          @click="administrativoAbierto = !administrativoAbierto"
        >
          <div class="flex items-center gap-3 text-sm font-medium">
            <Shield class="h-5 w-5 shrink-0" aria-hidden="true" />
            <span v-show="!colapsado" class="whitespace-nowrap">Gestión Administrativa</span>
          </div>
          <ChevronDown
            v-show="!colapsado"
            class="h-4 w-4 transition-transform duration-200"
            :class="{ 'rotate-180': administrativoAbierto }"
            aria-hidden="true"
          />
        </button>

        <div
          v-show="administrativoAbierto && !colapsado"
          class="mb-2 ml-4 mt-1 flex flex-col gap-1 border-l border-subaction pl-4"
        >
          <router-link
            v-for="item in ENLACES_ADMINISTRATIVOS"
            :key="item.clave"
            :to="item.destino"
            class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium transition-colors"
            :class="claseEnlace(item.destino)"
          >
            <component :is="item.icono" class="h-4 w-4 shrink-0" aria-hidden="true" />
            {{ item.etiqueta }}
          </router-link>
        </div>
      </div>

      <!-- 2. GESTIÓN DE CATÁLOGO -->
      <div class="mt-2 flex flex-col">
        <button
          type="button"
          class="group flex w-full items-center rounded-button transition-colors hover:bg-subaction hover:text-action"
          :class="[
            catalogoAbierto ? 'text-action' : 'text-corporate',
            colapsado ? 'justify-center p-3' : 'justify-between px-3 py-2.5',
          ]"
          title="Gestión de Catálogo"
          @click="catalogoAbierto = !catalogoAbierto"
        >
          <div class="flex items-center gap-3 text-sm font-medium">
            <Package class="h-5 w-5 shrink-0" aria-hidden="true" />
            <span v-show="!colapsado" class="whitespace-nowrap">Gestión de Catálogo</span>
          </div>
          <ChevronDown
            v-show="!colapsado"
            class="h-4 w-4 transition-transform duration-200"
            :class="{ 'rotate-180': catalogoAbierto }"
            aria-hidden="true"
          />
        </button>

        <div
          v-show="catalogoAbierto && !colapsado"
          class="mb-2 ml-4 mt-1 flex flex-col gap-1 border-l border-subaction pl-4"
        >
          <router-link
            v-for="item in ENLACES_CATALOGO"
            :key="item.clave"
            :to="item.destino"
            class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium transition-colors"
            :class="claseEnlace(item.destino)"
          >
            <component :is="item.icono" class="h-4 w-4 shrink-0" aria-hidden="true" />
            {{ item.etiqueta }}
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Footer del sidebar -->
    <div class="border-t border-subaction p-4">
      <button
        type="button"
        class="flex cursor-pointer items-center justify-center gap-2 rounded-button bg-neutral-lightest py-2 font-medium text-red-500 transition-colors hover:bg-red-500 hover:text-neutral-white"
        :class="colapsado ? 'mx-auto h-12 w-12 rounded-full px-0' : 'w-full px-4'"
        title="Cerrar sesión"
        @click="cerrarSesion"
      >
        <LogOut class="h-5 w-5 shrink-0" aria-hidden="true" />
        <span v-show="!colapsado">Cerrar sesión</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * BARRA LATERAL DEL PANEL ADMINISTRATIVO (chrome compartido)
 * Ubicación: src/core/layouts/BarraLateralAdmin.vue
 *
 * Navegación agrupada y colapsable a solo íconos (escritorio) / panel
 * deslizable off-canvas (móvil, vía `useMenuMovil`). El estado activo se deriva
 * de la ruta actual con `useRoute()`, no de una prop — así queda sincronizada
 * con la URL real sin que cada vista tenga que indicarlo.
 *
 * «Gestión Administrativa» son enlaces de otros módulos (M04/M17) que aún no
 * tienen vista propia en este árbol de rutas: quedan visibles pero llevan a
 * páginas que todavía no existen.
 * ==============================================================================
 */
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Shield,
  Users,
  Key,
  Building,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  LogOut,
  X,
} from 'lucide-vue-next';
import type { Component } from 'vue';
import { useAuthStore } from '@/modules/m04-cuentas/store/auth.store';
import { useMenuMovil } from '../composables/useMenuMovil';

interface ItemNav {
  clave: string;
  etiqueta: string;
  destino: string;
  icono: Component;
}

const ENLACES_ADMINISTRATIVOS: ItemNav[] = [
  { clave: 'admin-dashboard', etiqueta: 'Dashboard', destino: '/admin', icono: LayoutDashboard },
  { clave: 'usuarios', etiqueta: 'Usuarios / Personal', destino: '/admin/usuarios', icono: Users },
  { clave: 'roles', etiqueta: 'Roles y Permisos', destino: '/admin/roles', icono: Key },
  { clave: 'solicitudes', etiqueta: 'Aprobación Empresas', destino: '/admin/solicitudes', icono: Building },
];

const ENLACES_CATALOGO: ItemNav[] = [
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

const route = useRoute();

/** Coincide de forma exacta o por prefijo (p. ej. `/productos` también activa `/productos/123/editar`). */
function esRutaActiva(ruta: string): boolean {
  if (ruta === '/admin' || ruta === '/admin/catalogo') return route.path === ruta;
  return route.path === ruta || route.path.startsWith(`${ruta}/`);
}

function claseEnlace(ruta: string): string {
  return esRutaActiva(ruta)
    ? 'text-neutral-white bg-action'
    : 'text-corporate hover:bg-subaction hover:text-action';
}

// Al entrar directo a una URL, abre el grupo que contiene la ruta activa.
const catalogoAbierto = ref(ENLACES_CATALOGO.some((item) => esRutaActiva(item.destino)));
const administrativoAbierto = ref(
  !catalogoAbierto.value && ENLACES_ADMINISTRATIVOS.some((item) => esRutaActiva(item.destino))
);

const colapsado = ref(false);

const { abierto, cerrar } = useMenuMovil();

const router = useRouter();
const authStore = useAuthStore();

function cerrarSesion(): void {
  authStore.logout();
  cerrar();
  void router.push('/');
}
</script>
