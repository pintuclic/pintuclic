# Protocolo y Guía de Desarrollo para Agentes de IA - PINTU CLIC

Bienvenido. Este repositorio contiene la especificación funcional, técnica, diagramas y políticas de negocio de la plataforma **Pintu Clic**.

Como agente de IA responsable de implementar código, pruebas o arquitectura para este sistema, **debes seguir estrictamente el siguiente flujo de trabajo**.

> ⛔ **DIRECTIVAS CRÍTICAS DE ALCANCE Y CONCURRENCIA (PRODUCT OWNER):**
> 1. **Aislamiento Estricto de Módulo:** Está terminantemente PROHIBIDO modificar o eliminar archivos, rutas o controladores existentes que pertenezcan a otros módulos o que estén siendo desarrollados por otros equipos. Tu código debe vivir exclusivamente dentro del módulo asignado.
> 2. **Lectura Obligatoria de Estructura de Carpetas (`backend/README.md` y `frontend/README.md`):** Antes de crear o editar cualquier archivo de código, el agente DEBE leer `backend/README.md` y `frontend/README.md` en la raíz del proyecto para ubicar los archivos respetando con precisión la estructura global definida para toda la organización.
> 3. **Protocolo de Parada e Informe de Inconsistencias:** Si para completar una HU consideras necesario modificar un archivo compartido o externo a tu módulo, **DEBES DETENER LA EJECUCIÓN INMEDIATAMENTE**, no realizar ningún cambio y presentar un reporte detallado al equipo humano explicando la inconsistencia o necesidad técnica. Solo podrás continuar tras recibir aprobación explícita.
> 4. **Objetivo 100% Funcional:** No reconstruyas la arquitectura global del backend ni del frontend. Concéntrate en cumplir al 100% los Criterios de Aceptación (CA) y Requisitos Funcionales (RF) de cada Historia de Usuario usando el stack tecnológico aprobado.
> 5. **Los Diagramas son Contratos de Flujo Obligatorios:** Los diagramas han sido diseñados y consensuados por todo el equipo de ingeniería. No son meras ilustraciones: **definen la máquina de estados, ramificaciones condicionales, secuencias de llamadas y manejo de errores exactos** que tu código debe respetar.
> 6. **Versionado Obligatorio y Walkthrough en CADA Implementación:** Tras CUALQUIER cambio o implementación de código, es MANDATORIO incrementar la versión semántica ([00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md](./00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md)), actualizar `CHANGELOG.md` y generar el Walkthrough de Implementación correspondiente.

---

## 🧭 Flujo de Trabajo Obligatorio para Implementar Cualquier Tarea / HU

```mermaid
graph TD
    A[Requerimiento / HU Solicitada] --> B[1. Consultar 00_SISTEMA/01_ARQUITECTURA/MATRIZ_TRAZABILIDAD.md]
    B --> C[2. Leer Especificación en 02_MODULOS_FUNCIONALES]
    C --> D[3. Inspección OBLIGATORIA de Diagramas en assets/diagrams/]
    D --> E[4. Leer Políticas Transversales en 01_TRANSVERSALES]
    E --> F[5. Leer backend/README.md y frontend/README.md]
    F --> G{¿Requiere tocar archivos de otros equipos?}
    G -- Sí --> H[🛑 PARAR Y REPORTAR AL EQUIPO]
    G -- No --> I[6. Diseñar e Implementar Código en el Módulo Asignado]
    I --> J[7. Validar Criterios de Aceptación y Diagrama]
    J --> K[8. Checklist de Políticas Globales 00_SISTEMA/03_PLANTILLAS_Y_CHECKLISTS/CHECKLIST_CIERRE_MODULOS.md]
    K --> L[9. Registrar Versión en CHANGELOG.md y Generar Walkthrough Oficial]
```

### Paso 1: Localización y Mapeo de Dependencias
- Identifica el código de la Historia de Usuario (ejemplo: `HU-CUE-01`, `HU-ADM-02`, etc.).
- Abre [00_SISTEMA/01_ARQUITECTURA/MATRIZ_TRAZABILIDAD.md](./00_SISTEMA/01_ARQUITECTURA/MATRIZ_TRAZABILIDAD.md) para determinar qué módulos transversales (`M20 Seguridad`, `M17 Permisos`, `M18 Notificaciones`) y qué **diagramas** aplican a esa historia.

### Paso 2: Lectura de la Especificación Funcional
- Abre el archivo correspondiente en `02_MODULOS_FUNCIONALES/` (por ejemplo, [02_MODULOS_FUNCIONALES/M04_CUENTAS_Y_PERFIL.md](./02_MODULOS_FUNCIONALES/M04_CUENTAS_Y_PERFIL.md)).
- Lee los **Requisitos Funcionales (RF)**, **Requisitos No Funcionales (RNF)** y los **Criterios de Aceptación (CA)**.

### Paso 3: Inspección OBLIGATORIA de Diagramas (Contrato de Flujo del Equipo)
Antes de escribir una sola línea de código, **debes abrir y analizar visualmente el diagrama asociado** en `assets/diagrams/M[XX]/`:
- **Árboles de Decisión y Bifurcaciones:** Revisa qué condiciones de validación (`if / else`) están diagramadas. Cada rama del diagrama debe tener su correspondiente lógica en el código.
- **Transición de Estados:** Si el diagrama define estados (ej: `Pendiente -> Aprobado -> Rechazado`), el código debe implementar exactamente esos nombres y transiciones.
- **Rutas de Error y Cancelación:** Presta especial atención a los caminos alternativos (qué pasa si el código de verificación expiró, qué pasa si el NIT ya existe, etc.).
- **Secuencia de Llamadas:** Respeta el orden de ejecución (ej: primero validar con Zod -> luego verificar existencia en BD -> luego generar hash BCrypt -> luego emitir evento SMTP).

### Paso 4: Cumplimiento de Políticas Transversales (¡Crítico!)
- **M20 - Seguridad y Auditoría ([01_TRANSVERSALES/M20_SEGURIDAD_Y_AUDITORIA.md](./01_TRANSVERSALES/M20_SEGURIDAD_Y_AUDITORIA.md)):**
  - **Credenciales (`HU-SEG-01`):** Nunca guardar ni comparar contraseñas en texto claro. Usar funciones de hash seguras con salt (BCrypt con costo 12).
  - **Sesiones y Tokens (`HU-SEG-02`):** Validar tiempos de expiración y manejo de tokens/cookies seguras (`HttpOnly`, `SameSite`, `Secure`).
  - **Autorización en Servidor (`HU-SEG-03`):** NUNCA confiar únicamente en la validación del frontend. Cada endpoint debe validar identidad y autorización en backend.
  - **Auditoría (`HU-SEG-04`):** Registrar eventos críticos (cambios de permisos, accesos administrativos, aprobaciones de empresas) con timestamp, actor y acción.
  - **Datos Sensibles (`HU-SEG-06`):** No retornar contraseñas, hashes ni datos sensibles en las respuestas JSON.
- **M17 - Permisos y Administración ([01_TRANSVERSALES/M17_PERMISOS_Y_ROLES.md](./01_TRANSVERSALES/M17_PERMISOS_Y_ROLES.md)):**
  - El sistema utiliza **permisos individuales por empleado** (sin roles predefinidos fijos). Comprobar el permiso específico en tiempo real ante cada operación (`HU-ADM-03`).
- **M18 - Notificaciones ([01_TRANSVERSALES/M18_NOTIFICACIONES.md](./01_TRANSVERSALES/M18_NOTIFICACIONES.md)):**
  - Para flujos que involucren códigos de verificación o confirmaciones, consumir la capa de eventos/notificaciones desacoplada por SMTP.

### Paso 5: Lectura Obligatoria de Estructura de Carpetas (`backend/README.md` y `frontend/README.md`)
Antes de crear o modificar cualquier archivo de código:
- **Backend:** Lee el archivo `backend/README.md` en la raíz del repositorio de código para ubicar rutas, controladores, servicios, repositorios Kysely y esquemas Zod en el directorio exacto asignado a tu módulo.
- **Frontend:** Lee el archivo `frontend/README.md` en la raíz del repositorio de código para estructurar vistas, componentes, llamadas a la API y estilos en el lugar correspondiente según las convenciones del proyecto.
- **Límites de Módulo:** Asegúrate de que todos los archivos nuevos se ubiquen dentro de la carpeta asignada a tu módulo, sin tocar archivos de otros equipos.

### Paso 6: Stack Backend Obligatorio y Reglas de Arquitectura
Todo código del backend generado para cualquier módulo DEBE ceñirse estrictamente al stack definido en [00_SISTEMA/01_ARQUITECTURA/ARQUITECTURA_BACKEND.md](./00_SISTEMA/01_ARQUITECTURA/ARQUITECTURA_BACKEND.md):
- **Lenguaje:** TypeScript estricto (`strict: true`, sin tipos `any`).
- **Framework HTTP:** Express.js estructurado en controladores y servicios dentro del módulo asignado.
- **Acceso a Base de Datos:** **Kysely** con tipado fuerte (nunca concatenar strings SQL ni usar queries sin tipar).
- **Validación de Entradas (DTOs):** **Zod** para validar `req.body`, `req.query`, `req.params`.
- **Autenticación y Sesiones:** **JWT** con tiempos de vida cortos y rotación segura.
- **Hashing de Contraseñas:** **BCrypt** con costo de sal mínimo de 12 (`HU-SEG-01`).
- **Comunicaciones:** **SMTP** estructurado en el módulo `M18` para notificaciones y códigos transaccionales.
- **Seguridad HTTP:** **CORS** restrictivo y cabeceras seguras.

### Paso 7: Validación de Criterios de Aceptación y Casos Borde
- Valida que cada HU cumpla tanto sus Criterios de Aceptación escritos (Gherkin) como los caminos de error trazados en el diagrama.

### Paso 8: Validación de Políticas Globales de Cierre (Definition of Done)
Antes de declarar el módulo finalizado, **DEBES comprobar el cumplimiento de las 3 políticas de integridad** definidas en [00_SISTEMA/03_PLANTILLAS_Y_CHECKLISTS/CHECKLIST_CIERRE_MODULOS.md](./00_SISTEMA/03_PLANTILLAS_Y_CHECKLISTS/CHECKLIST_CIERRE_MODULOS.md):
1. **Unicidad de Cuentas (`HU-CUE-08`):** [01_TRANSVERSALES/POLITICAS/politica_HU-CUE-08_unicidad_cuentas.md](./01_TRANSVERSALES/POLITICAS/politica_HU-CUE-08_unicidad_cuentas.md).
2. **Control de Acceso en Servidor (`HU-ADM-03`):** [01_TRANSVERSALES/POLITICAS/politica_HU-ADM-03_control_acceso_servidor.md](./01_TRANSVERSALES/POLITICAS/politica_HU-ADM-03_control_acceso_servidor.md).
3. **No Exposición de Datos Sensibles (`HU-SEG-06`):** [01_TRANSVERSALES/POLITICAS/politica_HU-SEG-06_no_exposicion_datos_sensibles.md](./01_TRANSVERSALES/POLITICAS/politica_HU-SEG-06_no_exposicion_datos_sensibles.md).

### Paso 9: Generación Obligatoria de Walkthrough y Actualización de Versión
Al completar la implementación, **DEBES SI O SI**:
1. **Calcular el Incremento SemVer:** Determinar si corresponde a `PATCH` (fix), `MINOR` (nueva HU/endpoint) o `MAJOR` (cierre de módulo/cambio estructural) según [00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md](./00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md).
2. **Actualizar `CHANGELOG.md`:** Registrar la entrada de la nueva versión con fecha, módulo, HUs cubiertas y resumen de cambios.
3. **Generar el Walkthrough de Implementación:** Crear el documento formal usando la estructura de [00_SISTEMA/03_PLANTILLAS_Y_CHECKLISTS/PLANTILLA_WALKTHROUGH_IMPLEMENTACION.md](./00_SISTEMA/03_PLANTILLAS_Y_CHECKLISTS/PLANTILLA_WALKTHROUGH_IMPLEMENTACION.md), detallando:
   - Módulo de origen y HUs completadas.
   - Reglas de negocio y políticas transversales validadas.
   - Criterios de Aceptación verificados.
   - **Resumen conceptual de dependencias externas** (qué necesita este código de otros módulos para operar al 100% en producción y a quién habilita).
   - Lista de archivos creados/modificados dentro del módulo asignado.

---

## 📂 Índice del Repositorio

- [CHANGELOG.md](./CHANGELOG.md): Registro central de versiones del proyecto.
- [00_SISTEMA/01_ARQUITECTURA/ARQUITECTURA_GENERAL.md](./00_SISTEMA/01_ARQUITECTURA/ARQUITECTURA_GENERAL.md): Resumen de dominios, actores, módulos y dependencias globales.
- [00_SISTEMA/01_ARQUITECTURA/ARQUITECTURA_BACKEND.md](./00_SISTEMA/01_ARQUITECTURA/ARQUITECTURA_BACKEND.md): Stack oficial, directivas de aislamiento y protocolo de parada.
- [00_SISTEMA/01_ARQUITECTURA/MATRIZ_TRAZABILIDAD.md](./00_SISTEMA/01_ARQUITECTURA/MATRIZ_TRAZABILIDAD.md): Mapeo directo entre Historias de Usuario, Transversales y Diagramas.
- [00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md](./00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md): Estándar de SemVer y protocolo de walkthroughs.
- [00_SISTEMA/02_GUIAS_Y_ESTANDARES/ESTANDAR_Y_GUIA_INCORPORACION.md](./00_SISTEMA/02_GUIAS_Y_ESTANDARES/ESTANDAR_Y_GUIA_INCORPORACION.md): Normativa para incorporar o refactorizar módulos futuros.
- [00_SISTEMA/03_PLANTILLAS_Y_CHECKLISTS/CHECKLIST_CIERRE_MODULOS.md](./00_SISTEMA/03_PLANTILLAS_Y_CHECKLISTS/CHECKLIST_CIERRE_MODULOS.md): Validación obligatoria de políticas globales antes de cerrar un módulo.
- [00_SISTEMA/03_PLANTILLAS_Y_CHECKLISTS/PLANTILLA_WALKTHROUGH_IMPLEMENTACION.md](./00_SISTEMA/03_PLANTILLAS_Y_CHECKLISTS/PLANTILLA_WALKTHROUGH_IMPLEMENTACION.md): Plantilla oficial de entrega post-implementación (.md y .docx).
- [00_SISTEMA/03_PLANTILLAS_Y_CHECKLISTS/PLANTILLA_REPORTE_QA_MODULO.md](./00_SISTEMA/03_PLANTILLAS_Y_CHECKLISTS/PLANTILLA_REPORTE_QA_MODULO.md): Plantilla estándar de informe de pruebas de calidad QA (.md y .docx).
- [01_TRANSVERSALES/M20_SEGURIDAD_Y_AUDITORIA.md](./01_TRANSVERSALES/M20_SEGURIDAD_Y_AUDITORIA.md): Especificación detallada de seguridad, sesiones y datos sensibles.
- [01_TRANSVERSALES/M17_PERMISOS_Y_ROLES.md](./01_TRANSVERSALES/M17_PERMISOS_Y_ROLES.md): Modelo de permisos granulares por empleado.
- [01_TRANSVERSALES/M18_NOTIFICACIONES.md](./01_TRANSVERSALES/M18_NOTIFICACIONES.md): Servicios de correo y notificaciones transaccionales.
- [01_TRANSVERSALES/POLITICAS/](./01_TRANSVERSALES/POLITICAS/): Políticas transversales de unicidad, control de servidor y datos sensibles.
- [02_MODULOS_FUNCIONALES/M04_CUENTAS_Y_PERFIL.md](./02_MODULOS_FUNCIONALES/M04_CUENTAS_Y_PERFIL.md): Cuentas particulares y empresas, login, registro, perfiles y direcciones.
- `assets/diagrams/`: Diagramas de arquitectura, flujo funcional y secuencia por módulo.
