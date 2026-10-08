import cors, { CorsOptions } from 'cors';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:80,http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Permitir solicitudes sin origin (como herramientas internas, cURL o apps móviles)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`Acceso bloqueado por política CORS: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // X-Visitor-Token: token opaco del carrito de visitante de M05 (ADR-01, RNF-CAR-01-01).
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Visitor-Token'],
  credentials: true,
  maxAge: 86400, // 24 horas de cache preflight
};

export const corsMiddleware = cors(corsOptions);
