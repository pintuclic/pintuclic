import dotenv from 'dotenv';
import express from 'express';
import { corsMiddleware } from './core/middlewares/cors.middleware';
import { errorHandler } from './core/middlewares/errorHandler';
import { sendError } from './core/utils/apiResponse';
import appRouter from './app.routes';
import { checkDbConnection } from './core/db/connection';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middlewares globales de seguridad y parsing
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 2. Enrutador principal de la API
app.use('/api', appRouter);

// 3. Manejador de rutas no encontradas (404)
app.use((req, res) => {
  sendError(res, `Ruta no encontrada: ${req.method} ${req.originalUrl}`, 'NOT_FOUND', 404);
});

// 4. Middleware central de manejo de errores (debe ir al final)
app.use(errorHandler);

// 5. Inicialización del servidor HTTP
const server = app.listen(PORT, async () => {
  console.log('====================================================');
  console.log(`🚀 Servidor Pintuclic API iniciado en puerto ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}/api`);
  console.log(`🩺 Healthcheck: http://localhost:${PORT}/api/health`);
  console.log('====================================================');

  // Diagnóstico inicial de conexión a base de datos
  await checkDbConnection();
});

export default app;
export { server };
