<template>
  <div>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-neutral-medium">{{ AYUDA_CLASE[producto.clase_color] }}</p>
      <Button variant="conversion" size="sm" icon="plus" :disabled="producto.estado !== 'activo'" @click="nueva">Nueva variante</Button>
    </div>

    <Alert v-if="producto.clase_color === 'entonable' && !cargandoOpciones && !bases.length" variant="warning" class="mb-3">
      Este producto entonable aún no tiene bases asignadas; asígnalas en la pestaña «Bases» antes de crear variantes.
    </Alert>
    <Alert v-if="errorOpciones" variant="danger" class="mb-3">{{ errorOpciones }}</Alert>

    <PanelListado
      v-model:pagina="listado.pagina.value"
      :columnas="columnas"
      :filas="listado.visibles.value"
      row-key="id_variante"
      :cargando="listado.cargando.value"
      :error="listado.error.value"
      :total="listado.total.value"
      :por-pagina="listado.porPagina"
      :buscable="false"
      texto-vacio="Este producto aún no tiene variantes"
      @reintentar="listado.recargar"
    >
      <template #cell-presentacion="{ row }">
        <span class="font-medium text-neutral-black">{{ taxonomias.nombrePresentacion(row.id_presentacion) }}</span>
      </template>
      <template #cell-eje="{ row }">{{ nombreEje(row) }}</template>
      <template #cell-precio="{ row }"><span class="font-medium tabular-nums">{{ formatoCop.format(row.precio_vigente) }}</span></template>
      <template #cell-existencia="{ row }"><span class="tabular-nums">{{ row.existencia_referencial }}</span></template>
      <template #cell-codigo="{ row }">{{ row.codigo_proveedor ?? '—' }}</template>
      <template #cell-estado="{ row }"><Badge :estado="row.estado" table /></template>
      <template #cell-acciones="{ row }">
        <AccionesFila
          :nombre="`variante ${taxonomias.nombrePresentacion(row.id_presentacion)}`"
          :estado="row.estado"
          @editar="editar(row)"
          @desactivar="abrirDesactivar('esta variante', () => CatalogoAdmin.variantes.desactivar(row.id_variante))"
          @reactivar="abrirReactivar('esta variante', () => CatalogoAdmin.variantes.reactivar(row.id_variante))"
        />
      </template>
    </PanelListado>

    <ModalFormularioCatalogo
      v-model="formulario.abierto"
      :titulo="formulario.titulo"
      :modo="formulario.modo"
      :campos="campos"
      :esquema="varianteFormSchema(formulario.modo, producto.clase_color)"
      :valores-iniciales="formulario.valores"
      :guardar="formulario.guardar"
      @guardado="refrescar"
    />
    <ModalDesactivar
      v-model="cicloVida.abierto"
      :nombre="cicloVida.nombre"
      :modo="cicloVida.modo"
      :ejecutar="cicloVida.ejecutar"
      @completado="refrescar"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { Alert, Badge, Button } from '@/core/components';
import PanelListado from './PanelListado.vue';
import AccionesFila from './AccionesFila.vue';
import ModalFormularioCatalogo from './ModalFormularioCatalogo.vue';
import ModalDesactivar from './ModalDesactivar.vue';
import { useListado } from '../../composables/useListado';
import { useEdicion } from '../../composables/useEdicion';
import { CatalogoAdmin } from '../../services/catalogo-admin.service';
import { mensajeError } from '../../services/http';
import { useTaxonomias } from '../../store/useTaxonomias';
import { varianteFormSchema } from '../../dtos/admin.dto';
import type { Base, CampoFormulario, ClaseColor, Color, Producto, Variante } from '../../interfaces';

/**
 * M01 - Variantes (SKU) de un producto (HU-CAT-03). La forma de la variante
 * depende de la clase (RF-CAT-03-02): entonable → base; colores fijos → color;
 * sin color → solo presentación. Precio y existencia viven en la variante.
 */
const props = defineProps<{ producto: Producto }>();
const emit = defineEmits<{ cambio: [] }>();

const taxonomias = useTaxonomias();
const { formulario, cicloVida, abrirFormulario, abrirDesactivar, abrirReactivar } = useEdicion();
const listado = useListado(() => CatalogoAdmin.productos.variantes(props.producto.id_producto), { porPagina: 15 });

const bases = shallowRef<Base[]>([]);
const colores = shallowRef<Color[]>([]);
const cargandoOpciones = ref(false);
const errorOpciones = ref<string | null>(null);

const formatoCop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const AYUDA_CLASE: Record<ClaseColor, string> = {
  entonable: 'Producto entonable: cada variante es una base en una presentación; el color lo elige el cliente de la carta.',
  colores_fijos: 'Producto de colores fijos: cada variante es un color concreto en una presentación.',
  sin_color: 'Producto sin color: cada variante es una presentación.',
};

const columnas = computed(() => [
  { key: 'presentacion', label: 'Presentación' },
  ...(props.producto.clase_color === 'sin_color' ? [] : [{ key: 'eje', label: props.producto.clase_color === 'entonable' ? 'Base' : 'Color' }]),
  { key: 'precio', label: 'Precio vigente', align: 'right' as const },
  { key: 'existencia', label: 'Existencia ref.', align: 'right' as const },
  { key: 'codigo', label: 'Código proveedor' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right' as const },
]);

const campos = computed<CampoFormulario[]>(() => {
  const activas = <T extends { estado: string }>(lista: T[]) => lista.filter((x) => x.estado === 'activo');
  return [
    {
      clave: 'id_presentacion', etiqueta: 'Presentación', tipo: 'select',
      opciones: activas(taxonomias.presentaciones).map((p) => ({ valor: p.id_presentacion, etiqueta: `${p.nombre} (${p.volumen} L)` })),
    },
    ...(props.producto.clase_color === 'entonable'
      ? [{ clave: 'id_base', etiqueta: 'Base', tipo: 'select' as const, opciones: activas(bases.value).map((b) => ({ valor: b.id_base, etiqueta: b.nombre })) }]
      : []),
    ...(props.producto.clase_color === 'colores_fijos'
      ? [{ clave: 'id_color', etiqueta: 'Color', tipo: 'select' as const, opciones: activas(colores.value).map((c) => ({ valor: c.id_color, etiqueta: c.codigo ? `${c.nombre} · ${c.codigo}` : c.nombre })) }]
      : []),
    { clave: 'precio_vigente', etiqueta: 'Precio vigente (COP)', tipo: 'numero' },
    { clave: 'existencia_referencial', etiqueta: 'Existencia referencial (opcional)', tipo: 'numero' },
    { clave: 'codigo_proveedor', etiqueta: 'Código de proveedor SAMIT (opcional)', tipo: 'texto' },
  ];
});

function nombreEje(v: Variante): string {
  if (v.id_base !== null) return bases.value.find((b) => b.id_base === v.id_base)?.nombre ?? `Base #${v.id_base}`;
  if (v.id_color !== null) return colores.value.find((c) => c.id_color === v.id_color)?.nombre ?? `Color #${v.id_color}`;
  return '—';
}

async function cargarOpciones(): Promise<void> {
  cargandoOpciones.value = true;
  errorOpciones.value = null;
  try {
    await taxonomias.asegurar();
    const { clase_color, id_producto, id_marca } = props.producto;
    // RF-CAT-12-02: la base de la variante debe estar declarada en el producto; el color, ser de su marca (CA-CAT-05-03).
    bases.value = clase_color === 'entonable' ? await CatalogoAdmin.productos.bases(id_producto) : [];
    colores.value = clase_color === 'colores_fijos' ? await CatalogoAdmin.colores.listarPorMarca(id_marca) : [];
  } catch (e) {
    errorOpciones.value = mensajeError(e);
  } finally {
    cargandoOpciones.value = false;
  }
}

function nueva(): void {
  abrirFormulario({
    modo: 'crear', titulo: `Nueva variante · ${props.producto.nombre}`,
    valores: { id_producto: props.producto.id_producto },
    guardar: (p) => CatalogoAdmin.variantes.crear(p),
  });
}

function editar(v: Variante): void {
  abrirFormulario({
    modo: 'editar', titulo: 'Editar variante',
    valores: {
      id_producto: v.id_producto, id_presentacion: v.id_presentacion, precio_vigente: v.precio_vigente,
      existencia_referencial: v.existencia_referencial, id_base: v.id_base ?? '', id_color: v.id_color ?? '',
      codigo_proveedor: v.codigo_proveedor ?? '',
    },
    guardar: (p) => CatalogoAdmin.variantes.actualizar(v.id_variante, p),
  });
}

async function refrescar(): Promise<void> {
  await listado.recargar();
  emit('cambio');
}

watch(() => props.producto.id_producto, () => { void cargarOpciones(); void listado.recargar(); });
onMounted(() => { void cargarOpciones(); void listado.recargar(); });

defineExpose({ recargarOpciones: cargarOpciones });
</script>
