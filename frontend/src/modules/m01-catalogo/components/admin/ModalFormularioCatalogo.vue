<template>
  <Modal :model-value="modelValue" :title="titulo" max-width="lg" @update:model-value="cerrar">
    <form class="space-y-4 font-sans" novalidate @submit.prevent="enviar">
      <template v-for="campo in campos" :key="campo.clave">
        <Select
          v-if="campo.tipo === 'select'"
          v-model="texto[campo.clave]"
          :label="campo.etiqueta"
          :disabled="campo.deshabilitado || guardando"
          :error="errores[campo.clave]"
        >
          <option value="">Selecciona…</option>
          <option v-for="op in campo.opciones" :key="op.valor" :value="op.valor">{{ op.etiqueta }}</option>
        </Select>

        <Textarea
          v-else-if="campo.tipo === 'textarea'"
          :model-value="String(texto[campo.clave] ?? '')"
          @update:model-value="texto[campo.clave] = $event"
          :label="campo.etiqueta"
          :placeholder="campo.placeholder"
          :disabled="campo.deshabilitado || guardando"
          :error="errores[campo.clave]"
          rows="3"
        />

        <!-- Imagen: se valida formato/peso antes de leerla como data URL. -->
        <div v-else-if="campo.tipo === 'imagen'" class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-neutral-dark">{{ campo.etiqueta }}</span>
          <div class="flex items-center gap-4">
            <div class="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-neutral-light bg-neutral-lightest">
              <img v-if="vistaPrevia(campo.clave)" :src="vistaPrevia(campo.clave)" alt="" class="h-full w-full object-contain" />
              <span v-else class="text-xs text-neutral-medium">Sin imagen</span>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              :disabled="guardando"
              class="block w-full text-sm text-neutral-dark file:mr-3 file:rounded-lg file:border-0 file:bg-subaction file:px-3 file:py-2 file:text-sm file:font-medium file:text-action hover:file:bg-subaction/80"
              @change="elegirImagen(campo.clave, $event)"
            />
          </div>
          <span v-if="campo.ayuda" class="text-xs text-neutral-medium">{{ campo.ayuda }}</span>
          <span v-if="errores[campo.clave]" role="alert" class="text-sm text-danger">{{ errores[campo.clave] }}</span>
        </div>

        <!-- CIELAB (RF-CAT-05-02): dato obligatorio; la muestra se deriva de él. -->
        <fieldset v-else-if="campo.tipo === 'cielab'" class="space-y-2">
          <legend class="text-sm font-medium text-neutral-dark">{{ campo.etiqueta }}</legend>
          <div class="grid grid-cols-[auto_1fr_1fr_1fr] items-start gap-3">
            <label class="flex flex-col items-center gap-1 text-xs text-neutral-medium">
              <input
                type="color"
                :value="muestraHex ?? '#FFFFFF'"
                aria-label="Tomar el valor desde un selector de color"
                class="h-11 w-11 cursor-pointer rounded-lg border border-neutral-light bg-neutral-white p-1"
                :disabled="guardando"
                @input="desdeSelector(($event.target as HTMLInputElement).value)"
              />
              Selector
            </label>
            <Input v-model="texto.l" type="number" label="L*" step="0.01" :disabled="guardando" :error="errores.l" />
            <Input v-model="texto.a" type="number" label="a*" step="0.01" :disabled="guardando" :error="errores.a" />
            <Input v-model="texto.b" type="number" label="b*" step="0.01" :disabled="guardando" :error="errores.b" />
          </div>
          <span class="text-xs text-neutral-medium">{{ campo.ayuda ?? 'L* de 0 a 100; a* y b* de −128 a 128.' }}</span>
        </fieldset>

        <Input
          v-else
          v-model="texto[campo.clave]"
          :type="campo.tipo === 'numero' ? 'number' : 'text'"
          :label="campo.etiqueta"
          :placeholder="campo.placeholder"
          :disabled="campo.deshabilitado || guardando"
          :error="errores[campo.clave]"
        />
      </template>

      <Alert v-if="errorServidor" variant="danger">{{ errorServidor }}</Alert>

      <div class="flex justify-end gap-3 pt-2">
        <Button variant="neutral" :disabled="guardando" @click="cerrar">Cancelar</Button>
        <Button type="submit" :variant="modo === 'crear' ? 'conversion' : 'action'" :disabled="guardando">
          {{ guardando ? 'Guardando…' : modo === 'crear' ? 'Crear' : 'Guardar cambios' }}
        </Button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { ZodTypeAny } from 'zod';
import { Alert, Button, Input, Modal, Select, Textarea } from '@/core/components';
import { cielabDesdeHex, errorArchivoImagen, validar } from '../../dtos/admin.dto';
import type { ErroresFormulario, ModoFormulario } from '../../dtos/admin.dto';
import { cielabAHex } from '../../composables/useColorCielab';
import { leerDataUrl } from '../../composables/useArchivos';
import { mensajeError } from '../../services/http';
import type { CampoFormulario, ValoresFormulario } from '../../interfaces';

/**
 * M01 - Formulario genérico de alta/edición para los recursos simples del
 * catálogo. Cada vista declara sus campos y su esquema (dtos/admin.dto.ts) y
 * entrega la llamada `guardar` al servicio; este componente solo captura,
 * valida y muestra el error que devuelva el backend (duplicados, marca
 * inactiva, etc., ramas "Rechazar…" de los diagramas).
 */
const props = defineProps<{
  modelValue: boolean;
  titulo: string;
  modo: ModoFormulario;
  campos: CampoFormulario[];
  esquema: ZodTypeAny;
  valoresIniciales?: ValoresFormulario;
  /** Vista previa de una imagen ya guardada (p. ej. el logotipo actual al editar). */
  imagenesActuales?: Record<string, string | null>;
  guardar: (payload: object) => Promise<unknown>;
}>();

const emit = defineEmits<{ 'update:modelValue': [valor: boolean]; guardado: [] }>();

const texto = reactive<Record<string, string | number>>({});
const errores = ref<ErroresFormulario>({});
const errorServidor = ref<string | null>(null);
const guardando = ref(false);

watch(
  () => props.modelValue,
  (abierto) => {
    if (!abierto) return;
    for (const clave of Object.keys(texto)) delete texto[clave];
    for (const campo of props.campos) {
      const claves = campo.tipo === 'cielab' ? ['l', 'a', 'b'] : [campo.clave];
      for (const clave of claves) {
        const inicial = props.valoresIniciales?.[clave];
        texto[clave] = typeof inicial === 'number' || typeof inicial === 'string' ? inicial : '';
      }
    }
    errores.value = {};
    errorServidor.value = null;
  },
  { immediate: true },
);

const muestraHex = computed(() => {
  const [l, a, b] = [texto.l, texto.a, texto.b].map((v) => (v === '' || v === undefined ? NaN : Number(v)));
  return [l, a, b].every(Number.isFinite) ? cielabAHex({ l, a, b }) : null;
});

function desdeSelector(hex: string): void {
  const lab = cielabDesdeHex(hex);
  if (!lab) return;
  texto.l = lab.l;
  texto.a = lab.a;
  texto.b = lab.b;
}

function vistaPrevia(clave: string): string | undefined {
  const nueva = texto[clave];
  if (typeof nueva === 'string' && nueva.startsWith('data:')) return nueva;
  return props.imagenesActuales?.[clave] ?? undefined;
}

async function elegirImagen(clave: string, evento: Event): Promise<void> {
  const archivo = (evento.target as HTMLInputElement).files?.[0];
  if (!archivo) return;
  const problema = errorArchivoImagen(archivo);
  errores.value = { ...errores.value, [clave]: problema ?? '' };
  if (problema) return;
  texto[clave] = await leerDataUrl(archivo);
}

function cerrar(): void {
  if (!guardando.value) emit('update:modelValue', false);
}

async function enviar(): Promise<void> {
  errorServidor.value = null;
  const resultado = validar(props.esquema, { ...props.valoresIniciales, ...texto });
  if (!resultado.ok) {
    errores.value = resultado.errores;
    return;
  }
  errores.value = {};
  guardando.value = true;
  try {
    await props.guardar(resultado.data as object);
    emit('update:modelValue', false);
    emit('guardado');
  } catch (e) {
    errorServidor.value = mensajeError(e);
  } finally {
    guardando.value = false;
  }
}
</script>
