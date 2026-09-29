<template>
  <div class="font-sans">
    <PageHeader title="Marcas" description="Marcas del catálogo y sus líneas, bases y colores (HU-CAT-04).">
      <Button variant="conversion" icon="plus" @click="nuevaMarca">Nueva marca</Button>
    </PageHeader>

    <PanelListado
      v-model:busqueda="listado.busqueda.value"
      v-model:pagina="listado.pagina.value"
      :columnas="columnas"
      :filas="listado.visibles.value"
      row-key="id_marca"
      :cargando="listado.cargando.value"
      :error="listado.error.value"
      :total="listado.total.value"
      :por-pagina="listado.porPagina"
      texto-vacio="Aún no hay marcas registradas"
      @reintentar="listado.recargar"
    >
      <template #cell-logotipo="{ row }">
        <ImagenApi
          :clave="`${row.id_marca}:${version}`"
          :cargar="() => CatalogoAdmin.marcas.logotipo(row.id_marca)"
          :alt="`Logotipo de ${row.nombre}`"
          class="h-10 w-16"
        />
      </template>
      <template #cell-nombre="{ row }">
        <RouterLink :to="rutaMarca(row.id_marca)" class="font-medium text-corporate hover:text-action hover:underline">
          {{ row.nombre }}
        </RouterLink>
      </template>
      <template #cell-estado="{ row }"><Badge :estado="row.estado" table /></template>
      <template #cell-acciones="{ row }">
        <AccionesFila
          :nombre="row.nombre"
          :estado="row.estado"
          :ver="rutaMarca(row.id_marca)"
          @editar="editarMarca(row)"
          @desactivar="abrirDesactivar(row.nombre, () => CatalogoAdmin.marcas.desactivar(row.id_marca), () => CatalogoAdmin.marcas.impacto(row.id_marca))"
          @reactivar="abrirReactivar(row.nombre, () => CatalogoAdmin.marcas.reactivar(row.id_marca))"
        />
      </template>
    </PanelListado>

    <ModalFormularioCatalogo
      v-model="formulario.abierto"
      :titulo="formulario.titulo"
      :modo="formulario.modo"
      :campos="campos"
      :esquema="marcaFormSchema(formulario.modo)"
      :valores-iniciales="formulario.valores"
      :imagenes-actuales="formulario.imagenes"
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
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { Badge, Button, PageHeader } from '@/core/components';
import PanelListado from '../../components/admin/PanelListado.vue';
import AccionesFila from '../../components/admin/AccionesFila.vue';
import ImagenApi from '../../components/admin/ImagenApi.vue';
import ModalFormularioCatalogo from '../../components/admin/ModalFormularioCatalogo.vue';
import ModalDesactivar from '../../components/admin/ModalDesactivar.vue';
import { useListado } from '../../composables/useListado';
import { useEdicion } from '../../composables/useEdicion';
import { CatalogoAdmin } from '../../services/catalogo-admin.service';
import { useTaxonomias } from '../../store/useTaxonomias';
import { marcaFormSchema } from '../../dtos/admin.dto';
import type { CampoFormulario, Marca } from '../../interfaces';

const taxonomias = useTaxonomias();
const listado = useListado(() => CatalogoAdmin.marcas.listar(), { texto: (m) => m.nombre });
const { formulario, cicloVida, abrirFormulario, abrirDesactivar, abrirReactivar } = useEdicion();
/** Fuerza la recarga de logotipos tras editar (el id no cambia, el binario sí). */
const version = ref(0);

const columnas = [
  { key: 'logotipo', label: 'Logotipo' },
  { key: 'nombre', label: 'Marca' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right' as const },
];

const campos: CampoFormulario[] = [
  { clave: 'nombre', etiqueta: 'Nombre de la marca', tipo: 'texto', placeholder: 'Ej. Pintuco' },
  { clave: 'logotipo', etiqueta: 'Logotipo', tipo: 'imagen', ayuda: 'JPG, PNG o WEBP de hasta 5 MB.' },
];

const rutaMarca = (id: number) => ({ name: 'M01MarcaDetalle', params: { marcaId: id } });

function nuevaMarca(): void {
  abrirFormulario({ modo: 'crear', titulo: 'Nueva marca', guardar: (p) => CatalogoAdmin.marcas.crear(p) });
}

function editarMarca(marca: Marca): void {
  abrirFormulario({
    modo: 'editar',
    titulo: `Editar ${marca.nombre}`,
    valores: { nombre: marca.nombre },
    guardar: (p) => CatalogoAdmin.marcas.actualizar(marca.id_marca, p),
  });
}

async function refrescar(): Promise<void> {
  version.value++;
  taxonomias.invalidar();
  await listado.recargar();
}

onMounted(listado.recargar);
</script>
