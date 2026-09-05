# WALKTHROUGH DE IMPLEMENTACIÓN Y REPORTE DE VERSIÓN

---

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v1.6.0`
* **Tipo de Incremento:** `MINOR`
* **Módulo de Origen:** `M20 - Seguridad, Auditoría y Protección de Datos`
* **Fecha de Entrega:** `05/09/2026`
* **Autor / Responsable:** `Sebastian Carvajal (desarrollador responsable del módulo)`
* **Asistencia técnica:** `Claude Opus 5 (Agente de IA), bajo supervisión y validación del autor`
* **Rama de trabajo:** `feature/m20-seguridad-auditoria`
* **Capa:** `Backend`
* **Estado de la Implementación:** `✅ COMPLETO para HU-SEG-05` (verificado contra PostgreSQL real)

> **Desbloqueo.** HU-SEG-05 estuvo bloqueada desde la v1.4.0 por ausencia de modelo de datos.
> El esquema **v2.3** incorporó `aviso_privacidad`, `consentimiento_usuario` y
> `solicitud_supresion`, lo que permite cerrarla. Esta entrega **no modifica el DDL**: solo
> consume las tablas existentes.

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título | Estado de Cobertura | Endpoints / Componentes |
| :--- | :--- | :---: | :--- |
| **HU-SEG-05** | Protección de datos personales | **Completa en backend** | `GET /privacidad/aviso`, `GET/POST /privacidad/consentimiento`, `GET/POST /privacidad/supresion`, `GET /privacidad/supresion/pendientes`, `PUT /privacidad/supresion/:id` |

### Descripción del Alcance de la Versión

Implementa las dos ramas del diagrama `M20-HU-SEG-05-Proteccion de datos personales.drawio.png`
que corresponden a M20: la **puerta de consentimiento** del registro y el **circuito de
supresión** desde el perfil.

Dos decisiones sostienen el diseño:

**El consentimiento es un hecho histórico, no un estado.** Cada aceptación crea una fila nueva
en `consentimiento_usuario` y jamás se sobrescribe una anterior. Es lo que permite responder
"qué versión aceptó este titular y cuándo" ante un requerimiento legal, y lo que hace posible
CA-SEG-05-06: si el aviso cambia de versión, el usuario no la ha aceptado y el sistema lo sabe.

**La supresión se registra, no se ejecuta a ciegas.** El servicio resuelve la bifurcación
"¿tiene órdenes de ventas asociadas?" del diagrama y responde al titular con la verdad: cuando
hay órdenes, la ley obliga a conservar la información comercial y solo puede desvincularse de
su identidad. Prometer un borrado total que la ley no permite sería peor que no ofrecer nada.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS APLICADAS

### A. Reglas de Negocio Específicas

- **El aviso vigente es público.** `GET /privacidad/aviso` no exige sesión: el usuario debe poder
  leer el texto **antes** de registrarse, porque no puede consentir lo que no ha visto
  (RF-SEG-05-03, RF-SEG-05-04).
- **La versión se acepta explícitamente, no se infiere.** El DTO exige la versión concreta. Si el
  aviso cambia entre que el usuario lo lee y lo acepta, la operación falla con `409` en vez de
  registrar consentimiento sobre un texto que el titular nunca vio.
- **Solo se acepta la versión vigente.** Consentir una versión retirada devuelve `409`.
- **El consentimiento no se sobrescribe.** La restricción `uq_usuario_aviso` y un
  `ON CONFLICT DO NOTHING` conservan la fecha original de cada aceptación.
- **Una solicitud de supresión en trámite por titular.** Repetir la petición acusa recibo de la
  existente en lugar de crear duplicados que inflen la cola administrativa.
- **`fecha_resolucion` solo se sella al salir de trámite.** El estado `en_proceso` la deja nula.
- **Resolver una solicitud inexistente responde `404 "Recurso no encontrado"`**, idéntico a una
  ajena: la respuesta no revela qué solicitudes existen (RF-SEG-03-05).

### B. Políticas Transversales Validadas

- 🛡️ **M20 - Autorización en Servidor (`HU-SEG-03`):** la cola administrativa y la resolución
  exigen el permiso `seguridad.gestionar_privacidad`, comprobado en vivo por los guardas del
  módulo. Un cliente sin él recibe `403`.
- 👁️ **M20 - Mínima Exposición (`HU-SEG-06`):** ninguna respuesta de privacidad incluye
  contraseñas ni hashes; verificado sobre las respuestas reales.
- 📧 **M18 - Notificaciones:** no aplica. Si el equipo decide notificar por correo la recepción de
  una solicitud de supresión, el punto de enganche es `PrivacidadService.solicitarSupresion`.

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-SEG-05-01** | Sin marcar el consentimiento, el registro no puede finalizar. | Integración: `{"aceptado": false}` → `400` con el mensaje de la regla. Y `exigirConsentimientoVigente()` lanza `400` si no hay aceptación. | ✅ |
| **CA-SEG-05-02** | Al completarse el registro se conserva fecha y versión aceptada. | Integración: el estado devuelve `versionAceptada` y `fechaAceptacion` desde `consentimiento_usuario`. | ✅ |
| **CA-SEG-05-03** | El usuario puede consultar y rectificar sus datos desde su perfil. | — | 🔜 **M04** (dueño del perfil) |
| **CA-SEG-05-04** | La solicitud de supresión se registra y se confirma su recepción. | Integración: `POST /privacidad/supresion` → `201` con la solicitud y mensaje de acuse. | ✅ |
| **CA-SEG-05-05** | Con órdenes asociadas, se conserva lo exigido por ley desvinculado de la identidad. | Integración: usuario con 1 orden → `conservaInformacionComercial: true` y mensaje explícito; usuario sin órdenes → `false`. | ⚠️ **Parcial** |
| **CA-SEG-05-06** | Si el aviso cambia de versión, el sistema informa al usuario. | Integración: publicada `v2.0-2026`, el estado del cliente pasó de `debeAceptar: false` a `true` sin tocar su fila. | ✅ |

### ⚠️ CA-SEG-05-05: por qué queda PARCIAL — requiere decisión del equipo

El criterio exige **dos** acciones y solo una está implementada:

| Verbo del criterio | Estado | Evidencia |
| :--- | :---: | :--- |
| **"conserva** la información comercial exigida por la ley" | ✅ | Nada se borra. La solicitud se registra y las órdenes permanecen intactas. |
| **"y la desvincula** de mi identidad" | ❌ | `orden.id_usuario` sigue apuntando al titular. |

El sistema **detecta** que el titular tiene órdenes y **se lo comunica** en la respuesta, pero
**no existe todavía el código que ejecuta la desvinculación**.

#### El bloqueo es estructural, no de esfuerzo

Con el modelo actual la desvinculación es **físicamente imposible**:

```sql
-- bd/sql/schema_pintuclic.sql, tabla orden
id_usuario INT NOT NULL,
CONSTRAINT fk_orden_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuario (id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
```

- **`NOT NULL`** impide poner el `id_usuario` en nulo.
- **`ON DELETE RESTRICT`** impide eliminar al usuario mientras tenga órdenes.

> 📌 **El `RESTRICT` está bien puesto y no debe cambiarse a la ligera.** Es una protección real:
> con `CASCADE`, eliminar una cuenta destruiría sus órdenes y facturas, que son exactamente la
> información que RF-SEG-05-07 obliga a conservar.

#### Tres caminos posibles

| Opción | En qué consiste | Coste | Contrapartida |
| :--- | :--- | :--- | :--- |
| **A** | Hacer `orden.id_usuario` nullable y ponerlo en `NULL` al suprimir. | Cambio de DDL | Se pierde la trazabilidad de que varias órdenes fueron del mismo titular; los reportes por cliente se rompen. |
| **B** | Reasignar las órdenes a un usuario técnico "titular suprimido". | Solo `UPDATE` | Todos los suprimidos quedan agregados en una misma cuenta centinela. |
| **C** ⭐ | **Anonimizar la fila de `usuario`**, no la orden: sobrescribir `nombre`, `correo` y `telefono` con valores no identificativos y marcar el estado. | Solo `UPDATE` | Ninguna relevante. |

**Recomendación: opción C.** La orden sigue apuntando a una fila que ya no identifica a nadie, con
lo que se cumple el habeas data sin romper la integridad referencial, sin perder reportes y **sin
tocar el DDL**. Forma aproximada:

```sql
UPDATE usuario SET
    nombre   = 'Titular suprimido',
    correo   = 'suprimido-' || id_usuario || '@pintuclic.invalid',
    telefono = NULL,
    estado   = 'inactivo'
WHERE id_usuario = :id;
```

#### 🚨 La pregunta que NO es técnica

`factura` referencia a `orden` también con `ON DELETE RESTRICT`. Una factura es un documento
fiscal de conservación obligatoria que, por normativa tributaria, **debe identificar al
comprador**.

Se cruzan por tanto dos obligaciones legales opuestas: la de protección de datos, que exige
suprimir la identidad del titular a petición suya, y la tributaria, que exige conservarla en el
documento fiscal. **Esta colisión no se resuelve escribiendo código**: requiere criterio jurídico
sobre la normativa colombiana aplicable y una decisión formal del Product Owner.

**Acción solicitada al líder técnico / PO:**
1. Elegir entre las opciones A, B o C.
2. Definir qué ocurre con las facturas ya emitidas a nombre del titular suprimido.

Con esas dos respuestas, la implementación es directa y no requiere cambios estructurales si se
opta por C.

### Nodos del diagrama `M20-HU-SEG-05`

| Rama | Nodo | Estado |
| :--- | :--- | :---: |
| Registro | Informar datos y finalidad / Mostrar aviso | ✅ (`GET /privacidad/aviso`) |
| Registro | Solicitar consentimiento → ¿aceptado? → no permitir registro | ✅ |
| Registro | Confirmar fecha y registrar versión del aviso | ✅ |
| Perfil | Consultar / modificar / guardar datos | 🔜 M04 |
| Perfil | Solicitar eliminación → registrar solicitud → confirmar recepción | ✅ |
| Perfil | ¿Tiene órdenes? → identificar información comercial a conservar | ✅ (identificación) |
| Perfil | Desvincular de la identidad cuando sea posible | ⚠️ Pendiente de decisión |
| Transferencia | Informar sobre transferencia a proveedor externo | ⛔ **Bloqueado** (RF-SEG-05-09) |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS

### A. Dependencias Hacia Atrás

1. **M17 (Permisos):** debe registrar el permiso **`seguridad.gestionar_privacidad`** en el
   catálogo. No está en `bd/sql/seed_pintuclic.sql`; sin él, la cola administrativa responde `403`
   a todo el mundo, que es el comportamiento correcto pero deja la función inutilizable.
2. **M04 (Cuentas):** al completar un registro debe invocar
   `serviciosSeguridad.privacidad.exigirConsentimientoVigente(idUsuario)`. Sin esa llamada, la
   puerta de consentimiento de CA-SEG-05-01 no se aplica en el flujo real de alta.
3. **Datos:** debe existir siempre una fila en `aviso_privacidad` con `es_vigente = true`. Sin
   ella, `GET /privacidad/aviso` responde `503` y el registro de usuarios queda bloqueado por
   diseño: no puede recogerse consentimiento válido sobre un texto inexistente.
4. **RF-SEG-05-09 (PENDIENTE DE DEFINICIÓN):** la postura sobre almacenamiento y retención de las
   imágenes del simulador y las conversaciones de chatbot/WhatsApp sigue sin definirse. Mientras
   siga abierta, la rama de **transferencia de datos a terceros** del diagrama (RF-SEG-05-08) no
   puede implementarse.

### B. Dependencias Hacia Adelante

- **M04** dispone de la puerta de consentimiento lista para enchufar en su registro.
- **M17** puede montar la pantalla de gestión de solicitudes de supresión sobre
  `GET /privacidad/supresion/pendientes` y `PUT /privacidad/supresion/:id`.
- **Frontend** puede leer el aviso sin sesión y usar `debeAceptar` para mostrar el aviso de
  cambio de versión.

---

## 6. REGISTRO DE ARCHIVOS CREADOS Y MODIFICADOS

> ✅ **Verificación de Límites de Módulo:** esta entrega vive **íntegramente dentro de
> `backend/src/modules/m20-seguridad/`**. No modifica archivos compartidos, no toca el DDL y no
> altera código de otros equipos.

| Tipo | Ruta | Contenido |
| :---: | :--- | :--- |
| **[NUEVO]** | `m20-seguridad/dtos/privacidad.dto.ts` | Schemas Zod de consentimiento, resolución y parámetro de URL. |
| **[NUEVO]** | `m20-seguridad/interfaces/privacidad.interfaces.ts` | Contratos de dominio puros, sin runtime. |
| **[NUEVO]** | `m20-seguridad/repositories/privacidad.repository.ts` | Consultas Kysely de las 3 tablas de privacidad y conteo de órdenes. |
| **[NUEVO]** | `m20-seguridad/services/privacidad.service.ts` | Reglas de consentimiento y supresión. |
| **[NUEVO]** | `m20-seguridad/controllers/privacidad.controller.ts` | Transporte HTTP. |
| **[MODIFICADO]** | `m20-seguridad/dtos/index.ts` | Reexporta `privacidad.dto`. |
| **[MODIFICADO]** | `m20-seguridad/seguridad.routes.ts` | Composición, ruta pública del aviso y 5 rutas protegidas. |

### Adherencia al review v1.5.0

La entrega respeta la separación impuesta por
[`docs/reviews/backend/review_v1.5.0_M20_seguridad.md`](../../reviews/backend/review_v1.5.0_M20_seguridad.md):
los schemas Zod viven en `dtos/` y las interfaces de dominio en `interfaces/`, sin que estas
últimas importen `zod`.

---

## 7. DICTAMEN FINAL Y CONFIRMACIÓN DE VERSIONADO

* **Incremento Registrado en `CHANGELOG.md`:** `✅ SÍ (v1.6.0)`
* **Compilación TypeScript (`tsc --noEmit`):** `✅ Sin errores`
* **Lint (`npm run lint`):** `✅ Sin errores`
* **DDL:** `✅ Sin cambios` — consume el esquema v2.3 existente.
* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` — 16 pruebas de integración contra
  **PostgreSQL 18.4** con el esquema v2.3 (31 tablas) y el seed oficial
  `bd/sql/seed_pintuclic.sql`:
  - Aviso vigente accesible **sin sesión** → `200`.
  - Estado de consentimiento del cliente sembrado: `aceptado: true`, con fecha y versión.
  - Publicada una versión nueva del aviso, el estado pasa a `debeAceptar: true` sin tocar la fila
    del usuario (CA-SEG-05-06).
  - Aceptar una versión retirada → `409`; aceptar sin marcar la casilla → `400` con la regla
    incumplida; aceptar la vigente → `201`.
  - Tras aceptar la nueva versión, el histórico conserva **2 consentimientos**: el anterior no se
    sobrescribió.
  - Supresión con 1 orden asociada → `conservaInformacionComercial: true` y mensaje explícito;
    sin órdenes → `false` y mensaje distinto.
  - Repetir la solicitud → `yaExistia: true` y **una sola fila** en la tabla.
  - Cola administrativa: cliente sin permiso → `403`; admin con permiso → `200`.
  - Resolución → `200` con `fecha_resolucion` sellada; solicitud inexistente → `404` genérico.
  - Cero apariciones de `contrasena` o hashes en las respuestas de privacidad.
* **Apego al Diagrama de Flujo:** `✅` en las ramas de registro y perfil que corresponden a M20.
  La rama de transferencia a terceros queda bloqueada por RF-SEG-05-09.
