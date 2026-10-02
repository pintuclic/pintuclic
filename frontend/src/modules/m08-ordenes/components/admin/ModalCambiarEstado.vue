<template>
  <!--
    HU-ORD-03 / CA-ORD-05-01 · «Cambiar estado de la orden»
    Modal sobre el detalle administrativo.

    La vista NO decide qué transiciones existen: ofrece exactamente las que el
    backend devuelve en `transiciones_permitidas`. Si llega vacío, el pedido está
    en un estado final y no se puede avanzar.
  -->
  <Modal :model-value="modelValue" title="Cambiar estado de la orden" max-width="lg" accent
    @update:model-value="emit('update:modelValue', $event)">
    <div class="flex flex-col gap-5">
      <!-- De dónde sale y a dónde va -->
      <div class="flex flex-wrap items-center gap-3 rounded-xl bg-neutral-lightest px-4 py-3">
        <div>
          <p class="text-xs text-neutral-medium">Orden</p>
          <p class="font-semibold text-neutral-black text-sm">{{ codigo }}</p>
        </div>
        <ArrowRightIcon class="w-4 h-4 text-neutral-medium mx-1" aria-hidden="true" />
        <div>
          <p class="text-xs text-neutral-medium">Estado actual</p>
          <span
            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold mt-0.5"
            :class="ESTADOS[estadoActual].clases"
          >
            {{ ESTADOS[estadoActual].etiqueta }}
          </span>
        </div>
      </div>

      <!-- Sin salidas posibles -->
      <div
        v-if="!transiciones.length"
        class="flex items-start gap-2.5 rounded-xl bg-neutral-lightest px-4 py-3.5 text-sm"
      >
        <InfoIcon class="w-4 h-4 text-neutral-medium shrink-0 mt-0.5" />
        <p class="text-neutral-dark">
          Esta orden está en un estado final: no admite más cambios.
        </p>
      </div>

      <template v-else>
        <!-- Elección del nuevo estado -->
        <fieldset class="flex flex-col gap-2">
          <legend class="text-sm font-medium text-neutral-dark mb-1.5">Nuevo estado</legend>
          <label
            v-for="destino in transiciones"
            :key="destino"
            class="flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors"
            :class="
              seleccionado === destino
                ? 'border-action bg-subaction/40'
                : 'border-neutral-light hover:border-action'
            "
          >
            <input
              v-model="seleccionado"
              type="radio"
              name="nuevo-estado"
              :value="destino"
              class="mt-1 accent-action"
            />
            <span class="min-w-0">
              <span class="block font-semibold text-neutral-black text-sm">
                {{ ESTADOS[destino].etiqueta }}
              </span>
              <span class="block text-neutral-medium text-xs mt-0.5">
                {{ DESCRIPCION_ETAPA[destino] }}
              </span>
            </span>
          </label>
        </fieldset>

        <!--
          El motivo es opcional para el backend, pero obligatorio aquí cuando se
          cancela o se marca una devolución: son las dos decisiones que el cliente
          verá reflejadas y que conviene poder justificar después.
        -->
        <Textarea
          v-model="motivo"
          :label="motivoObligatorio ? 'Motivo (obligatorio)' : 'Motivo (opcional)'"
          rows="3"
          maxlength="500"
          placeholder="Deja constancia de por qué cambia el estado…"
          :error="errorMotivo"
        />

        <Alert v-if="error" tone="danger">{{ error }}</Alert>
      </template>

      <!--
        Los botones van dentro del contenido: el Modal del núcleo solo expone el
        slot por defecto, no tiene uno de pie.
      -->
      <div class="flex flex-wrap justify-end gap-3 border-t border-neutral-lightest pt-5">
        <Button variant="outline" :disabled="guardando" @click="cerrar">Cancelar</Button>
        <Button
          v-if="transiciones.length"
          variant="primary"
          :disabled="!seleccionado || guardando"
          @click="confirmar"
        >
          {{ guardando ? 'Guardando…' : 'Confirmar cambio' }}
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ArrowRight as ArrowRightIcon, Info as InfoIcon } from 'lucide-vue-next';
import { Alert, Button, Modal, Textarea } from '@/core/components';
import { ESTADOS, DESCRIPCION_ETAPA } from '../../dtos/estado-pedido.dto';
import { CambioEstadoDto, exigeMotivo } from '../../dtos/cambio-estado.dto';
import { OrdenesService } from '../../services/ordenes.service';
import type { EstadoOrden, ResultadoCambioEstado } from '../../interfaces/ordenes.interface';

const props = defineProps<{
  modelValue: boolean;
  codigo: string;
  estadoActual: EstadoOrden;
  transiciones: ReadonlyArray<EstadoOrden>;
}>();

const emit = defineEmits<{
  'update:modelValue': [boolean];
  /** El padre recarga el detalle con el resultado ya confirmado por el servidor. */
  cambiado: [ResultadoCambioEstado];
}>();

const seleccionado = ref<EstadoOrden | ''>('');
const motivo = ref('');
const errorMotivo = ref('');
const error = ref('');
const guardando = ref(false);

const motivoObligatorio = computed(() => exigeMotivo(seleccionado.value, props.estadoActual));

/** Cada apertura empieza limpia: un motivo de otra orden no debe arrastrarse. */
watch(
  () => props.modelValue,
  (abierto) => {
    if (!abierto) return;
    seleccionado.value = '';
    motivo.value = '';
    errorMotivo.value = '';
    error.value = '';
  }
);

function cerrar(): void {
  emit('update:modelValue', false);
}

async function confirmar(): Promise<void> {
  if (!seleccionado.value) return;
  errorMotivo.value = '';
  error.value = '';

  // La regla vive en el DTO del módulo, nunca inline en el componente (Directiva 12).
  const validacion = CambioEstadoDto.safeParse({
    estado: seleccionado.value,
    motivo: motivo.value,
    estadoActual: props.estadoActual,
  });
  if (!validacion.success) {
    errorMotivo.value = validacion.error.issues[0]?.message ?? 'Revisa los datos.';
    return;
  }

  guardando.value = true;
  try {
    const resultado = await OrdenesService.cambiarEstado(
      props.codigo,
      seleccionado.value,
      motivo.value
    );
    emit('cambiado', resultado);
    cerrar();
  } catch (e: unknown) {
    // El backend es la autoridad sobre qué transiciones valen: se muestra su mensaje.
    const err = e as { response?: { data?: { error?: { message?: string } }; status?: number } };
    error.value =
      err.response?.data?.error?.message ??
      (err.response?.status === 403
        ? 'Tu cuenta no tiene permiso para gestionar órdenes.'
        : 'No se pudo cambiar el estado. Inténtalo de nuevo.');
  } finally {
    guardando.value = false;
  }
}
</script>
