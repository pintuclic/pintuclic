<template>
  <Drawer :model-value="modelValue" :title="base ? `Productos que ofrecen «${base.nombre}»` : 'Productos de la base'" @update:model-value="emit('update:modelValue', $event)">
    <div class="space-y-4 font-sans text-sm">
      <p class="text-neutral-medium">
        Marca los productos entonables de la marca que se preparan sobre esta base. Solo se ofrecen productos pertenecientes a la misma marca.
      </p>

      <Alert v-if="base && base.estado !== 'activo'" variant="warning">
        La base está inactiva: no se puede asignar a nuevos productos hasta reactivarla.
      </Alert>
      <Alert v-if="error" variant="danger" dismissible @close="error = null">{{ error }}</Alert>

      <!-- Buscador de productos cuando la lista es amplia -->
      <div v-if="filas.length > 4" class="relative">
        <Input
          v-model="filtro"
          placeholder="Buscar producto por nombre…"
          aria-label="Buscar producto entonable"
        />
      </div>

      <p v-if="cargando" class="text-neutral-medium py-4 text-center" role="status">Cargando productos entonables…</p>
      <SinResultados
        v-else-if="!filas.length"
        icon="grid"
        title="Sin productos entonables"
        description="Esta marca no tiene productos de clase entonable. Créalos en Productos."
        compact
      />
      <SinResultados
        v-else-if="!filasFiltradas.length"
        icon="search"
        title="No coincide con la búsqueda"
        description="Intenta con otro término."
        compact
      />
      <ul v-else class="divide-y divide-neutral-light rounded-card border border-neutral-light overflow-hidden">
        <li v-for="fila in filasFiltradas" :key="fila.producto.id_producto" class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-lightest/40 transition-colors">
          <Checkbox
            :model-value="fila.asignada"
            :label="fila.producto.nombre"
            :disabled="ocupado !== null || (!fila.asignada && base?.estado !== 'activo')"
            @update:model-value="alternar(fila, $event)"
          />
          <div class="flex shrink-0 items-center gap-2">
            <Badge v-if="fila.producto.estado !== 'activo'" :estado="fila.producto.estado" />
            <RouterLink
              :to="{ name: 'M01ProductoDetalle', params: { productoId: fila.producto.id_producto } }"
              class="text-xs font-medium text-action hover:underline"
            >
              Ver ficha
            </RouterLink>
          </div>
        </li>
      </ul>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <Button variant="neutral" @click="emit('update:modelValue', false)">Cerrar</Button>
      </div>
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { Alert, Badge, Button, Checkbox, Drawer, Input, SinResultados } from '@/core/components';
import { CatalogoAdmin } from '../../services/catalogo-admin.service';
import { mensajeError } from '../../services/http';
import type { Base, Producto } from '../../interfaces';

/**
 * M01 - Asignación base ↔ productos entonables.
 * El backend expone la relación por producto (`/productos/:id/bases`); aquí se
 * consulta para cada producto entonable de la marca y se alterna con
 * POST/DELETE.
 */
const props = defineProps<{ modelValue: boolean; base: Base | null }>();
const emit = defineEmits<{ 'update:modelValue': [valor: boolean]; cambio: [] }>();

interface FilaProducto { producto: Producto; asignada: boolean }

const filas = ref<FilaProducto[]>([]);
const filtro = ref('');
const cargando = ref(false);
const ocupado = ref<number | null>(null);
const error = ref<string | null>(null);

const filasFiltradas = computed(() => {
  const q = filtro.value.trim().toLowerCase();
  if (!q) return filas.value;
  return filas.value.filter((f) => f.producto.nombre.toLowerCase().includes(q));
});

async function cargar(base: Base): Promise<void> {
  cargando.value = true;
  error.value = null;
  filas.value = [];
  try {
    const productos = (await CatalogoAdmin.productos.listar({ marca: base.id_marca }))
      .filter((p) => p.clase_color === 'entonable')
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
    const asignaciones = await Promise.all(productos.map((p) => CatalogoAdmin.productos.bases(p.id_producto)));
    filas.value = productos.map((producto, i) => ({
      producto,
      asignada: asignaciones[i].some((b) => b.id_base === base.id_base),
    }));
  } catch (e) {
    error.value = mensajeError(e);
  } finally {
    cargando.value = false;
  }
}

async function alternar(fila: FilaProducto, asignar: boolean): Promise<void> {
  if (!props.base) return;
  const { id_producto } = fila.producto;
  ocupado.value = id_producto;
  error.value = null;
  try {
    const bases = asignar
      ? await CatalogoAdmin.productos.asignarBase(id_producto, props.base.id_base)
      : await CatalogoAdmin.productos.quitarBase(id_producto, props.base.id_base);
    fila.asignada = bases.some((b) => b.id_base === props.base?.id_base);
    emit('cambio');
  } catch (e) {
    error.value = `${fila.producto.nombre}: ${mensajeError(e)}`;
  } finally {
    ocupado.value = null;
  }
}

watch(
  () => [props.modelValue, props.base?.id_base] as const,
  ([abierto]) => { if (abierto && props.base) void cargar(props.base); },
  { immediate: true },
);
</script>
