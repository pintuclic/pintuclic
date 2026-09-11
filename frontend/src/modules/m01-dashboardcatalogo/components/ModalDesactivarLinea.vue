<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-black/40 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="titulo-desactivar-linea"
    @click.self="$emit('cerrar')"
  >
    <div class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card bg-neutral-white shadow-xl">
      <!-- Encabezado -->
      <header class="flex items-start gap-3 p-5">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-highlight/15 text-highlight">
          <AlertTriangle class="h-5 w-5" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <h2 id="titulo-desactivar-linea" class="text-base font-semibold text-neutral-black">
            Desactivar línea comercial
          </h2>
          <p class="mt-0.5 text-sm text-neutral-medium">
            Esta acción cambiará el estado de la línea y afectará los productos y reglas asociadas.
            ¿Estás seguro de continuar?
          </p>
        </div>
        <button
          type="button"
          class="ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-button text-neutral-medium hover:bg-neutral-lightest"
          aria-label="Cerrar"
          @click="$emit('cerrar')"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div class="space-y-4 px-5 pb-5">
        <!-- Línea afectada -->
        <div class="flex items-center gap-3 rounded-card border border-neutral-light bg-neutral-lightest p-3">
          <span class="grid h-9 w-9 shrink-0 place-items-center rounded-card bg-subaction text-corporate">
            <Layers class="h-4 w-4" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <p class="font-medium text-neutral-black">{{ linea.nombre }}</p>
            <p class="truncate text-xs text-neutral-medium">{{ linea.descripcionCorta }}</p>
          </div>
          <span class="ml-auto shrink-0 rounded-button bg-neutral-light px-2 py-0.5 text-[11px] font-medium text-neutral-medium">
            {{ linea.marca }}
          </span>
        </div>

        <!-- Impacto -->
        <div>
          <p class="mb-2 text-sm font-semibold text-neutral-black">Impacto de esta acción</p>
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-card bg-conversion/10 p-3">
              <Package class="h-5 w-5 text-conversion" aria-hidden="true" />
              <p class="mt-1.5 text-lg font-bold text-neutral-black tabular-nums">
                {{ formatearNumero(linea.productosAsociados) }}
              </p>
              <p class="text-[11px] text-neutral-medium">
                Productos asociados. Quedarán sin línea visible.
              </p>
            </div>
            <div class="rounded-card bg-subaction p-3">
              <Tag class="h-5 w-5 text-corporate" aria-hidden="true" />
              <p class="mt-1.5 text-lg font-bold text-neutral-black tabular-nums">
                {{ reglasVigentes }}
              </p>
              <p class="text-[11px] text-neutral-medium">
                Reglas vigentes (búsqueda, filtros y promociones).
              </p>
            </div>
          </div>
        </div>

        <!-- ¿Qué sucederá? -->
        <div>
          <p class="mb-2 text-sm font-semibold text-neutral-black">¿Qué sucederá?</p>
          <ul class="space-y-2 text-xs text-neutral-dark">
            <li v-for="(consecuencia, i) in CONSECUENCIAS" :key="i" class="flex items-start gap-2">
              <component :is="consecuencia.icono" class="mt-0.5 h-4 w-4 shrink-0 text-neutral-medium" aria-hidden="true" />
              <span>{{ consecuencia.texto }}</span>
            </li>
          </ul>
        </div>

        <!-- Confirmación -->
        <label class="flex cursor-pointer items-start gap-2.5 rounded-card border border-neutral-light bg-neutral-lightest p-3 text-xs text-neutral-dark">
          <input
            type="checkbox"
            class="mt-0.5 h-4 w-4 shrink-0 accent-action"
            :checked="confirmado"
            @change="confirmado = ($event.target as HTMLInputElement).checked"
          />
          <span>
            Entiendo las consecuencias de esta acción y confirmo que deseo desactivar la línea
            comercial <strong>“{{ linea.nombre }}”</strong>.
          </span>
        </label>
      </div>

      <!-- Pie -->
      <footer class="flex flex-wrap items-center justify-end gap-3 border-t border-neutral-light p-4">
        <button
          type="button"
          class="rounded-button px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
          @click="$emit('cerrar')"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-button border border-neutral-light bg-neutral-white px-4 py-2 text-sm font-medium text-action hover:bg-subaction"
          @click="$emit('ver-dependencias', linea)"
        >
          <ExternalLink class="h-4 w-4" aria-hidden="true" />
          Ver dependencias
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-button bg-corporate px-4 py-2 text-sm font-medium text-neutral-white hover:bg-corporate/90 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!confirmado"
          @click="$emit('confirmar', linea)"
        >
          <Power class="h-4 w-4" aria-hidden="true" />
          Desactivar línea
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  AlertTriangle,
  X,
  Layers,
  Package,
  Tag,
  MinusCircle,
  EyeOff,
  Settings,
  RotateCcw,
  ExternalLink,
  Power,
} from 'lucide-vue-next';
import type { Component } from 'vue';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
import type { LineaListado } from '../interfaces';

/**
 * Modal de confirmación para desactivar una línea comercial (maqueta ADMIN 17).
 * El botón destructivo usa el token `corporate` (no hay rojo en el design system).
 */
const props = defineProps<{ linea: LineaListado }>();

defineEmits<{
  (e: 'cerrar'): void;
  (e: 'confirmar', linea: LineaListado): void;
  (e: 'ver-dependencias', linea: LineaListado): void;
}>();

const { formatearNumero } = useFormatoCatalogo();

const confirmado = ref(false);

// Reglas vigentes de ejemplo derivadas del volumen de productos (sin backend).
const reglasVigentes = computed(() => Math.max(1, Math.round(props.linea.productosAsociados / 6)));

const CONSECUENCIAS: { icono: Component; texto: string }[] = [
  { icono: MinusCircle, texto: 'La línea cambiará a estado Inactiva y no se mostrará en el catálogo público.' },
  { icono: EyeOff, texto: 'Los productos asociados mantendrán su información, pero no se mostrarán bajo esta línea.' },
  { icono: Settings, texto: 'Las reglas de búsqueda, filtros y promociones asociadas se desactivarán.' },
  { icono: RotateCcw, texto: 'Podrás reactivar la línea en cualquier momento.' },
];
</script>
