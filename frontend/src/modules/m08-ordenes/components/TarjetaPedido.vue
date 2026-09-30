<template>
  <!--
    Tarjeta de pedido según el diseño «Mi-Perfil_Usuario natural» del Figma.
    En modo compacto (columna izquierda del maestro-detalle) la tarjeta entera es
    pulsable, para que el objetivo sea grande y no haya un botón extra.
  -->
  <component
    :is="compacto ? 'button' : 'article'"
    v-bind="compacto ? { type: 'button' } : {}"
    class="block w-full text-left bg-white rounded-card shadow-sm transition-colors"
    :class="[
      compacto ? 'p-4' : 'p-5',
      seleccionado
        ? 'border-2 border-action'
        : 'border border-neutral-light hover:border-action',
    ]"
    :aria-current="seleccionado ? 'true' : undefined"
    @click="compacto ? emit('abrir', pedido.codigo) : undefined"
  >
    <!-- ---------- Modo compacto ---------- -->
    <div v-if="compacto" class="flex flex-col gap-2">
      <div class="flex items-start justify-between gap-3">
        <h3 class="font-semibold text-neutral-black text-sm truncate">{{ pedido.codigo }}</h3>
        <span
          class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold shrink-0"
          :class="presentacion.clases"
        >
          {{ presentacion.etiqueta }}
        </span>
      </div>
      <p class="flex items-center gap-1.5 text-neutral-medium text-xs">
        <CalendarIcon class="w-3.5 h-3.5 shrink-0" />
        {{ formatearFecha(pedido.fecha) }}
        <template v-if="productos !== null">
          <span aria-hidden="true">·</span>
          {{ productos }} {{ productos === 1 ? 'producto' : 'productos' }}
        </template>
      </p>
      <p class="font-bold text-neutral-black text-base tabular-nums">
        {{ formatearCOP(pedido.total) }}
      </p>
    </div>

    <!-- ---------- Modo completo (como el Figma) ---------- -->
    <div v-else class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
      <!--
        Miniatura 96×96 del diseño.
        ⚠️ FALTA EN EL BACKEND: el listado no devuelve imagen del producto.
      -->
      <div
        class="w-24 h-24 shrink-0 rounded-card bg-neutral-lightest grid place-items-center"
        aria-hidden="true"
      >
        <PackageIcon class="w-9 h-9 text-neutral-medium" />
      </div>

      <div class="flex-1 min-w-0">
        <h3 class="font-bold text-neutral-black text-lg truncate">Pedido {{ pedido.codigo }}</h3>
        <p class="flex flex-wrap items-center gap-x-3 gap-y-1 text-neutral-medium text-sm mt-1.5">
          <span class="inline-flex items-center gap-1.5">
            <CalendarIcon class="w-4 h-4 shrink-0" />
            {{ formatearFecha(pedido.fecha) }}
          </span>
          <span v-if="productos !== null">
            {{ productos }} {{ productos === 1 ? 'producto' : 'productos' }}
          </span>
        </p>
      </div>

      <!-- Bloque derecho: estado arriba, total, y acción abajo -->
      <div class="flex flex-col items-start sm:items-end gap-2 shrink-0">
        <span
          class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
          :class="presentacion.clases"
        >
          {{ presentacion.etiqueta }}
        </span>

        <div class="sm:text-right">
          <span class="block text-xs text-neutral-medium leading-tight">Total</span>
          <span class="block font-bold text-neutral-black text-xl tabular-nums leading-tight">
            {{ formatearCOP(pedido.total) }}
          </span>
        </div>

        <button
          type="button"
          class="mt-1 inline-flex items-center justify-center rounded-button border border-action px-4 py-1.5 text-sm font-medium text-action transition-colors hover:bg-subaction"
          @click="emit('abrir', pedido.codigo)"
        >
          Ver detalle
        </button>
      </div>
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Package as PackageIcon, Calendar as CalendarIcon } from 'lucide-vue-next';
import { ESTADOS, formatearCOP, formatearFecha } from '../dtos/estado-pedido.dto';
import { OrdenesService } from '../services/ordenes.service';
import type { ResumenPedido } from '../interfaces/ordenes.interface';

const props = withDefaults(
  defineProps<{
    pedido: ResumenPedido;
    /** Versión reducida, para la columna izquierda de la vista maestro-detalle. */
    compacto?: boolean;
    /** Resalta la tarjeta cuyo pedido se está viendo a la derecha. */
    seleccionado?: boolean;
    /** Pide el número de productos al detalle. */
    contarProductos?: boolean;
  }>(),
  { compacto: false, seleccionado: false, contarProductos: true }
);

/** La tarjeta no navega: avisa al contenedor para que abra el seguimiento. */
const emit = defineEmits<{ abrir: [string] }>();

const presentacion = computed(() => ESTADOS[props.pedido.estado]);

/**
 * Número de productos del pedido.
 *
 * ⚠️ FALTA EN EL BACKEND: el listado devuelve solo código, fecha, total y estado.
 * El diseño pide «3 productos», así que se consulta el detalle de cada tarjeta
 * visible. Debe sustituirse por un campo del listado en cuanto exista.
 */
const productos = ref<number | null>(null);

onMounted(async () => {
  if (!props.contarProductos) return;
  try {
    const detalle = await OrdenesService.detalle(props.pedido.codigo);
    productos.value = detalle.lineas.length;
  } catch {
    productos.value = null;
  }
});
</script>
