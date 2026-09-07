<template>
  <div class="flex items-center gap-3 mb-6">
    <img src="@/assets/logo.png" alt="PintuClic" class="w-9 h-9 rounded-lg object-contain" />
    <span class="text-lg font-heading font-bold text-corporate">PintuClic</span>
  </div>
</template>

<script setup lang="ts">
/**
 * Encabezado de marca reutilizable para todo modal del sitio (Guía UI 4.2:
 * cada modal debe incluir "PintuClic" + logo).
 *
 * Responsabilidad única: identidad de marca dentro del contenido del modal.
 * No sabe nada del formulario, el paso o el flujo que lo contiene, ni del
 * cierre del modal (eso ya lo resuelve ModalBase con su botón "X" propio).
 * Por eso vive junto a ModalBase, Boton y Entrada en core/components — es
 * design system base, no algo específico de autenticación: cualquier modal
 * del sitio (no solo los de m04-cuentas) lo puede usar tal cual.
 */
</script>
