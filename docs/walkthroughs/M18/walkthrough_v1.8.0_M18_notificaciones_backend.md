# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

> 🏷️ **CONVENCIÓN OBLIGATORIA DE NOMENCLATURA DEL ARCHIVO:**  
> `docs/walkthroughs/M18/walkthrough_v1.8.0_M18_notificaciones_backend.md`

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v1.8.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M18 - Notificaciones y Comunicaciones Transaccionales (Backend)`
* **Fecha de Entrega:** `05/09/2026`
* **Autor / Responsable:** `Equipo de Backend / Agente IA`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-NOT-01** | **Envío de correos transaccionales** | **100% Cumplida** | `POST /api/notificaciones/disparar`<br>`GET /api/notificaciones/conexion-smtp`<br>`SmtpService`, `EnvioRepository` |
| **HU-NOT-02** | **Notificación de cambios de estado de orden y cotizaciones** | **100% Cumplida** | Métodos orquestadores en `NotificacionesService`:<br>• `notificarCambioEstadoOrden`<br>• `notificarDemoraStock`<br>• `notificarEventoCotizacion` |
| **HU-NOT-03** | **Plantillas de comunicación administrables** | **100% Cumplida** | `GET /api/notificaciones/plantillas`<br>`GET /api/notificaciones/plantillas/:codigo`<br>`PUT /api/notificaciones/plantillas/:codigo`<br>`POST /api/notificaciones/plantillas/:codigo/preview`<br>`PlantillaService`, `PlantillaRepository` |
| **HU-NOT-04** | **Entregabilidad del correo** | **100% Cumplida** | `GET /api/notificaciones/bitacora`<br>`GET /api/notificaciones/bitacora/:id`<br>`GET /api/notificaciones/estadisticas` |

### Descripción del Alcance de la Versión
Esta versión implementa la arquitectura backend completa del módulo transversal **M18 Notificaciones**, permitiendo el despacho asíncrono y seguro de correos electrónicos transaccionales a partir de eventos de negocio emitidos por otros módulos (`M04 Cuentas`, `M08 Órdenes`, `M21 Cotizaciones`). Incluye un motor de transporte SMTP con modo de simulación y política de reintentos configurables, un repositorio de plantillas administrables con validación estricta que impide eliminar variables obligatorias (como códigos de activación o enlaces de restablecimiento), un generador de vista previa con datos de ejemplo y una bitácora auditable de entregabilidad que cumple las políticas de no exposición de datos sensibles.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **Política de Reintentos (`RF-NOT-01-03`, `CA-NOT-01-02`):** Si el servidor SMTP reporta un fallo temporal, el sistema reintenta automáticamente hasta 3 veces (configurable) con retardo exponencial antes de clasificar el envío como fallido definitivo.
- **Inviolabilidad de Variables Obligatorias (`RF-NOT-03-04`, `CA-NOT-03-03`):** Si un administrador intenta editar una plantilla eliminando un campo variable mandatorio (por ejemplo `{{codigo}}` o `{{enlace_verificacion}}` en el correo de registro), la petición es rechazada con código HTTP `422 Unprocessable Entity` y el detalle de las variables faltantes.
- **Remitente y Reply-To Consistente (`RF-NOT-04-03`):** Todos los envíos se centralizan bajo una dirección institucional (`Pintu Clic <notificaciones@pintuclic.com>`) con cabecera `Reply-To` configurada por variables de entorno.
- **Independencia del Método de Acceso (`RF-NOT-01-01`):** El correo transaccional se envía a la dirección registrada del cliente sin importar si el usuario inició sesión por clave o autenticación de Google.
- **Detección y Registro de Rebotes (`RF-NOT-04-04`):** El adaptador de transporte identifica rebotes (`bounces`) por direcciones inexistentes para evitar reintentos innecesarios y registrarlos en la bitácora.

### B. Políticas Transversales Validadas
- 🔒 **M20 - Hashing y Credenciales (`HU-SEG-01`):** Cumplida; ninguna credencial o token sensible es almacenado en texto plano.
- 🛡️ **M17 - Autorización en Servidor (`HU-ADM-03`):** Las rutas de edición y consulta de plantillas están protegidas en backend con guardas `sesionVigente` y `requierePermiso('configuracion.editar' / 'configuracion.ver')`.
- 📧 **M18 - Notificaciones (`HU-NOT-01`):** Despacho desacoplado por SMTP con catálogo unificado de eventos.
- 👁️ **M20 - Mínima Exposición de Datos Sensibles (`HU-SEG-06`):** La bitácora de envíos y respuestas HTTP sanea recursivamente cualquier contraseña, token o parámetro interno, evitando su filtración a clientes de la API.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

### 🔹 HU-NOT-01 — Envío de correos transaccionales
| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-NOT-01-01** | Dado que ocurre un evento con comunicación asociada, cuando el sistema lo procesa, entonces envía el correo correspondiente a la dirección registrada. | Prueba de integración `m18.test.ts` procesando `REGISTRO_CLIENTE` | ✅ **CUMPLIDO** |
| **CA-NOT-01-02** | Dado que el envío de un correo falla, cuando el sistema lo detecta, entonces reintenta hasta el límite configurado antes de darlo por fallido. | Simulación de fallo en `smtpService.enviarConReintentos` | ✅ **CUMPLIDO** |
| **CA-NOT-01-03** | Dado que se agotan los reintentos, cuando el sistema lo marca como fallido, el registro deja constancia sin exponer datos sensibles. | Inspección de `EnvioRepository` verificando saneamiento de error (`HU-SEG-06`) | ✅ **CUMPLIDO** |
| **CA-NOT-01-04** | Dado que un cliente accedió mediante Google, cuando se le envía una comunicación, la recibe en su correo registrado. | Validación del destinatario provisto en el payload del evento | ✅ **CUMPLIDO** |

### 🔹 HU-NOT-02 — Notificación de cambios de estado de la orden
| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-NOT-02-01** | Dado que la orden cambia de estado, cuando M08 emite el evento, el sistema envía la notificación asociada. | Prueba unitaria `notificarCambioEstadoOrden` | ✅ **CUMPLIDO** |
| **CA-NOT-02-02** | Dado que una orden se demora por falta de stock, el sistema notifica al cliente con el tiempo estimado. | Prueba unitaria `notificarDemoraStock` | ✅ **CUMPLIDO** |
| **CA-NOT-02-03** | Dado que una cotización es respondida o rechazada, cuando M21 emite el evento, el sistema notifica al cliente. | Prueba unitaria `notificarEventoCotizacion` | ✅ **CUMPLIDO** |

### 🔹 HU-NOT-03 — Plantillas de comunicación administrables
| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-NOT-03-01** | Dado que el administrador edita el contenido de una plantilla, cuando guarda, las siguientes comunicaciones usan el nuevo contenido. | Prueba de actualización y posterior despacho | ✅ **CUMPLIDO** |
| **CA-NOT-03-02** | Dado que el administrador edita una plantilla, cuando solicita vista previa, el sistema la muestra con datos de ejemplo. | Test de endpoint `POST /plantillas/:codigo/preview` | ✅ **CUMPLIDO** |
| **CA-NOT-03-03** | Dado que el administrador intenta eliminar un campo variable obligatorio, cuando intenta guardar, el sistema rechaza el cambio. | Validación de `validarVariablesObligatorias` retornando 422 con variables faltantes | ✅ **CUMPLIDO** |

### 🔹 HU-NOT-04 — Entregabilidad del correo
| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-NOT-04-01** | Dado que el sistema envía un correo, pasa las validaciones del transporte remitente configuradas. | Verificación de conexión `probarConexionSmtp` y cabeceras | ✅ **CUMPLIDO** |
| **CA-NOT-04-02** | Dado que un correo rebota, cuando el sistema lo detecta, queda registrado para diagnóstico. | Captura y clasificación de rebote en `IResultadoTransporteSmtp` | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (¿De qué requiere para operar al 100% en Producción?)
- **Módulo M20 (Seguridad):** Requiere las guardas de autorización `sesionVigente` y `requierePermiso` de `seguridad.routes.ts` para restringir el acceso a la administración de plantillas y consulta de bitácora.
- **Variables de Entorno:** Requiere configurar credenciales de correo en `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`). En ausencia de estas, el servicio entra automáticamente en modo simulación seguro sin interrumpir la operación del servidor.

### B. Dependencias Hacia Adelante (¿A qué otros módulos habilita este desarrollo?)
- **Módulo M04 (Cuentas, Autenticación y Perfil):** Habilita el despacho real del código de activación para nuevos registros (`HU-CUE-01`), el enlace de recuperación de contraseñas (`HU-CUE-05`) y las notificaciones de radicación y resolución de cuentas empresa (`HU-CUE-03`, `HU-CUE-09`).
- **Módulo M08 (Órdenes de Compra):** Habilita las notificaciones automáticas al cliente ante cualquier cambio de estado del pedido o demoras en abastecimiento.
- **Módulo M21 (Cotizaciones Comerciales):** Habilita los avisos de cotización respondida, rechazada o próxima a vencer.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[NUEVO]** | `backend/src/modules/m18-notificaciones/interfaces/notificaciones.interfaces.ts` | Contratos puros de TypeScript (eventos, plantillas, bitácora, estadísticas). |
| **[NUEVO]** | `backend/src/modules/m18-notificaciones/interfaces/smtp.interfaces.ts` | Contratos estáticos de configuración y transporte SMTP. |
| **[NUEVO]** | `backend/src/modules/m18-notificaciones/dtos/plantilla.dto.ts` | Esquemas Zod para actualización y previsualización de plantillas. |
| **[NUEVO]** | `backend/src/modules/m18-notificaciones/dtos/envio.dto.ts` | Esquemas Zod para disparo de eventos y filtrado de bitácora. |
| **[NUEVO]** | `backend/src/modules/m18-notificaciones/dtos/index.ts` | Exportador de DTOs del módulo. |
| **[NUEVO]** | `backend/src/modules/m18-notificaciones/repositories/plantilla.repository.ts` | Catálogo maestro y persistencia de plantillas de comunicación. |
| **[NUEVO]** | `backend/src/modules/m18-notificaciones/repositories/envio.repository.ts` | Bitácora de trazabilidad de envíos, reintentos y estadísticas de entregabilidad. |
| **[NUEVO]** | `backend/src/modules/m18-notificaciones/services/smtp.service.ts` | Motor de transporte Nodemailer con soporte de reintentos y simulación. |
| **[NUEVO]** | `backend/src/modules/m18-notificaciones/services/plantilla.service.ts` | Renderizado, sustitución de variables y validación de campos obligatorios. |
| **[NUEVO]** | `backend/src/modules/m18-notificaciones/services/notificaciones.service.ts` | Orquestador de eventos transaccionales y despacho de notificaciones. |
| **[NUEVO]** | `backend/src/modules/m18-notificaciones/controllers/plantilla.controller.ts` | Controlador HTTP para la administración de plantillas. |
| **[NUEVO]** | `backend/src/modules/m18-notificaciones/controllers/notificaciones.controller.ts` | Controlador HTTP para eventos, bitácora y diagnóstico SMTP. |
| **[NUEVO]** | `backend/src/modules/m18-notificaciones/notificaciones.routes.ts` | Enrutador Express con inyección de dependencias y guardas de seguridad. |
| **[NUEVO]** | `backend/src/modules/m18-notificaciones/__tests__/m18.test.ts` | Suite de 22 pruebas de integración validando HU-NOT-01 a HU-NOT-04. |
| **[MODIFICADO]** | `backend/src/app.routes.ts` | Conexión autorizada del enrutador en `/notificaciones`. |
| **[MODIFICADO]** | `backend/package.json` y `package-lock.json` | Incorporación de dependencia autorizada `nodemailer` y `@types/nodemailer`. |

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `[ ✅ SÍ ]` (v1.8.0)
* **Pruebas de Calidad Superadas (QA Gate):** `[ ✅ SÍ ]` (22/22 pruebas aprobadas, `tsc --noEmit` limpio, `eslint` 0 errores)
* **Apego al Diagrama de Flujo:** `[ ✅ 100% Coincidente con Diagramas Oficiales HU-NOT-01 a HU-NOT-04 ]`
