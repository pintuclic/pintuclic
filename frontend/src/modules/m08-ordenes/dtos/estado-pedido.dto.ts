import type { EstadoOrden } from '../interfaces/ordenes.interface';

/**
 * ==============================================================================
 * M08 - PRESENTACIÓN DE LOS ESTADOS DE LA ORDEN
 * Ubicación: src/modules/m08-ordenes/dtos/estado-pedido.dto.ts
 *
 * ⚠️ PUNTO ÚNICO DE CAMBIO. Los estados del diagrama oficial
 * (Maquina_de_estados_de_la_Orden.drawio.png) NO coinciden con los que admite la
 * base de datos: el diagrama exige doce y el enum solo tiene seis. Es el bloqueo
 * nº 1 del walkthrough v3.30.0. Cuando se alinee el esquema, este archivo es lo
 * único que hay que tocar.
 *
 * Los colores salen de la Guía de Identidad Visual §11 (uso semántico del color).
 * ==============================================================================
 */

export interface PresentacionEstado {
  readonly etiqueta: string;
  /** Clases Tailwind con tokens oficiales. Nada de hexadecimales sueltos. */
  readonly clases: string;
}

export const ESTADOS: Record<EstadoOrden, PresentacionEstado> = {
  // Gris: información secundaria, sin acción del usuario.
  pendiente: {
    etiqueta: 'Pendiente',
    clases: 'bg-neutral-lightest text-neutral-medium ring-1 ring-inset ring-neutral-light',
  },
  // Azul de acción: confirmado, el proceso avanza.
  pagado: {
    etiqueta: 'Pagado',
    clases: 'bg-subaction text-action',
  },
  // Amarillo: en curso, requiere espera.
  en_preparacion: {
    etiqueta: 'En preparación',
    clases: 'bg-highlight/20 text-corporate',
  },
  // Azul corporativo: hito estructural del pedido.
  enviado: {
    etiqueta: 'Enviado',
    clases: 'bg-subaction text-corporate',
  },
  // Verde: estado positivo, éxito.
  entregado: {
    etiqueta: 'Entregado',
    clases: 'bg-conversion/15 text-conversion-hover',
  },
  // Rojo: error o alerta.
  cancelado: {
    etiqueta: 'Cancelado',
    clases: 'bg-danger-subtle text-danger',
  },
};

/**
 * Descripción de cada etapa en la línea de tiempo, tomada del diseño
 * «Seguimiento de Pedido» del Figma.
 *
 * ⚠️ Son textos fijos de la interfaz, no datos: el backend no devuelve ninguna
 * descripción ni fecha por etapa.
 */
export const DESCRIPCION_ETAPA: Record<EstadoOrden, string> = {
  pendiente: 'Tu orden fue registrada y está a la espera de confirmación de pago.',
  pagado: 'Transacción aprobada mediante pasarela segura.',
  en_preparacion: 'Pinturas en proceso de envasado y embalaje en bodega.',
  enviado: 'Entregado a la transportadora aliada para su despacho.',
  entregado: 'Confirmación de recibido con firma en el destino.',
  cancelado: 'El pedido fue cancelado y no continuará su proceso.',
};

/** Orden de la línea de tiempo del pedido, para deducir los pasos recorridos. */
export const SECUENCIA_ESTADOS: readonly EstadoOrden[] = [
  'pendiente',
  'pagado',
  'en_preparacion',
  'enviado',
  'entregado',
];

/**
 * Filtros de la vista. El backend NO admite filtrar: devuelve todo y el filtrado
 * se resuelve en cliente sobre los dos grupos ya recibidos.
 */
export const FILTROS: ReadonlyArray<{ id: string; etiqueta: string; estados: EstadoOrden[] }> = [
  { id: 'todos', etiqueta: 'Todos', estados: [] },
  { id: 'proceso', etiqueta: 'En proceso', estados: ['pendiente', 'pagado', 'en_preparacion'] },
  { id: 'enviado', etiqueta: 'Enviado', estados: ['enviado'] },
  { id: 'entregado', etiqueta: 'Entregado', estados: ['entregado'] },
  { id: 'cancelado', etiqueta: 'Cancelado', estados: ['cancelado'] },
];

/** Formato de moneda colombiana, sin decimales (los precios del catálogo son enteros). */
export function formatearCOP(valor: string | number): string {
  const numero = typeof valor === 'string' ? Number(valor) : valor;
  if (!Number.isFinite(numero)) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numero);
}

/** `fecha` llega como AAAA-MM-DD sin hora; se construye en local para no correr el día. */
export function formatearFecha(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || !d) return iso;
  return new Date(a, m - 1, d).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
