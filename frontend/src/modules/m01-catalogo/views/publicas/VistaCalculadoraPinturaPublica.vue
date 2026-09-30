<template>
  <main class="bg-neutral-lightest text-neutral-dark font-sans">
    <section class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <button
        type="button"
        class="mb-5 inline-flex min-h-11 items-center gap-2 rounded-button border border-action bg-neutral-white px-4 text-sm font-semibold text-action transition-colors hover:bg-subaction focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
        @click="irAnterior"
      >
        <ArrowLeft :size="17" aria-hidden="true" /> Anterior
      </button>
      <CalculadoraPinturaContenido @ver-productos="irCatalogo" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from 'lucide-vue-next';
import CalculadoraPinturaContenido from '../../components/publicas/CalculadoraPinturaContenido.vue';

const router = useRouter();
const route = useRoute();

function irAnterior(): void {
  const destino = route.query.volver;
  void router.push(typeof destino === 'string' && (destino === '/' || destino.startsWith('/catalogo')) ? destino : '/catalogo');
}

function irCatalogo(): void {
  void router.push({ name: 'CatalogoPublico' });
}
</script>
