<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { LoaderCircle, Lock, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-vue-next'
import { formatearCOP } from '@/core/utils/moneda'
import logo from '@/assets/logo.png'
import { useCartStore } from '../store/cart.store'

const router = useRouter()
const cartStore = useCartStore()
const { cartItems, total, error, isDrawerOpen, updatingLineIds } = storeToRefs(cartStore)

const panel = ref<HTMLElement>()
let previousFocus: HTMLElement | null = null
let previousOverflow = ''

function isUpdating(lineId: number): boolean {
  return updatingLineIds.value.includes(lineId)
}

function continuePurchase(): void {
  cartStore.closeDrawer()
  void router.push('/carrito')
}

function trapFocus(event: KeyboardEvent): void {
  const elements = Array.from(panel.value?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])
  const first = elements[0]
  const last = elements.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}

watch(isDrawerOpen, async (isOpen) => {
  if (isOpen) {
    previousFocus = document.activeElement as HTMLElement | null
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    panel.value?.querySelector<HTMLElement>('button')?.focus()
  } else {
    document.body.style.overflow = previousOverflow
    previousFocus?.focus()
  }
})

onBeforeUnmount(() => {
  if (isDrawerOpen.value) document.body.style.overflow = previousOverflow
})
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition-opacity duration-300 motion-reduce:transition-none" enter-from-class="opacity-0" leave-active-class="transition-opacity duration-300 motion-reduce:transition-none" leave-to-class="opacity-0">
      <div v-if="isDrawerOpen" class="fixed inset-0 z-50 bg-neutral-dark/50" aria-hidden="true" @click="cartStore.closeDrawer()" />
    </Transition>

    <Transition enter-active-class="transform transition duration-300 ease-out motion-reduce:transition-none" enter-from-class="translate-x-full" leave-active-class="transform transition duration-300 ease-in motion-reduce:transition-none" leave-to-class="translate-x-full">
      <aside
        v-if="isDrawerOpen"
        ref="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-neutral-white shadow-xl"
        @keydown.esc.stop="cartStore.closeDrawer()"
        @keydown.tab="trapFocus"
      >
        <header class="border-b border-neutral-light px-5 pb-4 pt-5">
          <div class="flex items-center gap-4">
            <img :src="logo" alt="Pintu Clic" class="h-9 object-contain" />
            <h2 id="cart-drawer-title" class="flex-1 text-xl font-bold text-corporate">Tu carrito</h2>
            <button type="button" aria-label="Cerrar carrito" class="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-lightest text-neutral-medium transition-colors hover:bg-neutral-light hover:text-corporate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" @click="cartStore.closeDrawer()">
              <X class="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p class="mt-3 text-xs text-neutral-medium">Revisa variantes, cantidades y complementos</p>
        </header>

        <div class="flex-1 overflow-y-auto px-5 py-3">
          <p v-if="error" role="alert" class="mb-3 rounded-lg border border-highlight px-3 py-2 text-xs text-corporate">{{ error }}</p>

          <div v-if="!cartItems.length" class="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span class="flex h-14 w-14 items-center justify-center rounded-full bg-subaction text-corporate">
              <ShoppingCart class="h-6 w-6" aria-hidden="true" />
            </span>
            <p class="text-sm font-bold text-corporate">Tu carrito está vacío</p>
            <p class="text-xs text-neutral-medium">Agrega productos para verlos aquí.</p>
          </div>

          <ul v-else class="divide-y divide-neutral-light">
            <li v-for="item in cartItems" :key="item.id" class="relative flex gap-3 py-4">
              <div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-lightest">
                <img :src="item.image" :alt="item.name" class="h-full w-full object-contain" loading="lazy" />
              </div>
              <div class="min-w-0 flex-1 pr-7">
                <h3 class="truncate text-sm font-bold text-corporate">{{ item.name }}</h3>
                <p v-if="item.variant" class="truncate text-xs text-neutral-medium">{{ item.variant }}</p>
                <div class="mt-2 flex items-center justify-between gap-2">
                  <div class="flex h-7 items-center rounded border border-neutral-light" role="group" :aria-label="`Cantidad de ${item.name}`">
                    <button type="button" class="flex h-7 w-7 items-center justify-center text-neutral-dark hover:bg-subaction disabled:cursor-not-allowed disabled:opacity-40" :aria-label="`Disminuir cantidad de ${item.name}`" :disabled="isUpdating(item.id) || item.quantity <= 1" @click="cartStore.decreaseQuantity(item.id)">
                      <Minus class="h-3 w-3" aria-hidden="true" />
                    </button>
                    <span class="min-w-6 text-center text-xs text-neutral-black" aria-live="polite">{{ item.quantity }}</span>
                    <button type="button" class="flex h-7 w-7 items-center justify-center text-neutral-dark hover:bg-subaction disabled:cursor-not-allowed disabled:opacity-40" :aria-label="`Aumentar cantidad de ${item.name}`" :disabled="isUpdating(item.id) || item.quantity >= item.availableStock || item.variantStatus !== 'activo'" @click="cartStore.increaseQuantity(item.id)">
                      <Plus class="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                  <p class="text-sm font-bold text-corporate">{{ formatearCOP(item.subtotal) }} COP</p>
                </div>
              </div>
              <button type="button" class="absolute right-0 top-4 flex h-7 w-7 items-center justify-center rounded text-danger hover:bg-danger-subtle disabled:cursor-not-allowed disabled:opacity-40" :aria-label="`Eliminar ${item.name} del carrito`" :disabled="isUpdating(item.id)" @click="cartStore.removeFromCart(item.id)">
                <LoaderCircle v-if="isUpdating(item.id)" class="h-4 w-4 animate-spin" aria-hidden="true" />
                <Trash2 v-else class="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          </ul>
        </div>

        <footer class="bg-corporate text-neutral-white">
          <div class="flex items-center gap-4 px-5 py-4">
            <div class="flex flex-1 items-baseline gap-2">
              <span class="text-xs font-bold">Total</span>
              <span class="text-xl font-bold leading-tight">{{ formatearCOP(total) }} COP</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <button type="button" class="flex items-center gap-2 rounded-lg bg-conversion px-5 py-2.5 text-sm font-bold text-neutral-white transition-colors hover:bg-conversion-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-white disabled:cursor-not-allowed disabled:opacity-50" :disabled="!cartItems.length" @click="continuePurchase">
                <Lock class="h-4 w-4" aria-hidden="true" />
                Continuar compra
              </button>
              <button type="button" class="text-xs font-bold text-conversion underline underline-offset-2 hover:text-neutral-white" @click="cartStore.closeDrawer()">
                Seguir comprando
              </button>
            </div>
          </div>
          <div class="grid h-1.5 grid-cols-4" aria-hidden="true">
            <span class="bg-action" />
            <span class="bg-conversion" />
            <span class="bg-highlight" />
            <span class="bg-danger" />
          </div>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>
