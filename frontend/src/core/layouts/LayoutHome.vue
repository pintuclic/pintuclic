<template>
  <div class="min-h-screen flex flex-col bg-neutral-lightest font-sans">
    
    <!-- Top Bar Azul Oscuro -->
    <div class="bg-corporate text-white py-1.5 text-xs font-medium tracking-wide">
      <div class="container mx-auto px-4 lg:px-8 flex justify-end items-center gap-6">
        <div class="flex items-center gap-1.5 cursor-pointer hover:text-white/80 transition-colors">
          <MapPinIcon class="w-3.5 h-3.5" /> Envíos a todo el Caquetá
        </div>
        <div class="flex items-center gap-1.5 cursor-pointer hover:text-white/80 transition-colors">
          <ShieldCheckIcon class="w-3.5 h-3.5" /> Productos de calidad
        </div>
        <div class="flex items-center gap-1.5 cursor-pointer hover:text-white/80 transition-colors">
          <HeadsetIcon class="w-3.5 h-3.5" /> Asesoría experta
        </div>
        <div class="flex items-center gap-1.5 cursor-pointer hover:text-white/80 transition-colors">
          <HelpCircleIcon class="w-3.5 h-3.5" /> ¿Necesitas ayuda?
        </div>
        <div class="flex items-center gap-1.5 cursor-pointer hover:text-white/80 transition-colors">
          <PhoneIcon class="w-3.5 h-3.5" /> 322 123 4567
        </div>
      </div>
    </div>

    <!-- Main Navbar Blanco -->
    <header class="bg-white border-b border-neutral-light sticky top-0 z-40 shadow-sm">
      <div class="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
        
        <!-- Logo y Categorías -->
        <div class="flex items-center gap-6">
          <router-link to="/" class="flex-shrink-0 cursor-pointer">
            <img src="@/assets/logo.png" alt="Pintu Clic" class="h-10 object-contain" />
          </router-link>
          
          <button class="flex items-center gap-2 bg-action hover:bg-[#007BFF] text-white transition-colors px-4 py-2.5 rounded-lg font-bold text-sm cursor-pointer shadow-sm">
            <MenuIcon class="w-5 h-5" />
            Categorías
            <ChevronDownIcon class="w-4 h-4 ml-1" />
          </button>
        </div>

        <!-- Enlaces Principales -->
        <nav class="hidden xl:flex items-center gap-6 font-semibold text-neutral-dark text-[15px]">
          <router-link to="/" class="relative text-action py-1 cursor-pointer group">
            Inicio
            <span class="absolute bottom-0 left-0 w-full h-[2px] bg-action scale-x-100 transition-transform origin-left"></span>
          </router-link>
          <a href="#" class="relative hover:text-action transition-colors py-1 cursor-pointer group">
            Productos
            <span class="absolute bottom-0 left-0 w-full h-[2px] bg-action scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </a>
          <a href="#" class="bg-[#E63946] hover:bg-[#D62839] text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors cursor-pointer">OFERTAS</a>
          <a href="#" class="relative hover:text-action transition-colors py-1 cursor-pointer group">
            Servicios
            <span class="absolute bottom-0 left-0 w-full h-[2px] bg-action scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </a>
          <a href="#" class="relative hover:text-action transition-colors py-1 cursor-pointer group">
            Paleta de Color
            <span class="absolute bottom-0 left-0 w-full h-[2px] bg-action scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </a>
          <a href="#" class="relative hover:text-action transition-colors py-1 cursor-pointer group">
            Sobre Nosotros
            <span class="absolute bottom-0 left-0 w-full h-[2px] bg-action scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </a>
        </nav>

        <!-- Acciones Derecha -->
        <div class="flex items-center gap-6">
          
          <!-- Acciones: Mi Cuenta -->
          <button @click="openLogin" class="flex items-center gap-2 text-neutral-dark hover:text-action transition-colors text-left cursor-pointer">
            <UserIcon class="w-7 h-7" />
            <div class="hidden md:block">
              <span class="block text-xs text-neutral-medium leading-none">Mi Cuenta</span>
              <span class="block font-bold leading-tight">Iniciar sesión</span>
            </div>
          </button>

          <!-- Separador -->
          <div class="w-px h-8 bg-neutral-light hidden md:block"></div>

          <!-- Acciones: Carrito -->
          <button class="relative flex items-center gap-2 text-neutral-dark hover:text-action transition-all duration-300 text-left cursor-pointer" :class="{ '-translate-y-1': cartTotalItems > 0 }">
            <div class="relative">
              <ShoppingCartIcon class="w-7 h-7" />
              <span v-if="cartTotalItems > 0" class="absolute -top-1.5 -right-1.5 bg-[#E63946] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {{ cartTotalItems }}
              </span>
            </div>
            <div class="hidden md:block">
              <span class="block text-xs text-neutral-medium leading-none">Mi Carrito</span>
              <span class="block font-bold leading-tight transition-all duration-300">
                {{ cartTotalItems > 0 ? cartTotalValue : '' }}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>

    <!-- Slot Principal Dinámico (Vistas inyectadas por Vue Router) -->
    <main class="flex-1">
      <router-view />
    </main>

    <!-- Footer base -->
    <footer class="bg-corporate text-white py-12 mt-12">
      <div class="max-w-[1280px] mx-auto px-4 md:px-8 text-center text-sm opacity-80">
        &copy; 2026 PintuClic. Todos los derechos reservados.
      </div>
    </footer>

    <!-- Modales Globales de la Tienda (Login/Registro M04) -->
    <ModalLogin 
      v-model="showLogin" 
      @goToRegister="openRegister" 
      @success="handleLoginSuccess" 
    />
    
    <RegistroWizard 
      v-model="showWizard" 
      @irALogin="openLogin" 
      @exito="handleWizardSuccess" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 
  MapPin as MapPinIcon, 
  ShieldCheck as ShieldCheckIcon, 
  Headset as HeadsetIcon,
  HelpCircle as HelpCircleIcon,
  Phone as PhoneIcon,
  Menu as MenuIcon,
  ChevronDown as ChevronDownIcon,
  User as UserIcon,
  ShoppingCart as ShoppingCartIcon
} from 'lucide-vue-next';

import ModalLogin from '@/modules/m04-cuentas/components/ModalLogin.vue';
import RegistroWizard from '@/modules/m04-cuentas/components/RegistroWizard.vue';
import type { TipoCuentaRegistro } from '@/modules/m04-cuentas/interfaces/registro.interface';
import { useRouter } from 'vue-router';

// Estado global local del layout para modales
const showLogin = ref(false);
const showWizard = ref(false);
const showMobileMenu = ref(false);

const router = useRouter();

const closeAllModals = () => {
  showLogin.value = false;
  showWizard.value = false;
};

const openLogin = () => {
  closeAllModals();
  showLogin.value = true;
};

const openRegister = () => {
  closeAllModals();
  showWizard.value = true;
};

const handleLoginSuccess = () => {
  console.log('Login exitoso en layout global');
  closeAllModals();
  // Redirigir al panel de administración tras iniciar sesión
  router.push('/admin');
};

const handleWizardSuccess = (tipoCuenta: TipoCuentaRegistro) => {
  console.log('Registro finalizado exitosamente. Tipo de cuenta:', tipoCuenta);
  closeAllModals();
};

// Mock state for Shopping Cart UI. When backend/Pinia is ready, replace these with useCartStore()
const cartTotalItems = ref(0);
const cartTotalValue = ref('');

</script>
