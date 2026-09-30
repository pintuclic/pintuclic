<script setup lang="ts">
import { BadgeCheck, Headset, ShieldCheck, Truck } from 'lucide-vue-next'
</script>

<template>
  <section aria-label="Beneficios de comprar en Pintu Clic" class="grid grid-cols-1 gap-4 bg-neutral-white py-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 lg:py-6">
    <div class="flex items-center gap-3">
      <Headset class="h-6 w-6 shrink-0 text-action" aria-hidden="true" />
      <div><h3 class="text-sm font-semibold text-neutral-black">Asesoría experta</h3><p class="text-xs text-neutral-medium">Te ayudamos a elegir lo mejor para tu proyecto</p></div>
    </div>
    <div class="flex items-center gap-3">
      <Truck class="h-6 w-6 shrink-0 text-action" aria-hidden="true" />
      <div><h3 class="text-sm font-semibold text-neutral-black">Envíos rápidos</h3><p class="text-xs text-neutral-medium">A todo el país</p></div>
    </div>
    <div class="flex items-center gap-3">
      <ShieldCheck class="h-6 w-6 shrink-0 text-action" aria-hidden="true" />
      <div><h3 class="text-sm font-semibold text-neutral-black">Compra segura</h3><p class="text-xs text-neutral-medium">Tus datos y pagos están protegidos</p></div>
    </div>
    <div class="flex items-center gap-3">
      <BadgeCheck class="h-6 w-6 shrink-0 text-action" aria-hidden="true" />
      <div><h3 class="text-sm font-semibold text-neutral-black">Productos de calidad</h3><p class="text-xs text-neutral-medium">De las mejores marcas</p></div>
    </div>
  </section>
</template>
