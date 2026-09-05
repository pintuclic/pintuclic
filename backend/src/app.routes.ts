import { Router } from 'express';
import { checkDbConnection } from './core/db/connection';
import { sendSuccess } from './core/utils/apiResponse';
import { productoRoutes } from './modules/productos/productos.routes';
import { seguridadRoutes } from './modules/m20-seguridad/seguridad.routes';
import { adminRoutes } from './modules/m17-permisos/m17.routes';

const appRouter = Router();

/**
 * Endpoint de verificaciÃ³n de salud de la API (Healthcheck).
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

// Ensamblaje de mÃ³dulos de negocio
appRouter.use('/productos', productoRoutes);
appRouter.use('/seguridad', seguridadRoutes);
appRouter.use('/admin', adminRoutes);

export default appRouter;

