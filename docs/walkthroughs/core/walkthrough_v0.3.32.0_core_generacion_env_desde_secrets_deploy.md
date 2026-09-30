# WALKTHROUGH DE IMPLEMENTACIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.3.32.1`
* **Módulo de Origen:** `Core / Infraestructura y CI/CD (despliegue transversal)`
* **Fecha de Entrega:** `28/09/2026`
* **Autor / Responsable:** `Agente de IA`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **N/A (deuda técnica / infra)** | Generación del `.env` de producción desde GitHub Secrets en el despliegue | **100% Cumplida** | Job `Deploy` en `.github/workflows/deploy.yml` |

### Descripción del Alcance de la Versión
Se sustituye el paso que exigía un archivo `.env` creado manualmente en el VPS por un paso que lo
genera en tiempo de despliegue a partir de los **Repository secrets** (credenciales) y
**Repository variables** (configuración no sensible) de GitHub. Con ello, ninguna clave queda
expuesta en el repositorio, en el historial de Git ni en los logs del runner, y el servidor deja de
depender de una configuración manual no auditable. La generación se limita a las **17 variables
exactas** de `.env.example`; el resto de parámetros usan los valores por defecto del código.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas
- El `.env` se regenera en **cada** despliegue; la única fuente de verdad son los Secrets y
  Variables del repositorio.
- El archivo se escribe con `umask 077` y permisos `chmod 600` (solo lectura/escritura del usuario
  del runner).
- Si falta cualquiera de los secretos críticos (`POSTGRES_PASSWORD`, `JWT_SECRET`,
  `JWT_REFRESH_SECRET`, `SMTP_PASS`), el despliegue **falla antes** de levantar contenedores y
  lista el nombre de las variables ausentes (nunca su valor).
- El workflow solo se dispara con push a `develop` o de forma manual (`workflow_dispatch`).

### B. Políticas Transversales Validadas
- 🔒 **M20 - Gestión de Credenciales (`HU-SEG-01`):** Las claves de firma JWT y las contraseñas de
  base de datos y SMTP se inyectan desde almacenamiento cifrado de GitHub; no se versionan.
- 👁️ **M20 - Mínima Exposición (`HU-SEG-06`):** Los valores sensibles nunca se imprimen; GitHub los
  enmascara además en los logs. El paso solo reporta la cantidad de variables generadas.
- 🛡️ **M20 - Configuración de Producción:** `NODE_ENV=production` ya lo fija `backend/Dockerfile`,
  garantizando mensajes de error genéricos en producción aunque no se defina en el `.env`.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-INF-01** | **Dado** que los secretos y variables están configurados en GitHub, **Cuando** se ejecuta el job `Deploy`, **Entonces** el `.env` se genera en la raíz del workspace sin valores hardcodeados en el repositorio. | Revisión del workflow y ejecución manual | ✅ **CUMPLIDO** |
| **CA-INF-02** | **Dado** que falta un secreto crítico, **Cuando** corre el job, **Entonces** falla antes de `docker compose up` indicando el nombre faltante. | Validación de la lista de secretos requeridos | ✅ **CUMPLIDO** |
| **CA-INF-03** | **Dado** el `.env` generado, **Cuando** se inspeccionan sus permisos, **Entonces** es `600` y pertenece al usuario del runner. | `umask 077` + `chmod 600` | ✅ **CUMPLIDO** |
| **CA-INF-04** | **Dado** un push a `develop`, **Cuando** finaliza el build, **Entonces** el backend responde en `/api/health`. | Paso de verificación de salud existente | ✅ **CUMPLIDO** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (¿De qué requiere para operar al 100% en Producción?)
- **Runner self-hosted en el VPS:** el job corre dentro del VPS, por lo que no se requiere SSH; se
  necesita Docker con permisos para el usuario del runner.
- **Configuración en GitHub:** los *Repository secrets* (`POSTGRES_PASSWORD`, `JWT_SECRET`,
  `JWT_REFRESH_SECRET`, `SMTP_PASS`) y las *Repository variables* de las 17 claves de
  `.env.example` deben existir antes del primer despliegue.
- **Publicación web:** la exposición del stack (Nginx del host, dominio y TLS) se gestiona fuera de
  este workflow; al servirse el frontend y la API bajo el mismo dominio, no se requiere
  `ALLOWED_ORIGINS`.

### B. Dependencias Hacia Adelante (¿A qué otros módulos habilita este desarrollo?)
- **Todos los módulos (M01–M20):** el pipeline entrega el entorno de producción de forma
  reproducible y sin secretos expuestos, habilitando despliegues seguros de cualquier módulo.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ **Verificación de Límites de Módulo:** no se modificó código de `backend/src` ni
> `frontend/src`; el alcance es exclusivamente de infraestructura y documentación.

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `.github/workflows/deploy.yml` | Paso de validación reemplazado por generación de `.env` desde Secrets/Variables (17 claves de `.env.example`). |
| **[MODIFICADO]** | `README.md` | Sección de despliegue actualizada (CI/CD y ubicación de secretos). |
| **[MODIFICADO]** | `.github/version.txt` | Bump a `0.3.32.1`. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entradas de las versiones `v0.3.32.0` y `v0.3.32.1`. |
| **[NUEVO]** | `docs/walkthroughs/core/walkthrough_v0.3.32.0_core_generacion_env_desde_secrets_deploy.md` | Este documento. |

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` (validado por ejecución `workflow_dispatch`)
* **Apego al Diagrama de Flujo:** `N/A — cambio de infraestructura, sin diagrama funcional asociado`
