<template>
  <footer id="contacto" class="mt-10 bg-corporate text-white">
    <div class="mx-auto grid max-w-7xl gap-9 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <img :src="logo" alt="Pintu Clic" class="h-14 rounded-card bg-neutral-white p-1 object-contain" />
        <p class="mt-4 max-w-xs text-xs leading-5 text-white/75">Todo para tu proyecto en un solo lugar. Calidad, asesoría y envío rápido a todo Colombia.</p>
      </div>
      <div>
        <h2 class="text-base font-bold">Categorías</h2>
        <ul class="mt-4 space-y-2 text-xs text-white/75">
          <li v-for="categoria in categorias.slice(0, 4)" :key="categoria.id_categoria">{{ categoria.nombre }}</li>
        </ul>
      </div>
      <div>
        <h2 class="text-base font-bold">Servicios</h2>
        <ul class="mt-4 space-y-2 text-xs text-white/75"><li>Asesoría de color</li><li>Calculadora de pintura</li><li>Directorio de pintores</li><li>Centro de ayuda</li></ul>
      </div>
      <div>
        <h2 class="text-base font-bold">Contacto</h2>
        <ul class="mt-4 space-y-2 text-xs text-white/75">
          <li class="flex items-center gap-2"><MapPin :size="14" /> Bogotá, Colombia</li>
          <li class="flex items-center gap-2"><Phone :size="14" /> 322 123 4567</li>
          <li class="flex items-center gap-2"><Mail :size="14" /> contacto@pintuclic.com</li>
        </ul>
      </div>
    </div>
    <div class="mx-auto flex max-w-7xl flex-col gap-3 border-t border-neutral-white/20 px-6 py-5 text-[11px] text-white/60 sm:flex-row sm:items-center sm:justify-between">
      <p>© 2026 Pintu Clic. Todos los derechos reservados.</p>
      <p>Términos y condiciones · Política de privacidad · Políticas de envío</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { Mail, MapPin, Phone } from 'lucide-vue-next';
import logo from '@/assets/logo.png';
import type { CategoriaPublica } from '../../interfaces/catalogo-publico.interface';

defineProps<{ categorias: readonly CategoriaPublica[] }>();
</script>
