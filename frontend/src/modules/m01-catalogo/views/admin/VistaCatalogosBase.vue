<template>
  <div class="font-sans">
    <PageHeader title="Resinas y presentaciones" description="Catálogos administrables que usan productos y variantes (RF-CAT-02-04, RF-CAT-03-05).">
      <Button variant="conversion" icon="plus" @click="crear">{{ pestana === 'resinas' ? 'Nuevo tipo de resina' : 'Nueva presentación' }}</Button>
    </PageHeader>

    <Tabs
      :model-value="pestana"
      :items="pestanas"
      aria-label="Catálogos base"
      class="mb-5"
      @update:model-value="pestana = $event === 'presentaciones' ? 'presentaciones' : 'resinas'"
    />

    <PanelListado
      v-if="pestana === 'resinas'"
      v-model:busqueda="resinas.busqueda.value"
      v-model:pagina="resinas.pagina.value"
      :columnas="columnasResinas"
      :filas="resinas.visibles.value"
      row-key="id_tipo_resina"
      :cargando="resinas.cargando.value"
      :error="resinas.error.value"
      :total="resinas.total.value"
      :por-pagina="resinas.porPagina"
      texto-vacio="Aún no hay tipos de resina"
      @reintentar="resinas.recargar"
    >
      <template #cell-nombre="{ row }"><span class="font-medium text-neutral-black">{{ row.nombre }}</span></template>
      <template #cell-estado="{ row }"><Badge :estado="row.estado" table /></template>
      <template #cell-acciones="{ row }">
        <AccionesFila
          :nombre="row.nombre"
          :estado="row.estado"
          @editar="editarResina(row)"
          @desactivar="abrirDesactivar(row.nombre, () => CatalogoAdmin.resinas.desactivar(row.id_tipo_resina))"
          @reactivar="abrirReactivar(row.nombre, () => CatalogoAdmin.resinas.reactivar(row.id_tipo_resina))"
        />
      </template>
    </PanelListado>

    <PanelListado
      v-else
      v-model:busqueda="presentaciones.busqueda.value"
      v-model:pagina="presentaciones.pagina.value"
      :columnas="columnasPresentaciones"
      :filas="presentaciones.visibles.value"
      row-key="id_presentacion"
      :cargando="presentaciones.cargando.value"
      :error="presentaciones.error.value"
      :total="presentaciones.total.value"
      :por-pagina="presentaciones.porPagina"
      texto-vacio="Aún no hay presentaciones"
      @reintentar="presentaciones.recargar"
    >
      <template #cell-nombre="{ row }"><span class="font-medium text-neutral-black">{{ row.nombre }}</span></template>
      <template #cell-volumen="{ row }"><span class="tabular-nums">{{ row.volumen }}</span></template>
      <template #cell-estado="{ row }"><Badge :estado="row.estado" table /></template>
      <template #cell-acciones="{ row }">
        <AccionesFila
          :nombre="row.nombre"
          :estado="row.estado"
          @editar="editarPresentacion(row)"
          @desactivar="abrirDesactivar(row.nombre, () => CatalogoAdmin.presentaciones.desactivar(row.id_presentacion))"
          @reactivar="abrirReactivar(row.nombre, () => CatalogoAdmin.presentaciones.reactivar(row.id_presentacion))"
        />
      </template>
    </PanelListado>

    <ModalFormularioCatalogo
      v-model="formulario.abierto"
      :titulo="formulario.titulo"
      :modo="formulario.modo"
      :campos="pestana === 'resinas' ? camposResina : camposPresentacion"
      :esquema="pestana === 'resinas' ? resinaFormSchema : presentacionFormSchema"
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
import { onMounted, ref, watch } from 'vue';
import { Badge, Button, PageHeader, Tabs } from '@/core/components';
import PanelListado from '../../components/admin/PanelListado.vue';
import AccionesFila from '../../components/admin/AccionesFila.vue';
import ModalFormularioCatalogo from '../../components/admin/ModalFormularioCatalogo.vue';
import ModalDesactivar from '../../components/admin/ModalDesactivar.vue';
import { useListado } from '../../composables/useListado';
import { useEdicion } from '../../composables/useEdicion';
import { CatalogoAdmin } from '../../services/catalogo-admin.service';
import { useTaxonomias } from '../../store/useTaxonomias';
import { presentacionFormSchema, resinaFormSchema } from '../../dtos/admin.dto';
import type { CampoFormulario, Presentacion, TipoResina } from '../../interfaces';

const taxonomias = useTaxonomias();
const { formulario, cicloVida, abrirFormulario, abrirDesactivar, abrirReactivar } = useEdicion();
const pestana = ref<'resinas' | 'presentaciones'>('resinas');
const pestanas = [
  { id: 'resinas', label: 'Tipos de resina' },
  { id: 'presentaciones', label: 'Presentaciones' },
];

const resinas = useListado(() => CatalogoAdmin.resinas.listar(), { texto: (r) => r.nombre });
const presentaciones = useListado(
  async () => [...(await CatalogoAdmin.presentaciones.listar())].sort((x, y) => x.volumen - y.volumen),
  { texto: (p) => p.nombre },
);

const columnasResinas = [
  { key: 'nombre', label: 'Tipo de resina' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right' as const },
];
const columnasPresentaciones = [
  { key: 'nombre', label: 'Presentación' },
  { key: 'volumen', label: 'Volumen (litros)', align: 'right' as const },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right' as const },
];

const camposResina: CampoFormulario[] = [{ clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', placeholder: 'Ej. Agua' }];
const camposPresentacion: CampoFormulario[] = [
  { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', placeholder: 'Ej. Galón' },
  { clave: 'volumen', etiqueta: 'Volumen en litros', tipo: 'numero', ayuda: 'Ej. 3.785 para galón, 0.946 para cuarto de galón.' },
];

function crear(): void {
  abrirFormulario(pestana.value === 'resinas'
    ? { modo: 'crear', titulo: 'Nuevo tipo de resina', guardar: (p) => CatalogoAdmin.resinas.crear(p) }
    : { modo: 'crear', titulo: 'Nueva presentación', guardar: (p) => CatalogoAdmin.presentaciones.crear(p) });
}

function editarResina(r: TipoResina): void {
  abrirFormulario({ modo: 'editar', titulo: `Editar ${r.nombre}`, valores: { nombre: r.nombre }, guardar: (p) => CatalogoAdmin.resinas.actualizar(r.id_tipo_resina, p) });
}

function editarPresentacion(p: Presentacion): void {
  abrirFormulario({
    modo: 'editar', titulo: `Editar ${p.nombre}`, valores: { nombre: p.nombre, volumen: p.volumen },
    guardar: (payload) => CatalogoAdmin.presentaciones.actualizar(p.id_presentacion, payload),
  });
}

async function refrescar(): Promise<void> {
  taxonomias.invalidar();
  await (pestana.value === 'resinas' ? resinas : presentaciones).recargar();
}

watch(pestana, refrescar);
onMounted(resinas.recargar);
</script>
