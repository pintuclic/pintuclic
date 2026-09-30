<template>
  <div class="space-y-5 font-sans">
    <!-- Carga (RF-CAT-07-01/02): imagen del producto, opcionalmente asociada a una variante o a un color. -->
    <form class="rounded-card border border-neutral-light bg-neutral-white p-4" novalidate @submit.prevent="subir">
      <h3 class="mb-3 font-title text-base font-semibold text-corporate">Cargar imagen</h3>
      <div class="grid gap-4 md:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label for="m01-archivo-imagen" class="text-sm font-medium text-neutral-dark">Archivo (JPG, PNG o WEBP, máx. 5 MB)</label>
          <input
            id="m01-archivo-imagen"
            ref="inputArchivo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="block w-full text-sm text-neutral-dark file:mr-3 file:rounded-lg file:border-0 file:bg-subaction file:px-3 file:py-2 file:text-sm file:font-medium file:text-action hover:file:bg-subaction/80"
            @change="elegir"
          />
          <span v-if="errores.imagen" role="alert" class="text-sm text-danger">{{ errores.imagen }}</span>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <Select v-model="nueva.id_variante" label="Variante (opcional)">
            <option value="">Todo el producto</option>
            <option v-for="v in variantes" :key="v.id_variante" :value="v.id_variante">{{ etiquetaVariante(v) }}</option>
          </Select>
          <Select v-if="producto.clase_color !== 'sin_color'" v-model="nueva.id_color" label="Color (opcional)">
            <option value="">Ninguno</option>
            <option v-for="c in colores" :key="c.id_color" :value="c.id_color">{{ c.nombre }}</option>
          </Select>
        </div>
      </div>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Checkbox v-model="nueva.es_principal" label="Usar como imagen principal (la que aparece en listados)" />
        <Button type="submit" variant="conversion" size="sm" icon="plus" :disabled="subiendo || !nueva.imagen">
          {{ subiendo ? 'Subiendo…' : 'Subir imagen' }}
        </Button>
      </div>
    </form>

    <Alert v-if="error" variant="danger">{{ error }}</Alert>

    <p v-if="cargando" class="text-sm text-neutral-medium" role="status">Cargando imágenes…</p>
    <SinResultados
      v-else-if="!imagenes.length"
      icon="grid"
      title="Sin imágenes"
      description="Un producto necesita al menos una imagen para publicarse (RF-CAT-02-05)."
      compact
    />

    <ul v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <li
        v-for="(img, indice) in imagenes"
        :key="img.id_imagen"
        class="flex flex-col overflow-hidden rounded-card border bg-neutral-white"
        :class="img.es_principal ? 'border-action ring-2 ring-action/20' : 'border-neutral-light'"
      >
        <ImagenApi
          :clave="img.id_imagen"
          :cargar="() => CatalogoAdmin.imagenes.contenido(img)"
          :alt="`Imagen ${indice + 1} de ${producto.nombre}`"
          class="aspect-square rounded-none border-0"
        />
        <div class="space-y-2 p-3 text-xs">
          <div class="flex flex-wrap gap-1">
            <Badge v-if="img.es_principal" tone="info" label="Principal" />
            <Badge v-if="img.id_variante" tone="neutral" :label="etiquetaVarianteId(img.id_variante)" />
            <Badge v-if="img.id_color" tone="neutral" :label="colores.find((c) => c.id_color === img.id_color)?.nombre ?? 'Color'" />
          </div>
          <div class="flex items-center justify-between">
            <div class="flex">
              <IconButton icon="back" label="Mover antes" tone="neutral" class="p-1" :disabled="indice === 0 || ocupado" @click="mover(indice, -1)" />
              <IconButton icon="arrow" label="Mover después" tone="neutral" class="p-1" :disabled="indice === imagenes.length - 1 || ocupado" @click="mover(indice, 1)" />
            </div>
            <div class="flex">
              <IconButton v-if="!img.es_principal" icon="check" label="Marcar como principal" tone="action" class="p-1" :disabled="ocupado" @click="marcarPrincipal(img)" />
              <IconButton icon="close" label="Eliminar imagen" tone="danger" has-popup="dialog" class="p-1" :disabled="ocupado" @click="porEliminar = img" />
            </div>
          </div>
        </div>
      </li>
    </ul>

    <Modal :model-value="!!porEliminar" title="Eliminar imagen" max-width="sm" @update:model-value="porEliminar = null">
      <p class="text-sm text-neutral-dark">La imagen se eliminará del producto. Esta acción no se puede deshacer.</p>
      <div class="mt-5 flex justify-end gap-3">
        <Button variant="neutral" :disabled="ocupado" @click="porEliminar = null">Cancelar</Button>
        <Button variant="danger" :disabled="ocupado" @click="eliminar">Eliminar</Button>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef } from 'vue';
import { Alert, Badge, Button, Checkbox, IconButton, Modal, Select, SinResultados } from '@/core/components';
import ImagenApi from './ImagenApi.vue';
import { leerDataUrl } from '../../composables/useArchivos';
import { errorArchivoImagen, imagenFormSchema, validar } from '../../dtos/admin.dto';
import type { ErroresFormulario } from '../../dtos/admin.dto';
import { CatalogoAdmin } from '../../services/catalogo-admin.service';
import { mensajeError } from '../../services/http';
import { useTaxonomias } from '../../store/useTaxonomias';
import type { Color, Imagen, Producto, Variante } from '../../interfaces';

const props = defineProps<{ producto: Producto }>();
const emit = defineEmits<{ cambio: [] }>();

const taxonomias = useTaxonomias();
const lista = shallowRef<Imagen[]>([]);
const variantes = shallowRef<Variante[]>([]);
const colores = shallowRef<Color[]>([]);
const cargando = ref(false);
const subiendo = ref(false);
const ocupado = ref(false);
const error = ref<string | null>(null);
const errores = ref<ErroresFormulario>({});
const porEliminar = ref<Imagen | null>(null);
const inputArchivo = ref<HTMLInputElement | null>(null);

const nueva = reactive({ imagen: '', id_variante: '' as number | string, id_color: '' as number | string, es_principal: false });

const imagenes = computed(() => [...lista.value].sort((x, y) => x.orden - y.orden || x.id_imagen - y.id_imagen));

const etiquetaVariante = (v: Variante) => `${taxonomias.nombrePresentacion(v.id_presentacion)}${v.codigo_proveedor ? ` · ${v.codigo_proveedor}` : ''}`;
function etiquetaVarianteId(id: number): string {
  const v = variantes.value.find((x) => x.id_variante === id);
  return v ? etiquetaVariante(v) : 'Variante';
}

async function cargar(): Promise<void> {
  cargando.value = true;
  error.value = null;
  try {
    await taxonomias.asegurar();
    const { id_producto, id_marca, clase_color } = props.producto;
    const [imgs, vars, cols] = await Promise.all([
      CatalogoAdmin.productos.imagenes(id_producto),
      CatalogoAdmin.productos.variantes(id_producto),
      clase_color === 'sin_color' ? Promise.resolve([]) : CatalogoAdmin.colores.listarPorMarca(id_marca),
    ]);
    lista.value = imgs;
    variantes.value = vars;
    colores.value = cols;
  } catch (e) {
    error.value = mensajeError(e);
  } finally {
    cargando.value = false;
  }
}

async function elegir(evento: Event): Promise<void> {
  const archivo = (evento.target as HTMLInputElement).files?.[0];
  nueva.imagen = '';
  errores.value = {};
  if (!archivo) return;
  const problema = errorArchivoImagen(archivo);
  if (problema) {
    errores.value = { imagen: problema };
    return;
  }
  nueva.imagen = await leerDataUrl(archivo);
}

async function subir(): Promise<void> {
  const resultado = validar(imagenFormSchema, { ...nueva, orden: undefined });
  if (!resultado.ok) {
    errores.value = resultado.errores;
    return;
  }
  subiendo.value = true;
  error.value = null;
  try {
    const orden = imagenes.value.length ? Math.max(...imagenes.value.map((i) => i.orden)) + 1 : 0;
    await CatalogoAdmin.productos.subirImagen(props.producto.id_producto, { ...resultado.data, orden });
    Object.assign(nueva, { imagen: '', id_variante: '', id_color: '', es_principal: false });
    if (inputArchivo.value) inputArchivo.value.value = '';
    await cargar();
    emit('cambio');
  } catch (e) {
    error.value = mensajeError(e);
  } finally {
    subiendo.value = false;
  }
}

async function ejecutar(accion: () => Promise<unknown>): Promise<void> {
  ocupado.value = true;
  error.value = null;
  try {
    await accion();
    await cargar();
    emit('cambio');
  } catch (e) {
    error.value = mensajeError(e);
  } finally {
    ocupado.value = false;
  }
}

/** Intercambia el `orden` con la imagen vecina (RF-CAT-07-01: ordenar). */
function mover(indice: number, direccion: -1 | 1): Promise<void> {
  const actual = imagenes.value[indice];
  const vecina = imagenes.value[indice + direccion];
  // Si ambas comparten orden, se separan explícitamente para que el intercambio sea visible.
  const [ordenActual, ordenVecina] = actual.orden === vecina.orden
    ? [indice + direccion, indice]
    : [vecina.orden, actual.orden];
  return ejecutar(async () => {
    await CatalogoAdmin.imagenes.actualizar(actual.id_imagen, { orden: ordenActual });
    await CatalogoAdmin.imagenes.actualizar(vecina.id_imagen, { orden: ordenVecina });
  });
}

function marcarPrincipal(img: Imagen): Promise<void> {
  return ejecutar(() => CatalogoAdmin.imagenes.actualizar(img.id_imagen, { es_principal: true }));
}

async function eliminar(): Promise<void> {
  const img = porEliminar.value;
  if (!img) return;
  await ejecutar(() => CatalogoAdmin.imagenes.eliminar(img.id_imagen));
  porEliminar.value = null;
}

onMounted(cargar);
</script>
