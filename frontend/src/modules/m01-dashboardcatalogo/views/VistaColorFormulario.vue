<template>
  <div class="space-y-5 p-6 lg:p-8">
    <button
      type="button"
      class="inline-flex items-center gap-1.5 text-sm font-medium text-action hover:underline"
      @click="irA('/admin/catalogo/colores')"
    >
      <ArrowLeft class="h-4 w-4" aria-hidden="true" />
      Volver a colores
    </button>

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
          descripcion="Nombre comercial y clasificación del color."
          :icono="Info"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <CampoFormulario etiqueta="Nombre del color" requerido :error="erroresValidacion.nombre">
              <template #default="{ id }">
                <input
                  :id="id"
                  :value="formulario.nombre"
                  type="text"
                  :class="[claseInput, erroresValidacion.nombre && claseError]"
                  placeholder="Ej. Amarillo Profundo"
                  @input="set({ nombre: ($event.target as HTMLInputElement).value })"
                />
              </template>
            </CampoFormulario>
            <CampoFormulario etiqueta="Nombre corto" :error="erroresValidacion.nombreCorto">
              <template #default="{ id }">
                <input
                  :id="id"
                  :value="formulario.nombreCorto"
                  type="text"
                  :class="claseInput"
                  placeholder="Ej. Amarillo Prof."
                  @input="set({ nombreCorto: ($event.target as HTMLInputElement).value })"
                />
              </template>
            </CampoFormulario>
          </div>
          <CampoFormulario
            etiqueta="Descripción"
            :error="erroresValidacion.descripcion"
            :contador="{ actual: formulario.descripcion.length, max: 500 }"
          >
            <template #default="{ id }">
              <textarea
                :id="id"
                :value="formulario.descripcion"
                rows="3"
                :class="[claseInput, 'resize-y', erroresValidacion.descripcion && claseError]"
                placeholder="Describe el color, su cobertura y para qué espacios está pensado."
                @input="set({ descripcion: ($event.target as HTMLTextAreaElement).value })"
              />
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
          descripcion="El HEX es obligatorio; la muestra y el RGB se derivan de él."
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
        </TarjetaSeccionFormulario>

        <TarjetaSeccionFormulario
          titulo="Bases y uso"
          descripcion="Define sobre qué bases puede prepararse y en qué productos se ofrece."
          :icono="Layers"
        >
          <div>
            <p class="mb-1.5 text-sm font-medium text-neutral-dark">
              Bases compatibles <span class="text-action" aria-hidden="true">*</span>
            </p>
            <ChipsSeleccion
              :opciones="opciones.bases"
              :seleccionados="formulario.basesCompatibles"
              etiqueta-agregar="Agregar base"
              @alternar="alternarBase"
            />
            <p v-if="erroresValidacion.basesCompatibles" class="mt-1.5 text-xs font-medium text-neutral-black">
              {{ erroresValidacion.basesCompatibles }}
            </p>
          </div>
          <CampoFormulario etiqueta="Productos donde puede usarse">
            <template #default="{ id }">
              <select
                :id="id"
                :value="formulario.politicaProductos"
                :class="claseInput"
                @change="set({ politicaProductos: ($event.target as HTMLSelectElement).value as PoliticaProductoColor })"
              >
                <option value="todos">Todos los productos</option>
                <option value="especificos">Productos específicos</option>
                <option value="personalizadas">Reglas personalizadas</option>
              </select>
            </template>
          </CampoFormulario>
        </TarjetaSeccionFormulario>

        <TarjetaSeccionFormulario
          titulo="Estado y visibilidad"
          descripcion="Controla la publicación y dónde aparece este color."
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

          <fieldset class="space-y-2.5">
            <legend class="mb-1 text-sm font-medium text-neutral-dark">Visibilidad</legend>
            <label class="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                class="mt-0.5 h-4 w-4 shrink-0 accent-action"
                :checked="formulario.mostrarEnTienda"
                @change="set({ mostrarEnTienda: ($event.target as HTMLInputElement).checked })"
              />
              <span>
                <span class="block font-medium text-neutral-dark">Mostrar en la tienda</span>
                <span class="block text-xs text-neutral-medium">El color será visible en las fichas de producto.</span>
              </span>
            </label>
            <label class="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                class="mt-0.5 h-4 w-4 shrink-0 accent-action"
                :checked="formulario.incluirEnBuscador"
                @change="set({ incluirEnBuscador: ($event.target as HTMLInputElement).checked })"
              />
              <span>
                <span class="block font-medium text-neutral-dark">Incluir en el buscador</span>
                <span class="block text-xs text-neutral-medium">Permite filtrar y encontrar productos por este color.</span>
              </span>
            </label>
          </fieldset>
        </TarjetaSeccionFormulario>

        <TarjetaSeccionFormulario
          titulo="SEO y etiquetas"
          descripcion="Mejora cómo se muestra el color en buscadores (opcional)."
          :icono="Search"
        >
          <CampoFormulario
            etiqueta="Título SEO"
            :contador="{ actual: formulario.tituloSeo.length, max: 60 }"
          >
            <template #default="{ id }">
              <input
                :id="id"
                :value="formulario.tituloSeo"
                type="text"
                :class="claseInput"
                placeholder="Color | Pintu Clic"
                @input="set({ tituloSeo: ($event.target as HTMLInputElement).value })"
              />
            </template>
          </CampoFormulario>
          <CampoFormulario
            etiqueta="Meta descripción"
            :contador="{ actual: formulario.metaDescripcion.length, max: 160 }"
          >
            <template #default="{ id }">
              <textarea
                :id="id"
                :value="formulario.metaDescripcion"
                rows="2"
                :class="[claseInput, 'resize-y']"
                placeholder="Resumen para buscadores."
                @input="set({ metaDescripcion: ($event.target as HTMLTextAreaElement).value })"
              />
            </template>
          </CampoFormulario>
          <CampoFormulario etiqueta="Etiquetas">
            <EntradaEtiquetas
              :etiquetas="formulario.etiquetas"
              placeholder="Ej. amarillo, vibrante, interiores…"
              @agregar="agregarEtiqueta"
              @quitar="quitarEtiqueta"
            />
          </CampoFormulario>
        </TarjetaSeccionFormulario>

        <TarjetaSeccionFormulario
          titulo="Notas internas"
          descripcion="Información privada para uso del equipo (opcional)."
          :icono="FileText"
        >
          <CampoFormulario
            etiqueta="Notas"
            :contador="{ actual: formulario.notasInternas.length, max: 1000 }"
          >
            <template #default="{ id }">
              <textarea
                :id="id"
                :value="formulario.notasInternas"
                rows="3"
                :class="[claseInput, 'resize-y']"
                placeholder="Ej. Color recomendado para campañas de temporada."
                @input="set({ notasInternas: ($event.target as HTMLTextAreaElement).value })"
              />
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
            <p v-if="formulario.descripcion" class="line-clamp-3 text-xs text-neutral-medium">
              {{ formulario.descripcion }}
            </p>
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
    <button
      type="button"
      class="rounded-button px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
      :disabled="guardando"
      @click="irA('/admin/catalogo/colores')"
    >
      Cancelar
    </button>
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-button border border-neutral-light bg-neutral-white px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest disabled:opacity-50"
      :disabled="guardando"
      @click="guardarBorrador"
    >
      <Save class="h-4 w-4" aria-hidden="true" />
      Guardar borrador
    </button>
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-button bg-action px-4 py-2 text-sm font-medium text-neutral-white hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="guardando"
      @click="guardarCambios"
    >
      <Save class="h-4 w-4" aria-hidden="true" />
      Guardar cambios
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: COLORES · CREAR / EDITAR  (maqueta "ADMIN 18")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaColorFormulario.vue
 *
 * Alta y edición de colores (HU-CAT-05): información general, valor cromático
 * (HEX + RGB derivado), bases y uso, estado/visibilidad, SEO/etiquetas y notas,
 * con vista previa en vivo y bloque informativo de impacto y uso.
 *
 * Permiso requerido: «Gestión del catálogo» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { onMounted } from 'vue';
import {
  ArrowLeft,
  Save,
  Info,
  Palette,
  Layers,
  Eye,
  Search,
  FileText,
  BarChart3,
  CheckCircle2,
  Circle,
} from 'lucide-vue-next';
import TarjetaSeccionFormulario from '../components/TarjetaSeccionFormulario.vue';
import CampoFormulario from '../components/CampoFormulario.vue';
import EntradaEtiquetas from '../components/EntradaEtiquetas.vue';
import ChipsSeleccion from '../components/ChipsSeleccion.vue';
import { useColorFormulario } from '../composables/useColorFormulario';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import type { EstadoColor, FormularioColor, PoliticaProductoColor } from '../interfaces';

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
  familiaNombre,
  impacto,
  inicializar,
  actualizar,
  actualizarRgb,
  alternarBase,
  agregarEtiqueta,
  quitarEtiqueta,
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

const { irA } = usePanelNavegacion();
</script>
