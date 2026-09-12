<template>
  <header>
    <div class="hidden bg-corporate text-white lg:block">
      <div class="mx-auto flex max-w-7xl items-center justify-center gap-8 px-6 py-1.5 text-[11px]">
        <span class="flex items-center gap-1.5"><MapPin :size="12" /> Envíos a todo Colombia</span>
        <span class="flex items-center gap-1.5"><BadgeCheck :size="12" /> Productos de calidad</span>
        <span class="flex items-center gap-1.5"><Headphones :size="12" /> Asesoría experta</span>
        <span class="flex items-center gap-1.5"><CircleHelp :size="12" /> ¿Necesitas ayuda?</span>
        <span class="flex items-center gap-1.5"><Phone :size="12" /> 322 123 4567</span>
      </div>
    </div>

    <div class="border-b border-neutral-light bg-neutral-white">
      <div class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <router-link to="/" class="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action">
          <img :src="logo" alt="Pintu Clic" class="h-11 w-auto object-contain" />
        </router-link>
        <button
          type="button"
          class="flex items-center gap-2 rounded-button bg-action px-3 py-2 text-sm font-semibold text-white hover:bg-action-hover sm:px-5"
          @click="emit('abrirCategorias')"
        >
          <Menu :size="18" /> <span class="hidden sm:inline">Categorías</span> <ChevronDown :size="14" />
        </button>

        <nav class="hidden flex-1 items-center justify-center gap-6 text-xs font-medium lg:flex" aria-label="Navegación principal">
          <router-link to="/" class="py-5 hover:text-action" active-class="text-action">Inicio</router-link>
          <router-link to="/catalogo" class="py-5 hover:text-action" active-class="border-b-2 border-action text-action">Productos</router-link>
          <router-link to="/catalogo" class="rounded-full bg-highlight px-2.5 py-1 font-bold text-corporate">OFERTAS</router-link>
          <a href="#servicios" class="py-5 hover:text-action">Servicios</a>
          <a href="#categorias" class="py-5 hover:text-action">Paleta de Color</a>
          <a href="#contacto" class="py-5 hover:text-action">Sobre Nosotros</a>
        </nav>

        <div class="ml-auto flex items-center gap-2 sm:gap-5">
          <button type="button" class="flex items-center gap-2 rounded-button p-2 text-corporate hover:bg-neutral-lightest" @click="emit('informar', 'Mi cuenta pertenece a M04 y se conectará en su integración.')">
            <UserRound :size="20" />
            <span class="hidden text-left text-[11px] leading-tight md:block"><strong class="block">Mi cuenta</strong>Iniciar sesión</span>
          </button>
          <button type="button" class="relative flex items-center gap-2 rounded-button p-2 text-corporate hover:bg-neutral-lightest" aria-label="Ver carrito" @click="emit('informar', 'El carrito pertenece a M07 y se conectará cuando ese módulo esté disponible.')">
            <ShoppingCart :size="21" />
            <span class="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-highlight px-1 text-[9px] font-bold text-corporate">0</span>
            <span class="hidden text-left text-[11px] leading-tight xl:block"><strong class="block">Carrito</strong>$0</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { BadgeCheck, ChevronDown, CircleHelp, Headphones, MapPin, Menu, Phone, ShoppingCart, UserRound } from 'lucide-vue-next';
import logo from '@/assets/logo.png';

const emit = defineEmits<{
  abrirCategorias: [];
  informar: [mensaje: string];
}>();
</script>
