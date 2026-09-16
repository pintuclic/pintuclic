<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { RouterView, RouterLink, useRoute } from 'vue-router';
import { Button, Icon, Toast } from '@/core/components';
import { useM17 } from './store/useM17';
const { state, isAdmin, canAttend, refresh } = useM17();
const route = useRoute();
const allowed = computed(() => route.path === '/admin/perfil' ||
  (route.path.startsWith('/admin/clientes') ? canAttend.value : isAdmin.value));
let interval: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  void refresh();
  interval = setInterval(() => {
    if (document.visibilityState === 'visible') void refresh();
  }, 60000);
});
onBeforeUnmount(() => clearInterval(interval));
</script>
<template>
  <div>
    <div v-if="state.error" role="alert" class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-highlight/20 bg-neutral-white p-5">
      <p>{{ state.error }}</p><Button variant="outline" icon="refresh" :disabled="state.loading" @click="refresh">Volver a intentar</Button>
    </div>
    <p v-if="state.loading && !state.ready" role="status" class="py-24 text-center text-neutral-medium">Cargando tu espacio de administración…</p>
    <template v-else-if="state.ready">
      <RouterView v-if="allowed" v-slot="{ Component }"><component :is="Component" :key="route.path" /></RouterView>
      <div v-else class="rounded-xl bg-neutral-white p-10 text-center">
        <Icon name="lock" class="mx-auto mb-4 h-10 w-10 text-action" /><h1 class="font-title text-2xl font-bold text-corporate">Acceso denegado</h1>
        <p class="my-4 text-neutral-medium">Puedes continuar en una sección permitida.</p><RouterLink to="/admin/perfil" class="text-action">Ir a mi perfil</RouterLink>
      </div>
    </template>
    <div v-else-if="!state.loading" class="rounded-xl bg-neutral-white p-10 text-center">
      <h1 class="font-title text-2xl font-bold text-corporate">{{ state.session ? 'No se pudo cargar el panel' : 'Inicia sesión para continuar' }}</h1>
      <p class="mt-3 text-neutral-medium">{{ state.session ? 'Actualiza para volver a consultar tus accesos.' : 'Accede desde el inicio de sesión de Pintu Clic y vuelve a este panel.' }}</p>
      <RouterLink v-if="!state.session" to="/" class="mt-4 inline-block text-action">Ir al inicio</RouterLink>
    </div>
    <Toast :message="state.toast" @close="state.toast = ''" />
  </div>
</template>
