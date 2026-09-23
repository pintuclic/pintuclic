<template>
  <div class="font-sans">
    <PageHeader title="Categorías" description="Clasificación a dos niveles: categoría y subcategoría (HU-CAT-01).">
      <Button variant="conversion" icon="plus" @click="nuevaCategoria">Nueva categoría</Button>
    </PageHeader>

    <div class="grid gap-6 xl:grid-cols-2">
      <div>
        <h2 class="mb-3 font-title text-lg font-semibold text-corporate">Categorías</h2>
        <PanelListado
          v-model:busqueda="categorias.busqueda.value"
          v-model:pagina="categorias.pagina.value"
          :columnas="columnasCategorias"
          :filas="categorias.visibles.value"
          row-key="id_categoria"
          :cargando="categorias.cargando.value"
          :error="categorias.error.value"
          :total="categorias.total.value"
          :por-pagina="categorias.porPagina"
          texto-vacio="Aún no hay categorías"
          @reintentar="categorias.recargar"
        >
          <template #cell-orden="{ row }"><span class="tabular-nums">{{ row.orden }}</span></template>
          <template #cell-nombre="{ row }">
            <button
              type="button"
              class="cursor-pointer font-medium hover:text-action hover:underline"
              :class="row.id_categoria === seleccionada?.id_categoria ? 'text-action' : 'text-corporate'"
              :aria-pressed="row.id_categoria === seleccionada?.id_categoria"
              @click="seleccionada = row"
            >
              {{ row.nombre }}
            </button>
          </template>
          <template #cell-estado="{ row }"><Badge :estado="row.estado" table /></template>
          <template #cell-acciones="{ row }">
            <AccionesFila
              :nombre="row.nombre"
              :estado="row.estado"
              @editar="editarCategoria(row)"
              @desactivar="abrirDesactivar(row.nombre, () => CatalogoAdmin.categorias.desactivar(row.id_categoria, true), () => CatalogoAdmin.categorias.desactivar(row.id_categoria, false))"
              @reactivar="abrirReactivar(row.nombre, () => CatalogoAdmin.categorias.reactivar(row.id_categoria))"
            />
          </template>
        </PanelListado>
      </div>

      <div>
        <div class="mb-3 flex items-center justify-between gap-3">
          <h2 class="font-title text-lg font-semibold text-corporate">
            Subcategorías<span v-if="seleccionada" class="text-neutral-medium"> · {{ seleccionada.nombre }}</span>
          </h2>
          <Button v-if="seleccionada" variant="subaction" size="sm" icon="plus" @click="nuevaSubcategoria">Nueva subcategoría</Button>
        </div>
        <SinResultados
          v-if="!seleccionada"
          icon="grid"
          title="Selecciona una categoría"
          description="Elige una categoría de la lista para ver y administrar sus subcategorías."
        />
        <PanelListado
          v-else
          v-model:busqueda="subcategorias.busqueda.value"
          v-model:pagina="subcategorias.pagina.value"
          :columnas="columnasSubcategorias"
          :filas="subcategorias.visibles.value"
          row-key="id_subcategoria"
          :cargando="subcategorias.cargando.value"
          :error="subcategorias.error.value"
          :total="subcategorias.total.value"
          :por-pagina="subcategorias.porPagina"
          texto-vacio="Esta categoría aún no tiene subcategorías"
          @reintentar="subcategorias.recargar"
        >
          <template #cell-orden="{ row }"><span class="tabular-nums">{{ row.orden }}</span></template>
          <template #cell-nombre="{ row }"><span class="font-medium text-neutral-black">{{ row.nombre }}</span></template>
          <template #cell-estado="{ row }"><Badge :estado="row.estado" table /></template>
          <template #cell-acciones="{ row }">
            <AccionesFila
              :nombre="row.nombre"
              :estado="row.estado"
              @editar="editarSubcategoria(row)"
              @desactivar="abrirDesactivar(row.nombre, () => CatalogoAdmin.subcategorias.desactivar(row.id_subcategoria, true), () => CatalogoAdmin.subcategorias.desactivar(row.id_subcategoria, false))"
              @reactivar="abrirReactivar(row.nombre, () => CatalogoAdmin.subcategorias.reactivar(row.id_subcategoria))"
            />
          </template>
        </PanelListado>
      </div>
    </div>

    <ModalFormularioCatalogo
      v-model="formulario.abierto"
      :titulo="formulario.titulo"
      :modo="formulario.modo"
      :campos="esSubcategoria ? camposSubcategoria : camposCategoria"
      :esquema="esSubcategoria ? subcategoriaFormSchema : categoriaFormSchema"
      :valores-iniciales="formulario.valores"
      :guardar="formulario.guardar"
      @guardado="refrescar"
    />
    <ModalDesactivar
      v-model="cicloVida.abierto"
      :nombre="cicloVida.nombre"
      :modo="cicloVida.modo"
      :ejecutar="cicloVida.ejecutar"
      :consultar-impacto="cicloVida.consultarImpacto"
      @completado="refrescar"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Badge, Button, PageHeader, SinResultados } from '@/core/components';
import PanelListado from '../../components/admin/PanelListado.vue';
import AccionesFila from '../../components/admin/AccionesFila.vue';
import ModalFormularioCatalogo from '../../components/admin/ModalFormularioCatalogo.vue';
import ModalDesactivar from '../../components/admin/ModalDesactivar.vue';
import { useListado } from '../../composables/useListado';
import { useEdicion } from '../../composables/useEdicion';
import { CatalogoAdmin } from '../../services/catalogo-admin.service';
import { useTaxonomias } from '../../store/useTaxonomias';
import { categoriaFormSchema, subcategoriaFormSchema } from '../../dtos/admin.dto';
import type { CampoFormulario, Categoria, Subcategoria } from '../../interfaces';

const taxonomias = useTaxonomias();
const { formulario, cicloVida, abrirFormulario, abrirDesactivar, abrirReactivar } = useEdicion();
const seleccionada = ref<Categoria | null>(null);
const esSubcategoria = ref(false);

// CA-CAT-01-04: el orden de presentación definido es el que se muestra.
const porOrden = <T extends { orden: number; nombre: string }>(lista: T[]) =>
  [...lista].sort((x, y) => x.orden - y.orden || x.nombre.localeCompare(y.nombre));

const categorias = useListado(async () => porOrden(await CatalogoAdmin.categorias.listar()), { texto: (c) => c.nombre });
const subcategorias = useListado(
  async () => porOrden(await CatalogoAdmin.subcategorias.listarPorCategoria(seleccionada.value!.id_categoria)),
  { texto: (s) => s.nombre },
);

const columnasBase = [
  { key: 'orden', label: 'Orden' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right' as const },
];
const columnasCategorias = columnasBase;
const columnasSubcategorias = columnasBase;

const camposCategoria: CampoFormulario[] = [
  { clave: 'nombre', etiqueta: 'Nombre de la categoría', tipo: 'texto', placeholder: 'Ej. Pinturas' },
  { clave: 'orden', etiqueta: 'Orden de presentación (opcional)', tipo: 'numero' },
];
const camposSubcategoria: CampoFormulario[] = [
  { clave: 'nombre', etiqueta: 'Nombre de la subcategoría', tipo: 'texto', placeholder: 'Ej. Interior' },
  { clave: 'orden', etiqueta: 'Orden de presentación (opcional)', tipo: 'numero' },
];

function nuevaCategoria(): void {
  esSubcategoria.value = false;
  abrirFormulario({ modo: 'crear', titulo: 'Nueva categoría', guardar: (p) => CatalogoAdmin.categorias.crear(p) });
}

function editarCategoria(c: Categoria): void {
  esSubcategoria.value = false;
  abrirFormulario({
    modo: 'editar', titulo: `Editar ${c.nombre}`, valores: { nombre: c.nombre, orden: c.orden },
    guardar: (p) => CatalogoAdmin.categorias.actualizar(c.id_categoria, p),
  });
}

function nuevaSubcategoria(): void {
  if (!seleccionada.value) return;
  esSubcategoria.value = true;
  abrirFormulario({
    modo: 'crear', titulo: `Nueva subcategoría en ${seleccionada.value.nombre}`,
    valores: { id_categoria: seleccionada.value.id_categoria },
    guardar: (p) => CatalogoAdmin.subcategorias.crear(p),
  });
}

function editarSubcategoria(s: Subcategoria): void {
  esSubcategoria.value = true;
  abrirFormulario({
    modo: 'editar', titulo: `Editar ${s.nombre}`,
    valores: { id_categoria: s.id_categoria, nombre: s.nombre, orden: s.orden },
    // La categoría padre no se cambia (RF-CAT-01-02); el esquema la exige y el backend la ignora al editar.
    guardar: (p) => CatalogoAdmin.subcategorias.actualizar(s.id_subcategoria, p),
  });
}

async function refrescar(): Promise<void> {
  taxonomias.invalidar();
  await categorias.recargar();
  // Desactivar una categoría desactiva sus subcategorías (RF-CAT-01-04): refrescar ambas.
  if (seleccionada.value) {
    seleccionada.value = categorias.items.value.find((c) => c.id_categoria === seleccionada.value?.id_categoria) ?? null;
    if (seleccionada.value) await subcategorias.recargar();
  }
}

watch(() => seleccionada.value?.id_categoria, (id) => { if (id) void subcategorias.recargar(); });
onMounted(categorias.recargar);
</script>
