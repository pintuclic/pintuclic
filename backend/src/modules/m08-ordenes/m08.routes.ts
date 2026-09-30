import { Router } from 'express';
import { db } from '../../core/db/connection';
import { guardas, serviciosSeguridad } from '../m20-seguridad/seguridad.routes';
import { servicioNotificaciones } from '../m18-notificaciones/notificaciones.routes';

import { OrdenesRepository } from './repositories/ordenes.repository';
import { OrdenesService } from './services/ordenes.service';
import { GestionOrdenesService } from './services/gestion-ordenes.service';
import { CreacionOrdenService } from './services/creacion-orden.service';
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

/**
 * Permiso «Gestión de pedidos» de los CA de HU-ORD-05, que corresponde a `ventas.gestionar`.
 * Lo exigen las operaciones que escriben: avanzar el estado (CA-ORD-05-01 / 05-02), dejar
 * notas internas y registrar contactos. Leer sigue exigiendo solo `ventas.ver`.
 *
 * ⚠️ Que notas y contactos pidan este permiso es una decisión de diseño pendiente de confirmar.
 */
export const PERMISO_GESTIONAR_ORDENES = 'ventas.gestionar';

const ordenesRepo = new OrdenesRepository(db);
const ordenesService = new OrdenesService(ordenesRepo, serviciosSeguridad.registro);
const gestionService = new GestionOrdenesService(ordenesRepo, servicioNotificaciones);
const ordenesCtrl = new OrdenesController(ordenesService, gestionService);

/**
 * Servicios de M08 para otros módulos. `creacion.crearDesdePagoConfirmado()` es el punto
 * por el que M07 convierte una solicitud con el pago confirmado en orden (HU-ORD-01). No
 * tiene ruta HTTP: quien confirma el pago (pasarela o «Verificación de pagos») es M07.
 */
export const serviciosOrdenes = {
  creacion: new CreacionOrdenService(ordenesRepo, servicioNotificaciones),
};

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

// HU-ORD-08 / HU-ORD-09 / HU-ORD-10: detalle de una orden por su identificador, con el
// contacto del cliente, el historial de estados, las notas internas y los contactos.
ordenesRoutes.get('/gestion/:codigo', guardas.requierePermiso(PERMISO_VER_ORDENES), (req, res, next) => {
  void ordenesCtrl.detallePedidoGestion(req, res).catch(next);
});

// --- Personal con «Gestión de pedidos» (ventas.gestionar) -------------------------

// HU-ORD-03 / CA-ORD-05-01: avanzar la orden por su ciclo de estados.
ordenesRoutes.patch('/gestion/:codigo/estado', guardas.requierePermiso(PERMISO_GESTIONAR_ORDENES), (req, res, next) => {
  void ordenesCtrl.cambiarEstado(req, res).catch(next);
});

// HU-ORD-10: añadir una nota interna.
ordenesRoutes.post('/gestion/:codigo/notas', guardas.requierePermiso(PERMISO_GESTIONAR_ORDENES), (req, res, next) => {
  void ordenesCtrl.crearNota(req, res).catch(next);
});

// CA-ORD-10-03: editar o borrar una nota se rechaza con un mensaje que explica qué hacer.
const RUTAS_NOTAS = ['/gestion/:codigo/notas', '/gestion/:codigo/notas/:nota'];
for (const metodo of ['put', 'patch', 'delete'] as const) {
  ordenesRoutes[metodo](RUTAS_NOTAS, guardas.requierePermiso(PERMISO_VER_ORDENES), ordenesCtrl.notaNoModificable);
}

// CA-ORD-09-03: registrar un contacto con el cliente iniciado desde la orden.
ordenesRoutes.post('/gestion/:codigo/contactos', guardas.requierePermiso(PERMISO_GESTIONAR_ORDENES), (req, res, next) => {
  void ordenesCtrl.registrarContacto(req, res).catch(next);
});

export { ordenesRoutes };
