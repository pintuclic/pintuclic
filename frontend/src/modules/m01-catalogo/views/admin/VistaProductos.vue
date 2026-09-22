<template>
  <div class="font-sans">
    <PageHeader title="Productos" description="Información común de cada producto, independiente de sus variantes (HU-CAT-02).">
      <Button variant="neutral" icon="settings" :to="{ name: 'M01CatalogosBase' }">Resinas y presentaciones</Button>
      <Button variant="conversion" icon="plus" @click="formularioAbierto = true">Nuevo producto</Button>
    </PageHeader>

    <Alert v-if="taxonomias.error" variant="danger" class="mb-5">{{ taxonomias.error }}</Alert>

    <PanelListado
      v-model:busqueda="q"
      v-model:pagina="listado.pagina.value"
      :columnas="columnas"
      :filas="listado.visibles.value"
      row-key="id_producto"
      :cargando="listado.cargando.value"
      :error="listado.error.value"
      :total="listado.total.value"
      :por-pagina="listado.porPagina"
      placeholder-busqueda="Buscar producto…"
      texto-vacio="Aún no hay productos registrados"
      @reintentar="listado.recargar"
    >
      <template #filtros>
        <Select v-model="marca" aria-label="Filtrar por marca" class="sm:max-w-[12rem]">
          <option value="">Todas las marcas</option>
          <option v-for="m in taxonomias.marcas" :key="m.id_marca" :value="m.id_marca">{{ m.nombre }}</option>
        </Select>
        <Select v-model="estado" aria-label="Filtrar por estado" class="sm:max-w-[10rem]">
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </Select>
        <Select v-model="publicacion" aria-label="Filtrar por publicación" class="sm:max-w-[10rem]">
          <option value="">Publicados y borradores</option>
          <option value="si">Publicados</option>
          <option value="no">Borradores</option>
        </Select>
      </template>

      <template #cell-nombre="{ row }">
        <RouterLink :to="rutaDetalle(row.id_producto)" class="font-medium text-corporate hover:text-action hover:underline">
          {{ row.nombre }}
        </RouterLink>
        <Badge v-if="row.patrocinado" tone="warning" label="Patrocinado" table class="ml-2" />
      </template>
      <template #cell-marca="{ row }">{{ taxonomias.nombreMarca(row.id_marca) }}</template>
      <template #cell-clase_color="{ row }">{{ ETIQUETA_CLASE[row.clase_color] }}</template>
      <template #cell-subcategorias="{ row }">
        <span class="text-neutral-medium">{{ row.id_subcategorias.map(taxonomias.nombreSubcategoria).join(', ') }}</span>
      </template>
      <template #cell-publicado="{ row }">
        <Badge :tone="row.publicado ? 'success' : 'neutral'" :label="row.publicado ? 'Publicado' : 'Borrador'" table />
      </template>
      <template #cell-estado="{ row }"><Badge :estado="row.estado" table /></template>
      <template #cell-acciones="{ row }">
        <AccionesFila
          :nombre="row.nombre"
          :estado="row.estado"
          :ver="rutaDetalle(row.id_producto)"
          @editar="editar(row)"
          @desactivar="abrirDesactivar(row.nombre, () => CatalogoAdmin.productos.desactivar(row.id_producto), () => CatalogoAdmin.productos.impacto(row.id_producto))"
          @reactivar="abrirReactivar(row.nombre, () => CatalogoAdmin.productos.reactivar(row.id_producto))"
        />
      </template>
    </PanelListado>

    <FormularioProducto v-model="formularioAbierto" :producto="enEdicion" @guardado="alGuardar" @update:model-value="!$event && (enEdicion = null)" />
    <ModalDesactivar
      v-model="cicloVida.abierto"
      :nombre="cicloVida.nombre"
      :modo="cicloVida.modo"
      :ejecutar="cicloVida.ejecutar"
      :consultar-impacto="cicloVida.consultarImpacto"
      @completado="listado.recargar"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { Alert, Badge, Button, PageHeader, Select } from '@/core/components';
import PanelListado from '../../components/admin/PanelListado.vue';
import AccionesFila from '../../components/admin/AccionesFila.vue';
import ModalDesactivar from '../../components/admin/ModalDesactivar.vue';
import FormularioProducto from '../../components/admin/FormularioProducto.vue';
import { useListado } from '../../composables/useListado';
import { useEdicion } from '../../composables/useEdicion';
import { CatalogoAdmin } from '../../services/catalogo-admin.service';
import { useTaxonomias } from '../../store/useTaxonomias';
import type { ClaseColor, Producto } from '../../interfaces';

const router = useRouter();
const taxonomias = useTaxonomias();
const { cicloVida, abrirDesactivar, abrirReactivar } = useEdicion();

const q = ref('');
const marca = ref<number | string>('');
const estado = ref('');
const publicacion = ref('');
const formularioAbierto = ref(false);
const enEdicion = ref<Producto | null>(null);

// Texto y marca los filtra el servidor; estado y publicación, el cliente sobre esa respuesta.
const listado = useListado(
  () => CatalogoAdmin.productos.listar({
    ...(q.value.trim() ? { q: q.value.trim() } : {}),
    ...(marca.value ? { marca: Number(marca.value) } : {}),
  }),
  {
    filtro: (p) => (!estado.value || p.estado === estado.value) &&
      (!publicacion.value || p.publicado === (publicacion.value === 'si')),
  },
);

const ETIQUETA_CLASE: Record<ClaseColor, string> = { entonable: 'Entonable', colores_fijos: 'Colores fijos', sin_color: 'Sin color' };

const columnas = [
  { key: 'nombre', label: 'Producto' },
  { key: 'marca', label: 'Marca' },
  { key: 'clase_color', label: 'Clase' },
  { key: 'subcategorias', label: 'Subcategorías' },
  { key: 'publicado', label: 'Publicación' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right' as const },
];

const rutaDetalle = (id: number) => ({ name: 'M01ProductoDetalle', params: { productoId: id } });

function editar(p: Producto): void {
  enEdicion.value = p;
  formularioAbierto.value = true;
}

function alGuardar(p: Producto): void {
  // Tras crear, lo siguiente es cargar variantes e imágenes (requisito para publicar, RF-CAT-02-05).
  if (!enEdicion.value) void router.push(rutaDetalle(p.id_producto));
  else void listado.recargar();
}

let temporizador: ReturnType<typeof setTimeout> | undefined;
watch(q, () => {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => { listado.pagina.value = 1; void listado.recargar(); }, 350);
});
watch(marca, () => { listado.pagina.value = 1; void listado.recargar(); });
onBeforeUnmount(() => clearTimeout(temporizador));

onMounted(async () => {
  await Promise.all([taxonomias.asegurar(), listado.recargar()]);
});
</script>
