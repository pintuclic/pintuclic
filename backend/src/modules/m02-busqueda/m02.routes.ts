import { Router } from 'express';
import { db } from '../../core/db/connection';

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

// HU-BUS-01: búsqueda de productos por texto libre (término vacío => catálogo completo).
busquedaRoutes.get('/productos', (req, res, next) => {
  void busquedaCtrl.buscar(req, res).catch(next);
});

export { busquedaRoutes };
