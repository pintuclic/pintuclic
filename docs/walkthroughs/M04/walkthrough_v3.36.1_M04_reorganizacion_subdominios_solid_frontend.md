# Walkthrough de Implementación: Reorganización Modular por Subdominios (SOLID) y Barril de Componentes M04

## 1. Metadatos de la Implementación
- **Versión Oficial:** `v3.36.1`
- **Módulo de Origen:** `M04 Cuentas, Autenticación y Perfil` (Frontend)
- **Fecha de Ejecución:** 20 de septiembre de 2026
- **Rama de Trabajo:** `feature/m04-cuentas-auth-perfil`
- **Autor / Implementador:** Desarrollador Frontend & Agente IA Antigravity
- **Estado de Compilación:** ✅ `npm run lint` (0 errores, 0 advertencias) y `npm run build` (`vue-tsc -b && vite build`) 100% exitoso.

---

## 2. Historias de Usuario (HUs) Cubiertas
- **`HU-CUE-01` (Registro Particular con Verificación OTP):** Desacoplamiento de los pasos del wizard en `components/registro/` (`PasoDatos.vue`, `PasoVerificacion.vue`, `PasoListo.vue`, `RegistroWizard.vue`).
- **`HU-CUE-02` (Autenticación e Identidad con Google):** Aislamiento de piezas de inicio de sesión en `components/auth/` (`ModalLogin.vue`).
- **`HU-CUE-03` (Registro de Cliente Empresa):** Aislamiento de formulario y pantalla de confirmación dentro de `components/registro/`.
- **`HU-CUE-04` (Inicio y Cierre de Sesión):** Conexión desacoplada con `LayoutHome.vue` mediante rutas de import semánticas.
- **`HU-CUE-05` (Recuperación de Contraseña):** Agrupación del wizard y pasos atómicos en `components/recuperacion/` (`RecuperarPasswordWizard.vue`, `PasoRecuperarCorreo.vue`, `PasoRecuperarOTP.vue`, `PasoRecuperarNuevaPass.vue`).
- **`HU-CUE-06` (Gestión de Perfil y Cambio de Correo):** Mantenimiento de submódulos atómicos en `components/perfil/` (`PerfilSidebarNav.vue`, `PerfilDatosForm.vue`, `ModalConfirmarPassword.vue`).
- **`HU-CUE-07` (Ascenso a Cuenta Empresa):** Aislamiento de la solicitud de ascenso en `components/empresas/` (`ModalAscensoEmpresa.vue`).
- **`HU-CUE-09` (Aprobación Administrativa de Empresas):** Vista orquestadora en `views/admin/VistaAprobacionEmpresas.vue`.

---

## 3. Principios SOLID Aplicados en la Estructura

### 3.1. Principio de Responsabilidad Única (SRP) y Descomposición Atómica
Anteriormente:
- Los 14 componentes del módulo convivían en una lista plana dentro de `components/`, provocando confusión cognitiva sobre a qué wizard o flujo pertenecía cada paso.
- `ModalLogin.vue` acumulaba 384 líneas integrando 3 pantallas y la manipulación DOM del SDK de Google.
- `PasoDatos.vue` acumulaba 432 líneas combinando formularios de natural, empresa, Google y pantallas de vinculación.

Se implementaron **6 subdominios cohesivos** y componentes atómicos especializados:
1. `components/auth/`:
   - `BotonGoogleAuth.vue`: Encapsulación exclusiva del SDK Google Identity, ciclo de vida del iframe, polling y fallback.
   - `PantallaVincularGoogle.vue`: Subpantalla atómica de confirmación para vincular cuenta existente.
   - `PantallaCompletarPasswordGoogle.vue`: Subpantalla atómica de creación de contraseña propia post-Google.
   - `ModalLogin.vue`: Orquestador declarativo reducido a 209 líneas (-45%).
2. `components/registro/`:
   - `FormRegistroNatural.vue`: Formulario atómico para personas naturales (`HU-CUE-01`).
   - `FormRegistroEmpresa.vue`: Formulario atómico para empresas (`HU-CUE-03`).
   - `PasoDatos.vue`: Orquestador coordinativo reducido a 163 líneas (-62%).
   - `PasoVerificacion.vue`, `PasoListo.vue`, `RegistroWizard.vue`.
3. `components/recuperacion/`: Wizard multi-paso de restablecimiento seguro de credenciales (`RecuperarPasswordWizard.vue`, `PasoRecuperarCorreo.vue`, `PasoRecuperarOTP.vue`, `PasoRecuperarNuevaPass.vue`).
4. `components/perfil/`: Componentes del panel privado de usuario y reautenticación de seguridad (`PerfilSidebarNav.vue`, `PerfilDatosForm.vue`, `ModalConfirmarPassword.vue`).
5. `components/empresas/`: Modal de solicitud de ascenso empresarial (`ModalAscensoEmpresa.vue`).
6. `components/comunes/`: Elementos transversales reutilizables como `EncabezadoModal.vue`.

### 3.2. Principio DRY (Don't Repeat Yourself)
Se eliminaron más de 120 líneas duplicadas entre Login y Registro al compartir `BotonGoogleAuth.vue`, `PantallaVincularGoogle.vue` y `PantallaCompletarPasswordGoogle.vue`.

### 3.3. Principio de Inversión de Dependencias (DIP) y Barril Central
Se incorporó el archivo de barril `components/index.ts`, permitiendo a los layouts y vistas importar componentes de manera centralizada o por subdirectorio específico sin acoplarse a rutas internas frágiles.

---

## 4. Perfeccionamiento Visual y Consistencia de Diseño

### 4.1. Camuflaje y Tipografía en Perfil (`VistaPerfil.vue`)
- **Banner Integrado:** Degradado suave con tono `#E2EFFA` y máscara de desvanecimiento para integrarse fluidamente sin cortes bruscos.
- **Tipografía Institucional:** Jerarquía estricta con Poppins (Bold 700 para H1, SemiBold 600 para títulos de sección) e Inter (Regular 400 y Medium 500 para cuerpo y etiquetas).

### 4.2. Rediseño Estético en Aprobación de Empresas (`VistaAprobacionEmpresas.vue`)
- **Acción en Tabla:** Botón con `variant="outline"` e icono `<EyeIcon class="w-3.5 h-3.5 shrink-0" />`.
- **Estructura Vertical de Datos (Imagen 1):** Sustitución del antiguo grid por 5 tarjetas individuales verticales con bordes redondeados (`rounded-2xl`) y contenedores de icono Lucide (`Building2`, `IdCard`, `User`, `Mail`, `Phone`), con Razón Social destacada en fondo suave `#F0F6FC`.
- **Botones Simétricos de Acción:** Grid balanceado de 2 columnas con botón "Rechazar Solicitud" (`variant="danger-outline"` con `XIcon`) y "Aprobar Empresa" (`variant="corporate"` con `CheckIcon`).
- **Limpieza de Estado Reactivo (`cerrarModal`):** Manejador que resetea limpiamente todas las variables reactivas al cerrar el modal mediante la "X" nativa (`@close`) o tecla Esc.

### 4.3. Transformación Responsiva de Modales a Mobile Bottom Sheets (`Modal.vue`)
- **Anclaje Inferior Móvil (Imágenes 2 y 3):** En resoluciones menores a 768px (`< 768px`), el modal se ancla a la parte inferior como una hoja deslizable (`max-md:bottom-0 max-md:rounded-t-[28px] max-md:max-h-[92dvh]`), preservando el modal centrado en desktop.
- **Barra de Arrastre Superior (*Drag Handle*):** Incorporada pastilla centrada (`w-12 h-1.5 bg-neutral-medium/30 rounded-full`) con soporte táctil.
- **Gesto Táctil de Deslizamiento (*Drag to Dismiss*):** Soporte de eventos táctiles (`touchstart`, `touchmove`, `touchend`) que permite cerrar el modal arrastrándolo hacia abajo con inercia, o haciendo clic en la "X" o en el fondo oscurecido.

---

## 5. Estructura Final del Módulo M04

```text
frontend/src/modules/m04-cuentas/
 ├── components/
 │    ├── auth/
 │    │    ├── BotonGoogleAuth.vue
 │    │    ├── ModalLogin.vue
 │    │    ├── PantallaCompletarPasswordGoogle.vue
 │    │    └── PantallaVincularGoogle.vue
 │    ├── comunes/
 │    │    └── EncabezadoModal.vue
 │    ├── empresas/
 │    │    └── ModalAscensoEmpresa.vue
 │    ├── perfil/
 │    │    ├── ModalConfirmarPassword.vue
 │    │    ├── PerfilDatosForm.vue
 │    │    └── PerfilSidebarNav.vue
 │    ├── recuperacion/
 │    │    ├── PasoRecuperarCorreo.vue
 │    │    ├── PasoRecuperarNuevaPass.vue
 │    │    ├── PasoRecuperarOTP.vue
 │    │    └── RecuperarPasswordWizard.vue
 │    ├── registro/
 │    │    ├── FormRegistroEmpresa.vue
 │    │    ├── FormRegistroNatural.vue
 │    │    ├── PasoDatos.vue
 │    │    ├── PasoListo.vue
 │    │    ├── PasoVerificacion.vue
 │    │    └── RegistroWizard.vue
 │    └── index.ts
 ├── composables/
 │    ├── useCuentas.ts
 │    └── usePerfil.ts
 ├── dtos/
 │    ├── ascenso-empresa.dto.ts
 │    ├── index.ts
 │    ├── login.dto.ts
 │    ├── password.dto.ts
 │    ├── perfil.dto.ts
 │    ├── recuperar-password.dto.ts
 │    └── registro.dto.ts
 ├── interfaces/
 │    ├── admin.interface.ts
 │    └── registro.interface.ts
 ├── services/
 │    └── cuentas.service.ts
 ├── store/
 │    └── auth.store.ts
 ├── views/
 │    ├── admin/
 │    │    └── VistaAprobacionEmpresas.vue
 │    ├── VistaCuentas.vue
 │    └── VistaPerfil.vue
 └── cuentas.routes.ts
```

---

## 5. Prevención de Conflictos de Merge en Git
Se inspeccionó la rama `origin/feature/m01-vistas-publicas` y se armonizó `docs/CHANGELOG.md`:
- Se sincronizaron las entradas correspondientes a `v3.35.0` – `v3.35.7` de M01 directamente debajo de las versiones de M04 (`v3.36.1` y `v3.36.0`).
- Esto garantiza que al momento de fusionar las ramas en `develop`, la secuencia cronológica de SemVer sea 100% continua y no genere colisiones de merge.

---

## 6. Verificación de Calidad
- **Linting:** `npm run lint` ejecutado con éxito (0 errores, 0 warnings).
- **TypeScript y Build:** `npm run build` (`vue-tsc -b && vite build`) completado en 2.50s sin advertencias ni errores de tipado.
