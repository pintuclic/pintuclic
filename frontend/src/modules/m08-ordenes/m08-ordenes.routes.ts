import type { RouteRecordRaw } from 'vue-router';

/**
 * ==============================================================================
 * M08 - RUTAS DE LA SECCIÓN DE PEDIDOS DEL CLIENTE
 * Ubicación: src/modules/m08-ordenes/m08-ordenes.routes.ts
 *
 * Cuelgan de LayoutHome (tienda pública), igual que `/perfil` de M04: la barra
 * lateral del perfil navega a `/pedidos`, así que ambas viven en el mismo layout.
 *
 * Las dos rutas usan LA MISMA vista: al abrir un pedido solo cambia el parámetro,
 * de modo que la lista no se desmonta y el detalle aparece a su derecha
 * (vista maestro-detalle). El nombre `DetallePedido` se conserva porque las
 * tarjetas y la sección del perfil ya enlazan con él.
 *
 * El identificador de la URL es el CÓDIGO VISIBLE (ORD-2026-0001), nunca el id
 * interno: el backend no acepta otra cosa (RF-ORD-06-01, ADR-04).
 * ==============================================================================
 */

export const ordenesRoutes: RouteRecordRaw[] = [
  {
    path: 'pedidos',
    name: 'MisPedidos',
    component: () => import('./views/VistaMisPedidos.vue'),
  },
  {
    path: 'pedidos/:codigo',
    name: 'DetallePedido',
    props: true,
    component: () => import('./views/VistaMisPedidos.vue'),
  },
];
