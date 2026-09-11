<template>
  <div class="flex min-h-screen bg-neutral-lightest">
    <BarraLateralAdmin item-activo="lineas" @navegar="irA" />

    <div class="flex min-w-0 flex-1 flex-col">
      <BarraSuperiorAdmin
        v-model:termino-busqueda="busquedaGlobal"
        seccion="Líneas comerciales"
        nombre-usuario="Carlos Álvarez"
        rol-usuario="Administrador"
        :notificaciones="3"
      />

      <main class="flex-1 space-y-5 p-6 lg:p-8">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-action hover:underline"
          @click="irA('/admin/catalogo/lineas')"
        >
          <ArrowLeft class="h-4 w-4" aria-hidden="true" />
          Volver a líneas comerciales
        </button>

        <div>
          <h1 class="text-2xl font-bold text-neutral-black">
            {{ modo === 'editar' ? 'Editar línea comercial' : 'Crear línea comercial' }}
          </h1>
          <p class="mt-1 text-sm text-neutral-medium">
            Define la información de la línea comercial. Organiza sus productos, clasificación y
            visibilidad en Pintu Clic.
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
              descripcion="Datos básicos de la línea comercial."
              :icono="Info"
            >
              <CampoFormulario etiqueta="Nombre de la línea" requerido :error="erroresValidacion.nombre">
                <template #default="{ id }">
                  <input
                    :id="id"
                    :value="formulario.nombre"
                    type="text"
                    :class="[claseInput, erroresValidacion.nombre && claseError]"
                    placeholder="Ej. Viniltex Advanced"
                    @input="set({ nombre: ($event.target as HTMLInputElement).value })"
                  />
                </template>
              </CampoFormulario>
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
                    placeholder="Describe la gama, su propuesta de valor y para qué espacios está pensada."
                    @input="set({ descripcion: ($event.target as HTMLTextAreaElement).value })"
                  />
                </template>
              </CampoFormulario>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Clasificación y uso"
              descripcion="Define a qué marca pertenece y su categoría de uso."
              :icono="Layers"
            >
              <div class="grid gap-4 sm:grid-cols-2">
                <CampoFormulario etiqueta="Marca" requerido :error="erroresValidacion.marca">
                  <template #default="{ id }">
                    <select
                      :id="id"
                      :value="formulario.marca"
                      :class="[claseInput, erroresValidacion.marca && claseError]"
                      @change="set({ marca: ($event.target as HTMLSelectElement).value })"
                    >
                      <option value="">Selecciona…</option>
                      <option v-for="op in opciones.marcas" :key="op.valor" :value="op.valor">
                        {{ op.etiqueta }}
                      </option>
                    </select>
                  </template>
                </CampoFormulario>
                <CampoFormulario etiqueta="Categoría" requerido :error="erroresValidacion.categoria">
                  <template #default="{ id }">
                    <select
                      :id="id"
                      :value="formulario.categoria"
                      :class="[claseInput, erroresValidacion.categoria && claseError]"
                      @change="set({ categoria: ($event.target as HTMLSelectElement).value })"
                    >
                      <option value="">Selecciona…</option>
                      <option v-for="op in opciones.categorias" :key="op.valor" :value="op.valor">
                        {{ op.etiqueta }}
                      </option>
                    </select>
                  </template>
                </CampoFormulario>
                <CampoFormulario etiqueta="Subcategoría">
                  <template #default="{ id }">
                    <select
                      :id="id"
                      :value="formulario.subcategoria"
                      :class="claseInput"
                      @change="set({ subcategoria: ($event.target as HTMLSelectElement).value })"
                    >
                      <option value="">Selecciona…</option>
                      <option v-for="op in opciones.subcategorias" :key="op.valor" :value="op.valor">
                        {{ op.etiqueta }}
                      </option>
                    </select>
                  </template>
                </CampoFormulario>
                <CampoFormulario etiqueta="Tipo de línea">
                  <template #default="{ id }">
                    <select
                      :id="id"
                      :value="formulario.tipoLinea"
                      :class="claseInput"
                      @change="set({ tipoLinea: ($event.target as HTMLSelectElement).value })"
                    >
                      <option value="">Selecciona…</option>
                      <option v-for="op in opciones.tiposLinea" :key="op.valor" :value="op.valor">
                        {{ op.etiqueta }}
                      </option>
                    </select>
                  </template>
                </CampoFormulario>
              </div>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Estado y visibilidad"
              descripcion="Controla la publicación y visibilidad de la línea."
              :icono="Eye"
            >
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

              <fieldset class="space-y-2.5">
                <legend class="mb-1 text-sm font-medium text-neutral-dark">Visibilidad en el sitio</legend>
                <label
                  v-for="op in OPCIONES_VISIBILIDAD"
                  :key="op.clave"
                  class="flex cursor-pointer items-start gap-2.5 text-sm"
                >
                  <input
                    type="checkbox"
                    class="mt-0.5 h-4 w-4 shrink-0 accent-action"
                    :checked="formulario[op.clave]"
                    @change="set({ [op.clave]: ($event.target as HTMLInputElement).checked })"
                  />
                  <span>
                    <span class="block font-medium text-neutral-dark">{{ op.titulo }}</span>
                    <span class="block text-xs text-neutral-medium">{{ op.descripcion }}</span>
                  </span>
                </label>
              </fieldset>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Productos asociados"
              descripcion="Asocia productos existentes a esta línea."
              :icono="Package"
            >
              <ChipsSeleccion
                :opciones="opciones.productos"
                :seleccionados="formulario.productosAsociados"
                etiqueta-agregar="Agregar productos"
                @alternar="alternarProducto"
              />
              <p class="text-xs text-neutral-medium">
                {{ formulario.productosAsociados.length }} producto(s) asociado(s) a esta línea.
              </p>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Etiquetas / SEO"
              descripcion="Mejora la búsqueda y posicionamiento de la línea (opcional)."
              :icono="Search"
            >
              <CampoFormulario etiqueta="Etiquetas">
                <EntradaEtiquetas
                  :etiquetas="formulario.etiquetas"
                  placeholder="Escribe una etiqueta y presiona Enter…"
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
                :contador="{ actual: formulario.notasInternas.length, max: 500 }"
              >
                <template #default="{ id }">
                  <textarea
                    :id="id"
                    :value="formulario.notasInternas"
                    rows="3"
                    :class="[claseInput, 'resize-y']"
                    placeholder="Ej. Línea prioritaria para campaña Q3. Revisar precios y stock."
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
                Vista previa de la línea
              </header>
              <div class="grid h-28 place-items-center rounded-card border border-neutral-light bg-neutral-lightest">
                <img
                  v-if="formulario.imagenUrl"
                  :src="formulario.imagenUrl"
                  :alt="formulario.nombre || 'Línea'"
                  class="h-full w-full object-contain p-4"
                />
                <Layers v-else class="h-7 w-7 text-neutral-light" aria-hidden="true" />
              </div>
              <div class="mt-3 space-y-2">
                <p class="text-xs text-neutral-medium">{{ marcaEtiqueta || 'Marca' }}</p>
                <p class="text-base font-semibold text-neutral-black">
                  {{ formulario.nombre || 'Nombre de la línea' }}
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
                <p class="flex items-center gap-1.5 text-xs" :class="formulario.mostrarEnCatalogo ? 'text-conversion' : 'text-neutral-medium'">
                  <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  {{ formulario.mostrarEnCatalogo ? 'Visible en catálogo' : 'Oculta en catálogo' }}
                </p>
              </div>
            </section>

            <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
              <header class="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-black">
                <BarChart3 class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
                Dependencias / Resumen de impacto
              </header>
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-card bg-conversion/10 p-3">
                  <Package class="h-5 w-5 text-conversion" aria-hidden="true" />
                  <p class="mt-1.5 text-lg font-bold text-neutral-black tabular-nums">
                    {{ productosImpacto }}
                  </p>
                  <p class="text-[11px] text-neutral-medium">Productos asociados</p>
                </div>
                <div class="rounded-card bg-subaction p-3">
                  <Settings class="h-5 w-5 text-corporate" aria-hidden="true" />
                  <p class="mt-1.5 text-lg font-bold text-neutral-black tabular-nums">
                    {{ impacto.reglasVigentes }}
                  </p>
                  <p class="text-[11px] text-neutral-medium">Reglas de precios</p>
                </div>
              </div>
              <p class="mt-3 flex items-start gap-1.5 text-xs text-neutral-medium">
                <Info class="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Al realizar cambios en esta línea, los productos asociados heredarán la nueva
                configuración de visibilidad y clasificación.
              </p>
            </section>

            <ChecklistPublicacion :checklist="checklist" :progreso="progresoChecklist" />
          </aside>
        </div>
      </main>

      <!-- Barra de acciones (pie fijo) -->
      <div
        class="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-neutral-light bg-neutral-white/95 px-6 py-3 backdrop-blur"
      >
        <p v-if="!puedePublicar" class="mr-auto text-xs text-neutral-medium">
          Completa los campos obligatorios para publicar la línea.
        </p>
        <button
          type="button"
          class="rounded-button px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
          :disabled="guardando"
          @click="irA('/admin/catalogo/lineas')"
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
 * M01 - VISTA: LÍNEAS · CREAR / EDITAR  (maqueta "ADMIN 16")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaLineaFormulario.vue
 *
 * Alta y edición de líneas comerciales (RF-CAT-11): información general,
 * clasificación y uso, estado/visibilidad, productos asociados, etiquetas y
 * notas, con vista previa en vivo, resumen de impacto y checklist de publicación.
 *
 * Permiso requerido: «Gestión del catálogo» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { computed, onMounted, ref } from 'vue';
import {
  ArrowLeft,
  Save,
  Info,
  Layers,
  Eye,
  Package,
  Search,
  FileText,
  Settings,
  BarChart3,
} from 'lucide-vue-next';
import BarraLateralAdmin from '../components/BarraLateralAdmin.vue';
import BarraSuperiorAdmin from '../components/BarraSuperiorAdmin.vue';
import TarjetaSeccionFormulario from '../components/TarjetaSeccionFormulario.vue';
import CampoFormulario from '../components/CampoFormulario.vue';
import EntradaEtiquetas from '../components/EntradaEtiquetas.vue';
import ChipsSeleccion from '../components/ChipsSeleccion.vue';
import ChecklistPublicacion from '../components/ChecklistPublicacion.vue';
import { useLineaFormulario } from '../composables/useLineaFormulario';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import type { EstadoLinea, FormularioLinea } from '../interfaces';

const props = defineProps<{
  /** Id de la línea a editar (lo inyecta el router con `props: true`). Vacío = crear. */
  lineaId?: string;
}>();

const {
  formulario,
  opciones,
  impacto,
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
  alternarProducto,
  agregarEtiqueta,
  quitarEtiqueta,
  guardarBorrador,
  guardarCambios,
} = useLineaFormulario();

const busquedaGlobal = ref('');

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

const OPCIONES_VISIBILIDAD: {
  clave: 'mostrarEnCatalogo' | 'mostrarEnFiltros' | 'destacarEnPortada';
  titulo: string;
  descripcion: string;
}[] = [
  { clave: 'mostrarEnCatalogo', titulo: 'Mostrar en catálogo público', descripcion: 'La línea será visible en la tienda online.' },
  { clave: 'mostrarEnFiltros', titulo: 'Mostrar en filtros y navegación', descripcion: 'Permite filtrar productos por esta línea.' },
  { clave: 'destacarEnPortada', titulo: 'Destacar en portada', descripcion: 'Muestra la línea en secciones destacadas del sitio.' },
];

const marcaEtiqueta = computed(
  () => opciones.value.marcas.find((m) => m.valor === formulario.value.marca)?.etiqueta ?? ''
);

// En edición prevalece el impacto real; al crear refleja lo asociado en vivo.
const productosImpacto = computed(() =>
  modo.value === 'editar'
    ? impacto.value.productosAsociados
    : formulario.value.productosAsociados.length
);

function set(parcial: Partial<FormularioLinea>): void {
  actualizar(parcial);
}

const { irA } = usePanelNavegacion();
</script>
