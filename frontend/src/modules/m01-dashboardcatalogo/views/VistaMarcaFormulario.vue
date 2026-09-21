<template>
  <div class="space-y-5 p-6 lg:p-8">
    <Button variant="text" :icon="ArrowLeft" @click="irA('/admin/catalogo/marcas')">
      Volver a marcas
    </Button>

    <div>
      <h1 class="text-2xl font-bold text-neutral-black">
        {{ modo === 'editar' ? 'Editar marca' : 'Crear nueva marca' }}
      </h1>
      <p class="mt-1 text-sm text-neutral-medium">
        Completa el nombre y el logotipo de la marca. Se mostrará en el catálogo y estará
        disponible para asociar productos.
      </p>
    </div>

    <p
      v-if="guardadoOk"
      class="rounded-card border border-conversion/40 bg-conversion/10 px-4 py-3 text-sm text-neutral-dark"
    >
      Cambios guardados. La marca quedó como
      <strong>{{ formulario.estado === 'activa' ? 'activa' : 'inactiva' }}</strong>.
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
      <div class="lg:col-span-2">
        <TarjetaSeccionFormulario
          titulo="Información de la marca"
          descripcion="Nombre y logotipo son los únicos datos obligatorios."
          :icono="Info"
        >
          <Input name="nombre" label="Nombre de la marca" placeholder="Ej. Pintuco" />

          <div>
            <p class="text-sm font-medium text-neutral-dark">
              Logotipo <span class="text-neutral-medium">*</span>
            </p>
            <div class="mt-1.5 flex flex-wrap items-center gap-4">
              <div class="grid h-24 w-24 shrink-0 place-items-center rounded-card border border-neutral-light bg-neutral-lightest text-neutral-medium">
                <img
                  v-if="formulario.logoUrl"
                  :src="formulario.logoUrl"
                  alt="Logo de la marca"
                  class="h-full w-full rounded-card object-contain p-2"
                />
                <ImageIcon v-else class="h-6 w-6" aria-hidden="true" />
              </div>
              <div class="space-y-1.5">
                <div class="flex gap-2">
                  <Button variant="outline" size="sm" :icon="Upload" @click="simularLogo">
                    {{ formulario.logoUrl ? 'Cambiar imagen' : 'Subir imagen' }}
                  </Button>
                  <button
                    v-if="formulario.logoUrl"
                    type="button"
                    class="grid h-9 w-9 place-items-center rounded-button border border-neutral-light text-neutral-medium hover:bg-neutral-lightest"
                    aria-label="Quitar logo"
                    @click="quitarLogo"
                  >
                    <Trash2 class="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <p class="text-xs text-neutral-medium">
                  JPG, PNG o WEBP. Máx. 5 MB.
                </p>
                <p v-if="erroresValidacion.logoUrl" class="text-xs text-neutral-black">
                  {{ erroresValidacion.logoUrl }}
                </p>
              </div>
            </div>
          </div>
        </TarjetaSeccionFormulario>
      </div>

      <!-- Aside -->
      <aside class="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
          <header class="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-black">
            <Eye class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
            Vista previa de la marca
          </header>
          <div class="grid h-28 place-items-center rounded-card border border-neutral-light bg-neutral-lightest">
            <img
              v-if="formulario.logoUrl"
              :src="formulario.logoUrl"
              :alt="formulario.nombre || 'Marca'"
              class="h-full w-full object-contain p-4"
            />
            <ImageIcon v-else class="h-7 w-7 text-neutral-light" aria-hidden="true" />
          </div>
          <div class="mt-3 space-y-2">
            <p class="text-base font-semibold text-neutral-black">
              {{ formulario.nombre || 'Nombre de la marca' }}
            </p>
            <span
              class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
              :class="formulario.estado === 'activa' ? 'bg-conversion/10 text-conversion' : 'bg-neutral-light text-neutral-medium'"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
              {{ formulario.estado === 'activa' ? 'Marca activa' : 'Marca inactiva' }}
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
      Completa los campos obligatorios para publicar la marca.
    </p>
    <Button variant="text" :disabled="guardando" @click="irA('/admin/catalogo/marcas')">
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
 * M01 - VISTA: MARCAS · CREAR / EDITAR  (maqueta "ADMIN 13")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaMarcaFormulario.vue
 *
 * Alta y edición de marcas (HU-CAT-04). Sincronizado 1:1 con `CrearMarcaDto` /
 * `ActualizarMarcaDto` del backend real: solo nombre y logotipo son datos de
 * negocio; con un único bloque de contenido real, el formulario se muestra en
 * una sola tarjeta (sin pasos / pestañas de Progressive Disclosure).
 *
 * Permiso requerido: «Gestión del catálogo» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { onMounted, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { ArrowLeft, Save, Info, Eye, Upload, Trash2, Image as ImageIcon } from 'lucide-vue-next';
import { Button } from '@/core/components';
import Input from '@/core/components/forms/Input.vue';
import TarjetaSeccionFormulario from '../components/TarjetaSeccionFormulario.vue';
import ChecklistPublicacion from '../components/ChecklistPublicacion.vue';
import { useMarcaFormulario } from '../composables/useMarcaFormulario';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { LOGO_MARCA_DEMO } from '../assets/imagenes-catalogo';
import { marcaFormularioSchema } from '../dtos';

const props = defineProps<{
  /** Id de la marca a editar (lo inyecta el router con `props: true`). Vacío = crear. */
  marcaId?: string;
}>();

const {
  formulario,
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
  quitarLogo,
  guardarBorrador,
  guardarCambios,
} = useMarcaFormulario();

onMounted(() => {
  void inicializar(props.marcaId);
});

// vee-validate: solo para UX de tipeo del campo de texto migrado (nombre).
// La autoridad de validación al guardar sigue siendo `validarMarcaFormulario` en el store.
const { values, setValues } = useForm({ validationSchema: toTypedSchema(marcaFormularioSchema) });

watch(
  () => formulario.value,
  (f) => setValues(f as unknown as Parameters<typeof setValues>[0], false),
  { immediate: true }
);

watch(
  () => values.nombre,
  (v) => {
    if (v !== undefined && v !== formulario.value.nombre) actualizar({ nombre: v });
  }
);

/** Sin subida real (HU-CAT-07): asigna una ilustración de ejemplo como logo. */
function simularLogo(): void {
  actualizar({ logoUrl: LOGO_MARCA_DEMO['pintuco'] ?? null });
}

// Navegación del panel: la provee el router (dashboardCatalogoRoutes).
const { irA } = usePanelNavegacion();
</script>
