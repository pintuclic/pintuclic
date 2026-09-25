<template>
  <main class="bg-neutral-lightest text-neutral-dark font-sans">
    <section class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-button border border-action px-3 py-2 text-xs font-semibold text-action transition-colors hover:bg-subaction focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
        @click="volverProducto"
      >
        <ArrowLeft :size="15" /> Volver al producto
      </button>

      <div v-if="cargando" class="mt-6 h-[520px] animate-pulse rounded-card bg-neutral-white" />
      <div v-else-if="error || !producto" class="mt-6 rounded-card border border-neutral-light bg-neutral-white p-12 text-center shadow-sm">
        <CircleAlert :size="36" class="mx-auto text-highlight" />
        <h1 class="font-title mt-3 text-xl font-bold text-corporate">Calculadora no disponible</h1>
        <p class="mt-2 text-sm text-neutral-medium">{{ error ?? 'No pudimos cargar el producto seleccionado.' }}</p>
        <router-link to="/catalogo" class="mt-5 inline-flex min-h-11 items-center rounded-button bg-action px-5 text-sm font-medium text-white shadow-sm transition-all hover:bg-action-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action">
          Volver al catálogo
        </router-link>
      </div>

      <CalculadoraPinturaContenido
        v-else
        class="mt-6"
        :producto="producto"
        @ver-producto="volverProducto"
        @agregar="mostrarMensaje('Agregar al carrito requiere la integración con M07.')"
      />

      <div v-if="mensaje" class="fixed bottom-5 left-1/2 z-40 flex w-[min(92%,520px)] -translate-x-1/2 justify-between rounded-card bg-subaction px-4 py-3 text-sm text-corporate shadow-lg" role="status">
        <span>{{ mensaje }}</span>
        <button type="button" aria-label="Cerrar" @click="mensaje = null"><X :size="16" /></button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, CircleAlert, X } from 'lucide-vue-next';
import CalculadoraPinturaContenido from '../../components/publicas/CalculadoraPinturaContenido.vue';
import { useDetalleProductoPublico } from '../../composables/publicas/useDetalleProductoPublico';

const props = defineProps<{ productoId: string }>();
const router = useRouter();
const mensaje = ref<string | null>(null);
const idProducto = computed(() => Number(props.productoId));
const { cargando, error, producto } = useDetalleProductoPublico(toRef(idProducto));

function volverProducto(): void {
  void router.replace({
    name: 'DetalleProductoPublico',
    params: { productoId: props.productoId },
  });
}

function mostrarMensaje(texto: string): void {
  mensaje.value = texto;
}
</script>
