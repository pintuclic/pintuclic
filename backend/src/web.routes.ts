// src/app.routes.ts
import { Router } from 'express';
import { productoRoutes } from './modules/productos/productos.routes';

// Esto crea el enrutador global
const apiRouter = Router();

// Esto es exactamente el equivalente a path('users/', include('users.urls')) en Django
apiRouter.use('/api', productoRoutes);

export default apiRouter;