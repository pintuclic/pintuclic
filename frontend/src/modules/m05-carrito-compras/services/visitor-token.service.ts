import type { TokenVisitante } from '../interfaces/cart.interface'

const VISITOR_TOKEN_KEY = 'pintuclic_m05_visitor_token'

export function getVisitorToken(): TokenVisitante {
  const storedToken = localStorage.getItem(VISITOR_TOKEN_KEY)
  if (storedToken) return storedToken

  const token = crypto.randomUUID()
  localStorage.setItem(VISITOR_TOKEN_KEY, token)
  return token
}
