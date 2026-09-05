<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../auth/useAuth';

const { currentUser, currentRole, simularUsuario, logout, can } = useAuth();
const isExpanded = ref(true);
// Permite visualizar el widget en vite dev, localhost y en el subdominio de testing del Product Owner (adsoproject.dev)
const isDev =
  import.meta.env.DEV ||
  (typeof globalThis.location !== 'undefined' &&
    (globalThis.location.hostname === 'localhost' ||
      globalThis.location.hostname === '127.0.0.1' ||
      globalThis.location.hostname.includes('adsoproject.dev')));
</script>

<template>
  <!-- Solo renderiza en entorno de desarrollo -->
  <aside
    v-if="isDev"
    class="fixed bottom-4 right-4 z-50 transition-all duration-200"
    aria-label="Simulador de Roles de Desarrollo"
  >
    <!-- Widget colapsado -->
    <button
      v-if="!isExpanded"
      type="button"
      @click="isExpanded = true"
      class="bg-corporate text-white font-bold px-3 py-2 rounded-full shadow-2xl border border-action/30 flex items-center gap-2 hover:bg-action active:scale-95 transition-all text-xs cursor-pointer"
      title="Abrir Simulador de Roles"
    >
      <span>🎭</span>
      <span class="capitalize font-mono">{{ currentRole }}</span>
    </button>

    <!-- Widget expandido -->
    <div
      v-else
      class="bg-neutral-white/95 backdrop-blur-md border-2 border-corporate rounded-2xl shadow-2xl p-4 w-80 text-neutral-black text-xs"
    >
      <!-- Cabecera -->
      <div class="flex items-center justify-between border-b border-neutral-light pb-2 mb-3">
        <div class="flex items-center gap-2">
          <span class="text-base">🎭</span>
          <div>
            <h4 class="font-extrabold text-corporate leading-tight">Simulador de Roles</h4>
            <span class="text-[10px] text-neutral-medium font-medium">Testing Frontend sin Login</span>
          </div>
        </div>
        <button
          type="button"
          @click="isExpanded = false"
          class="text-neutral-medium hover:text-neutral-black p-1 rounded-md text-sm cursor-pointer"
          title="Minimizar"
        >
          ✕
        </button>
      </div>

      <!-- Estado Actual -->
      <div class="bg-subaction/50 rounded-xl p-2.5 mb-3 border border-action/20">
        <div class="flex items-center justify-between mb-1">
          <span class="text-[10px] uppercase font-bold text-corporate tracking-wider">Identidad Activa:</span>
          <span
            class="px-2 py-0.5 rounded-full text-[10px] font-extrabold capitalize"
            :class="{
              'bg-corporate text-white': currentRole === 'administrador',
              'bg-action text-white': currentRole === 'empleado',
              'bg-conversion text-white': currentRole === 'cliente',
              'bg-highlight text-neutral-black': currentRole === 'empresa_vip',
              'bg-neutral-medium text-white': currentRole === 'anonimo'
            }"
          >
            {{ currentRole }}
          </span>
        </div>
        <p class="font-bold text-neutral-black truncate text-xs">
          {{ currentUser?.nombre || 'Visitante Anónimo' }}
        </p>
        <p class="text-[10px] text-neutral-medium truncate font-mono">
          {{ currentUser?.correo || 'Sin correo asociado' }}
        </p>
      </div>

      <!-- Botones de Acción Rápida -->
      <div class="space-y-1.5 mb-3">
        <span class="text-[10px] font-bold text-neutral-medium uppercase tracking-wider block">
          Cambiar de Perfil (1-Clic):
        </span>

        <div class="grid grid-cols-2 gap-1.5">
          <!-- Superadmin -->
          <button
            type="button"
            @click="simularUsuario('admin')"
            :class="currentRole === 'administrador' ? 'ring-2 ring-corporate font-black' : 'opacity-85 hover:opacity-100'"
            class="bg-corporate text-white py-1.5 px-2 rounded-lg font-bold text-left transition-all cursor-pointer flex items-center justify-between"
          >
            <span>👑 Admin</span>
            <span class="text-[9px] bg-white/20 px-1 rounded">ID: 1</span>
          </button>

          <!-- Empleado Parcial -->
          <button
            type="button"
            @click="simularUsuario('empleado_parcial')"
            :class="currentRole === 'empleado' ? 'ring-2 ring-action font-black' : 'opacity-85 hover:opacity-100'"
            class="bg-action text-white py-1.5 px-2 rounded-lg font-bold text-left transition-all cursor-pointer flex items-center justify-between"
          >
            <span>👷 Empleado</span>
            <span class="text-[9px] bg-white/20 px-1 rounded">ID: 2</span>
          </button>

          <!-- Cliente B2C -->
          <button
            type="button"
            @click="simularUsuario('cliente')"
            :class="currentRole === 'cliente' ? 'ring-2 ring-conversion-hover font-black' : 'opacity-85 hover:opacity-100'"
            class="bg-conversion text-white py-1.5 px-2 rounded-lg font-bold text-left transition-all cursor-pointer flex items-center justify-between"
          >
            <span>🛍️ Cliente</span>
            <span class="text-[9px] bg-white/20 px-1 rounded">ID: 3</span>
          </button>

          <!-- Empresa B2B -->
          <button
            type="button"
            @click="simularUsuario('empresa')"
            :class="currentRole === 'empresa_vip' ? 'ring-2 ring-corporate font-black' : 'opacity-85 hover:opacity-100'"
            class="bg-highlight text-neutral-black py-1.5 px-2 rounded-lg font-bold text-left transition-all cursor-pointer flex items-center justify-between"
          >
            <span>🏢 Empresa</span>
            <span class="text-[9px] bg-black/10 px-1 rounded">ID: 4</span>
          </button>
        </div>

        <!-- Cerrar Sesión / Anónimo -->
        <button
          type="button"
          @click="logout"
          class="w-full bg-neutral-light hover:bg-neutral-medium/20 text-neutral-dark py-1 px-2 rounded-lg font-semibold text-center transition-all cursor-pointer mt-1"
        >
          🚫 Salir / Probar como Anónimo
        </button>
      </div>

      <!-- Auditoría Rápida de Permisos Atómicos -->
      <div class="border-t border-neutral-light pt-2 text-[10px]">
        <div class="flex items-center justify-between mb-1">
          <span class="font-bold text-neutral-medium uppercase">Permisos Activos:</span>
          <span class="font-mono text-corporate font-extrabold">
            {{ currentUser?.permisos.includes('*') ? 'TOTAL (*)' : currentUser?.permisos.length || 0 }}
          </span>
        </div>
        <div class="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
          <span
            v-if="can('usuarios.gestionar')"
            class="bg-subaction text-corporate px-1.5 py-0.5 rounded text-[9px] font-semibold"
          >
            usuarios.gestionar
          </span>
          <span
            v-if="can('productos.crear')"
            class="bg-subaction text-corporate px-1.5 py-0.5 rounded text-[9px] font-semibold"
          >
            productos.crear
          </span>
          <span
            v-if="can('ordenes.ver')"
            class="bg-subaction text-corporate px-1.5 py-0.5 rounded text-[9px] font-semibold"
          >
            ordenes.ver
          </span>
          <span
            v-if="can('seguridad.configurar_sesion')"
            class="bg-subaction text-corporate px-1.5 py-0.5 rounded text-[9px] font-semibold"
          >
            seguridad.configurar_sesion
          </span>
          <span
            v-if="!currentUser || (!currentUser.permisos.includes('*') && currentUser.permisos.length === 0)"
            class="text-neutral-medium italic"
          >
            Sin permisos administrativos especiales.
          </span>
        </div>
      </div>
    </div>
  </aside>
</template>
