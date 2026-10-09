<template>
  <!--
    Estado de error de carga de M08. Sustituye a los antiguos datos de ejemplo: si la
    consulta falla, el usuario lo ve y puede reintentar; nunca se le muestran pedidos
    que no son suyos.
  -->
  <div
    role="alert"
    class="rounded-card border border-dashed border-neutral-light bg-white px-6 py-14 text-center"
  >
    <AlertIcon class="w-10 h-10 text-neutral-medium mx-auto mb-3" aria-hidden="true" />
    <h3 class="font-semibold text-neutral-black text-lg">{{ titulo }}</h3>
    <p class="text-neutral-medium text-sm mt-1 mb-5">{{ mensaje }}</p>
    <Button variant="action" :disabled="reintentando" @click="emit('reintentar')">
      {{ reintentando ? 'Reintentando…' : 'Reintentar' }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle as AlertIcon } from 'lucide-vue-next';
import { Button } from '@/core/components';

withDefaults(
  defineProps<{
    titulo?: string;
    mensaje?: string;
    reintentando?: boolean;
  }>(),
  {
    titulo: 'No pudimos cargar la información',
    mensaje: 'Hubo un problema de conexión con el servidor. Inténtalo de nuevo en unos segundos.',
    reintentando: false,
  }
);

const emit = defineEmits<{ reintentar: [] }>();
</script>
