<template>
  <Modal :model-value="modelValue" :title="titulo" max-width="md" @update:model-value="cerrar">
    <div class="space-y-4 font-sans text-sm text-neutral-dark">
      <p>
        {{ modo === 'desactivar' ? '¿Deseas desactivar' : '¿Deseas reactivar' }}
        <strong class="font-semibold text-corporate">{{ nombre }}</strong>?
      </p>

      <template v-if="modo === 'desactivar'">
        <p v-if="consultando" class="text-neutral-medium" role="status">Calculando el impacto…</p>

        <!-- RF-CAT-09-03 / CA-CAT-01-05: se informa la cascada antes de confirmar. -->
        <Alert v-else-if="lineasImpacto.length" variant="warning" title="Esto dejará de verse en el catálogo público">
          <ul class="mt-1 list-disc space-y-0.5 pl-5">
            <li v-for="linea in lineasImpacto" :key="linea.clave">
              <span class="font-medium tabular-nums">{{ linea.cantidad }}</span> {{ linea.etiqueta }}
            </li>
          </ul>
        </Alert>

        <p v-else-if="impactoConsultado" class="text-neutral-medium">No hay elementos dependientes afectados.</p>
        <p v-if="!consultarImpacto" class="text-neutral-medium">
          El elemento dejará de ofrecerse, pero se conserva para el historial de órdenes (no se elimina).
        </p>
      </template>

      <p v-else class="text-neutral-medium">
        El servidor verificará que sus dependencias (marca, línea, base, color…) sigan activas.
      </p>

      <Alert v-if="error" variant="danger">{{ error }}</Alert>

      <div class="flex justify-end gap-3 pt-2">
        <Button variant="neutral" :disabled="ejecutando" @click="cerrar">Cancelar</Button>
        <Button
          :variant="modo === 'desactivar' ? 'danger' : 'conversion'"
          :disabled="ejecutando || consultando"
          @click="confirmar"
        >
          {{ ejecutando ? 'Procesando…' : modo === 'desactivar' ? 'Desactivar' : 'Reactivar' }}
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Alert, Button, Modal } from '@/core/components';
import { mensajeError } from '../../services/http';
import type { Impacto, ResultadoDesactivacion } from '../../interfaces';

/**
 * M01 - Confirmación de desactivación / reactivación (HU-CAT-09).
 *
 * Cubre las dos formas que expone el backend:
 *  - Categorías, subcategorías y líneas: `consultarImpacto = desactivar(id, false)`
 *    y `ejecutar = desactivar(id, true)`.
 *  - Marcas y productos: `consultarImpacto = impacto(id)` y `ejecutar = desactivar(id)`.
 *  - Bases, colores, resinas, presentaciones y variantes no informan impacto:
 *    se omite `consultarImpacto`.
 */
const props = defineProps<{
  modelValue: boolean;
  nombre: string;
  modo: 'desactivar' | 'reactivar';
  ejecutar: () => Promise<unknown>;
  consultarImpacto?: () => Promise<Impacto | ResultadoDesactivacion>;
}>();

const emit = defineEmits<{ 'update:modelValue': [valor: boolean]; completado: [] }>();

const ETIQUETAS: Record<string, string> = {
  productos_afectados: 'productos',
  subcategorias_afectadas: 'subcategorías',
  reglas_afectadas: 'reglas comerciales vigentes',
  lineas_afectadas: 'líneas',
  bases_afectadas: 'bases',
  colores_afectados: 'colores',
  variantes_afectadas: 'variantes',
  imagenes_afectadas: 'imágenes',
};

const impacto = ref<Record<string, unknown> | null>(null);
const impactoConsultado = ref(false);
const consultando = ref(false);
const ejecutando = ref(false);
const error = ref<string | null>(null);

const titulo = computed(() => (props.modo === 'desactivar' ? 'Confirmar desactivación' : 'Confirmar reactivación'));

const lineasImpacto = computed(() =>
  Object.entries(impacto.value ?? {})
    .filter(([clave, valor]) => clave in ETIQUETAS && typeof valor === 'number' && valor > 0)
    .map(([clave, valor]) => ({ clave, cantidad: valor as number, etiqueta: ETIQUETAS[clave] })),
);

watch(
  () => props.modelValue,
  async (abierto) => {
    if (!abierto) return;
    impacto.value = null;
    impactoConsultado.value = false;
    error.value = null;
    if (props.modo !== 'desactivar' || !props.consultarImpacto) return;
    consultando.value = true;
    try {
      impacto.value = { ...(await props.consultarImpacto()) };
      impactoConsultado.value = true;
    } catch (e) {
      error.value = mensajeError(e);
    } finally {
      consultando.value = false;
    }
  },
  { immediate: true },
);

function cerrar(): void {
  if (ejecutando.value) return;
  emit('update:modelValue', false);
}

async function confirmar(): Promise<void> {
  ejecutando.value = true;
  error.value = null;
  try {
    await props.ejecutar();
    emit('update:modelValue', false);
    emit('completado');
  } catch (e) {
    error.value = mensajeError(e);
  } finally {
    ejecutando.value = false;
  }
}
</script>
