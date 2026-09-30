<script setup lang="ts">
import { computed } from 'vue'
import { ShoppingCart } from 'lucide-vue-next'
import type { RecommendedProduct } from '../interfaces/cart.interface'

const props = defineProps<{ product: RecommendedProduct }>()

defineEmits<{
  (event: 'view', productId: number): void
  (event: 'add', product: RecommendedProduct): void
}>()

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const discountPercent = computed(() => {
  const previousPrice = props.product.previousPrice
  if (!previousPrice || previousPrice <= props.product.price) return null
  return Math.round((1 - props.product.price / previousPrice) * 100)
})
</script>

<template>
  <article class="flex h-full flex-col overflow-hidden rounded-lg border border-neutral-light bg-neutral-white p-2">
    <div class="relative flex h-32 items-center justify-center rounded-md bg-neutral-white p-1 sm:h-36">
      <span v-if="discountPercent" class="absolute left-1 top-1 rounded bg-highlight px-1.5 py-0.5 text-xs font-bold text-neutral-black">-{{ discountPercent }}%</span>
      <img :src="product.image" :alt="product.name" class="h-full w-full object-contain" loading="lazy" />
    </div>
    <div class="flex flex-1 flex-col pt-2">
      <h3 class="line-clamp-2 min-h-8 text-xs font-bold leading-tight text-neutral-black">{{ product.name }}</h3>
      <p v-if="product.description" class="mt-0.5 line-clamp-2 min-h-8 text-xs leading-snug text-neutral-medium">{{ product.description }}</p>
      <div class="mt-auto flex flex-wrap items-baseline gap-x-2 pt-2">
        <p class="text-sm font-bold text-neutral-black">{{ currencyFormatter.format(product.price) }} COP</p>
        <p v-if="product.previousPrice" class="text-xs text-neutral-medium line-through">{{ currencyFormatter.format(product.previousPrice) }} COP</p>
      </div>
      <div class="mt-2 flex gap-1.5">
        <button type="button" class="flex min-h-10 min-w-0 flex-1 items-center justify-center rounded-md border border-action px-2 py-1.5 text-xs font-semibold text-action transition-colors hover:bg-subaction active:bg-neutral-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action sm:min-h-8" @click="$emit('view', product.id)">
          Ver producto
        </button>
        <button type="button" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-conversion text-neutral-white transition-colors hover:bg-conversion-hover active:bg-conversion-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conversion-hover sm:h-8 sm:w-8" :aria-label="`Añadir ${product.name} al carrito`" @click="$emit('add', product)">
          <ShoppingCart class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  </article>
</template>
