<template>
  <div
    class="fixed inset-0 z-50 flex justify-end bg-neutral-black/40"
    role="dialog"
    aria-modal="true"
    :aria-label="marca.id ? 'Editar marca' : 'Nueva marca'"
    @click.self="$emit('cerrar')"
  >
    <aside class="flex h-full w-full max-w-md flex-col bg-neutral-white shadow-xl">
      <header class="flex items-center justify-between border-b border-neutral-light p-5">
        <h2 class="text-base font-semibold text-neutral-black">
          {{ marca.id ? 'Editar marca' : 'Nueva marca' }}
        </h2>
        <button
          type="button"
          class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-lightest"
          aria-label="Cerrar"
          @click="$emit('cerrar')"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      <div class="flex-1 space-y-5 overflow-y-auto p-5">
        <!-- Logotipo -->
        <div class="flex items-center gap-4">
          <span class="grid h-16 w-16 shrink-0 place-items-center rounded-card border border-neutral-light bg-neutral-lightest text-sm font-semibold uppercase text-neutral-medium">
            <img v-if="marca.logoUrl" :src="marca.logoUrl" alt="Logotipo" class="h-full w-full rounded-card object-contain" />
            <template v-else>{{ (marca.nombre || 'MC').slice(0, 2) }}</template>
          </span>
          <div>
            <Button variant="outline" size="sm" :icon="Upload">
              Cambiar logotipo
            </Button>
            <p class="mt-1 text-xs text-neutral-medium">PNG, JPG o SVG. Máx. 2 MB. Recomendado: 300×300 px.</p>
          </div>
        </div>

        <!-- Nombre -->
        <label class="flex flex-col gap-1.5 text-sm">
          <span class="font-medium text-neutral-dark">Nombre de la marca <span class="text-action">*</span></span>
          <input
            :value="marca.nombre"
            type="text"
            class="rounded-input border border-neutral-light bg-neutral-white px-3 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
            :class="errores.nombre && 'border-highlight ring-2 ring-highlight/30'"
            @input="$emit('cambiar', { nombre: ($event.target as HTMLInputElement).value })"
          />
          <span v-if="errores.nombre" class="text-xs font-medium text-neutral-black">{{ errores.nombre }}</span>
        </label>

        <!-- Estado -->
        <label class="flex flex-col gap-1.5 text-sm">
          <span class="font-medium text-neutral-dark">Estado</span>
          <select
            :value="marca.estado"
            class="rounded-input border border-neutral-light bg-neutral-white px-3 py-2 text-sm text-neutral-dark outline-none focus:border-action"
            @change="$emit('cambiar', { estado: ($event.target as HTMLSelectElement).value === 'inactiva' ? 'inactiva' : 'activa' })"
          >
            <option value="activa">Activa</option>
            <option value="inactiva">Inactiva</option>
          </select>
        </label>

        <div class="flex gap-2 rounded-card bg-subaction p-3">
          <Info class="mt-0.5 h-4 w-4 shrink-0 text-corporate" aria-hidden="true" />
          <p class="text-xs text-neutral-dark">
            La marca se mostrará en el catálogo público únicamente si está activa.
          </p>
        </div>
      </div>

      <footer class="flex items-center justify-end gap-3 border-t border-neutral-light p-5">
        <Button variant="text" :disabled="guardando" @click="$emit('cerrar')">
          Cancelar
        </Button>
        <Button variant="action" :disabled="guardando" @click="$emit('guardar')">
          Guardar cambios
        </Button>
      </footer>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { X, Upload, Info } from 'lucide-vue-next';
import { Button } from '@/core/components';
import type { MarcaFormulario } from '../interfaces';

defineProps<{
  marca: MarcaFormulario;
  errores: Record<string, string>;
  guardando: boolean;
}>();

defineEmits<{
  (e: 'cerrar'): void;
  (e: 'cambiar', parcial: Partial<MarcaFormulario>): void;
  (e: 'guardar'): void;
}>();
</script>
