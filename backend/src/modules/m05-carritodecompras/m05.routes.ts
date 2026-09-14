import { Router } from 'express';
import { db } from '../../core/db/connection';
import { guardas } from '../m20-seguridad/seguridad.routes';

import { CarritoRepository } from './repositories/carrito.repository';
import { LineaCarritoRepository } from './repositories/linea-carrito.repository';
import { CarritoService } from './services/carrito.service';
import { CarritoController } from './controllers/carrito.controller';

// ==============================================================================
// M05 - ENRUTADOR PRINCIPAL: CARRITO DE COMPRAS
// Raíz de composición con inyección de dependencias (Principio D de SOLID)
// ==============================================================================

// 1. Instanciación de Repositorios
const carritoRepo = new CarritoRepository(db);
const lineaRepo = new LineaCarritoRepository(db);

// 2. Instanciación de Servicios
const carritoService = new CarritoService(carritoRepo, lineaRepo);

// 3. Instanciación de Controladores
const carritoCtrl = new CarritoController(carritoService);

export const carritoRoutes = Router();

// ==============================================================================
// RUTAS PÚBLICAS DE VISITANTE ANÓNIMO (HU-CAR-01 / HU-CAR-02)
// Sin autenticación requerida. Se identifica al visitante por el header
// 'x-visitor-token' (ADR-01 / RNF-CAR-01-01: sin datos personales).
// La autenticación se difiere estrictamente al checkout (RF-CAR-01-02).
// ==============================================================================

// HU-CAR-01: Obtener o inicializar carrito de visitante
carritoRoutes.get('/visitante', (req, res, next) => {
  void carritoCtrl.obtenerCarritoVisitante(req, res).catch(next);
});

// HU-CAR-02: Agregar ítem al carrito de visitante (acumula si variante ya existe)
carritoRoutes.post('/visitante/items', (req, res, next) => {
  void carritoCtrl.agregarItemVisitante(req, res).catch(next);
});

// HU-CAR-02: Actualizar cantidad de línea del carrito de visitante
carritoRoutes.put('/visitante/items/:idLinea', (req, res, next) => {
  void carritoCtrl.actualizarItemVisitante(req, res).catch(next);
});

// HU-CAR-02: Eliminar línea del carrito de visitante
carritoRoutes.delete('/visitante/items/:idLinea', (req, res, next) => {
  void carritoCtrl.eliminarItemVisitante(req, res).catch(next);
});

// ==============================================================================
// RUTAS PROTEGIDAS DE CLIENTE AUTENTICADO (HU-CAR-04 / HU-CAR-05)
// Exigen sesión vigente validada por M20 (HU-SEG-02 / HU-SEG-03)
// ==============================================================================

// HU-CAR-04: Obtener o crear carrito del cliente autenticado
carritoRoutes.get('/cliente', guardas.sesionVigente(), (req, res, next) => {
  void carritoCtrl.obtenerCarritoCliente(req, res).catch(next);
});

// HU-CAR-02: Agregar ítem al carrito del cliente autenticado
carritoRoutes.post('/cliente/items', guardas.sesionVigente(), (req, res, next) => {
  void carritoCtrl.agregarItemCliente(req, res).catch(next);
});

// HU-CAR-02: Actualizar cantidad de línea del carrito del cliente
carritoRoutes.put('/cliente/items/:idLinea', guardas.sesionVigente(), (req, res, next) => {
  void carritoCtrl.actualizarItemCliente(req, res).catch(next);
});

// HU-CAR-02: Eliminar línea del carrito del cliente
carritoRoutes.delete('/cliente/items/:idLinea', guardas.sesionVigente(), (req, res, next) => {
  void carritoCtrl.eliminarItemCliente(req, res).catch(next);
});

// HU-CAR-04: Fusionar carrito de visitante con la cuenta del cliente al autenticarse
carritoRoutes.post('/cliente/fusionar', guardas.sesionVigente(), (req, res, next) => {
  void carritoCtrl.fusionarCarrito(req, res).catch(next);
});

// HU-CAR-05: Revalidar precio y stock antes del checkout
carritoRoutes.get('/cliente/revalidar', guardas.sesionVigente(), (req, res, next) => {
  void carritoCtrl.revalidarCarrito(req, res).catch(next);
});
