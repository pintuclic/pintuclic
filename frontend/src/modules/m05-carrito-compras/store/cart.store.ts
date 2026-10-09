import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAuthStore } from '@/modules/m04-cuentas/store/auth.store'
import { CartService } from '../services/cart.service'
import { getVisitorToken } from '../services/visitor-token.service'
import type {
  CartApi,
  CartItem,
  CartMergeResult,
  CartProductFallback,
  CartRevalidationAlert,
  RecommendedProduct,
} from '../interfaces/cart.interface'

function toNumber(value: string): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response
    if (typeof response === 'object' && response !== null && 'data' in response) {
      const data = response.data
      if (typeof data === 'object' && data !== null && 'error' in data) {
        const apiError = data.error
        if (typeof apiError === 'object' && apiError !== null && 'message' in apiError && typeof apiError.message === 'string') {
          return apiError.message
        }
      }
    }
  }
  return 'No fue posible actualizar el carrito. Intenta nuevamente.'
}

function toVisualItem(line: CartApi['lineas'][number]): CartItem {
  return {
    id: line.id_linea_carrito,
    variantId: line.id_variante,
    name: line.nombre_producto,
    description: line.descripcion_producto ?? undefined,
    image: line.imagen_url ?? '',
    variant: [line.presentacion, line.color, line.base].filter(Boolean).join(' · '),
    price: toNumber(line.precio_unitario_vigente),
    subtotal: toNumber(line.subtotal),
    quantity: line.cantidad,
    availableStock: line.existencia_referencial,
    variantStatus: line.estado_variante,
  }
}

export const useCartStore = defineStore('cart', () => {
  const authStore = useAuthStore()
  const cartItems = ref<CartItem[]>([])
  const serverTotal = ref(0)
  const loading = ref(false)
  const error = ref('')
  const updatingLineIds = ref<number[]>([])
  const revalidationAlerts = ref<CartRevalidationAlert[]>([])
  const isDrawerOpen = ref(false)
  // Nombre e imagen reales enviados por la vista que agrega el producto (la API del carrito solo trae la variante)
  const knownProducts = ref<Record<number, CartProductFallback>>({})

  const isAuthenticated = computed(() => authStore.isAuthenticated)
  const totalItems = computed(() => cartItems.value.reduce((total, item) => total + item.quantity, 0))
  const subtotal = computed(() => serverTotal.value)
  const shipping = computed(() => 0)
  const discount = computed(() => 0)
  const total = computed(() => serverTotal.value)

  function setCart(cart: CartApi): void {
    cartItems.value = cart.lineas.map((line) => toVisualItem(line, knownProducts.value[line.id_variante]))
    serverTotal.value = toNumber(cart.total)
  }

  function setError(requestError: unknown): void {
    error.value = getErrorMessage(requestError)
  }

  function setLineLoading(lineId: number, isLoading: boolean): void {
    const currentIds = new Set(updatingLineIds.value)
    if (isLoading) currentIds.add(lineId)
    else currentIds.delete(lineId)
    updatingLineIds.value = [...currentIds]
  }

  function isLineUpdating(lineId: number): boolean {
    return updatingLineIds.value.includes(lineId)
  }

  async function loadCart(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      if (isAuthenticated.value) {
        const mergeResult = await CartService.mergeVisitorCart({ token_visitante: getVisitorToken() })
        setCart(mergeResult.carrito)
      } else {
        setCart(await CartService.getVisitorCart(getVisitorToken()))
      }
    } catch (requestError) {
      setError(requestError)
    } finally {
      loading.value = false
    }
  }

  async function addToCart(product: CartItem | RecommendedProduct, quantity = 1): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const payload = { id_variante: product.variantId ?? product.id, cantidad: quantity }
      if (product.name) {
        knownProducts.value[payload.id_variante] = {
          name: product.name,
          description: product.description ?? '',
          image: product.image,
          variant: 'variant' in product ? product.variant : undefined,
        }
      }
      const cart = isAuthenticated.value
        ? await CartService.addClientItem(payload)
        : await CartService.addVisitorItem(getVisitorToken(), payload)
      setCart(cart)
      isDrawerOpen.value = true
    } catch (requestError) {
      setError(requestError)
    } finally {
      loading.value = false
    }
  }

  async function updateQuantity(lineId: number, quantity: number): Promise<void> {
    const item = cartItems.value.find((cartItem) => cartItem.id === lineId)
    if (!item || quantity < 1 || quantity > item.availableStock || isLineUpdating(lineId)) return

    setLineLoading(lineId, true)
    error.value = ''
    try {
      const cart = isAuthenticated.value
        ? await CartService.updateClientItem(lineId, { cantidad: quantity })
        : await CartService.updateVisitorItem(getVisitorToken(), lineId, { cantidad: quantity })
      setCart(cart)
    } catch (requestError) {
      setError(requestError)
    } finally {
      setLineLoading(lineId, false)
    }
  }

  async function increaseQuantity(lineId: number): Promise<void> {
    const item = cartItems.value.find((cartItem) => cartItem.id === lineId)
    if (item) await updateQuantity(lineId, item.quantity + 1)
  }

  async function decreaseQuantity(lineId: number): Promise<void> {
    const item = cartItems.value.find((cartItem) => cartItem.id === lineId)
    if (!item || item.quantity <= 1) {
      error.value = 'La cantidad mínima es 1. Usa Eliminar para quitar esta línea.'
      return
    }
    await updateQuantity(lineId, item.quantity - 1)
  }

  async function removeFromCart(lineId: number): Promise<void> {
    if (isLineUpdating(lineId)) return
    setLineLoading(lineId, true)
    error.value = ''
    try {
      const cart = isAuthenticated.value
        ? await CartService.removeClientItem(lineId)
        : await CartService.removeVisitorItem(getVisitorToken(), lineId)
      setCart(cart)
    } catch (requestError) {
      setError(requestError)
    } finally {
      setLineLoading(lineId, false)
    }
  }

  async function clearCart(): Promise<void> {
    const lineIds = cartItems.value.map((item) => item.id)
    for (const lineId of lineIds) {
      await removeFromCart(lineId)
      if (error.value) return
    }
  }

  async function mergeVisitorCart(): Promise<CartMergeResult | null> {
    if (!isAuthenticated.value) return null
    loading.value = true
    error.value = ''
    try {
      const result = await CartService.mergeVisitorCart({ token_visitante: getVisitorToken() })
      setCart(result.carrito)
      return result
    } catch (requestError) {
      setError(requestError)
      return null
    } finally {
      loading.value = false
    }
  }

  async function revalidate(): Promise<boolean> {
    if (!isAuthenticated.value) return false
    loading.value = true
    error.value = ''
    revalidationAlerts.value = []
    try {
      const result = await CartService.revalidateClientCart()
      setCart(result.carrito)
      revalidationAlerts.value = result.alertas
      return result.valido
    } catch (requestError) {
      setError(requestError)
      return false
    } finally {
      loading.value = false
    }
  }

  function openDrawer(): void {
    isDrawerOpen.value = true
  }

  function closeDrawer(): void {
    isDrawerOpen.value = false
  }

  return {
    cartItems,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    totalItems,
    subtotal,
    shipping,
    discount,
    total,
    loading,
    error,
    updatingLineIds,
    revalidationAlerts,
    isAuthenticated,
    isLineUpdating,
    loadCart,
    addToCart,
    updateQuantity,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
    mergeVisitorCart,
    revalidate,
  }
})
