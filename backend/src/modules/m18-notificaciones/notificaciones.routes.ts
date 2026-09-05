import { Router } from 'express';
import { guardas } from '../m20-seguridad/seguridad.routes';

import { PlantillaRepository } from './repositories/plantilla.repository';
import { EnvioRepository } from './repositories/envio.repository';

import { SmtpService } from './services/smtp.service';
import { PlantillaService } from './services/plantilla.service';
import { NotificacionesService } from './services/notificaciones.service';

import { PlantillaController } from './controllers/plantilla.controller';
import { NotificacionesController } from './controllers/notificaciones.controller';

// ==============================================================================
// M18 - ENRUTADOR PRINCIPAL: NOTIFICACIONES Y COMUNICACIONES TRANSACCIONALES
// Raíz de composición del módulo con inyección de dependencias (SOLID - Principio D)
// ==============================================================================

// -----------------------------------------------------------------------------
// Inyección de Dependencias
// -----------------------------------------------------------------------------
const plantillaRepo = new PlantillaRepository();
const envioRepo = new EnvioRepository();

const smtpService = new SmtpService();
const plantillaService = new PlantillaService(plantillaRepo);
export const servicioNotificaciones = new NotificacionesService(
  plantillaRepo,
  envioRepo,
  smtpService,
  plantillaService
);

const plantillaCtrl = new PlantillaController(plantillaService);
const notificacionesCtrl = new NotificacionesController(servicioNotificaciones);

const notificacionesRoutes = Router();

// -----------------------------------------------------------------------------
// HU-NOT-01 & HU-NOT-02: Emisión y Disparo de Notificaciones
// -----------------------------------------------------------------------------

/**
 * POST /api/notificaciones/disparar
 * Endpoint para emisión/testing de eventos de notificación.
 */
notificacionesRoutes.post('/disparar', (req, res, next) => {
  void notificacionesCtrl.dispararEvento(req, res).catch(next);
});

/**
 * GET /api/notificaciones/conexion-smtp
 * Comprobación de conectividad del transporte de correo.
 */
notificacionesRoutes.get('/conexion-smtp', (req, res, next) => {
  void notificacionesCtrl.probarConexionSmtp(req, res).catch(next);
});

// -----------------------------------------------------------------------------
// HU-NOT-03: Plantillas de Comunicación Administrables
// Rutas administrativas protegidas con guardas de M20 (RNF-SEG-03-01)
// -----------------------------------------------------------------------------

/**
 * GET /api/notificaciones/plantillas
 * Listado de todas las plantillas disponibles.
 */
notificacionesRoutes.get(
  '/plantillas',
  guardas.sesionVigente(),
  (req, res, next) => {
    void plantillaCtrl.listarPlantillas(req, res).catch(next);
  }
);

/**
 * GET /api/notificaciones/plantillas/:codigo
 * Detalle y campos variables de una plantilla específica.
 */
notificacionesRoutes.get(
  '/plantillas/:codigo',
  guardas.sesionVigente(),
  (req, res, next) => {
    void plantillaCtrl.obtenerPlantilla(req, res).catch(next);
  }
);

/**
 * PUT /api/notificaciones/plantillas/:codigo
 * Actualización del contenido de una plantilla con regla de variables obligatorias (CA-NOT-03-03).
 */
notificacionesRoutes.put(
  '/plantillas/:codigo',
  guardas.sesionVigente(),
  guardas.requierePermiso('configuracion.editar'),
  (req, res, next) => {
    void plantillaCtrl.actualizarPlantilla(req, res).catch(next);
  }
);

/**
 * POST /api/notificaciones/plantillas/:codigo/preview
 * Previsualización en vivo con datos de ejemplo (CA-NOT-03-02).
 */
notificacionesRoutes.post(
  '/plantillas/:codigo/preview',
  guardas.sesionVigente(),
  (req, res, next) => {
    void plantillaCtrl.generarVistaPrevia(req, res).catch(next);
  }
);

// -----------------------------------------------------------------------------
// HU-NOT-01 & HU-NOT-04: Bitácora de Envíos, Diagnósticos y Estadísticas
// -----------------------------------------------------------------------------

/**
 * GET /api/notificaciones/bitacora
 * Consulta de historial de despachos con filtros y paginación (HU-SEG-06).
 */
notificacionesRoutes.get(
  '/bitacora',
  guardas.sesionVigente(),
  guardas.requierePermiso('configuracion.ver'),
  (req, res, next) => {
    void notificacionesCtrl.consultarBitacora(req, res).catch(next);
  }
);

/**
 * GET /api/notificaciones/bitacora/:id
 * Detalle de un despacho concreto.
 */
notificacionesRoutes.get(
  '/bitacora/:id',
  guardas.sesionVigente(),
  guardas.requierePermiso('configuracion.ver'),
  (req, res, next) => {
    void notificacionesCtrl.obtenerDetalleEnvio(req, res).catch(next);
  }
);

/**
 * GET /api/notificaciones/estadisticas
 * Métricas agregadas de volumen y tasa de entregabilidad (HU-NOT-04).
 */
notificacionesRoutes.get(
  '/estadisticas',
  guardas.sesionVigente(),
  guardas.requierePermiso('configuracion.ver'),
  (req, res, next) => {
    void notificacionesCtrl.obtenerEstadisticas(req, res).catch(next);
  }
);

export { notificacionesRoutes };
