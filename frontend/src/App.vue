<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
const selectedSubAction = ref('paredes')
</script>

<template>
  <main class="min-h-screen bg-neutral-lightest text-neutral-dark flex flex-col justify-between selection:bg-action selection:text-white">
    <!-- Header Corporativo -->
    <header class="border-b border-neutral-light bg-neutral-white/90 backdrop-blur-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-corporate flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            P
          </div>
          <div>
            <h1 class="text-lg font-bold tracking-tight text-corporate">Pintuclic</h1>
            <p class="text-xs text-neutral-medium">Design System & Paleta Oficial</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-subaction text-corporate border border-action/20">
            <span class="h-2 w-2 rounded-full bg-conversion animate-pulse"></span>
            Tokens Oficiales Activos
          </span>
        </div>
      </div>
    </header>

    <!-- Hero Content -->
    <section class="max-w-6xl mx-auto px-4 py-12 sm:px-6 sm:py-16 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-subaction text-corporate mb-4 border border-action/20">
        <span>🎨 Sistema de Diseño y Tokens Semánticos</span>
      </div>

      <h2 class="text-3xl sm:text-5xl font-extrabold text-neutral-black tracking-tight mb-4">
        Paleta Global de Colores <span class="text-action">Pintuclic</span>
      </h2>
      <p class="text-base sm:text-lg text-neutral-dark max-w-2xl mx-auto mb-10">
        Estructura centralizada en <code class="text-xs bg-neutral-light px-2 py-1 rounded font-mono text-corporate font-bold">src/core/theme/colors.ts</code> y configurada en Tailwind CSS para consistencia absoluta.
      </p>

      <!-- Muestra Visual de la Paleta Oficial -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-12 text-left">
        <!-- Corporativo -->
        <div class="bg-neutral-white p-4 rounded-xl border border-neutral-light shadow-sm flex flex-col justify-between">
          <div class="h-16 w-full rounded-lg bg-corporate mb-3 shadow-inner flex items-end p-2">
            <span class="text-[10px] font-mono text-white/80">#002855</span>
          </div>
          <span class="text-xs font-bold text-neutral-medium uppercase">Corporativo</span>
          <span class="text-sm font-extrabold text-neutral-black">Azul Oscuro</span>
          <code class="text-[11px] text-action font-mono mt-1">bg-corporate</code>
        </div>

        <!-- Acción -->
        <div class="bg-neutral-white p-4 rounded-xl border border-neutral-light shadow-sm flex flex-col justify-between">
          <div class="h-16 w-full rounded-lg bg-action mb-3 shadow-inner flex items-end p-2">
            <span class="text-[10px] font-mono text-white/80">#0877E8</span>
          </div>
          <span class="text-xs font-bold text-neutral-medium uppercase">Acción</span>
          <span class="text-sm font-extrabold text-neutral-black">Azul Vivo</span>
          <code class="text-[11px] text-action font-mono mt-1">bg-action</code>
        </div>

        <!-- SubAcción -->
        <div class="bg-neutral-white p-4 rounded-xl border border-neutral-light shadow-sm flex flex-col justify-between">
          <div class="h-16 w-full rounded-lg bg-subaction border border-action/20 mb-3 shadow-inner flex items-end p-2">
            <span class="text-[10px] font-mono text-corporate font-bold">#DAEEFC</span>
          </div>
          <span class="text-xs font-bold text-neutral-medium uppercase">SubAcción</span>
          <span class="text-sm font-extrabold text-neutral-black">Azul Claro</span>
          <code class="text-[11px] text-action font-mono mt-1">bg-subaction</code>
        </div>

        <!-- Conversión -->
        <div class="bg-neutral-white p-4 rounded-xl border border-neutral-light shadow-sm flex flex-col justify-between">
          <div class="h-16 w-full rounded-lg bg-conversion mb-3 shadow-inner flex items-end p-2">
            <span class="text-[10px] font-mono text-white/80">#41BF5A</span>
          </div>
          <span class="text-xs font-bold text-neutral-medium uppercase">Conversión</span>
          <span class="text-sm font-extrabold text-neutral-black">Verde Principal</span>
          <code class="text-[11px] text-action font-mono mt-1">bg-conversion</code>
        </div>

        <!-- Conversión Hover -->
        <div class="bg-neutral-white p-4 rounded-xl border border-neutral-light shadow-sm flex flex-col justify-between">
          <div class="h-16 w-full rounded-lg bg-conversion-hover mb-3 shadow-inner flex items-end p-2">
            <span class="text-[10px] font-mono text-white/80">#1B6D24</span>
          </div>
          <span class="text-xs font-bold text-neutral-medium uppercase">Conv. Hover</span>
          <span class="text-sm font-extrabold text-neutral-black">Verde Oscuro</span>
          <code class="text-[11px] text-action font-mono mt-1">bg-conversion-hover</code>
        </div>

        <!-- Destacado -->
        <div class="bg-neutral-white p-4 rounded-xl border border-neutral-light shadow-sm flex flex-col justify-between">
          <div class="h-16 w-full rounded-lg bg-highlight mb-3 shadow-inner flex items-end p-2">
            <span class="text-[10px] font-mono text-neutral-black font-bold">#FFC107</span>
          </div>
          <span class="text-xs font-bold text-neutral-medium uppercase">Destacado</span>
          <span class="text-sm font-extrabold text-neutral-black">Amarillo</span>
          <code class="text-[11px] text-action font-mono mt-1">bg-highlight</code>
        </div>
      </div>

      <!-- Casos de Uso Interactivos -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-left">
        <!-- Tarjeta de Producto (B2C / B2B) -->
        <div class="bg-neutral-white p-6 rounded-2xl border border-neutral-light shadow-md flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="bg-highlight text-neutral-black text-xs font-extrabold px-2.5 py-1 rounded-md shadow-sm">
                OFERTA ESPECIAL
              </span>
              <span class="text-xs text-neutral-medium font-medium">SKU: KOR-001</span>
            </div>
            <div class="h-36 bg-neutral-lightest rounded-xl flex items-center justify-center mb-4 border border-neutral-light">
              <span class="text-4xl">🎨</span>
            </div>
            <h3 class="text-xl font-extrabold text-neutral-black mb-1">Koraza Máxima Protección</h3>
            <p class="text-sm text-neutral-dark mb-4">Pintura acrílica para exteriores con resistencia superior al agua y rayos UV.</p>
            <div class="flex items-baseline gap-3 mb-6">
              <span class="text-2xl font-black text-corporate">$124.900</span>
              <span class="text-sm text-neutral-medium line-through">$148.000</span>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="flex-1 bg-conversion hover:bg-conversion-hover text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-150 active:scale-95 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🛒</span> Agregar al Carrito
            </button>
            <button
              type="button"
              class="bg-subaction hover:bg-subaction/80 text-corporate font-bold py-2.5 px-4 rounded-xl transition-all duration-150 cursor-pointer border border-action/20"
            >
              Ver Detalle
            </button>
          </div>
        </div>

        <!-- Panel de SubAcción y Contador Reactivo -->
        <div class="bg-neutral-white p-6 rounded-2xl border border-neutral-light shadow-md flex flex-col justify-between">
          <div>
            <h3 class="text-lg font-bold text-corporate mb-2">Simulador de Calculadora & SubAcciones</h3>
            <p class="text-sm text-neutral-dark mb-4">Uso del rol <strong>SubAcción</strong> (`#DAEEFC`) para selección de subprocesos:</p>

            <div class="flex flex-wrap gap-2 mb-6">
              <button
                type="button"
                :class="selectedSubAction === 'paredes' ? 'bg-corporate text-white' : 'bg-subaction text-corporate hover:bg-subaction/70'"
                class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer border border-action/20"
                @click="selectedSubAction = 'paredes'"
              >
                Paredes Interiores
              </button>
              <button
                type="button"
                :class="selectedSubAction === 'fachadas' ? 'bg-corporate text-white' : 'bg-subaction text-corporate hover:bg-subaction/70'"
                class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer border border-action/20"
                @click="selectedSubAction = 'fachadas'"
              >
                Fachadas
              </button>
              <button
                type="button"
                :class="selectedSubAction === 'techos' ? 'bg-corporate text-white' : 'bg-subaction text-corporate hover:bg-subaction/70'"
                class="px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer border border-action/20"
                @click="selectedSubAction = 'techos'"
              >
                Techos
              </button>
            </div>

            <div class="p-4 bg-neutral-lightest rounded-xl border border-neutral-light mb-4">
              <span class="text-xs font-semibold text-neutral-medium uppercase tracking-wider block mb-1">Área a pintar (Galones)</span>
              <div class="flex items-center gap-4 mt-2">
                <button
                  type="button"
                  class="h-10 w-10 rounded-lg bg-neutral-white border border-neutral-light text-neutral-dark hover:bg-neutral-lightest active:scale-95 font-bold transition-all cursor-pointer"
                  @click="count > 0 ? count-- : count = 0"
                >
                  -
                </button>
                <span class="text-2xl font-black text-neutral-black min-w-12 text-center tabular-nums">{{ count }}</span>
                <button
                  type="button"
                  class="h-10 w-10 rounded-lg bg-action text-white hover:bg-action/90 active:scale-95 font-bold transition-all cursor-pointer shadow-sm"
                  @click="count++"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <p class="text-xs text-neutral-medium">
            Superficie seleccionada: <strong class="text-corporate capitalize">{{ selectedSubAction }}</strong>. Todo renderizado con tokens oficiales.
          </p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-neutral-light bg-neutral-white py-6 text-center text-xs text-neutral-medium">
      <p class="font-medium">Pintuclic Frontend — Vue 3 + Vite + Tailwind CSS v4 | Design System Oficial</p>
    </footer>
  </main>
</template>
