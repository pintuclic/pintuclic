<template>
  <div class="bg-white rounded-2xl p-6 shadow-sm border border-neutral-light text-center">
    <div class="w-10 h-10 bg-neutral-lightest rounded-full flex items-center justify-center mx-auto mb-3">
      <HeadphonesIcon class="w-5 h-5 text-neutral-dark" />
    </div>
    <h3 class="text-corporate font-title font-semibold text-base mb-1">¿Necesitas ayuda?</h3>
    <p class="text-neutral-medium text-xs mb-4">Nuestro equipo está listo para asesorarte.</p>
    <Button variant="corporate" class="w-full text-xs shadow-sm">
      Contactar soporte
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/core/components';
import { Headphones as HeadphonesIcon } from 'lucide-vue-next';
</script>
