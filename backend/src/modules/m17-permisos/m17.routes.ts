import { Router } from 'express';
import { db } from '../../core/db/connection';
import { guardas, serviciosSeguridad } from '../m20-seguridad/seguridad.routes';

import { EmpleadosRepository } from './repositories/empleados.repository';
import { PermisosRepository } from './repositories/permisos.repository';
import { ClientesRepository } from './repositories/clientes.repository';
import { ParametrosRepository } from './repositories/parametros.repository';

import { EmpleadosService } from './services/empleados.service';
import { PermisosService } from './services/permisos.service';
import { ClientesService } from './services/clientes.service';
import { ParametrosService } from './services/parametros.service';

import { EmpleadosController } from './controllers/empleados.controller';
import { PermisosController } from './controllers/permisos.controller';
import { ClientesController } from './controllers/clientes.controller';
import { ParametrosController } from './controllers/parametros.controller';

// ==============================================================================
// M17 - ENRUTADOR PRINCIPAL: ADMINISTRACIÓN, EMPLEADOS Y PERMISOS
// Raiz de composicion del modulo con inyeccion de dependencias (principio D de SOLID).
// Todas las rutas exigen sesion activa valida via guardas de M20 (RNF-SEG-03-01).
// ==============================================================================

// -----------------------------------------------------------------------------
// Inyeccion de Dependencias
// -----------------------------------------------------------------------------
const empleadosRepo = new EmpleadosRepository(db);
const permisosRepo = new PermisosRepository(db);
const clientesRepo = new ClientesRepository(db);
const parametrosRepo = new ParametrosRepository(db);

const empleadosService = new EmpleadosService(empleadosRepo, permisosRepo, serviciosSeguridad.sesion);
const permisosService = new PermisosService(permisosRepo, empleadosRepo);
const clientesService = new ClientesService(clientesRepo);
const parametrosService = new ParametrosService(parametrosRepo);

const empleadosCtrl = new EmpleadosController(empleadosService);
const permisosCtrl = new PermisosController(permisosService);
const clientesCtrl = new ClientesController(clientesService);
const parametrosCtrl = new ParametrosController(parametrosService);

const adminRoutes = Router();

// -----------------------------------------------------------------------------
// Sesion requerida en todo el modulo /api/admin (RNF-SEG-03-01)
// -----------------------------------------------------------------------------
adminRoutes.use(guardas.sesionVigente());

// -----------------------------------------------------------------------------
// Rutas: Catalogo de Permisos
// GET /api/admin/permisos — Ver catalogo (requiere personal.ver)
// -----------------------------------------------------------------------------
adminRoutes.get(
  '/permisos',
  guardas.requierePermiso('personal.ver'),
  (req, res, next) => { void empleadosCtrl.listarEmpleados(req, res).catch(next); }
);

// Sobreescribir: catalogo de permisos
adminRoutes.get(
  '/permisos/catalogo',
  guardas.requierePermiso('seguridad.gestionar_permisos'),
  (req, res, next) => { void permisosCtrl.obtenerCatalogo(req, res).catch(next); }
);

// -----------------------------------------------------------------------------
// Rutas: Empleados
// -----------------------------------------------------------------------------
adminRoutes.post(
  '/empleados',
  guardas.requierePermiso('personal.ver'),
  (req, res, next) => { void empleadosCtrl.crearEmpleado(req, res).catch(next); }
);

adminRoutes.get(
  '/empleados',
  guardas.requierePermiso('personal.ver'),
  (req, res, next) => { void empleadosCtrl.listarEmpleados(req, res).catch(next); }
);

adminRoutes.get(
  '/empleados/:id',
  guardas.requierePermiso('personal.ver'),
  (req, res, next) => { void empleadosCtrl.obtenerEmpleado(req, res).catch(next); }
);

adminRoutes.patch(
  '/empleados/:id',
  guardas.requierePermiso('personal.editar'),
  (req, res, next) => { void empleadosCtrl.actualizarContacto(req, res).catch(next); }
);

adminRoutes.patch(
  '/empleados/:id/desactivar',
  guardas.requierePermiso('personal.desactivar'),
  (req, res, next) => { void empleadosCtrl.desactivarEmpleado(req, res).catch(next); }
);

adminRoutes.patch(
  '/empleados/:id/reactivar',
  guardas.requierePermiso('personal.desactivar'),
  (req, res, next) => { void empleadosCtrl.reactivarEmpleado(req, res).catch(next); }
);

// -----------------------------------------------------------------------------
// Rutas: Permisos de Empleados
// -----------------------------------------------------------------------------
adminRoutes.get(
  '/empleados/:id/permisos',
  guardas.requierePermiso('seguridad.gestionar_permisos'),
  (req, res, next) => { void permisosCtrl.obtenerPermisosEmpleado(req, res).catch(next); }
);

adminRoutes.put(
  '/empleados/:id/permisos',
  guardas.requierePermiso('seguridad.gestionar_permisos'),
  (req, res, next) => { void permisosCtrl.reemplazarPermisos(req, res).catch(next); }
);

// -----------------------------------------------------------------------------
// Rutas: Clientes
// -----------------------------------------------------------------------------
adminRoutes.get(
  '/clientes',
  guardas.requierePermiso('personal.ver'),
  (req, res, next) => { void clientesCtrl.listarClientes(req, res).catch(next); }
);

adminRoutes.get(
  '/clientes/:id',
  guardas.requierePermiso('personal.ver'),
  (req, res, next) => { void clientesCtrl.obtenerCliente(req, res).catch(next); }
);

adminRoutes.patch(
  '/clientes/:id/bloquear',
  guardas.requierePermiso('personal.desactivar'),
  (req, res, next) => { void clientesCtrl.bloquearCliente(req, res).catch(next); }
);

adminRoutes.patch(
  '/clientes/:id/desbloquear',
  guardas.requierePermiso('personal.desactivar'),
  (req, res, next) => { void clientesCtrl.desbloquearCliente(req, res).catch(next); }
);

// -----------------------------------------------------------------------------
// Rutas: Parametros del Sistema
// -----------------------------------------------------------------------------
adminRoutes.get(
  '/parametros',
  guardas.requierePermiso('configuracion.ver'),
  (req, res, next) => { void parametrosCtrl.listarParametros(req, res).catch(next); }
);

adminRoutes.put(
  '/parametros',
  guardas.requierePermiso('configuracion.editar'),
  (req, res, next) => { void parametrosCtrl.actualizarParametro(req, res).catch(next); }
);

export { adminRoutes };
