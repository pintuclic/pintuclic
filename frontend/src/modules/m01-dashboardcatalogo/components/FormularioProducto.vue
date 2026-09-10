<template>
  <div class="space-y-5">
    <!-- 1. Información general -->
    <TarjetaSeccionFormulario
      titulo="Información general"
      descripcion="Datos básicos del producto."
      :icono="Info"
    >
      <CampoFormulario etiqueta="Nombre del producto" requerido :error="erroresValidacion.nombre">
        <template #default="{ id, describedby }">
          <input
            :id="id"
            :value="formulario.nombre"
            :aria-describedby="describedby"
            type="text"
            :class="[claseInput, erroresValidacion.nombre && claseError]"
            placeholder="Ej. Viniltex Advanced Amarillo Profundo"
            @input="set({ nombre: ($event.target as HTMLInputElement).value })"
          />
        </template>
      </CampoFormulario>

      <CampoFormulario
        etiqueta="Descripción"
        requerido
        :error="erroresValidacion.descripcion"
        :contador="{ actual: formulario.descripcion.length, max: 1000 }"
      >
        <template #default="{ id, describedby }">
          <textarea
            :id="id"
            :value="formulario.descripcion"
            :aria-describedby="describedby"
            rows="4"
            :class="[claseInput, 'resize-y', erroresValidacion.descripcion && claseError]"
            placeholder="Describe el producto, sus usos y beneficios."
            @input="set({ descripcion: ($event.target as HTMLTextAreaElement).value })"
          />
        </template>
      </CampoFormulario>
    </TarjetaSeccionFormulario>

    <!-- 2. Clasificación -->
    <TarjetaSeccionFormulario
      titulo="Clasificación"
      descripcion="Categoriza tu producto."
      :icono="FolderTree"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <CampoFormulario etiqueta="Categoría" requerido :error="erroresValidacion.categoriaId">
          <template #default="{ id }">
            <select
              :id="id"
              :value="formulario.categoriaId ?? ''"
              :class="[claseInput, erroresValidacion.categoriaId && claseError]"
              @change="actualizar({ categoriaId: aTextoONull(($event.target as HTMLSelectElement).value) })"
            >
              <option value="">Selecciona…</option>
              <option v-for="op in opciones.categorias" :key="op.valor" :value="op.valor">
                {{ op.etiqueta }}
              </option>
            </select>
          </template>
        </CampoFormulario>

        <CampoFormulario etiqueta="Subcategoría" requerido :error="erroresValidacion.subcategoriaId">
          <template #default="{ id }">
            <select
              :id="id"
              :value="formulario.subcategoriaId ?? ''"
              :disabled="!formulario.categoriaId"
              :class="[claseInput, erroresValidacion.subcategoriaId && claseError]"
              @change="set({ subcategoriaId: aTextoONull(($event.target as HTMLSelectElement).value) })"
            >
              <option value="">{{ formulario.categoriaId ? 'Selecciona…' : 'Elige antes una categoría' }}</option>
              <option v-for="op in subcategoriasDisponibles" :key="op.valor" :value="op.valor">
                {{ op.etiqueta }}
              </option>
            </select>
          </template>
        </CampoFormulario>

        <CampoFormulario etiqueta="Tipo de producto" requerido :error="erroresValidacion.tipoProductoId">
          <template #default="{ id }">
            <select
              :id="id"
              :value="formulario.tipoProductoId ?? ''"
              :class="[claseInput, erroresValidacion.tipoProductoId && claseError]"
              @change="set({ tipoProductoId: aTextoONull(($event.target as HTMLSelectElement).value) })"
            >
              <option value="">Selecciona…</option>
              <option v-for="op in opciones.tiposProducto" :key="op.valor" :value="op.valor">
                {{ op.etiqueta }}
              </option>
            </select>
          </template>
        </CampoFormulario>

        <CampoFormulario etiqueta="Estado" requerido>
          <template #default="{ id }">
            <select
              :id="id"
              :value="formulario.estado"
              :class="claseInput"
              @change="set({ estado: ($event.target as HTMLSelectElement).value === 'publicado' ? 'publicado' : 'borrador' })"
            >
              <option value="borrador">Borrador</option>
              <option value="publicado">Publicado</option>
            </select>
          </template>
        </CampoFormulario>
      </div>

      <fieldset class="grid gap-2.5 pt-1 sm:grid-cols-2">
        <legend class="sr-only">Visibilidad del producto</legend>
        <label
          v-for="op in opcionesVisibilidad"
          :key="op.campo"
          class="flex items-start gap-2 text-sm text-neutral-dark"
        >
          <input
            type="checkbox"
            class="mt-0.5 accent-action"
            :checked="formulario[op.campo]"
            @change="setBool(op.campo, ($event.target as HTMLInputElement).checked)"
          />
          <span>
            {{ op.etiqueta }}
            <span class="block text-xs text-neutral-medium">{{ op.ayuda }}</span>
          </span>
        </label>
      </fieldset>
    </TarjetaSeccionFormulario>

    <!-- 3. Marca y línea -->
    <TarjetaSeccionFormulario
      titulo="Marca y línea"
      descripcion="Selecciona la marca y línea del producto."
      :icono="Bookmark"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <CampoFormulario etiqueta="Marca" requerido :error="erroresValidacion.marcaId">
          <template #default="{ id }">
            <select
              :id="id"
              :value="formulario.marcaId ?? ''"
              :class="[claseInput, erroresValidacion.marcaId && claseError]"
              @change="actualizar({ marcaId: aTextoONull(($event.target as HTMLSelectElement).value) })"
            >
              <option value="">Selecciona…</option>
              <option v-for="op in opciones.marcas" :key="op.valor" :value="op.valor">
                {{ op.etiqueta }}
              </option>
            </select>
          </template>
        </CampoFormulario>

        <CampoFormulario
          etiqueta="Línea"
          :requerido="requiereLinea"
          :error="erroresValidacion.lineaId"
          :ayuda="requiereLinea ? 'Obligatoria para pinturas (RF-CAT-02-02).' : 'Opcional en productos sin color.'"
        >
          <template #default="{ id }">
            <select
              :id="id"
              :value="formulario.lineaId ?? ''"
              :disabled="!formulario.marcaId"
              :class="[claseInput, erroresValidacion.lineaId && claseError]"
              @change="set({ lineaId: aTextoONull(($event.target as HTMLSelectElement).value) })"
            >
              <option value="">{{ formulario.marcaId ? 'Sin línea' : 'Elige antes una marca' }}</option>
              <option v-for="op in lineasDisponibles" :key="op.valor" :value="op.valor">
                {{ op.etiqueta }}
              </option>
            </select>
          </template>
        </CampoFormulario>
      </div>
    </TarjetaSeccionFormulario>

    <!-- 4. Clase de color -->
    <TarjetaSeccionFormulario
      titulo="Clase de color"
      descripcion="Define cómo maneja el color este producto."
      :icono="Palette"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <CampoFormulario etiqueta="Clase de color" requerido>
          <template #default="{ id }">
            <select
              :id="id"
              :value="formulario.claseColor"
              :class="claseInput"
              @change="actualizar({ claseColor: aClaseColor(($event.target as HTMLSelectElement).value) })"
            >
              <option value="sin_color">Sin color</option>
              <option value="entonable">Entonable</option>
              <option value="colores_fijos">Colores fijos</option>
            </select>
          </template>
        </CampoFormulario>

        <CampoFormulario
          v-if="usaColor"
          etiqueta="Color principal"
          requerido
          :error="erroresValidacion.colorPrincipalId"
        >
          <template #default="{ id }">
            <select
              :id="id"
              :value="formulario.colorPrincipalId ?? ''"
              :class="[claseInput, erroresValidacion.colorPrincipalId && claseError]"
              @change="definirColorPrincipal(aTextoONull(($event.target as HTMLSelectElement).value))"
            >
              <option value="">Selecciona…</option>
              <option v-for="c in coloresDeLaMarca" :key="c.id" :value="c.id">
                {{ c.nombre }}<template v-if="c.codigo"> ({{ c.codigo }})</template>
              </option>
            </select>
          </template>
        </CampoFormulario>

        <CampoFormulario v-if="usaColor" etiqueta="Código / Referencia">
          <template #default="{ id }">
            <input
              :id="id"
              :value="formulario.codigoColor"
              type="text"
              :class="claseInput"
              placeholder="Ej. AP-001"
              @input="set({ codigoColor: ($event.target as HTMLInputElement).value })"
            />
          </template>
        </CampoFormulario>
      </div>

      <div v-if="usaColor && coloresDeLaMarca.length" class="pt-1">
        <p class="mb-2 text-sm font-medium text-neutral-dark">Colores disponibles <span class="text-neutral-medium">(opcional)</span></p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="c in coloresDeLaMarca"
            :key="c.id"
            type="button"
            class="inline-flex items-center gap-2 rounded-button border px-2.5 py-1.5 text-xs font-medium transition-colors"
            :class="
              formulario.coloresDisponiblesIds.includes(c.id)
                ? 'border-action bg-subaction text-corporate'
                : 'border-neutral-light bg-neutral-white text-neutral-dark hover:bg-neutral-lightest'
            "
            :aria-pressed="formulario.coloresDisponiblesIds.includes(c.id)"
            @click="alternarColorDisponible(c.id)"
          >
            <!-- hex derivado del valor CIELAB del color: dato de catálogo, no token de UI -->
            <span
              class="h-3.5 w-3.5 rounded-full border border-neutral-light"
              :style="{ backgroundColor: c.hex }"
              aria-hidden="true"
            />
            {{ c.nombre }}
          </button>
        </div>
      </div>
    </TarjetaSeccionFormulario>

    <!-- 5. Atributos técnicos -->
    <TarjetaSeccionFormulario
      titulo="Atributos técnicos"
      descripcion="Especificaciones técnicas del producto (opcional)."
      :icono="SlidersHorizontal"
    >
      <div class="grid gap-4 sm:grid-cols-3">
        <CampoFormulario v-for="campo in camposAtributos" :key="campo.clave" :etiqueta="campo.etiqueta">
          <template #default="{ id }">
            <select
              :id="id"
              :value="formulario.atributos[campo.clave]"
              :class="claseInput"
              @change="setAtributo(campo.clave, ($event.target as HTMLSelectElement).value)"
            >
              <option value="">Sin definir</option>
              <option v-for="op in opciones.atributos[campo.opciones]" :key="op.valor" :value="op.valor">
                {{ op.etiqueta }}
              </option>
            </select>
          </template>
        </CampoFormulario>
      </div>
    </TarjetaSeccionFormulario>

    <!-- 6. Bases y entonado -->
    <TarjetaSeccionFormulario
      titulo="Bases y entonado"
      descripcion="Bases disponibles y sistema de entonado del producto."
      :icono="FlaskConical"
    >
      <fieldset>
        <legend class="mb-2 text-sm font-medium text-neutral-dark">Bases disponibles</legend>
        <div class="grid gap-2.5 sm:grid-cols-3">
          <label
            v-for="base in opciones.bases"
            :key="base.valor"
            class="flex items-start gap-2 rounded-input border border-neutral-light p-2.5 text-sm text-neutral-dark"
            :class="formulario.basesDisponibles.includes(base.valor) && 'border-action bg-subaction/40'"
          >
            <input
              type="checkbox"
              class="mt-0.5 accent-action"
              :checked="formulario.basesDisponibles.includes(base.valor)"
              @change="alternarBase(base.valor)"
            />
            <span>
              {{ base.etiqueta }}
              <span class="block text-xs text-neutral-medium">{{ base.descripcion }}</span>
            </span>
          </label>
        </div>
      </fieldset>

      <CampoFormulario etiqueta="Sistema de entonado">
        <template #default="{ id }">
          <select
            :id="id"
            :value="formulario.sistemaEntonado"
            :class="claseInput"
            @change="set({ sistemaEntonado: ($event.target as HTMLSelectElement).value })"
          >
            <option value="">Sin definir</option>
            <option v-for="op in opciones.sistemasEntonado" :key="op.valor" :value="op.valor">
              {{ op.etiqueta }}
            </option>
          </select>
        </template>
      </CampoFormulario>

      <p class="flex items-start gap-2 rounded-input bg-subaction/40 px-3 py-2 text-xs text-neutral-dark">
        <Info class="mt-0.5 h-3.5 w-3.5 shrink-0 text-action" aria-hidden="true" />
        Los productos entonables pueden generarse en más de 1.500 colores del sistema Pintu Clic.
      </p>
    </TarjetaSeccionFormulario>

    <!-- 7. Imágenes -->
    <TarjetaSeccionFormulario
      titulo="Imágenes del producto"
      descripcion="Sube fotos de alta calidad. La primera imagen será la principal."
      :icono="ImageIcon"
    >
      <GaleriaImagenesProducto
        :imagenes="formulario.imagenes"
        :error="erroresValidacion.imagenes"
        @agregar="agregarImagen(`imagen-${formulario.imagenes.length + 1}.jpg`)"
        @quitar="quitarImagen"
        @principal="marcarImagenPrincipal"
      />
    </TarjetaSeccionFormulario>

    <!-- 8. Información comercial -->
    <TarjetaSeccionFormulario
      titulo="Información comercial"
      descripcion="Define precios, inventario y opciones de venta."
      :icono="DollarSign"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <CampoFormulario etiqueta="Precio de venta" requerido :error="erroresValidacion.precioVenta">
          <template #default="{ id }">
            <input
              :id="id"
              :value="formulario.precioVenta ?? ''"
              type="number"
              min="0"
              :class="[claseInput, erroresValidacion.precioVenta && claseError]"
              placeholder="0"
              @input="set({ precioVenta: aNumero(($event.target as HTMLInputElement).value) })"
            />
          </template>
        </CampoFormulario>

        <CampoFormulario etiqueta="Precio de referencia" ayuda="Opcional. Precio tachado antes de descuento.">
          <template #default="{ id }">
            <input
              :id="id"
              :value="formulario.precioReferencia ?? ''"
              type="number"
              min="0"
              :class="claseInput"
              placeholder="0"
              @input="set({ precioReferencia: aNumero(($event.target as HTMLInputElement).value) })"
            />
          </template>
        </CampoFormulario>

        <CampoFormulario etiqueta="SKU o código" requerido :error="erroresValidacion.sku">
          <template #default="{ id }">
            <input
              :id="id"
              :value="formulario.sku"
              type="text"
              :class="[claseInput, erroresValidacion.sku && claseError]"
              placeholder="Ej. VIN-AP-001"
              @input="set({ sku: ($event.target as HTMLInputElement).value })"
            />
          </template>
        </CampoFormulario>

        <CampoFormulario etiqueta="Stock inicial" requerido :error="erroresValidacion.stockInicial">
          <template #default="{ id }">
            <input
              :id="id"
              :value="formulario.stockInicial ?? ''"
              type="number"
              min="0"
              step="1"
              :class="[claseInput, erroresValidacion.stockInicial && claseError]"
              placeholder="0"
              @input="set({ stockInicial: aNumero(($event.target as HTMLInputElement).value) })"
            />
          </template>
        </CampoFormulario>
      </div>

      <fieldset class="grid gap-2.5 pt-1 sm:grid-cols-2">
        <legend class="sr-only">Opciones de venta</legend>
        <label
          v-for="op in opcionesVenta"
          :key="op.campo"
          class="flex items-center gap-2 text-sm text-neutral-dark"
        >
          <input
            type="checkbox"
            class="accent-action"
            :checked="formulario[op.campo]"
            @change="setBool(op.campo, ($event.target as HTMLInputElement).checked)"
          />
          {{ op.etiqueta }}
        </label>
      </fieldset>
    </TarjetaSeccionFormulario>

    <!-- 9. Etiquetas -->
    <TarjetaSeccionFormulario
      titulo="Etiquetas"
      descripcion="Agrega palabras clave para mejorar la búsqueda (opcional)."
      :icono="TagIcon"
    >
      <EntradaEtiquetas
        :etiquetas="formulario.etiquetas"
        @agregar="agregarEtiqueta"
        @quitar="quitarEtiqueta"
      />
    </TarjetaSeccionFormulario>
  </div>
</template>

<script setup lang="ts">
import {
  Info,
  FolderTree,
  Bookmark,
  Palette,
  SlidersHorizontal,
  FlaskConical,
  Image as ImageIcon,
  DollarSign,
  Tag as TagIcon,
} from 'lucide-vue-next';
import TarjetaSeccionFormulario from './TarjetaSeccionFormulario.vue';
import CampoFormulario from './CampoFormulario.vue';
import GaleriaImagenesProducto from './GaleriaImagenesProducto.vue';
import EntradaEtiquetas from './EntradaEtiquetas.vue';
import { useProductoFormulario } from '../composables/useProductoFormulario';
import type {
  AtributosTecnicosProducto,
  ClaseColorProducto,
  FormularioProducto,
  OpcionesAtributosTecnicos,
} from '../interfaces';

const {
  formulario,
  opciones,
  erroresValidacion,
  subcategoriasDisponibles,
  lineasDisponibles,
  coloresDeLaMarca,
  requiereLinea,
  usaColor,
  actualizar,
  definirColorPrincipal,
  alternarColorDisponible,
  agregarEtiqueta,
  quitarEtiqueta,
  agregarImagen,
  quitarImagen,
  marcarImagenPrincipal,
} = useProductoFormulario();

const claseInput =
  'w-full rounded-input border border-neutral-light bg-neutral-white px-3 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30 disabled:bg-neutral-lightest disabled:text-neutral-medium';
const claseError = 'border-highlight ring-2 ring-highlight/30';

type CampoBooleano =
  | 'destacado'
  | 'mostrarEnOfertas'
  | 'permitirOpiniones'
  | 'requiereEnvioEspecial';

/** Clasificación (maqueta ADMIN 04): visibilidad del producto en la tienda. */
const opcionesVisibilidad: { campo: CampoBooleano; etiqueta: string; ayuda: string }[] = [
  { campo: 'destacado', etiqueta: 'Producto destacado', ayuda: 'Se muestra en secciones principales.' },
  { campo: 'mostrarEnOfertas', etiqueta: 'Mostrar en ofertas', ayuda: 'Aplica a campañas activas.' },
];

const opcionesVenta: { campo: CampoBooleano; etiqueta: string }[] = [
  { campo: 'permitirOpiniones', etiqueta: 'Permitir opiniones de clientes' },
  { campo: 'requiereEnvioEspecial', etiqueta: 'Requiere envío especial' },
];

/** Selectores de la sección "Atributos técnicos" (maqueta ADMIN 04). */
const camposAtributos: {
  clave: keyof AtributosTecnicosProducto;
  etiqueta: string;
  opciones: keyof OpcionesAtributosTecnicos;
}[] = [
  { clave: 'presentacionPrincipal', etiqueta: 'Presentación principal', opciones: 'presentaciones' },
  { clave: 'rendimiento', etiqueta: 'Rendimiento aproximado', opciones: 'rendimientos' },
  { clave: 'acabado', etiqueta: 'Acabado', opciones: 'acabados' },
  { clave: 'usoRecomendado', etiqueta: 'Uso recomendado', opciones: 'usos' },
  { clave: 'secadoAlTacto', etiqueta: 'Secado al tacto', opciones: 'secados' },
  { clave: 'tiempoRepintado', etiqueta: 'Tiempo de repintado', opciones: 'repintados' },
];

/** Aplica un cambio parcial al formulario (delega en la acción del store). */
function set(parcial: Partial<FormularioProducto>): void {
  actualizar(parcial);
}

function setBool(campo: CampoBooleano, valor: boolean): void {
  actualizar({ [campo]: valor } as Partial<FormularioProducto>);
}

function setAtributo(campo: keyof AtributosTecnicosProducto, valor: string): void {
  actualizar({ atributos: { ...formulario.value.atributos, [campo]: valor } });
}

function alternarBase(valor: string): void {
  const actuales = formulario.value.basesDisponibles;
  actualizar({
    basesDisponibles: actuales.includes(valor)
      ? actuales.filter((v) => v !== valor)
      : [...actuales, valor],
  });
}

function aNumero(valor: string): number | null {
  return valor.trim() === '' ? null : Number(valor);
}
function aTextoONull(valor: string): string | null {
  return valor === '' ? null : valor;
}
function aClaseColor(valor: string): ClaseColorProducto {
  return valor === 'entonable' || valor === 'colores_fijos' ? valor : 'sin_color';
}
</script>
