import { Router } from 'express';
import { db } from '../../core/db/connection';
import { guardas } from '../m20-seguridad/seguridad.routes';

import { BusquedaRepository } from './repositories/busqueda.repository';
import { BusquedaService } from './services/busqueda.service';
import { BusquedaController } from './controllers/busqueda.controller';

// ==============================================================================
// M02 - ENRUTADOR PRINCIPAL: BÚSQUEDA Y NAVEGACIÓN
// Raíz de composición del módulo con inyección de dependencias (Principio D de
// SOLID). La búsqueda es pública (RF-BUS-01-02 / CA-BUS-01-04): sin guardas.
// ==============================================================================

const busquedaRepo = new BusquedaRepository(db);
const busquedaService = new BusquedaService(busquedaRepo);
const busquedaCtrl = new BusquedaController(busquedaService);

const busquedaRoutes = Router();

// HU-BUS-01/02/03/05: búsqueda pública de productos (término vacío => catálogo completo),
// con filtros, ordenamiento y paginación.
busquedaRoutes.get('/productos', (req, res, next) => {
  void busquedaCtrl.buscar(req, res).catch(next);
});

// HU-BUS-06: analítica de búsquedas sin resultado (solo admin). Exige el permiso
// «Consultar estadísticas» validado en servidor por las guardas de M20 (CA-BUS-06-03).
busquedaRoutes.get(
  '/estadisticas/sin-resultado',
  ...guardas.protegido('estadisticas.consultar'),
  (req, res, next) => {
    void busquedaCtrl.estadisticasSinResultado(req, res).catch(next);
  }
);

export { busquedaRoutes };
