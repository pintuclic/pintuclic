<template>
  <div class="space-y-5 p-6 lg:p-8">
    <Button variant="text" :icon="ArrowLeft" @click="irA('/admin/catalogo/variantes')">
      Volver a variantes
    </Button>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-neutral-black">
          {{ esEdicion ? 'Editar variante' : 'Crear nueva variante' }}
        </h1>
        <p class="mt-1 text-sm text-neutral-medium">
          {{
            esEdicion
              ? 'Actualiza la información de la variante. Los cambios se reflejarán en tu catálogo.'
              : 'Completa la información de la variante. Se asociará a un producto existente de tu catálogo.'
          }}
        </p>
      </div>
      <span
        v-if="esEdicion"
        class="inline-flex shrink-0 items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
        :class="ESTADO_META[formulario.estado].clases"
      >
        <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
        Variante {{ ESTADO_META[formulario.estado].etiqueta.toLowerCase() }}
      </span>
    </div>

    <p
      v-if="desactivado"
      class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
    >
      La variante quedó <strong>inactiva</strong> y ya no se muestra en el catálogo público.
    </p>
    <p
      v-else-if="guardadoOk"
      class="rounded-card border border-conversion/40 bg-conversion/10 px-4 py-3 text-sm text-neutral-dark"
    >
      Cambios guardados. La variante quedó como
      <strong>{{ ESTADO_META[formulario.estado].etiqueta.toLowerCase() }}</strong>.
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
      <!-- Formulario -->
      <div class="space-y-5 lg:col-span-2">
        <Tabs
          :items="pestanas"
          :model-value="pestanaActiva"
          @update:model-value="(id) => (pestanaActiva = id)"
        />

        <!-- 1. Producto y presentación -->
        <div v-show="pestanaActiva === 'producto'" class="space-y-5">
          <TarjetaSeccionFormulario
            titulo="Producto asociado"
            descripcion="Selecciona el producto principal al que pertenecerá esta variante."
            :icono="Boxes"
          >
            <CampoFormulario etiqueta="Producto" requerido :error="erroresValidacion.productoId">
              <template #default="{ id }">
                <select
                  :id="id"
                  :value="formulario.productoId ?? ''"
                  :class="[claseInput, erroresValidacion.productoId && claseError]"
                  @change="set({ productoId: aTextoONull(($event.target as HTMLSelectElement).value) })"
                >
                  <option value="">Selecciona…</option>
                  <option v-for="op in opciones.productos" :key="op.valor" :value="op.valor">
                    {{ op.etiqueta }}
                  </option>
                </select>
              </template>
            </CampoFormulario>
            <p v-if="productoAsociado" class="rounded-input bg-neutral-lightest px-3 py-2 text-xs text-neutral-medium">
              Marca: <span class="text-neutral-dark">{{ productoAsociado.marca }}</span>
              <template v-if="productoAsociado.linea">
                · Línea: <span class="text-neutral-dark">{{ productoAsociado.linea }}</span>
              </template>
            </p>
          </TarjetaSeccionFormulario>

          <TarjetaSeccionFormulario
            v-if="requierePresentacion"
            titulo="Presentación"
            descripcion="Referencia al catálogo de presentaciones."
            :icono="Ruler"
          >
            <CampoFormulario etiqueta="Presentación" requerido :error="erroresValidacion.presentacionId">
              <template #default="{ id }">
                <select
                  :id="id"
                  :value="formulario.presentacionId ?? ''"
                  :class="[claseInput, erroresValidacion.presentacionId && claseError]"
                  @change="set({ presentacionId: aTextoONull(($event.target as HTMLSelectElement).value) })"
                >
                  <option value="">Selecciona…</option>
                  <option v-for="op in opciones.presentaciones" :key="op.valor" :value="op.valor">
                    {{ op.etiqueta }}
                  </option>
                </select>
              </template>
            </CampoFormulario>
          </TarjetaSeccionFormulario>

          <TarjetaSeccionFormulario
            v-if="requiereColor"
            titulo="Base"
            descripcion="Base sobre la que se prepara la variante."
            :icono="Palette"
          >
            <CampoFormulario etiqueta="Base">
              <template #default="{ id }">
                <select
                  :id="id"
                  :value="formulario.baseId ?? ''"
                  :class="claseInput"
                  @change="definirBase(aTextoONull(($event.target as HTMLSelectElement).value))"
                >
                  <option value="">Sin base</option>
                  <option v-for="op in opciones.bases" :key="op.valor" :value="op.valor">
                    {{ op.etiqueta }}
                  </option>
                </select>
              </template>
            </CampoFormulario>
          </TarjetaSeccionFormulario>
        </div>

        <!-- 2. Precio, existencia y color -->
        <div v-show="pestanaActiva === 'comercial'" class="space-y-5">
          <TarjetaSeccionFormulario
            titulo="Precio y existencia"
            descripcion="Precio vigente y existencia referencial de la variante."
            :icono="DollarSign"
          >
            <div class="grid gap-4 sm:grid-cols-2">
              <Input name="precioVigente" label="Precio vigente" type="number" min="0" placeholder="0" />
              <div class="flex flex-col gap-1.5">
                <Input
                  name="existenciaReferencial"
                  label="Existencia referencial"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                />
                <span class="text-xs text-neutral-medium">Opcional. Cantidad estimada disponible.</span>
              </div>
            </div>
          </TarjetaSeccionFormulario>

          <TarjetaSeccionFormulario
            v-if="requiereColor"
            titulo="Color"
            descripcion="Color administrado que identifica la variante."
            :icono="Palette"
          >
            <div class="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <CampoFormulario etiqueta="Color asociado">
                <template #default="{ id }">
                  <select
                    :id="id"
                    :value="formulario.colorId ?? ''"
                    :class="claseInput"
                    @change="definirColor(aTextoONull(($event.target as HTMLSelectElement).value))"
                  >
                    <option value="">Sin color</option>
                    <option v-for="c in opciones.colores" :key="c.id" :value="c.id">
                      {{ c.nombre }}<template v-if="c.codigo"> ({{ c.codigo }})</template>
                    </option>
                  </select>
                </template>
              </CampoFormulario>
              <div
                v-if="colorAsociado"
                class="flex items-center gap-2 rounded-input border border-neutral-light px-3 py-2 text-xs text-neutral-medium"
              >
                <!-- hex derivado del valor CIELAB del color: dato de catálogo, no token de UI -->
                <span
                  class="h-4 w-4 rounded-full border border-neutral-light"
                  :style="{ backgroundColor: colorAsociado.hex }"
                  aria-hidden="true"
                />
                {{ colorAsociado.hex }} · {{ colorAsociado.familia }}
              </div>
            </div>
          </TarjetaSeccionFormulario>

          <TarjetaSeccionFormulario
            titulo="Código de proveedor"
            descripcion="Código que usa el proveedor para identificar esta variante."
            :icono="Barcode"
          >
            <div class="flex flex-col gap-1">
              <Input name="codigoProveedor" label="Código de proveedor" placeholder="Ej. VIN-ADV-100" />
              <span class="text-xs text-neutral-medium">Opcional.</span>
            </div>
          </TarjetaSeccionFormulario>
        </div>

        <!-- 3. Imágenes -->
        <div v-show="pestanaActiva === 'imagenes'" class="space-y-5">
          <TarjetaSeccionFormulario
            titulo="Imágenes de la variante"
            descripcion="Sube imágenes específicas de esta variante. La primera será la principal (opcional)."
            :icono="ImageIcon"
          >
            <GaleriaImagenesProducto
              :imagenes="formulario.imagenes"
              @agregar="(archivo) => agregarImagen(archivo.nombre, archivo.url)"
              @quitar="quitarImagen"
              @principal="marcarImagenPrincipal"
            />
          </TarjetaSeccionFormulario>
        </div>
      </div>

      <!-- Aside -->
      <aside class="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
          <header class="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-black">
            <Eye class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
            Vista previa de la variante
          </header>

          <div class="flex aspect-video items-center justify-center overflow-hidden rounded-card border border-neutral-light bg-neutral-lightest">
            <img
              v-if="imagenPrincipal"
              :src="imagenPrincipal"
              :alt="tituloVariante"
              class="h-full w-full object-contain p-3"
            />
            <ImageIcon v-else class="h-8 w-8 text-neutral-light" aria-hidden="true" />
          </div>

          <div class="mt-3 space-y-2">
            <p class="text-sm font-semibold text-neutral-black">{{ tituloVariante }}</p>
            <p class="text-lg font-bold text-corporate">
              {{ formulario.precioVigente !== null ? `$${formatearNumero(formulario.precioVigente)} COP` : 'Precio por definir' }}
            </p>
            <span
              class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
              :class="ESTADO_META[formulario.estado].clases"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
              {{ ESTADO_META[formulario.estado].etiqueta }}
            </span>

            <dl class="space-y-1.5 border-t border-neutral-light pt-2 text-xs text-neutral-medium">
              <div v-for="fila in filasPreview" :key="fila.etiqueta" class="flex justify-between gap-3">
                <dt>{{ fila.etiqueta }}</dt>
                <dd class="text-right text-neutral-dark">{{ fila.valor }}</dd>
              </div>
            </dl>
          </div>
        </section>

        <!-- Modo crear: checklist -->
        <ChecklistPublicacion
          v-if="!esEdicion"
          :checklist="checklist"
          :progreso="progresoChecklist"
        />

        <!-- Modo editar: inventario reciente + métricas -->
        <template v-else-if="detalleEdicion">
          <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
            <header class="mb-3 flex items-center justify-between">
              <h2 class="text-base font-semibold text-neutral-black">
                Últimos movimientos de inventario
              </h2>
              <button type="button" class="text-xs font-medium text-action hover:underline">
                Ver todos →
              </button>
            </header>
            <ul class="space-y-2.5 text-sm">
              <li
                v-for="mov in detalleEdicion.movimientos"
                :key="mov.id"
                class="flex items-center justify-between gap-3"
              >
                <span class="flex items-center gap-2">
                  <span
                    class="rounded-button px-1.5 py-0.5 text-[11px] font-medium"
                    :class="MOV_META[mov.tipo].clases"
                  >
                    {{ MOV_META[mov.tipo].etiqueta }}
                  </span>
                  <span class="text-xs text-neutral-medium">{{ formatearFechaHora(mov.fechaHora) }}</span>
                </span>
                <span class="tabular-nums font-medium text-neutral-dark">
                  {{ mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad }}
                </span>
              </li>
            </ul>
          </section>

          <div class="grid grid-cols-2 gap-4">
            <article class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm">
              <p class="text-xs font-medium text-neutral-medium">Rotación</p>
              <p class="mt-1 text-lg font-bold capitalize text-neutral-black">
                {{ detalleEdicion.rotacion }}
              </p>
              <p class="mt-0.5 text-xs text-neutral-medium">
                Se vende {{ detalleEdicion.rotacionComparativa }}% más que el promedio.
              </p>
            </article>
            <article class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm">
              <p class="text-xs font-medium text-neutral-medium">Disponibilidad</p>
              <p class="mt-1 text-lg font-bold text-neutral-black tabular-nums">
                {{ detalleEdicion.disponibilidadPorcentaje }}%
              </p>
              <p class="mt-0.5 text-xs text-neutral-medium">
                {{ detalleEdicion.tiendasConStock }} de {{ detalleEdicion.tiendasTotales }} tiendas con stock.
              </p>
            </article>
          </div>
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

    <Button variant="text" :disabled="guardando" @click="irA('/admin/catalogo/variantes')">
      Cancelar
    </Button>

    <template v-if="!esEdicion">
      <Button variant="outline" :icon="Save" :disabled="guardando" @click="guardarBorrador">
        Guardar borrador
      </Button>
      <Button variant="conversion" :icon="Send" :disabled="guardando || !puedePublicar" @click="publicar">
        Publicar variante
      </Button>
    </template>

    <template v-else>
      <Button variant="outline" :icon="Copy" @click="irA('/admin/catalogo/variantes/nueva')">
        Duplicar variante
      </Button>
      <Button variant="outline" :icon="Power" :disabled="guardando || formulario.estado === 'inactivo'" @click="confirmarDesactivar">
        Desactivar variante
      </Button>
      <Button variant="action" :icon="Save" :disabled="guardando" @click="guardarCambios">
        Guardar cambios
      </Button>
    </template>
  </div>

  <ModalConfirmarAccion
    v-model="mostrarConfirmarDesactivar"
    titulo="¿Desactivar variante?"
    mensaje="Dejará de mostrarse en el catálogo público."
    @confirmar="ejecutarDesactivar"
  />
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: VARIANTES · CREAR / EDITAR  (maquetas "ADMIN 07" y "ADMIN 08")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaVarianteFormulario.vue
 *
 * Alta y edición de variantes: producto asociado, presentación, base y color,
 * código de proveedor, precio vigente y existencia referencial e imágenes.
 * Usa Progressive Disclosure (Tabs) en lugar de mostrar todas las tarjetas a
 * la vez. En «crear» acompaña el checklist de publicación; en «editar»
 * muestra los últimos movimientos de inventario y las métricas de
 * rotación/disponibilidad, y permite desactivar.
 *
 * Permiso requerido: «Gestión de productos» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { computed, onMounted, ref, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import {
  ArrowLeft,
  Save,
  Send,
  Power,
  Copy,
  Eye,
  Boxes,
  Ruler,
  Palette,
  Barcode,
  DollarSign,
  Image as ImageIcon,
} from 'lucide-vue-next';
import { Button, Tabs } from '@/core/components';
import Input from '@/core/components/forms/Input.vue';
import type { TabItem } from '@/core/components/navigation/Tabs.vue';
import TarjetaSeccionFormulario from '../components/TarjetaSeccionFormulario.vue';
import CampoFormulario from '../components/CampoFormulario.vue';
import GaleriaImagenesProducto from '../components/GaleriaImagenesProducto.vue';
import ChecklistPublicacion from '../components/ChecklistPublicacion.vue';
import ModalConfirmarAccion from '../components/ModalConfirmarAccion.vue';
import { useVarianteFormulario } from '../composables/useVarianteFormulario';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { varianteFormularioSchema } from '../dtos';
import type { EstadoVarianteForm, FormularioVariante, MovimientoInventario } from '../interfaces';

const props = defineProps<{
  /** Id de la variante a editar (lo inyecta el router con `props: true`). Vacío = crear. */
  varianteId?: string;
}>();

const {
  formulario,
  opciones,
  modo,
  detalleEdicion,
  cargando,
  guardando,
  error,
  erroresValidacion,
  guardadoOk,
  desactivado,
  productoAsociado,
  colorAsociado,
  checklist,
  progresoChecklist,
  puedePublicar,
  inicializar,
  actualizar,
  definirColor,
  definirBase,
  agregarImagen,
  quitarImagen,
  marcarImagenPrincipal,
  guardarBorrador,
  publicar,
  guardarCambios,
  desactivar,
  formatearNumero,
  formatearFechaHora,
} = useVarianteFormulario();

onMounted(() => {
  void inicializar(props.varianteId);
});

const esEdicion = computed(() => modo.value === 'editar');

/** Progressive disclosure: 3 pasos en lugar de 9 tarjetas simultáneas. */
const pestanas: TabItem[] = [
  { id: 'producto', label: 'Producto y presentación' },
  { id: 'comercial', label: 'Precio, existencia y color' },
  { id: 'imagenes', label: 'Imágenes' },
];
const pestanaActiva = ref<string>('producto');

const claseInput =
  'w-full rounded-input border border-neutral-light bg-neutral-white px-3 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30 disabled:bg-neutral-lightest disabled:text-neutral-medium';
const claseError = 'border-highlight ring-2 ring-highlight/30';

// vee-validate: UX de tipeo de los campos migrados a `Input` del Core
// (codigoProveedor, precioVigente y existenciaReferencial). `Input.vue` ya
// convierte los `type="number"` a number real (o `null` si queda vacío), así
// que los z.number() del schema validan bien desde el propio campo. La
// autoridad de validación al guardar sigue siendo `validarVarianteFormulario`.
const { values, setValues } = useForm({ validationSchema: toTypedSchema(varianteFormularioSchema) });

watch(
  () => formulario.value,
  (f) => setValues(f as unknown as Parameters<typeof setValues>[0], false),
  { immediate: true }
);

watch(
  () => values.codigoProveedor,
  (v) => {
    if (v !== undefined && v !== formulario.value.codigoProveedor) actualizar({ codigoProveedor: v });
  }
);

watch(
  () => values.precioVigente,
  (v) => {
    const valor = v ?? null;
    if (valor !== formulario.value.precioVigente) actualizar({ precioVigente: valor });
  }
);

watch(
  () => values.existenciaReferencial,
  (v) => {
    const valor = v ?? null;
    if (valor !== formulario.value.existenciaReferencial) actualizar({ existenciaReferencial: valor });
  }
);

const ESTADO_META: Record<EstadoVarianteForm, { etiqueta: string; clases: string }> = {
  activo: { etiqueta: 'Activa', clases: 'bg-conversion/10 text-conversion' },
  borrador: { etiqueta: 'Borrador', clases: 'bg-action/10 text-action' },
  inactivo: { etiqueta: 'Inactiva', clases: 'bg-neutral-light text-neutral-medium' },
};

const MOV_META: Record<MovimientoInventario['tipo'], { etiqueta: string; clases: string }> = {
  entrada: { etiqueta: 'Entrada', clases: 'bg-conversion/10 text-conversion' },
  salida: { etiqueta: 'Salida', clases: 'bg-highlight/15 text-neutral-dark' },
  ajuste: { etiqueta: 'Ajuste', clases: 'bg-action/10 text-action' },
};

const imagenPrincipal = computed(() => {
  const imgs = formulario.value.imagenes;
  return (imgs.find((i) => i.esPrincipal) ?? imgs[0])?.url || '';
});

const requierePresentacion = computed(() => productoAsociado.value?.requierePresentacion ?? true);
const requiereColor = computed(() => productoAsociado.value?.requiereColor ?? true);

const etiquetaPresentacion = computed(
  () => opciones.value.presentaciones.find((p) => p.valor === formulario.value.presentacionId)?.etiqueta ?? '—'
);
const etiquetaBase = computed(
  () => opciones.value.bases.find((b) => b.valor === formulario.value.baseId)?.etiqueta ?? 'N/A'
);

const tituloVariante = computed(() => {
  const producto = productoAsociado.value?.etiqueta ?? 'Nueva variante';
  const partes = [etiquetaPresentacion.value, colorAsociado.value?.nombre].filter(Boolean);
  return partes.length ? `${producto} · ${partes.join(' · ')}` : producto;
});

const filasPreview = computed(() => {
  const filas = [];
  if (requierePresentacion.value) filas.push({ etiqueta: 'Presentación', valor: etiquetaPresentacion.value });
  if (requiereColor.value) {
    filas.push({ etiqueta: 'Base', valor: etiquetaBase.value });
    filas.push({ etiqueta: 'Color', valor: colorAsociado.value?.nombre ?? 'N/A' });
  }
  filas.push({ etiqueta: 'Código de proveedor', valor: formulario.value.codigoProveedor || '—' });
  filas.push({
    etiqueta: 'Existencia referencial',
    valor: formulario.value.existenciaReferencial !== null ? `${formulario.value.existenciaReferencial} uds.` : '—',
  });
  return filas;
});

function set(parcial: Partial<FormularioVariante>): void {
  actualizar(parcial);
}
function aTextoONull(valor: string): string | null {
  return valor === '' ? null : valor;
}

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
