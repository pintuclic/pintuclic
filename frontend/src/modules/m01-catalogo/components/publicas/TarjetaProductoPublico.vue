<template>
  <article
    class="group h-full min-w-0 rounded-card border border-neutral-light bg-neutral-white p-3 sm:p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
    :class="modo === 'lista' ? 'sm:grid sm:grid-cols-[180px_1fr] sm:gap-4' : 'flex flex-col'"
  >
    <!-- Contenedor Imagen -->
    <div
      class="relative grid place-items-center overflow-hidden rounded-card bg-neutral-lightest p-3 sm:p-3.5"
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
      <!-- Dos líneas con altura fija: nombres largos legibles y tarjetas alineadas en la fila -->
      <h3 class="font-poppins font-bold text-sm leading-5 text-neutral-black line-clamp-2 min-h-10 break-words hover:text-action transition-colors" :title="producto.nombre">
        {{ producto.nombre }}
      </h3>
      
      <p class="font-sans text-xs text-neutral-medium line-clamp-2 mt-1 min-h-[32px] leading-relaxed">
        {{ producto.detalle?.descripcion || descripcionClaseColor }}
      </p>

      <!-- Fila de Precios -->
      <div class="mt-2.5 flex flex-wrap items-baseline gap-x-2">
        <span class="font-poppins text-base font-bold text-neutral-black whitespace-nowrap">
          {{ precioMinimo === null ? 'Consultar precio' : formatearPrecioConSufijo(precioMinimo) }}
        </span>
      </div>

      <!-- Fila de Acciones -->
      <div class="mt-auto pt-3 grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          class="flex h-11 w-full items-center justify-center rounded-button border border-action text-action hover:bg-action hover:text-white font-semibold text-xs px-2.5 transition-colors text-center cursor-pointer sm:h-9"
          @click="emit('ver', producto.id_producto)"
        >
          Ver producto
        </button>
        <button
          type="button"
          class="grid h-11 w-11 place-items-center rounded-button bg-conversion-hover hover:bg-conversion-accent text-white shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 sm:h-9 sm:w-9"
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
import { seleccionarVarianteCompraRapida, type RangoPrecioVariante } from '../../services/publicas/seleccion-variante';
import { PackageOpen, ShoppingCart } from 'lucide-vue-next';
import { formatearPrecioConSufijo } from '@/core/utils/moneda';
import type { ProductoDestacadoPublico } from '../../interfaces/publicas/catalogo-publico.interface';

const props = withDefaults(
  defineProps<{
    producto: ProductoDestacadoPublico;
    modo?: 'grid' | 'lista';
    muestraColor?: string | null;
    idColor?: number | null;
    /** Rango de precio activo en el catálogo: el precio mostrado debe cumplirlo. */
    rangoPrecio?: RangoPrecioVariante | null;
  }>(),
  { modo: 'grid', muestraColor: null, rangoPrecio: null }
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

/** Variante que se muestra y que agrega la compra rápida (la misma regla en ambos casos). */
const varianteMostrada = computed(() =>
  seleccionarVarianteCompraRapida(props.producto.detalle?.variantes ?? [], props.idColor, props.rangoPrecio),
);

// El punto de color corresponde a la variante cuyo precio se muestra (antes, a la primera
// variante del producto, que podía ser de otro color).
const muestraColorEfectiva = computed(() => {
  if (props.muestraColor) return props.muestraColor;
  if (props.producto.clase_color !== 'sin_color') {
    const primeraConMuestra = props.producto.detalle?.variantes.find((v) => v.muestra_hex);
    return varianteMostrada.value?.muestra_hex ?? primeraConMuestra?.muestra_hex ?? null;
  }
  return null;
});

const precioMinimo = computed(() => varianteMostrada.value?.precio_vigente ?? null);

const descripcionClaseColor = computed(() => {
  if (props.producto.clase_color === 'entonable') return 'Disponible en múltiples colores y presentaciones.';
  if (props.producto.clase_color === 'colores_fijos') return 'Consulta los colores y presentaciones disponibles.';
  return 'Consulta la información del producto.';
});
</script>
