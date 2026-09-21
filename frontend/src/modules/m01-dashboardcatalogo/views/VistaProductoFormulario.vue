<template>
  <div class="space-y-5 p-6 lg:p-8">
    <Button variant="text" :icon="ArrowLeft" @click="irA('/admin/catalogo/productos')">
      Volver a productos
    </Button>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-black">
          {{ esEdicion ? 'Editar producto' : 'Crear nuevo producto' }}
        </h1>
        <p class="mt-1 text-sm text-neutral-medium">
          {{
            esEdicion
              ? 'Actualiza la información del producto. Los cambios se reflejarán en el catálogo de Pintu Clic.'
              : 'Completa la información del producto para publicarlo en Pintu Clic.'
          }}
        </p>
      </div>

      <div v-if="esEdicion" class="flex shrink-0 flex-wrap gap-2">
        <Button variant="outline" size="sm" :icon="ExternalLink" title="Disponible al conectar la tienda pública.">
          Ver en catálogo
        </Button>
        <Button variant="outline" size="sm" :icon="Copy" @click="irA('/admin/catalogo/productos/nuevo')">
          Duplicar producto
        </Button>
      </div>
    </div>

    <p
      v-if="desactivado"
      class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
    >
      El producto quedó <strong>desactivado</strong> y ya no se muestra en el catálogo público.
    </p>
    <p
      v-else-if="guardadoOk"
      class="rounded-card border border-conversion/40 bg-conversion/10 px-4 py-3 text-sm text-neutral-dark"
    >
      Cambios guardados. El producto quedó como
      <strong>{{ ETIQUETA_ESTADO[formulario.estado] }}</strong>.
    </p>
    <p
      v-else-if="error"
      class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
    >
      {{ error }}
    </p>

    <div v-if="cargando" class="grid gap-5 lg:grid-cols-3">
      <div class="space-y-4 lg:col-span-2">
        <div v-for="n in 4" :key="n" class="h-40 animate-pulse rounded-card bg-neutral-white" />
      </div>
      <div class="h-72 animate-pulse rounded-card bg-neutral-white" />
    </div>

    <div v-else class="grid gap-5 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <FormularioProducto />
      </div>

      <aside class="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <VistaPreviaProducto
          :formulario="formulario"
          :color="colorPrincipal"
          :meta="metaVistaPrevia"
        />

        <!-- Modo crear: checklist de publicación -->
        <ChecklistPublicacion
          v-if="!esEdicion"
          :checklist="checklist"
          :progreso="progresoChecklist"
        />

        <!-- Modo editar: relacionados + historial (maqueta ADMIN 04) -->
        <template v-else-if="detalleEdicion">
          <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
            <h2 class="text-base font-semibold text-neutral-black">
              Variantes y productos relacionados
            </h2>
            <dl class="mt-3 space-y-3">
              <div class="flex items-start gap-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-card bg-subaction text-corporate">
                  <Layers class="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <dt class="font-medium text-neutral-black">
                    {{ detalleEdicion.variantesActivas }} variantes activas
                  </dt>
                  <dd class="text-xs text-neutral-medium">Diferentes presentaciones y bases.</dd>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-card bg-subaction text-corporate">
                  <Link2 class="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <dt class="font-medium text-neutral-black">
                    {{ detalleEdicion.productosRelacionados }} productos relacionados
                  </dt>
                  <dd class="text-xs text-neutral-medium">Combos y complementos.</dd>
                </div>
              </div>
            </dl>
            <div class="mt-4 flex flex-wrap gap-4 text-sm font-medium text-action">
              <button type="button" class="hover:underline" @click="irA('/admin/catalogo/variantes')">
                Ver variantes →
              </button>
              <button type="button" class="hover:underline" @click="irA('/admin/catalogo/productos')">
                Ver productos relacionados →
              </button>
            </div>
          </section>

          <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
            <h2 class="text-base font-semibold text-neutral-black">Historial / auditoría</h2>
            <ol class="mt-3 space-y-4">
              <li
                v-for="(mov, i) in detalleEdicion.historial"
                :key="mov.id"
                class="relative flex gap-3 pl-4"
              >
                <span
                  class="absolute left-0 top-1.5 h-2 w-2 rounded-full"
                  :class="i === 0 ? 'bg-action' : 'bg-neutral-light'"
                  aria-hidden="true"
                />
                <span
                  v-if="i < detalleEdicion.historial.length - 1"
                  class="absolute left-[3px] top-3 h-full w-px bg-neutral-light"
                  aria-hidden="true"
                />
                <div class="text-sm">
                  <p class="text-neutral-dark">{{ mov.descripcion }}</p>
                  <p class="text-xs text-neutral-medium">
                    {{ formatearFechaHora(mov.fechaHora) }} · por {{ mov.usuario }}
                  </p>
                </div>
              </li>
            </ol>
            <button
              type="button"
              class="mt-3 text-sm font-medium text-action hover:underline"
            >
              Ver historial completo →
            </button>
          </section>
        </template>
      </aside>
    </div>
  </div>

  <!-- Barra de acciones (pie fijo) -->
  <div
    class="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-neutral-light bg-neutral-white/95 px-6 py-3 backdrop-blur"
  >
    <p v-if="!esEdicion && !puedePublicar" class="mr-auto text-xs text-neutral-medium">
      Completa los campos obligatorios para habilitar la publicación.
    </p>

    <Button variant="text" :disabled="guardando" @click="irA('/admin/catalogo/productos')">
      Cancelar
    </Button>

    <!-- Modo crear -->
    <template v-if="!esEdicion">
      <Button variant="outline" :icon="Save" :disabled="guardando" @click="guardarBorrador">
        Guardar borrador
      </Button>
      <Button variant="conversion" :icon="Send" :disabled="guardando || !puedePublicar" @click="publicar">
        Publicar producto
      </Button>
    </template>

    <!-- Modo editar -->
    <template v-else>
      <Button
        v-if="formulario.estado === 'inactivo'"
        variant="outline"
        :icon="Power"
        :disabled="guardando"
        @click="reactivar"
      >
        Reactivar producto
      </Button>
      <Button v-else variant="outline" :icon="Power" :disabled="guardando" @click="confirmarDesactivar">
        Desactivar producto
      </Button>
      <Button variant="action" :icon="Save" :disabled="guardando" @click="guardarCambios">
        Guardar cambios
      </Button>
    </template>
  </div>

  <ModalConfirmarAccion
    v-model="mostrarConfirmarDesactivar"
    titulo="¿Desactivar producto?"
    mensaje="Dejará de mostrarse en el catálogo público."
    @confirmar="ejecutarDesactivar"
  />
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: PRODUCTOS · CREAR / EDITAR  (maquetas "ADMIN 03" y "ADMIN 04")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaProductoFormulario.vue
 *
 * Alta y edición de productos: información general, clasificación, marca y línea,
 * clase de color (HU-CAT-05), atributos técnicos, bases y entonado, imágenes
 * (HU-CAT-07), información comercial y etiquetas.
 *
 * En modo «crear» acompaña el checklist de publicación y la vista previa en vivo
 * (HU-CAT-02). En modo «editar» muestra además metadatos de auditoría, conteos
 * de variantes/relacionados e historial de cambios, y permite desactivar.
 *
 * Permiso requerido: «Gestión de productos» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { computed, onMounted, ref } from 'vue';
import {
  ArrowLeft,
  Save,
  Send,
  Power,
  Copy,
  ExternalLink,
  Layers,
  Link2,
} from 'lucide-vue-next';
import { Button } from '@/core/components';
import FormularioProducto from '../components/FormularioProducto.vue';
import VistaPreviaProducto from '../components/VistaPreviaProducto.vue';
import ChecklistPublicacion from '../components/ChecklistPublicacion.vue';
import ModalConfirmarAccion from '../components/ModalConfirmarAccion.vue';
import { useProductoFormulario } from '../composables/useProductoFormulario';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import type { EstadoPublicacion } from '../interfaces';

const props = defineProps<{
  /** Id del producto a editar (lo inyecta el router con `props: true`). Vacío = crear. */
  productoId?: string;
}>();

const {
  formulario,
  modo,
  detalleEdicion,
  cargando,
  guardando,
  error,
  guardadoOk,
  desactivado,
  colorPrincipal,
  checklist,
  progresoChecklist,
  puedePublicar,
  inicializar,
  guardarBorrador,
  publicar,
  guardarCambios,
  desactivar,
  reactivar,
  formatearFecha,
  formatearFechaHora,
} = useProductoFormulario();

onMounted(() => {
  void inicializar(props.productoId);
});

const esEdicion = computed(() => modo.value === 'editar');

/**
 * Publicación y activación son ejes distintos en el backend: un producto
 * desactivado queda `inactivo`, no `borrador`.
 */
const ETIQUETA_ESTADO: Record<EstadoPublicacion, string> = {
  publicado: 'publicado',
  borrador: 'borrador',
  inactivo: 'inactivo',
};

/** Metadatos de auditoría de la vista previa (solo en modo editar). */
const metaVistaPrevia = computed(() =>
  detalleEdicion.value
    ? {
        actualizadoEn: formatearFecha(detalleEdicion.value.actualizadoEn),
        creadoPor: detalleEdicion.value.creadoPor,
      }
    : null
);

const mostrarConfirmarDesactivar = ref(false);
function confirmarDesactivar(): void {
  mostrarConfirmarDesactivar.value = true;
}
function ejecutarDesactivar(): void {
  mostrarConfirmarDesactivar.value = false;
  void desactivar();
}

// Navegación del panel: la provee el router (dashboardCatalogoRoutes).
const { irA } = usePanelNavegacion();
</script>
