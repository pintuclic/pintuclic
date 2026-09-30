import pinturaImage from '../assets/pintura-acrilica.svg'
import taladroImage from '../assets/taladro-20v.svg'
import rodilloImage from '../assets/rodillo-profesional.svg'
import brochaImage from '../assets/brocha-premium.svg'
import cintaImage from '../assets/cinta-enmascarar.svg'
import type { CartProductFallback } from '../interfaces/cart.interface'

const PRODUCT_FALLBACKS: Record<number, CartProductFallback> = {
  1: {
    name: 'Pintura Acrílica Premium Vinilex - 1 Galón',
    description: 'Información de producto pendiente de Catálogo.',
    image: pinturaImage,
    variant: 'Variante de catálogo',
  },
  2: {
    name: 'Taladro Inalámbrico 20V',
    description: 'Información de producto pendiente de Catálogo.',
    image: taladroImage,
  },
  3: {
    name: 'Rodillo Profesional de Felpa 9”',
    description: 'Información de producto pendiente de Catálogo.',
    image: rodilloImage,
  },
  4: {
    name: 'Brocha Premium 3”',
    description: 'Información de producto pendiente de Catálogo.',
    image: brochaImage,
  },
  5: {
    name: 'Cinta de Enmascarar Multipropósito 1” x 50m',
    description: 'Información de producto pendiente de Catálogo.',
    image: cintaImage,
  },
}

const GENERIC_FALLBACK: CartProductFallback = {
  name: 'Producto de catálogo',
  description: 'Nombre, descripción e imagen pendientes de Catálogo.',
  image: pinturaImage,
}

export function getCartProductFallback(variantId: number): CartProductFallback {
  return PRODUCT_FALLBACKS[variantId] ?? GENERIC_FALLBACK
}
