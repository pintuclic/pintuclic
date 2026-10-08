<template>
  <div class="font-sans">
    <PageHeader title="Variantes" description="Presentaciones vendibles de cada producto, con su precio y existencia." />

    <div class="mb-5 max-w-md">
      <SearchableSelect
        v-model="seleccion"
        label="Producto"
        placeholder="Selecciona un producto…"
        search-placeholder="Buscar producto por nombre o marca…"
        :options="opcionesProductos"
        :disabled="cargando"
      />
    </div>

    <Alert v-if="error" variant="danger" class="mb-5">
      {{ error }}
      <Button variant="danger-outline" size="sm" class="mt-3" @click="cargar">Reintentar</Button>
    </Alert>

    <SinResultados
      v-if="!producto"
      icon="grid"
      title="Selecciona un producto"
      description="Cada variante pertenece a un producto; su forma depende de la clase de color del producto."
    />
    <template v-else>
      <p class="mb-3 text-sm">
        <RouterLink :to="{ name: 'M01ProductoDetalle', params: { productoId: producto.id_producto } }" class="font-medium text-action hover:underline">
          Ver ficha completa de {{ producto.nombre }}
        </RouterLink>
      </p>
      <PanelVariantes :producto="producto" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { Alert, Button, PageHeader, SearchableSelect, SinResultados } from '@/core/components';
import PanelVariantes from '../../components/admin/PanelVariantes.vue';
import { CatalogoAdmin } from '../../services/catalogo-admin.service';
import { mensajeError } from '../../services/http';
import { useTaxonomias } from '../../store/useTaxonomias';
import type { Producto } from '../../interfaces';

const route = useRoute();
const router = useRouter();
const taxonomias = useTaxonomias();
const productos = shallowRef<Producto[]>([]);
const cargando = ref(false);
const error = ref<string | null>(null);
const seleccion = ref<number | string>(Number(route.query.producto) || '');

const opcionesProductos = computed(() => [
  { value: '', label: cargando.value ? 'Cargando productos…' : 'Selecciona un producto…' },
  ...productos.value.map((p) => ({
    value: p.id_producto,
    label: p.nombre,
    description: `${taxonomias.nombreMarca(p.id_marca)}${p.estado === 'activo' ? '' : ' · (inactivo)'}`,
  })),
]);

const producto = computed(() => productos.value.find((p) => p.id_producto === Number(seleccion.value)) ?? null);

async function cargar(): Promise<void> {
  cargando.value = true;
  error.value = null;
  try {
    const [lista] = await Promise.all([CatalogoAdmin.productos.listar(), taxonomias.asegurar()]);
    productos.value = [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre));
  } catch (e) {
    error.value = mensajeError(e);
  } finally {
    cargando.value = false;
  }
}

watch(seleccion, (valor) => {
  void router.replace({ query: { ...route.query, producto: valor ? String(valor) : undefined } });
});
onMounted(cargar);
</script>
