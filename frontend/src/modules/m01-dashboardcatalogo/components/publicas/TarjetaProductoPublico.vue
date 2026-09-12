<template>
  <article class="flex min-w-0 flex-col rounded-card border border-neutral-light bg-neutral-white p-3 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
    <div class="relative grid aspect-square place-items-center overflow-hidden rounded-card bg-neutral-lightest p-5">
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
    </div>

    <div class="flex flex-1 flex-col pt-3">
      <h3 class="line-clamp-2 text-sm font-bold text-neutral-black">{{ producto.nombre }}</h3>
      <p class="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-neutral-medium">
        {{ producto.detalle?.descripcion || descripcionClaseColor }}
      </p>
      <p class="mt-2 text-base font-extrabold text-corporate">
        {{ precioMinimo === null ? 'Consultar precio' : formatearPrecio(precioMinimo) }}
      </p>

      <div class="mt-3 grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          class="rounded-button border border-action px-3 py-2 text-xs font-semibold text-action transition-colors hover:bg-subaction focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
          @click="emit('ver', producto.id_producto)"
        >
          Ver producto
        </button>
        <button
          type="button"
          class="grid h-9 w-9 place-items-center rounded-button bg-conversion text-white transition-all hover:bg-conversion-hover active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conversion"
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
import type { ProductoDestacadoPublico } from '../../interfaces/catalogo-publico.interface';
import { obtenerImagenPublicaRespaldo } from '../../assets/imagenes-catalogo';

const props = defineProps<{ producto: ProductoDestacadoPublico; destacado?: boolean }>();
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
