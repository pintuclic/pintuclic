<template>
  <div class="flex min-h-screen bg-neutral-lightest">
    <BarraLateralAdmin item-activo="marcas" @navegar="irA" />

    <div class="flex min-w-0 flex-1 flex-col">
      <BarraSuperiorAdmin
        v-model:termino-busqueda="busquedaGlobal"
        seccion="Marcas"
        nombre-usuario="Carlos Álvarez"
        rol-usuario="Administrador"
        :notificaciones="3"
      />

      <main class="flex-1 space-y-5 p-6 lg:p-8">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-action hover:underline"
          @click="irA('/admin/catalogo/marcas')"
        >
          <ArrowLeft class="h-4 w-4" aria-hidden="true" />
          Volver a marcas
        </button>

        <div>
          <h1 class="text-2xl font-bold text-neutral-black">
            {{ modo === 'editar' ? 'Editar marca' : 'Crear nueva marca' }}
          </h1>
          <p class="mt-1 text-sm text-neutral-medium">
            Completa la información de la marca. Se mostrará en el catálogo y estará disponible para
            asociar productos.
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
          <div class="space-y-4 lg:col-span-2">
            <div v-for="n in 4" :key="n" class="h-36 animate-pulse rounded-card bg-neutral-white" />
          </div>
          <div class="h-72 animate-pulse rounded-card bg-neutral-white" />
        </div>

        <div v-else class="grid gap-5 lg:grid-cols-3">
          <div class="space-y-5 lg:col-span-2">
            <TarjetaSeccionFormulario
              titulo="Información general"
              descripcion="Datos básicos de la marca."
              :icono="Info"
            >
              <CampoFormulario etiqueta="Nombre de la marca" requerido :error="erroresValidacion.nombre">
                <template #default="{ id }">
                  <input
                    :id="id"
                    :value="formulario.nombre"
                    type="text"
                    :class="[claseInput, erroresValidacion.nombre && claseError]"
                    placeholder="Ej. Pintuco"
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
                    placeholder="Describe la marca, su trayectoria y su propuesta de valor."
                    @input="set({ descripcion: ($event.target as HTMLTextAreaElement).value })"
                  />
                </template>
              </CampoFormulario>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Identidad visual"
              descripcion="Sube el logo y otros elementos visuales."
              :icono="ImageIcon"
            >
              <p class="text-sm font-medium text-neutral-dark">
                Logo principal <span class="text-neutral-medium">*</span>
              </p>
              <div class="flex flex-wrap items-center gap-4">
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
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 rounded-button border border-neutral-light bg-neutral-white px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
                      @click="simularLogo"
                    >
                      <Upload class="h-4 w-4" aria-hidden="true" />
                      {{ formulario.logoUrl ? 'Cambiar imagen' : 'Subir imagen' }}
                    </button>
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
                    PNG, JPG o SVG. Máx. 2 MB. Fondo blanco o transparente, mínimo 400 × 400 px.
                  </p>
                  <p v-if="erroresValidacion.logoUrl" class="text-xs text-neutral-black">
                    {{ erroresValidacion.logoUrl }}
                  </p>
                </div>
              </div>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Datos de la marca"
              descripcion="Información adicional y de contacto."
              :icono="Contact"
            >
              <div class="grid gap-4 sm:grid-cols-2">
                <CampoFormulario etiqueta="Sitio web" :error="erroresValidacion.sitioWeb">
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="formulario.sitioWeb"
                      type="url"
                      :class="[claseInput, erroresValidacion.sitioWeb && claseError]"
                      placeholder="https://www.marca.com"
                      @input="set({ sitioWeb: ($event.target as HTMLInputElement).value })"
                    />
                  </template>
                </CampoFormulario>
                <CampoFormulario etiqueta="País de origen">
                  <template #default="{ id }">
                    <select
                      :id="id"
                      :value="formulario.paisOrigen"
                      :class="claseInput"
                      @change="set({ paisOrigen: ($event.target as HTMLSelectElement).value })"
                    >
                      <option value="">Selecciona…</option>
                      <option v-for="op in opciones.paises" :key="op.valor" :value="op.valor">
                        {{ op.etiqueta }}
                      </option>
                    </select>
                  </template>
                </CampoFormulario>
                <CampoFormulario etiqueta="Contacto" :error="erroresValidacion.contactoEmail">
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="formulario.contactoEmail"
                      type="email"
                      :class="[claseInput, erroresValidacion.contactoEmail && claseError]"
                      placeholder="contacto@marca.com"
                      @input="set({ contactoEmail: ($event.target as HTMLInputElement).value })"
                    />
                  </template>
                </CampoFormulario>
                <CampoFormulario etiqueta="Teléfono">
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="formulario.telefono"
                      type="tel"
                      :class="claseInput"
                      placeholder="+57 601 000 0000"
                      @input="set({ telefono: ($event.target as HTMLInputElement).value })"
                    />
                  </template>
                </CampoFormulario>
              </div>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Relaciones del catálogo"
              descripcion="Asocia líneas, colores y bases disponibles."
              :icono="Network"
            >
              <div>
                <p class="mb-1.5 text-sm font-medium text-neutral-dark">Líneas de productos</p>
                <ChipsSeleccion
                  :opciones="opciones.lineas"
                  :seleccionados="formulario.lineas"
                  etiqueta-agregar="Agregar línea"
                  @alternar="(v) => alternarLista('lineas', v)"
                />
              </div>
              <CampoFormulario etiqueta="Colores disponibles">
                <template #default="{ id }">
                  <select
                    :id="id"
                    :value="formulario.politicaColor"
                    :class="claseInput"
                    @change="set({ politicaColor: ($event.target as HTMLSelectElement).value })"
                  >
                    <option v-for="op in opciones.politicasColor" :key="op.valor" :value="op.valor">
                      {{ op.etiqueta }}
                    </option>
                  </select>
                </template>
              </CampoFormulario>
              <div>
                <p class="mb-1.5 text-sm font-medium text-neutral-dark">Bases compatibles</p>
                <ChipsSeleccion
                  :opciones="opciones.bases"
                  :seleccionados="formulario.basesCompatibles"
                  etiqueta-agregar="Agregar base"
                  @alternar="(v) => alternarLista('basesCompatibles', v)"
                />
              </div>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="SEO y etiquetas"
              descripcion="Optimiza cómo se muestra la marca en buscadores (opcional)."
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
                    placeholder="Marca | Pinturas y recubrimientos"
                    @input="set({ tituloSeo: ($event.target as HTMLInputElement).value })"
                  />
                </template>
              </CampoFormulario>
              <CampoFormulario
                etiqueta="Descripción SEO"
                :contador="{ actual: formulario.descripcionSeo.length, max: 160 }"
              >
                <template #default="{ id }">
                  <textarea
                    :id="id"
                    :value="formulario.descripcionSeo"
                    rows="2"
                    :class="[claseInput, 'resize-y']"
                    placeholder="Resumen para buscadores."
                    @input="set({ descripcionSeo: ($event.target as HTMLTextAreaElement).value })"
                  />
                </template>
              </CampoFormulario>
              <CampoFormulario etiqueta="Etiquetas">
                <EntradaEtiquetas
                  :etiquetas="formulario.etiquetas"
                  placeholder="Ej. pintura, recubrimientos, colombia, hogar…"
                  @agregar="agregarEtiqueta"
                  @quitar="quitarEtiqueta"
                />
              </CampoFormulario>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Notas internas"
              descripcion="Información privada para el equipo administrativo (opcional)."
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
                    placeholder="Ej. Coordinar lanzamientos con el equipo comercial."
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
                <p v-if="formulario.descripcion" class="line-clamp-3 text-xs text-neutral-medium">
                  {{ formulario.descripcion }}
                </p>
                <dl class="space-y-1 border-t border-neutral-light pt-2 text-xs text-neutral-medium">
                  <div v-if="formulario.sitioWeb" class="flex items-center gap-1.5">
                    <Globe class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <dd class="truncate text-neutral-dark">{{ formulario.sitioWeb }}</dd>
                  </div>
                  <div v-if="paisEtiqueta" class="flex items-center gap-1.5">
                    <MapPin class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <dd class="text-neutral-dark">{{ paisEtiqueta }}</dd>
                  </div>
                </dl>
                <div class="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div>
                    <p class="text-sm font-bold text-neutral-black tabular-nums">{{ resumenPrevia.productos }}</p>
                    <p class="text-[11px] text-neutral-medium">Productos</p>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-neutral-black tabular-nums">{{ formulario.lineas.length || resumenPrevia.lineas }}</p>
                    <p class="text-[11px] text-neutral-medium">Líneas</p>
                  </div>
                  <div>
                    <p class="text-sm font-bold text-neutral-black tabular-nums">{{ resumenPrevia.colores }}</p>
                    <p class="text-[11px] text-neutral-medium">Colores</p>
                  </div>
                </div>
              </div>
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
          Completa los campos obligatorios para publicar la marca.
        </p>
        <button
          type="button"
          class="rounded-button px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
          :disabled="guardando"
          @click="irA('/admin/catalogo/marcas')"
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
 * M01 - VISTA: MARCAS · CREAR / EDITAR  (maqueta "ADMIN 13")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaMarcaFormulario.vue
 *
 * Alta y edición de marcas (HU-CAT-04): información general, identidad visual,
 * datos de contacto, relaciones del catálogo (líneas / colores / bases), SEO y
 * notas internas, con vista previa en vivo y checklist de publicación.
 *
 * Permiso requerido: «Gestión del catálogo» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { computed, onMounted, ref } from 'vue';
import {
  ArrowLeft,
  Save,
  Info,
  Contact,
  Network,
  Search,
  FileText,
  Eye,
  Globe,
  MapPin,
  Upload,
  Trash2,
  Image as ImageIcon,
} from 'lucide-vue-next';
import BarraLateralAdmin from '../components/BarraLateralAdmin.vue';
import BarraSuperiorAdmin from '../components/BarraSuperiorAdmin.vue';
import TarjetaSeccionFormulario from '../components/TarjetaSeccionFormulario.vue';
import CampoFormulario from '../components/CampoFormulario.vue';
import EntradaEtiquetas from '../components/EntradaEtiquetas.vue';
import ChipsSeleccion from '../components/ChipsSeleccion.vue';
import ChecklistPublicacion from '../components/ChecklistPublicacion.vue';
import { useMarcaFormulario } from '../composables/useMarcaFormulario';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { LOGO_MARCA_DEMO } from '../assets/imagenes-catalogo';
import type { FormularioMarca } from '../interfaces';

const props = defineProps<{
  /** Id de la marca a editar (lo inyecta el router con `props: true`). Vacío = crear. */
  marcaId?: string;
}>();

const {
  formulario,
  opciones,
  resumenPrevia,
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
  alternarLista,
  agregarEtiqueta,
  quitarEtiqueta,
  quitarLogo,
  guardarBorrador,
  guardarCambios,
} = useMarcaFormulario();

const busquedaGlobal = ref('');

onMounted(() => {
  void inicializar(props.marcaId);
});

const claseInput =
  'w-full rounded-input border border-neutral-light bg-neutral-white px-3 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30 disabled:bg-neutral-lightest disabled:text-neutral-medium';
const claseError = 'border-highlight ring-2 ring-highlight/30';

const paisEtiqueta = computed(
  () => opciones.value.paises.find((p) => p.valor === formulario.value.paisOrigen)?.etiqueta ?? ''
);

function set(parcial: Partial<FormularioMarca>): void {
  actualizar(parcial);
}

/** Sin subida real (HU-CAT-07): asigna una ilustración de ejemplo como logo. */
function simularLogo(): void {
  actualizar({ logoUrl: LOGO_MARCA_DEMO['pintuco'] ?? null });
}

// Navegación del panel: la provee el router (o el shell `VistaPanelCatalogo`).
const { irA } = usePanelNavegacion();
</script>
