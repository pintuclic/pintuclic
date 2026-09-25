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

          <button class="flex items-center gap-2 bg-action hover:bg-action/90 text-white transition-colors px-4 py-2.5 rounded-lg font-bold text-sm cursor-pointer shadow-sm">
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
          <a href="#" class="bg-offer hover:bg-offer-hover text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors cursor-pointer">OFERTAS</a>
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
          <Dropdown v-if="authStore.isAuthenticated" align="right" width="w-48">
            <template #trigger="{ isOpen }">
              <button
                type="button"
                class="flex items-center gap-2 text-neutral-dark hover:text-action transition-colors text-left cursor-pointer focus:outline-none"
              >
                <UserIcon class="w-7 h-7" />
                <div class="hidden md:block">
                  <span class="block text-xs text-neutral-medium leading-none">Mi Cuenta</span>
                  <span class="block font-bold leading-tight">{{ authStore.user?.nombre || 'Usuario' }}</span>
                </div>
                <ChevronDownIcon
                  class="w-4 h-4 ml-1 text-neutral-medium transition-transform duration-200"
                  :class="{ 'rotate-180': isOpen }"
                />
              </button>
            </template>

            <template #default="{ close }">
              <div class="py-1">
                <router-link
                  to="/perfil"
                  @click="close"
                  class="block px-4 py-2 text-sm text-neutral-dark hover:bg-neutral-lightest hover:text-action transition-colors"
                >
                  Mi Perfil
                </router-link>
                <div class="border-t border-neutral-lightest"></div>
                <button
                  type="button"
                  @click="handleLogout(); close();"
                  class="w-full text-left block px-4 py-2 text-sm text-danger hover:bg-neutral-lightest transition-colors font-medium cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </div>
            </template>
          </Dropdown>

          <button v-else @click="openLogin" class="flex items-center gap-2 text-neutral-dark hover:text-action transition-colors text-left cursor-pointer focus:outline-none">
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
              <span v-if="cartTotalItems > 0" class="absolute -top-1.5 -right-1.5 bg-danger text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
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
    <FooterPrincipal />

    <!-- Modales Globales de la Tienda (Login/Registro M04) -->
    <ModalLogin 
      v-model="showLogin" 
      @goToRegister="openRegister"
      @goToRecover="openRecover"
      @success="handleLoginSuccess" 
    />
    
    <RegistroWizard 
      v-model="showWizard" 
      @goToLogin="openLogin" 
      @success="handleWizardSuccess" 
    />

    <RecuperarPasswordWizard 
      v-model="showRecover" 
      @openLogin="openLogin" 
    />

    <!-- Modal Confirmación Cerrar Sesión -->
    <Modal v-model="showLogoutConfirm" maxWidth="sm">
      <div class="text-center py-4">
        <h3 class="text-xl font-bold text-corporate mb-2">¿Cerrar sesión?</h3>
        <p class="text-neutral-medium text-sm mb-6">¿Estás seguro de que deseas salir de tu cuenta?</p>
        <div class="flex gap-3 justify-center">
          <Button variant="neutral" class="flex-1" @click="showLogoutConfirm = false">Cancelar</Button>
          <Button variant="danger" class="flex-1" @click="confirmLogout">Aceptar</Button>
        </div>
      </div>
    </Modal>
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

import FooterPrincipal from './FooterPrincipal.vue';
import Button from '@/core/components/buttons/Button.vue';
import Modal from '@/core/components/overlays/Modal.vue';
import Dropdown from '@/core/components/overlays/Dropdown.vue';
import ModalLogin from '@/modules/m04-cuentas/components/auth/ModalLogin.vue';
import RegistroWizard from '@/modules/m04-cuentas/components/registro/RegistroWizard.vue';
import RecuperarPasswordWizard from '@/modules/m04-cuentas/components/recuperacion/RecuperarPasswordWizard.vue';
import type { TipoCuentaRegistro } from '@/modules/m04-cuentas/interfaces/registro.interface';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/m04-cuentas/store/auth.store';
import { watchEffect } from 'vue';

// Estado global local del layout para modales
const showLogin = ref(false);
const showWizard = ref(false);
const showRecover = ref(false);
const showLogoutConfirm = ref(false);

const router = useRouter();
const authStore = useAuthStore();

// Bloquear acceso a la vista pǧblica para administradores
watchEffect(() => {
  if (authStore.isAuthenticated) {
    const rol = authStore.user?.rol_nombre?.toLowerCase() || authStore.user?.tipo?.toLowerCase();
    if (rol === 'administrador' || rol === 'empleado' || rol === 'admin') {
      router.push('/admin');
    }
  }
});

const closeAllModals = () => {
  showLogin.value = false;
  showWizard.value = false;
  showRecover.value = false;
};

const openLogin = () => {
  closeAllModals();
  showLogin.value = true;
};

const openRegister = () => {
  closeAllModals();
  showWizard.value = true;
};

const openRecover = () => {
  closeAllModals();
  showRecover.value = true;
};

const handleLoginSuccess = () => {
  closeAllModals();
  const rol = authStore.user?.rol_nombre?.toLowerCase() || authStore.user?.tipo?.toLowerCase();
  if (rol === 'administrador' || rol === 'empleado' || rol === 'admin') {
    router.push('/admin');
  }
};

const handleLogout = () => {
  showLogoutConfirm.value = true;
};

const confirmLogout = () => {
  showLogoutConfirm.value = false;
  authStore.logout();
  router.push('/');
};

const handleWizardSuccess = (_tipoCuenta?: TipoCuentaRegistro) => {
  closeAllModals();
};

// Mock state for Shopping Cart UI. When backend/Pinia is ready, replace these with useCartStore()
const cartTotalItems = ref(0);
const cartTotalValue = ref('');

</script>
