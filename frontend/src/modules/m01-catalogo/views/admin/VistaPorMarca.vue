<template>
  <div class="font-sans">
    <PageHeader :title="titulo" :description="descripcion">
      <Button v-if="marcaFija" variant="neutral" icon="back" :to="{ name: 'M01Marcas' }">Volver a marcas</Button>
      <Button
        v-if="recurso !== 'productos'"
        variant="conversion"
        icon="plus"
        :disabled="!idMarca"
        @click="crear"
      >
        {{ textoCrear }}
      </Button>
    </PageHeader>

    <!-- RF-CAT-04-01: desde la marca se consultan sus líneas, bases, colores y productos. -->
    <Tabs
      v-if="marcaFija"
      :model-value="recurso"
      :items="pestanas"
      aria-label="Elementos de la marca"
      class="mb-5"
      @update:model-value="recurso = $event as Recurso"
    />

    <div v-else class="mb-5 max-w-sm">
      <Select v-model="marcaSeleccionada" label="Marca" :disabled="!taxonomias.cargado">
        <option value="">Selecciona una marca…</option>
        <option v-for="m in taxonomias.marcas" :key="m.id_marca" :value="m.id_marca">{{ m.nombre }}</option>
      </Select>
    </div>

    <Alert v-if="taxonomias.error" variant="danger" class="mb-5">{{ taxonomias.error }}</Alert>

    <SinResultados
      v-if="!idMarca"
      icon="building"
      title="Selecciona una marca"
      description="Las líneas, bases y colores pertenecen siempre a una única marca."
    />

    <!-- HU-CAT-11 · Líneas -->
    <PanelListado
      v-else-if="recurso === 'lineas'"
      v-model:busqueda="lineas.busqueda.value"
      v-model:pagina="lineas.pagina.value"
      :columnas="columnasLineas"
      :filas="lineas.visibles.value"
      row-key="id_linea"
      :cargando="lineas.cargando.value"
      :error="lineas.error.value"
      :total="lineas.total.value"
      :por-pagina="lineas.porPagina"
      texto-vacio="Esta marca aún no tiene líneas"
      @reintentar="lineas.recargar"
    >
      <template #cell-nombre="{ row }"><span class="font-medium text-neutral-black">{{ row.nombre }}</span></template>
      <template #cell-gama_comercial="{ row }">{{ row.gama_comercial ?? '—' }}</template>
      <template #cell-estado="{ row }"><Badge :estado="row.estado" table /></template>
      <template #cell-acciones="{ row }">
        <AccionesFila
          :nombre="row.nombre"
          :estado="row.estado"
          @editar="editarLinea(row)"
          @desactivar="abrirDesactivar(row.nombre, () => CatalogoAdmin.lineas.desactivar(row.id_linea, true), () => CatalogoAdmin.lineas.desactivar(row.id_linea, false))"
          @reactivar="abrirReactivar(row.nombre, () => CatalogoAdmin.lineas.reactivar(row.id_linea))"
        />
      </template>
    </PanelListado>

    <!-- HU-CAT-12 · Bases -->
    <PanelListado
      v-else-if="recurso === 'bases'"
      v-model:busqueda="bases.busqueda.value"
      v-model:pagina="bases.pagina.value"
      :columnas="columnasBases"
      :filas="bases.visibles.value"
      row-key="id_base"
      :cargando="bases.cargando.value"
      :error="bases.error.value"
      :total="bases.total.value"
      :por-pagina="bases.porPagina"
      texto-vacio="Esta marca aún no tiene bases"
      @reintentar="bases.recargar"
    >
      <template #cell-nombre="{ row }"><span class="font-medium text-neutral-black">{{ row.nombre }}</span></template>
      <template #cell-estado="{ row }"><Badge :estado="row.estado" table /></template>
      <template #cell-acciones="{ row }">
        <AccionesFila
          :nombre="row.nombre"
          :estado="row.estado"
          @editar="editarBase(row)"
          @desactivar="abrirDesactivar(row.nombre, () => CatalogoAdmin.bases.desactivar(row.id_base))"
          @reactivar="abrirReactivar(row.nombre, () => CatalogoAdmin.bases.reactivar(row.id_base))"
        />
      </template>
    </PanelListado>

    <!-- HU-CAT-05 · Colores -->
    <PanelListado
      v-else-if="recurso === 'colores'"
      v-model:busqueda="colores.busqueda.value"
      v-model:pagina="colores.pagina.value"
      :columnas="columnasColores"
      :filas="colores.visibles.value"
      row-key="id_color"
      :cargando="colores.cargando.value"
      :error="colores.error.value"
      :total="colores.total.value"
      :por-pagina="colores.porPagina"
      placeholder-busqueda="Buscar por nombre o código…"
      texto-vacio="Esta marca aún no tiene colores"
      @reintentar="colores.recargar"
    >
      <template #filtros>
        <!-- RF-CAT-05-03 / CA-CAT-05-05: filtro por familia cromática derivada del CIELAB. -->
        <Select v-model="familia" aria-label="Familia cromática" class="sm:max-w-[12rem]">
          <option value="">Todas las familias</option>
          <option v-for="f in FAMILIAS_CROMATICAS" :key="f" :value="f">{{ f }}</option>
        </Select>
      </template>
      <template #cell-muestra="{ row }">
        <!-- Muestra generada por el backend desde el CIELAB (RF-CAT-05-02); el hex es dato, no un color del diseño. -->
        <span class="block h-8 w-8 rounded-lg border border-neutral-light" :style="{ backgroundColor: row.muestra_hex }" :title="row.muestra_hex" />
      </template>
      <template #cell-nombre="{ row }"><span class="font-medium text-neutral-black">{{ row.nombre }}</span></template>
      <template #cell-codigo="{ row }">{{ row.codigo ?? '—' }}</template>
      <template #cell-familia="{ row }">{{ familiaCromatica(row.cielab) }}</template>
      <template #cell-cielab="{ row }">
        <span class="text-xs tabular-nums text-neutral-medium">L {{ row.cielab.l }} · a {{ row.cielab.a }} · b {{ row.cielab.b }}</span>
      </template>
      <template #cell-estado="{ row }"><Badge :estado="row.estado" table /></template>
      <template #cell-acciones="{ row }">
        <AccionesFila
          :nombre="row.nombre"
          :estado="row.estado"
          @editar="editarColor(row)"
          @desactivar="abrirDesactivar(row.nombre, () => CatalogoAdmin.colores.desactivar(row.id_color))"
          @reactivar="abrirReactivar(row.nombre, () => CatalogoAdmin.colores.reactivar(row.id_color))"
        />
      </template>
    </PanelListado>

    <!-- RF-CAT-04-01 · Productos de la marca (consulta; se administran en Productos) -->
    <PanelListado
      v-else
      v-model:busqueda="productos.busqueda.value"
      v-model:pagina="productos.pagina.value"
      :columnas="columnasProductos"
      :filas="productos.visibles.value"
      row-key="id_producto"
      :cargando="productos.cargando.value"
      :error="productos.error.value"
      :total="productos.total.value"
      :por-pagina="productos.porPagina"
      texto-vacio="Esta marca aún no tiene productos"
      @reintentar="productos.recargar"
    >
      <template #cell-nombre="{ row }">
        <RouterLink :to="{ name: 'M01ProductoDetalle', params: { productoId: row.id_producto } }" class="font-medium text-corporate hover:text-action hover:underline">
          {{ row.nombre }}
        </RouterLink>
      </template>
      <template #cell-publicado="{ row }">
        <Badge :tone="row.publicado ? 'success' : 'neutral'" :label="row.publicado ? 'Publicado' : 'Borrador'" table />
      </template>
      <template #cell-estado="{ row }"><Badge :estado="row.estado" table /></template>
    </PanelListado>

    <ModalFormularioCatalogo
      v-model="formulario.abierto"
      :titulo="formulario.titulo"
      :modo="formulario.modo"
      :campos="camposActuales"
      :esquema="esquemaActual"
      :valores-iniciales="formulario.valores"
      :guardar="formulario.guardar"
      @guardado="recargarActual"
    />
    <ModalDesactivar
      v-model="cicloVida.abierto"
      :nombre="cicloVida.nombre"
      :modo="cicloVida.modo"
      :ejecutar="cicloVida.ejecutar"
      :consultar-impacto="cicloVida.consultarImpacto"
      @completado="recargarActual"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { Alert, Badge, Button, PageHeader, Select, SinResultados, Tabs } from '@/core/components';
import PanelListado from '../../components/admin/PanelListado.vue';
import AccionesFila from '../../components/admin/AccionesFila.vue';
import ModalFormularioCatalogo from '../../components/admin/ModalFormularioCatalogo.vue';
import ModalDesactivar from '../../components/admin/ModalDesactivar.vue';
import { useListado } from '../../composables/useListado';
import { useEdicion } from '../../composables/useEdicion';
import { FAMILIAS_CROMATICAS, familiaCromatica } from '../../composables/useColorCielab';
import { CatalogoAdmin } from '../../services/catalogo-admin.service';
import { useTaxonomias } from '../../store/useTaxonomias';
import { baseFormSchema, colorFormSchema, lineaFormSchema } from '../../dtos/admin.dto';
import type { Base, CampoFormulario, Color, Linea } from '../../interfaces';

type Recurso = 'lineas' | 'bases' | 'colores' | 'productos';

const route = useRoute();
const router = useRouter();
const taxonomias = useTaxonomias();
const { formulario, cicloVida, abrirFormulario, abrirDesactivar, abrirReactivar } = useEdicion();

/** `/marcas/:marcaId` fija la marca; `/lineas` y `/colores` la eligen con el selector (persistido en `?marca=`). */
const marcaFija = computed(() => route.params.marcaId !== undefined);
const recurso = ref<Recurso>((route.meta.recurso as Recurso | undefined) ?? 'lineas');
const marcaSeleccionada = ref<number | string>(Number(route.query.marca) || '');

const idMarca = computed<number | null>(() => {
  const valor = marcaFija.value ? Number(route.params.marcaId) : Number(marcaSeleccionada.value);
  return Number.isInteger(valor) && valor > 0 ? valor : null;
});
const nombreMarca = computed(() => (idMarca.value ? taxonomias.nombreMarca(idMarca.value) : ''));

const familia = ref('');
const lineas = useListado(() => CatalogoAdmin.lineas.listarPorMarca(idMarca.value!), { texto: (l) => `${l.nombre} ${l.gama_comercial ?? ''}` });
const bases = useListado(() => CatalogoAdmin.bases.listarPorMarca(idMarca.value!), { texto: (b) => b.nombre });
const colores = useListado(() => CatalogoAdmin.colores.listarPorMarca(idMarca.value!), {
  texto: (c) => `${c.nombre} ${c.codigo ?? ''}`,
  filtro: (c) => !familia.value || familiaCromatica(c.cielab) === familia.value,
  porPagina: 15,
});
const productos = useListado(() => CatalogoAdmin.productos.listar({ marca: idMarca.value! }), { texto: (p) => p.nombre });
const listados = { lineas, bases, colores, productos };

const pestanas = [
  { id: 'lineas', label: 'Líneas' },
  { id: 'bases', label: 'Bases' },
  { id: 'colores', label: 'Colores' },
  { id: 'productos', label: 'Productos' },
];

const TEXTOS: Record<Recurso, { titulo: string; crear: string; descripcion: string }> = {
  lineas: { titulo: 'Líneas comerciales', crear: 'Nueva línea', descripcion: 'Líneas de cada marca para agrupar productos y reglas comerciales (HU-CAT-11).' },
  bases: { titulo: 'Bases', crear: 'Nueva base', descripcion: 'Bases sobre las que se preparan los colores entonados (HU-CAT-12).' },
  colores: { titulo: 'Colores', crear: 'Nuevo color', descripcion: 'Carta de colores de cada marca con su valor CIELAB (HU-CAT-05).' },
  productos: { titulo: 'Productos', crear: '', descripcion: 'Productos asociados a la marca (RF-CAT-04-01).' },
};

const titulo = computed(() => (marcaFija.value ? nombreMarca.value || 'Marca' : TEXTOS[recurso.value].titulo));
const descripcion = computed(() => TEXTOS[recurso.value].descripcion);
const textoCrear = computed(() => TEXTOS[recurso.value].crear);

const columnasLineas = [
  { key: 'nombre', label: 'Línea' },
  { key: 'gama_comercial', label: 'Gama comercial' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right' as const },
];
const columnasBases = [
  { key: 'nombre', label: 'Base' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right' as const },
];
const columnasColores = [
  { key: 'muestra', label: 'Muestra' },
  { key: 'nombre', label: 'Color' },
  { key: 'codigo', label: 'Código' },
  { key: 'familia', label: 'Familia' },
  { key: 'cielab', label: 'CIELAB' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right' as const },
];
const columnasProductos = [
  { key: 'nombre', label: 'Producto' },
  { key: 'publicado', label: 'Publicación' },
  { key: 'estado', label: 'Estado' },
];

const CAMPOS: Record<Exclude<Recurso, 'productos'>, CampoFormulario[]> = {
  lineas: [
    { clave: 'nombre', etiqueta: 'Nombre de la línea', tipo: 'texto', placeholder: 'Ej. Viniltex' },
    { clave: 'gama_comercial', etiqueta: 'Gama comercial (opcional)', tipo: 'texto', placeholder: 'Ej. Premium' },
  ],
  bases: [{ clave: 'nombre', etiqueta: 'Nombre o código de la base', tipo: 'texto', placeholder: 'Ej. Base pastel' }],
  colores: [
    { clave: 'nombre', etiqueta: 'Nombre comercial', tipo: 'texto', placeholder: 'Ej. Verde menta' },
    { clave: 'codigo', etiqueta: 'Código (opcional)', tipo: 'texto' },
    { clave: 'cielab', etiqueta: 'Valor cromático CIELAB', tipo: 'cielab' },
  ],
};

const camposActuales = computed(() => (recurso.value === 'productos' ? [] : CAMPOS[recurso.value]));
const esquemaActual = computed(() => {
  if (recurso.value === 'bases') return baseFormSchema;
  if (recurso.value === 'colores') return colorFormSchema(formulario.modo);
  return lineaFormSchema;
});

function crear(): void {
  if (!idMarca.value || recurso.value === 'productos') return;
  const api = CatalogoAdmin[recurso.value];
  abrirFormulario({
    modo: 'crear',
    titulo: `${textoCrear.value} · ${nombreMarca.value}`,
    valores: { id_marca: idMarca.value },
    guardar: (p) => api.crear(p),
  });
}

function editarLinea(l: Linea): void {
  abrirFormulario({
    modo: 'editar', titulo: `Editar ${l.nombre}`,
    valores: { id_marca: l.id_marca, nombre: l.nombre, gama_comercial: l.gama_comercial ?? '' },
    guardar: (p) => CatalogoAdmin.lineas.actualizar(l.id_linea, p),
  });
}

function editarBase(b: Base): void {
  abrirFormulario({
    modo: 'editar', titulo: `Editar ${b.nombre}`,
    valores: { id_marca: b.id_marca, nombre: b.nombre },
    guardar: (p) => CatalogoAdmin.bases.actualizar(b.id_base, p),
  });
}

function editarColor(c: Color): void {
  abrirFormulario({
    modo: 'editar', titulo: `Editar ${c.nombre}`,
    valores: { id_marca: c.id_marca, nombre: c.nombre, codigo: c.codigo ?? '', ...c.cielab },
    guardar: (p) => CatalogoAdmin.colores.actualizar(c.id_color, p),
  });
}

function recargarActual(): Promise<void> {
  return idMarca.value ? listados[recurso.value].recargar() : Promise.resolve();
}

watch(marcaSeleccionada, (valor) => {
  void router.replace({ query: { ...route.query, marca: valor ? String(valor) : undefined } });
});
watch([idMarca, recurso], () => { familia.value = ''; void recargarActual(); });
// La misma vista atiende /lineas y /colores: al cambiar de enlace en el menú se reutiliza la instancia.
watch(() => route.meta.recurso, (r) => { if (r && !marcaFija.value) recurso.value = r as Recurso; });

onMounted(async () => {
  await taxonomias.asegurar();
  await recargarActual();
});
</script>
