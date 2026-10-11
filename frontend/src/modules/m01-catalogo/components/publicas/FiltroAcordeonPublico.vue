<template>
  <!--
    Sección de filtro con apariencia de select desplegable: el botón resume la selección
    (visible aunque esté cerrado) y la lista se despliega en línea, dentro del único
    contenedor desplazable del panel (sin scroll propio ni capas flotantes recortadas).
  -->
  <section class="py-2">
    <h3 :id="`${id}-titulo`" class="px-1 pb-1.5 font-title text-xs font-semibold uppercase tracking-wide text-corporate">{{ titulo }}</h3>
    <button
      :id="`${id}-encabezado`"
      type="button"
      class="flex min-h-11 w-full items-center gap-2 border bg-neutral-white px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
      :class="abierto
        ? 'rounded-t-input border-action'
        : 'rounded-input border-neutral-light hover:border-action'"
      :aria-expanded="abierto"
      :aria-controls="`${id}-contenido`"
      :aria-labelledby="`${id}-titulo ${id}-encabezado`"
      @click="emit('alternar')"
    >
      <span class="min-w-0 flex-1 truncate" :class="seleccionados > 0 ? 'font-medium text-neutral-black' : 'text-neutral-medium'" :title="resumen">{{ resumen }}</span>
      <span
        v-if="seleccionados > 0"
        class="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-action px-1.5 text-[11px] font-semibold text-white"
        :aria-label="`${seleccionados} seleccionados`"
      >
        {{ seleccionados }}
      </span>
      <ChevronDown
        :size="17"
        class="shrink-0 text-neutral-medium transition-transform duration-200 motion-reduce:transition-none"
        :class="abierto ? 'rotate-180 text-action' : ''"
        aria-hidden="true"
      />
    </button>
    <!-- v-show: cerrar solo oculta; las selecciones no cambian. -->
    <div
      v-show="abierto"
      :id="`${id}-contenido`"
      role="group"
      :aria-labelledby="`${id}-titulo`"
      class="space-y-0.5 rounded-b-input border border-t-0 border-action bg-neutral-white px-1 py-1.5"
    >
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';

withDefaults(
  defineProps<{
    id: string;
    titulo: string;
    abierto: boolean;
    /** Texto del select cerrado: la selección actual o el valor por defecto. */
    resumen: string;
    /** Número de valores activos en esta sección (se muestra aunque esté cerrada). */
    seleccionados?: number;
  }>(),
  { seleccionados: 0 }
);

const emit = defineEmits<{ alternar: [] }>();
</script>
