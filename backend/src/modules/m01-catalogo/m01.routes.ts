import { Router } from 'express';
import { db } from '../../core/db/connection';
import { guardas } from '../m20-seguridad/seguridad.routes';

import { CategoriasRepository } from './repositories/categorias.repository';
import { SubcategoriasRepository } from './repositories/subcategorias.repository';
import { MarcasRepository } from './repositories/marcas.repository';
import { LineasRepository } from './repositories/lineas.repository';
import { BasesRepository } from './repositories/bases.repository';
import { ColoresRepository } from './repositories/colores.repository';

import { CategoriasService } from './services/categorias.service';
import { SubcategoriasService } from './services/subcategorias.service';
import { LineasService } from './services/lineas.service';
import { MarcasService } from './services/marcas.service';
import { BasesService } from './services/bases.service';
import { ColoresService } from './services/colores.service';

import { CategoriasController } from './controllers/categorias.controller';
import { SubcategoriasController } from './controllers/subcategorias.controller';
import { LineasController } from './controllers/lineas.controller';
import { MarcasController } from './controllers/marcas.controller';
import { BasesController } from './controllers/bases.controller';
import { ColoresController } from './controllers/colores.controller';

// ==============================================================================
// M01 - ENRUTADOR PRINCIPAL: CATÁLOGO DE PRODUCTOS
// Raíz de composición del módulo con inyección de dependencias (Principio D de SOLID).
// Todas las rutas administrativas exigen sesión vigente y el permiso
// «Gestión del catálogo» (RF-CAT-01-05), verificado en servidor vía guardas de M20.
// ==============================================================================

const categoriasRepo = new CategoriasRepository(db);
const subcategoriasRepo = new SubcategoriasRepository(db);
const marcasRepo = new MarcasRepository(db);
const lineasRepo = new LineasRepository(db);
const basesRepo = new BasesRepository(db);
const coloresRepo = new ColoresRepository(db);

const categoriasService = new CategoriasService(categoriasRepo);
const subcategoriasService = new SubcategoriasService(subcategoriasRepo, categoriasRepo);
const lineasService = new LineasService(lineasRepo, marcasRepo);
const marcasService = new MarcasService(marcasRepo, lineasRepo, basesRepo, coloresRepo);
const basesService = new BasesService(basesRepo, marcasRepo);
const coloresService = new ColoresService(coloresRepo, marcasRepo);

const categoriasCtrl = new CategoriasController(categoriasService);
const subcategoriasCtrl = new SubcategoriasController(subcategoriasService);
const lineasCtrl = new LineasController(lineasService);
const marcasCtrl = new MarcasController(marcasService);
const basesCtrl = new BasesController(basesService);
const coloresCtrl = new ColoresController(coloresService);

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

// -----------------------------------------------------------------------------
// Rutas: Líneas comerciales (HU-CAT-11)
// -----------------------------------------------------------------------------
catalogoRoutes.post(
  '/lineas',
  ...guardas.protegido('catalogo.crear'),
  (req, res, next) => { void lineasCtrl.crear(req, res).catch(next); }
);

catalogoRoutes.get(
  '/marcas/:idMarca/lineas',
  ...guardas.protegido('catalogo.ver'),
  (req, res, next) => { void lineasCtrl.listarPorMarca(req, res).catch(next); }
);

catalogoRoutes.get(
  '/lineas/:id',
  ...guardas.protegido('catalogo.ver'),
  (req, res, next) => { void lineasCtrl.obtener(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/lineas/:id',
  ...guardas.protegido('catalogo.editar'),
  (req, res, next) => { void lineasCtrl.actualizar(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/lineas/:id/desactivar',
  ...guardas.protegido('catalogo.eliminar'),
  (req, res, next) => { void lineasCtrl.desactivar(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/lineas/:id/reactivar',
  ...guardas.protegido('catalogo.eliminar'),
  (req, res, next) => { void lineasCtrl.reactivar(req, res).catch(next); }
);

// -----------------------------------------------------------------------------
// Rutas: Marcas (HU-CAT-04)
// -----------------------------------------------------------------------------
catalogoRoutes.post(
  '/marcas',
  ...guardas.protegido('catalogo.crear'),
  (req, res, next) => { void marcasCtrl.crear(req, res).catch(next); }
);

catalogoRoutes.get(
  '/marcas',
  ...guardas.protegido('catalogo.ver'),
  (req, res, next) => { void marcasCtrl.listar(req, res).catch(next); }
);

catalogoRoutes.get(
  '/marcas/:id',
  ...guardas.protegido('catalogo.ver'),
  (req, res, next) => { void marcasCtrl.obtener(req, res).catch(next); }
);

catalogoRoutes.get(
  '/marcas/:id/logotipo',
  ...guardas.protegido('catalogo.ver'),
  (req, res, next) => { void marcasCtrl.obtenerLogotipo(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/marcas/:id',
  ...guardas.protegido('catalogo.editar'),
  (req, res, next) => { void marcasCtrl.actualizar(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/marcas/:id/desactivar',
  ...guardas.protegido('catalogo.eliminar'),
  (req, res, next) => { void marcasCtrl.desactivar(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/marcas/:id/reactivar',
  ...guardas.protegido('catalogo.eliminar'),
  (req, res, next) => { void marcasCtrl.reactivar(req, res).catch(next); }
);

// -----------------------------------------------------------------------------
// Rutas: Bases (HU-CAT-12, solo el registro de bases)
// -----------------------------------------------------------------------------
catalogoRoutes.post(
  '/bases',
  ...guardas.protegido('catalogo.crear'),
  (req, res, next) => { void basesCtrl.crear(req, res).catch(next); }
);

catalogoRoutes.get(
  '/marcas/:idMarca/bases',
  ...guardas.protegido('catalogo.ver'),
  (req, res, next) => { void basesCtrl.listarPorMarca(req, res).catch(next); }
);

catalogoRoutes.get(
  '/bases/:id',
  ...guardas.protegido('catalogo.ver'),
  (req, res, next) => { void basesCtrl.obtener(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/bases/:id',
  ...guardas.protegido('catalogo.editar'),
  (req, res, next) => { void basesCtrl.actualizar(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/bases/:id/desactivar',
  ...guardas.protegido('catalogo.eliminar'),
  (req, res, next) => { void basesCtrl.desactivar(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/bases/:id/reactivar',
  ...guardas.protegido('catalogo.eliminar'),
  (req, res, next) => { void basesCtrl.reactivar(req, res).catch(next); }
);

// -----------------------------------------------------------------------------
// Rutas: Colores (HU-CAT-05)
// -----------------------------------------------------------------------------
catalogoRoutes.post(
  '/colores',
  ...guardas.protegido('catalogo.crear'),
  (req, res, next) => { void coloresCtrl.crear(req, res).catch(next); }
);

catalogoRoutes.get(
  '/marcas/:idMarca/colores',
  ...guardas.protegido('catalogo.ver'),
  (req, res, next) => { void coloresCtrl.listarPorMarca(req, res).catch(next); }
);

catalogoRoutes.get(
  '/colores/:id',
  ...guardas.protegido('catalogo.ver'),
  (req, res, next) => { void coloresCtrl.obtener(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/colores/:id',
  ...guardas.protegido('catalogo.editar'),
  (req, res, next) => { void coloresCtrl.actualizar(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/colores/:id/desactivar',
  ...guardas.protegido('catalogo.eliminar'),
  (req, res, next) => { void coloresCtrl.desactivar(req, res).catch(next); }
);

catalogoRoutes.patch(
  '/colores/:id/reactivar',
  ...guardas.protegido('catalogo.eliminar'),
  (req, res, next) => { void coloresCtrl.reactivar(req, res).catch(next); }
);

// Fachadas públicas exportadas por M01 para consumo inter-módulo (HU-CAT-02 en adelante)
export const serviciosCatalogo = { categoriasService, subcategoriasService, lineasService, marcasService, basesService, coloresService };

export { catalogoRoutes };
