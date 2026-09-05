import { PlantillaRepository } from '../repositories/plantilla.repository';
import { EnvioRepository } from '../repositories/envio.repository';
import { SmtpService } from '../services/smtp.service';
import { PlantillaService } from '../services/plantilla.service';
import { NotificacionesService } from '../services/notificaciones.service';

// ==============================================================================
// M18 - SUITE DE PRUEBAS DE INTEGRACIÓN: NOTIFICACIONES (HU-NOT-01 a HU-NOT-04)
// ==============================================================================

async function ejecutarPruebasM18(): Promise<void> {
  console.log('🚀 Iniciando suite de validación de requisitos para M18 - Notificaciones...\n');

  let pruebasSuperadas = 0;
  let pruebasFallidas = 0;

  function assert(condicion: boolean, descripcion: string): void {
    if (condicion) {
      console.log(`  ✅ [PASS] ${descripcion}`);
      pruebasSuperadas++;
    } else {
      console.error(`  ❌ [FAIL] ${descripcion}`);
      pruebasFallidas++;
    }
  }

  const plantillaRepo = new PlantillaRepository();
  const envioRepo = new EnvioRepository();
  const smtpService = new SmtpService({
    modoSimulacion: true,
    maxReintentos: 3,
    delayReintentoMs: 50, // Rápido para test
  });
  const plantillaService = new PlantillaService(plantillaRepo);
  const notificacionesService = new NotificacionesService(
    plantillaRepo,
    envioRepo,
    smtpService,
    plantillaService
  );

  // ---------------------------------------------------------------------------
  // 1. HU-NOT-01: Envío de correos transaccionales y reintentos
  // ---------------------------------------------------------------------------
  console.log('--- 1. HU-NOT-01: Envío transaccional y política de reintentos ---');

  // Test 1.1: Envío exitoso de activación de cliente (CA-NOT-01-01)
  const resRegistro = await notificacionesService.procesarEvento(
    'REGISTRO_CLIENTE',
    'cliente.nuevo@pintuclic.com',
    {
      nombre: 'Juan Pérez',
      codigo: '482910',
      enlace_verificacion: 'https://pintuclic.com/activar?code=482910',
    },
    101
  );

  assert(resRegistro.exitoso === true, 'CA-NOT-01-01: Despacho exitoso de correo de activación');
  assert(resRegistro.intentos === 1, 'CA-NOT-01-01: Envió en el primer intento');

  // Test 1.2: Registro en bitácora (RF-NOT-01-04)
  const registroBitacora = await envioRepo.obtenerPorId(resRegistro.idEnvio);
  assert(registroBitacora !== null, 'RF-NOT-01-04: El despacho quedó asentado en la bitácora');
  assert(registroBitacora?.estado === 'enviado', 'RF-NOT-01-04: El estado final es "enviado"');
  assert(registroBitacora?.destinatario === 'cliente.nuevo@pintuclic.com', 'RF-NOT-01-04: Destinatario registrado correctamente');

  // Test 1.3: Reintentos y fallo definitivo con rebote simulado (CA-NOT-01-02, CA-NOT-01-03)
  const resFallo = await notificacionesService.procesarEvento(
    'REGISTRO_CLIENTE',
    'invalido@error-simulado.com',
    {
      nombre: 'Usuario Fallido',
      codigo: '999999',
      enlace_verificacion: 'https://pintuclic.com/activar?code=999999',
    }
  );

  assert(resFallo.exitoso === false, 'CA-NOT-01-02: Detecta el fallo de entrega');
  const registroFallido = await envioRepo.obtenerPorId(resFallo.idEnvio);
  assert(registroFallido?.estado === 'fallido', 'CA-NOT-01-03: Marca el registro como "fallido" tras agotar intentos');
  assert(
    registroFallido?.error !== null && !registroFallido?.error?.includes('password'),
    'HU-SEG-06: El registro de error no expone credenciales ni datos sensibles'
  );

  // ---------------------------------------------------------------------------
  // 2. HU-NOT-02: Notificación de cambios de estado de orden y cotizaciones
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. HU-NOT-02: Eventos de orden y cotización ---');

  // Test 2.1: Notificación de cambio de estado de orden (CA-NOT-02-01)
  const resOrden = await notificacionesService.notificarCambioEstadoOrden({
    destinatario: 'comprador@gmail.com',
    nombreCliente: 'María López',
    numeroOrden: 'ORD-2026-999',
    nuevoEstado: 'Enviado con transportadora',
    fechaCambio: '2026-09-05',
    comentarios: 'Guía de despacho #441029',
  });
  assert(resOrden.exitoso === true, 'CA-NOT-02-01: Notificación de cambio de estado de pedido procesada');

  // Test 2.2: Aviso de demora por inventario (RF-NOT-02-02, CA-NOT-02-02)
  const resDemora = await notificacionesService.notificarDemoraStock({
    destinatario: 'comprador@gmail.com',
    nombreCliente: 'María López',
    numeroOrden: 'ORD-2026-999',
    tiempoEstimadoDias: 4,
    motivoDemora: 'Entonación especial de base poliuretano',
  });
  assert(resDemora.exitoso === true, 'CA-NOT-02-02: Aviso de demora por inventario despachado');

  // Test 2.3: Novedades de cotización comercial (RF-NOT-02-03, CA-NOT-02-03)
  const resCotizacion = await notificacionesService.notificarEventoCotizacion({
    destinatario: 'empresa@constructora.com',
    nombreCliente: 'Ing. Fernando Ruiz',
    numeroCotizacion: 'COT-2026-112',
    estadoCotizacion: 'respondida',
    fechaVigencia: '2026-09-20',
    observaciones: 'Descuento del 15% aprobado para 20 cuñetes de vinilo',
  });
  assert(resCotizacion.exitoso === true, 'CA-NOT-02-03: Evento de cotización respondida despachado');

  // ---------------------------------------------------------------------------
  // 3. HU-NOT-03: Plantillas de comunicación administrables
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. HU-NOT-03: Plantillas y variables obligatorias ---');

  // Test 3.1: Listado de plantillas (RF-NOT-03-01)
  const plantillas = await plantillaService.listarPlantillas();
  assert(plantillas.length >= 8, 'RF-NOT-03-01: Catálogo inicial cuenta con las plantillas de negocio del sistema');

  // Test 3.2: Vista previa con datos de ejemplo (RF-NOT-03-03, CA-NOT-03-02)
  const preview = await plantillaService.generarVistaPrevia('registro_cliente');
  assert(preview !== null, 'RF-NOT-03-03: Genera vista previa');
  assert(
    Boolean(preview?.cuerpoHtml.includes('Juan Pérez') && preview?.cuerpoHtml.includes('782914')),
    'CA-NOT-03-02: La vista previa renderiza los campos variables con datos de ejemplo'
  );

  // Test 3.3: Rechazo al eliminar variable obligatoria (RF-NOT-03-04, CA-NOT-03-03)
  const intentoEliminarObligatoria = await plantillaService.actualizarPlantilla('registro_cliente', {
    asunto: 'Nuevo asunto sin variables obligatorias',
    cuerpoHtml: '<p>Hola {{nombre}}, tu cuenta ha sido creada con exito sin enlace de activacion.</p>',
  });
  assert(
    intentoEliminarObligatoria.exitoso === false,
    'RF-NOT-03-04: Bloquea la actualización si se intenta eliminar una variable obligatoria'
  );
  assert(
    intentoEliminarObligatoria.variablesFaltantes?.includes('codigo') === true &&
    intentoEliminarObligatoria.variablesFaltantes?.includes('enlace_verificacion') === true,
    'CA-NOT-03-03: Identifica con precisión las variables obligatorias faltantes'
  );

  // Test 3.4: Actualización válida preservando variables obligatorias (CA-NOT-03-01)
  const actualizacionValida = await plantillaService.actualizarPlantilla('registro_cliente', {
    asunto: '¡Tu cuenta en Pintu Clic está lista!',
    cuerpoHtml: '<div><h1>Bienvenido {{nombre}}</h1><p>Código: {{codigo}}</p><p><a href="{{enlace_verificacion}}">Activar</a></p></div>',
  });
  assert(actualizacionValida.exitoso === true, 'CA-NOT-03-01: Permite guardar cuando se conservan las variables obligatorias');

  // ---------------------------------------------------------------------------
  // 4. HU-NOT-04: Entregabilidad, estadísticas y diagnóstico
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. HU-NOT-04: Entregabilidad y diagnóstico ---');

  // Test 4.1: Cálculo de estadísticas de entregabilidad
  const metricas = await notificacionesService.obtenerEstadisticas();
  assert(metricas.totalEnvios > 0, 'HU-NOT-04: Calcula el total de despachos registrados');
  assert(metricas.enviadosExitosos > 0, 'HU-NOT-04: Contabiliza los envíos exitosos');
  assert(metricas.fallidosDefinitivos > 0, 'HU-NOT-04: Contabiliza los envíos fallidos');
  assert(metricas.tasaEntregabilidad <= 100 && metricas.tasaEntregabilidad >= 0, 'HU-NOT-04: Tasa de entregabilidad en rango porcentual válido');

  // Test 4.2: Verificación de transporte SMTP (RF-NOT-04-01)
  const estadoSmtp = await notificacionesService.probarConexionSmtp();
  assert(estadoSmtp.conectado === true, 'RF-NOT-04-01: Transporte SMTP reporta conectividad operativa');

  console.log(`\n🏁 Resultado de las pruebas: ${pruebasSuperadas} superadas, ${pruebasFallidas} fallidas.`);
  if (pruebasFallidas > 0) {
    process.exit(1);
  }
}

void ejecutarPruebasM18();
