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
      <!-- Badge de Descuento Rojo (-15%) -->
      <Badge
        v-if="descuentoTexto"
        estado="descuento"
        class="absolute left-2.5 top-2.5 z-10 shadow-sm"
      >
        {{ descuentoTexto }}
      </Badge>

      <img
        v-if="imagenVisible"
        :src="imagenVisible"
        :alt="producto.nombre"
        class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        @error="imagenConError = true"
      />
      <PackageOpen v-else :size="54" class="text-neutral-light" aria-hidden="true" />
      <MuestraColor
        v-if="muestraColorEfectiva"
        :hex="muestraColorEfectiva"
        class="absolute bottom-2.5 right-2.5 z-10 transition-transform duration-200 group-hover:scale-110"
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
        <span 
          v-if="precioAnterior" 
          class="text-xs text-neutral-medium line-through whitespace-nowrap"
        >
          {{ formatearPrecio(precioAnterior) }}
        </span>
      </div>

      <!-- Fila de Acciones -->
      <div class="mt-auto pt-3 grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          class="flex h-9 w-full items-center justify-center rounded-lg border border-action text-action hover:bg-action hover:text-white font-semibold text-xs px-2.5 transition-colors text-center cursor-pointer"
          @click="emit('ver', producto.id_producto)"
        >
          Ver producto
        </button>
        <button
          type="button"
          class="grid h-9 w-9 place-items-center rounded-lg bg-conversion-hover hover:bg-conversion-accent text-white shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
          aria-label="Agregar producto al carrito"
          @click="emit('agregar', producto.id_producto)"
        >
          <ShoppingCart :size="16" aria-hidden="true" />
        </button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { PackageOpen, ShoppingCart } from 'lucide-vue-next';
import { Badge, MuestraColor } from '@/core/components';
import { formatearPrecio, formatearPrecioConSufijo } from '@/core/utils/moneda';
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

const muestraColorEfectiva = computed(() => {
  if (props.muestraColor) return props.muestraColor;
  if (props.producto.clase_color !== 'sin_color') {
    const primeraConMuestra = props.producto.detalle?.variantes.find((v) => v.muestra_hex);
    if (primeraConMuestra?.muestra_hex) return primeraConMuestra.muestra_hex;
  }
  return null;
});

const precioMinimo = computed(() => {
  const precios = (props.producto.detalle?.variantes ?? [])
    .map((variante) => variante.precio_vigente)
    .filter((precio) => Number.isFinite(precio));
  return precios.length ? Math.min(...precios) : null;
});

const descuentoTexto = computed(() => {
  if (props.destacado) return '-15%';
  return null;
});

const precioAnterior = computed(() => {
  if (!precioMinimo.value) return null;
  if (props.destacado) {
    return Math.round((precioMinimo.value * 1.167) / 100) * 100;
  }
  return null;
});

const descripcionClaseColor = computed(() => {
  if (props.producto.clase_color === 'entonable') return 'Disponible en múltiples colores y presentaciones.';
  if (props.producto.clase_color === 'colores_fijos') return 'Consulta los colores y presentaciones disponibles.';
  return 'Producto de calidad para completar tu proyecto.';
});
</script>
