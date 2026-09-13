# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

> 🏷️ **CONVENCIÓN DE NOMENCLATURA DEL ARCHIVO:**  
> Guardado en `docs/walkthroughs/M04/walkthrough_v2.1.2_M04_fix_password_google_validation_fullstack.md` con sufijo `fullstack` para certificar la corrección simétrica tanto en backend como en frontend.

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v2.1.2`
* **Tipo de Incremento:** `PATCH` (Corrección de validación de esquema DTO y reglas de seguridad de contraseñas con Google)
* **Módulo de Origen:** `M04 Cuentas, Autenticación y Perfil (Fullstack)`
* **Fecha de Entrega:** `2026-09-07`
* **Autor / Responsable:** `Arquitecto Fullstack de Integración End-to-End (AI Agent)`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. DESCRIPCIÓN DEL PROBLEMA Y RESOLUCIÓN

### Diagnóstico de la Causa Raíz
Al registrarse con Google e intentar establecer la contraseña de respaldo (`RF-CUE-02-04`), los usuarios experimentaban un "Error de validación de seguridad":
1. **Discrepancia en Backend DTO (`login.dto.ts`):** `completarPasswordGoogleSchema` exigía obligatoriamente `tokenTemporal: z.string().min(1)`. Sin embargo, el endpoint `/google` y el frontend nunca generaban ni transmitían ese token (el payload estándar es `{ correo, contrasena }`), provocando que Zod rechazara la petición con un `VALIDATION_ERROR` (400 Bad Request).
2. **Requisitos de Complejidad de Contraseña (`HU-SEG-01`):** `contrasenaSchema` del backend exige obligatoriamente un mínimo de 8 caracteres, al menos una mayúscula (`/[A-Z]/`), al menos una minúscula (`/[a-z]/`) y al menos un número (`/[0-9]/`). El frontend solo comprobaba `length >= 8`, por lo que contraseñas sin números o mayúsculas pasaban el frontend pero fallaban en el servidor.
3. **Manejo Oculto de Detalles de Error en Frontend:** El composable `useCuentas.ts` guardaba los detalles de validación en `erroresValidacion`, pero mantenía el mensaje general genérico en `errorMensaje`, no mostrando directamente la razón del rechazo al usuario.

### Soluciones Aplicadas
1. **Backend (`login.dto.ts`):** Se definió `tokenTemporal` como opcional (`z.string().optional()`), alineándolo con el contrato real y el servicio `AuthService.completarPasswordGoogle`.
2. **Frontend (`ModalLogin.vue` y `PasoDatos.vue`):**
   - Se implementaron validaciones pre-envío para longitud mínima (8), mayúscula, minúscula y número en `guardarPasswordInicial`.
   - Se incorporó texto explicativo de ayuda visual debajo del campo: *"Mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número."*
3. **Frontend (`useCuentas.ts`):**
   - Se mejoró `procesarErrorApi` para proyectar el mensaje específico de detalle (`apiError.error.details[0]?.message`) directamente en `errorMensaje` cuando ocurra un error de validación de API.

---

## 3. HISTORIAS DE USUARIO Y POLÍTICAS CUBIERTAS

| ID Historia / Política | Descripción | Estado de Cobertura | Endpoints / Componentes Integrados |
| :--- | :--- | :---: | :--- |
| **HU-CUE-02** | Registro y autenticación federada con Google Identity | **100% Cumplida** | `completarPasswordGoogleSchema`, `ModalLogin.vue`, `PasoDatos.vue` |
| **HU-SEG-01** | Política de complejidad y robustez de contraseñas | **100% Cumplida** | Sincronización de regex en frontend idéntica a `contrasenaSchema` |
| **Directiva 8** | Paleta institucional Design System Pintuclic | **100% Cumplida** | Tokens semánticos (`text-neutral-medium`, `text-corporate`, `bg-subaction`) |

---

## 4. EVIDENCIAS DE VALIDACIÓN TÉCNICA

- **Backend Linting:** `npm run lint` en `backend/` -> Código `0` (Cero errores, cero advertencias).
- **Backend TypeScript:** `npx tsc --noEmit` en `backend/` -> Código `0` (Cero errores).
- **Frontend Linting:** `npm run lint` en `frontend/` -> Código `0` (Cero errores, cero advertencias).
- **Frontend Build:** `vue-tsc -b && vite build` -> Código `0`, bundle de producción generado con éxito.

---

## 5. INVENTARIO DE ARCHIVOS MODIFICADOS

```text
backend/src/modules/m04-cuentas/dtos/
└── login.dto.ts              # tokenTemporal marcado como opcional en completarPasswordGoogleSchema

frontend/src/modules/m04-cuentas/
├── composables/
│   └── useCuentas.ts         # Proyección reactiva del mensaje específico en error.details
└── components/
    ├── ModalLogin.vue        # Validación HU-SEG-01 pre-envío y texto de ayuda
    └── PasoDatos.vue         # Validación HU-SEG-01 pre-envío y texto de ayuda

docs/
├── CHANGELOG.md              # Registro de versión v2.1.2
└── walkthroughs/M04/
    └── walkthrough_v2.1.2_M04_fix_password_google_validation_fullstack.md
```
