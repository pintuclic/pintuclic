<template>
  <div class="space-y-5 p-6 lg:p-8">
    <Button variant="text" :icon="ArrowLeft" @click="irA('/admin/catalogo/colores')">
      Volver a colores
    </Button>

    <div>
      <h1 class="text-2xl font-bold text-neutral-black">
        {{ modo === 'editar' ? 'Editar color' : 'Crear nuevo color' }}
      </h1>
      <p class="mt-1 text-sm text-neutral-medium">
        Define el nombre, el valor cromático y dónde estará disponible este color en Pintu Clic.
      </p>
    </div>

    <p
      v-if="guardadoOk"
      class="rounded-card border border-conversion/40 bg-conversion/10 px-4 py-3 text-sm text-neutral-dark"
    >
      Cambios guardados. El color quedó como <strong>{{ ETIQUETA_ESTADO[formulario.estado] }}</strong>.
    </p>
    <p
      v-else-if="error"
      class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
    >
      {{ error }}
    </p>

    <div v-if="cargando" class="grid gap-5 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <div v-for="n in 4" :key="n" class="h-36 animate-pulse rounded-card bg-neutral-white" />
      </div>
      <div class="h-72 animate-pulse rounded-card bg-neutral-white" />
    </div>

    <div v-else class="grid gap-5 lg:grid-cols-3">
      <!-- Columna principal -->
      <div class="space-y-5 lg:col-span-2">
        <TarjetaSeccionFormulario
          titulo="Información general"
          descripcion="Nombre comercial, marca y clasificación del color."
          :icono="Info"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <Input name="nombre" label="Nombre del color" placeholder="Ej. Amarillo Profundo" />
            <Input name="codigo" label="Código interno" placeholder="Ej. AP-001" />
          </div>
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
          <CampoFormulario etiqueta="Familia cromática" requerido :error="erroresValidacion.familiaClave">
            <template #default="{ id }">
              <select
                :id="id"
                :value="formulario.familiaClave"
                :class="[claseInput, erroresValidacion.familiaClave && claseError]"
                @change="set({ familiaClave: ($event.target as HTMLSelectElement).value })"
              >
                <option value="">Selecciona…</option>
                <option v-for="op in opciones.familias" :key="op.valor" :value="op.valor">
                  {{ op.etiqueta }}
                </option>
              </select>
            </template>
          </CampoFormulario>
        </TarjetaSeccionFormulario>

        <TarjetaSeccionFormulario
          titulo="Valor cromático"
          descripcion="El HEX es obligatorio; el RGB y el CIELAB que viaja al backend se derivan de él."
          :icono="Palette"
        >
          <div class="flex flex-wrap items-start gap-4">
            <span
              class="h-16 w-16 shrink-0 rounded-card border border-neutral-light"
              :style="{ backgroundColor: rgb ? formulario.hex : 'transparent' }"
              aria-hidden="true"
            />
            <div class="grid flex-1 gap-4 sm:grid-cols-2">
              <CampoFormulario etiqueta="HEX" requerido :error="erroresValidacion.hex">
                <template #default="{ id }">
                  <input
                    :id="id"
                    :value="formulario.hex"
                    type="text"
                    :class="[claseInput, erroresValidacion.hex && claseError]"
                    placeholder="#FFC928"
                    @input="set({ hex: ($event.target as HTMLInputElement).value })"
                  />
                </template>
              </CampoFormulario>
              <div class="grid grid-cols-3 gap-2">
                <CampoFormulario etiqueta="R">
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="rgb?.r ?? 0"
                      type="number"
                      min="0"
                      max="255"
                      :class="claseInput"
                      @input="actualizarRgb('r', Number(($event.target as HTMLInputElement).value))"
                    />
                  </template>
                </CampoFormulario>
                <CampoFormulario etiqueta="G">
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="rgb?.g ?? 0"
                      type="number"
                      min="0"
                      max="255"
                      :class="claseInput"
                      @input="actualizarRgb('g', Number(($event.target as HTMLInputElement).value))"
                    />
                  </template>
                </CampoFormulario>
                <CampoFormulario etiqueta="B">
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="rgb?.b ?? 0"
                      type="number"
                      min="0"
                      max="255"
                      :class="claseInput"
                      @input="actualizarRgb('b', Number(($event.target as HTMLInputElement).value))"
                    />
                  </template>
                </CampoFormulario>
              </div>
            </div>
          </div>
          <p class="text-xs text-neutral-medium">
            <span class="font-medium text-neutral-dark">CIELAB (D65):</span>
            <span v-if="cielab" class="tabular-nums">
              L* {{ cielab.l }} · a* {{ cielab.a }} · b* {{ cielab.b }}
            </span>
            <span v-else>—</span>
            · es el valor que se guarda en el catálogo.
          </p>
        </TarjetaSeccionFormulario>

        <TarjetaSeccionFormulario
          titulo="Estado"
          descripcion="Controla la publicación de este color en el catálogo."
          :icono="Eye"
        >
          <CampoFormulario etiqueta="Estado">
            <template #default="{ id }">
              <select
                :id="id"
                :value="formulario.estado"
                :class="claseInput"
                @change="set({ estado: ($event.target as HTMLSelectElement).value as EstadoColor })"
              >
                <option value="publicado">Publicado</option>
                <option value="borrador">Borrador</option>
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
            Vista previa del color
          </header>
          <div class="grid h-28 place-items-center rounded-card border border-neutral-light bg-neutral-lightest">
            <span
              class="h-16 w-16 rounded-full border border-neutral-light"
              :style="{ backgroundColor: rgb ? formulario.hex : 'transparent' }"
              aria-hidden="true"
            />
          </div>
          <div class="mt-3 space-y-2">
            <p class="text-xs text-neutral-medium">{{ familiaNombre }}</p>
            <p class="text-base font-semibold text-neutral-black">
              {{ formulario.nombre || 'Nombre del color' }}
            </p>
            <span
              class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
              :class="CLASES_ESTADO[formulario.estado]"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
              {{ ETIQUETA_ESTADO[formulario.estado] }}
            </span>
            <p class="text-xs text-neutral-medium">{{ marcaNombre }}</p>
            <div class="grid grid-cols-2 gap-2 pt-1 text-center">
              <div>
                <p class="text-sm font-bold text-neutral-black tabular-nums">{{ previa.productos }}</p>
                <p class="text-[11px] text-neutral-medium">Productos</p>
              </div>
              <div>
                <p class="text-sm font-bold text-neutral-black tabular-nums">{{ previa.variantes }}</p>
                <p class="text-[11px] text-neutral-medium">Variantes</p>
              </div>
            </div>
            <div v-if="previa.coloresRelacionados.length" class="flex flex-wrap gap-1.5 pt-1">
              <span
                v-for="(hexRelacionado, i) in previa.coloresRelacionados"
                :key="i"
                class="h-5 w-5 rounded-full border border-neutral-light"
                :style="{ backgroundColor: hexRelacionado }"
                aria-hidden="true"
              />
            </div>
          </div>
        </section>

        <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
          <header class="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-black">
            <BarChart3 class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
            Impacto y uso
          </header>
          <ul class="space-y-2.5">
            <li v-for="item in impacto" :key="item.clave" class="flex items-start gap-2.5 text-sm">
              <CheckCircle2
                v-if="item.cumple"
                class="mt-0.5 h-4 w-4 shrink-0 text-conversion"
                aria-hidden="true"
              />
              <Circle v-else class="mt-0.5 h-4 w-4 shrink-0 text-neutral-light" aria-hidden="true" />
              <span>
                <span class="block font-medium text-neutral-dark">{{ item.etiqueta }}</span>
                <span class="block text-xs text-neutral-medium">{{ item.detalle }}</span>
              </span>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </div>

  <!-- Barra de acciones (pie fijo) -->
  <div
    class="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-neutral-light bg-neutral-white/95 px-6 py-3 backdrop-blur"
  >
    <Button variant="text" :disabled="guardando" @click="irA('/admin/catalogo/colores')">
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
 * M01 - VISTA: COLORES · CREAR / EDITAR  (maqueta "ADMIN 18")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaColorFormulario.vue
 *
 * Alta y edición de colores (HU-CAT-05): información general (nombre, código,
 * marca y familia cromática), valor cromático (HEX con RGB y CIELAB derivados)
 * y estado de publicación, con vista previa en vivo y bloque de impacto y uso.
 * El payload enviado al backend lleva `cielab` (RF-CAT-05-02), derivado del HEX.
 *
 * Permiso requerido: «Gestión del catálogo» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { onMounted, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import {
  ArrowLeft,
  Save,
  Info,
  Palette,
  Eye,
  BarChart3,
  CheckCircle2,
  Circle,
} from 'lucide-vue-next';
import { Button } from '@/core/components';
import Input from '@/core/components/forms/Input.vue';
import TarjetaSeccionFormulario from '../components/TarjetaSeccionFormulario.vue';
import CampoFormulario from '../components/CampoFormulario.vue';
import { useColorFormulario } from '../composables/useColorFormulario';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { colorFormularioSchema } from '../dtos';
import type { EstadoColor, FormularioColor } from '../interfaces';

const props = defineProps<{
  /** Id del color a editar (lo inyecta el router con `props: true`). Vacío = crear. */
  colorId?: string;
}>();

const {
  formulario,
  opciones,
  previa,
  modo,
  cargando,
  guardando,
  error,
  erroresValidacion,
  guardadoOk,
  rgb,
  cielab,
  familiaNombre,
  marcaNombre,
  impacto,
  inicializar,
  actualizar,
  actualizarRgb,
  guardarBorrador,
  guardarCambios,
} = useColorFormulario();


onMounted(() => {
  void inicializar(props.colorId);
});

const claseInput =
  'w-full rounded-input border border-neutral-light bg-neutral-white px-3 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30 disabled:bg-neutral-lightest disabled:text-neutral-medium';
const claseError = 'border-highlight ring-2 ring-highlight/30';

const ETIQUETA_ESTADO: Record<EstadoColor, string> = {
  publicado: 'Publicado',
  borrador: 'Borrador',
};

const CLASES_ESTADO: Record<EstadoColor, string> = {
  publicado: 'bg-conversion/10 text-conversion',
  borrador: 'bg-neutral-light text-neutral-medium',
};

function set(parcial: Partial<FormularioColor>): void {
  actualizar(parcial);
}

// vee-validate: solo para UX de tipeo en los campos de texto migrados
// (nombre, codigo). hex/R/G/B quedan nativos: hex es lógica
// de color-picking (fuera de alcance) y R/G/B son z.number() derivados de él
// (un <input type="number"> vía v-model entrega string, lo que rompería la
// validación tipada). La autoridad de validación al guardar sigue siendo
// `validarColorFormulario` en el store.
const { values, setValues } = useForm({ validationSchema: toTypedSchema(colorFormularioSchema) });

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
  () => values.codigo,
  (v) => {
    if (v !== undefined && v !== formulario.value.codigo) actualizar({ codigo: v });
  }
);

const { irA } = usePanelNavegacion();
</script>
