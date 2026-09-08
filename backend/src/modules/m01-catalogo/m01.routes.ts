import { Router } from 'express';
import { db } from '../../core/db/connection';
import { guardas } from '../m20-seguridad/seguridad.routes';

import { CategoriasRepository } from './repositories/categorias.repository';
import { SubcategoriasRepository } from './repositories/subcategorias.repository';

import { CategoriasService } from './services/categorias.service';
import { SubcategoriasService } from './services/subcategorias.service';

import { CategoriasController } from './controllers/categorias.controller';
import { SubcategoriasController } from './controllers/subcategorias.controller';

// ==============================================================================
// M01 - ENRUTADOR PRINCIPAL: CATÁLOGO DE PRODUCTOS
// Raíz de composición del módulo con inyección de dependencias (Principio D de SOLID).
// Todas las rutas administrativas exigen sesión vigente y el permiso
// «Gestión del catálogo» (RF-CAT-01-05), verificado en servidor vía guardas de M20.
// ==============================================================================

const categoriasRepo = new CategoriasRepository(db);
const subcategoriasRepo = new SubcategoriasRepository(db);

const categoriasService = new CategoriasService(categoriasRepo);
const subcategoriasService = new SubcategoriasService(subcategoriasRepo, categoriasRepo);

const categoriasCtrl = new CategoriasController(categoriasService);
const subcategoriasCtrl = new SubcategoriasController(subcategoriasService);

const catalogoRoutes = Router();

// -----------------------------------------------------------------------------
// Rutas: Categorías (HU-CAT-01)
// -----------------------------------------------------------------------------
catalogoRoutes.post(
  '/categorias',
  ...guardas.protegido('catalogo.crear'),
  (req, res, next) => { void categoriasCtrl.crear(req, res).catch(next); }
);

catalogoRoutes.get(
  '/categorias',
  ...guardas.protegido('catalogo.ver'),
  (req, res, next) => { void categoriasCtrl.listar(req, res).catch(next); }
);

catalogoRoutes.get(
  '/categorias/:id',
  ...guardas.protegido('catalogo.ver'),
  (req, res, next) => { void categoriasCtrl.obtener(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/categorias/:id',
  ...guardas.protegido('catalogo.editar'),
  (req, res, next) => { void categoriasCtrl.actualizar(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/categorias/:id/desactivar',
  ...guardas.protegido('catalogo.eliminar'),
  (req, res, next) => { void categoriasCtrl.desactivar(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/categorias/:id/reactivar',
  ...guardas.protegido('catalogo.eliminar'),
  (req, res, next) => { void categoriasCtrl.reactivar(req, res).catch(next); }
);

// -----------------------------------------------------------------------------
// Rutas: Subcategorías (HU-CAT-01)
// -----------------------------------------------------------------------------
catalogoRoutes.post(
  '/subcategorias',
  ...guardas.protegido('catalogo.crear'),
  (req, res, next) => { void subcategoriasCtrl.crear(req, res).catch(next); }
);

catalogoRoutes.get(
  '/categorias/:idCategoria/subcategorias',
  ...guardas.protegido('catalogo.ver'),
  (req, res, next) => { void subcategoriasCtrl.listarPorCategoria(req, res).catch(next); }
);

catalogoRoutes.get(
  '/subcategorias/:id',
  ...guardas.protegido('catalogo.ver'),
  (req, res, next) => { void subcategoriasCtrl.obtener(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/subcategorias/:id',
  ...guardas.protegido('catalogo.editar'),
  (req, res, next) => { void subcategoriasCtrl.actualizar(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/subcategorias/:id/desactivar',
  ...guardas.protegido('catalogo.eliminar'),
  (req, res, next) => { void subcategoriasCtrl.desactivar(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/subcategorias/:id/reactivar',
  ...guardas.protegido('catalogo.eliminar'),
  (req, res, next) => { void subcategoriasCtrl.reactivar(req, res).catch(next); }
);

// Fachadas públicas exportadas por M01 para consumo inter-módulo (HU-CAT-02 en adelante)
export const serviciosCatalogo = { categoriasService, subcategoriasService };

export { catalogoRoutes };
