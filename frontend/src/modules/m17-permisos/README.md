# 🛡️ Módulo M17 - Administración, Empleados y Permisos (Frontend)

## Integración local vigente — v2.2.5

El módulo se monta bajo `/admin` dentro de `core/layouts/LayoutAdmin.vue` y usa el router global de `core/routes/index.ts`. No crea otro router ni duplica el layout.

- Adaptación móvil: menú accesible con cierre al navegar, listados con `Table mobile-cards` por debajo de 640 px, paginación y formularios apilados. Ver [walkthrough v2.2.5](../../../../docs/walkthroughs/M17/walkthrough_v2.2.5_M17_responsivo_movil_frontend.md).

- UI compartida: importar desde `@/core/components`; botones, tablas, badges, iconos, modales, drawer, paginación, mensajes y encabezados residen en sus categorías de core.
- Las acciones de icono de empleados y clientes usan `IconButton` global de `core/components/buttons/`, tanto para enlaces como para botones.
- La ficha lateral de cliente usa el `Drawer` global, que entra desde la derecha y anima su salida antes de cerrar.
- El menú administrativo tiene una sola entrada de perfil, `/admin/perfil`; la ruta histórica `/admin/administrador` redirige allí.
- UI de negocio: `components/EstadoBadge.vue` y `components/StatusModal.vue` permanecen en M17.
- Estado: Pinia en `store/useM17.ts`. Contratos sin runtime en `interfaces/`; validaciones en `dtos/`; llamadas HTTP en `services/` usando Axios global.
- Para ejecutar, usar la carpeta `frontend/` de la raíz. `npm run dev`; abrir `/admin`. Activar `VITE_M17_DEMO=true` únicamente en la terminal de desarrollo para probar sin backend. Por defecto se consulta la sesión real en `/seguridad/sesion`.
- Verificación: `npm run build`, `npm run lint -- --max-warnings=0` y `npm run test:m17`.
- [Mapa completo de archivos y respaldo local](../../../../docs/walkthroughs/M17/walkthrough_v2.2.1_M17_integracion_core_layouts_frontend.md).
- [Clasificación actual de componentes globales y propios de M17](../../../../docs/walkthroughs/M17/walkthrough_v2.2.2_M17_componentes_globales_frontend.md).
- [Transición del drawer global de clientes](../../../../docs/walkthroughs/M17/walkthrough_v2.2.3_M17_transicion_drawer_frontend.md).
- [Consolidación de la vista Mi perfil](../../../../docs/walkthroughs/M17/walkthrough_v2.2.4_M17_perfil_unico_frontend.md).

**Nota sobre la guía histórica siguiente:** describe el simulador de autenticación originalmente previsto por la rama. La integración actual de M17 utiliza la sesión del servicio y el flag de demo indicado arriba; no depende del widget `DevRoleSwitcher` ni toma sus perfiles simulados como autorización real.

Este directorio contiene la interfaz gráfica, componentes y servicios del **Módulo M17**, responsable de la gestión de cuentas de empleados, activación/desactivación y la administración de permisos individuales granulares (**HU-ADM-01 a HU-ADM-06**).

---

## ⚡ 1. Guía de Desarrollo y Testing Local (Sin Pantalla de Login)

Por arquitectura general del proyecto, los módulos de seguridad y permisos (**M20 y M17**) se construyen en la **Ola 1**, mientras que el formulario de login para usuarios finales (**M04**) se construye en la Ola 2.

> **💡 ¿Cómo probar la interfaz y las acciones de roles sin un formulario de login?**  
> El frontend cuenta con un sistema desacoplado de autenticación simulada en desarrollo (`useAuth`) y un widget flotante interactivo (`DevRoleSwitcher`). **No necesitas esperar a M04 para desarrollar o validar tus componentes.**

### 🎭 El Widget `DevRoleSwitcher`
En la esquina inferior derecha de la aplicación web (en modo desarrollo) encontrarás un control interactivo que te permite alternar de identidad con un solo clic:
- 👑 **Admin (ID: 1):** Acceso total (`*`). Puede ver y editar todos los empleados, permisos y configuraciones.
- 👷 **Empleado Parcial (ID: 2):** Permisos limitados (`productos.crear`, `ordenes.ver`). Sirve para comprobar que los botones administrativos desaparecen o se bloquean.
- 🛍️ **Cliente (ID: 3):** Usuario sin privilegios. Sirve para validar que la ruta del panel admin sea rechazada (403 / Redirección).
- 🏢 **Empresa (ID: 4):** Cuenta corporativa B2B.

---

## 🛠️ 2. Cómo Proteger Botones y Vistas con `can('...')`

Todos los componentes de este módulo deben consumir el composable central [`src/core/auth/useAuth.ts`](../../core/auth/useAuth.ts). Este código es **100% definitivo para producción**: cuando M04 entregue el login real, este mismo composable recibirá el token y datos reales sin que tengas que rehacer nada en M17.

### Ejemplo 1: Renderizado Condicional de Acciones (Botones)
```vue
<script setup lang="ts">
import { useAuth } from '@/core/auth/useAuth';

const { can, currentUser } = useAuth();

function crearNuevoEmpleado() {
  // Lógica de apertura de modal o llamada al servicio
}
</script>

<template>
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-2xl font-extrabold text-corporate">Gestión de Empleados</h1>

    <!-- Solo visible si el usuario tiene el permiso atómico explícito -->
    <button
      v-if="can('empleados.crear')"
      type="button"
      @click="crearNuevoEmpleado"
      class="bg-conversion hover:bg-conversion-hover text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm"
    >
      + Nuevo Empleado
    </button>
  </div>
</template>
```

### Ejemplo 2: Columna de Acciones Restringida en una Tabla
```vue
<template>
  <table class="w-full text-left text-sm">
    <thead>
      <tr class="border-b border-neutral-light text-neutral-medium">
        <th>Empleado</th>
        <th>Correo</th>
        <th>Estado</th>
        <!-- Encabezado visible solo para quienes pueden editar o dar de baja -->
        <th v-if="can('empleados.desactivar')">Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="emp in empleados" :key="emp.id" class="border-b border-neutral-light">
        <td class="font-bold text-neutral-black">{{ emp.nombre }}</td>
        <td>{{ emp.correo }}</td>
        <td>
          <span :class="emp.activo ? 'bg-conversion/20 text-conversion-hover' : 'bg-neutral-light text-neutral-medium'" class="px-2 py-0.5 rounded-full text-xs font-bold">
            {{ emp.activo ? 'Activo' : 'Inactivo' }}
          </span>
        </td>
        <td v-if="can('empleados.desactivar')">
          <button @click="desactivar(emp.id)" class="text-xs text-red-600 font-semibold hover:underline">
            Desactivar
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
```

---

## 🎨 3. Paleta de Colores Obligatoria (Design System)

> ⛔ **DIRECTIVA #8 DE AGENTS.MD:**  
> Queda **estrictamente prohibido** usar colores hexadecimales inline (`bg-[#002855]`) o colores genéricos de Tailwind no aprobados (`text-purple-600`, `bg-blue-500`).

Utiliza **exclusivamente** los tokens oficiales definidos en [`src/core/theme/colors.ts`](../../core/theme/colors.ts):

| Rol Visual | Clase Tailwind | Uso en M17 |
| :--- | :--- | :--- |
| **Corporativo** | `bg-corporate`, `text-corporate` | Títulos principales, encabezados de tablas, botones primarios sobrios. |
| **Acción** | `bg-action`, `text-action` | Enlaces, botones interactivos de edición, selección de permisos. |
| **SubAcción** | `bg-subaction`, `text-subaction` | Badges de permisos asignados, fondos de filas seleccionadas. |
| **Conversión** | `bg-conversion`, `hover:bg-conversion-hover` | Botón "Guardar Cambios", "Activar Cuenta", "Crear Empleado". |
| **Destacado** | `bg-highlight` | Advertencias de seguridad, alertas de expiración. |
| **Neutros** | `text-neutral-black`, `text-neutral-dark`, `border-neutral-light`, `bg-neutral-lightest` | Textos, bordes de tablas y fondos de tarjetas. |

---

## 📋 4. Historias de Usuario de M17 a Implementar

| Historia | Descripción Funcional | Permiso Requerido |
| :--- | :--- | :--- |
| **HU-ADM-01** | Alta, edición y desactivación lógica de cuentas de empleado. | `empleados.crear`, `empleados.desactivar` |
| **HU-ADM-02** | Catálogo maestro de permisos atómicos y su descripción funcional. | `permisos.ver` |
| **HU-ADM-03** | Asignación y revocación granular de permisos por empleado. | `permisos.gestionar` |
| **HU-ADM-04** | Bitácora y trazabilidad de cambios de permisos para auditoría. | `auditoria.ver` |
| **HU-ADM-05** | Restablecimiento y reseteo administrativo de credenciales temporales. | `usuarios.gestionar` |
| **HU-ADM-06** | Consulta y filtros facetados de personal activo/inactivo. | `empleados.ver` |
