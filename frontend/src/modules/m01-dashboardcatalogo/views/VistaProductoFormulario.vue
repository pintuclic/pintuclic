<template>
  <div class="flex min-h-screen bg-neutral-lightest">
    <BarraLateralAdmin item-activo="productos" @navegar="irA" />

    <div class="flex min-w-0 flex-1 flex-col">
      <BarraSuperiorAdmin
        v-model:termino-busqueda="busquedaGlobal"
        seccion="Productos"
        nombre-usuario="Carlos Álvarez"
        rol-usuario="Administrador"
        :notificaciones="3"
      />

      <main class="flex-1 space-y-5 p-6 lg:p-8">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-action hover:underline"
          @click="irA('/admin/catalogo/productos')"
        >
          <ArrowLeft class="h-4 w-4" aria-hidden="true" />
          Volver a productos
        </button>

        <div>
          <h1 class="text-2xl font-bold text-neutral-black">
            {{ modo === 'editar' ? 'Editar producto' : 'Crear nuevo producto' }}
          </h1>
          <p class="mt-1 text-sm text-neutral-medium">
            Completa la información del producto para publicarlo en Pintu Clic.
          </p>
        </div>

        <p
          v-if="guardadoOk"
          class="rounded-card border border-conversion/40 bg-conversion/10 px-4 py-3 text-sm text-neutral-dark"
        >
          Cambios guardados. El producto quedó como
          <strong>{{ formulario.estado === 'publicado' ? 'publicado' : 'borrador' }}</strong>.
        </p>
        <p
          v-else-if="usandoDatosDemo"
          class="rounded-card border border-highlight/40 bg-highlight/10 px-4 py-3 text-sm text-neutral-dark"
        >
          Datos de ejemplo. El formulario usará
          <code class="font-medium">/api/catalogo/productos</code> cuando el backend de M01 lo publique.
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
            <VistaPreviaProducto :formulario="formulario" :color="colorPrincipal" />
            <ChecklistPublicacion :checklist="checklist" :progreso="progresoChecklist" />
          </aside>
        </div>
      </main>

      <!-- Barra de acciones (pie fijo) -->
      <div
        class="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-neutral-light bg-neutral-white/95 px-6 py-3 backdrop-blur"
      >
        <p v-if="!puedePublicar" class="mr-auto text-xs text-neutral-medium">
          Completa los campos obligatorios para habilitar la publicación.
        </p>
        <button
          type="button"
          class="rounded-button px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
          :disabled="guardando"
          @click="irA('/admin/catalogo/productos')"
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
          class="inline-flex items-center gap-2 rounded-button bg-conversion px-4 py-2 text-sm font-medium text-neutral-white hover:bg-conversion-hover disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="guardando || !puedePublicar"
          @click="publicar"
        >
          <Send class="h-4 w-4" aria-hidden="true" />
          {{ modo === 'editar' ? 'Guardar y publicar' : 'Publicar producto' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: PRODUCTOS · CREAR / EDITAR  (maqueta "ADMIN 03")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaProductoFormulario.vue
 *
 * Alta y edición de productos: información general, clasificación, marca y línea,
 * clase de color (HU-CAT-05), imágenes (HU-CAT-07), información comercial y
 * etiquetas, con checklist de publicación y vista previa en vivo (HU-CAT-02).
 *
 * Permiso requerido: «Gestión de productos» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { onMounted, ref } from 'vue';
import { ArrowLeft, Save, Send } from 'lucide-vue-next';
import BarraLateralAdmin from '../components/BarraLateralAdmin.vue';
import BarraSuperiorAdmin from '../components/BarraSuperiorAdmin.vue';
import FormularioProducto from '../components/FormularioProducto.vue';
import VistaPreviaProducto from '../components/VistaPreviaProducto.vue';
import ChecklistPublicacion from '../components/ChecklistPublicacion.vue';
import { useProductoFormulario } from '../composables/useProductoFormulario';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';

const props = defineProps<{
  /** Id del producto a editar (lo inyecta el router con `props: true`). Vacío = crear. */
  productoId?: string;
}>();

const {
  formulario,
  modo,
  cargando,
  guardando,
  error,
  usandoDatosDemo,
  guardadoOk,
  colorPrincipal,
  checklist,
  progresoChecklist,
  puedePublicar,
  inicializar,
  guardarBorrador,
  publicar,
} = useProductoFormulario();

onMounted(() => {
  void inicializar(props.productoId);
});

const busquedaGlobal = ref('');

// Navegación del panel: la provee `VistaPanelCatalogo.vue` (shell).
const { irA } = usePanelNavegacion();
</script>
