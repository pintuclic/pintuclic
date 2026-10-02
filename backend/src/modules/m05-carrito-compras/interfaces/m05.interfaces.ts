// ==============================================================================
// M05 - CARRITO DE COMPRAS
// Contratos de tipos de dominio (TypeScript estricto, 0 bytes en runtime)
// Conforme a AGENTS.md y backend/infraestructura.md
// ==============================================================================

import type { Variante } from '../../../core/db/types';

/**
 * Identificador opaco del visitante anónimo.
 * Persiste en cookie o localStorage del dispositivo (ADR-01, RNF-CAR-01-01).
 * Nunca contiene datos personales identificables.
 */
export type TokenVisitante = string;

/**
 * Origen de la identidad del carrito: visitante anónimo o cliente autenticado.
 */
export type OrigenCarrito = 'visitante' | 'cliente';

/**
 * Línea de carrito enriquecida con datos de la variante para mostrarse al cliente.
 * El precio se lee DINÁMICAMENTE desde el catálogo (RF-CAR-05-04: carrito vivo).
 * El carrito no almacena precio histórico congelado.
 */
export interface LineaCarritoViva {
  id_linea_carrito: number;
  id_variante: number;
  cantidad: number;
  /** Precio vigente consultado en tiempo real a la tabla variante (RF-CAR-05-01). */
  precio_unitario_vigente: string;
  /** Subtotal calculado en el servidor: cantidad × precio vigente. */
  subtotal: string;
  /** Existencia referencial actual de la variante (RF-CAR-05-02). */
  existencia_referencial: number;
  /** Estado de la variante en el catálogo (activo/descontinuado). */
  estado_variante: string;
}

/**
 * Datos mínimos de una variante para decidir si puede entrar al carrito.
 * Solo una variante en estado 'activo' se vende.
 */
export type VarianteParaCarrito = Pick<Variante, 'id_variante' | 'estado'>;

/**
 * Vista completa del carrito retornada en las respuestas de la API.
 * Incluye las líneas vivas y el resumen calculado en servidor.
 */
export interface CarritoVivo {
  id_carrito: number;
  origen: OrigenCarrito;
  token_visitante: string | null;
  id_usuario: number | null;
  fecha_ultima_actividad: Date;
  lineas: LineaCarritoViva[];
  /** Total general del carrito calculado en servidor (suma de subtotales). */
  total: string;
  total_lineas: number;
}

/**
 * Resultado de la revalidación previa al checkout (HU-CAR-05).
 * Indica si el carrito está listo para proceder al pago o si hay conflictos.
 */
export interface ResultadoRevalidacion {
  /** True si todos los ítems están disponibles y los precios son los esperados. */
  valido: boolean;
  /** Listado de alertas por línea con variaciones de precio o stock insuficiente. */
  alertas: AlertaRevalidacion[];
  /** Carrito actualizado después de la revalidación. */
  carrito: CarritoVivo;
}

/**
 * Alerta individual emitida durante la revalidación de una línea del carrito (RF-CAR-05-05).
 */
export interface AlertaRevalidacion {
  id_linea_carrito: number;
  id_variante: number;
  tipo: TipoAlertaRevalidacion;
  descripcion: string;
  /** Precio anterior que tenía el cliente en pantalla (puede ser null si no aplica). */
  precio_anterior?: string | null;
  /** Precio actual vigente del catálogo. */
  precio_actual?: string | null;
  /** Cantidad solicitada por el cliente. */
  cantidad_solicitada?: number;
  /** Existencia real disponible en catálogo. */
  existencia_disponible?: number;
}

/**
 * Tipos de alertas posibles durante la revalidación del carrito (HU-CAR-05).
 */
export type TipoAlertaRevalidacion =
  | 'precio_modificado'         // RF-CAR-05-01: el precio vigente cambió
  | 'stock_insuficiente'        // RF-CAR-05-02: existencia < cantidad solicitada
  | 'variante_no_disponible';   // variante en estado distinto a 'activo'

/**
 * Resultado de la operación de fusión del carrito visitante con la cuenta del cliente (HU-CAR-04).
 */
export interface ResultadoFusion {
  /** Carrito resultante después de la fusión. */
  carrito: CarritoVivo;
  /** Número de líneas que se fusionaron/acumularon (ya existían en el carrito del cliente). */
  lineas_acumuladas: number;
  /** Número de líneas nuevas que se transfirieron desde el carrito visitante. */
  lineas_transferidas: number;
  /**
   * Líneas cuya suma superaba el tope por línea y quedaron en el máximo. OPCIONAL: solo
   * aparece cuando hubo algún ajuste, para no alterar la respuesta que ya consume el frontend.
   * Decisión provisional mientras se define RF-CAR-04-03.
   */
  avisos?: AvisoFusion[];
}

/**
 * Ajuste aplicado a una línea durante la fusión porque la suma superaba el tope por línea.
 */
export interface AvisoFusion {
  tipo: 'cantidad_ajustada_al_maximo';
  id_variante: number;
  /** Suma de la cantidad del cliente y la del visitante. */
  cantidad_solicitada: number;
  /** Cantidad que quedó en la línea (el tope). */
  cantidad_aplicada: number;
  descripcion: string;
}

/**
 * Línea que la fusión tuvo que limitar al tope (resultado interno del repositorio).
 */
export interface LineaAjustadaEnFusion {
  id_variante: number;
  cantidad_solicitada: number;
  cantidad_aplicada: number;
}

/**
 * Resultado interno de transferir las líneas de un carrito a otro.
 */
export interface ResultadoTransferencia {
  acumuladas: number;
  transferidas: number;
  ajustadas: LineaAjustadaEnFusion[];
}
