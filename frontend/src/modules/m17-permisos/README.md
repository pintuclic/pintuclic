# 🛡️ Módulo M17 - Administración, Empleados y Permisos (Frontend)

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
