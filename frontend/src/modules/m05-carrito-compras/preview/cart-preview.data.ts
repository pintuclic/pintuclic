import pinturaImage from '../assets/pintura-acrilica.svg'
import taladroImage from '../assets/taladro-20v.svg'
import rodilloImage from '../assets/rodillo-profesional.svg'
import brochaImage from '../assets/brocha-premium.svg'
import cintaImage from '../assets/cinta-enmascarar.svg'
import type { CartItem, RecommendedProduct } from '../interfaces/cart.interface'

const pintura: RecommendedProduct = {
  id: 1,
  variantId: 1,
  name: 'Pintura Acrílica Premium Vinilex - 1 Galón',
  description: 'Pintura de alta cobertura, lavable y resistente para interiores y exteriores.',
  price: 89900,
  previousPrice: 104000,
  image: pinturaImage,
}

const taladro: RecommendedProduct = {
  id: 2,
  variantId: 2,
  name: 'Taladro Inalámbrico 20V',
  description: 'Potente, ligero y resistente. Ideal para todo tipo de trabajo.',
  price: 299900,
  image: taladroImage,
}

const rodillo: RecommendedProduct = {
  id: 3,
  variantId: 3,
  name: 'Rodillo Profesional de Felpa 9”',
  description: 'Ideal para superficies rugosas y semirugosas. Mayor retención y mejor acabado.',
  price: 24900,
  image: rodilloImage,
}

const brocha: RecommendedProduct = {
  id: 4,
  variantId: 4,
  name: 'Brocha Premium 3”',
  description: 'Brocha de cerdas naturales para mejores acabados.',
  price: 12900,
  image: brochaImage,
}

const cinta: RecommendedProduct = {
  id: 5,
  variantId: 5,
  name: 'Cinta de Enmascarar Multipropósito 1” x 50m',
  description: 'Agarre firme y fácil de usar. Ideal para proteger bordes y áreas delimitadas.',
  price: 8900,
  image: cintaImage,
}

export const RECOMMENDED_PRODUCTS_DEMO: RecommendedProduct[] = [pintura, taladro, rodillo, brocha, cinta]

export const CART_ITEMS_DEMO: CartItem[] = [
  { ...pintura, id: 101, variantId: 1, variant: 'Color: Azul Brillante', quantity: 2, subtotal: 179800, availableStock: 999, variantStatus: 'activo' },
  { ...rodillo, id: 102, variantId: 3, quantity: 1, subtotal: 24900, availableStock: 999, variantStatus: 'activo' },
  { ...cinta, id: 103, variantId: 5, quantity: 4, subtotal: 35600, availableStock: 999, variantStatus: 'activo' },
]

export function calculateDemoDiscount(items: readonly CartItem[]): number {
  return items.reduce((discount, item) => discount + (item.variantId === pintura.variantId ? item.quantity * 4644 : 0), 0)
}
