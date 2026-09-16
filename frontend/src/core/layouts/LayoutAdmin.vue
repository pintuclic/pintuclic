<template>
  <div class="h-screen bg-neutral-lightest flex overflow-hidden">
    
    <!-- Mobile Sidebar Overlay -->
    <div 
      v-if="isMobileSidebarOpen" 
      class="fixed inset-0 bg-neutral-dark/50 z-10 md:hidden"
      @click="isMobileSidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside 
      class="bg-neutral-white border-r border-subaction shadow-[4px_0_24px_rgba(8,119,232,0.05)] flex flex-col transition-all duration-300 fixed md:relative z-20 h-full"
      :class="[
        isSidebarCollapsed ? 'w-20' : 'w-72',
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'md:translate-x-0'
      ]"
    >
      <div class="h-20 flex items-center px-4 shrink-0 transition-all duration-300" :class="isSidebarCollapsed ? 'justify-center' : 'justify-between'">
        <router-link to="/admin" class="flex items-center justify-center h-full">
          <img :src="logoSrc" alt="Pintu Clic" class="object-contain transition-all duration-300" :class="isSidebarCollapsed ? 'w-10 h-10' : 'w-32 h-14'" />
        </router-link>
        <button @click="isSidebarCollapsed = !isSidebarCollapsed" class="hidden md:block text-neutral-medium hover:text-action transition-colors cursor-pointer">
          <ChevronLeftIcon v-if="!isSidebarCollapsed" class="w-5 h-5" />
          <ChevronRightIcon v-else class="w-5 h-5" />
        </button>
      </div>
      
      <nav class="flex-1 overflow-y-auto p-4 custom-scrollbar">
        
        <!-- 1. GESTIÓN ADMINISTRATIVA -->
        <div class="flex flex-col mt-2">
          <button 
            @click="adminAbierto = !adminAbierto; if(isSidebarCollapsed) isSidebarCollapsed = false;"
            class="flex items-center rounded-button hover:bg-subaction hover:text-action transition-colors w-full cursor-pointer group"
            :class="[
              adminAbierto ? 'text-action' : 'text-corporate',
              isSidebarCollapsed ? 'p-3 justify-center' : 'px-3 py-2.5 justify-between'
            ]"
            title="Gestión Administrativa"
          >
            <div class="flex items-center gap-3 text-sm font-medium">
              <ShieldIcon class="w-5 h-5 shrink-0" />
              <span v-show="!isSidebarCollapsed" class="whitespace-nowrap">Gestión Administrativa</span>
            </div>
            <ChevronDownIcon 
              v-show="!isSidebarCollapsed"
              class="w-4 h-4 transition-transform duration-200" 
              :class="{ 'rotate-180': adminAbierto }" 
            />
          </button>
          
          <div v-show="adminAbierto && !isSidebarCollapsed" class="flex flex-col mt-1 mb-2 ml-4 pl-4 border-l border-subaction gap-1">
            <router-link to="/admin" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-corporate hover:bg-subaction hover:text-action transition-colors">
              <LayoutDashboardIcon class="w-4 h-4 shrink-0" />
              Dashboard
            </router-link>
            <router-link to="/admin/empleados" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-corporate hover:bg-subaction hover:text-action transition-colors">
              <UsersIcon class="w-4 h-4 shrink-0" />
              Personal / Empleados
            </router-link>
            <router-link to="/admin/permisos" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-corporate hover:bg-subaction hover:text-action transition-colors">
              <KeyIcon class="w-4 h-4 shrink-0" />
              Roles y Permisos
            </router-link>
            <router-link to="/admin/clientes" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-corporate hover:bg-subaction hover:text-action transition-colors">
              <UsersIcon class="w-4 h-4 shrink-0" />
              Clientes
            </router-link>
            <router-link to="/admin/solicitudes" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-corporate hover:bg-subaction hover:text-action transition-colors">
              <BuildingIcon class="w-4 h-4 shrink-0" />
              Aprobación Empresas
            </router-link>
            <router-link to="/admin/perfil" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-corporate hover:bg-subaction hover:text-action transition-colors">
              <UserIcon class="w-4 h-4 shrink-0" />
              Mi Perfil
            </router-link>
            <router-link to="/admin/configuracion" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-corporate hover:bg-subaction hover:text-action transition-colors">
              <SettingsIcon class="w-4 h-4 shrink-0" />
              Configuración
            </router-link>
          </div>
        </div>

        <!-- 2. GESTIÓN DE CATÁLOGO -->
        <div class="flex flex-col mt-2">
          <button 
            @click="catalogoAbierto = !catalogoAbierto; if(isSidebarCollapsed) isSidebarCollapsed = false;"
            class="flex items-center rounded-button hover:bg-subaction hover:text-action transition-colors w-full cursor-pointer group"
            :class="[
              catalogoAbierto ? 'text-action' : 'text-corporate',
              isSidebarCollapsed ? 'p-3 justify-center' : 'px-3 py-2.5 justify-between'
            ]"
            title="Gestión de Catálogo"
          >
            <div class="flex items-center gap-3 text-sm font-medium">
              <PackageIcon class="w-5 h-5 shrink-0" />
              <span v-show="!isSidebarCollapsed" class="whitespace-nowrap">Gestión de Catálogo</span>
            </div>
            <ChevronDownIcon 
              v-show="!isSidebarCollapsed"
              class="w-4 h-4 transition-transform duration-200" 
              :class="{ 'rotate-180': catalogoAbierto }" 
            />
          </button>
          
          <div v-show="catalogoAbierto && !isSidebarCollapsed" class="flex flex-col mt-1 mb-2 ml-4 pl-4 border-l border-subaction gap-1">
            <router-link to="/admin/catalogo/productos" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-corporate hover:bg-subaction hover:text-action transition-colors">
              <PackageIcon class="w-4 h-4 shrink-0" />
              Productos
            </router-link>
            <router-link to="/admin/catalogo/variantes" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-corporate hover:bg-subaction hover:text-action transition-colors">
              <LayersIcon class="w-4 h-4 shrink-0" />
              Variantes
            </router-link>
            <router-link to="/admin/catalogo/categorias" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-corporate hover:bg-subaction hover:text-action transition-colors">
              <LayoutGridIcon class="w-4 h-4 shrink-0" />
              Categorías
            </router-link>
            <router-link to="/admin/catalogo/lineas" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-corporate hover:bg-subaction hover:text-action transition-colors">
              <GitCommitIcon class="w-4 h-4 shrink-0" />
              Líneas
            </router-link>
            <router-link to="/admin/catalogo/marcas" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-corporate hover:bg-subaction hover:text-action transition-colors">
              <TagIcon class="w-4 h-4 shrink-0" />
              Marcas
            </router-link>
            <router-link to="/admin/catalogo/colores" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-corporate hover:bg-subaction hover:text-action transition-colors">
              <DropletIcon class="w-4 h-4 shrink-0" />
              Colores
            </router-link>
            <router-link to="/admin/catalogo/busquedas-sin-resultado" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-corporate hover:bg-subaction hover:text-action transition-colors">
              <SearchIcon class="w-4 h-4 shrink-0" />
              Búsquedas
            </router-link>
          </div>
        </div>

      </nav>
      
      <!-- Footer del Sidebar -->
      <div class="border-t border-subaction p-4">
        <button 
          @click="handleLogout" 
          class="flex items-center justify-center gap-2 rounded-button bg-neutral-lightest hover:bg-danger hover:text-white text-danger py-2 transition-colors font-medium cursor-pointer"
          :class="isSidebarCollapsed ? 'w-12 h-12 mx-auto px-0 rounded-full' : 'w-full px-4'"
          title="Cerrar sesión"
        >
          <LogOutIcon class="w-5 h-5 shrink-0" />
          <span v-show="!isSidebarCollapsed">Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col h-screen min-w-0">
      
      <!-- Topbar (Barra Superior) -->
      <header class="h-16 bg-neutral-white border-b border-subaction shadow-[0_4px_24px_rgba(8,119,232,0.05)] flex items-center justify-between px-6 shrink-0 z-10">
        
        <div class="flex items-center gap-4">
          <button @click="isMobileSidebarOpen = !isMobileSidebarOpen" class="md:hidden text-corporate hover:text-action">
            <MenuIcon class="w-6 h-6" />
          </button>
          <div class="font-bold text-corporate text-lg md:hidden">Pintu Clic</div>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3 cursor-pointer group">
            <div class="text-right hidden sm:block">
              <div class="text-sm font-bold text-corporate group-hover:text-action transition-colors">Administrador</div>
            </div>
            <div class="w-9 h-9 bg-corporate text-neutral-white rounded-full flex items-center justify-center font-bold">
              A
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 overflow-auto bg-neutral-lightest p-6">
        <router-view />
      </main>
      
    </div>

    <!-- Modal Confirmación Cerrar Sesión -->
    <Modal v-model="showLogoutConfirm" maxWidth="sm">
      <div class="text-center py-4">
        <h3 class="text-xl font-bold text-corporate mb-2">¿Cerrar sesión?</h3>
        <p class="text-neutral-medium text-sm mb-6">¿Estás seguro de que deseas salir de tu cuenta?</p>
        <div class="flex gap-3 justify-center">
          <button class="flex-1 py-2 px-4 rounded-lg border border-neutral-light text-neutral-dark font-semibold hover:bg-neutral-lightest transition-colors cursor-pointer" @click="showLogoutConfirm = false">Cancelar</button>
          <button class="flex-1 py-2 px-4 rounded-lg bg-danger text-white font-semibold hover:bg-danger-hover transition-colors cursor-pointer" @click="confirmLogout">Aceptar</button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/m04-cuentas/store/auth.store';
import logoSrc from '@/assets/Pintu_Transparent.png';
import Modal from '@/core/components/overlays/Modal.vue';
import { 
  Shield as ShieldIcon,
  Users as UsersIcon,
  Key as KeyIcon,
  Building as BuildingIcon,
  ChevronDown as ChevronDownIcon,
  LayoutDashboard as LayoutDashboardIcon,
  Package as PackageIcon,
  Layers as LayersIcon,
  LayoutGrid as LayoutGridIcon,
  Tag as TagIcon,
  Droplet as DropletIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  LogOut as LogOutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  User as UserIcon,
  GitCommit as GitCommitIcon
} from 'lucide-vue-next';

const adminAbierto = ref(false);
const catalogoAbierto = ref(true);

const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);
const showLogoutConfirm = ref(false);

const router = useRouter();
const authStore = useAuthStore();

const handleLogout = () => {
  showLogoutConfirm.value = true;
};

const confirmLogout = () => {
  showLogoutConfirm.value = false;
  authStore.logout();
  router.push('/');
};
</script>

<style scoped>
nav a.router-link-exact-active {
  background-color: var(--color-action);
  color: var(--color-neutral-white);
}
</style>
