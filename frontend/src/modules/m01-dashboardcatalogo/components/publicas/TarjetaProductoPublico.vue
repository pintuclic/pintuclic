<template>
  <article
    class="min-w-0 rounded-card border border-neutral-light bg-neutral-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-4"
    :class="modo === 'lista' ? 'sm:grid sm:grid-cols-[180px_1fr] sm:gap-4' : 'flex flex-col'"
  >
    <div
      class="relative grid place-items-center overflow-hidden rounded-card bg-neutral-lightest p-5"
      :class="modo === 'lista' ? 'aspect-square sm:aspect-auto sm:min-h-48' : 'aspect-square'"
    >
      <span
        v-if="tieneDescuentoVisual"
        class="absolute left-2 top-2 rounded-button bg-highlight px-2 py-1 text-[10px] font-bold text-corporate"
      >
        DESTACADO
      </span>
      <img
        v-if="imagenVisible"
        :src="imagenVisible"
        :alt="producto.nombre"
        class="h-full w-full object-contain"
        loading="lazy"
        @error="imagenConError = true"
      />
      <PackageOpen v-else :size="54" class="text-neutral-light" aria-hidden="true" />
      <span
        v-if="muestraColor"
        class="absolute bottom-2 right-2 h-8 w-8 rounded-full border-4 border-neutral-white shadow-md"
        :style="{ backgroundColor: muestraColor }"
        aria-hidden="true"
      />
    </div>

    <div class="flex flex-1 flex-col pt-3">
      <h3 class="font-title line-clamp-2 text-sm font-semibold text-neutral-black transition-colors hover:text-action sm:text-base">
        {{ producto.nombre }}
      </h3>
      <p class="mt-1 text-xs font-medium text-neutral-medium">Marca asociada</p>
      <p class="font-sans mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-neutral-medium">
        {{ producto.detalle?.descripcion || descripcionClaseColor }}
      </p>
      <p class="font-title mt-2 text-lg font-bold text-corporate sm:text-xl">
        {{ precioMinimo === null ? 'Consultar precio' : formatearPrecio(precioMinimo) }}
      </p>

      <div class="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <Button
          variant="outline"
          size="sm"
          custom-class="w-full text-xs font-medium py-2.5 border-action text-action hover:bg-action hover:text-white"
          @click="emit('ver', producto.id_producto)"
        >
          Ver producto
        </Button>
        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded-lg bg-conversion text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-conversion-hover hover:shadow-md active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conversion"
          aria-label="Agregar producto al carrito"
          @click="emit('agregar', producto.id_producto)"
        >
          <ShoppingCart :size="17" aria-hidden="true" />
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { PackageOpen, ShoppingCart } from 'lucide-vue-next';
import { Button } from '@/core/components';
import type { ProductoDestacadoPublico } from '../../interfaces/catalogo-publico.interface';
import { obtenerImagenPublicaRespaldo } from '../../assets/imagenes-catalogo';

const props = withDefaults(
  defineProps<{
    producto: ProductoDestacadoPublico;
    destacado?: boolean;
    modo?: 'grid' | 'lista';
    muestraColor?: string | null;
  }>(),
  { modo: 'grid', muestraColor: null }
);
const emit = defineEmits<{ ver: [idProducto: number]; agregar: [idProducto: number] }>();
const imagenConError = ref(false);

const imagenVisible = computed(() => {
  const imagenes = props.producto.detalle?.imagenes ?? [];
  const principal = imagenes.find((imagen) => imagen.es_principal) ?? imagenes[0];
  if (principal?.contenido_url && !imagenConError.value) return principal.contenido_url;
  return obtenerImagenPublicaRespaldo(props.producto.id_producto);
});

const precioMinimo = computed(() => {
  const precios = (props.producto.detalle?.variantes ?? [])
    .map((variante) => variante.precio_vigente)
    .filter((precio) => Number.isFinite(precio));
  return precios.length ? Math.min(...precios) : null;
});

const descripcionClaseColor = computed(() => {
  if (props.producto.clase_color === 'entonable') return 'Disponible en múltiples colores y presentaciones.';
  if (props.producto.clase_color === 'colores_fijos') return 'Consulta los colores y presentaciones disponibles.';
  return 'Producto de calidad para completar tu proyecto.';
});

const tieneDescuentoVisual = computed(() => props.destacado === true);

function formatearPrecio(precio: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(precio);
}
</script>
