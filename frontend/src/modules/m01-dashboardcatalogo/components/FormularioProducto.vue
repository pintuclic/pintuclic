<template>
  <div class="space-y-5">
    <Tabs
      :items="pestanas"
      :model-value="pestanaActiva"
      @update:model-value="(id) => (pestanaActiva = id)"
    />

    <!-- 1. Identidad del producto -->
    <div v-show="pestanaActiva === 'identidad'" class="space-y-5">
      <TarjetaSeccionFormulario
        titulo="Información general"
        descripcion="Datos básicos del producto."
        :icono="Info"
      >
        <Input
          name="nombre"
          label="Nombre del producto"
          placeholder="Ej. Viniltex Advanced Amarillo Profundo"
        />

        <CampoFormulario
          etiqueta="Descripción"
          :error="erroresValidacion.descripcion"
          :contador="{ actual: formulario.descripcion.length, max: 5000 }"
        >
          <template #default="{ id, describedby }">
            <textarea
              :id="id"
              :value="formulario.descripcion"
              :aria-describedby="describedby"
              rows="4"
              :class="[claseInput, 'resize-y', erroresValidacion.descripcion && claseError]"
              placeholder="Describe el producto, sus usos y beneficios."
              @input="set({ descripcion: ($event.target as HTMLTextAreaElement).value })"
            />
          </template>
        </CampoFormulario>

        <CampoFormulario etiqueta="Marca" requerido :error="erroresValidacion.marcaId">
          <template #default="{ id }">
            <select
              :id="id"
              :value="formulario.marcaId ?? ''"
              :class="[claseInput, erroresValidacion.marcaId && claseError]"
              @change="actualizar({ marcaId: aTextoONull(($event.target as HTMLSelectElement).value) })"
            >
              <option value="">Selecciona…</option>
              <option v-for="op in opciones.marcas" :key="op.valor" :value="op.valor">
                {{ op.etiqueta }}
              </option>
            </select>
          </template>
        </CampoFormulario>
      </TarjetaSeccionFormulario>

      <TarjetaSeccionFormulario
        titulo="Clasificación"
        descripcion="Subcategorías a las que pertenece el producto."
        :icono="FolderTree"
      >
        <div>
          <p class="mb-2 text-sm font-medium text-neutral-dark">
            Subcategorías <span class="text-action" aria-hidden="true">*</span>
          </p>
          <ChipsSeleccion
            :opciones="opciones.subcategorias"
            :seleccionados="formulario.subcategoriasIds"
            etiqueta-agregar="Agregar subcategoría"
            @alternar="alternarSubcategoria"
          />
          <p v-if="erroresValidacion.subcategoriasIds" class="mt-1.5 text-xs font-medium text-neutral-black">
            {{ erroresValidacion.subcategoriasIds }}
          </p>
        </div>

        <CampoFormulario etiqueta="Categoría complementaria" ayuda="Opcional.">
          <template #default="{ id }">
            <select
              :id="id"
              :value="formulario.categoriaComplementariaId ?? ''"
              :class="claseInput"
              @change="set({ categoriaComplementariaId: aTextoONull(($event.target as HTMLSelectElement).value) })"
            >
              <option value="">Sin categoría complementaria</option>
              <option v-for="op in opciones.categorias" :key="op.valor" :value="op.valor">
                {{ op.etiqueta }}
              </option>
            </select>
          </template>
        </CampoFormulario>
      </TarjetaSeccionFormulario>
    </div>

    <!-- 2. Atributos y color -->
    <div v-show="pestanaActiva === 'atributos'" class="space-y-5">
      <TarjetaSeccionFormulario
        titulo="Atributos"
        descripcion="Línea, tipo de resina y visibilidad del producto."
        :icono="Bookmark"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <CampoFormulario
            etiqueta="Línea"
            :requerido="requiereLinea"
            :error="erroresValidacion.lineaId"
            :ayuda="requiereLinea ? 'Obligatoria para productos entonables (RF-CAT-02-02).' : 'Opcional.'"
          >
            <template #default="{ id }">
              <select
                :id="id"
                :value="formulario.lineaId ?? ''"
                :disabled="!formulario.marcaId"
                :class="[claseInput, erroresValidacion.lineaId && claseError]"
                @change="set({ lineaId: aTextoONull(($event.target as HTMLSelectElement).value) })"
              >
                <option value="">{{ formulario.marcaId ? 'Sin línea' : 'Elige antes una marca' }}</option>
                <option v-for="op in lineasDisponibles" :key="op.valor" :value="op.valor">
                  {{ op.etiqueta }}
                </option>
              </select>
            </template>
          </CampoFormulario>

          <CampoFormulario etiqueta="Tipo de resina" ayuda="Opcional.">
            <template #default="{ id }">
              <select
                :id="id"
                :value="formulario.tipoResinaId ?? ''"
                :class="claseInput"
                @change="set({ tipoResinaId: aTextoONull(($event.target as HTMLSelectElement).value) })"
              >
                <option value="">Sin definir</option>
                <option v-for="op in opciones.tiposResina" :key="op.valor" :value="op.valor">
                  {{ op.etiqueta }}
                </option>
              </select>
            </template>
          </CampoFormulario>
        </div>

        <label class="flex items-start gap-2 text-sm text-neutral-dark">
          <input
            type="checkbox"
            class="mt-0.5 accent-action"
            :checked="formulario.patrocinado"
            @change="set({ patrocinado: ($event.target as HTMLInputElement).checked })"
          />
          <span>
            Producto destacado (patrocinado)
            <span class="block text-xs text-neutral-medium">Se muestra en secciones principales.</span>
          </span>
        </label>
      </TarjetaSeccionFormulario>

      <TarjetaSeccionFormulario
        titulo="Clase de color"
        descripcion="Define cómo maneja el color este producto."
        :icono="Palette"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <CampoFormulario etiqueta="Clase de color" requerido>
            <template #default="{ id }">
              <select
                :id="id"
                :value="formulario.claseColor"
                :class="claseInput"
                @change="actualizar({ claseColor: aClaseColor(($event.target as HTMLSelectElement).value) })"
              >
                <option value="sin_color">Sin color</option>
                <option value="entonable">Entonable</option>
                <option value="colores_fijos">Colores fijos</option>
              </select>
            </template>
          </CampoFormulario>

          <CampoFormulario
            v-if="usaColor"
            etiqueta="Color principal"
            requerido
            :error="erroresValidacion.colorPrincipalId"
          >
            <template #default="{ id }">
              <select
                :id="id"
                :value="formulario.colorPrincipalId ?? ''"
                :class="[claseInput, erroresValidacion.colorPrincipalId && claseError]"
                @change="definirColorPrincipal(aTextoONull(($event.target as HTMLSelectElement).value))"
              >
                <option value="">Selecciona…</option>
                <option v-for="c in coloresDeLaMarca" :key="c.id" :value="c.id">
                  {{ c.nombre }}<template v-if="c.codigo"> ({{ c.codigo }})</template>
                </option>
              </select>
            </template>
          </CampoFormulario>

          <Input
            v-if="usaColor"
            name="codigoColor"
            label="Código / Referencia"
            placeholder="Ej. AP-001"
          />
        </div>

        <div v-if="usaColor && coloresDeLaMarca.length" class="pt-1">
          <p class="mb-2 text-sm font-medium text-neutral-dark">Colores disponibles <span class="text-neutral-medium">(opcional)</span></p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="c in coloresDeLaMarca"
              :key="c.id"
              type="button"
              class="inline-flex items-center gap-2 rounded-button border px-2.5 py-1.5 text-xs font-medium transition-colors"
              :class="
                formulario.coloresDisponiblesIds.includes(c.id)
                  ? 'border-action bg-subaction text-corporate'
                  : 'border-neutral-light bg-neutral-white text-neutral-dark hover:bg-neutral-lightest'
              "
              :aria-pressed="formulario.coloresDisponiblesIds.includes(c.id)"
              @click="alternarColorDisponible(c.id)"
            >
              <!-- hex derivado del valor CIELAB del color: dato de catálogo, no token de UI -->
              <span
                class="h-3.5 w-3.5 rounded-full border border-neutral-light"
                :style="{ backgroundColor: c.hex }"
                aria-hidden="true"
              />
              {{ c.nombre }}
            </button>
          </div>
        </div>
      </TarjetaSeccionFormulario>
    </div>

    <!-- 3. Imágenes -->
    <div v-show="pestanaActiva === 'imagenes'" class="space-y-5">
      <TarjetaSeccionFormulario
        titulo="Imágenes del producto"
        descripcion="Sube fotos de alta calidad. La primera imagen será la principal."
        :icono="ImageIcon"
      >
        <GaleriaImagenesProducto
          :imagenes="formulario.imagenes"
          :error="erroresValidacion.imagenes"
          @agregar="(archivo) => agregarImagen(archivo.nombre, archivo.url)"
          @quitar="quitarImagen"
          @principal="marcarImagenPrincipal"
        />
      </TarjetaSeccionFormulario>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { Info, FolderTree, Bookmark, Palette, Image as ImageIcon } from 'lucide-vue-next';
import { Tabs } from '@/core/components';
import Input from '@/core/components/forms/Input.vue';
import type { TabItem } from '@/core/components/navigation/Tabs.vue';
import TarjetaSeccionFormulario from './TarjetaSeccionFormulario.vue';
import CampoFormulario from './CampoFormulario.vue';
import ChipsSeleccion from './ChipsSeleccion.vue';
import GaleriaImagenesProducto from './GaleriaImagenesProducto.vue';
import { useProductoFormulario } from '../composables/useProductoFormulario';
import { productoFormularioSchema } from '../dtos';
import type { ClaseColorProducto, FormularioProducto } from '../interfaces';

const {
  formulario,
  opciones,
  erroresValidacion,
  lineasDisponibles,
  coloresDeLaMarca,
  requiereLinea,
  usaColor,
  actualizar,
  definirColorPrincipal,
  alternarColorDisponible,
  alternarSubcategoria,
  agregarImagen,
  quitarImagen,
  marcarImagenPrincipal,
} = useProductoFormulario();

const claseInput =
  'w-full rounded-input border border-neutral-light bg-neutral-white px-3 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30 disabled:bg-neutral-lightest disabled:text-neutral-medium';
const claseError = 'border-highlight ring-2 ring-highlight/30';

// vee-validate: solo para UX de tipeo en los campos de texto migrados (nombre, codigoColor).
// La autoridad de validación al guardar sigue siendo `validarProductoFormulario` en el store.
const { values, setValues } = useForm({ validationSchema: toTypedSchema(productoFormularioSchema) });

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
watch(
  () => values.codigoColor,
  (v) => {
    if (v !== undefined && v !== formulario.value.codigoColor) actualizar({ codigoColor: v });
  }
);

/** Progressive disclosure: 3 pasos en lugar de 9 tarjetas simultáneas. */
const pestanas: TabItem[] = [
  { id: 'identidad', label: 'Identidad del producto' },
  { id: 'atributos', label: 'Atributos y color' },
  { id: 'imagenes', label: 'Imágenes' },
];
const pestanaActiva = ref<string>('identidad');

/** Aplica un cambio parcial al formulario (delega en la acción del store). */
function set(parcial: Partial<FormularioProducto>): void {
  actualizar(parcial);
}

function aTextoONull(valor: string): string | null {
  return valor === '' ? null : valor;
}
function aClaseColor(valor: string): ClaseColorProducto {
  return valor === 'entonable' || valor === 'colores_fijos' ? valor : 'sin_color';
}
</script>
