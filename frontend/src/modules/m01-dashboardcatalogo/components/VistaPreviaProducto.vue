<template>
  <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
    <header class="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-black">
      <Eye class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
      Vista previa del producto
    </header>

    <div class="overflow-hidden rounded-card border border-neutral-light">
      <div class="flex aspect-video items-center justify-center bg-neutral-lightest">
        <img
          v-if="imagenPrincipal?.url"
          :src="imagenPrincipal.url"
          :alt="formulario.nombre || 'Producto'"
          class="h-full w-full object-cover"
        />
        <ImageIcon v-else class="h-8 w-8 text-neutral-light" aria-hidden="true" />
      </div>

      <div class="space-y-2 p-4">
        <p class="font-semibold text-neutral-black">
          {{ formulario.nombre || 'Nombre del producto' }}
        </p>

        <p class="text-lg font-bold text-corporate">
          {{ precioFormateado }}
        </p>

        <div class="flex flex-wrap items-center gap-2">
          <BadgeEstadoProducto :estado="formulario.estado" />
          <span
            class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
            :class="hayStock ? 'bg-conversion/10 text-conversion' : 'bg-neutral-light text-neutral-medium'"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {{ hayStock ? 'Stock disponible' : 'Sin stock' }}
          </span>
        </div>

        <dl v-if="color" class="flex items-center gap-2 pt-1 text-xs text-neutral-medium">
          <dt>Color:</dt>
          <dd class="flex items-center gap-1.5 text-neutral-dark">
            <!-- El hex proviene del valor CIELAB del color (dato de catálogo, no token de UI). -->
            <span
              class="h-3.5 w-3.5 rounded-full border border-neutral-light"
              :style="{ backgroundColor: color.hex }"
              aria-hidden="true"
            />
            {{ color.nombre }}<template v-if="color.codigo"> · {{ color.codigo }}</template>
          </dd>
        </dl>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Eye, Image as ImageIcon } from 'lucide-vue-next';
import BadgeEstadoProducto from './BadgeEstadoProducto.vue';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
import type { ColorCatalogo, FormularioProducto } from '../interfaces';

const props = defineProps<{
  formulario: FormularioProducto;
  color: ColorCatalogo | null;
}>();

const { formatearNumero } = useFormatoCatalogo();

const imagenPrincipal = computed(
  () => props.formulario.imagenes.find((img) => img.esPrincipal) ?? props.formulario.imagenes[0] ?? null
);

const hayStock = computed(
  () => props.formulario.stockInicial !== null && props.formulario.stockInicial > 0
);

const precioFormateado = computed(() => {
  const precio = props.formulario.precioVenta;
  return precio && precio > 0 ? `$${formatearNumero(precio)} COP` : 'Precio por definir';
});
</script>
