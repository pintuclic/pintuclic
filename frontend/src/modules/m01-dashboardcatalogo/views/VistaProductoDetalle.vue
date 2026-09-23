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

        <div v-if="cargando" class="space-y-5">
          <div class="h-64 animate-pulse rounded-card bg-neutral-white" />
          <div class="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
            <div v-for="n in 6" :key="n" class="h-24 animate-pulse rounded-card bg-neutral-white" />
          </div>
          <div class="h-80 animate-pulse rounded-card bg-neutral-white" />
        </div>

        <template v-else-if="detalle">
          <p
            v-if="desactivado"
            class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
          >
            El producto quedó <strong>inactivo</strong> y ya no se muestra en el catálogo público.
          </p>

          <!-- Encabezado -->
          <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
            <div class="grid gap-5 lg:grid-cols-[16rem_1fr]">
              <!-- Galería lateral -->
              <div class="space-y-3">
                <div class="flex aspect-square items-center justify-center overflow-hidden rounded-card border border-neutral-light bg-neutral-lightest">
                  <img
                    v-if="imagenActiva"
                    :src="imagenActiva"
                    :alt="detalle.nombre"
                    class="h-full w-full object-contain p-3"
                  />
                  <ImageIcon v-else class="h-8 w-8 text-neutral-light" aria-hidden="true" />
                </div>
                <div v-if="detalle.imagenes.length > 1" class="flex gap-2 overflow-x-auto">
                  <button
                    v-for="img in detalle.imagenes"
                    :key="img.id"
                    type="button"
                    class="h-14 w-14 shrink-0 overflow-hidden rounded-input border-2 bg-neutral-lightest"
                    :class="img.url === imagenActiva ? 'border-action' : 'border-neutral-light hover:border-neutral-medium'"
                    :aria-label="`Ver ${img.nombre}`"
                    @click="imagenActiva = img.url"
                  >
                    <img :src="img.url" :alt="img.nombre" class="h-full w-full object-contain p-1" />
                  </button>
                </div>
              </div>

              <!-- Datos + disponibilidad -->
              <div class="grid gap-5 lg:grid-cols-[1fr_18rem]">
                <div class="space-y-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <BadgeEstadoProducto :estado="detalle.estado" />
                    <span
                      v-if="detalle.destacado"
                      class="inline-flex items-center gap-1.5 rounded-button bg-highlight/15 px-2.5 py-1 text-xs font-medium text-neutral-dark"
                    >
                      <Star class="h-3.5 w-3.5" aria-hidden="true" />
                      Destacado
                    </span>
                    <span
                      class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
                      :class="detalle.stockTotal > 0 ? 'bg-conversion/10 text-conversion' : 'bg-neutral-light text-neutral-medium'"
                    >
                      <Package class="h-3.5 w-3.5" aria-hidden="true" />
                      {{ detalle.stockTotal > 0 ? 'Stock disponible' : 'Sin stock' }}
                    </span>
                  </div>

                  <div class="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h1 class="text-2xl font-bold text-neutral-black">{{ detalle.nombre }}</h1>
                      <p class="mt-1 flex items-center gap-2 text-sm text-neutral-medium">
                        SKU: {{ detalle.sku }}
                        <button
                          type="button"
                          class="grid h-6 w-6 place-items-center rounded-button text-neutral-medium hover:bg-neutral-lightest"
                          :aria-label="skuCopiado ? 'SKU copiado' : 'Copiar SKU'"
                          @click="copiarSku"
                        >
                          <Check v-if="skuCopiado" class="h-3.5 w-3.5 text-conversion" aria-hidden="true" />
                          <Clipboard v-else class="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </p>
                    </div>

                    <div class="flex flex-wrap gap-2">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-button bg-action px-3 py-2 text-sm font-medium text-neutral-white hover:bg-action-hover"
                        @click="irA(`/admin/catalogo/productos/${detalle.id}/editar`)"
                      >
                        <Pencil class="h-4 w-4" aria-hidden="true" />
                        Editar producto
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-button border border-neutral-light bg-neutral-white px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
                        @click="irA('/admin/catalogo/productos/nuevo')"
                      >
                        <Copy class="h-4 w-4" aria-hidden="true" />
                        Duplicar
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1.5 rounded-button border border-neutral-light bg-neutral-white px-3 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest disabled:opacity-50"
                        :disabled="guardando || detalle.estado === 'inactivo'"
                        @click="confirmarDesactivar"
                      >
                        <Power class="h-4 w-4" aria-hidden="true" />
                        Desactivar
                      </button>
                    </div>
                  </div>

                  <p class="text-sm text-neutral-dark">{{ detalle.descripcion }}</p>

                  <dl class="grid gap-3 pt-1 sm:grid-cols-3">
                    <div>
                      <dt class="text-xs text-neutral-medium">Categoría</dt>
                      <dd class="text-sm font-medium text-neutral-dark">{{ detalle.categoria }}</dd>
                    </div>
                    <div>
                      <dt class="text-xs text-neutral-medium">Marca</dt>
                      <dd class="text-sm font-medium text-neutral-dark">{{ detalle.marca }}</dd>
                    </div>
                    <div>
                      <dt class="text-xs text-neutral-medium">Línea</dt>
                      <dd class="text-sm font-medium text-neutral-dark">{{ detalle.linea ?? '—' }}</dd>
                    </div>
                  </dl>
                </div>

                <aside class="space-y-3 rounded-card bg-subaction/40 p-4">
                  <p class="flex items-center gap-2 text-sm font-semibold text-corporate">
                    <Leaf class="h-4 w-4" aria-hidden="true" />
                    {{ detalle.disponibleEnCatalogo ? 'Producto activo y disponible' : 'Producto no visible' }}
                  </p>
                  <p class="text-xs text-neutral-medium">
                    {{
                      detalle.disponibleEnCatalogo
                        ? 'Se muestra en el catálogo público y tus clientes pueden adquirirlo.'
                        : 'No aparece en el catálogo público hasta reactivarlo.'
                    }}
                  </p>
                  <dl class="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <dt class="text-xs text-neutral-medium">Stock total</dt>
                      <dd class="text-lg font-bold text-neutral-black tabular-nums">
                        {{ formatearNumero(detalle.stockTotal) }}
                        <span class="text-xs font-normal text-neutral-medium">uds.</span>
                      </dd>
                    </div>
                    <div>
                      <dt class="text-xs text-neutral-medium">Variantes activas</dt>
                      <dd class="text-lg font-bold text-neutral-black tabular-nums">
                        {{ detalle.variantesActivas }}
                        <span class="text-xs font-normal text-neutral-medium">
                          / {{ detalle.variantesTotales }}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </aside>
              </div>
            </div>
          </section>

          <!-- Tarjetas de indicadores -->
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <article class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm">
              <p class="text-xs font-medium text-neutral-medium">Precio base</p>
              <p class="mt-2 text-xl font-bold text-neutral-black tabular-nums">
                ${{ formatearNumero(detalle.precioBase) }}
              </p>
              <p class="mt-1 text-xs text-neutral-medium">
                {{ formatearVariacion(detalle.variacionPrecio) }} · precio de referencia
              </p>
            </article>

            <article class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm">
              <p class="text-xs font-medium text-neutral-medium">Variantes activas</p>
              <p class="mt-2 text-xl font-bold text-neutral-black tabular-nums">
                {{ detalle.variantes.valor }}
              </p>
              <p class="mt-1 text-xs" :class="claseTendencia(detalle.variantes.variacionPorcentaje)">
                {{ formatearVariacion(detalle.variantes.variacionPorcentaje) }} vs. mes anterior
              </p>
            </article>

            <article class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm">
              <p class="text-xs font-medium text-neutral-medium">Colores asociados</p>
              <p class="mt-2 text-xl font-bold text-neutral-black tabular-nums">
                {{ detalle.coloresAsociados.valor }}
              </p>
              <p class="mt-1 text-xs" :class="claseTendencia(detalle.coloresAsociados.variacionPorcentaje)">
                {{ formatearVariacion(detalle.coloresAsociados.variacionPorcentaje) }} vs. mes anterior
              </p>
            </article>

            <article class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm">
              <p class="text-xs font-medium text-neutral-medium">Categoría</p>
              <p class="mt-2 text-base font-bold text-neutral-black">{{ detalle.categoria }}</p>
              <p class="mt-1 text-xs text-neutral-medium">{{ detalle.subcategoria ?? '—' }}</p>
            </article>

            <article class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm">
              <p class="text-xs font-medium text-neutral-medium">Última actualización</p>
              <p class="mt-2 text-base font-bold text-neutral-black">
                {{ formatearFecha(detalle.actualizadoEn) }}
              </p>
              <p class="mt-1 text-xs text-neutral-medium">por {{ detalle.actualizadoPor }}</p>
            </article>

            <article class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm">
              <p class="text-xs font-medium text-neutral-medium">Combos relacionados</p>
              <p class="mt-2 text-xl font-bold text-neutral-black tabular-nums">
                {{ detalle.combosRelacionados }}
              </p>
              <button type="button" class="mt-1 text-xs font-medium text-action hover:underline">
                Ver combos →
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
              <div v-if="pestanaActiva === 'general'" class="grid gap-5 md:grid-cols-2">
                <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
                  <h2 class="mb-3 text-base font-semibold text-neutral-black">Información general</h2>
                  <dl class="space-y-2.5 text-sm">
                    <div v-for="fila in filasGenerales" :key="fila.etiqueta" class="grid grid-cols-[8rem_1fr] gap-2">
                      <dt class="text-neutral-medium">{{ fila.etiqueta }}</dt>
                      <dd class="text-neutral-dark">{{ fila.valor }}</dd>
                    </div>
                    <div class="grid grid-cols-[8rem_1fr] items-center gap-2">
                      <dt class="text-neutral-medium">Estado</dt>
                      <dd><BadgeEstadoProducto :estado="detalle.estado" /></dd>
                    </div>
                  </dl>
                </section>

                <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
                  <h2 class="mb-3 text-base font-semibold text-neutral-black">Atributos técnicos</h2>
                  <dl class="space-y-2.5 text-sm">
                    <div
                      v-for="attr in detalle.atributos"
                      :key="attr.etiqueta"
                      class="grid grid-cols-[9rem_1fr] gap-2"
                    >
                      <dt class="text-neutral-medium">{{ attr.etiqueta }}</dt>
                      <dd class="text-neutral-dark">{{ attr.valor }}</dd>
                    </div>
                  </dl>
                </section>
              </div>

              <!-- Galería de imágenes -->
              <section
                v-else-if="pestanaActiva === 'galeria'"
                class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm"
              >
                <h2 class="mb-3 text-base font-semibold text-neutral-black">Galería de imágenes</h2>
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <figure
                    v-for="img in detalle.imagenes"
                    :key="img.id"
                    class="relative aspect-square overflow-hidden rounded-input border border-neutral-light bg-neutral-lightest"
                  >
                    <img :src="img.url" :alt="img.nombre" class="h-full w-full object-contain p-2" />
                    <figcaption
                      v-if="img.esPrincipal"
                      class="absolute left-1.5 top-1.5 rounded-button bg-corporate px-1.5 py-0.5 text-[10px] font-medium text-neutral-white"
                    >
                      Principal
                    </figcaption>
                  </figure>
                </div>
              </section>

              <!-- Variantes -->
              <section
                v-else-if="pestanaActiva === 'variantes'"
                class="rounded-card border border-neutral-light bg-neutral-white shadow-sm"
              >
                <header class="flex items-center justify-between border-b border-neutral-light p-4">
                  <h2 class="text-base font-semibold text-neutral-black">
                    Variantes del producto ({{ detalle.listaVariantes.length }})
                  </h2>
                  <button
                    type="button"
                    class="text-sm font-medium text-action hover:underline"
                    @click="irA('/admin/catalogo/variantes')"
                  >
                    Ver todas →
                  </button>
                </header>
                <div class="overflow-x-auto">
                  <table class="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr class="border-b border-neutral-light text-xs uppercase tracking-wide text-neutral-medium">
                        <th scope="col" class="px-4 py-2.5 font-semibold">Presentación</th>
                        <th scope="col" class="px-3 py-2.5 font-semibold">Color</th>
                        <th scope="col" class="px-3 py-2.5 font-semibold">Base</th>
                        <th scope="col" class="px-3 py-2.5 text-center font-semibold">Stock</th>
                        <th scope="col" class="px-3 py-2.5 font-semibold">Estado</th>
                        <th scope="col" class="px-4 py-2.5 text-right font-semibold">Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="v in detalle.listaVariantes"
                        :key="v.id"
                        class="border-b border-neutral-light last:border-0"
                      >
                        <td class="px-4 py-2.5 text-neutral-dark">{{ v.presentacion }}</td>
                        <td class="px-3 py-2.5">
                          <span class="flex items-center gap-1.5 text-neutral-dark">
                            <span
                              v-if="v.colorHex"
                              class="h-3 w-3 rounded-full border border-neutral-light"
                              :style="{ backgroundColor: v.colorHex }"
                              aria-hidden="true"
                            />
                            {{ v.color }}
                          </span>
                        </td>
                        <td class="px-3 py-2.5 text-neutral-dark">{{ v.base }}</td>
                        <td class="px-3 py-2.5 text-center tabular-nums text-neutral-dark">{{ v.stock }}</td>
                        <td class="px-3 py-2.5">
                          <span
                            class="inline-flex items-center gap-1.5 rounded-button px-2 py-0.5 text-xs font-medium"
                            :class="claseEstadoVariante(v.estado)"
                          >
                            {{ etiquetaEstadoVariante(v.estado) }}
                          </span>
                        </td>
                        <td class="px-4 py-2.5 text-right font-medium text-neutral-dark tabular-nums">
                          ${{ formatearNumero(v.precio) }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <!-- Bases y entonado -->
              <section
                v-else-if="pestanaActiva === 'bases'"
                class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm"
              >
                <h2 class="mb-3 text-base font-semibold text-neutral-black">Bases y entonado</h2>
                <dl class="space-y-4 text-sm">
                  <div>
                    <dt class="mb-1.5 text-neutral-medium">Bases disponibles</dt>
                    <dd class="flex flex-wrap gap-2">
                      <span
                        v-for="base in detalle.basesDisponibles"
                        :key="base"
                        class="rounded-button bg-neutral-lightest px-2.5 py-1 text-xs font-medium text-neutral-dark"
                      >
                        {{ base }}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt class="mb-1 text-neutral-medium">Sistema de entonado</dt>
                    <dd class="text-neutral-dark">{{ detalle.sistemaEntonado || '—' }}</dd>
                  </div>
                  <div>
                    <dt class="mb-1.5 text-neutral-medium">Colores disponibles</dt>
                    <dd class="flex flex-wrap items-center gap-2">
                      <span
                        v-for="color in detalle.coloresDisponibles"
                        :key="color.nombre"
                        class="flex items-center gap-1.5 rounded-button border border-neutral-light px-2 py-1 text-xs text-neutral-dark"
                      >
                        <span
                          class="h-3 w-3 rounded-full border border-neutral-light"
                          :style="{ backgroundColor: color.hex }"
                          aria-hidden="true"
                        />
                        {{ color.nombre }}
                      </span>
                    </dd>
                  </div>
                </dl>
              </section>

              <!-- Etiquetas -->
              <section
                v-else
                class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm"
              >
                <h2 class="mb-3 text-base font-semibold text-neutral-black">Etiquetas</h2>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="etiqueta in detalle.etiquetas"
                    :key="etiqueta"
                    class="rounded-button bg-subaction px-2.5 py-1 text-xs font-medium text-corporate"
                  >
                    {{ etiqueta }}
                  </span>
                  <span v-if="!detalle.etiquetas.length" class="text-sm text-neutral-medium">
                    Sin etiquetas.
                  </span>
                </div>
              </section>
            </div>

            <!-- Actividad reciente (siempre visible) -->
            <aside class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
              <header class="mb-3 flex items-center justify-between">
                <h2 class="text-base font-semibold text-neutral-black">Actividad reciente</h2>
                <button type="button" class="text-xs font-medium text-action hover:underline">
                  Ver toda →
                </button>
              </header>
              <ol class="space-y-4">
                <li
                  v-for="(mov, i) in detalle.actividad"
                  :key="mov.id"
                  class="relative flex gap-3 pl-4"
                >
                  <span
                    class="absolute left-0 top-1.5 h-2 w-2 rounded-full"
                    :class="i === 0 ? 'bg-action' : 'bg-neutral-light'"
                    aria-hidden="true"
                  />
                  <span
                    v-if="i < detalle.actividad.length - 1"
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
            </aside>
          </div>
        </template>

        <p v-else class="rounded-card border border-neutral-light bg-neutral-white p-10 text-center text-sm text-neutral-medium">
          No se encontró el producto solicitado.
        </p>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: PRODUCTOS · DETALLE ADMINISTRATIVO  (maqueta "ADMIN 05")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaProductoDetalle.vue
 *
 * Ficha de solo lectura del producto: encabezado con galería y disponibilidad,
 * tarjetas de indicadores y pestañas (información general, galería, variantes,
 * bases y entonado, etiquetas) con la actividad reciente siempre a la vista.
 *
 * Permiso requerido: «Gestión de productos» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { computed, onMounted, ref } from 'vue';
import {
  ArrowLeft,
  Pencil,
  Copy,
  Power,
  Star,
  Package,
  Check,
  Clipboard,
  Leaf,
  Image as ImageIcon,
} from 'lucide-vue-next';
import BarraLateralAdmin from '../components/BarraLateralAdmin.vue';
import BarraSuperiorAdmin from '../components/BarraSuperiorAdmin.vue';
import BadgeEstadoProducto from '../components/BadgeEstadoProducto.vue';
import { useProductoDetalle } from '../composables/useProductoDetalle';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import type { PestanaDetalleProducto, VarianteResumenDetalle } from '../interfaces';

const props = defineProps<{
  /** Id del producto (lo inyecta el router con `props: true`). */
  productoId?: string;
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
  formatearVariacion,
} = useProductoDetalle();

const busquedaGlobal = ref('');
const imagenActiva = ref<string>('');
const skuCopiado = ref(false);

onMounted(async () => {
  await inicializar(props.productoId ?? 'prd-001');
  const principal =
    detalle.value?.imagenes.find((img) => img.esPrincipal) ?? detalle.value?.imagenes[0];
  imagenActiva.value = principal?.url ?? '';
});

const PESTANAS = computed<{ clave: PestanaDetalleProducto; etiqueta: string; contador?: number }[]>(
  () => [
    { clave: 'general', etiqueta: 'Información general' },
    { clave: 'galeria', etiqueta: 'Galería', contador: detalle.value?.imagenes.length },
    { clave: 'variantes', etiqueta: 'Variantes', contador: detalle.value?.listaVariantes.length },
    { clave: 'bases', etiqueta: 'Bases y entonado' },
    { clave: 'etiquetas', etiqueta: 'Etiquetas', contador: detalle.value?.etiquetas.length },
  ]
);

const filasGenerales = computed(() => {
  const d = detalle.value;
  if (!d) return [];
  return [
    { etiqueta: 'Nombre', valor: d.nombre },
    { etiqueta: 'Descripción', valor: d.descripcion },
    { etiqueta: 'Marca', valor: d.marca },
    { etiqueta: 'Línea', valor: d.linea ?? '—' },
    { etiqueta: 'Categoría', valor: d.subcategoria ? `${d.categoria} › ${d.subcategoria}` : d.categoria },
    { etiqueta: 'Tipo de producto', valor: d.tipoProducto },
    { etiqueta: 'Destacado', valor: d.destacado ? 'Sí' : 'No' },
    { etiqueta: 'Permitir opiniones', valor: d.permitirOpiniones ? 'Sí' : 'No' },
  ];
});

// La paleta no tiene rol "negativo": una bajada va en neutro.
function claseTendencia(puntos: number): string {
  return puntos > 0 ? 'text-conversion' : 'text-neutral-medium';
}

const ESTADO_VARIANTE: Record<VarianteResumenDetalle['estado'], { etiqueta: string; clases: string }> = {
  activo: { etiqueta: 'Activo', clases: 'bg-conversion/10 text-conversion' },
  inactivo: { etiqueta: 'Inactivo', clases: 'bg-neutral-light text-neutral-medium' },
  sin_stock: { etiqueta: 'Sin stock', clases: 'bg-highlight/15 text-neutral-dark' },
};
function etiquetaEstadoVariante(estado: VarianteResumenDetalle['estado']): string {
  return ESTADO_VARIANTE[estado].etiqueta;
}
function claseEstadoVariante(estado: VarianteResumenDetalle['estado']): string {
  return ESTADO_VARIANTE[estado].clases;
}

async function copiarSku(): Promise<void> {
  if (!detalle.value) return;
  try {
    await globalThis.navigator?.clipboard?.writeText(detalle.value.sku);
    skuCopiado.value = true;
    globalThis.setTimeout(() => (skuCopiado.value = false), 1500);
  } catch {
    skuCopiado.value = false;
  }
}

function confirmarDesactivar(): void {
  const ok = globalThis.confirm?.(
    '¿Desactivar este producto? Dejará de mostrarse en el catálogo público.'
  );
  if (ok) void desactivar();
}

// Navegación del panel: la provee el router (o el shell `VistaPanelCatalogo`).
const { irA } = usePanelNavegacion();
</script>
