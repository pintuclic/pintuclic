<template>
  <Drawer :model-value="modelValue" :title="producto ? `Editar ${producto.nombre}` : 'Nuevo producto'" @update:model-value="cerrar">
    <form id="form-producto" class="space-y-4 font-sans" novalidate @submit.prevent="enviar">
      <Input v-model="valores.nombre" label="Nombre del producto" placeholder="Ej. Viniltex Advanced" :error="errores.nombre" />

      <Select v-model="valores.id_marca" label="Marca" :disabled="!!producto" :error="errores.id_marca">
        <option value="">Selecciona…</option>
        <option v-for="m in marcasActivas" :key="m.id_marca" :value="m.id_marca">{{ m.nombre }}</option>
      </Select>

      <!-- RF-CAT-02-03: la clase es obligatoria y no puede cambiarse si ya hay variantes (lo valida el servidor). -->
      <Select v-model="valores.clase_color" label="Clase de color" :error="errores.clase_color">
        <option value="">Selecciona…</option>
        <option v-for="c in CLASES_COLOR" :key="c.valor" :value="c.valor">{{ c.etiqueta }}</option>
      </Select>

      <!-- RF-CAT-02-02: línea (de la misma marca) y resina obligatorias solo para pinturas. -->
      <div class="grid gap-4 sm:grid-cols-2">
        <Select v-model="valores.id_linea" :label="esPintura ? 'Línea' : 'Línea (opcional)'" :disabled="!valores.id_marca" :error="errores.id_linea">
          <option value="">{{ valores.id_marca ? 'Sin línea' : 'Elige la marca primero' }}</option>
          <option v-for="l in lineas" :key="l.id_linea" :value="l.id_linea">{{ l.nombre }}</option>
        </Select>
        <Select v-model="valores.id_tipo_resina" :label="esPintura ? 'Tipo de resina' : 'Tipo de resina (opcional)'" :error="errores.id_tipo_resina">
          <option value="">Sin resina</option>
          <option v-for="r in resinasActivas" :key="r.id_tipo_resina" :value="r.id_tipo_resina">{{ r.nombre }}</option>
        </Select>
      </div>

      <fieldset>
        <legend class="mb-2 text-sm font-medium text-neutral-dark">Subcategorías</legend>
        <div class="max-h-56 space-y-3 overflow-y-auto rounded-lg border border-neutral-light p-3" :class="errores.id_subcategorias ? 'border-danger' : ''">
          <p v-if="!gruposSubcategorias.length" class="text-sm text-neutral-medium">No hay subcategorías activas. Créalas en Categorías.</p>
          <div v-for="grupo in gruposSubcategorias" :key="grupo.categoria.id_categoria">
            <p class="mb-1 text-xs font-semibold uppercase text-corporate">{{ grupo.categoria.nombre }}</p>
            <div class="grid gap-1 sm:grid-cols-2">
              <Checkbox
                v-for="s in grupo.subcategorias"
                :key="s.id_subcategoria"
                :model-value="valores.id_subcategorias.includes(s.id_subcategoria)"
                :label="s.nombre"
                @update:model-value="alternarSubcategoria(s.id_subcategoria, $event)"
              />
            </div>
          </div>
        </div>
        <span v-if="errores.id_subcategorias" role="alert" class="mt-1 block text-sm text-danger">{{ errores.id_subcategorias }}</span>
      </fieldset>

      <Textarea v-model="valores.descripcion" label="Descripción (opcional)" rows="4" :error="errores.descripcion" />

      <!-- HU-CAT-08: categoría de la que se extraen los complementarios y prioridad por patrocinio. -->
      <Select v-model="valores.id_categoria_complementaria" label="Categoría complementaria (opcional)">
        <option value="">Ninguna</option>
        <option v-for="c in taxonomias.categorias" :key="c.id_categoria" :value="c.id_categoria">{{ c.nombre }}</option>
      </Select>
      <Checkbox v-model="valores.patrocinado" label="Producto patrocinado (prioridad en complementarios)" />

      <Alert v-if="errorServidor" variant="danger">{{ errorServidor }}</Alert>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="neutral" :disabled="guardando" @click="cerrar">Cancelar</Button>
        <Button type="submit" form="form-producto" :variant="producto ? 'action' : 'conversion'" :disabled="guardando">
          {{ guardando ? 'Guardando…' : producto ? 'Guardar cambios' : 'Crear producto' }}
        </Button>
      </div>
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import { Alert, Button, Checkbox, Drawer, Input, Select, Textarea } from '@/core/components';
import { CLASES_COLOR, productoFormSchema, validar } from '../../dtos/admin.dto';
import type { ErroresFormulario } from '../../dtos/admin.dto';
import { CatalogoAdmin } from '../../services/catalogo-admin.service';
import { mensajeError } from '../../services/http';
import { useTaxonomias } from '../../store/useTaxonomias';
import type { Linea, Producto } from '../../interfaces';

const props = defineProps<{ modelValue: boolean; producto?: Producto | null }>();
const emit = defineEmits<{ 'update:modelValue': [valor: boolean]; guardado: [producto: Producto] }>();

const taxonomias = useTaxonomias();
const lineas = shallowRef<Linea[]>([]);
const errores = ref<ErroresFormulario>({});
const errorServidor = ref<string | null>(null);
const guardando = ref(false);

const valores = reactive({
  nombre: '',
  id_marca: '' as number | string,
  clase_color: '' as string | number,
  id_linea: '' as number | string,
  id_tipo_resina: '' as number | string,
  id_subcategorias: [] as number[],
  descripcion: '',
  id_categoria_complementaria: '' as number | string,
  patrocinado: false,
});

const marcasActivas = computed(() => taxonomias.marcas.filter((m) => m.estado === 'activo' || m.id_marca === props.producto?.id_marca));
const resinasActivas = computed(() => taxonomias.resinas.filter((r) => r.estado === 'activo' || r.id_tipo_resina === props.producto?.id_tipo_resina));
const esPintura = computed(() => valores.clase_color === 'entonable' || valores.clase_color === 'colores_fijos');

const gruposSubcategorias = computed(() =>
  taxonomias.categorias
    .filter((c) => c.estado === 'activo')
    .map((categoria) => ({
      categoria,
      subcategorias: taxonomias.subcategorias.filter(
        (s) => s.id_categoria === categoria.id_categoria && (s.estado === 'activo' || valores.id_subcategorias.includes(s.id_subcategoria)),
      ),
    }))
    .filter((g) => g.subcategorias.length > 0),
);

function alternarSubcategoria(id: number, marcado: boolean): void {
  valores.id_subcategorias = marcado
    ? [...valores.id_subcategorias, id]
    : valores.id_subcategorias.filter((s) => s !== id);
}

watch(
  () => props.modelValue,
  async (abierto) => {
    if (!abierto) return;
    await taxonomias.asegurar();
    const p = props.producto;
    Object.assign(valores, {
      nombre: p?.nombre ?? '',
      id_marca: p?.id_marca ?? '',
      clase_color: p?.clase_color ?? '',
      id_linea: p?.id_linea ?? '',
      id_tipo_resina: p?.id_tipo_resina ?? '',
      id_subcategorias: [...(p?.id_subcategorias ?? [])],
      descripcion: p?.descripcion ?? '',
      id_categoria_complementaria: p?.id_categoria_complementaria ?? '',
      patrocinado: p?.patrocinado ?? false,
    });
    errores.value = {};
    errorServidor.value = null;
  },
  { immediate: true },
);

// RF-CAT-11-02: la línea debe pertenecer a la marca del producto → se ofrecen solo las de esa marca.
watch(
  () => valores.id_marca,
  async (idMarca) => {
    lineas.value = [];
    if (!idMarca) {
      valores.id_linea = '';
      return;
    }
    try {
      const todas = await CatalogoAdmin.lineas.listarPorMarca(Number(idMarca));
      if (idMarca !== valores.id_marca) return; // respuesta tardía de una marca ya descartada
      lineas.value = todas.filter((l) => l.estado === 'activo' || l.id_linea === props.producto?.id_linea);
      if (!lineas.value.some((l) => l.id_linea === Number(valores.id_linea))) valores.id_linea = '';
    } catch (e) {
      errorServidor.value = mensajeError(e);
    }
  },
);

function cerrar(): void {
  if (!guardando.value) emit('update:modelValue', false);
}

async function enviar(): Promise<void> {
  errorServidor.value = null;
  const modo = props.producto ? 'editar' : 'crear';
  const resultado = validar(productoFormSchema(modo), { ...valores });
  if (!resultado.ok) {
    errores.value = resultado.errores;
    return;
  }
  errores.value = {};
  guardando.value = true;
  try {
    const guardado = props.producto
      ? await CatalogoAdmin.productos.actualizar(props.producto.id_producto, resultado.data)
      : await CatalogoAdmin.productos.crear(resultado.data);
    emit('guardado', guardado);
    emit('update:modelValue', false);
  } catch (e) {
    errorServidor.value = mensajeError(e);
  } finally {
    guardando.value = false;
  }
}
</script>
