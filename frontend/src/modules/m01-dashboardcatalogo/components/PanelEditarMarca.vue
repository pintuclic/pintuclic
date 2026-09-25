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
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-button border border-neutral-light px-3 py-1.5 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
            >
              <Upload class="h-4 w-4" aria-hidden="true" />
              Cambiar logotipo
            </button>
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

        <!-- Descripción -->
        <label class="flex flex-col gap-1.5 text-sm">
          <span class="flex items-baseline justify-between">
            <span class="font-medium text-neutral-dark">Descripción corta <span class="text-action">*</span></span>
            <span class="text-xs text-neutral-medium tabular-nums">{{ marca.descripcionCorta.length }}/120</span>
          </span>
          <textarea
            :value="marca.descripcionCorta"
            rows="3"
            maxlength="120"
            class="resize-y rounded-input border border-neutral-light bg-neutral-white px-3 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
            :class="errores.descripcionCorta && 'border-highlight ring-2 ring-highlight/30'"
            @input="$emit('cambiar', { descripcionCorta: ($event.target as HTMLTextAreaElement).value })"
          />
          <span v-if="errores.descripcionCorta" class="text-xs font-medium text-neutral-black">{{ errores.descripcionCorta }}</span>
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

        <!-- Líneas -->
        <div class="text-sm">
          <p class="mb-1.5 font-medium text-neutral-dark">
            Líneas de productos <span class="text-neutral-medium">({{ marca.lineas.length }})</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="linea in marca.lineas"
              :key="linea"
              class="inline-flex items-center gap-1 rounded-button bg-subaction px-2 py-0.5 text-xs font-medium text-corporate"
            >
              {{ linea }}
              <button
                type="button"
                class="grid h-4 w-4 place-items-center rounded-full hover:bg-action/20"
                :aria-label="`Quitar ${linea}`"
                @click="$emit('cambiar', { lineas: marca.lineas.filter((l) => l !== linea) })"
              >
                <X class="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-button border border-dashed border-neutral-light px-2 py-0.5 text-xs font-medium text-action hover:border-action"
              @click="agregarLinea"
            >
              <Plus class="h-3 w-3" aria-hidden="true" />
              Agregar línea
            </button>
          </div>
        </div>

        <div class="flex gap-2 rounded-card bg-subaction p-3">
          <Info class="mt-0.5 h-4 w-4 shrink-0 text-corporate" aria-hidden="true" />
          <p class="text-xs text-neutral-dark">
            La marca se mostrará en el catálogo público únicamente si está activa.
          </p>
        </div>
      </div>

      <footer class="flex items-center justify-end gap-3 border-t border-neutral-light p-5">
        <button
          type="button"
          class="rounded-button px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
          :disabled="guardando"
          @click="$emit('cerrar')"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-button bg-action px-4 py-2 text-sm font-medium text-neutral-white hover:bg-action-hover disabled:opacity-50"
          :disabled="guardando"
          @click="$emit('guardar')"
        >
          Guardar cambios
        </button>
      </footer>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { X, Upload, Plus, Info } from 'lucide-vue-next';
import type { MarcaFormulario } from '../interfaces';

const props = defineProps<{
  marca: MarcaFormulario;
  errores: Record<string, string>;
  guardando: boolean;
}>();

const emit = defineEmits<{
  (e: 'cerrar'): void;
  (e: 'cambiar', parcial: Partial<MarcaFormulario>): void;
  (e: 'guardar'): void;
}>();

/** Alta rápida de línea (sin backend, el nombre se pediría en un modal propio). */
function agregarLinea(): void {
  const nueva = `Nueva línea ${props.marca.lineas.length + 1}`;
  emit('cambiar', { lineas: [...props.marca.lineas, nueva] });
}
</script>
