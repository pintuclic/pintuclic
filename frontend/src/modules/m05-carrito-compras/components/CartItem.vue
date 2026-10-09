<script setup lang="ts">
import { ref, watch } from 'vue'
import { LoaderCircle, Minus, Plus, Trash2, PackageOpen } from 'lucide-vue-next'
import type { CartItem } from '../interfaces/cart.interface'

const props = defineProps<{ product: CartItem; updating: boolean }>()
const imagenConError = ref(false)
watch(() => props.product.image, () => { imagenConError.value = false })

defineEmits<{
  (event: 'increase', productId: number): void
  (event: 'decrease', productId: number): void
  (event: 'remove', productId: number): void
}>()

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})
</script>

<template>
  <article class="relative flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-3">
    <div class="flex min-w-0 flex-1 items-start gap-3 pr-9 sm:pr-0">
      <div class="flex h-[5.5rem] w-[5.5rem] shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-light bg-neutral-white p-1.5 sm:h-24 sm:w-24">
        <img v-if="product.image && !imagenConError" @error="imagenConError = true" :src="product.image" :alt="product.name" class="h-full w-full object-contain" loading="lazy" />
        <PackageOpen v-else class="h-10 w-10 text-neutral-light" aria-hidden="true" />
      </div>
      <div class="min-w-0">
        <h3 class="text-sm font-bold leading-tight text-neutral-black">{{ product.name }}</h3>
        <p v-if="product.description" class="mt-0.5 line-clamp-2 text-xs leading-snug text-neutral-medium">{{ product.description }}</p>
        <p v-if="product.variant" class="mt-1 flex items-center gap-1 text-xs text-neutral-dark"><span class="h-2 w-2 rounded-full bg-action" aria-hidden="true" />{{ product.variant }}</p>
        <p class="mt-1 text-sm font-bold text-corporate">{{ currencyFormatter.format(product.price) }} COP</p>
        <p class="text-xs text-neutral-medium">{{ currencyFormatter.format(product.price) }} COP / Unidad</p>
      </div>
    </div>

    <div class="flex items-center justify-end gap-2 sm:shrink-0 sm:pr-9">
      <div class="flex h-10 items-center overflow-hidden rounded border border-neutral-light sm:h-8" role="group" :aria-label="`Cantidad de ${product.name}`">
        <button type="button" class="flex h-10 w-10 items-center justify-center text-corporate transition-colors hover:bg-subaction active:bg-neutral-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action disabled:cursor-not-allowed disabled:opacity-40 sm:h-8 sm:w-8" :aria-label="`Disminuir cantidad de ${product.name}`" :disabled="props.updating || product.quantity <= 1" @click="$emit('decrease', product.id)">
          <Minus class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <span class="min-w-7 text-center text-sm text-neutral-black" aria-live="polite">{{ product.quantity }}</span>
        <button type="button" class="flex h-10 w-10 items-center justify-center text-corporate transition-colors hover:bg-subaction active:bg-neutral-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action disabled:cursor-not-allowed disabled:opacity-40 sm:h-8 sm:w-8" :aria-label="`Aumentar cantidad de ${product.name}`" :disabled="props.updating || product.quantity >= product.availableStock || product.variantStatus !== 'activo'" @click="$emit('increase', product.id)">
          <Plus class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <p class="min-w-28 text-right text-sm font-bold text-neutral-black">{{ currencyFormatter.format(product.subtotal) }} COP</p>
    </div>
    <button type="button" class="absolute right-0 top-3 flex h-10 w-10 items-center justify-center rounded-md bg-subaction text-corporate transition-colors hover:bg-neutral-light active:bg-neutral-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action disabled:cursor-not-allowed disabled:opacity-40 sm:h-8 sm:w-8" :aria-label="`Eliminar ${product.name} del carrito`" :disabled="props.updating" @click="$emit('remove', product.id)">
      <LoaderCircle v-if="props.updating" class="h-4 w-4 animate-spin" aria-hidden="true" />
      <Trash2 v-else class="h-4 w-4" aria-hidden="true" />
    </button>
  </article>
</template>
