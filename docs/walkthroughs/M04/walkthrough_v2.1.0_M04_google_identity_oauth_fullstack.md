# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

> 🏷️ **CONVENCIÓN DE NOMENCLATURA DEL ARCHIVO:**  
> Guardado en `docs/walkthroughs/M04/walkthrough_v2.1.0_M04_google_identity_oauth_fullstack.md` con sufijo `fullstack` para certificar la orquestación e integración simétrica de extremo a extremo (E2E).

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v2.1.0`
* **Tipo de Incremento:** `MINOR` (Nueva funcionalidad transversal: Integración real de Google Identity Services OAuth 2.0 / GSI fullstack)
* **Módulo de Origen:** `M04 Cuentas, Autenticación y Perfil (Google Identity OAuth Fullstack)`
* **Fecha de Entrega:** `2026-09-07`
* **Autor / Responsable:** `Arquitecto Fullstack de Integración End-to-End (AI Agent)`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Integrados E2E |
| :--- | :--- | :---: | :--- |
| **HU-CUE-02** | Registro y acceso mediante Google Identity Services | **100% Cumplida** | `POST /api/cuentas/google`<br>`POST /api/cuentas/google/vincular`<br>`POST /api/cuentas/google/completar-password`<br>`ModalLogin.vue` / `useCuentas.ts` / `CuentasRepository` |

### Descripción del Alcance de la Versión
Esta versión marca el paso a **`v2.1.0` (MINOR)** al incorporar la integración completa y segura de autenticación federada con **Google Identity Services (OAuth 2.0 / GSI)** en el módulo M04, resolviendo:

1. **Validación Criptográfica en Backend:** Uso de `google-auth-library` (`OAuth2Client.verifyIdToken()`) para autenticar tokens emitidos por Google verificando firma, audiencia (`GOOGLE_CLIENT_ID`) y tiempo de vida.
2. **Persistencia en PostgreSQL (`usuario_identidad_externa`):** Eliminación del almacenamiento volátil en memoria y migración a la tabla oficial de la base de datos relacional mediante Kysely.
3. **Flujos de Negocio Completos de HU-CUE-02:**
   - **Login Directo (`CA-CUE-02-05`):** Acceso inmediato si la cuenta ya está vinculada a Google.
   - **Sugerencia de Vinculación (`RF-CUE-02-03` / `CA-CUE-02-02`):** Si el correo coincide con una cuenta previa creada por formulario, se ofrece confirmación explícita al usuario para vincularla sin sobrescribir ni duplicar la cuenta.
   - **Contraseña de Respaldo (`RF-CUE-02-04` / `CA-CUE-02-04`):** Creación de contraseña propia tras registrarse con Google para contar con ambas vías de acceso.
4. **Protección Total de Credenciales (Cero Secretos en Git):** Lectura desacoplada de `GOOGLE_CLIENT_ID` y `VITE_GOOGLE_CLIENT_ID` desde el entorno del host (VPS), inyectadas mediante `env_file` y build args en Docker.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo
- **Unicidad de Cuenta (`HU-CUE-08` / `RF-CUE-08-01`):** No se generan cuentas duplicadas cuando el correo de Google coincide con uno ya registrado.
- **Acceso Indistinto (`RF-CUE-02-05` / `CA-CUE-02-05`):** Una cuenta vinculada puede autenticarse indistintamente mediante su contraseña tradicional o su cuenta de Google.
- **Doble Vía de Acceso (`RF-CUE-02-04`):** El usuario registrado con Google puede registrar una contraseña propia para no depender exclusivamente de la disponibilidad del proveedor externo.

### B. Políticas Transversales Validadas
- 🔒 **M20 - Hashing y Credenciales (`HU-SEG-01`):** Contraseñas procesadas exclusivamente en el servidor mediante BCrypt con costo de sal 12.
- 🛡️ **M20 - Sesiones Seguras (`HU-SEG-02`):** Apertura de sesión formal en la tabla `sesion` de PostgreSQL con UUID, clasificación de rol y firma de JWT (Access y Refresh).
- 👁️ **M20 - Mínima Exposición de Datos (`HU-SEG-06`):** Sanitización estricta de objetos de usuario antes de salir del backend, sin revelar contraseñas ni metadatos sensibles.
- 🎨 **Design System Oficial (Directiva 8):** Los componentes visuales de vinculación y contraseña en `ModalLogin.vue` utilizan estrictamente tokens semánticos institucionales (`corporate`, `action`, `subaction`, `neutral-*`).

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

### 🔹 M04: Google Identity OAuth2 Fullstack

| ID Criterio | Criterio de Aceptación (Gherkin) | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-CUE-02-01** | **Dado que** un visitante sin cuenta autoriza el acceso con Google...<br>**Cuando** el proveedor entrega la identidad...<br>**Entonces** el sistema crea la cuenta en estado activo y solicita crear contraseña de respaldo. | `AuthService.autenticarConGoogle()` retornando `requiere_password_inicial` | ✅ **CUMPLIDO** |
| **CA-CUE-02-02** | **Dado que** el correo de Google coincide con una cuenta previa...<br>**Cuando** se recibe la credencial...<br>**Entonces** el sistema sugiere vincular en lugar de crearla automáticamente. | `AuthService.autenticarConGoogle()` retornando `sugerencia_vinculacion` | ✅ **CUMPLIDO** |
| **CA-CUE-02-03** | **Dado que** el usuario confirma la sugerencia de vinculación...<br>**Cuando** envía la confirmación...<br>**Entonces** el sistema asocia Google a la cuenta existente y abre sesión activa. | `AuthService.confirmarVinculacionGoogle()` persistiendo en `usuario_identidad_externa` | ✅ **CUMPLIDO** |
| **CA-CUE-02-04** | **Dado que** el usuario completa su contraseña inicial tras alta con Google...<br>**Cuando** la envía...<br>**Entonces** el sistema actualiza la contraseña con BCrypt y concede acceso. | `AuthService.completarPasswordGoogle()` y apertura de sesión | ✅ **CUMPLIDO** |
| **CA-CUE-02-05** | **Dado que** una cuenta ya está vinculada a Google...<br>**Cuando** se autentica con Google...<br>**Entonces** el sistema concede acceso directo sin pasos intermedios. | `AuthService.autenticarConGoogle()` retornando `login_exitoso` con JWT | ✅ **CUMPLIDO** |

---

## 5. EVIDENCIAS DE VALIDACIÓN TÉCNICA

### A. Backend (`backend/`)
- **Compilación TypeScript:** `npx tsc --noEmit` -> Código de salida `0` (Cero errores).
- **Linter:** `npm run lint` -> `0` errores y `0` advertencias en todo `src/`.
- **Suite de Pruebas Automatizadas:** `npx tsx src/modules/m04-cuentas/__tests__/m04.test.ts`
  - **Resultados:** `30 Superadas | 0 Fallidas`.
  - Cobertura completa de los casos borde de Google (`CA-CUE-02-02`, `CA-CUE-02-05`).

### B. Frontend (`frontend/`)
- **Linter:** `npm run lint` -> Código de salida `0` (Cero errores y cero advertencias).
- **Compilación de Producción:** `npm run build` (`vue-tsc -b && vite build`) -> Código de salida `0`. Bundle estático generado con éxito.

---

## 6. INVENTARIO DE ARCHIVOS MODIFICADOS

```text
backend/
├── package.json                                       # Adición de google-auth-library
├── package-lock.json                                  # Lockfile actualizado
├── src/
│   └── modules/
│       └── m04-cuentas/
│           ├── repositories/
│           │   └── cuentas.repository.ts              # Métodos para usuario_identidad_externa
│           ├── services/
│           │   └── auth.service.ts                    # Validación OAuth2Client y persistencia PostgreSQL
│           └── __tests__/
│               └── m04.test.ts                        # Suite de pruebas unitarias actualizada

frontend/
├── Dockerfile                                         # Inyección de VITE_GOOGLE_CLIENT_ID en build
├── index.html                                         # Carga asíncrona de Google Identity Services
├── src/
│   ├── vite-env.d.ts                                  # Tipado de VITE_GOOGLE_CLIENT_ID y window.google
│   └── modules/
│       └── m04-cuentas/
│           ├── interfaces/
│           │   └── registro.interface.ts              # Contratos de datos tipados para Google
│           ├── services/
│           │   └── cuentas.service.ts                 # Métodos de API para Google OAuth
│           ├── composables/
│           │   └── useCuentas.ts                      # Orquestador reactivo de estados de Google
│           └── components/
│               └── ModalLogin.vue                     # Componente visual con flujo de Google

Infraestructura y Raíz/
├── .env.example                                       # Documentación de GOOGLE_CLIENT_ID sin secretos
├── docker-compose.dev.yml                             # env_file en backend y build args en frontend
└── docker-compose.yml                                 # env_file en backend y build args en frontend
```

---

## 7. GUÍA DE DESPLIEGUE EN EL VPS

Para activar el servicio con las credenciales protegidas en tu servidor:

1. **Configurar el archivo `.env` en la raíz del VPS (`nano .env`):**
   ```dotenv
   # Google Identity Services (OAuth 2.0)
   GOOGLE_CLIENT_ID=tu_cliente_id.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_ID=tu_cliente_id.apps.googleusercontent.com
   ```
2. **Reconstruir y desplegar los contenedores:**
   ```bash
   docker compose -f docker-compose.dev.yml up -d --build
   ```
3. Las credenciales quedarán seguras en el VPS sin exponerse en el código del repositorio.
