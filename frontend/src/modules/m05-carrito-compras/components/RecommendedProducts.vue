<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import RecommendedProductCard from './RecommendedProductCard.vue'
import type { RecommendedProduct } from '../interfaces/cart.interface'

const props = defineProps<{ products: RecommendedProduct[] }>()

defineEmits<{
  (event: 'view', productId: number): void
  (event: 'add', product: RecommendedProduct): void
}>()

const scroller = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function updateScrollState(): void {
  const element = scroller.value
  canScrollLeft.value = Boolean(element && element.scrollLeft > 1)
  canScrollRight.value = Boolean(
    element && element.scrollLeft < element.scrollWidth - element.clientWidth - 1,
  )
}

function scroll(direction: -1 | 1): void {
  const element = scroller.value
  if (!element) return
  element.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: 'smooth' })
}

onMounted(() => {
  updateScrollState()
  window.addEventListener('resize', updateScrollState)
})

onUnmounted(() => window.removeEventListener('resize', updateScrollState))

watch(() => props.products.length, () => {
  void nextTick(updateScrollState)
})
</script>

<template>
  <section v-if="products.length" aria-labelledby="recommended-heading">
    <h2 id="recommended-heading" class="mb-3 text-lg font-bold text-corporate sm:text-xl">Productos que te pueden interesar</h2>
    <div class="relative">
      <div ref="scroller" class="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scroll-smooth" tabindex="0" aria-label="Productos recomendados" @scroll="updateScrollState">
        <div v-for="product in products" :key="product.id" class="w-44 shrink-0 snap-start sm:w-48 lg:w-52">
          <RecommendedProductCard :product="product" @view="$emit('view', $event)" @add="$emit('add', $event)" />
        </div>
      </div>
      <div class="pointer-events-none absolute inset-x-0 top-1/2 hidden -translate-y-1/2 justify-between sm:flex">
        <button type="button" class="pointer-events-auto -ml-3 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-light bg-neutral-white text-corporate shadow-sm transition-colors hover:bg-subaction active:bg-neutral-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-neutral-white" aria-label="Ver productos anteriores" :disabled="!canScrollLeft" @click="scroll(-1)">
          <ChevronLeft class="h-5 w-5" aria-hidden="true" />
        </button>
        <button type="button" class="pointer-events-auto -mr-3 flex h-9 w-9 items-center justify-center rounded-full border border-neutral-light bg-neutral-white text-corporate shadow-sm transition-colors hover:bg-subaction active:bg-neutral-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-neutral-white" aria-label="Ver productos siguientes" :disabled="!canScrollRight" @click="scroll(1)">
          <ChevronRight class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  </section>
</template>
