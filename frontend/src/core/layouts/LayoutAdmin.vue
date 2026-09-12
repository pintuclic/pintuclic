<template>
  <div class="min-h-screen flex bg-neutral-lightest">
    <!-- Sidebar -->
    <aside class="w-64 bg-corporate text-white flex-shrink-0 hidden md:flex flex-col">
      <div class="p-6 border-b border-white/10">
        <h2 class="text-xl font-bold">Admin Panel</h2>
      </div>
      <nav class="flex-1 p-4 flex flex-col gap-2">
        <!-- Enlaces de navegación simulados para otros módulos -->
        <a href="#" class="px-4 py-2 hover:bg-white/10 rounded-md transition-colors">Dashboard</a>
        <a href="#" class="px-4 py-2 hover:bg-white/10 rounded-md transition-colors">Catálogo</a>
        <a href="#" class="px-4 py-2 hover:bg-white/10 rounded-md transition-colors">Ventas</a>
        <a href="#" class="px-4 py-2 hover:bg-white/10 rounded-md transition-colors">Personal</a>
      </nav>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Topbar Admin -->
      <header class="h-16 bg-white border-b border-neutral-light shadow-sm flex items-center justify-between px-6">
        <div class="font-semibold text-neutral-dark">Pintu Clic Administración</div>
        <div class="flex items-center gap-4">
          <span class="text-sm font-medium text-neutral-medium">Admin Usuario</span>
          <div class="w-8 h-8 bg-neutral-light rounded-full"></div>
        </div>
      </header>

      <!-- Vistas hijas del admin -->
      <main class="flex-1 p-6 overflow-auto">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// Layout maestro para el panel de administración
</script>
