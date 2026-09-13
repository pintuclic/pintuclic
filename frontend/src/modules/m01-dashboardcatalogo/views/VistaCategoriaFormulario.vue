<template>
  <div class="flex min-h-screen bg-neutral-lightest">
    <BarraLateralAdmin item-activo="categorias" @navegar="irA" />

    <div class="flex min-w-0 flex-1 flex-col">
      <BarraSuperiorAdmin
        v-model:termino-busqueda="busquedaGlobal"
        seccion="Categorías"
        nombre-usuario="Carlos Álvarez"
        rol-usuario="Administrador"
        :notificaciones="3"
      />

      <main class="flex-1 space-y-5 p-6 lg:p-8">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-action hover:underline"
          @click="irA('/admin/catalogo/categorias')"
        >
          <ArrowLeft class="h-4 w-4" aria-hidden="true" />
          Volver a categorías
        </button>

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
          <div class="space-y-4 xl:col-span-2">
            <div v-for="n in 3" :key="n" class="h-40 animate-pulse rounded-card bg-neutral-white" />
          </div>
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
              <div class="grid gap-4 sm:grid-cols-2">
                <CampoFormulario
                  :etiqueta="esSubcategoria ? 'Nombre de la subcategoría' : 'Nombre de la categoría'"
                  requerido
                  :error="erroresValidacion.nombre"
                >
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="formulario.nombre"
                      type="text"
                      :class="[claseInput, erroresValidacion.nombre && claseError]"
                      placeholder="Ej. Pinturas Interiores"
                      @input="set({ nombre: ($event.target as HTMLInputElement).value })"
                    />
                  </template>
                </CampoFormulario>
                <CampoFormulario
                  etiqueta="Código / Slug"
                  requerido
                  :error="erroresValidacion.slug"
                  ayuda="Se usará en la URL. Solo minúsculas, números y guiones."
                >
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="formulario.slug"
                      type="text"
                      :class="[claseInput, erroresValidacion.slug && claseError]"
                      placeholder="pinturas-interiores"
                      @input="set({ slug: ($event.target as HTMLInputElement).value })"
                    />
                  </template>
                </CampoFormulario>
              </div>
              <CampoFormulario
                etiqueta="Descripción"
                requerido
                :error="erroresValidacion.descripcion"
                :contador="{ actual: formulario.descripcion.length, max: 1000 }"
              >
                <template #default="{ id }">
                  <textarea
                    :id="id"
                    :value="formulario.descripcion"
                    rows="4"
                    :class="[claseInput, 'resize-y', erroresValidacion.descripcion && claseError]"
                    placeholder="Describe qué agrupa esta categoría y para qué sirve."
                    @input="set({ descripcion: ($event.target as HTMLTextAreaElement).value })"
                  />
                </template>
              </CampoFormulario>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Icono / imagen representativa"
              descripcion="Sube un ícono o imagen para identificar la categoría."
              :icono="ImageIcon"
            >
              <div class="flex items-center gap-4">
                <div class="grid h-24 w-24 shrink-0 place-items-center rounded-card border border-neutral-light bg-neutral-lightest text-neutral-medium">
                  <img
                    v-if="formulario.iconoUrl"
                    :src="formulario.iconoUrl"
                    alt="Icono de la categoría"
                    class="h-full w-full rounded-card object-contain p-2"
                  />
                  <ImageIcon v-else class="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-2 rounded-button border border-neutral-light bg-neutral-white px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
                  >
                    <Upload class="h-4 w-4" aria-hidden="true" />
                    Subir imagen
                  </button>
                  <p class="mt-1.5 text-xs text-neutral-medium">
                    PNG, JPG o SVG. Máx. 2 MB. Recomendado 300 × 300 px.
                  </p>
                </div>
              </div>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Filtros o atributos asociados"
              descripcion="Se heredarán por los productos de esta categoría."
              :icono="Filter"
            >
              <ChipsSeleccion
                :opciones="opciones.filtros"
                :seleccionados="formulario.filtros"
                etiqueta-agregar="Agregar filtro"
                @alternar="(v) => alternarLista('filtros', v)"
              />
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Líneas o familias relacionadas"
              descripcion="Se mostrarán como filtros y en la navegación."
              :icono="Bookmark"
            >
              <ChipsSeleccion
                :opciones="opciones.lineas"
                :seleccionados="formulario.lineas"
                etiqueta-agregar="Agregar línea"
                @alternar="(v) => alternarLista('lineas', v)"
              />
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="SEO y etiquetas"
              descripcion="Mejora la visibilidad en buscadores (opcional)."
              :icono="Search"
            >
              <div class="grid gap-4 sm:grid-cols-2">
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
                      placeholder="Pinturas para Interiores | Pintu Clic"
                      @input="set({ tituloSeo: ($event.target as HTMLInputElement).value })"
                    />
                  </template>
                </CampoFormulario>
                <CampoFormulario
                  etiqueta="Meta descripción"
                  :contador="{ actual: formulario.metaDescripcion.length, max: 160 }"
                >
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="formulario.metaDescripcion"
                      type="text"
                      :class="claseInput"
                      placeholder="Resumen para buscadores."
                      @input="set({ metaDescripcion: ($event.target as HTMLInputElement).value })"
                    />
                  </template>
                </CampoFormulario>
              </div>
              <CampoFormulario etiqueta="Etiquetas">
                <EntradaEtiquetas
                  :etiquetas="formulario.etiquetas"
                  placeholder="Ej. interiores, hogar, paredes, decoración…"
                  @agregar="agregarEtiqueta"
                  @quitar="quitarEtiqueta"
                />
              </CampoFormulario>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Notas adicionales"
              descripcion="Notas internas o comentarios sobre esta categoría (opcional)."
              :icono="FileText"
            >
              <CampoFormulario
                etiqueta="Notas"
                :contador="{ actual: formulario.notas.length, max: 500 }"
              >
                <template #default="{ id }">
                  <textarea
                    :id="id"
                    :value="formulario.notas"
                    rows="3"
                    :class="[claseInput, 'resize-y']"
                    placeholder="Ej. Revisar con marketing las imágenes para la campaña Q3."
                    @input="set({ notas: ($event.target as HTMLTextAreaElement).value })"
                  />
                </template>
              </CampoFormulario>
            </TarjetaSeccionFormulario>
          </div>

          <!-- Columna lateral -->
          <div class="space-y-5">
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
                <CampoFormulario etiqueta="Orden de visualización" ayuda="Orden dentro de su nivel.">
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="formulario.ordenVisualizacion"
                      type="number"
                      min="0"
                      step="1"
                      :class="claseInput"
                      @input="set({ ordenVisualizacion: Number(($event.target as HTMLInputElement).value) || 0 })"
                    />
                  </template>
                </CampoFormulario>
              </div>
            </TarjetaSeccionFormulario>

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
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-neutral-medium">Herencia de filtros</dt>
                  <dd class="font-semibold text-neutral-black tabular-nums">
                    {{ formulario.filtros.length || resumenImpacto.herenciaFiltros }} filtros
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
      </main>

      <!-- Barra de acciones (pie fijo) -->
      <div
        class="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-neutral-light bg-neutral-white/95 px-6 py-3 backdrop-blur"
      >
        <button
          type="button"
          class="rounded-button px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
          :disabled="guardando"
          @click="irA('/admin/catalogo/categorias')"
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
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: CATEGORÍAS · CREAR / EDITAR  (maquetas "ADMIN 10" y "ADMIN 11")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaCategoriaFormulario.vue
 *
 * Alta y edición de categorías y subcategorías (HU-CAT-01): información general,
 * icono, filtros heredados, líneas relacionadas, SEO, jerarquía (tipo + padre +
 * estado + orden) y notas, con vista previa del árbol y resumen de impacto.
 *
 * Permiso requerido: «Gestión del catálogo» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { computed, onMounted, ref } from 'vue';
import {
  ArrowLeft,
  Save,
  Info,
  Filter,
  Bookmark,
  Search,
  FileText,
  Network,
  Eye,
  Folder,
  BarChart3,
  Upload,
  Image as ImageIcon,
} from 'lucide-vue-next';
import BarraLateralAdmin from '../components/BarraLateralAdmin.vue';
import BarraSuperiorAdmin from '../components/BarraSuperiorAdmin.vue';
import TarjetaSeccionFormulario from '../components/TarjetaSeccionFormulario.vue';
import CampoFormulario from '../components/CampoFormulario.vue';
import EntradaEtiquetas from '../components/EntradaEtiquetas.vue';
import ChipsSeleccion from '../components/ChipsSeleccion.vue';
import { useCategoriaFormulario } from '../composables/useCategoriaFormulario';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
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
  alternarLista,
  agregarEtiqueta,
  quitarEtiqueta,
  guardarBorrador,
  guardarCambios,
  formatearNumero,
} = useCategoriaFormulario();

const busquedaGlobal = ref('');

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

// Navegación del panel: la provee el router (o el shell `VistaPanelCatalogo`).
const { irA } = usePanelNavegacion();
</script>
