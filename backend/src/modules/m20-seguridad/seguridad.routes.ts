import { Router } from 'express';
import { db } from '../../core/db/connection';
import { sendError } from '../../core/utils/apiResponse';
import { SeguridadRepository } from './repositories/seguridad.repository';
import { SesionRepository } from './repositories/sesion.repository';
import { AutorizacionService } from './services/autorizacion.service';
import { CredencialesService } from './services/credenciales.service';
import { SesionService } from './services/sesion.service';
import { RegistroSeguridadService } from './services/registro-seguridad.service';
import { GuardasSeguridad } from './middlewares/autorizacion.middleware';
import { SeguridadController } from './controllers/seguridad.controller';
import { PrivacidadRepository } from './repositories/privacidad.repository';
import { PrivacidadService } from './services/privacidad.service';
import { PrivacidadController } from './controllers/privacidad.controller';

/**
 * Nombre del permiso que habilita ajustar los tiempos de vigencia de sesión.
 *
 * ⚠️ DEPENDENCIA EXTERNA: el catálogo `permisos` del DDL no trae semillas todavía.
 * M17 debe registrar este permiso para que la ruta sea utilizable en producción.
 */
export const PERMISO_CONFIGURAR_SESION = 'seguridad.configurar_sesion';

/**
 * Permiso que habilita resolver solicitudes de supresión de datos (HU-SEG-05).
 *
 * ⚠️ DEPENDENCIA EXTERNA: M17 debe registrarlo en el catálogo `permisos`.
 */
export const PERMISO_GESTIONAR_PRIVACIDAD = 'seguridad.gestionar_privacidad';

// -----------------------------------------------------------------------------
// Raíz de composición del módulo: inyección de dependencias (principio D de SOLID)
// -----------------------------------------------------------------------------
const repositorio = new SeguridadRepository(db);
const sesionRepositorio = new SesionRepository(db);
const registro = new RegistroSeguridadService();
const autorizacion = new AutorizacionService(repositorio);
const sesion = new SesionService(sesionRepositorio);
const credenciales = new CredencialesService(repositorio, sesion);
const privacidadRepositorio = new PrivacidadRepository(db);
const privacidad = new PrivacidadService(privacidadRepositorio, registro);

/**
 * Guardas centrales de autorización expuestos al resto de módulos (RNF-SEG-03-01).
 * Cualquier módulo que necesite proteger una ruta debe importar esta instancia
 * en lugar de escribir su propia comprobación.
 */
export const guardas = new GuardasSeguridad(autorizacion, sesion, registro);

/** Servicios de M20 reutilizables por otros módulos (p. ej. M04 en el login). */
export const serviciosSeguridad = { credenciales, sesion, autorizacion, registro, privacidad };

const controlador = new SeguridadController(credenciales, sesion, autorizacion);
const controladorPrivacidad = new PrivacidadController(privacidad);
const seguridadRoutes = Router();

// -----------------------------------------------------------------------------
// Rutas públicas (sin sesión previa)
// -----------------------------------------------------------------------------

/**
 * Apertura de sesión. Existe para poder ejercitar el módulo de extremo a extremo
 * mientras M04 construye su flujo de login; queda cerrada en producción.
 */
seguridadRoutes.post('/sesion', (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    sendError(res, 'Recurso no encontrado', 'NOT_FOUND', 404);
    return;
  }
  void controlador.abrirSesion(req, res).catch(next);
});

/**
 * Aviso de privacidad vigente. Deliberadamente PÚBLICO: el usuario debe poder leer el
 * texto antes de registrarse, porque no puede consentir lo que no ha visto
 * (RF-SEG-05-03, RF-SEG-05-04).
 */
seguridadRoutes.get('/privacidad/aviso', (req, res, next) => {
  void controladorPrivacidad.consultarAviso(req, res).catch(next);
});

// -----------------------------------------------------------------------------
// Rutas protegidas: exigen sesión vigente revalidada contra la base de datos
// -----------------------------------------------------------------------------
seguridadRoutes.use(guardas.sesionVigente());

seguridadRoutes.get('/sesion', controlador.consultarSesion);
seguridadRoutes.get('/sesiones', controlador.listarSesiones);
seguridadRoutes.delete('/sesion', controlador.cerrarSesion);
seguridadRoutes.delete('/sesiones', controlador.cerrarTodasLasSesiones);

seguridadRoutes.get('/politica-sesion', controlador.consultarPoliticaSesion);
seguridadRoutes.put(
  '/politica-sesion',
  guardas.requierePermiso(PERMISO_CONFIGURAR_SESION),
  controlador.actualizarPoliticaSesion
);

seguridadRoutes.put('/credenciales', controlador.cambiarContrasena);

// --- Protección de datos personales (HU-SEG-05) ---
seguridadRoutes.get('/privacidad/consentimiento', controladorPrivacidad.consultarConsentimiento);
seguridadRoutes.post('/privacidad/consentimiento', controladorPrivacidad.registrarConsentimiento);
seguridadRoutes.post('/privacidad/supresion', controladorPrivacidad.solicitarSupresion);
seguridadRoutes.get('/privacidad/supresion', controladorPrivacidad.listarMisSolicitudes);

// Cola administrativa: exige permiso explícito comprobado en servidor (HU-SEG-03).
seguridadRoutes.get(
  '/privacidad/supresion/pendientes',
  guardas.requierePermiso(PERMISO_GESTIONAR_PRIVACIDAD),
  controladorPrivacidad.listarSolicitudesPendientes
);
seguridadRoutes.put(
  '/privacidad/supresion/:id',
  guardas.requierePermiso(PERMISO_GESTIONAR_PRIVACIDAD),
  controladorPrivacidad.resolverSolicitud
);

export { seguridadRoutes };
