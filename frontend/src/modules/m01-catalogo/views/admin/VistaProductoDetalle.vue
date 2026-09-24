<template>
  <div class="font-sans">
    <Button variant="text" icon="back" :to="{ name: 'M01Productos' }" class="mb-4">Volver a productos</Button>

    <Alert v-if="error" variant="danger" title="No fue posible cargar el producto">
      <p>{{ error }}</p>
      <Button variant="danger-outline" size="sm" class="mt-3" @click="cargar">Reintentar</Button>
    </Alert>

    <p v-else-if="!producto" class="text-sm text-neutral-medium" role="status">Cargando producto…</p>

    <template v-else>
      <PageHeader :title="producto.nombre" :description="`${taxonomias.nombreMarca(producto.id_marca)} · ${ETIQUETA_CLASE[producto.clase_color]}`">
        <Button variant="neutral" icon="edit" @click="formularioAbierto = true">Editar</Button>
        <Button
          v-if="producto.estado === 'activo'"
          :variant="producto.publicado ? 'outline' : 'action'"
          :disabled="publicando"
          @click="alternarPublicacion"
        >
          {{ publicando ? 'Procesando…' : producto.publicado ? 'Retirar del catálogo público' : 'Publicar' }}
        </Button>
        <Button
          :variant="producto.estado === 'activo' ? 'danger-outline' : 'conversion'"
          :icon="producto.estado === 'activo' ? 'power' : 'refresh'"
          @click="cambiarEstado"
        >
          {{ producto.estado === 'activo' ? 'Desactivar' : 'Reactivar' }}
        </Button>
      </PageHeader>

      <div class="mb-5 flex flex-wrap gap-2">
        <Badge :estado="producto.estado" />
        <Badge :tone="producto.publicado ? 'success' : 'neutral'" :label="producto.publicado ? 'Publicado' : 'Borrador'" />
        <Badge v-if="producto.patrocinado" tone="warning" label="Patrocinado" />
      </div>

      <Alert v-if="errorAccion" variant="danger" class="mb-5" dismissible @close="errorAccion = null">{{ errorAccion }}</Alert>

      <!-- RF-CAT-02-05: para publicar se exige al menos una variante activa y una imagen. -->
      <Alert v-if="!producto.publicado && producto.estado === 'activo' && !listoParaPublicar" variant="info" class="mb-5" title="Requisitos para publicar">
        <ul class="mt-1 list-disc pl-5">
          <li :class="variantesActivas > 0 ? 'text-conversion-hover' : ''">Al menos una variante activa ({{ variantesActivas }})</li>
          <li :class="totalImagenes > 0 ? 'text-conversion-hover' : ''">Al menos una imagen ({{ totalImagenes }})</li>
        </ul>
      </Alert>

      <Tabs :model-value="pestana" :items="pestanas" aria-label="Secciones del producto" class="mb-5" @update:model-value="pestana = $event" />

      <!-- Ficha -->
      <section v-if="pestana === 'ficha'" class="grid gap-5 lg:grid-cols-3">
        <Card title="Información general" class="lg:col-span-2">
          <dl class="grid gap-4 text-sm sm:grid-cols-2">
            <div v-for="dato in datosFicha" :key="dato.etiqueta">
              <dt class="text-xs font-medium text-neutral-medium">{{ dato.etiqueta }}</dt>
              <dd class="mt-1 text-neutral-dark">{{ dato.valor }}</dd>
            </div>
          </dl>
          <div class="mt-5">
            <p class="text-xs font-medium text-neutral-medium">Descripción</p>
            <p class="mt-1 whitespace-pre-line text-sm text-neutral-dark">{{ producto.descripcion || 'Sin descripción.' }}</p>
          </div>
        </Card>
        <Card title="Subcategorías">
          <ul class="flex flex-wrap gap-2">
            <li v-for="id in producto.id_subcategorias" :key="id"><Badge tone="info" :label="taxonomias.nombreSubcategoria(id)" /></li>
          </ul>
        </Card>
      </section>

      <PanelVariantes v-else-if="pestana === 'variantes'" ref="panelVariantes" :producto="producto" @cambio="contarRequisitos" />

      <GaleriaImagenes v-else-if="pestana === 'imagenes'" :producto="producto" @cambio="contarRequisitos" />

      <!-- HU-CAT-12 flujo 2: bases que ofrece un producto entonable (misma marca y misma resina, RF-CAT-12-03). -->
      <section v-else-if="pestana === 'bases'" class="rounded-card border border-neutral-light bg-neutral-white p-4">
        <form class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end" @submit.prevent="asignarBase">
          <Select v-model="baseElegida" label="Asignar base de la marca" class="sm:max-w-sm" :error="errorBases ?? ''">
            <option value="">Selecciona…</option>
            <option v-for="b in basesDisponibles" :key="b.id_base" :value="b.id_base">{{ b.nombre }}</option>
          </Select>
          <Button type="submit" variant="conversion" icon="plus" :disabled="!baseElegida || ocupadoBases">Asignar</Button>
        </form>
        <SinResultados v-if="!basesProducto.length" icon="grid" title="Sin bases asignadas" description="Asigna las bases sobre las que se prepara este producto." compact />
        <ul v-else class="divide-y divide-neutral-light">
          <li v-for="b in basesProducto" :key="b.id_base" class="flex items-center justify-between py-2 text-sm">
            <span class="font-medium text-neutral-black">{{ b.nombre }} <Badge v-if="b.estado !== 'activo'" :estado="b.estado" class="ml-2" /></span>
            <Button variant="danger-outline" size="sm" :disabled="ocupadoBases" @click="quitarBase(b.id_base)">Quitar</Button>
          </li>
        </ul>
      </section>

      <!-- HU-CAT-10: rendimiento por galón y su derivación por presentación. -->
      <section v-else-if="pestana === 'rendimiento'" class="grid gap-5 lg:grid-cols-2">
        <Card title="Rendimiento por galón (m² por mano)">
          <form class="space-y-4" novalidate @submit.prevent="guardarRendimiento">
            <div class="grid gap-4 sm:grid-cols-2">
              <Input v-model="formRendimiento.rendimiento_min" type="number" step="0.01" label="Mínimo" :error="erroresRendimiento.rendimiento_min" />
              <Input v-model="formRendimiento.rendimiento_max" type="number" step="0.01" label="Máximo" :error="erroresRendimiento.rendimiento_max" />
            </div>
            <p class="text-xs text-neutral-medium">Deja ambos vacíos si el producto no aplica (p. ej. un rodillo). Si rinde un valor fijo, usa el mismo en ambos.</p>
            <div class="flex justify-end">
              <Button type="submit" variant="action" :disabled="ocupadoRendimiento">{{ ocupadoRendimiento ? 'Guardando…' : 'Guardar rendimiento' }}</Button>
            </div>
          </form>
        </Card>
        <Card title="Derivado por presentación (aproximado)">
          <p v-if="!rendimiento?.por_presentacion.length" class="text-sm text-neutral-medium">Sin rendimiento registrado o sin presentaciones activas.</p>
          <table v-else class="w-full text-sm">
            <thead class="text-xs uppercase text-corporate">
              <tr><th class="py-2 text-left">Presentación</th><th class="py-2 text-right">m² por mano</th></tr>
            </thead>
            <tbody class="divide-y divide-neutral-light">
              <tr v-for="r in rendimiento.por_presentacion" :key="r.id_presentacion">
                <td class="py-2">{{ r.nombre }} <span class="text-neutral-medium">({{ r.volumen }} L)</span></td>
                <td class="py-2 text-right tabular-nums">{{ r.rendimiento_min === r.rendimiento_max ? r.rendimiento_min : `${r.rendimiento_min} – ${r.rendimiento_max}` }}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </section>
    </template>

    <FormularioProducto v-model="formularioAbierto" :producto="producto" @guardado="alGuardar" />
    <ModalDesactivar
      v-model="cicloVida.abierto"
      :nombre="cicloVida.nombre"
      :modo="cicloVida.modo"
      :ejecutar="cicloVida.ejecutar"
      :consultar-impacto="cicloVida.consultarImpacto"
      @completado="cargar"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Alert, Badge, Button, Card, Input, PageHeader, Select, SinResultados, Tabs } from '@/core/components';
import FormularioProducto from '../../components/admin/FormularioProducto.vue';
import ModalDesactivar from '../../components/admin/ModalDesactivar.vue';
import PanelVariantes from '../../components/admin/PanelVariantes.vue';
import GaleriaImagenes from '../../components/admin/GaleriaImagenes.vue';
import { useEdicion } from '../../composables/useEdicion';
import { CatalogoAdmin } from '../../services/catalogo-admin.service';
import { mensajeError } from '../../services/http';
import { useTaxonomias } from '../../store/useTaxonomias';
import { rendimientoFormSchema, validar } from '../../dtos/admin.dto';
import type { ErroresFormulario } from '../../dtos/admin.dto';
import type { Base, ClaseColor, Producto, RendimientoProducto } from '../../interfaces';

const route = useRoute();
const taxonomias = useTaxonomias();
const { cicloVida, abrirDesactivar, abrirReactivar } = useEdicion();

const producto = ref<Producto | null>(null);
const error = ref<string | null>(null);
const errorAccion = ref<string | null>(null);
const formularioAbierto = ref(false);
const publicando = ref(false);
const pestana = ref('ficha');
const panelVariantes = ref<InstanceType<typeof PanelVariantes> | null>(null);

const idProducto = computed(() => Number(route.params.productoId));
const ETIQUETA_CLASE: Record<ClaseColor, string> = { entonable: 'Entonable', colores_fijos: 'Colores fijos', sin_color: 'Sin color' };

const pestanas = computed(() => [
  { id: 'ficha', label: 'Ficha' },
  { id: 'variantes', label: 'Variantes' },
  { id: 'imagenes', label: 'Imágenes' },
  ...(producto.value?.clase_color === 'entonable' ? [{ id: 'bases', label: 'Bases' }] : []),
  { id: 'rendimiento', label: 'Rendimiento' },
]);

const datosFicha = computed(() => {
  const p = producto.value;
  if (!p) return [];
  return [
    { etiqueta: 'Marca', valor: taxonomias.nombreMarca(p.id_marca) },
    { etiqueta: 'Línea', valor: p.id_linea ? lineaNombre.value ?? `#${p.id_linea}` : '—' },
    { etiqueta: 'Tipo de resina', valor: taxonomias.nombreResina(p.id_tipo_resina) },
    { etiqueta: 'Clase de color', valor: ETIQUETA_CLASE[p.clase_color] },
    { etiqueta: 'Categoría complementaria', valor: taxonomias.nombreCategoria(p.id_categoria_complementaria) },
    {
      etiqueta: 'Rendimiento por galón',
      valor: p.rendimiento_min === null ? 'No registrado' : `${p.rendimiento_min} – ${p.rendimiento_max} m² por mano`,
    },
  ];
});

// --- Requisitos de publicación (RF-CAT-02-05), calculados con datos reales ------
const variantesActivas = ref(0);
const totalImagenes = ref(0);
const listoParaPublicar = computed(() => variantesActivas.value > 0 && totalImagenes.value > 0);

async function contarRequisitos(): Promise<void> {
  try {
    const [variantes, imagenes] = await Promise.all([
      CatalogoAdmin.productos.variantes(idProducto.value),
      CatalogoAdmin.productos.imagenes(idProducto.value),
    ]);
    variantesActivas.value = variantes.filter((v) => v.estado === 'activo').length;
    totalImagenes.value = imagenes.length;
  } catch {
    // El aviso es orientativo: el backend vuelve a verificar al publicar.
  }
}

// --- Carga principal ----------------------------------------------------------
const lineaNombre = ref<string | null>(null);

async function cargar(): Promise<void> {
  error.value = null;
  try {
    await taxonomias.asegurar();
    const p = await CatalogoAdmin.productos.obtener(idProducto.value);
    producto.value = p;
    lineaNombre.value = p.id_linea ? (await CatalogoAdmin.lineas.obtener(p.id_linea)).nombre : null;
    await contarRequisitos();
    if (pestana.value === 'bases') await cargarBases();
    if (pestana.value === 'rendimiento') await cargarRendimiento();
  } catch (e) {
    error.value = mensajeError(e);
  }
}

function alGuardar(p: Producto): void {
  producto.value = p;
  void cargar();
}

async function alternarPublicacion(): Promise<void> {
  if (!producto.value) return;
  publicando.value = true;
  errorAccion.value = null;
  try {
    const id = producto.value.id_producto;
    producto.value = producto.value.publicado
      ? await CatalogoAdmin.productos.despublicar(id)
      : await CatalogoAdmin.productos.publicar(id);
  } catch (e) {
    errorAccion.value = mensajeError(e);
  } finally {
    publicando.value = false;
  }
}

function cambiarEstado(): void {
  const p = producto.value;
  if (!p) return;
  if (p.estado === 'activo') {
    abrirDesactivar(p.nombre, () => CatalogoAdmin.productos.desactivar(p.id_producto), () => CatalogoAdmin.productos.impacto(p.id_producto));
  } else {
    abrirReactivar(p.nombre, () => CatalogoAdmin.productos.reactivar(p.id_producto));
  }
}

// --- Bases del producto entonable (HU-CAT-12 flujo 2) ----------------------------
const basesProducto = shallowRef<Base[]>([]);
const basesMarca = shallowRef<Base[]>([]);
const baseElegida = ref<number | string>('');
const errorBases = ref<string | null>(null);
const ocupadoBases = ref(false);
const basesDisponibles = computed(() =>
  basesMarca.value.filter((b) => b.estado === 'activo' && !basesProducto.value.some((x) => x.id_base === b.id_base)),
);

async function cargarBases(): Promise<void> {
  if (!producto.value) return;
  errorBases.value = null;
  try {
    [basesProducto.value, basesMarca.value] = await Promise.all([
      CatalogoAdmin.productos.bases(producto.value.id_producto),
      CatalogoAdmin.bases.listarPorMarca(producto.value.id_marca),
    ]);
  } catch (e) {
    errorBases.value = mensajeError(e);
  }
}

async function operarBases(accion: () => Promise<Base[]>): Promise<void> {
  ocupadoBases.value = true;
  errorBases.value = null;
  try {
    basesProducto.value = await accion();
    baseElegida.value = '';
    await panelVariantes.value?.recargarOpciones();
  } catch (e) {
    errorBases.value = mensajeError(e);
  } finally {
    ocupadoBases.value = false;
  }
}

const asignarBase = () => operarBases(() => CatalogoAdmin.productos.asignarBase(idProducto.value, Number(baseElegida.value)));
const quitarBase = (idBase: number) => operarBases(() => CatalogoAdmin.productos.quitarBase(idProducto.value, idBase));

// --- Rendimiento (HU-CAT-10) ------------------------------------------------------
const rendimiento = ref<RendimientoProducto | null>(null);
const formRendimiento = reactive({ rendimiento_min: '' as string | number, rendimiento_max: '' as string | number });
const erroresRendimiento = ref<ErroresFormulario>({});
const ocupadoRendimiento = ref(false);

async function cargarRendimiento(): Promise<void> {
  try {
    rendimiento.value = await CatalogoAdmin.productos.rendimiento(idProducto.value);
    formRendimiento.rendimiento_min = rendimiento.value.rendimiento_min ?? '';
    formRendimiento.rendimiento_max = rendimiento.value.rendimiento_max ?? '';
  } catch (e) {
    erroresRendimiento.value = { rendimiento_max: mensajeError(e) };
  }
}

async function guardarRendimiento(): Promise<void> {
  const resultado = validar(rendimientoFormSchema, { ...formRendimiento });
  if (!resultado.ok) {
    erroresRendimiento.value = resultado.errores;
    return;
  }
  erroresRendimiento.value = {};
  ocupadoRendimiento.value = true;
  try {
    rendimiento.value = await CatalogoAdmin.productos.establecerRendimiento(idProducto.value, resultado.data);
    producto.value = await CatalogoAdmin.productos.obtener(idProducto.value);
  } catch (e) {
    erroresRendimiento.value = { rendimiento_max: mensajeError(e) };
  } finally {
    ocupadoRendimiento.value = false;
  }
}

watch(pestana, (p) => {
  if (p === 'bases') void cargarBases();
  if (p === 'rendimiento') void cargarRendimiento();
});
watch(idProducto, () => { pestana.value = 'ficha'; void cargar(); }, { immediate: true });
</script>
