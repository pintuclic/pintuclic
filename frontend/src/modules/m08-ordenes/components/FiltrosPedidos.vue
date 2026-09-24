<template>
  <div class="flex flex-wrap gap-2" role="group" aria-label="Filtrar pedidos por estado">
    <button
      v-for="f in FILTROS"
      :key="f.id"
      type="button"
      :aria-pressed="modelValue === f.id"
      class="inline-flex items-center gap-2 rounded-button px-4 py-2 text-sm font-medium transition-colors"
      :class="
        modelValue === f.id
          ? 'bg-action text-white'
          : 'bg-white text-neutral-dark border border-neutral-light hover:border-action hover:text-action'
      "
      @click="emit('update:modelValue', f.id)"
    >
      <component :is="ICONOS[f.id]" class="w-4 h-4 shrink-0" />
      {{ f.etiqueta }}
    </button>
  </div>
</template>

<script setup lang="ts">
import {
  LayoutGrid as TodosIcon,
  Hourglass as ProcesoIcon,
  Truck as EnviadoIcon,
  CheckCircle2 as EntregadoIcon,
  XCircle as CanceladoIcon,
} from 'lucide-vue-next';
import type { Component } from 'vue';
import { FILTROS } from '../dtos/estado-pedido.dto';

defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [string] }>();

/** Un icono por filtro, siguiendo el mockup «Mi-Perfil_Usuario natural». */
const ICONOS: Record<string, Component> = {
  todos: TodosIcon,
  proceso: ProcesoIcon,
  enviado: EnviadoIcon,
  entregado: EntregadoIcon,
  cancelado: CanceladoIcon,
};
</script>
