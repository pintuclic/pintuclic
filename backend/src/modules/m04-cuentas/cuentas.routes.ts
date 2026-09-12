import { Router } from 'express';
import { db } from '../../core/db/connection';
import { guardas } from '../m20-seguridad/seguridad.routes';

// Repositorios
import { CuentasRepository } from './repositories/cuentas.repository';
import { VerificacionRepository } from './repositories/verificacion.repository';
import { DireccionRepository } from './repositories/direccion.repository';
import { EmpresaRepository } from './repositories/empresa.repository';

// Servicios
import { CuentasService } from './services/cuentas.service';
import { AuthService } from './services/auth.service';
import { PerfilService } from './services/perfil.service';
import { DireccionService } from './services/direccion.service';
import { EmpresaAdminService } from './services/empresa-admin.service';

// Controladores
import { CuentasController } from './controllers/cuentas.controller';
import { PerfilController } from './controllers/perfil.controller';
import { EmpresaAdminController } from './controllers/empresa-admin.controller';

// ==============================================================================
// M04 - ENRUTADOR PRINCIPAL: CUENTAS, AUTENTICACIÓN Y PERFIL
// Raíz de composición con inyección de dependencias (Principio D de SOLID)
// ==============================================================================

// 1. Instanciación de Repositorios (Conectados a PostgreSQL Kysely)
const cuentasRepo = new CuentasRepository(db);
const verificacionRepo = new VerificacionRepository(db);
const direccionRepo = new DireccionRepository(db);
const empresaRepo = new EmpresaRepository(db);

// 2. Instanciación de Servicios
const cuentasService = new CuentasService(cuentasRepo, verificacionRepo, empresaRepo);
const authService = new AuthService(cuentasRepo, verificacionRepo);
const perfilService = new PerfilService(cuentasRepo, verificacionRepo, empresaRepo);
const direccionService = new DireccionService(direccionRepo);
const empresaAdminService = new EmpresaAdminService(cuentasRepo, empresaRepo);

// 3. Exportación de servicios para consumo externo o pruebas
export const serviciosCuentas = {
  cuentasService,
  authService,
  perfilService,
  direccionService,
  empresaAdminService,
};

// 4. Instanciación de Controladores
const cuentasCtrl = new CuentasController(cuentasService, authService);
const perfilCtrl = new PerfilController(perfilService, direccionService);
const empresaAdminCtrl = new EmpresaAdminController(empresaAdminService);

export const cuentasRoutes = Router();

// ==============================================================================
// 1. RUTAS PÚBLICAS (Sin sesión requerida)
// ==============================================================================

// HU-CUE-01: Registro de particular con código de verificación
cuentasRoutes.post('/registro/particular', (req, res, next) => {
  void cuentasCtrl.registrarParticular(req, res).catch(next);
});

cuentasRoutes.post('/verificar-codigo', (req, res, next) => {
  void cuentasCtrl.verificarCodigo(req, res).catch(next);
});

cuentasRoutes.post('/reenviar-codigo', (req, res, next) => {
  void cuentasCtrl.reenviarCodigo(req, res).catch(next);
});

// HU-CUE-03: Registro de cliente empresa sujeto a aprobación
cuentasRoutes.post('/registro/empresa', (req, res, next) => {
  void cuentasCtrl.registrarEmpresa(req, res).catch(next);
});

cuentasRoutes.get('/empresa/estado-solicitud', (req, res, next) => {
  void cuentasCtrl.consultarEstadoSolicitudEmpresa(req, res).catch(next);
});

// HU-CUE-04: Inicio de sesión
cuentasRoutes.post('/login', (req, res, next) => {
  void cuentasCtrl.login(req, res).catch(next);
});

// HU-CUE-02: Autenticación y registro con Google Identity
cuentasRoutes.post('/google', (req, res, next) => {
  void cuentasCtrl.autenticarConGoogle(req, res).catch(next);
});

cuentasRoutes.post('/google/vincular', (req, res, next) => {
  void cuentasCtrl.confirmarVinculacionGoogle(req, res).catch(next);
});

cuentasRoutes.post('/google/completar-password', (req, res, next) => {
  void cuentasCtrl.completarPasswordGoogle(req, res).catch(next);
});

// HU-CUE-05: Recuperación de contraseña
cuentasRoutes.post('/recuperar-password/solicitar', (req, res, next) => {
  void cuentasCtrl.solicitarRecuperacion(req, res).catch(next);
});

cuentasRoutes.post('/recuperar-password/confirmar', (req, res, next) => {
  void cuentasCtrl.confirmarRecuperacion(req, res).catch(next);
});

// ==============================================================================
// 2. RUTAS PROTEGIDAS DE CLIENTE (Exigen sesión vigente HU-SEG-02 / HU-SEG-03)
// ==============================================================================

// Cierre de sesión explícito (HU-CUE-04)
cuentasRoutes.post('/logout', guardas.sesionVigente(), (req, res, next) => {
  void cuentasCtrl.logout(req, res).catch(next);
});

// HU-CUE-06: Perfil del usuario
cuentasRoutes.get('/perfil', guardas.sesionVigente(), (req, res, next) => {
  void perfilCtrl.obtenerPerfil(req, res).catch(next);
});

cuentasRoutes.put('/perfil', guardas.sesionVigente(), (req, res, next) => {
  void perfilCtrl.actualizarPerfil(req, res).catch(next);
});

cuentasRoutes.post('/perfil/cambiar-correo/solicitar', guardas.sesionVigente(), (req, res, next) => {
  void perfilCtrl.solicitarCambioCorreo(req, res).catch(next);
});

cuentasRoutes.post('/perfil/cambiar-correo/confirmar', guardas.sesionVigente(), (req, res, next) => {
  void perfilCtrl.confirmarCambioCorreo(req, res).catch(next);
});

cuentasRoutes.post('/perfil/solicitar-empresa', guardas.sesionVigente(), (req, res, next) => {
  void perfilCtrl.solicitarAscensoEmpresa(req, res).catch(next);
});

// HU-CUE-07: Gestión de Direcciones
cuentasRoutes.get('/direcciones', guardas.sesionVigente(), (req, res, next) => {
  void perfilCtrl.listarDirecciones(req, res).catch(next);
});

cuentasRoutes.post('/direcciones', guardas.sesionVigente(), (req, res, next) => {
  void perfilCtrl.crearDireccion(req, res).catch(next);
});

cuentasRoutes.get('/direcciones/:id', guardas.sesionVigente(), (req, res, next) => {
  void perfilCtrl.obtenerDireccion(req, res).catch(next);
});

cuentasRoutes.put('/direcciones/:id', guardas.sesionVigente(), (req, res, next) => {
  void perfilCtrl.actualizarDireccion(req, res).catch(next);
});

cuentasRoutes.delete('/direcciones/:id', guardas.sesionVigente(), (req, res, next) => {
  void perfilCtrl.eliminarDireccion(req, res).catch(next);
});

cuentasRoutes.patch('/direcciones/:id/predeterminada', guardas.sesionVigente(), (req, res, next) => {
  void perfilCtrl.marcarPredeterminada(req, res).catch(next);
});

// ==============================================================================
// 3. RUTAS ADMINISTRATIVAS: APROBACIÓN DE EMPRESAS (HU-CUE-09)
// Protegidas por sesión y permiso 'personal.editar' o 'usuarios.gestionar'
// ==============================================================================

cuentasRoutes.get(
  '/admin/solicitudes-empresa',
  guardas.sesionVigente(),
  guardas.requierePermiso('personal.ver'),
  (req, res, next) => {
    void empresaAdminCtrl.listarSolicitudesPendientes(req, res).catch(next);
  }
);

cuentasRoutes.get(
  '/admin/solicitudes-empresa/:id',
  guardas.sesionVigente(),
  guardas.requierePermiso('personal.ver'),
  (req, res, next) => {
    void empresaAdminCtrl.obtenerDetalleSolicitud(req, res).catch(next);
  }
);

cuentasRoutes.post(
  '/admin/solicitudes-empresa/:id/dictamen',
  guardas.sesionVigente(),
  guardas.requierePermiso('personal.editar'),
  (req, res, next) => {
    void empresaAdminCtrl.dictaminarSolicitud(req, res).catch(next);
  }
);

cuentasRoutes.get(
  '/admin/solicitudes-nit',
  guardas.sesionVigente(),
  guardas.requierePermiso('personal.ver'),
  (req, res, next) => {
    void empresaAdminCtrl.listarSolicitudesNitPendientes(req, res).catch(next);
  }
);

cuentasRoutes.post(
  '/admin/solicitudes-nit/:id/dictamen',
  guardas.sesionVigente(),
  guardas.requierePermiso('personal.editar'),
  (req, res, next) => {
    void empresaAdminCtrl.dictaminarSolicitudNit(req, res).catch(next);
  }
);
