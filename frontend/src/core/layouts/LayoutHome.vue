<template>
  <div class="flex min-h-screen min-w-0 flex-col bg-neutral-lightest font-sans">

    <!-- Top Bar Azul Oscuro -->
    <div class="hidden bg-corporate py-1.5 text-xs font-medium tracking-wide text-white xl:block">
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
    <header class="sticky top-0 z-40 w-screen border-b border-neutral-light bg-white shadow-sm xl:w-auto">
      <div class="container relative mx-auto flex h-20 w-full min-w-0 items-center justify-between px-4 lg:px-8">

        <!-- Logo y categorías -->
        <div class="flex min-w-0 items-center gap-6">
          <router-link to="/" class="flex-shrink-0 cursor-pointer">
            <img src="@/assets/logo.png" alt="Pintu Clic" class="h-10 object-contain" />
          </router-link>
          <button
            type="button"
            class="grid h-11 w-11 place-items-center rounded-button bg-action text-white shadow-sm xl:hidden"
            :aria-label="showMenuMovil ? 'Cerrar menú principal' : 'Abrir menú principal'"
            :aria-expanded="showMenuMovil"
            @click="openMenuMovil"
          >
            <MenuIcon class="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="hidden items-center gap-2 rounded-lg bg-action px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-action-hover xl:flex"
            @click="openCategorias"
          >
            <MenuIcon class="h-5 w-5" aria-hidden="true" />
            Categorías
            <ChevronDownIcon class="ml-1 h-4 w-4" aria-hidden="true" />
          </button>
        </div>


        <!-- Enlaces Principales -->
        <nav class="hidden shrink-0 items-center gap-4 whitespace-nowrap text-[15px] font-semibold text-neutral-dark xl:ml-4 xl:flex 2xl:ml-12 2xl:gap-6">
          <router-link 
            to="/" 
            class="relative py-1 cursor-pointer group transition-colors"
            :class="isActivo('/') ? 'text-action' : 'hover:text-action'"
          >
            Inicio
            <span 
              class="absolute bottom-0 left-0 w-full h-[2px] bg-action transition-transform origin-left"
              :class="isActivo('/') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"
            ></span>
          </router-link>
          <router-link 
            to="/catalogo" 
            class="relative py-1 cursor-pointer group transition-colors"
            :class="isActivo('/catalogo') ? 'text-action' : 'hover:text-action'"
          >
            Productos
            <span 
              class="absolute bottom-0 left-0 w-full h-[2px] bg-action transition-transform origin-left"
              :class="isActivo('/catalogo') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"
            ></span>
          </router-link>
          <a href="#" class="bg-[#D62828] hover:bg-[#B71C1C] text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider transition-colors cursor-pointer">OFERTAS</a>
          <a href="#" class="relative hover:text-action transition-colors py-1 cursor-pointer group">
            Servicios
            <span class="absolute bottom-0 left-0 w-full h-[2px] bg-action scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </a>
          <router-link 
            to="/paleta-colores" 
            class="relative py-1 cursor-pointer group transition-colors"
            :class="isActivo('/paleta-colores') ? 'text-action' : 'hover:text-action'"
          >
            Paleta de Color
            <span 
              class="absolute bottom-0 left-0 w-full h-[2px] bg-action transition-transform origin-left"
              :class="isActivo('/paleta-colores') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'"
            ></span>
          </router-link>
          <a href="#" class="relative hover:text-action transition-colors py-1 cursor-pointer group">
            Sobre Nosotros
            <span class="absolute bottom-0 left-0 w-full h-[2px] bg-action scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
          </a>
        </nav>

        <!-- Acciones Derecha -->
        <div class="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-3 lg:right-8 xl:static xl:ml-auto xl:translate-y-0 xl:gap-6">

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
          <button
            type="button"
            @click="router.push('/carrito')"
            class="relative flex items-center gap-2 text-neutral-dark hover:text-action transition-all duration-300 text-left cursor-pointer focus:outline-none"
            :class="{ '-translate-y-1': cartTotalItems > 0 }"
            aria-label="Ver carrito de compras"
          >
            <div class="relative">
              <ShoppingCartIcon class="w-7 h-7" />
              <span v-if="cartTotalItems > 0" class="absolute -top-1.5 -right-1.5 bg-highlight text-corporate text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
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
      <MenuNavegacionMovil
        :abierto="showMenuMovil"
        :cargando="cargandoCategoriasMovil"
        :error="errorCategoriasMovil"
        :categorias="categoriasMovil"
        :subcategoria-actual="Number(route.query.subcategoria) || undefined"
        @cerrar="showMenuMovil = false"
        @recargar-categorias="cargarCategoriasMovil"
        @seleccionar-todos="handleSelectTodos"
        @seleccionar="handleSelectSubcategoria"
      />
    </header>

    <!-- Slot Principal Dinámico (Vistas inyectadas por Vue Router) -->
    <main class="min-w-0 flex-1">
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

    <MenuCategoriasPublico
      :abierto="showCategorias"
      :cargando="cargandoCategorias"
      :categorias="categorias"
      @cerrar="showCategorias = false"
      @seleccionar-todos="handleSelectTodos"
      @seleccionar="handleSelectSubcategoria"
    />

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue';
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

import { Button, Dropdown, FooterPrincipal, Modal } from '@/core/components';
import ModalLogin from '@/modules/m04-cuentas/components/auth/ModalLogin.vue';
import RegistroWizard from '@/modules/m04-cuentas/components/registro/RegistroWizard.vue';
import RecuperarPasswordWizard from '@/modules/m04-cuentas/components/recuperacion/RecuperarPasswordWizard.vue';
import MenuCategoriasPublico from '@/modules/m01-catalogo/components/publicas/MenuCategoriasPublico.vue';
import MenuNavegacionMovil from '@/modules/m01-catalogo/components/publicas/MenuNavegacionMovil.vue';
import { CatalogoPublicoService } from '@/modules/m01-catalogo/services/publicas/catalogo-publico.service';
import type { CategoriaPublica } from '@/modules/m01-catalogo/interfaces/publicas/catalogo-publico.interface';
import type { TipoCuentaRegistro } from '@/modules/m04-cuentas/interfaces/registro.interface';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/m04-cuentas/store/auth.store';
import { useCartStore } from '@/modules/m05-carrito-compras/store/cart.store';
import { formatearCOP } from '@/core/utils/moneda';

// Estado global local del layout para modales
const showLogin = ref(false);
const showWizard = ref(false);
const showRecover = ref(false);
const showLogoutConfirm = ref(false);
const showCategorias = ref(false);
const showMenuMovil = ref(false);
const cargandoCategorias = ref(false);
const categorias = ref<readonly CategoriaPublica[]>([]);
const cargandoCategoriasMovil = ref(false);
const errorCategoriasMovil = ref(false);
const categoriasMovil = ref<readonly CategoriaPublica[]>([]);
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const isActivo = (path: string): boolean => {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
};

// Bloquear acceso a la vista pública para administradores
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
  showCategorias.value = false;
  showMenuMovil.value = false;
};

const cargarCategoriasMovil = async () => {
  cargandoCategoriasMovil.value = true;
  errorCategoriasMovil.value = false;
  try {
    categoriasMovil.value = await CatalogoPublicoService.listarCategorias();
  } catch {
    errorCategoriasMovil.value = true;
  } finally {
    cargandoCategoriasMovil.value = false;
  }
};

const openMenuMovil = () => {
  const abrir = !showMenuMovil.value;
  closeAllModals();
  showMenuMovil.value = abrir;
  if (abrir && categoriasMovil.value.length === 0) void cargarCategoriasMovil();
};

const openCategorias = async () => {
  closeAllModals();
  showCategorias.value = true;
  if (categorias.value.length > 0) return;
  cargandoCategorias.value = true;
  try {
    categorias.value = await CatalogoPublicoService.listarCategorias();
  } catch {
    categorias.value = [];
  } finally {
    cargandoCategorias.value = false;
  }
};

const handleSelectSubcategoria = (idSubcategoria: number) => {
  showCategorias.value = false;
  showMenuMovil.value = false;
  void router.push({ path: '/catalogo', query: { subcategoria: idSubcategoria } });
};

const handleSelectTodos = () => {
  showCategorias.value = false;
  showMenuMovil.value = false;
  void router.push({ path: '/catalogo' });
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

const cartStore = useCartStore();
const cartTotalItems = computed(() => cartStore.totalItems);
const cartTotalValue = computed(() => (cartStore.totalItems > 0 ? formatearCOP(cartStore.total) : ''));

onMounted(() => {
  void cartStore.loadCart();
});

</script>
