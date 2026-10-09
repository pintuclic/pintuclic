import type { EstadoOrden, ModoEntrega } from '../interfaces/ordenes.interface';

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
  // Azul de acción: el pedido quedó confirmado y el proceso arranca.
  orden_confirmada: {
    etiqueta: 'Orden confirmada',
    clases: 'bg-subaction text-action',
  },
  // Amarillo: en curso, requiere espera mientras se verifica el stock.
  revision_disponibilidad: {
    etiqueta: 'En revisión',
    clases: 'bg-highlight/20 text-corporate',
  },
  // Amarillo: en curso, se está preparando.
  en_preparacion: {
    etiqueta: 'En preparación',
    clases: 'bg-highlight/20 text-corporate',
  },
  // Azul de acción: lista para salir.
  preparada: {
    etiqueta: 'Preparada',
    clases: 'bg-subaction text-action',
  },
  // Azul corporativo: hito logístico, va en camino.
  despachado: {
    etiqueta: 'Despachado',
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
  // Rojo: el pedido volvió.
  devuelto: {
    etiqueta: 'Devuelto',
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
  orden_confirmada: 'Tu orden fue recibida correctamente y el pago quedó confirmado.',
  revision_disponibilidad: 'Estamos verificando la disponibilidad física de tus productos.',
  en_preparacion: 'Pinturas en proceso de envasado y embalaje en bodega.',
  preparada: 'Tu pedido está listo y a la espera de ser despachado.',
  despachado: 'Entregado a la transportadora aliada para su envío.',
  entregado: 'Confirmación de recibido con firma en el destino.',
  cancelado: 'El pedido fue cancelado y no continuará su proceso.',
  devuelto: 'El pedido fue devuelto después de la entrega.',
};

/**
 * Etapas de la línea de tiempo, según el diagrama oficial
 * (docs/assets/diagrams/M08/Maquina_de_estados_de_la_Orden.drawio.png).
 *
 * ⚠️ Desde «Preparada» el flujo BIFURCA según el modo de entrega:
 *   · domicilio → Despachado → Entregado
 *   · recogida  → Entregado (sin pasar por Despachado)
 *
 * El backend aplica la misma regla (`EXCLUIDA_POR_MODO` en ciclo-estados.ts), así
 * que pintar siempre «Despachado» mostraría al cliente de recogida en tienda una
 * etapa por la que su pedido nunca va a pasar.
 */
const SECUENCIA_BASE: readonly EstadoOrden[] = [
  'orden_confirmada',
  'revision_disponibilidad',
  'en_preparacion',
  'preparada',
];

/**
 * Texto de la etapa ajustado al modo de entrega. En recogida en tienda no hay
 * despacho ni destino: el cliente pasa a recoger, así que las dos etapas finales
 * se redactan de otra forma.
 */
export function descripcionEtapa(estado: EstadoOrden, modo: ModoEntrega | null): string {
  if (modo === 'recogida') {
    if (estado === 'preparada') {
      return 'Tu pedido está listo y te espera en el punto de recogida.';
    }
    if (estado === 'entregado') {
      return 'Confirmación de entrega en el punto de recogida.';
    }
  }
  return DESCRIPCION_ETAPA[estado];
}

export function secuenciaSegunEntrega(modo: ModoEntrega | null): readonly EstadoOrden[] {
  // Sin modo (órdenes anteriores a la copia histórica) se muestra el camino completo.
  if (modo === 'recogida') return [...SECUENCIA_BASE, 'entregado'];
  return [...SECUENCIA_BASE, 'despachado', 'entregado'];
}

/** Camino completo. Solo para quien necesite recorrer todas las etapas posibles. */
export const SECUENCIA_ESTADOS: readonly EstadoOrden[] = secuenciaSegunEntrega('domicilio');

/**
 * Filtros de la vista. El backend NO admite filtrar: devuelve todo y el filtrado
 * se resuelve en cliente sobre los dos grupos ya recibidos.
 */
export const FILTROS: ReadonlyArray<{ id: string; etiqueta: string; estados: EstadoOrden[] }> = [
  { id: 'todos', etiqueta: 'Todos', estados: [] },
  {
    id: 'proceso',
    etiqueta: 'En proceso',
    estados: ['orden_confirmada', 'revision_disponibilidad', 'en_preparacion', 'preparada'],
  },
  { id: 'enviado', etiqueta: 'Enviado', estados: ['despachado'] },
  { id: 'entregado', etiqueta: 'Entregado', estados: ['entregado'] },
  { id: 'cancelado', etiqueta: 'Cancelado', estados: ['cancelado', 'devuelto'] },
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

/** Etiqueta de la forma de entrega elegida en el checkout (M10). */
export const MODO_ENTREGA: Record<ModoEntrega, string> = {
  domicilio: 'Envío a domicilio',
  recogida: 'Recogida en tienda',
};

/**
 * Momento de un hito del historial. A diferencia de `fecha` del pedido, aquí sí
 * llega la hora (ISO con zona), que es lo que pide la línea de tiempo del diseño.
 */
export function formatearFechaHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Fecha abreviada para tablas. «30 sept 2026» en lugar de «30 de septiembre de
 * 2026»: en la bandeja del personal conviven ocho columnas y la forma larga
 * desbordaba el ancho del panel.
 */
const MESES_CORTOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
] as const;

export function formatearFechaCorta(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || !d) return iso;
  // Se arma a mano porque `toLocaleDateString` en es-CO devuelve «30 de sept de
  // 2026», con dos preposiciones que en una tabla de ocho columnas sobran.
  return d + ' ' + MESES_CORTOS[m - 1] + ' ' + a;
}
