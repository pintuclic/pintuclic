<template>
  <div class="min-h-screen flex bg-neutral-lightest font-sans">
    
    <!-- Sidebar / Menú Lateral -->
    <aside class="w-64 bg-neutral-white flex-shrink-0 hidden md:flex flex-col border-r border-neutral-light z-20">
      
      <!-- Logo o Branding -->
      <div class="h-20 flex items-center px-6 border-b border-neutral-light">
        <img src="@/assets/logo.png" alt="Pintu Clic" class="h-9 object-contain" />
      </div>

      <!-- Menú de Navegación (Acordeones) -->
      <nav class="flex-1 px-3 py-4 flex flex-col gap-2 overflow-y-auto">
        
        <!-- ============================================== -->
        <!-- 1. GESTIÓN ADMINISTRATIVA                      -->
        <!-- ============================================== -->
        <div class="flex flex-col">
          <button 
            @click="adminAbierto = !adminAbierto"
            class="flex items-center justify-between px-3 py-2.5 rounded-button hover:bg-neutral-lightest transition-colors w-full text-left font-medium text-neutral-dark cursor-pointer"
            :class="{ 'bg-neutral-lightest': adminAbierto }"
          >
            <div class="flex items-center gap-3 text-sm">
              <ShieldIcon class="w-5 h-5" />
              Gestión Administrativa
            </div>
            <ChevronDown 
              class="w-4 h-4 transition-transform duration-200" 
              :class="{ 'rotate-180': adminAbierto }" 
            />
          </button>
          
          <div v-show="adminAbierto" class="flex flex-col mt-1 mb-2 ml-4 pl-4 border-l border-neutral-light gap-1">
            <router-link to="/admin" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest transition-colors">
              <LayoutDashboard class="w-4 h-4 shrink-0" />
              Dashboard
            </router-link>
            <router-link to="/admin/usuarios" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest transition-colors">
              <UsersIcon class="w-4 h-4 shrink-0" />
              Usuarios / Personal
            </router-link>
            <router-link to="/admin/roles" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest transition-colors">
              <KeyIcon class="w-4 h-4 shrink-0" />
              Roles y Permisos
            </router-link>
            <router-link to="/admin/solicitudes" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest transition-colors">
              <BuildingIcon class="w-4 h-4 shrink-0" />
              Solicitudes B2B
            </router-link>
          </div>
        </div>

        <!-- ============================================== -->
        <!-- 2. GESTIÓN DE CATÁLOGO                         -->
        <!-- ============================================== -->
        <div class="flex flex-col mt-2">
          <button 
            @click="catalogoAbierto = !catalogoAbierto"
            class="flex items-center justify-between px-3 py-2.5 rounded-button hover:bg-neutral-lightest transition-colors w-full text-left font-medium text-neutral-dark cursor-pointer"
            :class="{ 'bg-neutral-lightest': catalogoAbierto }"
          >
            <div class="flex items-center gap-3 text-sm">
              <Package class="w-5 h-5" />
              Gestión de Catálogo
            </div>
            <ChevronDown 
              class="w-4 h-4 transition-transform duration-200" 
              :class="{ 'rotate-180': catalogoAbierto }" 
            />
          </button>
          
          <!-- Opciones exactas de la especificacion catálogo -->
          <div v-show="catalogoAbierto" class="flex flex-col mt-1 mb-2 ml-4 pl-4 border-l border-neutral-light gap-1">
            <router-link to="/admin/catalogo" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-neutral-white bg-action transition-colors">
              <LayoutDashboard class="w-4 h-4 shrink-0" />
              Dashboard
            </router-link>
            <router-link to="/admin/catalogo/productos" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest transition-colors">
              <Package class="w-4 h-4 shrink-0" />
              Productos
            </router-link>
            <router-link to="/admin/catalogo/variantes" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest transition-colors">
              <Layers class="w-4 h-4 shrink-0" />
              Variantes
            </router-link>
            <router-link to="/admin/catalogo/categorias" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest transition-colors">
              <LayoutGrid class="w-4 h-4 shrink-0" />
              Categorías
            </router-link>
            <router-link to="/admin/catalogo/marcas" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest transition-colors">
              <Tag class="w-4 h-4 shrink-0" />
              Marcas
            </router-link>
            <router-link to="/admin/catalogo/colores" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest transition-colors">
              <Droplet class="w-4 h-4 shrink-0" />
              Colores
            </router-link>
            <router-link to="/admin/catalogo/busquedas" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest transition-colors">
              <Search class="w-4 h-4 shrink-0" />
              Búsquedas
            </router-link>
            <router-link to="/admin/catalogo/reportes" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest transition-colors">
              <BarChart3 class="w-4 h-4 shrink-0" />
              Reportes
            </router-link>
            <router-link to="/admin/catalogo/configuracion" class="flex items-center gap-3 rounded-button px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest transition-colors">
              <Settings class="w-4 h-4 shrink-0" />
              Configuración
            </router-link>
          </div>
        </div>

      </nav>
      
      <!-- Footer del Sidebar exacto a como estaba en catálogo -->
      <div class="border-t border-neutral-light p-4">
        <div class="rounded-card bg-subaction p-4">
          <p class="text-sm font-semibold text-corporate">Hacemos crecer tu negocio</p>
          <p class="mt-1 text-xs text-neutral-medium">Más colores. Más proyectos. Más Colombia.</p>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      
      <!-- Topbar (Barra Superior) -->
      <header class="h-16 bg-neutral-white border-b border-neutral-light shadow-sm flex items-center justify-between px-6 z-10">
        
        <div class="flex items-center gap-4">
          <button class="md:hidden text-neutral-dark hover:text-action">
            <Menu class="w-6 h-6" />
          </button>
          <div class="font-bold text-corporate text-lg">Pintu Clic</div>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3 cursor-pointer group">
            <div class="text-right hidden sm:block">
              <div class="text-sm font-bold text-neutral-dark group-hover:text-action transition-colors">Administrador</div>
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { 
  Shield as ShieldIcon,
  Users as UsersIcon,
  Key as KeyIcon,
  Building as BuildingIcon,
  ChevronDown,
  LayoutDashboard,
  Package,
  Layers,
  LayoutGrid,
  Tag,
  Droplet,
  Search,
  BarChart3,
  Settings,
  Menu
} from 'lucide-vue-next';

const adminAbierto = ref(false);
const catalogoAbierto = ref(true);
</script>
