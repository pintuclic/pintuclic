import { apiClient } from '@/core/api/axios'
import type {
  AddCartItemPayload,
  ApiResponse,
  CartApi,
  CartMergeResult,
  CartRevalidationResult,
  MergeCartPayload,
  TokenVisitante,
  UpdateCartItemPayload,
} from '../interfaces/cart.interface'

const visitorConfig = (token: TokenVisitante) => ({
  headers: { 'x-visitor-token': token },
})

export const CartService = {
  async getVisitorCart(token: TokenVisitante): Promise<CartApi> {
    const { data } = await apiClient.get<ApiResponse<CartApi>>('/carrito/visitante', visitorConfig(token))
    return data.data
  },

  async getClientCart(): Promise<CartApi> {
    const { data } = await apiClient.get<ApiResponse<CartApi>>('/carrito/cliente')
    return data.data
  },

  async addVisitorItem(token: TokenVisitante, payload: AddCartItemPayload): Promise<CartApi> {
    const { data } = await apiClient.post<ApiResponse<CartApi>>('/carrito/visitante/items', payload, visitorConfig(token))
    return data.data
  },

  async addClientItem(payload: AddCartItemPayload): Promise<CartApi> {
    const { data } = await apiClient.post<ApiResponse<CartApi>>('/carrito/cliente/items', payload)
    return data.data
  },

  async updateVisitorItem(token: TokenVisitante, lineId: number, payload: UpdateCartItemPayload): Promise<CartApi> {
    const { data } = await apiClient.put<ApiResponse<CartApi>>(`/carrito/visitante/items/${lineId}`, payload, visitorConfig(token))
    return data.data
  },

  async updateClientItem(lineId: number, payload: UpdateCartItemPayload): Promise<CartApi> {
    const { data } = await apiClient.put<ApiResponse<CartApi>>(`/carrito/cliente/items/${lineId}`, payload)
    return data.data
  },

  async removeVisitorItem(token: TokenVisitante, lineId: number): Promise<CartApi> {
    const { data } = await apiClient.delete<ApiResponse<CartApi>>(`/carrito/visitante/items/${lineId}`, visitorConfig(token))
    return data.data
  },

  async removeClientItem(lineId: number): Promise<CartApi> {
    const { data } = await apiClient.delete<ApiResponse<CartApi>>(`/carrito/cliente/items/${lineId}`)
    return data.data
  },

  async mergeVisitorCart(payload: MergeCartPayload): Promise<CartMergeResult> {
    const { data } = await apiClient.post<ApiResponse<CartMergeResult>>('/carrito/cliente/fusionar', payload)
    return data.data
  },

  async revalidateClientCart(): Promise<CartRevalidationResult> {
    const { data } = await apiClient.get<ApiResponse<CartRevalidationResult>>('/carrito/cliente/revalidar')
    return data.data
  },
}
