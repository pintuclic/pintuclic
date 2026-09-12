import { Router } from 'express';
import { checkDbConnection } from './core/db/connection';
import { sendSuccess } from './core/utils/apiResponse';
import { seguridadRoutes } from './modules/m20-seguridad/seguridad.routes';
import { adminRoutes } from './modules/m17-permisos/m17.routes';
import { notificacionesRoutes } from './modules/m18-notificaciones/notificaciones.routes';
import { cuentasRoutes } from './modules/m04-cuentas/cuentas.routes';
import { catalogoRoutes } from './modules/m01-catalogo/m01.routes';
import { busquedaRoutes } from './modules/m02-busqueda/m02.routes';

const appRouter = Router();

/**
 * Endpoint de verificación de salud de la API (Healthcheck).
 */
appRouter.get('/health', async (_req, res) => {
  const isDbConnected = await checkDbConnection();
  return sendSuccess(res, {
    status: 'online',
    timestamp: new Date().toISOString(),
    database: isDbConnected ? 'connected' : 'disconnected (using fallback config)',
    uptime: process.uptime(),
  }, 'Pintuclic API operativa');
});

// Ensamblaje de módulos de negocio
appRouter.use('/seguridad', seguridadRoutes);
appRouter.use('/admin', adminRoutes);
appRouter.use('/notificaciones', notificacionesRoutes);
appRouter.use('/cuentas', cuentasRoutes);
appRouter.use('/catalogo', catalogoRoutes);
appRouter.use('/busqueda', busquedaRoutes);

export default appRouter;

