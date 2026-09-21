<template>
  <div class="space-y-5 p-6 lg:p-8">
    <Button variant="text" :icon="ArrowLeft" @click="irA('/admin/catalogo/lineas')">
      Volver a líneas comerciales
    </Button>

    <div>
      <h1 class="text-2xl font-bold text-neutral-black">
        {{ modo === 'editar' ? 'Editar línea comercial' : 'Crear línea comercial' }}
      </h1>
      <p class="mt-1 text-sm text-neutral-medium">
        Indica el nombre, la marca y —si aplica— la gama comercial de la línea.
      </p>
    </div>

    <p
      v-if="guardadoOk"
      class="rounded-card border border-conversion/40 bg-conversion/10 px-4 py-3 text-sm text-neutral-dark"
    >
      Cambios guardados. La línea quedó como <strong>{{ ETIQUETA_ESTADO[formulario.estado] }}</strong>.
    </p>
    <p
      v-else-if="error"
      class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
    >
      {{ error }}
    </p>

    <div v-if="cargando" class="grid gap-5 lg:grid-cols-3">
      <div class="h-64 animate-pulse rounded-card bg-neutral-white lg:col-span-2" />
      <div class="h-64 animate-pulse rounded-card bg-neutral-white" />
    </div>

    <div v-else class="grid gap-5 lg:grid-cols-3">
      <!-- Columna principal -->
      <div class="lg:col-span-2">
        <TarjetaSeccionFormulario
          titulo="Información de la línea"
          descripcion="Nombre y marca son obligatorios; la gama comercial es opcional."
          :icono="Info"
        >
          <Input name="nombre" label="Nombre de la línea" placeholder="Ej. Viniltex Advanced" />

          <div class="grid gap-4 sm:grid-cols-2">
            <CampoFormulario etiqueta="Marca" requerido :error="erroresValidacion.marcaId">
              <template #default="{ id }">
                <select
                  :id="id"
                  :value="formulario.marcaId"
                  :class="[claseInput, erroresValidacion.marcaId && claseError]"
                  @change="set({ marcaId: ($event.target as HTMLSelectElement).value })"
                >
                  <option value="">Selecciona…</option>
                  <option v-for="op in opciones.marcas" :key="op.valor" :value="op.valor">
                    {{ op.etiqueta }}
                  </option>
                </select>
              </template>
            </CampoFormulario>

            <div class="flex flex-col gap-1">
              <Input name="gamaComercial" label="Gama comercial" placeholder="Ej. Premium, Profesional, Estándar…" />
              <span class="text-xs text-neutral-medium">Opcional.</span>
            </div>
          </div>

          <CampoFormulario etiqueta="Estado">
            <template #default="{ id }">
              <select
                :id="id"
                :value="formulario.estado"
                :class="claseInput"
                @change="set({ estado: ($event.target as HTMLSelectElement).value as EstadoLinea })"
              >
                <option value="activa">Activa</option>
                <option value="pausada">Pausada</option>
                <option value="inactiva">Inactiva</option>
              </select>
            </template>
          </CampoFormulario>
        </TarjetaSeccionFormulario>
      </div>

      <!-- Aside -->
      <aside class="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
          <header class="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-black">
            <Eye class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
            Vista previa de la línea
          </header>
          <div class="mt-3 space-y-2">
            <p class="text-xs text-neutral-medium">{{ marcaEtiqueta || 'Marca' }}</p>
            <p class="text-base font-semibold text-neutral-black">
              {{ formulario.nombre || 'Nombre de la línea' }}
            </p>
            <p v-if="formulario.gamaComercial" class="text-xs text-neutral-medium">
              {{ formulario.gamaComercial }}
            </p>
            <span
              class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
              :class="CLASES_ESTADO[formulario.estado]"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
              {{ ETIQUETA_ESTADO[formulario.estado] }}
            </span>
          </div>
        </section>

        <ChecklistPublicacion :checklist="checklist" :progreso="progresoChecklist" />
      </aside>
    </div>
  </div>

  <!-- Barra de acciones (pie fijo) -->
  <div
    class="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-neutral-light bg-neutral-white/95 px-6 py-3 backdrop-blur"
  >
    <p v-if="!puedePublicar" class="mr-auto text-xs text-neutral-medium">
      Completa los campos obligatorios para publicar la línea.
    </p>
    <Button variant="text" :disabled="guardando" @click="irA('/admin/catalogo/lineas')">
      Cancelar
    </Button>
    <Button variant="outline" :icon="Save" :disabled="guardando" @click="guardarBorrador">
      Guardar borrador
    </Button>
    <Button variant="action" :icon="Save" :disabled="guardando" @click="guardarCambios">
      Guardar cambios
    </Button>
  </div>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: LÍNEAS · CREAR / EDITAR  (maqueta "ADMIN 16")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaLineaFormulario.vue
 *
 * Alta y edición de líneas comerciales (RF-CAT-11). Sincronizado 1:1 con
 * `CrearLineaDto` / `ActualizarLineaDto` del backend real: nombre, marca
 * (id_marca) y gama comercial opcional; con un único bloque de contenido
 * real, el formulario se muestra en una sola tarjeta (sin pasos / pestañas de
 * Progressive Disclosure).
 *
 * Permiso requerido: «Gestión del catálogo» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { computed, onMounted, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { ArrowLeft, Save, Info, Eye } from 'lucide-vue-next';
import { Button } from '@/core/components';
import Input from '@/core/components/forms/Input.vue';
import TarjetaSeccionFormulario from '../components/TarjetaSeccionFormulario.vue';
import CampoFormulario from '../components/CampoFormulario.vue';
import ChecklistPublicacion from '../components/ChecklistPublicacion.vue';
import { useLineaFormulario } from '../composables/useLineaFormulario';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { lineaFormularioSchema } from '../dtos';
import type { EstadoLinea, FormularioLinea } from '../interfaces';

const props = defineProps<{
  /** Id de la línea a editar (lo inyecta el router con `props: true`). Vacío = crear. */
  lineaId?: string;
}>();

const {
  formulario,
  opciones,
  modo,
  cargando,
  guardando,
  error,
  erroresValidacion,
  guardadoOk,
  checklist,
  progresoChecklist,
  puedePublicar,
  inicializar,
  actualizar,
  guardarBorrador,
  guardarCambios,
} = useLineaFormulario();

onMounted(() => {
  void inicializar(props.lineaId);
});

const claseInput =
  'w-full rounded-input border border-neutral-light bg-neutral-white px-3 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30 disabled:bg-neutral-lightest disabled:text-neutral-medium';
const claseError = 'border-highlight ring-2 ring-highlight/30';

const ETIQUETA_ESTADO: Record<EstadoLinea, string> = {
  activa: 'Activa',
  inactiva: 'Inactiva',
  pausada: 'Pausada',
};

const CLASES_ESTADO: Record<EstadoLinea, string> = {
  activa: 'bg-conversion/10 text-conversion',
  inactiva: 'bg-neutral-light text-neutral-medium',
  pausada: 'bg-highlight/20 text-neutral-dark',
};

const marcaEtiqueta = computed(
  () => opciones.value.marcas.find((m) => m.valor === formulario.value.marcaId)?.etiqueta ?? ''
);

// vee-validate: solo para UX de tipeo en los campos de texto migrados (nombre, gamaComercial).
// La autoridad de validación al guardar sigue siendo `validarLineaFormulario` en el store.
const { values, setValues } = useForm({ validationSchema: toTypedSchema(lineaFormularioSchema) });

watch(
  () => formulario.value,
  (f) => setValues(f, false),
  { immediate: true }
);

watch(
  () => values.nombre,
  (v) => {
    if (v !== undefined && v !== formulario.value.nombre) actualizar({ nombre: v });
  }
);
watch(
  () => values.gamaComercial,
  (v) => {
    if (v !== undefined && v !== formulario.value.gamaComercial) actualizar({ gamaComercial: v });
  }
);

function set(parcial: Partial<FormularioLinea>): void {
  actualizar(parcial);
}

const { irA } = usePanelNavegacion();
</script>
