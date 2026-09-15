<template>
  <div class="flex h-screen overflow-hidden bg-neutral-lightest">
    <BarraLateralAdmin />

    <div class="flex h-screen min-w-0 flex-1 flex-col">
      <BarraSuperiorAdmin
        v-model:termino-busqueda="busquedaGlobal"
        :seccion="seccion"
        nombre-usuario="Carlos Álvarez"
        rol-usuario="Administrador"
        :notificaciones="3"
      />

      <main class="flex-1 overflow-auto overscroll-contain bg-neutral-lightest">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * DISEÑO DEL PANEL ADMINISTRATIVO (layout compartido)
 * Ubicación: src/core/layouts/DisenoAdmin.vue
 *
 * Envuelve cualquier vista de `/admin/**`: barra lateral + barra superior +
 * contenido, siguiendo el mismo patrón que `DisenoTienda.vue` (slot, no
 * `<router-view>` — cada vista se monta directamente en su ruta y se envuelve
 * a sí misma con `<DisenoAdmin>...</DisenoAdmin>`).
 *
 * `seccion` (para la miga de la barra superior) se deriva de `route.meta.titulo`,
 * que cada ruta de `dashboard-catalogo.routes.ts` ya declara.
 * ==============================================================================
 */
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import BarraLateralAdmin from './BarraLateralAdmin.vue';
import BarraSuperiorAdmin from './BarraSuperiorAdmin.vue';

const route = useRoute();
const seccion = computed(() => (route.meta.titulo as string | undefined) ?? 'Panel');

const busquedaGlobal = ref('');

/**
 * Este layout es un "app shell" de altura fija (h-screen) con su propio
 * scroll interno en <main>. En algunos navegadores el documento igual queda
 * scrolleable (una segunda barra de scroll fantasma, sin contenido real
 * detrás) porque <body> no tiene overflow:hidden. Se activa solo mientras
 * una vista /admin está montada para no afectar el layout de la tienda
 * pública (DisenoTienda.vue), que sí depende del scroll normal del documento.
 */
onMounted(() => {
  document.documentElement.classList.add('overflow-hidden');
  document.body.classList.add('overflow-hidden');
});
onUnmounted(() => {
  document.documentElement.classList.remove('overflow-hidden');
  document.body.classList.remove('overflow-hidden');
});
</script>
