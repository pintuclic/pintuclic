# WALKTHROUGH DE IMPLEMENTACIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.3.33.1`
* **Módulo de Origen:** `Core / Infraestructura (despliegue y base de datos)`
* **Fecha de Entrega:** `29/09/2026`
* **Autor / Responsable:** `Agente de IA`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **N/A (infraestructura)** | Carga automática del esquema y catálogo de la base de datos en el despliegue | **100% Cumplida** | Paso `Cargar esquema y catálogo en PostgreSQL` en `.github/workflows/deploy.yml` |

### Descripción del Alcance de la Versión
El workflow `Deploy` ahora ejecuta, después de levantar los contenedores y antes de verificar la
salud del backend, los scripts oficiales `bd/sql/schema_pintuclic.sql` y `bd/sql/seed_pintuclic.sql`
con `psql` dentro del contenedor `pintuclic-db`. Con esto la base de datos del VPS deja de quedar
vacía: se crean las tablas, ENUMs e índices, y se cargan el catálogo y las cuentas de prueba
(contraseñas ya almacenadas como hash BCrypt costo 12). Los scripts son idempotentes, por lo que el
paso puede repetirse en cada despliegue sin destruir datos.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas
- El paso corre **después** de `docker compose up -d --build`; el backend depende de `db` con
  `condition: service_healthy`, por lo que el contenedor ya está listo cuando se ejecuta el SQL.
- Se usa la redirección desde el host (`< bd/sql/...`) con `docker exec -i` para mantener stdin
  abierto.
- Las credenciales se toman del entorno del propio contenedor `db` (`$POSTGRES_USER`,
  `$POSTGRES_DB`), sin hardcodearlas en el workflow.
- `-v ON_ERROR_STOP=1` hace fallar el job ante cualquier error SQL, evitando despliegues "verdes"
  con la base a medio cargar.
- **Idempotencia:** DDL con `IF NOT EXISTS` y seed con `ON CONFLICT DO NOTHING`; no se ejecuta
  `DROP`, `TRUNCATE` ni `DELETE`. No se requiere borrar el volumen `pgdata`.

### B. Políticas Transversales Validadas
- 🔒 **M20 - Credenciales (`HU-SEG-01`):** El seed inserta los usuarios con hash BCrypt costo 12;
  ninguna contraseña se guarda en texto plano.
- 🧱 **Origen Único de Datos (Seed Centralizado):** los datos provienen exclusivamente de
  `bd/sql/seed_pintuclic.sql`; no se agregó auto-siembra en TypeScript ni arrays hardcodeados.
- ⚠️ **Riesgo residual aceptado:** las cuentas de prueba (`admin@pintuclic.co`, clave
  `Pintuclic2026`) quedan en un entorno público. Se recomienda cambiar la clave del administrador
  después de la primera carga.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-INF-01** | **Dado** el workflow, **Cuando** se ejecuta el deploy, **Entonces** se ejecutan `schema_pintuclic.sql` y `seed_pintuclic.sql` en ese orden. | Inspección del paso agregado en `deploy.yml` | ✅ **CUMPLIDO** |
| **CA-INF-02** | **Dado** una base ya inicializada, **Cuando** se repite el deploy, **Entonces** no falla ni duplica datos (scripts idempotentes). | Revisión de `IF NOT EXISTS` / `ON CONFLICT` | ✅ **CUMPLIDO** |
| **CA-INF-03** | **Dado** un error SQL, **Cuando** corre el paso, **Entonces** el job falla (`ON_ERROR_STOP=1`). | Inspección del comando | ✅ **CUMPLIDO** |
| **CA-INF-04** | **Dado** el deploy completo, **Cuando** termina, **Entonces** el catálogo y las cuentas del seed están en la BD. | ⏳ **PENDIENTE (validar en VPS con el run)** | ⏳ **PENDIENTE** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (¿De qué requiere para operar al 100% en Producción?)
- **Variables de GitHub:** `POSTGRES_USER` y `POSTGRES_DB` deben existir en *Repository variables*;
  sin ellas el servicio `db` no levanta y el compose falla antes de este paso.
- **Volumen `pgdata`:** no requiere recrearse; los scripts se aplican sobre la base existente.
- **Contenedor `pintuclic-db`:** el `container_name` debe mantenerse (el paso lo referencia por
  nombre).

### B. Dependencias Hacia Adelante (¿A qué otros módulos habilita este desarrollo?)
- **Todos los módulos con persistencia (M01, M02, M04, M05, M08, M17, M18, M20):** al quedar el
  esquema y el catálogo cargados en el VPS, los endpoints y vistas dejan de operar contra una base
  vacía.
- **Pruebas de login y administración:** habilitan el ingreso con las cuentas del seed.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ **Verificación de Límites de Módulo:** no se modificó código de `backend/src` ni
> `frontend/src`, ni archivos compartidos de `bd/`. Alcance exclusivamente de infraestructura y
> documentación.

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `.github/workflows/deploy.yml` | Nuevo paso de carga de esquema y catálogo con `psql` en el contenedor `db`. |
| **[MODIFICADO]** | `.github/version.txt` | Bump a `0.3.33.1`. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada de la versión `v0.3.33.1`. |
| **[NUEVO]** | `docs/walkthroughs/core/walkthrough_v0.3.33.1_core_carga_bd_en_deploy.md` | Este documento. |

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `⏳ PENDIENTE` — requiere ejecutar el workflow `Deploy` en el VPS y confirmar los conteos del seed.
* **Apego al Diagrama de Flujo:** `N/A — cambio de infraestructura, sin diagrama funcional asociado`
