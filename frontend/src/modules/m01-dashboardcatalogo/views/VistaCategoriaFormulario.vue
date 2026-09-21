<template>
  <div class="space-y-5 p-6 lg:p-8">
    <Button variant="text" :icon="ArrowLeft" @click="irA('/admin/catalogo/categorias')">
      Volver a categorías
    </Button>

    <div>
      <h1 class="text-2xl font-bold text-neutral-black">{{ titulo }}</h1>
      <p class="mt-1 text-sm text-neutral-medium">
        {{
          esSubcategoria
            ? 'Completa la información de la subcategoría. Organiza tu catálogo para una mejor experiencia de navegación.'
            : 'Completa la información de la categoría para organizar tu catálogo de forma clara y eficiente.'
        }}
      </p>
    </div>

    <p
      v-if="guardadoOk"
      class="rounded-card border border-conversion/40 bg-conversion/10 px-4 py-3 text-sm text-neutral-dark"
    >
      Cambios guardados. La {{ esSubcategoria ? 'subcategoría' : 'categoría' }} quedó como
      <strong>{{ formulario.estado === 'publicado' ? 'publicada' : 'inactiva' }}</strong>.
    </p>
    <p
      v-else-if="error"
      class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
    >
      {{ error }}
    </p>

    <div v-if="cargando" class="grid gap-5 xl:grid-cols-3">
      <div class="h-56 animate-pulse rounded-card bg-neutral-white xl:col-span-2" />
      <div class="h-72 animate-pulse rounded-card bg-neutral-white" />
    </div>

    <div v-else class="grid gap-5 xl:grid-cols-3">
      <!-- Columna principal -->
      <div class="space-y-5 xl:col-span-2">
        <TarjetaSeccionFormulario
          titulo="Información general"
          descripcion="Datos básicos de la categoría."
          :icono="Info"
        >
          <Input
            name="nombre"
            :label="esSubcategoria ? 'Nombre de la subcategoría' : 'Nombre de la categoría'"
            placeholder="Ej. Pinturas Interiores"
          />
        </TarjetaSeccionFormulario>

        <TarjetaSeccionFormulario
          titulo="Jerarquía"
          descripcion="Define el tipo de categoría y su ubicación."
          :icono="Network"
        >
          <CampoFormulario etiqueta="Tipo de categoría" requerido>
            <template #default="{ id }">
              <select
                :id="id"
                :value="formulario.tipo"
                :disabled="modo === 'editar'"
                :class="claseInput"
                @change="onCambiarTipo(($event.target as HTMLSelectElement).value)"
              >
                <option value="categoria">Categoría principal</option>
                <option value="subcategoria">Subcategoría</option>
              </select>
            </template>
          </CampoFormulario>

          <CampoFormulario
            v-if="esSubcategoria"
            etiqueta="Categoría padre"
            requerido
            :error="erroresValidacion.padreId"
            ayuda="La subcategoría aparecerá dentro de la categoría seleccionada."
          >
            <template #default="{ id }">
              <select
                :id="id"
                :value="formulario.padreId ?? ''"
                :class="[claseInput, erroresValidacion.padreId && claseError]"
                @change="set({ padreId: aTextoONull(($event.target as HTMLSelectElement).value) })"
              >
                <option value="">Selecciona…</option>
                <option v-for="op in opciones.categoriasPadre" :key="op.valor" :value="op.valor">
                  {{ op.etiqueta }}
                </option>
              </select>
            </template>
          </CampoFormulario>

          <div class="grid gap-4 sm:grid-cols-2">
            <CampoFormulario etiqueta="Estado" requerido>
              <template #default="{ id }">
                <select
                  :id="id"
                  :value="formulario.estado"
                  :class="claseInput"
                  @change="set({ estado: ($event.target as HTMLSelectElement).value === 'inactivo' ? 'inactivo' : 'publicado' })"
                >
                  <option value="publicado">Publicado</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </template>
            </CampoFormulario>
            <div class="flex flex-col gap-1.5">
              <Input
                name="ordenVisualizacion"
                label="Orden de visualización"
                type="number"
                min="0"
                step="1"
              />
              <span class="text-xs text-neutral-medium">Orden dentro de su nivel.</span>
            </div>
          </div>
        </TarjetaSeccionFormulario>
      </div>

      <!-- Columna lateral -->
      <div class="space-y-5">
        <!-- Vista previa en la jerarquía -->
        <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
          <header class="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-black">
            <Eye class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
            Vista previa en la jerarquía
          </header>
          <ul class="space-y-1 text-sm">
            <li class="flex items-center gap-2 font-medium text-neutral-dark">
              <Folder class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
              Catálogo de productos
            </li>
            <li class="ml-4 space-y-1">
              <p class="flex items-center gap-2 font-medium text-neutral-dark">
                <Folder class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
                {{ nombrePadrePreview }}
              </p>
              <ul class="ml-6 space-y-1">
                <li
                  v-for="nodo in hijosPreview"
                  :key="nodo.id"
                  class="flex items-center gap-2 rounded-button px-2 py-1"
                  :class="nodo.activo ? 'bg-subaction font-medium text-corporate' : 'text-neutral-medium'"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  {{ nodo.nombre }}
                </li>
              </ul>
            </li>
          </ul>
        </section>

        <!-- Resumen e impacto -->
        <section
          v-if="resumenImpacto"
          class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm"
        >
          <header class="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-black">
            <BarChart3 class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
            Resumen e impacto
          </header>
          <dl class="space-y-3 text-sm">
            <div class="flex items-center justify-between gap-3">
              <dt class="text-neutral-medium">Productos asociados</dt>
              <dd class="font-semibold text-neutral-black tabular-nums">
                {{ formatearNumero(resumenImpacto.productosAsociados) }}
              </dd>
            </div>
            <div class="flex items-center justify-between gap-3">
              <dt class="text-neutral-medium">Subcategorías</dt>
              <dd class="font-semibold text-neutral-black tabular-nums">
                {{ resumenImpacto.subcategorias }}
              </dd>
            </div>
            <div class="flex items-center justify-between gap-3">
              <dt class="text-neutral-medium">Visibilidad</dt>
              <dd
                class="rounded-button px-2 py-0.5 text-xs font-medium"
                :class="resumenImpacto.visibilidadPublica ? 'bg-conversion/10 text-conversion' : 'bg-neutral-light text-neutral-medium'"
              >
                {{ resumenImpacto.visibilidadPublica ? 'Pública' : 'Privada' }}
              </dd>
            </div>
          </dl>
          <p class="mt-3 flex items-start gap-2 rounded-input bg-subaction/40 px-3 py-2 text-xs text-neutral-dark">
            <Info class="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden="true" />
            Una buena estructura de categorías ayuda a tus clientes a encontrar lo que buscan.
          </p>
        </section>
      </div>
    </div>
  </div>

  <!-- Barra de acciones (pie fijo) -->
  <div
    class="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-neutral-light bg-neutral-white/95 px-6 py-3 backdrop-blur"
  >
    <Button variant="text" :disabled="guardando" @click="irA('/admin/catalogo/categorias')">
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
 * M01 - VISTA: CATEGORÍAS · CREAR / EDITAR  (maquetas "ADMIN 10" y "ADMIN 11")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaCategoriaFormulario.vue
 *
 * Alta y edición de categorías y subcategorías (HU-CAT-01). Sincronizado 1:1
 * con `CrearCategoriaDto` / `CrearSubcategoriaDto` del backend real: nombre,
 * orden y (en subcategoría) categoría padre; el tipo de nodo (categoría vs.
 * subcategoría) sigue siendo lógica real de UI/ruteo, consumida desde
 * `dashboard-catalogo.routes.ts` (`categoriaId: 'nueva-categoria' |
 * 'nueva-subcategoria'`). Con el contenido restante ya no se justifican las
 * secciones de ícono, filtros, líneas, SEO ni notas: se retiraron.
 *
 * Permiso requerido: «Gestión del catálogo» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { computed, onMounted, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { ArrowLeft, Save, Info, Network, Eye, Folder, BarChart3 } from 'lucide-vue-next';
import { Button } from '@/core/components';
import Input from '@/core/components/forms/Input.vue';
import TarjetaSeccionFormulario from '../components/TarjetaSeccionFormulario.vue';
import CampoFormulario from '../components/CampoFormulario.vue';
import { useCategoriaFormulario } from '../composables/useCategoriaFormulario';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { categoriaFormularioSchema } from '../dtos';
import type { FormularioCategoria, TipoNodoCategoria } from '../interfaces';

const props = defineProps<{
  /** `nueva-categoria`, `nueva-subcategoria` o el id de la categoría a editar. */
  categoriaId?: string;
}>();

const {
  formulario,
  opciones,
  resumenImpacto,
  modo,
  cargando,
  guardando,
  error,
  erroresValidacion,
  guardadoOk,
  esSubcategoria,
  inicializar,
  actualizar,
  guardarBorrador,
  guardarCambios,
  formatearNumero,
} = useCategoriaFormulario();

onMounted(() => {
  const id = props.categoriaId;
  if (!id || id === 'nueva-categoria' || id === 'nueva-subcategoria') {
    void inicializar({ id: null, tipo: id === 'nueva-subcategoria' ? 'subcategoria' : 'categoria' });
  } else {
    void inicializar({ id, tipo: 'categoria' });
  }
});

const titulo = computed(() => {
  const que = esSubcategoria.value ? 'subcategoría' : 'categoría';
  return modo.value === 'editar' ? `Editar ${que}` : `Crear nueva ${que}`;
});

const claseInput =
  'w-full rounded-input border border-neutral-light bg-neutral-white px-3 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30 disabled:bg-neutral-lightest disabled:text-neutral-medium';
const claseError = 'border-highlight ring-2 ring-highlight/30';

// vee-validate: UX de tipeo de los campos migrados a `Input` del Core (nombre
// y ordenVisualizacion). `Input.vue` convierte los `type="number"` a number
// real (o `null` si queda vacío), así que el z.number() del schema ya valida
// bien desde el propio campo. La autoridad de validación al guardar sigue
// siendo `validarCategoriaFormulario` en el store.
const { values, setValues } = useForm({ validationSchema: toTypedSchema(categoriaFormularioSchema) });

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
  () => values.ordenVisualizacion,
  (v) => {
    // El campo es opcional en la UI: vacío equivale a 0 en el store.
    const valor = v ?? 0;
    if (valor !== formulario.value.ordenVisualizacion) actualizar({ ordenVisualizacion: valor });
  }
);

const nombrePadrePreview = computed(() => {
  if (!esSubcategoria.value) return formulario.value.nombre || 'Nueva categoría';
  return (
    opciones.value.categoriasPadre.find((c) => c.valor === formulario.value.padreId)?.etiqueta ??
    'Categoría padre'
  );
});

const hijosPreview = computed(() => {
  if (!esSubcategoria.value) {
    return [{ id: 'self', nombre: formulario.value.nombre || 'Nueva categoría', activo: true }];
  }
  const hijos = opciones.value.arbolPreview
    .filter((n) => n.padreId === formulario.value.padreId)
    .map((n) => ({ id: n.id, nombre: n.nombre, activo: n.id === props.categoriaId }));
  if (!hijos.some((h) => h.activo)) {
    hijos.unshift({
      id: 'nueva',
      nombre: formulario.value.nombre || 'Nueva subcategoría',
      activo: true,
    });
  }
  return hijos;
});

function set(parcial: Partial<FormularioCategoria>): void {
  actualizar(parcial);
}
function aTextoONull(valor: string): string | null {
  return valor === '' ? null : valor;
}
function onCambiarTipo(valor: string): void {
  const tipo: TipoNodoCategoria = valor === 'subcategoria' ? 'subcategoria' : 'categoria';
  actualizar({ tipo, padreId: tipo === 'categoria' ? null : formulario.value.padreId });
}

// Navegación del panel: la provee el router (dashboardCatalogoRoutes).
const { irA } = usePanelNavegacion();
</script>
