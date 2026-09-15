# Walkthrough — Preparación Git y despliegue

## 1. Metadatos

- Versión: v2.2.6, PATCH. Fecha: 14/09/2026. Responsable: Codex.
- Alcance: M17 frontend y configuración compartida de Git, CI y despliegue.
- Autorización: el usuario pidió resolver las diferencias detectadas y recibir el informe antes de subir. No se autoriza push en esta entrega.

## 2. Historias y comportamiento

Se conserva la interfaz móvil v2.2.5. Los servicios usados por HU-ADM-01/02/04/05/06 consultan la API real y propagan sus errores. Se retiran el flag demo, el snapshot de datos y su generador, las escrituras en memoria y el historial de actividad simulado. Esto no certifica nuevas HUs ni sustituye la auditoría del servidor.

La integración anterior y la adaptación móvil se registran primero en un commit local v2.2.5. La preparación v2.2.6 incorpora versión de release verificable, validaciones de CI, guía de despliegue y exclusión de respaldos/temporales. La reconciliación de historiales preserva los commits del sitio estático y mantiene el árbol modular en la rama de trabajo; main remoto no se modifica.

## 3. Reglas y políticas

- HU-CUE-08: la unicidad se resuelve en backend; no existe registro alternativo en memoria.
- HU-ADM-03: sesión y permisos se consultan en servidor; ya no se genera una sesión administradora local.
- HU-SEG-06: pruebas derivadas del SQL central solo extraen datos públicos. No se incorporan secretos a los paquetes.
- M18: los envíos siguen siendo responsabilidad del backend y SMTP.
- Guía de mocks: SQL central es el origen; no quedan fixtures JSON de runtime.
- Convención Git: commits locales con tipo, alcance y versión; ningún push, force push, tag remoto o despliegue.

## 4. Validaciones

Instalación limpia con `npm ci` en copias aisladas, usando Node **22.23.2**:

| Comprobación | Resultado |
| --- | --- |
| Frontend: ESLint con cero advertencias | Correcto |
| Frontend: pruebas M17 | 8/8 correctas |
| Frontend: vue-tsc y build de Vite | Correcto |
| Backend: ESLint con cero advertencias, tsc --noEmit y compilación | Correcto |
| Backend: suites existentes M04 y M18, ejecutadas sobre dist | 30/30 y 22/22 correctas; sin conexión SMTP real |
| Control de versión/release | 4/4 pruebas correctas y versión v2.2.6 verificada |
| Tres workflows | YAML válido y estructura básica comprobada |

CI añade construcción de contenedores en Linux; Docker no está instalado localmente y esa validación no puede darse por ejecutada antes de subir. No se ejecutaron workflows remotos ni se verificó el servidor.

`npm ci` no encontró vulnerabilidades en frontend. En backend, `npm audit` detectó una vulnerabilidad moderada en la dependencia transitiva **qs** (avisos GHSA-x5fp-wj9c-mxmx y GHSA-4mjr-xmp4-gh2g). Es previa a esta corrección y debe resolverse antes del despliegue productivo; no se alteraron dependencias backend como parte de esta preparación.

Las pruebas frontend verifican contratos HTTP incluso con el antiguo flag demo activado, protección de administrador, respuesta ante permisos inexistentes, paginación hasta respuesta vacía y propagación de errores sin fallback local. Las pruebas de integración conservan validación de rutas, DTOs y separación de stores.

## 5. Dependencias y despliegue

`DEPLOY.md` documenta el stack modular, configuración de servidor, preparación de esquema, seed exclusivo de pruebas, dominio/TLS, controles de salud y reversión. El sitio estático de main requería otra configuración Dokploy; la propuesta de integración cambia el tipo de aplicación y necesita preparar el servidor antes de desplegar.

Calidad usa Node 22, npm ci, lint sin advertencias, pruebas M17 y compilación frontend/backend. Deploy y Zip Release dependen de Calidad y solo ejecutan en main. No se aprovisionaron runner, secretos, dominio ni PostgreSQL.

## 6. Archivos

- `.gitignore`, `frontend/.dockerignore`, `README.md`, `DEPLOY.md`.
- `.github/workflows/{quality,deploy,zip-release}.yml`, `.github/scripts/check-release.mjs`.
- `frontend/package.json`, `frontend/package-lock.json`, `docs/CHANGELOG.md`, este walkthrough.
- M17: `services/m17.service.ts`, `store/useM17.ts`, `M17Shell.vue`, `interfaces/index.ts`, README, vistas Dashboard/Configuration/Profile/EmployeeForm/Permissions y StatusModal.
- Pruebas M17: integración actualizada, `service-api.test.mjs`, lector del seed central. Se elimina la prueba del servicio demo, sustituida por prueba de contrato API.
- Eliminados: `assets/seed-preview.json` y `scripts/generate-preview.py` de M17.

## 7. Entrega

Versión sincronizada en v2.2.6. La subida queda pendiente de que el usuario reciba y apruebe el informe. Los archivos históricos del sitio estático siguen disponibles en Git; no se borran respaldos del disco ni se tocan archivos de `docs/reviews/`.
