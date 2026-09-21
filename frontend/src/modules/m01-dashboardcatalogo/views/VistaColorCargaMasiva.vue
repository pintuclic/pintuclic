<template>
  <div class="space-y-6 p-6 lg:p-8">
    <Button variant="text" :icon="ArrowLeft" @click="irA('/admin/catalogo/colores')">
      Volver a colores
    </Button>

    <PageHeader
      title="Carga masiva de colores"
      description="Sube un CSV con varios colores a la vez (RF-CAT-05-03). Cada fila se valida con las mismas reglas que crear un color individual."
    >
      <template #default>
        <Button variant="outline" :icon="Download" @click="descargarPlantilla">
          Descargar plantilla
        </Button>
      </template>
    </PageHeader>

    <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
      <label class="text-sm font-medium text-neutral-dark">Archivo CSV</label>
      <p class="mt-1 text-xs text-neutral-medium">
        Columnas esperadas: <code class="rounded bg-neutral-lightest px-1 py-0.5">{{ encabezados.join(', ') }}</code>.
        Solo <code class="rounded bg-neutral-lightest px-1 py-0.5">nombre</code>, <code class="rounded bg-neutral-lightest px-1 py-0.5">familiaClave</code> y
        <code class="rounded bg-neutral-lightest px-1 py-0.5">hex</code> son obligatorias.
      </p>
      <input
        ref="inputArchivo"
        type="file"
        accept=".csv,text/csv"
        class="mt-3 block w-full text-sm text-neutral-dark file:mr-3 file:rounded-button file:border-0 file:bg-subaction file:px-4 file:py-2 file:text-sm file:font-medium file:text-corporate hover:file:bg-subaction/80"
        @change="onArchivoSeleccionado"
      />
      <p v-if="nombreArchivo" class="mt-2 text-xs text-neutral-medium">
        {{ nombreArchivo }} · {{ filas.length }} fila(s) leídas
      </p>
    </section>

    <section v-if="filas.length" class="rounded-card border border-neutral-light bg-neutral-white shadow-sm">
      <header class="flex flex-col gap-1 border-b border-neutral-light p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-sm font-semibold text-neutral-black">Vista previa</p>
          <p class="text-xs text-neutral-medium">
            {{ filasValidas.length }} válida(s) · {{ filasInvalidas.length }} con error
          </p>
        </div>
        <Button
          variant="conversion"
          :icon="Upload"
          :disabled="!filasValidas.length || cargando"
          @click="confirmarCarga"
        >
          {{ cargando ? 'Cargando…' : `Confirmar carga (${filasValidas.length})` }}
        </Button>
      </header>

      <Table :columns="columnas" :rows="filasComoRows" row-key="numeroFila" mobile-cards>
        <template #cell-muestra="{ row }">
          <span
            class="block h-6 w-8 rounded-input border border-neutral-light"
            :style="{ backgroundColor: (row as unknown as FilaCargaMasivaValidada).datos.hex }"
            aria-hidden="true"
          />
        </template>
        <template #cell-nombre="{ row }">{{ (row as unknown as FilaCargaMasivaValidada).datos.nombre }}</template>
        <template #cell-marca="{ row }">{{ (row as unknown as FilaCargaMasivaValidada).datos.marca || '—' }}</template>
        <template #cell-familiaClave="{ row }">{{ (row as unknown as FilaCargaMasivaValidada).datos.familiaClave }}</template>
        <template #cell-hex="{ row }">{{ (row as unknown as FilaCargaMasivaValidada).datos.hex }}</template>
        <template #cell-estado="{ row }">
          <Badge
            v-if="(row as unknown as FilaCargaMasivaValidada).valido"
            estado="success"
            label="Válida"
            table
          />
          <span v-else class="text-xs text-neutral-black">
            {{ Object.values((row as unknown as FilaCargaMasivaValidada).errores)[0] }}
          </span>
        </template>
      </Table>
    </section>

    <p
      v-if="resultado"
      class="rounded-card border border-conversion/40 bg-conversion/10 px-4 py-3 text-sm text-neutral-dark"
    >
      Se crearon {{ resultado.creados }} colores como borrador. Revísalos y publícalos desde el listado.
    </p>
    <p
      v-else-if="error"
      class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
    >
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ArrowLeft, Download, Upload } from 'lucide-vue-next';
import { Button, Table, Badge, PageHeader } from '@/core/components';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import { parsearCsv } from '../composables/useCsvSimple';
import {
  ENCABEZADOS_CARGA_MASIVA_COLORES,
  validarFilasCargaMasivaColores,
  type FilaCargaMasivaValidada,
  type FilaCargaMasivaColorDTO,
} from '../dtos/colores-carga-masiva.dto';
import { ColoresService } from '../services/colores.service';
import { cargarColoresMasivoDemo } from '../services/colores.mock';
import type { ResultadoCargaMasivaColores } from '../interfaces';

const { irA } = usePanelNavegacion();

const encabezados = ENCABEZADOS_CARGA_MASIVA_COLORES;
const inputArchivo = ref<HTMLInputElement | null>(null);
const nombreArchivo = ref('');
const filas = ref<FilaCargaMasivaValidada[]>([]);
const cargando = ref(false);
const resultado = ref<ResultadoCargaMasivaColores | null>(null);
const error = ref<string | null>(null);

const filasValidas = computed(() => filas.value.filter((f) => f.valido));
const filasInvalidas = computed(() => filas.value.filter((f) => !f.valido));
const filasComoRows = computed(() => filas.value as unknown as Record<string, unknown>[]);

const columnas = [
  { key: 'muestra', label: 'Muestra' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'marca', label: 'Marca' },
  { key: 'familiaClave', label: 'Familia' },
  { key: 'hex', label: 'HEX' },
  { key: 'estado', label: 'Estado' },
];

async function onArchivoSeleccionado(evento: Event): Promise<void> {
  const archivo = (evento.target as HTMLInputElement).files?.[0];
  resultado.value = null;
  error.value = null;
  if (!archivo) return;

  nombreArchivo.value = archivo.name;
  const contenido = await archivo.text();
  const filasCrudas = parsearCsv(contenido);
  filas.value = validarFilasCargaMasivaColores(filasCrudas);
}

function descargarPlantilla(): void {
  const contenido = `${encabezados.join(',')}\nAmarillo Canario,AC-001,Viniltex Advanced,amarillos,#FFD700\n`;
  const blob = new globalThis.Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const url = globalThis.URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = 'plantilla-carga-masiva-colores.csv';
  enlace.click();
  globalThis.URL.revokeObjectURL(url);
}

async function confirmarCarga(): Promise<void> {
  if (!filasValidas.value.length) return;
  cargando.value = true;
  error.value = null;
  const payload = filasValidas.value.map((f) => f.datos as unknown as FilaCargaMasivaColorDTO);

  try {
    const respuesta = await ColoresService.cargarMasivo(payload);
    resultado.value = respuesta.data;
  } catch {
    // Sin backend: simulamos la creación en la semilla local, como el resto del módulo.
    resultado.value = cargarColoresMasivoDemo(payload);
  } finally {
    cargando.value = false;
    filas.value = [];
    nombreArchivo.value = '';
    if (inputArchivo.value) inputArchivo.value.value = '';
  }
}
</script>
