# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v1.5.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M20 - Seguridad, Auditoría y Protección de Datos`
* **Fecha de Entrega:** `05/09/2026`
* **Autor / Responsable:** `Sebastian Carvajal (desarrollador responsable del módulo)`
* **Asistencia técnica:** `Claude Opus 5 (Agente de IA), bajo supervisión y validación del autor`
* **Rama de trabajo:** `feature/m20-seguridad-auditoria`
* **Estado de la Implementación:** `⚠️ PARCIAL CON DEPENDENCIAS` (lo entregado, verificado contra PostgreSQL real)

> **Autorizaciones de alcance recibidas del equipo.** Esta entrega toca archivos fuera del
> módulo, cosa que la Directiva 1 de `AGENTS.md` prohíbe por defecto. Se obtuvo aprobación
> explícita en dos momentos, conforme al Protocolo de Parada e Informe (Directiva 3):
> 1. **Archivos compartidos de `core/`**, por ser M20 un módulo transversal cuyos requisitos
>    no pueden vivir dentro de su carpeta.
> 2. **Tabla `sesion` en el DDL**, autorizada por el líder técnico tras el reporte de
>    inconsistencia.
>
> **HU-SEG-04 (auditoría) queda EN PAUSA** por decisión del Product Owner, a la espera de la
> definición de la tabla de auditoría.

> **Integración con `develop`.** Esta entrega se numeró primero como `v1.4.0` mientras estaba
> sin publicar. Al integrar `develop` se encontró que ese número ya estaba tomado por la
> actualización de BD a 27 tablas (esquema v2.1), así que pasa a **`v1.5.0`** y el esquema a
> **`v2.2`**. La refactorización de `develop` (partición de `pedido` en `orden`/`linea_orden`,
> `linea_carrito`, `cotizacion` y la columna `usuario.tipo`) **no afecta a M20**: las cinco
> tablas de las que depende el módulo (`usuario`, `usuario_rol`, `rol`, `permisos`,
> `asignacion_permiso`) sobreviven intactas, y `usuario` conserva `contrasena`, `estado`,
> `id_rol` y `correo`. Las pruebas se volvieron a ejecutar sobre el esquema integrado.

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **HU-SEG-01** | Almacenamiento seguro de credenciales | **100% Cumplida** | `PUT /api/seguridad/credenciales`, `CredencialesService` |
| **HU-SEG-02** | Gestión de sesión | **100% en backend** | `POST/GET/DELETE /api/seguridad/sesion`, `GET/DELETE /api/seguridad/sesiones`, `GET/PUT /api/seguridad/politica-sesion` |
| **HU-SEG-03** | Autorización verificada en el servidor | **100% Cumplida** | `GuardasSeguridad` (validador central), `AutorizacionService` |
| **HU-SEG-06** | No exposición de datos sensibles | **100% Cumplida (backend)** | `core/utils/sanitize.ts`, `errorHandler` endurecido |
| **HU-SEG-04** | Registro de auditoría de acciones relevantes | **⏸️ EN PAUSA** | — (decisión del LG) |
| **HU-SEG-05** | Protección de datos personales | **⛔ BLOQUEADA** | — (a la espera del modelo de datos de consentimiento) |

### Descripción del Alcance de la Versión

Esta versión instala el **validador central de autorización** del sistema. Cualquier módulo que
necesite proteger una ruta importa los guardas de M20 en lugar de escribir su propia
comprobación, con lo que se cumple RNF-SEG-03-01 ("la verificación debe aplicarse de forma
central y no depender de que cada operación la implemente por su cuenta").

Dos decisiones sostienen todo lo demás:

**La identidad se resuelve en vivo contra PostgreSQL en cada petición**, no se lee de los claims
del token. Gracias a eso, desactivar una cuenta o retirar un permiso surte efecto en la petición
siguiente, sin esperar a que el token caduque ni exigir una nueva autenticación.

**La sesión se persiste en la tabla `sesion`** y el JWT porta el claim `sid` que la referencia.
El token deja de ser la autoridad y pasa a ser una referencia: la autoridad es la base de datos,
que es lo único que se puede cambiar después de haber entregado el token. Sin esto, cerrar sesión
de verdad o invalidar todas las sesiones de un usuario serían imposibles.

Se añade además una red transversal de no exposición: `sendSuccess` sanea de forma recursiva toda
respuesta exitosa, y el manejador central de errores deja de devolver detalle técnico al
navegador, registrándolo internamente.

---

## 3. CAMBIO DE MODELO DE DATOS (esquema v2.2 — 28 tablas)

### Tabla `sesion` (nueva)

```sql
CREATE TABLE IF NOT EXISTS sesion (
    id_sesion UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario INT NOT NULL,
    tipo_sesion enum_tipo_sesion NOT NULL,
    fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_ultimo_acceso TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_expiracion TIMESTAMPTZ NOT NULL,
    estado enum_estado_sesion NOT NULL DEFAULT 'activa',
    motivo_cierre enum_motivo_cierre_sesion,
    CONSTRAINT fk_sesion_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE CASCADE
);
```

**Tres ENUM nuevos**, declarados dentro del bloque `DO $$` existente y con la misma guarda
`IF NOT EXISTS` que el resto del script:

| ENUM | Valores | Para qué |
| :--- | :--- | :--- |
| `enum_estado_sesion` | `activa`, `cerrada`, `expirada`, `revocada` | Ciclo de vida de la fila |
| `enum_tipo_sesion` | `admin`, `cliente` | Ventana de inactividad aplicable |
| `enum_motivo_cierre_sesion` | `cierre_manual`, `inactividad`, `cambio_contrasena`, `cuenta_desactivada`, `permisos_retirados` | Por qué dejó de estar activa |

**Dos índices:** `idx_sesion_usuario_estado` e `idx_sesion_estado_expiracion`.

### Decisiones que conviene revisar con el equipo de BD

1. **`id_sesion` es UUID y no `SERIAL`**, rompiendo la convención del resto del esquema. Es
   deliberado: el identificador viaja dentro del token y un entero secuencial sería enumerable
   por un tercero.
2. **No se guardan IP ni `user-agent`.** Serían útiles para una pantalla de "tus dispositivos",
   pero son datos personales y su tratamiento entra en HU-SEG-05, que sigue bloqueada.
3. **La documentación de `bd/docs/` fue actualizada en esta misma entrega**, siguiendo el
   protocolo de `bd/docs/GUIA_REFACTORIZACION_BD.md`: entrada de la versión 2.2 en
   `WALKTHROUGH_DATABASE.md` con la plantilla oficial, y encabezado, changelog, diagrama Mermaid
   ER, diccionario de datos y catálogo de ENUMs puestos al día en `DOCUMENTACION_BASE_DATOS.md`.
   Quien cambia el modelo documenta el cambio.

---

## 4. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas del Módulo

- **Respuesta uniforme ante denegación:** un recurso ajeno responde exactamente igual que un
  recurso inexistente (`404` / `"Recurso no encontrado"`), de modo que la respuesta no revela la
  existencia del recurso (RF-SEG-03-05, CA-SEG-03-06).
- **Ventanas de inactividad diferenciadas:** 30 minutos para sesiones administrativas y 30 días
  para sesiones de cliente (RF-SEG-02-02), configurables en caliente.
- **La sesión que cambia la contraseña sobrevive.** Las demás caen con motivo
  `cambio_contrasena`. Expulsar a alguien del dispositivo que tiene en la mano sería un castigo,
  no una medida de seguridad.
- **Un token sin `sid` se rechaza.** Un token que no ampara una sesión persistida no podría
  revocarse nunca, que es justamente lo que este diseño viene a eliminar.
- **Prioridad de rol:** `usuario_rol` (asignación explícita, `UNIQUE` por usuario) tiene
  precedencia sobre `usuario.id_rol`, documentado en el DDL como "rol directo por defecto".
- **Permiso desactivado = permiso ausente:** un registro de `permisos` con `estado = 'inactivo'`
  deja de conceder acceso de inmediato.
- **Política de contraseñas:** mínimo 8 caracteres con minúscula, mayúscula y dígito; la
  contraseña nueva debe diferir de la vigente.

### B. Políticas Transversales Validadas

- 🔒 **M20 - Hashing y Credenciales (`HU-SEG-01`):** BCrypt con factor de costo 12, sal única por
  invocación y comparación en tiempo constante vía `bcrypt.compare`.
- 🛡️ **M17 - Autorización en Servidor (`HU-ADM-03`):** permisos evaluados en tiempo de ejecución
  contra `asignacion_permiso` en cada petición.
- 👁️ **M20 - Mínima Exposición (`HU-SEG-06`):** ninguna respuesta incluye contraseñas ni hashes;
  los mensajes de error no contienen rutas, consultas ni versiones.
- 📧 **M18 - Notificaciones:** no aplica en esta versión.

---

## 5. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

### 🔹 HU-SEG-01 — Almacenamiento seguro de credenciales

| ID Criterio | Criterio de Aceptación | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-SEG-01-01** | La contraseña no queda en texto claro ni es recuperable. | Solo se persiste el hash BCrypt; verificado en BD. | ✅ |
| **CA-SEG-01-02** | Dos usuarios con la misma contraseña obtienen valores distintos. | Los usuarios 2 y 3 comparten contraseña y tienen hashes distintos. | ✅ |
| **CA-SEG-01-03** | El registro de un error de autenticación no contiene la contraseña. | `grep` sobre el log tras 4 intentos: cero apariciones. | ✅ |
| **CA-SEG-01-04** | La consulta de perfil no devuelve la contraseña en ninguna forma. | Fila real con `selectAll()`: `contrasena` desaparece, incluso anidada. | ✅ |
| **RF-SEG-01-06** | Invalidar todas las sesiones al cambiar la contraseña. | 3 dispositivos abiertos; cambio desde uno → `{"sesionesCerradas":3}`; ese sigue en `200`, los otros dos en `401`. | ✅ |

### 🔹 HU-SEG-02 — Gestión de sesión

| ID Criterio | Criterio de Aceptación | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-SEG-02-01** | Tras la inactividad se informa de la expiración. | Vencida `fecha_expiracion` → `401 SESSION_EXPIRED`; la fila quedó `expirada / inactividad`. | ✅ |
| **CA-SEG-02-02** | Operar antes del plazo renueva la vigencia. | Una petición movió `fecha_ultimo_acceso` y `fecha_expiracion` 3,3 s hacia adelante. | ✅ |
| **CA-SEG-02-03** | Sesiones simultáneas en varios dispositivos conviven. | 3 sesiones del mismo usuario, las 3 en `200`. | ✅ |
| **CA-SEG-02-04** | Cuenta desactivada ⇒ petición rechazada. | Token válido de usuario `estado='inactivo'` → `403`; sesiones quedaron `revocada / cuenta_desactivada`. | ✅ |
| **CA-SEG-02-05** | Permiso retirado ⇒ rechazo sin re-autenticar. | `DELETE` de la asignación en caliente → el MISMO token pasa de `200` a `403`. | ✅ |
| **CA-SEG-02-06** | Tras re-autenticarse, vuelve al destino pretendido. | — | 🔜 **Frontend** |

### 🔹 HU-SEG-03 — Autorización verificada en el servidor

| ID Criterio | Criterio de Aceptación | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-SEG-03-01** | Pedir una orden ajena se rechaza sin revelar su existencia. | `requiereTitularidad` responde `404` genérico. | ⚠️ **Sin recurso real** |
| **CA-SEG-03-02** | Petición directa sin permiso ⇒ rechazada. | Cliente sin permiso → `PUT /politica-sesion` → `403`. | ✅ |
| **CA-SEG-03-03** | Acceder por URL a una función oculta ⇒ rechazada. | Mismo guarda; la ocultación en UI es solo usabilidad. | ✅ |
| **CA-SEG-03-04** | Retirar un permiso con la sesión abierta ⇒ rechazo inmediato. | Retirado → `403`; restituido → `200`, sin re-autenticar. | ✅ |
| **CA-SEG-03-05** | Todo acceso denegado queda registrado con usuario, operación y fecha. | `RegistroSeguridadService`, sumidero provisional al log. | ⚠️ **Parcial (auditoría en pausa)** |
| **CA-SEG-03-06** | Recurso inexistente y recurso ajeno responden idéntico. | Ambos: `404` + `"Recurso no encontrado"`. | ✅ |

### 🔹 HU-SEG-06 — No exposición de datos sensibles

| ID Criterio | Criterio de Aceptación | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-SEG-06-02** | Un error interno no revela rutas, consultas ni versiones. | Con la BD caída → `"Ocurrió un error interno en el servidor"`. | ✅ |
| **CA-SEG-06-05** | Un listado no contiene datos de otros clientes. | `sanearRespuesta` + guardas de titularidad. | ✅ |
| **CA-SEG-06-06** | El registro técnico permite diagnosticar sin datos sensibles. | Log `[CORE][ERROR_NO_CONTROLADO]` con pila, sin cuerpo de la petición. | ✅ |
| **CA-SEG-06-01** | No exponer el precio empresarial a quien no es empresa aprobada. | — | 🔜 **M02/M04** |
| **CA-SEG-06-03** | Recuperación de contraseña con correo no registrado responde idéntico. | — | 🔜 **M04** |
| **CA-SEG-06-04** | No se almacena ningún dato del instrumento de pago. | — | 🔜 **M09 Pagos** |

### Nodos del diagrama `HU-SEG-02_gestion_sesion.png`

| Nodo | Descripción | Estado |
| :---: | :--- | :---: |
| 2 | Crear sesión y registrar fecha/hora de último acceso | ✅ |
| 4.A | Cerrar sesión manualmente / finalizar sesión | ✅ |
| 4.B | Sesión expirada, informar al usuario | ✅ |
| 4.C | Volver al destino que intentaba alcanzar | 🔜 Frontend |
| 5 | Renovar vigencia / reiniciar tiempo de inactividad | ✅ |
| 6.A | Invalidar todas las sesiones del usuario | ✅ |
| 7 | Sesiones simultáneas en distintos dispositivos | ✅ |
| 8 | Registrar límites de sesión configurados | ✅ |

---

## 6. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (¿qué necesita para operar al 100% en producción?)

1. **Equipo de BD:** solo debe correr el DDL actualizado sobre sus entornos. La documentación de `bd/docs/` ya quedó al día en esta entrega.
2. **Módulo M17 (Permisos):** el catálogo `permisos` **no trae semillas**; debe registrar los
   nombres de permiso, entre ellos `seguridad.configurar_sesion`. Y al revocar permisos debe
   invocar `serviciosSeguridad.sesion.invalidarSesionesDeUsuario(id, 'permisos_retirados')`;
   el motivo ya existe en el ENUM. **No se dispara solo**: una petición denegada no equivale a
   una revocación, y cerrar sesiones ante cada `403` sería un vector de denegación de servicio.
   > ⚠️ **Inconsistencia detectada:** `AGENTS.md` (Paso 4) describe "permisos individuales por
   > empleado (sin roles predefinidos fijos)", pero el DDL modela los permisos **por rol**
   > (`asignacion_permiso(id_rol, id_permiso)`). La implementación sigue el DDL. Debe resolverse
   > con el equipo de M17.
3. **Módulo M04 (Cuentas/Auth):** el login sigue siendo suyo. Debe consumir
   `serviciosSeguridad.sesion.abrirSesion()` y `serviciosSeguridad.credenciales` en lugar de
   firmar JWT por su cuenta: un token sin `sid` es rechazado por el guarda.
4. **HU-SEG-05:** sigue bloqueada a la espera del modelo de datos de consentimiento, que el
   equipo de BD está definiendo. **No basta con añadir columnas a `usuario`**, como se planteó en
   un primer análisis: RF-SEG-05-06 exige registrar las *solicitudes de supresión*, que tienen su
   propio ciclo de vida y fecha, y CA-SEG-05-06 exige informar al usuario cuando el aviso de
   privacidad cambie de versión, lo que obliga a conservar el histórico de qué versión aceptó
   cada quien. Un par de columnas solo guardaría el último estado. El código de M20 que consuma
   ese modelo se implementará cuando la forma de las tablas esté definida.
5. **Infraestructura:** variables `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ROLES_ADMINISTRATIVOS`
   (lista de `id_rol` administrativos separados por coma) y, opcionalmente,
   `SESION_INACTIVIDAD_ADMIN_SEGUNDOS` / `SESION_INACTIVIDAD_CLIENTE_SEGUNDOS`.
6. **Transporte:** RNF-SEG-02-01 y RNF-SEG-06-01 exigen canal cifrado (HTTPS/TLS) y que el
   identificador de sesión no sea accesible desde el código de la página. La entrega actual usa
   cabecera `Bearer`; migrar a cookie `HttpOnly; Secure; SameSite` es **trabajo pendiente de
   despliegue** y afecta también al frontend.
7. **Barrido de caducadas:** las filas `expirada` se marcan al intentar usarlas, no por un
   proceso de fondo. Conviene una tarea periódica cuando el volumen lo justifique; el índice
   `idx_sesion_estado_expiracion` ya está puesto para eso.

### B. Dependencias Hacia Adelante (¿a qué módulos habilita?)

- **Todos los módulos de negocio (M02, M07, M08, M17…):** ya pueden proteger sus rutas con
  `guardas.protegido('nombre.permiso')` y `guardas.requiereTitularidad(...)` sin escribir lógica
  de autorización propia.
- **M17 (Administración):** dispone del punto de verificación en servidor que exige `HU-ADM-03`,
  y puede cerrar sesiones de un usuario ante un evento de seguridad.
- **M04 (Cuentas):** dispone de la política de credenciales y de la emisión de sesión.
- **Frontend:** `GET /api/seguridad/sesiones` es la base para una pantalla de "tus dispositivos".

---

## 7. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ **Verificación de Límites de Módulo:** esta entrega **sí toca archivos compartidos**, con
> autorización explícita del equipo (Directiva 3 de `AGENTS.md`). Se detallan abajo.

### Módulo asignado

| Tipo | Ruta | Contenido |
| :---: | :--- | :--- |
| **[NUEVO]** | `m20-seguridad/interfaces/seguridad.interfaces.ts` | Contratos del módulo y esquemas Zod. |
| **[NUEVO]** | `m20-seguridad/repositories/seguridad.repository.ts` | Identidad, permisos vigentes y credenciales. |
| **[NUEVO]** | `m20-seguridad/repositories/sesion.repository.ts` | Transiciones de estado de la sesión. |
| **[NUEVO]** | `m20-seguridad/services/autorizacion.service.ts` | Validador central: identidad, permisos y titularidad. |
| **[NUEVO]** | `m20-seguridad/services/sesion.service.ts` | Apertura, validación con renovación, cierre e invalidación en bloque. |
| **[NUEVO]** | `m20-seguridad/services/credenciales.service.ts` | Derivación y verificación BCrypt; cambio de contraseña. |
| **[NUEVO]** | `m20-seguridad/services/registro-seguridad.service.ts` | Sumidero provisional de accesos denegados. |
| **[NUEVO]** | `m20-seguridad/middlewares/autorizacion.middleware.ts` | Guardas `sesionVigente`, `requierePermiso`, `requiereTitularidad`, `protegido`. |
| **[NUEVO]** | `m20-seguridad/controllers/seguridad.controller.ts` | Controlador HTTP del módulo. |
| **[NUEVO]** | `m20-seguridad/seguridad.routes.ts` | Raíz de composición; exporta `guardas` y `serviciosSeguridad`. |

### Archivos compartidos (autorizados)

| Tipo | Ruta | Contenido | Naturaleza |
| :---: | :--- | :--- | :--- |
| **[MODIFICADO]** | `bd/sql/schema_pintuclic.sql` | Tabla `sesion`, 3 ENUM, 2 índices, esquema v2.1→v2.2 (27→28 tablas). | Aditivo |
| **[MODIFICADO]** | `backend/src/core/db/types.ts` | `SesionTable`, tipos ENUM, registro en `Database`. | Aditivo |
| **[NUEVO]** | `backend/src/core/utils/sanitize.ts` | Saneamiento recursivo de campos sensibles. | Aditivo |
| **[MODIFICADO]** | `backend/src/core/utils/jwt.ts` | `TokenPayload` gana `sid`. | Aditivo |
| **[MODIFICADO]** | `backend/src/core/types/api.types.ts` | `AuthenticatedUser` gana `tipo_sesion` y `sid`. | Aditivo |
| **[MODIFICADO]** | `backend/src/app.routes.ts` | Montaje de `/api/seguridad`. | Aditivo |
| **[MODIFICADO]** | `backend/src/core/utils/apiResponse.ts` | `sendSuccess` sanea la carga útil. | **Cambia comportamiento** |
| **[MODIFICADO]** | `backend/src/core/middlewares/errorHandler.ts` | Detalle técnico al log, mensaje genérico al navegador. | **Cambia comportamiento** |

### ⚠️ Impacto para otros equipos

`errorHandler` ya **no devuelve `err.message`** al cliente en errores no controlados. Para
recuperar el detalle en local, exportar `EXPONER_DETALLE_ERRORES=true`; en todos los casos la
traza completa queda en la consola del servidor.

`core/middlewares/auth.middleware.ts` **no fue modificado**, para no chocar con la rama de M17.
Los módulos deben migrar de `authenticateToken` a `guardas.sesionVigente()`, que además
revalida estado, permisos y sesión contra la base de datos.

`POST /api/seguridad/sesion` **responde 404 cuando `NODE_ENV=production`**. Existe para poder
ejercitar el módulo de extremo a extremo mientras M04 construye su login; no es el login oficial.

---

## 8. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ (v1.5.0)`
* **Compilación TypeScript (`tsc --noEmit`):** `✅ Sin errores`
* **Lint (`npm run lint`):** `✅ Sin errores`
* **DDL aplicado:** `✅` aplicado sobre el esquema v2.1 de `develop`; 28 tablas en total.
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` — dos tandas de pruebas de integración
  contra **PostgreSQL 18.4** (puerto 5433) con el DDL completo y datos de prueba sembrados:
  - **16 sobre autorización y credenciales:** sesión ausente, token manipulado y caducado;
    identidad de administrador devolviendo solo permisos **activos** (el sembrado como
    `inactivo` no aparece pese a seguir asignado); ventanas diferenciadas de `1800 s` y
    `2592000 s`; cuenta `inactivo` con token válido → `403`; permiso retirado en caliente
    haciendo pasar el mismo token de `200` a `403` y de vuelta a `200`; cambio de contraseña con
    actual incorrecta → `403` uniforme, contraseña débil e igual a la vigente → `400` con la
    regla incumplida pero nunca el valor introducido, cambio válido → hash distinto que verifica
    contra la nueva y falla contra la anterior; saneamiento sobre fila real con `selectAll()`; y
    log sin ninguna aparición de las contraseñas usadas.
  - **12 sobre sesiones persistidas:** apertura con credenciales devolviendo `sid`; cierre manual
    matando el token al instante; caducidad por inactividad dejando la fila
    `expirada / inactividad`; desactivación de cuenta con revocación en cascada
    (`revocada / cuenta_desactivada`); tres sesiones simultáneas conviviendo; cambio de
    contraseña con `sesionesCerradas: 3` conservando la sesión de origen; renovación deslizante
    de `fecha_ultimo_acceso` y `fecha_expiracion`; listado de sesiones activas; y ausencia de
    credenciales en las respuestas.

  **Fuera de cobertura:** los guardas de titularidad (`requiereTitularidad`) se validaron por
  construcción y con el SQL compilado, pero **no con un recurso de negocio real**, porque ningún
  módulo de dominio expone todavía endpoints con titular. Debe reverificarse cuando **M08
  (Pedidos)** monte sus rutas.
* **Apego al Diagrama de Flujo:** `✅ 100% en HU-SEG-01 y HU-SEG-03` · `✅ 7 de 8 nodos en
  HU-SEG-02` (el restante, 4.C, es responsabilidad del frontend).
