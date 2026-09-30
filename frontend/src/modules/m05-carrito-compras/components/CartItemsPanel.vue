<script setup lang="ts">
import { ArrowLeft, Trash2 } from 'lucide-vue-next'
import CartItem from './CartItem.vue'
import type { CartItem as CartProduct } from '../interfaces/cart.interface'

defineProps<{ products: CartProduct[]; totalItems: number; updatingLineIds: number[]; loading: boolean }>()

defineEmits<{
  (event: 'increase', productId: number): void
  (event: 'decrease', productId: number): void
  (event: 'remove', productId: number): void
  (event: 'clear'): void
  (event: 'continueShopping'): void
}>()
</script>

<template>
  <section aria-labelledby="cart-items-heading" class="rounded-lg border border-action bg-neutral-white p-2.5 sm:p-3">
    <h2 id="cart-items-heading" class="sr-only">Productos en el carrito: {{ totalItems }}</h2>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-light bg-neutral-white px-3 py-1.5">
      <button type="button" class="inline-flex items-center gap-2 rounded-lg border border-action px-3 py-2 text-sm font-medium text-corporate transition-colors hover:bg-subaction active:bg-neutral-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" @click="$emit('continueShopping')">
        <ArrowLeft class="h-4 w-4" aria-hidden="true" /> Seguir comprando
      </button>
      <button type="button" class="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-corporate transition-colors hover:bg-neutral-lightest active:bg-neutral-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action disabled:cursor-not-allowed disabled:opacity-50" :disabled="products.length === 0 || loading" @click="$emit('clear')">
        <Trash2 class="h-4 w-4" aria-hidden="true" /> Vaciar carrito
      </button>
    </div>
    <div class="divide-y divide-neutral-light rounded-md border border-neutral-light px-3">
      <CartItem v-for="product in products" :key="product.id" :product="product" :updating="updatingLineIds.includes(product.id)" @increase="$emit('increase', $event)" @decrease="$emit('decrease', $event)" @remove="$emit('remove', $event)" />
    </div>
  </section>
</template>
