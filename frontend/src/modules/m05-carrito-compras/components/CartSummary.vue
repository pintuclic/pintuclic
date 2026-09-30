<script setup lang="ts">
import { LockKeyhole, ShieldCheck, Truck } from 'lucide-vue-next'

defineProps<{
  totalItems: number
  subtotal: number
  shipping: number
  discount: number
  total: number
  loading: boolean
}>()

defineEmits<{ (event: 'checkout'): void }>()

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})
</script>

<template>
  <aside aria-labelledby="cart-summary-heading" class="rounded-lg border border-action bg-neutral-white p-3 sm:p-4">
    <h2 id="cart-summary-heading" class="mb-3 text-base font-bold text-corporate">Resumen de la orden</h2>
    <dl class="space-y-2 border-b border-neutral-light pb-3 text-sm">
      <div class="flex justify-between gap-4"><dt class="text-neutral-dark">Subtotal ({{ totalItems }} {{ totalItems === 1 ? 'producto' : 'productos' }})</dt><dd class="text-right font-medium text-neutral-black">{{ currencyFormatter.format(subtotal) }} COP</dd></div>
      <div class="flex justify-between gap-4"><dt class="text-neutral-dark">Envío</dt><dd class="text-right font-medium text-neutral-black">{{ currencyFormatter.format(shipping) }} COP</dd></div>
      <div class="flex justify-between gap-4"><dt class="text-neutral-dark">Descuentos y promociones</dt><dd class="text-right font-medium text-corporate">{{ discount > 0 ? '-' : '' }}{{ currencyFormatter.format(discount) }} COP</dd></div>
    </dl>
    <div class="flex items-baseline justify-between gap-4 py-3">
      <span class="text-sm font-bold text-neutral-black">Total general</span>
      <strong class="text-lg text-corporate">{{ currencyFormatter.format(total) }} COP</strong>
    </div>
    <button type="button" class="flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-conversion px-4 py-2 text-sm font-bold text-neutral-white transition-colors hover:bg-conversion-hover active:bg-conversion-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conversion-hover focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" :disabled="totalItems === 0 || loading" @click="$emit('checkout')">
      <LockKeyhole class="h-4 w-4" aria-hidden="true" /> Proceder al pago
    </button>
    <div class="mt-3 grid grid-cols-3 gap-1 border-t border-neutral-light pt-2 text-center text-xs text-neutral-medium">
      <div class="flex flex-col items-center gap-1"><LockKeyhole class="h-4 w-4 text-corporate" aria-hidden="true" /><span>Pago seguro</span></div>
      <div class="flex flex-col items-center gap-1"><Truck class="h-4 w-4 text-corporate" aria-hidden="true" /><span>Envíos rápidos</span></div>
      <div class="flex flex-col items-center gap-1"><ShieldCheck class="h-4 w-4 text-corporate" aria-hidden="true" /><span>Productos de calidad</span></div>
    </div>
  </aside>
</template>
