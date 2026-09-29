import { Router } from 'express';
import { db } from '../../core/db/connection';
import { guardas, serviciosSeguridad } from '../m20-seguridad/seguridad.routes';

import { OrdenesRepository } from './repositories/ordenes.repository';
import { OrdenesService } from './services/ordenes.service';
import { OrdenesController } from './controllers/ordenes.controller';

// ==============================================================================
// M08 - ENRUTADOR PRINCIPAL: ORDEN DE VENTA
// Raíz de composición del módulo con inyección de dependencias (Principio D de SOLID).
// Montado en `app.routes.ts` como `/ordenes`.
// ==============================================================================

/**
 * Permiso «Revisar órdenes» de los CA de HU-ORD-05, que corresponde a `ventas.ver` en el
 * catálogo de M17. Quien tiene «Gestión de pedidos» (`ventas.gestionar`) recibe
 * `ventas.ver` por dependencia (RF-ADM-02-04), así que exigirlo solo rechaza a quien no
 * tiene ninguno de los dos (CA-ORD-05-03, CA-ORD-08-03).
 *
 * ⚠️ Correspondencia de nombres pendiente de confirmar con el líder técnico.
 */
export const PERMISO_VER_ORDENES = 'ventas.ver';

const ordenesRepo = new OrdenesRepository(db);
const ordenesService = new OrdenesService(ordenesRepo, serviciosSeguridad.registro);
const ordenesCtrl = new OrdenesController(ordenesService);

const ordenesRoutes = Router();

// Todo el módulo exige una sesión vigente revalidada en servidor (HU-SEG-03).
ordenesRoutes.use(guardas.sesionVigente());

// --- Cliente ------------------------------------------------------------------

// HU-ORD-07: sección de pedidos del cliente, en curso / finalizados, con buscador.
ordenesRoutes.get('/mis-pedidos', (req, res, next) => {
  void ordenesCtrl.listarMisPedidos(req, res).catch(next);
});

// HU-ORD-04 / HU-ORD-06: detalle de un pedido propio por su código visible.
ordenesRoutes.get('/mis-pedidos/:codigo', (req, res, next) => {
  void ordenesCtrl.detalleMiPedido(req, res).catch(next);
});

// --- Personal autorizado (ventas.ver) ------------------------------------------

// HU-ORD-05 / HU-ORD-08: bandeja y buscador con filtros por identificador, estado,
// periodo, cliente, correo y teléfono, y orden por antigüedad (CA-ORD-05-07, CA-ORD-08-02).
ordenesRoutes.get('/gestion', guardas.requierePermiso(PERMISO_VER_ORDENES), (req, res, next) => {
  void ordenesCtrl.listarOrdenesGestion(req, res).catch(next);
});

// HU-ORD-05 (CA-ORD-05-05): contadores por estado. Debe ir antes de `/gestion/:codigo`,
// o Express tomaría «resumen» como un código de orden.
ordenesRoutes.get('/gestion/resumen', guardas.requierePermiso(PERMISO_VER_ORDENES), (req, res, next) => {
  void ordenesCtrl.resumenGestion(req, res).catch(next);
});

// HU-ORD-11 (CA-ORD-11-01): compras anteriores del titular de la orden.
ordenesRoutes.get(
  '/gestion/:codigo/historial-cliente',
  guardas.requierePermiso(PERMISO_VER_ORDENES),
  (req, res, next) => {
    void ordenesCtrl.historialCliente(req, res).catch(next);
  }
);

// HU-ORD-08 / HU-ORD-09: detalle de una orden por su identificador, con el contacto del cliente.
ordenesRoutes.get('/gestion/:codigo', guardas.requierePermiso(PERMISO_VER_ORDENES), (req, res, next) => {
  void ordenesCtrl.detallePedidoGestion(req, res).catch(next);
});

export { ordenesRoutes };
