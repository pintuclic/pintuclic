<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import CartBenefits from '../components/CartBenefits.vue'
import CartEmptyState from '../components/CartEmptyState.vue'
import CartItemsPanel from '../components/CartItemsPanel.vue'
import CartSummary from '../components/CartSummary.vue'
import { useCartStore } from '../store/cart.store'

const router = useRouter()
const cartStore = useCartStore()
const {
  cartItems,
  totalItems,
  subtotal,
  shipping,
  discount,
  total,
  loading,
  error,
  updatingLineIds,
  revalidationAlerts,
  isAuthenticated,
} = storeToRefs(cartStore)
const notice = ref('')

onMounted(() => {
  void cartStore.loadCart()
})

watch(isAuthenticated, (authenticated, wasAuthenticated) => {
  if (authenticated !== wasAuthenticated) void cartStore.loadCart()
})

function continueShopping(): void {
  void router.push('/')
}

async function checkout(): Promise<void> {
  notice.value = ''
  if (!isAuthenticated.value) {
    notice.value = 'Para continuar con la compra debes iniciar sesión.'
    return
  }

  const isValid = await cartStore.revalidate()
  if (!isValid) {
    notice.value = revalidationAlerts.value.length
      ? 'Se detectaron cambios en el carrito. Revisa las alertas antes de continuar.'
      : 'No fue posible validar el carrito.'
    return
  }

  notice.value = 'Carrito validado. El pago se conectará próximamente con M07.'
}
</script>

<template>
  <main class="min-h-screen bg-neutral-lightest py-4 text-neutral-dark sm:py-6">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <nav aria-label="Migas de pan" class="mb-3 text-xs text-neutral-medium">
        <a href="/" class="text-action transition-colors hover:text-corporate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action">Inicio</a>
        <span aria-hidden="true" class="mx-2">/</span>
        <span aria-current="page">Carrito de compras</span>
      </nav>

      <h1 class="text-3xl font-bold tracking-tight text-corporate sm:text-4xl">Carrito de compras</h1>
      <p class="mb-4 mt-1 text-sm text-neutral-medium sm:mb-5">Revisa los productos que agregaste y continúa con tu compra.</p>

      <p v-if="loading" role="status" class="mb-5 rounded-lg border border-subaction bg-subaction px-4 py-3 text-sm text-corporate">Cargando carrito...</p>
      <p v-if="error" role="alert" class="mb-5 rounded-lg border border-highlight bg-neutral-white px-4 py-3 text-sm text-corporate">{{ error }}</p>
      <p v-if="notice" role="status" class="mb-5 rounded-lg border border-subaction bg-subaction px-4 py-3 text-sm text-corporate">{{ notice }}</p>

      <section v-if="revalidationAlerts.length" aria-labelledby="revalidation-heading" class="mb-5 rounded-lg border border-highlight bg-neutral-white p-4">
        <h2 id="revalidation-heading" class="text-sm font-bold text-corporate">Revisa tu carrito antes de continuar</h2>
        <ul class="mt-2 space-y-1 text-sm text-neutral-dark">
          <li v-for="alert in revalidationAlerts" :key="`${alert.id_linea_carrito}-${alert.tipo}`">{{ alert.descripcion }}</li>
        </ul>
      </section>

      <div v-if="loading && !cartItems.length" class="rounded-lg border border-action bg-neutral-white p-8 text-center text-sm text-neutral-medium" role="status">Consultando tu carrito...</div>
      <div v-else-if="cartItems.length" class="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <CartItemsPanel
            :products="cartItems"
            :total-items="totalItems"
            :updating-line-ids="updatingLineIds"
            :loading="loading"
            @increase="cartStore.increaseQuantity"
            @decrease="cartStore.decreaseQuantity"
            @remove="cartStore.removeFromCart"
            @clear="cartStore.clearCart"
            @continue-shopping="continueShopping"
          />
        </div>
        <div class="lg:sticky lg:top-5">
          <CartSummary
            :total-items="totalItems"
            :subtotal="subtotal"
            :shipping="shipping"
            :discount="discount"
            :total="total"
            :loading="loading"
            @checkout="checkout"
          />
        </div>
      </div>
      <CartEmptyState v-else @continue-shopping="continueShopping" />
    </div>

    <div class="mt-7 border-y border-neutral-light bg-neutral-white">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <CartBenefits />
      </div>
    </div>
  </main>
</template>
