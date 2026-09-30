<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import CartBenefits from '../components/CartBenefits.vue'
import CartEmptyState from '../components/CartEmptyState.vue'
import CartItemsPanel from '../components/CartItemsPanel.vue'
import CartSummary from '../components/CartSummary.vue'
import RecommendedProducts from '../components/RecommendedProducts.vue'
import type { CartItem, RecommendedProduct } from '../interfaces/cart.interface'
import { CART_ITEMS_DEMO, RECOMMENDED_PRODUCTS_DEMO, calculateDemoDiscount } from './cart-preview.data'

const router = useRouter()
const cartItems = ref<CartItem[]>(CART_ITEMS_DEMO.map((item) => ({ ...item })))
const notice = ref('')
const subtotal = computed(() => cartItems.value.reduce((total, item) => total + item.price * item.quantity, 0))
const shipping = computed(() => cartItems.value.length ? 10000 : 0)
const discount = computed(() => calculateDemoDiscount(cartItems.value))
const total = computed(() => subtotal.value + shipping.value - discount.value)
const totalItems = computed(() => cartItems.value.reduce((total, item) => total + item.quantity, 0))

function continueShopping(): void {
  void router.push('/')
}

function findItem(lineId: number): CartItem | undefined {
  return cartItems.value.find((item) => item.id === lineId)
}

function increaseQuantity(lineId: number): void {
  const item = findItem(lineId)
  if (item && item.quantity < item.availableStock) item.quantity += 1
}

function decreaseQuantity(lineId: number): void {
  const item = findItem(lineId)
  if (item && item.quantity > 1) item.quantity -= 1
}

function removeFromCart(lineId: number): void {
  cartItems.value = cartItems.value.filter((item) => item.id !== lineId)
}

function clearCart(): void {
  cartItems.value = []
}

function addRecommended(product: RecommendedProduct): void {
  const existing = cartItems.value.find((item) => item.variantId === (product.variantId ?? product.id))
  if (existing) {
    existing.quantity += 1
    return
  }

  cartItems.value.push({
    ...product,
    id: Date.now(),
    variantId: product.variantId ?? product.id,
    quantity: 1,
    subtotal: product.price,
    availableStock: 999,
    variantStatus: 'activo',
  })
  notice.value = `${product.name} se añadió al carrito.`
}

function viewProduct(): void {
  notice.value = 'El detalle de producto se conectará al catálogo próximamente.'
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
      <p v-if="notice" role="status" class="mb-5 rounded-lg border border-subaction bg-subaction px-4 py-3 text-sm text-corporate">{{ notice }}</p>

      <div v-if="cartItems.length" class="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <CartItemsPanel
            :products="cartItems"
            :total-items="totalItems"
            :updating-line-ids="[]"
            :loading="false"
            @increase="increaseQuantity"
            @decrease="decreaseQuantity"
            @remove="removeFromCart"
            @clear="clearCart"
            @continue-shopping="continueShopping"
          />
        </div>
        <div class="lg:sticky lg:top-5">
          <CartSummary :total-items="totalItems" :subtotal="subtotal" :shipping="shipping" :discount="discount" :total="total" :loading="false" @checkout="notice = 'La preview no conecta checkout.'" />
        </div>
      </div>
      <CartEmptyState v-else @continue-shopping="continueShopping" />

      <div class="mt-8 sm:mt-10">
        <RecommendedProducts :products="RECOMMENDED_PRODUCTS_DEMO" @add="addRecommended" @view="viewProduct" />
      </div>
    </div>

    <div class="mt-7 border-y border-neutral-light bg-neutral-white">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <CartBenefits />
      </div>
    </div>
  </main>
</template>
