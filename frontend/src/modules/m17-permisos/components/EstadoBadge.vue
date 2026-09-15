<script setup lang="ts">
import { computed } from 'vue';
import { Badge } from '@/core/components';
import type { Estado } from '../interfaces';
const props = defineProps<{ estado: Estado; table?: boolean }>();
const names: Record<Estado, string> = { activo: 'Activo', inactivo: 'Inactivo', bloqueado: 'Bloqueado', pendiente: 'Pendiente' };
const tone = computed(() => props.estado === 'activo' ? 'success' : props.estado === 'pendiente' ? 'warning' : 'neutral');
</script>
<template><Badge :tone="tone" :dot="!table">{{ names[estado] }}</Badge></template>
