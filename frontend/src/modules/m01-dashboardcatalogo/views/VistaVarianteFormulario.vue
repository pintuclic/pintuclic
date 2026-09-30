<template>
  <div class="flex min-h-screen bg-neutral-lightest">
    <BarraLateralAdmin item-activo="variantes" @navegar="irA" />

    <div class="flex min-w-0 flex-1 flex-col">
      <BarraSuperiorAdmin
        v-model:termino-busqueda="busquedaGlobal"
        seccion="Variantes"
        nombre-usuario="Carlos Álvarez"
        rol-usuario="Administrador"
        :notificaciones="3"
      />

      <main class="flex-1 space-y-5 p-6 lg:p-8">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-action hover:underline"
          @click="irA('/admin/catalogo/variantes')"
        >
          <ArrowLeft class="h-4 w-4" aria-hidden="true" />
          Volver a variantes
        </button>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="text-2xl font-bold text-neutral-black">
              {{ esEdicion ? 'Editar variante' : 'Crear nueva variante' }}
            </h1>
            <p class="mt-1 text-sm text-neutral-medium">
              {{
                esEdicion
                  ? 'Actualiza la información de la variante. Los cambios se reflejarán en tu catálogo.'
                  : 'Completa la información de la variante. Se asociará a un producto existente de tu catálogo.'
              }}
            </p>
          </div>
          <span
            v-if="esEdicion"
            class="inline-flex shrink-0 items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
            :class="ESTADO_META[formulario.estado].clases"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            Variante {{ ESTADO_META[formulario.estado].etiqueta.toLowerCase() }}
          </span>
        </div>

        <p
          v-if="desactivado"
          class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
        >
          La variante quedó <strong>inactiva</strong> y ya no se muestra en el catálogo público.
        </p>
        <p
          v-else-if="guardadoOk"
          class="rounded-card border border-conversion/40 bg-conversion/10 px-4 py-3 text-sm text-neutral-dark"
        >
          Cambios guardados. La variante quedó como
          <strong>{{ ESTADO_META[formulario.estado].etiqueta.toLowerCase() }}</strong>.
        </p>
        <p
          v-else-if="error"
          class="rounded-card border border-neutral-light bg-neutral-white px-4 py-3 text-sm text-neutral-dark"
        >
          {{ error }}
        </p>

        <div v-if="cargando" class="grid gap-5 lg:grid-cols-3">
          <div class="space-y-4 lg:col-span-2">
            <div v-for="n in 4" :key="n" class="h-36 animate-pulse rounded-card bg-neutral-white" />
          </div>
          <div class="h-72 animate-pulse rounded-card bg-neutral-white" />
        </div>

        <div v-else class="grid gap-5 lg:grid-cols-3">
          <!-- Formulario -->
          <div class="space-y-5 lg:col-span-2">
            <TarjetaSeccionFormulario
              titulo="Producto asociado"
              descripcion="Selecciona el producto principal al que pertenecerá esta variante."
              :icono="Boxes"
            >
              <CampoFormulario etiqueta="Producto" requerido :error="erroresValidacion.productoId">
                <template #default="{ id }">
                  <select
                    :id="id"
                    :value="formulario.productoId ?? ''"
                    :class="[claseInput, erroresValidacion.productoId && claseError]"
                    @change="set({ productoId: aTextoONull(($event.target as HTMLSelectElement).value) })"
                  >
                    <option value="">Selecciona…</option>
                    <option v-for="op in opciones.productos" :key="op.valor" :value="op.valor">
                      {{ op.etiqueta }} · {{ op.sku }}
                    </option>
                  </select>
                </template>
              </CampoFormulario>
              <p v-if="productoAsociado" class="rounded-input bg-neutral-lightest px-3 py-2 text-xs text-neutral-medium">
                SKU del producto: <span class="text-neutral-dark">{{ productoAsociado.sku }}</span> ·
                Marca: <span class="text-neutral-dark">{{ productoAsociado.marca }}</span>
                <template v-if="productoAsociado.linea">
                  · Línea: <span class="text-neutral-dark">{{ productoAsociado.linea }}</span>
                </template>
              </p>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Presentación y unidad"
              descripcion="Define la presentación de esta variante."
              :icono="Ruler"
            >
              <div>
                <p class="mb-2 text-sm font-medium text-neutral-dark">
                  Presentación <span class="text-neutral-medium">*</span>
                </p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="op in opciones.presentaciones"
                    :key="op.valor"
                    type="button"
                    class="rounded-button border px-3 py-1.5 text-sm font-medium transition-colors"
                    :class="
                      formulario.presentacion === op.valor
                        ? 'border-action bg-subaction text-corporate'
                        : 'border-neutral-light bg-neutral-white text-neutral-dark hover:bg-neutral-lightest'
                    "
                    :aria-pressed="formulario.presentacion === op.valor"
                    @click="set({ presentacion: op.valor })"
                  >
                    {{ op.etiqueta }}
                  </button>
                </div>
                <p v-if="erroresValidacion.presentacion" class="mt-1.5 text-xs text-neutral-black">
                  {{ erroresValidacion.presentacion }}
                </p>
              </div>

              <CampoFormulario etiqueta="Unidad de medida" requerido :error="erroresValidacion.unidadMedida">
                <template #default="{ id }">
                  <select
                    :id="id"
                    :value="formulario.unidadMedida"
                    :class="[claseInput, erroresValidacion.unidadMedida && claseError]"
                    @change="set({ unidadMedida: ($event.target as HTMLSelectElement).value })"
                  >
                    <option value="">Selecciona…</option>
                    <option v-for="op in opciones.unidades" :key="op.valor" :value="op.valor">
                      {{ op.etiqueta }}
                    </option>
                  </select>
                </template>
              </CampoFormulario>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Base y color"
              descripcion="Base sobre la que se prepara y color que identifica la variante."
              :icono="Palette"
            >
              <div>
                <p class="mb-2 text-sm font-medium text-neutral-dark">Base / entonado</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="op in opciones.bases"
                    :key="op.valor"
                    type="button"
                    class="rounded-button border px-3 py-1.5 text-sm font-medium transition-colors"
                    :class="
                      formulario.base === op.valor
                        ? 'border-action bg-subaction text-corporate'
                        : 'border-neutral-light bg-neutral-white text-neutral-dark hover:bg-neutral-lightest'
                    "
                    :aria-pressed="formulario.base === op.valor"
                    @click="set({ base: formulario.base === op.valor ? '' : op.valor })"
                  >
                    {{ op.etiqueta }}
                  </button>
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <CampoFormulario etiqueta="Color asociado">
                  <template #default="{ id }">
                    <select
                      :id="id"
                      :value="formulario.colorId ?? ''"
                      :class="claseInput"
                      @change="definirColor(aTextoONull(($event.target as HTMLSelectElement).value))"
                    >
                      <option value="">Sin color</option>
                      <option v-for="c in opciones.colores" :key="c.id" :value="c.id">
                        {{ c.nombre }}<template v-if="c.codigo"> ({{ c.codigo }})</template>
                      </option>
                    </select>
                  </template>
                </CampoFormulario>
                <div
                  v-if="colorAsociado"
                  class="flex items-center gap-2 rounded-input border border-neutral-light px-3 py-2 text-xs text-neutral-medium"
                >
                  <!-- hex derivado del valor CIELAB del color: dato de catálogo, no token de UI -->
                  <span
                    class="h-4 w-4 rounded-full border border-neutral-light"
                    :style="{ backgroundColor: colorAsociado.hex }"
                    aria-hidden="true"
                  />
                  {{ colorAsociado.hex }} · {{ colorAsociado.familia }}
                </div>
              </div>
              <p v-if="erroresValidacion.base" class="text-xs text-neutral-black">
                {{ erroresValidacion.base }}
              </p>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Códigos e identificación"
              descripcion="Define los códigos de la variante."
              :icono="Barcode"
            >
              <div class="grid gap-4 sm:grid-cols-2">
                <CampoFormulario etiqueta="Código interno (SKU)" requerido :error="erroresValidacion.sku">
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="formulario.sku"
                      type="text"
                      :class="[claseInput, erroresValidacion.sku && claseError]"
                      placeholder="Ej. VIN-ADV-001-1G-AM"
                      @input="set({ sku: ($event.target as HTMLInputElement).value })"
                    />
                  </template>
                </CampoFormulario>
                <CampoFormulario etiqueta="Código de proveedor">
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="formulario.codigoProveedor"
                      type="text"
                      :class="claseInput"
                      placeholder="Ej. VIN-ADV-100"
                      @input="set({ codigoProveedor: ($event.target as HTMLInputElement).value })"
                    />
                  </template>
                </CampoFormulario>
                <CampoFormulario
                  etiqueta="Código de barras"
                  ayuda="Opcional pero recomendado para la gestión de inventario."
                >
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="formulario.codigoBarras"
                      type="text"
                      :class="claseInput"
                      placeholder="Ej. 7701234567890"
                      @input="set({ codigoBarras: ($event.target as HTMLInputElement).value })"
                    />
                  </template>
                </CampoFormulario>
              </div>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Información comercial"
              descripcion="Define los precios y costos de la variante."
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
                <CampoFormulario
                  v-if="esEdicion"
                  etiqueta="Precio de referencia"
                  ayuda="Opcional. Precio tachado antes de descuento."
                >
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
                <CampoFormulario etiqueta="Costo de compra">
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="formulario.costoCompra ?? ''"
                      type="number"
                      min="0"
                      :class="claseInput"
                      placeholder="0"
                      @input="set({ costoCompra: aNumero(($event.target as HTMLInputElement).value) })"
                    />
                  </template>
                </CampoFormulario>
                <CampoFormulario etiqueta="Impuesto (IVA)" requerido>
                  <template #default="{ id }">
                    <select
                      :id="id"
                      :value="String(formulario.impuestoIva)"
                      :class="claseInput"
                      @change="set({ impuestoIva: Number(($event.target as HTMLSelectElement).value) })"
                    >
                      <option v-for="op in opciones.impuestos" :key="op.valor" :value="op.valor">
                        {{ op.etiqueta }}
                      </option>
                    </select>
                  </template>
                </CampoFormulario>
                <CampoFormulario etiqueta="Margen estimado" ayuda="Se calcula con el costo de compra.">
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="margenEstimado !== null ? `${margenEstimado}%` : '—'"
                      type="text"
                      readonly
                      class="w-full rounded-input border border-neutral-light bg-neutral-lightest px-3 py-2 text-sm text-neutral-medium"
                    />
                  </template>
                </CampoFormulario>
              </div>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Inventario"
              :descripcion="esEdicion ? 'Gestiona la disponibilidad de esta variante.' : 'Configura el stock inicial y mínimo.'"
              :icono="Boxes"
            >
              <div class="grid gap-4 sm:grid-cols-3">
                <CampoFormulario
                  :etiqueta="esEdicion ? 'Stock actual' : 'Stock inicial'"
                  requerido
                  :error="erroresValidacion.stockInicial"
                >
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
                <CampoFormulario etiqueta="Stock mínimo" requerido :error="erroresValidacion.stockMinimo">
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="formulario.stockMinimo ?? ''"
                      type="number"
                      min="0"
                      step="1"
                      :class="[claseInput, erroresValidacion.stockMinimo && claseError]"
                      placeholder="0"
                      @input="set({ stockMinimo: aNumero(($event.target as HTMLInputElement).value) })"
                    />
                  </template>
                </CampoFormulario>
                <CampoFormulario etiqueta="Bodega principal" requerido :error="erroresValidacion.bodegaId">
                  <template #default="{ id }">
                    <select
                      :id="id"
                      :value="formulario.bodegaId ?? ''"
                      :class="[claseInput, erroresValidacion.bodegaId && claseError]"
                      @change="set({ bodegaId: aTextoONull(($event.target as HTMLSelectElement).value) })"
                    >
                      <option value="">Selecciona…</option>
                      <option v-for="op in opciones.bodegas" :key="op.valor" :value="op.valor">
                        {{ op.etiqueta }}
                      </option>
                    </select>
                  </template>
                </CampoFormulario>
              </div>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Dimensiones / peso"
              descripcion="Información logística (opcional)."
              :icono="Ruler"
            >
              <div class="grid gap-4 sm:grid-cols-4">
                <CampoFormulario v-for="dim in camposDimension" :key="dim.clave" :etiqueta="dim.etiqueta">
                  <template #default="{ id }">
                    <input
                      :id="id"
                      :value="formulario[dim.clave] ?? ''"
                      type="number"
                      min="0"
                      step="0.1"
                      :class="claseInput"
                      placeholder="0"
                      @input="setDimension(dim.clave, ($event.target as HTMLInputElement).value)"
                    />
                  </template>
                </CampoFormulario>
              </div>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Notas logísticas"
              descripcion="Información adicional para tu equipo (opcional)."
              :icono="FileText"
            >
              <CampoFormulario
                etiqueta="Notas"
                :contador="{ actual: formulario.notasLogisticas.length, max: 500 }"
              >
                <template #default="{ id }">
                  <textarea
                    :id="id"
                    :value="formulario.notasLogisticas"
                    rows="3"
                    :class="[claseInput, 'resize-y']"
                    placeholder="Manejo, almacenamiento, disponibilidad en tiendas…"
                    @input="set({ notasLogisticas: ($event.target as HTMLTextAreaElement).value })"
                  />
                </template>
              </CampoFormulario>
            </TarjetaSeccionFormulario>

            <TarjetaSeccionFormulario
              titulo="Imágenes de la variante"
              descripcion="Sube imágenes específicas de esta variante. La primera será la principal (opcional)."
              :icono="ImageIcon"
            >
              <GaleriaImagenesProducto
                :imagenes="formulario.imagenes"
                @agregar="agregarImagen(`variante-${formulario.imagenes.length + 1}.jpg`)"
                @quitar="quitarImagen"
                @principal="marcarImagenPrincipal"
              />
            </TarjetaSeccionFormulario>
          </div>

          <!-- Aside -->
          <aside class="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
              <header class="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-black">
                <Eye class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
                Vista previa de la variante
              </header>

              <div class="flex aspect-video items-center justify-center overflow-hidden rounded-card border border-neutral-light bg-neutral-lightest">
                <img
                  v-if="imagenPrincipal"
                  :src="imagenPrincipal"
                  :alt="tituloVariante"
                  class="h-full w-full object-contain p-3"
                />
                <ImageIcon v-else class="h-8 w-8 text-neutral-light" aria-hidden="true" />
              </div>

              <div class="mt-3 space-y-2">
                <p class="text-sm font-semibold text-neutral-black">{{ tituloVariante }}</p>
                <p class="text-lg font-bold text-corporate">
                  {{ formulario.precioVenta ? `$${formatearNumero(formulario.precioVenta)} COP` : 'Precio por definir' }}
                </p>
                <span
                  class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
                  :class="ESTADO_META[formulario.estado].clases"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  {{ ESTADO_META[formulario.estado].etiqueta }}
                </span>

                <dl class="space-y-1.5 border-t border-neutral-light pt-2 text-xs text-neutral-medium">
                  <div v-for="fila in filasPreview" :key="fila.etiqueta" class="flex justify-between gap-3">
                    <dt>{{ fila.etiqueta }}</dt>
                    <dd class="text-right text-neutral-dark">{{ fila.valor }}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <!-- Modo crear: checklist -->
            <ChecklistPublicacion
              v-if="!esEdicion"
              :checklist="checklist"
              :progreso="progresoChecklist"
            />

            <!-- Modo editar: inventario reciente + métricas -->
            <template v-else-if="detalleEdicion">
              <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
                <header class="mb-3 flex items-center justify-between">
                  <h2 class="text-base font-semibold text-neutral-black">
                    Últimos movimientos de inventario
                  </h2>
                  <button type="button" class="text-xs font-medium text-action hover:underline">
                    Ver todos →
                  </button>
                </header>
                <ul class="space-y-2.5 text-sm">
                  <li
                    v-for="mov in detalleEdicion.movimientos"
                    :key="mov.id"
                    class="flex items-center justify-between gap-3"
                  >
                    <span class="flex items-center gap-2">
                      <span
                        class="rounded-button px-1.5 py-0.5 text-[11px] font-medium"
                        :class="MOV_META[mov.tipo].clases"
                      >
                        {{ MOV_META[mov.tipo].etiqueta }}
                      </span>
                      <span class="text-xs text-neutral-medium">{{ formatearFechaHora(mov.fechaHora) }}</span>
                    </span>
                    <span class="tabular-nums font-medium text-neutral-dark">
                      {{ mov.cantidad > 0 ? `+${mov.cantidad}` : mov.cantidad }}
                    </span>
                  </li>
                </ul>
              </section>

              <div class="grid grid-cols-2 gap-4">
                <article class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm">
                  <p class="text-xs font-medium text-neutral-medium">Rotación</p>
                  <p class="mt-1 text-lg font-bold capitalize text-neutral-black">
                    {{ detalleEdicion.rotacion }}
                  </p>
                  <p class="mt-0.5 text-xs text-neutral-medium">
                    Se vende {{ detalleEdicion.rotacionComparativa }}% más que el promedio.
                  </p>
                </article>
                <article class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm">
                  <p class="text-xs font-medium text-neutral-medium">Disponibilidad</p>
                  <p class="mt-1 text-lg font-bold text-neutral-black tabular-nums">
                    {{ detalleEdicion.disponibilidadPorcentaje }}%
                  </p>
                  <p class="mt-0.5 text-xs text-neutral-medium">
                    {{ detalleEdicion.tiendasConStock }} de {{ detalleEdicion.tiendasTotales }} tiendas con stock.
                  </p>
                </article>
              </div>
            </template>
          </aside>
        </div>
      </main>

      <!-- Barra de acciones (pie fijo) -->
      <div
        class="sticky bottom-0 z-10 flex flex-wrap items-center justify-end gap-3 border-t border-neutral-light bg-neutral-white/95 px-6 py-3 backdrop-blur"
      >
        <p v-if="!esEdicion && !puedePublicar" class="mr-auto text-xs text-neutral-medium">
          Completa los campos obligatorios para habilitar la publicación.
        </p>

        <button
          type="button"
          class="rounded-button px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
          :disabled="guardando"
          @click="irA('/admin/catalogo/variantes')"
        >
          Cancelar
        </button>

        <template v-if="!esEdicion">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-button border border-neutral-light bg-neutral-white px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest disabled:opacity-50"
            :disabled="guardando"
            @click="guardarBorrador"
          >
            <Save class="h-4 w-4" aria-hidden="true" />
            Guardar borrador
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-button bg-conversion px-4 py-2 text-sm font-medium text-neutral-white hover:bg-conversion-hover disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="guardando || !puedePublicar"
            @click="publicar"
          >
            <Send class="h-4 w-4" aria-hidden="true" />
            Publicar variante
          </button>
        </template>

        <template v-else>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-button border border-neutral-light bg-neutral-white px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
            @click="irA('/admin/catalogo/variantes/nueva')"
          >
            <Copy class="h-4 w-4" aria-hidden="true" />
            Duplicar variante
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-button border border-neutral-light bg-neutral-white px-4 py-2 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest disabled:opacity-50"
            :disabled="guardando || formulario.estado === 'inactivo'"
            @click="confirmarDesactivar"
          >
            <Power class="h-4 w-4" aria-hidden="true" />
            Desactivar variante
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-button bg-action px-4 py-2 text-sm font-medium text-neutral-white hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="guardando"
            @click="guardarCambios"
          >
            <Save class="h-4 w-4" aria-hidden="true" />
            Guardar cambios
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - VISTA: VARIANTES · CREAR / EDITAR  (maquetas "ADMIN 07" y "ADMIN 08")
 * Ubicación: src/modules/m01-dashboardcatalogo/views/VistaVarianteFormulario.vue
 *
 * Alta y edición de variantes: producto asociado, presentación/unidad, base y
 * color, códigos, información comercial (con margen calculado), inventario,
 * dimensiones, notas e imágenes. En «crear» acompaña el checklist de
 * publicación; en «editar» muestra los últimos movimientos de inventario y las
 * métricas de rotación/disponibilidad, y permite desactivar.
 *
 * Permiso requerido: «Gestión de productos» (M17), revalidado en el servidor.
 * ==============================================================================
 */
import { computed, onMounted, ref } from 'vue';
import {
  ArrowLeft,
  Save,
  Send,
  Power,
  Copy,
  Eye,
  Boxes,
  Ruler,
  Palette,
  Barcode,
  DollarSign,
  FileText,
  Image as ImageIcon,
} from 'lucide-vue-next';
import BarraLateralAdmin from '../components/BarraLateralAdmin.vue';
import BarraSuperiorAdmin from '../components/BarraSuperiorAdmin.vue';
import TarjetaSeccionFormulario from '../components/TarjetaSeccionFormulario.vue';
import CampoFormulario from '../components/CampoFormulario.vue';
import GaleriaImagenesProducto from '../components/GaleriaImagenesProducto.vue';
import ChecklistPublicacion from '../components/ChecklistPublicacion.vue';
import { useVarianteFormulario } from '../composables/useVarianteFormulario';
import { usePanelNavegacion } from '../composables/usePanelNavegacion';
import type { EstadoVarianteForm, FormularioVariante, MovimientoInventario } from '../interfaces';

const props = defineProps<{
  /** Id de la variante a editar (lo inyecta el router con `props: true`). Vacío = crear. */
  varianteId?: string;
}>();

const {
  formulario,
  opciones,
  modo,
  detalleEdicion,
  cargando,
  guardando,
  error,
  erroresValidacion,
  guardadoOk,
  desactivado,
  productoAsociado,
  colorAsociado,
  margenEstimado,
  checklist,
  progresoChecklist,
  puedePublicar,
  inicializar,
  actualizar,
  definirColor,
  agregarImagen,
  quitarImagen,
  marcarImagenPrincipal,
  guardarBorrador,
  publicar,
  guardarCambios,
  desactivar,
  formatearNumero,
  formatearFechaHora,
} = useVarianteFormulario();

onMounted(() => {
  void inicializar(props.varianteId);
});

const busquedaGlobal = ref('');
const esEdicion = computed(() => modo.value === 'editar');

const claseInput =
  'w-full rounded-input border border-neutral-light bg-neutral-white px-3 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30 disabled:bg-neutral-lightest disabled:text-neutral-medium';
const claseError = 'border-highlight ring-2 ring-highlight/30';

const ESTADO_META: Record<EstadoVarianteForm, { etiqueta: string; clases: string }> = {
  activo: { etiqueta: 'Activa', clases: 'bg-conversion/10 text-conversion' },
  borrador: { etiqueta: 'Borrador', clases: 'bg-action/10 text-action' },
  inactivo: { etiqueta: 'Inactiva', clases: 'bg-neutral-light text-neutral-medium' },
};

const MOV_META: Record<MovimientoInventario['tipo'], { etiqueta: string; clases: string }> = {
  entrada: { etiqueta: 'Entrada', clases: 'bg-conversion/10 text-conversion' },
  salida: { etiqueta: 'Salida', clases: 'bg-highlight/15 text-neutral-dark' },
  ajuste: { etiqueta: 'Ajuste', clases: 'bg-action/10 text-action' },
};

const camposDimension: { clave: 'pesoKg' | 'altoCm' | 'anchoCm' | 'profundidadCm'; etiqueta: string }[] = [
  { clave: 'pesoKg', etiqueta: 'Peso (kg)' },
  { clave: 'altoCm', etiqueta: 'Alto (cm)' },
  { clave: 'anchoCm', etiqueta: 'Ancho (cm)' },
  { clave: 'profundidadCm', etiqueta: 'Profundidad (cm)' },
];

const imagenPrincipal = computed(() => {
  const imgs = formulario.value.imagenes;
  return (imgs.find((i) => i.esPrincipal) ?? imgs[0])?.url || '';
});

const etiquetaPresentacion = computed(
  () => opciones.value.presentaciones.find((p) => p.valor === formulario.value.presentacion)?.etiqueta ?? '—'
);
const etiquetaBase = computed(
  () => opciones.value.bases.find((b) => b.valor === formulario.value.base)?.etiqueta ?? 'N/A'
);
const etiquetaBodega = computed(
  () => opciones.value.bodegas.find((b) => b.valor === formulario.value.bodegaId)?.etiqueta ?? '—'
);

const tituloVariante = computed(() => {
  const producto = productoAsociado.value?.etiqueta ?? 'Nueva variante';
  const partes = [etiquetaPresentacion.value, colorAsociado.value?.nombre].filter(Boolean);
  return partes.length ? `${producto} · ${partes.join(' · ')}` : producto;
});

const filasPreview = computed(() => [
  { etiqueta: 'Presentación', valor: etiquetaPresentacion.value },
  { etiqueta: 'Base', valor: etiquetaBase.value },
  { etiqueta: 'Color', valor: colorAsociado.value?.nombre ?? 'N/A' },
  { etiqueta: 'Bodega', valor: etiquetaBodega.value },
  { etiqueta: 'SKU', valor: formulario.value.sku || '—' },
  {
    etiqueta: 'Stock',
    valor: formulario.value.stockInicial !== null ? `${formulario.value.stockInicial} uds.` : '—',
  },
]);

function set(parcial: Partial<FormularioVariante>): void {
  actualizar(parcial);
}
function setDimension(
  clave: 'pesoKg' | 'altoCm' | 'anchoCm' | 'profundidadCm',
  valor: string
): void {
  actualizar({ [clave]: aNumero(valor) } as Partial<FormularioVariante>);
}
function aNumero(valor: string): number | null {
  return valor.trim() === '' ? null : Number(valor);
}
function aTextoONull(valor: string): string | null {
  return valor === '' ? null : valor;
}

function confirmarDesactivar(): void {
  const ok = globalThis.confirm?.(
    '¿Desactivar esta variante? Dejará de mostrarse en el catálogo público.'
  );
  if (ok) void desactivar();
}

// Navegación del panel: la provee el router (o el shell `VistaPanelCatalogo`).
const { irA } = usePanelNavegacion();
</script>
