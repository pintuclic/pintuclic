export type TokenVisitante = string
export type OrigenCarrito = 'visitante' | 'cliente'

export type TipoAlertaRevalidacion =
	| 'precio_modificado'
	| 'stock_insuficiente'
	| 'variante_no_disponible'

export interface ApiResponse<T> {
	success: boolean
	data: T
	message?: string
}

export interface CartApiLine {
	id_producto: number
	nombre_producto: string
	descripcion_producto: string | null
	presentacion: string
	color: string | null
	base: string | null
	imagen_url: string | null

	id_linea_carrito: number
	id_variante: number
	cantidad: number
	precio_unitario_vigente: string
	subtotal: string
	existencia_referencial: number
	estado_variante: string
}

export interface CartApi {
	id_carrito: number
	origen: OrigenCarrito
	token_visitante: string | null
	id_usuario: number | null
	fecha_ultima_actividad: string
	lineas: CartApiLine[]
	total: string
	total_lineas: number
}

export interface AddCartItemPayload {
	id_variante: number
	cantidad: number
}

export interface UpdateCartItemPayload {
	cantidad: number
}

export interface MergeCartPayload {
	token_visitante: TokenVisitante
}

export interface CartRevalidationAlert {
	id_linea_carrito: number
	id_variante: number
	tipo: TipoAlertaRevalidacion
	descripcion: string
	precio_anterior?: string | null
	precio_actual?: string | null
	cantidad_solicitada?: number
	existencia_disponible?: number
}

export interface CartRevalidationResult {
	valido: boolean
	alertas: CartRevalidationAlert[]
	carrito: CartApi
}

export interface CartMergeResult {
	carrito: CartApi
	lineas_acumuladas: number
	lineas_transferidas: number
}

export interface CartItem {
	id: number
	variantId: number
	name: string
	description?: string
	image: string
	variant?: string
	price: number
	subtotal: number
	quantity: number
	availableStock: number
	variantStatus: string
}

export interface RecommendedProduct {
	id: number
	name: string
	description?: string
	price: number
	previousPrice?: number
	image: string
	variantId?: number
}
