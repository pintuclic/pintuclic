<template>
  <article
    class="group min-w-0 rounded-2xl border border-neutral-light bg-neutral-white p-3.5 sm:p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
    :class="modo === 'lista' ? 'sm:grid sm:grid-cols-[180px_1fr] sm:gap-4' : 'flex flex-col'"
  >
    <!-- Contenedor Imagen -->
    <div
      class="relative grid place-items-center overflow-hidden rounded-xl bg-neutral-lightest p-3 sm:p-3.5"
      :class="modo === 'lista' ? 'aspect-square sm:aspect-auto sm:min-h-48' : 'aspect-square'"
    >
      <img
        v-if="imagenVisible"
        :src="imagenVisible"
        :alt="producto.nombre"
        class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        @error="imagenConError = true"
      />
      <PackageOpen v-else :size="54" class="text-neutral-light" aria-hidden="true" />
      <span
        v-if="muestraColorEfectiva"
        class="absolute bottom-2.5 right-2.5 z-10 h-7 w-7 rounded-full border-2 border-neutral-white shadow-sm ring-1 ring-neutral-black/10 transition-transform duration-200 group-hover:scale-105"
        :style="{ backgroundColor: muestraColorEfectiva }"
        aria-hidden="true"
      />
    </div>

    <!-- Contenido -->
    <div class="flex flex-1 flex-col pt-3">
      <h3 class="font-title font-bold text-sm text-neutral-black line-clamp-1 hover:text-action transition-colors">
        {{ producto.nombre }}
      </h3>
      
      <p class="font-sans text-xs text-neutral-medium line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
        {{ producto.detalle?.descripcion || descripcionClaseColor }}
      </p>

      <!-- Fila de Precios -->
      <div class="mt-2.5 flex items-baseline gap-2 whitespace-nowrap">
        <span class="font-title text-base sm:text-[17px] font-bold text-neutral-black whitespace-nowrap">
          {{ precioMinimo === null ? 'Consultar precio' : formatearPrecioConSufijo(precioMinimo) }}
        </span>
      </div>

      <!-- Fila de Acciones -->
      <div class="mt-auto pt-3 grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          class="flex h-11 w-full items-center justify-center rounded-lg border border-action text-action hover:bg-action hover:text-white font-semibold text-xs px-2.5 transition-colors text-center cursor-pointer sm:h-9"
          @click="emit('ver', producto.id_producto)"
        >
          Ver producto
        </button>
        <button
          type="button"
          class="grid h-11 w-11 place-items-center rounded-lg bg-conversion-hover hover:bg-conversion-accent text-white shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 sm:h-9 sm:w-9"
          aria-label="Agregar producto al carrito"
          @click="emit('agregar', producto.id_producto)"
        >
          <ShoppingCart :size="20" class="sm:h-4 sm:w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { PackageOpen, ShoppingCart } from 'lucide-vue-next';
import { formatearPrecioConSufijo } from '@/core/utils/moneda';
import type { ProductoDestacadoPublico } from '../../interfaces/publicas/catalogo-publico.interface';

const props = withDefaults(
  defineProps<{
    producto: ProductoDestacadoPublico;
    modo?: 'grid' | 'lista';
    muestraColor?: string | null;
  }>(),
  { modo: 'grid', muestraColor: null }
);
const emit = defineEmits<{ ver: [idProducto: number]; agregar: [idProducto: number] }>();
const imagenConError = ref(false);
watch(() => props.producto, () => { imagenConError.value = false; });

const imagenVisible = computed(() => {
  const imagenes = props.producto.detalle?.imagenes ?? [];
  const principal = imagenes.find((imagen) => imagen.es_principal) ?? imagenes[0];
  if (principal?.contenido_url && !imagenConError.value) return principal.contenido_url;
  return null;
});

const muestraColorEfectiva = computed(() => {
  if (props.muestraColor) return props.muestraColor;
  if (props.producto.clase_color !== 'sin_color') {
    const primeraConMuestra = props.producto.detalle?.variantes.find((v) => v.muestra_hex);
    return primeraConMuestra?.muestra_hex ?? null;
  }
  return null;
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
  return 'Consulta la información del producto.';
});
</script>
