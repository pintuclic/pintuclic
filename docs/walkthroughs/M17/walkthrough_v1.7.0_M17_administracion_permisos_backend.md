# Walkthrough de Implementación — M17: Administración, Empleados y Permisos

**Versión:** v1.7.0
**Rama:** `feature/m17-permisos-roles`
**Capa:** Backend únicamente (sin frontend)
**Fecha:** 2026-09-05
**Responsable:** Agente IA (Antigravity) + Santiago (revisión)

---

## 1. Contexto y Alcance

Este walkthrough documenta la implementación del backend del **Módulo M17 — Administración, Empleados y Permisos** del sistema Pintuclic.

### Historias de usuario cubiertas
- **HU-ADM-01:** Gestión de empleados (alta, consulta, edición, baja lógica, reactivación)
- **HU-ADM-02:** Gestión de permisos individuales con regla de cascada
- **HU-ADM-04:** Consulta y administración de clientes
- **HU-ADM-06:** Configuración de parámetros del sistema

### Políticas transversales respetadas
- `HU-CUE-08`: Unicidad global de correo verificada antes de crear empleado
- `HU-SEG-01`: Credencial temporal hasheada con BCrypt costo 12
- `HU-SEG-06`: Nunca se exponen contraseñas ni datos de tarjeta en respuestas HTTP
- `RF-ADM-01-14`: Imposible desactivar al Administrador raíz (ID: 1)
- `RF-ADM-02-10`: Imposible modificar permisos del Administrador raíz

---

## 2. Decisión Arquitectural — Estrategia de Permisos (Opción A)

**Problema detectado:** El schema de BD (v2.3) asigna permisos a *roles* (`asignacion_permiso.id_rol`),
pero M17 requiere permisos individuales por empleado sin roles fijos.

**Solución adoptada (Opción A — sin migración de BD):**
- Al crear cada empleado, se genera automáticamente un **rol individual** con nombre `empleado_{id_usuario}`.
- Los permisos se asignan al rol individual del empleado a través de `asignacion_permiso`.
- M20 ya lee permisos vía `usuario_rol → rol → asignacion_permiso`, por lo que es **totalmente compatible**.
- **No se requirió migración de schema ni modificar M20.**

---

## 3. Estructura de Archivos Creados

```
backend/src/modules/m17-permisos/
├── interfaces/
│   └── m17.interfaces.ts          # Tipos, catálogo de permisos, reglas de cascada
├── dtos/
│   ├── empleados.dto.ts           # Zod v4: CrearEmpleadoDto, FiltroEmpleadosDto, etc.
│   ├── permisos.dto.ts            # Zod v4: AsignarPermisosDto, ReemplazarPermisosDto
│   ├── clientes.dto.ts            # Zod v4: FiltroClientesDto, DesactivarClienteDto
│   └── parametros.dto.ts          # Zod v4: ActualizarParametroDto
├── repositories/
│   ├── empleados.repository.ts    # CRUD + rol individual, Kysely<Database>
│   ├── permisos.repository.ts     # Catálogo, asignación/revocación, sembrado
│   ├── clientes.repository.ts     # Listado y ficha de clientes
│   └── parametros.repository.ts   # Parámetros de sistema (en memoria, preparado para BD)
├── services/
│   ├── empleados.service.ts       # Alta, desactivación (+ M20 sesiones), reactivación
│   ├── permisos.service.ts        # Catálogo, cascada al conceder, protección superadmin
│   ├── clientes.service.ts        # Búsqueda, anonimización correo, bloqueo
│   └── parametros.service.ts      # Validación de rangos
├── controllers/
│   ├── empleados.controller.ts    # 6 endpoints HTTP
│   ├── permisos.controller.ts     # 3 endpoints HTTP
│   ├── clientes.controller.ts     # 4 endpoints HTTP
│   └── parametros.controller.ts   # 2 endpoints HTTP
└── m17.routes.ts                  # Enrutador Express con guardas M20
```

**Archivo compartido modificado:**
```diff
// backend/src/app.routes.ts
+import { adminRoutes } from './modules/m17-permisos/m17.routes';
+appRouter.use('/admin', adminRoutes);
```

---

## 4. Endpoints Implementados

### Empleados — `/api/admin/empleados`

| Método | Ruta | Permiso requerido | Descripción |
|--------|------|-------------------|-------------|
| `POST` | `/empleados` | `personal.ver` | Crear empleado + credencial temporal |
| `GET` | `/empleados` | `personal.ver` | Listar con filtros paginados |
| `GET` | `/empleados/:id` | `personal.ver` | Ficha completa con permisos |
| `PATCH` | `/empleados/:id` | `personal.editar` | Actualizar nombre/teléfono |
| `PATCH` | `/empleados/:id/desactivar` | `personal.desactivar` | Baja lógica + cierre sesiones |
| `PATCH` | `/empleados/:id/reactivar` | `personal.desactivar` | Reactivación |

### Permisos — `/api/admin/permisos` y `/api/admin/empleados/:id/permisos`

| Método | Ruta | Permiso requerido | Descripción |
|--------|------|-------------------|-------------|
| `GET` | `/permisos/catalogo` | `seguridad.gestionar_permisos` | Catálogo agrupado por área |
| `GET` | `/empleados/:id/permisos` | `seguridad.gestionar_permisos` | Permisos del empleado |
| `PUT` | `/empleados/:id/permisos` | `seguridad.gestionar_permisos` | Reemplazar permisos (con cascada) |

### Clientes — `/api/admin/clientes`

| Método | Ruta | Permiso requerido | Descripción |
|--------|------|-------------------|-------------|
| `GET` | `/clientes` | `personal.ver` | Listar clientes con filtros |
| `GET` | `/clientes/:id` | `personal.ver` | Ficha (correo anonimizado) |
| `PATCH` | `/clientes/:id/bloquear` | `personal.desactivar` | Bloqueo con motivo obligatorio |
| `PATCH` | `/clientes/:id/desbloquear` | `personal.desactivar` | Desbloqueo |

### Parámetros — `/api/admin/parametros`

| Método | Ruta | Permiso requerido | Descripción |
|--------|------|-------------------|-------------|
| `GET` | `/parametros` | `configuracion.ver` | Listar parámetros del sistema |
| `PUT` | `/parametros` | `configuracion.editar` | Actualizar parámetro con validación de rango |

---

## 5. Regla de Cascada de Permisos

Al **conceder** un permiso de operación, se auto-concede el de consulta:

| Permiso solicitado | Auto-concede |
|-------------------|--------------|
| `catalogo.crear` | `catalogo.ver` |
| `catalogo.editar` | `catalogo.ver` |
| `catalogo.eliminar` | `catalogo.ver` |
| `ventas.gestionar` | `ventas.ver` |
| `ventas.exportar` | `ventas.ver` |
| `personal.editar` | `personal.ver` |
| `personal.desactivar` | `personal.ver` |
| `seguridad.gestionar_permisos` | `personal.ver` |
| `configuracion.editar` | `configuracion.ver` |

---

## 6. Integración con M20

- M17 **importa y reutiliza** `guardas` y `serviciosSeguridad` desde `seguridad.routes.ts`.
- Al **desactivar un empleado**, se invoca `serviciosSeguridad.sesion.invalidarSesionesDeUsuario(id, 'cuenta_desactivada')` — cerrando todas sus sesiones activas al instante.
- M17 **sembró los permisos del sistema** (incluido `seguridad.configurar_sesion` de M20) en la tabla `permisos` al cargar el módulo (operación idempotente).

---

## 7. Validación de Calidad

- **Compilación TypeScript:** `npm run build` — ✅ sin errores en cada fase
- **exactOptionalPropertyTypes:** Todos los tipos de parámetros opcionales usan `T | undefined`
- **Zod v4:** DTOs adaptados a la nueva API (sin `required_error`, mensajes directos)
- **Sin SQL plano:** Todas las consultas usan `Kysely<Database>` tipado
- **Sin `any`:** Cero usos de tipo `any` en todo el módulo

---

## 8. Notas para el Equipo

1. **Parámetros del sistema:** El repositorio `parametros.repository.ts` actualmente gestiona los parámetros en memoria. Cuando el equipo agregue una tabla `parametros` al schema de BD, solo se necesita actualizar ese repositorio sin tocar capas superiores.
2. **Auditoría:** Las acciones de bloqueo de clientes y desactivación de empleados quedan registradas via `console.info` hasta que HU-SEG-04 (tabla de auditoría) sea implementada.
3. **Permiso `seguridad.configurar_sesion`:** Declarado originalmente en M20 (`PERMISO_CONFIGURAR_SESION`), ahora está oficialmente sembrado en la BD por M17.
