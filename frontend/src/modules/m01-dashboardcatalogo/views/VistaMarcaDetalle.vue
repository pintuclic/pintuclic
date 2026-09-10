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

        <div v-if="cargando" class="space-y-5">
          <div class="h-52 animate-pulse rounded-card bg-neutral-white" />
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div v-for="n in 4" :key="n" class="h-24 animate-pulse rounded-card bg-neutral-white" />
          </div>
          <div class="h-80 animate-pulse rounded-card bg-neutral-white" />
        </div>

        <template v-else-if="detalle">
          <p
            v-if="desactivado"
            class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
          >
            La marca quedó <strong>inactiva</strong> y ya no se muestra en el catálogo público.
          </p>

          <!-- Encabezado -->
          <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
            <div class="flex flex-col gap-5 lg:flex-row">
              <div class="grid h-28 w-28 shrink-0 place-items-center rounded-card border border-neutral-light bg-neutral-lightest">
                <img
                  v-if="detalle.logoUrl"
                  :src="detalle.logoUrl"
                  :alt="detalle.nombre"
                  class="h-full w-full object-contain p-3"
                />
                <ImageIcon v-else class="h-7 w-7 text-neutral-light" aria-hidden="true" />
              </div>

              <div class="min-w-0 flex-1 space-y-2">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <h1 class="text-2xl font-bold text-neutral-black">{{ detalle.nombre }}</h1>
                      <span
                        class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
                        :class="detalle.estado === 'activa' ? 'bg-conversion/10 text-conversion' : 'bg-neutral-light text-neutral-medium'"
                      >
                        <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                        {{ detalle.estado === 'activa' ? 'Activa' : 'Inactiva' }}
                      </span>
                    </div>
                    <p class="mt-0.5 text-sm text-neutral-medium">{{ detalle.eslogan }}</p>
                  </div>

                  <div class="flex flex-wrap gap-2">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 rounded-button bg-action px-3 py-2 text-sm font-medium text-neutral-white hover:bg-action-hover"
                      @click="irA(`/admin/catalogo/marcas/${detalle.id}/editar`)"
                    >
                      <Pencil class="h-4 w-4" aria-hidden="true" />
                      Editar marca
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 rounded-button border border-neutral-light bg-neutral-white px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
                      @click="irA('/admin/catalogo/variantes')"
                    >
                      <List class="h-4 w-4" aria-hidden="true" />
                      Ver líneas
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 rounded-button border border-neutral-light bg-neutral-white px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest disabled:opacity-50"
                      :disabled="guardando || detalle.estado === 'inactiva'"
                      @click="confirmarDesactivar"
                    >
                      <Power class="h-4 w-4" aria-hidden="true" />
                      Desactivar
                    </button>
                  </div>
                </div>

                <p class="text-sm text-neutral-dark">{{ detalle.descripcion }}</p>

                <dl class="grid gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt class="text-xs text-neutral-medium">Sitio web</dt>
                    <dd class="truncate text-sm font-medium text-action">{{ detalle.sitioWeb }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-neutral-medium">País de origen</dt>
                    <dd class="text-sm font-medium text-neutral-dark">{{ detalle.paisOrigen }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-neutral-medium">Año de fundación</dt>
                    <dd class="text-sm font-medium text-neutral-dark">{{ detalle.anioFundacion }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-neutral-medium">Tipo de marca</dt>
                    <dd class="text-sm font-medium text-neutral-dark">{{ detalle.tipoMarca }}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <!-- Indicadores -->
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article
              v-for="kpi in indicadores"
              :key="kpi.etiqueta"
              class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm"
            >
              <p class="text-xs font-medium text-neutral-medium">{{ kpi.etiqueta }}</p>
              <p class="mt-2 text-xl font-bold text-neutral-black tabular-nums">
                {{ formatearNumero(kpi.valor) }}
              </p>
              <button
                type="button"
                class="mt-1 text-xs font-medium text-action hover:underline"
                @click="irA(kpi.destino)"
              >
                {{ kpi.enlace }} →
              </button>
            </article>
          </div>

          <div class="grid gap-5 xl:grid-cols-3">
            <div class="space-y-5 xl:col-span-2">
              <!-- Pestañas -->
              <div class="flex flex-wrap gap-1 border-b border-neutral-light">
                <button
                  v-for="tab in PESTANAS"
                  :key="tab.clave"
                  type="button"
                  class="border-b-2 px-3 py-2 text-sm font-medium transition-colors"
                  :class="
                    pestanaActiva === tab.clave
                      ? 'border-action text-action'
                      : 'border-transparent text-neutral-medium hover:text-neutral-dark'
                  "
                  @click="setPestana(tab.clave)"
                >
                  {{ tab.etiqueta }}{{ tab.contador !== undefined ? ` (${tab.contador})` : '' }}
                </button>
              </div>

              <!-- Información general -->
              <div v-if="pestanaActiva === 'general'" class="space-y-5">
                <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
                  <h2 class="mb-2 text-base font-semibold text-neutral-black">Descripción de la marca</h2>
                  <p class="text-sm text-neutral-dark">{{ detalle.descripcion }}</p>
                </section>

                <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
                  <h2 class="mb-3 text-base font-semibold text-neutral-black">Imágenes y recursos de marca</h2>
                  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <figure
                      v-for="img in detalle.imagenes"
                      :key="img.id"
                      class="space-y-1.5"
                    >
                      <div class="grid aspect-square place-items-center overflow-hidden rounded-input border border-neutral-light bg-neutral-lightest">
                        <img :src="img.url" :alt="img.nombre" class="h-full w-full object-contain p-2" />
                      </div>
                      <figcaption class="text-center text-[11px] text-neutral-medium">{{ img.nombre }}</figcaption>
                    </figure>
                  </div>
                </section>

                <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
                  <h2 class="mb-3 text-base font-semibold text-neutral-black">Documentos y enlaces</h2>
                  <ul class="grid gap-3 sm:grid-cols-3">
                    <li
                      v-for="doc in detalle.documentos"
                      :key="doc.id"
                      class="flex items-center justify-between gap-2 rounded-card border border-neutral-light p-3"
                    >
                      <div class="min-w-0">
                        <p class="truncate text-sm font-medium text-neutral-dark">{{ doc.nombre }}</p>
                        <p class="text-xs text-neutral-medium">{{ doc.peso }}</p>
                      </div>
                      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-button text-neutral-medium" aria-hidden="true">
                        <Download class="h-4 w-4" />
                      </span>
                    </li>
                  </ul>
                </section>
              </div>

              <!-- Líneas comerciales -->
              <section
                v-else-if="pestanaActiva === 'lineas'"
                class="rounded-card border border-neutral-light bg-neutral-white shadow-sm"
              >
                <table class="w-full text-left text-sm">
                  <thead>
                    <tr class="border-b border-neutral-light text-xs uppercase tracking-wide text-neutral-medium">
                      <th scope="col" class="px-4 py-2.5 font-semibold">Línea</th>
                      <th scope="col" class="px-3 py-2.5 text-center font-semibold">Productos</th>
                      <th scope="col" class="px-3 py-2.5 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="l in detalle.lineas" :key="l.id" class="border-b border-neutral-light last:border-0">
                      <td class="px-4 py-2.5 font-medium text-neutral-dark">{{ l.nombre }}</td>
                      <td class="px-3 py-2.5 text-center tabular-nums text-neutral-dark">{{ l.productos }}</td>
                      <td class="px-3 py-2.5">
                        <span
                          class="inline-flex items-center gap-1.5 rounded-button px-2 py-0.5 text-xs font-medium"
                          :class="l.estado === 'activa' ? 'bg-conversion/10 text-conversion' : 'bg-neutral-light text-neutral-medium'"
                        >
                          {{ l.estado === 'activa' ? 'Activa' : 'Inactiva' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>

              <!-- Colores asociados -->
              <section
                v-else-if="pestanaActiva === 'colores'"
                class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm"
              >
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="c in detalle.colores"
                    :key="c.codigo"
                    class="flex items-center gap-1.5 rounded-button border border-neutral-light px-2 py-1 text-xs text-neutral-dark"
                  >
                    <span
                      class="h-3.5 w-3.5 rounded-full border border-neutral-light"
                      :style="{ backgroundColor: c.hex }"
                      aria-hidden="true"
                    />
                    {{ c.nombre }} · {{ c.codigo }}
                  </span>
                </div>
              </section>

              <!-- Productos destacados -->
              <section
                v-else-if="pestanaActiva === 'destacados'"
                class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm"
              >
                <ul class="divide-y divide-neutral-light text-sm">
                  <li
                    v-for="p in detalle.productosDestacados"
                    :key="p.id"
                    class="flex items-center justify-between gap-3 py-2.5"
                  >
                    <button
                      type="button"
                      class="text-left font-medium text-neutral-dark hover:text-action"
                      @click="irA(`/admin/catalogo/productos/${p.id}`)"
                    >
                      {{ p.nombre }}
                    </button>
                    <span class="tabular-nums text-neutral-dark">${{ formatearNumero(p.precio) }}</span>
                  </li>
                </ul>
              </section>

              <!-- Bases -->
              <section
                v-else-if="pestanaActiva === 'bases'"
                class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm"
              >
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="base in detalle.bases"
                    :key="base"
                    class="rounded-button bg-neutral-lightest px-2.5 py-1 text-xs font-medium text-neutral-dark"
                  >
                    {{ base }}
                  </span>
                </div>
              </section>

              <!-- Historial -->
              <section
                v-else
                class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm"
              >
                <ol class="space-y-4">
                  <li
                    v-for="(mov, i) in detalle.historial"
                    :key="mov.id"
                    class="relative flex gap-3 pl-4"
                  >
                    <span
                      class="absolute left-0 top-1.5 h-2 w-2 rounded-full"
                      :class="i === 0 ? 'bg-action' : 'bg-neutral-light'"
                      aria-hidden="true"
                    />
                    <span
                      v-if="i < detalle.historial.length - 1"
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
              </section>
            </div>

            <!-- Columna derecha -->
            <aside class="space-y-5">
              <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
                <h2 class="mb-3 text-base font-semibold text-neutral-black">Estado y visibilidad</h2>
                <p
                  class="flex items-center gap-2 rounded-card p-3 text-sm font-medium"
                  :class="detalle.estado === 'activa' ? 'bg-conversion/10 text-conversion' : 'bg-neutral-lightest text-neutral-medium'"
                >
                  <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
                  {{ detalle.estado === 'activa' ? 'Marca activa · visible en el catálogo' : 'Marca inactiva' }}
                </p>
                <dl class="mt-3 space-y-2.5 text-sm">
                  <div class="flex justify-between gap-3">
                    <dt class="text-neutral-medium">Visible en la tienda</dt>
                    <dd class="font-medium text-neutral-dark">{{ detalle.visibleEnTienda ? 'Sí' : 'No' }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-neutral-medium">Aparece en búsquedas</dt>
                    <dd class="font-medium text-neutral-dark">{{ detalle.apareceEnBusquedas ? 'Sí' : 'No' }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-neutral-medium">Orden de visualización</dt>
                    <dd class="font-medium text-neutral-dark tabular-nums">{{ detalle.ordenVisualizacion }}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-neutral-medium">Última actualización</dt>
                    <dd class="text-right font-medium text-neutral-dark">
                      {{ formatearFecha(detalle.actualizadoEn) }}<br />
                      <span class="text-xs font-normal text-neutral-medium">por {{ detalle.actualizadoPor }}</span>
                    </dd>
                  </div>
                </dl>
              </section>

              <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
                <h2 class="mb-3 text-base font-semibold text-neutral-black">Relaciones y uso</h2>
                <ul class="divide-y divide-neutral-light text-sm">
                  <li
                    v-for="rel in indicadores"
                    :key="rel.etiqueta"
                    class="flex items-center justify-between gap-3 py-2.5"
                  >
                    <span class="text-neutral-medium">{{ rel.etiqueta }}</span>
                    <button
                      type="button"
                      class="flex items-center gap-1 font-semibold text-neutral-black hover:text-action"
                      @click="irA(rel.destino)"
                    >
                      {{ formatearNumero(rel.valor) }}
                      <ChevronRight class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
                    </button>
                  </li>
                </ul>
              </section>
            </aside>
          </div>
        </template>

        <p v-else class="rounded-card border border-neutral-light bg-neutral-white p-10 text-center text-sm text-neutral-medium">
          No se encontró la marca solicitada.
        </p>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: MARCAS · DETALLE ADMINISTRATIVO  (maqueta "ADMIN 14")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaMarcaDetalle.vue
 *
 * Ficha de solo lectura de la marca: encabezado con logo y datos, 4 indicadores
 * y pestañas (información general, líneas comerciales, colores, productos
 * destacados, bases, historial), con estado/visibilidad y relaciones a la vista.
 *
 * Permiso requerido: «Gestión del catálogo» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { computed, onMounted, ref } from 'vue';
import {
  ArrowLeft,
  Pencil,
  List,
  Power,
  Download,
  CheckCircle2,
  ChevronRight,
  Image as ImageIcon,
} from 'lucide-vue-next';
import BarraLateralAdmin from '../components/BarraLateralAdmin.vue';
import BarraSuperiorAdmin from '../components/BarraSuperiorAdmin.vue';
import { useMarcaDetalle } from '../composables/useMarcaDetalle';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import type { PestanaDetalleMarca } from '../interfaces';

const props = defineProps<{
  /** Id de la marca (lo inyecta el router con `props: true`). */
  marcaId?: string;
}>();

const {
  detalle,
  pestanaActiva,
  cargando,
  guardando,
  desactivado,
  inicializar,
  setPestana,
  desactivar,
  formatearNumero,
  formatearFecha,
  formatearFechaHora,
} = useMarcaDetalle();

const busquedaGlobal = ref('');

onMounted(() => {
  void inicializar(props.marcaId ?? 'pintuco');
});

const PESTANAS = computed<{ clave: PestanaDetalleMarca; etiqueta: string; contador?: number }[]>(
  () => [
    { clave: 'general', etiqueta: 'Información general' },
    { clave: 'lineas', etiqueta: 'Líneas', contador: detalle.value?.lineas.length },
    { clave: 'colores', etiqueta: 'Colores', contador: detalle.value?.colores.length },
    { clave: 'destacados', etiqueta: 'Destacados', contador: detalle.value?.productosDestacados.length },
    { clave: 'bases', etiqueta: 'Bases', contador: detalle.value?.bases.length },
    { clave: 'historial', etiqueta: 'Historial' },
  ]
);

const indicadores = computed(() => {
  const d = detalle.value;
  if (!d) return [];
  return [
    { etiqueta: 'Productos asociados', valor: d.productosAsociados, enlace: 'Ver productos', destino: '/admin/catalogo/productos' },
    { etiqueta: 'Líneas comerciales', valor: d.lineasComerciales, enlace: 'Ver líneas', destino: '/admin/catalogo/variantes' },
    { etiqueta: 'Colores activos', valor: d.coloresActivos, enlace: 'Ver colores', destino: '/admin/catalogo/colores' },
    { etiqueta: 'Bases asociadas', valor: d.basesAsociadas, enlace: 'Ver bases', destino: '/admin/catalogo/colores' },
  ];
});

function confirmarDesactivar(): void {
  const ok = globalThis.confirm?.('¿Desactivar esta marca? Dejará de mostrarse en el catálogo público.');
  if (ok) void desactivar();
}

// Navegación del panel: la provee el router (o el shell `VistaPanelCatalogo`).
const { irA } = usePanelNavegacion();
</script>
