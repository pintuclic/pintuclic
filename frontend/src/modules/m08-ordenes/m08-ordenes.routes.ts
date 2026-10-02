import type { RouteRecordRaw } from 'vue-router';

/**
 * ==============================================================================
 * M08 - RUTAS DEL CLIENTE
 * Ubicación: src/modules/m08-ordenes/m08-ordenes.routes.ts
 *
 * Solo las vistas del cliente, que cuelgan de LayoutHome. Las del personal viven
 * aparte, en `m08-ordenes-admin.routes.ts`, porque las dos partes del módulo se
 * entregan por separado.
 *
 * El identificador de la URL es siempre el CÓDIGO VISIBLE (PC-2026-00101), nunca
 * el id interno: el backend no acepta otra cosa (RF-ORD-06-01, ADR-04).
 * ==============================================================================
 */

/**
 * Vistas del cliente. Cuelgan de LayoutHome, igual que `/perfil` de M04: la barra
 * lateral del perfil navega a `/pedidos`, así que ambas viven en el mismo layout.
 *
 * Las dos usan LA MISMA vista: al abrir un pedido solo cambia el parámetro, de modo
 * que la lista no se desmonta y el seguimiento aparece a su derecha (maestro-detalle).
 * El nombre `DetallePedido` se conserva porque las tarjetas ya enlazan con él.
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
