<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <main class="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
    <!-- Header -->
    <header class="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-lg bg-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/20">
            P
          </div>
          <div>
            <h1 class="text-lg font-bold tracking-tight text-slate-900">Pintuclic</h1>
            <p class="text-xs text-slate-500">Ecosistema Frontend Modular</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Tailwind CSS v4 Activo
          </span>
        </div>
      </div>
    </header>

    <!-- Hero Content -->
    <section class="max-w-5xl mx-auto px-4 py-12 sm:px-6 sm:py-16 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 mb-6">
        <span>🎨 Infraestructura de Estilos Configurada</span>
      </div>

      <h2 class="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
        Tailwind CSS listo para el desarrollo de <span class="text-orange-600">Pintuclic</span>
      </h2>
      <p class="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8">
        El ecosistema frontend ahora cuenta con Tailwind CSS v4 integrado con Vite y Vue 3. Los módulos de negocio pueden utilizar clases utilitarias de forma consistente.
      </p>

      <!-- Interactive Counter Card -->
      <div class="max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 mb-12">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Prueba de Reactividad & Tailwind</h3>
        <p class="text-slate-600 text-sm mb-4">
          Estado reactivo de Vue 3 + Estilos con Tailwind CSS:
        </p>
        <div class="flex items-center justify-center gap-4">
          <button 
            type="button" 
            class="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            @click="count > 0 ? count-- : count = 0"
          >
            - Restar
          </button>
          <span class="text-2xl font-bold text-slate-900 min-w-10 tabular-nums">{{ count }}</span>
          <button 
            type="button" 
            class="px-4 py-2 text-sm font-medium rounded-lg bg-orange-600 text-white hover:bg-orange-700 active:scale-95 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            @click="count++"
          >
            + Incrementar
          </button>
        </div>
      </div>

      <!-- Feature Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div class="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
            ⚡
          </div>
          <h4 class="font-semibold text-slate-900 mb-1">Vite + Tailwind v4</h4>
          <p class="text-sm text-slate-600">Compilación ultra rápida mediante el plugin oficial <code class="text-xs bg-slate-100 px-1 py-0.5 rounded">@tailwindcss/vite</code> sin sobrecarga.</p>
        </div>

        <div class="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold mb-4">
            📦
          </div>
          <h4 class="font-semibold text-slate-900 mb-1">Arquitectura Modular</h4>
          <p class="text-sm text-slate-600">Estructura preparada para módulos <code class="text-xs bg-slate-100 px-1 py-0.5 rounded">m[xx]-[nombre]</code> respetando el estándar del proyecto.</p>
        </div>

        <div class="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
            🤖
          </div>
          <h4 class="font-semibold text-slate-900 mb-1">Guía para Agentes y Devs</h4>
          <p class="text-sm text-slate-600">Documentación de infraestructura actualizada con lineamientos claros de diseño y utility-first.</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
      <p>Pintuclic Frontend — Vue 3 + Vite + Tailwind CSS v4</p>
    </footer>
  </main>
</template>

