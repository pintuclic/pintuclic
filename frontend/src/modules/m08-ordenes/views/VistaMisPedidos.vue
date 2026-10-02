<template>
  <!--
    Dos pantallas en un mismo archivo, porque el Figma las trata como dos:

      · sin código  → «Mis pedidos»: el marco de Mi Perfil (encabezado, barra lateral
        y tarjeta de soporte) con el listado dentro.
      · con código  → «Seguimiento de Pedido»: pantalla propia, con su encabezado, su
        ruta de navegación y el detalle a todo el ancho, sin barra lateral.

    PerfilSidebarNav y TarjetaSoporte son de M04: se importan tal cual, no se
    modifican (Directiva 3).
  -->

  <!-- ==================== SEGUIMIENTO DE PEDIDO ==================== -->
  <div v-if="codigo" class="bg-neutral-lightest min-h-screen font-sans pb-12">
    <!--
      Mismo encabezado que «Mi Perfil»: azul claro con la ilustración a la derecha, para
      que las pantallas del cliente se vean de la misma familia. Añade la ruta de
      navegación, que es lo propio de esta pantalla.
    -->
    <div
      class="relative overflow-hidden mx-4 md:mx-8 mt-6 rounded-2xl shadow-sm border border-neutral-light bg-subaction flex justify-between min-h-40 md:min-h-44"
    >
      <div class="relative h-full flex flex-col justify-center px-8 md:px-12 py-7 z-10 w-full md:w-3/5">
        <nav
          class="flex items-center gap-2 text-xs text-neutral-medium mb-2.5"
          aria-label="Ruta de navegación"
        >
          <RouterLink to="/" class="hover:text-action transition-colors">Inicio</RouterLink>
          <ChevronRightIcon class="w-3 h-3" aria-hidden="true" />
          <RouterLink to="/pedidos" class="hover:text-action transition-colors">Mis Pedidos</RouterLink>
          <ChevronRightIcon class="w-3 h-3" aria-hidden="true" />
          <span class="text-corporate font-medium" aria-current="page">Seguimiento de Pedido</span>
        </nav>
        <h1 class="text-2xl md:text-3xl font-title font-bold text-corporate">
          Seguimiento de Pedido
        </h1>
        <p class="text-neutral-medium text-sm font-sans font-normal mt-1.5 max-w-md">
          Consulta en tiempo real el estado y detalles de tu compra.
        </p>
      </div>
      <div
        class="absolute inset-0 md:relative md:inset-auto md:w-2/5 h-full flex justify-end pointer-events-none"
      >
        <img
          src="@/assets/banner_perfil.png"
          alt=""
          aria-hidden="true"
          class="h-full w-auto object-contain object-right [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_30%)] [mask-image:linear-gradient(to_right,transparent_0%,black_30%)]"
        />
      </div>
    </div>

    <div class="container mx-auto px-4 md:px-8 mt-6">
      <RouterLink
        to="/pedidos"
        class="inline-flex items-center gap-2 rounded-button border border-neutral-light bg-white px-4 py-2 text-sm font-medium text-corporate transition-colors hover:border-action hover:text-action mb-5"
      >
        <ArrowLeftIcon class="w-4 h-4" />
        Anterior
      </RouterLink>

      <PanelSeguimiento :key="codigo" :codigo="codigo" />
    </div>
  </div>

  <!-- ==================== MIS PEDIDOS ==================== -->
  <div v-else class="bg-neutral-lightest min-h-screen font-sans pb-12">
    <div
      class="relative h-32 md:h-40 overflow-hidden mx-4 md:mx-8 mt-6 rounded-2xl shadow-sm border border-neutral-light bg-subaction flex justify-between"
    >
      <div class="relative h-full flex flex-col justify-center px-8 md:px-12 z-10 w-full md:w-1/2">
        <h1 class="text-2xl md:text-3xl font-title font-bold text-corporate mb-1.5">
          Mis Pedidos
        </h1>
        <p class="text-neutral-medium text-sm font-sans font-normal max-w-md">
          Consulte el estado de sus compras y abra cualquier pedido para ver su seguimiento.
        </p>
      </div>
      <div
        class="absolute inset-0 md:relative md:inset-auto md:w-1/2 h-full flex justify-end pointer-events-none"
      >
        <img
          src="@/assets/banner_perfil.png"
          alt=""
          aria-hidden="true"
          class="h-full w-auto object-contain object-right [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_30%)] [mask-image:linear-gradient(to_right,transparent_0%,black_30%)]"
        />
      </div>
    </div>

    <div
      class="container mx-auto px-4 md:px-8 mt-6 grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-6 items-start"
    >
      <aside class="order-1 lg:col-start-1 flex flex-col gap-6">
        <PerfilSidebarNav />
        <div class="hidden lg:block">
          <TarjetaSoporte />
        </div>
      </aside>

      <main class="order-2 lg:col-start-2 min-w-0 flex flex-col gap-6">
        <SeccionMisPedidos :titulo="true" :con-buscador="true" :con-grupos="true" :por-pagina="5" />
        <div class="block lg:hidden">
          <TarjetaSoporte />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { ArrowLeft as ArrowLeftIcon, ChevronRight as ChevronRightIcon } from 'lucide-vue-next';
import PerfilSidebarNav from '@/modules/m04-cuentas/components/perfil/PerfilSidebarNav.vue';
import TarjetaSoporte from '@/modules/m04-cuentas/components/perfil/TarjetaSoporte.vue';
import SeccionMisPedidos from '../components/SeccionMisPedidos.vue';
import PanelSeguimiento from '../components/PanelSeguimiento.vue';

/**
 * `codigo` llega de la ruta /pedidos/:codigo y decide cuál de las dos pantallas se
 * muestra. Vacío significa el listado.
 */
withDefaults(defineProps<{ codigo?: string }>(), { codigo: '' });
</script>
