<template>
  <div class="min-h-screen flex flex-col bg-neutral-lightest">
    <!-- Navbar Superior -->
    <header class="bg-corporate text-white shadow-sm sticky top-0 z-40">
      <div class="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
        <!-- Izquierda: Logo y Categorías -->
        <div class="flex items-center gap-6">
          <router-link to="/" class="flex-shrink-0 bg-white p-1.5 rounded-lg shadow-sm">
            <img src="@/assets/logo.png" alt="Pintu Clic" class="h-10 object-contain" />
          </router-link>
          
          <button class="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors px-4 py-2 rounded-lg font-medium text-sm border border-white/10">
            <MenuIcon class="w-5 h-5" />
            Categorías
          </button>
        </div>

        <!-- Centro: Buscador -->
        <div class="hidden md:flex flex-1 max-w-xl mx-8 relative text-neutral-dark">
          <input 
            type="text" 
            placeholder="¿Qué estás buscando?" 
            class="w-full pl-11 pr-4 py-2.5 rounded-full outline-none focus:ring-2 focus:ring-action border-none bg-white shadow-inner text-sm font-medium"
          />
          <SearchIcon class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-medium" />
        </div>

        <!-- Derecha: Acciones -->
        <div class="flex items-center gap-6">
          <div class="hidden lg:flex items-center gap-3 text-sm">
            <div class="p-2.5 bg-white/10 rounded-full">
              <PhoneIcon class="w-4 h-4" />
            </div>
            <div class="text-left">
              <p class="text-white/70 text-[11px] uppercase font-bold tracking-wider">Asesoría gratis</p>
              <p class="font-bold text-sm">321 456 7890</p>
            </div>
          </div>
          
          <button @click="$emit('openLogin')" class="flex items-center gap-3 hover:text-subaction transition-colors group">
            <div class="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
              <UserIcon class="w-5 h-5" />
            </div>
            <div class="text-left hidden lg:block">
              <p class="text-[11px] text-white/70 uppercase font-bold tracking-wider">Mi cuenta</p>
              <p class="font-semibold text-sm">Iniciar sesión</p>
            </div>
          </button>

          <button class="relative hover:text-subaction transition-colors p-2 rounded-full bg-white/5 hover:bg-white/10">
            <ShoppingCartIcon class="w-5 h-5" />
            <span class="absolute -top-1 -right-1 bg-conversion text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-[1.5px] border-corporate">
              0
            </span>
          </button>
        </div>
      </div>
    </header>

    <!-- Contenido Principal -->
    <main class="flex-1">
      <slot></slot>
    </main>
    
    <!-- Footer Placeholder -->
    <footer class="bg-white border-t border-neutral-light py-8 mt-12">
      <div class="container mx-auto px-4 text-center text-neutral-medium text-sm">
        <p>&copy; 2026 PintuClic. Todos los derechos reservados.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { Menu as MenuIcon, Search as SearchIcon, User as UserIcon, ShoppingCart as ShoppingCartIcon, Phone as PhoneIcon } from 'lucide-vue-next';

defineEmits(['openLogin']);
</script>
