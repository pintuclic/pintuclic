<template>
  <!-- Catálogo Dummy -->
  <div class="container mx-auto px-4 py-8">
    <div class="bg-white p-8 rounded-2xl shadow-sm text-center">
      <h1 class="text-3xl font-bold text-corporate mb-4">Bienvenido a PintuClic</h1>
      <p class="text-neutral-medium max-w-2xl mx-auto mb-8">
        Explora nuestro cat�logo de productos. Haz clic en "Iniciar sesión" en la barra superior para ver el flujo completo de autenticación y registro.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="i in 3" :key="i" class="h-64 bg-neutral-lightest rounded-xl border border-neutral-light flex items-center justify-center transition-transform hover:-translate-y-1 hover:shadow-md cursor-pointer">
          <span class="text-neutral-medium font-medium">Producto de prueba {{ i }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// La vista de inicio ahora es un componente puro de contenido.
// El header, footer y los modales de autenticación son administrados por el LayoutHome a través de Vue Router.
</script>
