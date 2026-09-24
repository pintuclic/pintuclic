<template>
  <div class="bg-neutral-lightest min-h-screen pb-12">
    <!-- Cabecera de la sección -->
    <div class="container mx-auto px-4 md:px-8 pt-6">
      <!-- Fondo con el token 'subaction', sin hexadecimales arbitrarios (infraestructura 4.2). -->
      <div
        class="relative h-32 md:h-40 overflow-hidden rounded-card shadow-sm border border-neutral-light bg-subaction flex items-center"
      >
        <div class="px-8 md:px-12">
          <h1 class="text-2xl md:text-3xl font-bold text-corporate mb-1.5">
            Mis Pedidos
          </h1>
          <p class="text-neutral-medium text-sm max-w-md">
            Consulta el estado de tus compras y abre cualquier pedido para ver su detalle.
          </p>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 md:px-8 mt-6">
      <!--
        La sección resuelve por sí misma el maestro-detalle: al pulsar «Ver detalle»
        la lista se estrecha a la izquierda y el seguimiento aparece a la derecha,
        sin cambiar de pantalla.
      -->
      <SeccionMisPedidos
        :con-buscador="true"
        :con-grupos="true"
        :por-pagina="5"
        :codigo-inicial="codigo"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import SeccionMisPedidos from '../components/SeccionMisPedidos.vue';

/**
 * Vista de la sección de pedidos del cliente.
 *
 * Deliberadamente autónoma: no depende de ningún componente de otro módulo, para
 * que M08 pueda entregarse por separado. Cuando M04 llegue a `develop`, esta vista
 * puede incorporar su barra lateral de perfil (`PerfilSidebarNav`) y el perfil
 * puede incrustar `SeccionMisPedidos` — ver el documento de separación.
 *
 * `codigo` llega desde enlaces directos del tipo /pedidos/ORD-2026-0001 y abre ese
 * pedido de entrada; a partir de ahí la navegación ocurre dentro de la sección.
 */
withDefaults(defineProps<{ codigo?: string }>(), { codigo: '' });
</script>
