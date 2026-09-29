<script setup lang="ts">
import { ArrowRight, ShoppingCart } from 'lucide-vue-next'

defineEmits<{ (event: 'continueShopping'): void }>()
</script>

<template>
  <section aria-labelledby="empty-cart-heading" class="rounded-2xl border border-neutral-light bg-neutral-white px-6 py-14 text-center shadow-sm">
    <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-subaction text-corporate"><ShoppingCart class="h-10 w-10" aria-hidden="true" /></div>
    <h2 id="empty-cart-heading" class="mt-5 text-2xl font-bold text-corporate">Tu carrito está vacío</h2>
    <p class="mx-auto mt-2 max-w-md text-neutral-medium">Explora nuestros productos y encuentra lo que necesitas para tu próximo proyecto.</p>
    <button type="button" class="mt-6 inline-flex items-center gap-2 rounded-xl bg-action px-6 py-3 font-semibold text-neutral-white transition-colors hover:bg-action-hover active:bg-corporate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2" @click="$emit('continueShopping')">
      Seguir comprando <ArrowRight class="h-4 w-4" aria-hidden="true" />
    </button>
  </section>
</template>
