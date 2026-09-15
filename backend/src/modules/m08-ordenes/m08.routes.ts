import { Router } from 'express';
import { db } from '../../core/db/connection';
import { guardas, serviciosSeguridad } from '../m20-seguridad/seguridad.routes';

import { OrdenesRepository } from './repositories/ordenes.repository';
import { OrdenesService } from './services/ordenes.service';
import { OrdenesController } from './controllers/ordenes.controller';

// ==============================================================================
// M08 - ENRUTADOR PRINCIPAL: ORDEN DE VENTA
// Raíz de composición del módulo con inyección de dependencias (Principio D de SOLID).
//
// ⚠️ PENDIENTE DE APROBACIÓN: montar este router en `backend/src/app.routes.ts`
// como `/ordenes` (archivo compartido, fuera del alcance del módulo).
// ==============================================================================

/**
 * Permiso «Revisar órdenes» de los CA de HU-ORD-05, que corresponde a `ventas.ver` en el
 * catálogo de M17. Quien tiene «Gestión de pedidos» (`ventas.gestionar`) recibe
 * `ventas.ver` por dependencia (RF-ADM-02-04), así que exigirlo solo rechaza a quien no
 * tiene ninguno de los dos (CA-ORD-05-03).
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

// HU-ORD-07: sección de pedidos del cliente, en curso / finalizados, con buscador.
ordenesRoutes.get('/mis-pedidos', (req, res, next) => {
  void ordenesCtrl.listarMisPedidos(req, res).catch(next);
});

// HU-ORD-04 / HU-ORD-06: detalle de un pedido propio por su código visible.
ordenesRoutes.get('/mis-pedidos/:codigo', (req, res, next) => {
  void ordenesCtrl.detalleMiPedido(req, res).catch(next);
});

// HU-ORD-05 (consulta): el personal localiza una orden por su identificador (CA-ORD-05-04).
ordenesRoutes.get('/gestion/:codigo', guardas.requierePermiso(PERMISO_VER_ORDENES), (req, res, next) => {
  void ordenesCtrl.detallePedidoGestion(req, res).catch(next);
});

export { ordenesRoutes };
