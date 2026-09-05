# Guía Estándar de Versionado y Walkthroughs de Implementación - PINTU CLIC

Este documento establece la **normativa obligatoria de control de versiones y documentación post-implementación (Walkthroughs)** para la plataforma **Pintu Clic**.

Aplica de forma estricta tanto a **desarrolladores humanos** como a **Agentes de Inteligencia Artificial (IA)**.

---

## 1. Regla de Oro del Versionado

> 🚨 **DIRECTIVA OBLIGATORIA:**  
> **CADA implementación de código, por pequeña que sea, DEBE generar un incremento de versión, actualizar el archivo central `CHANGELOG.md` y documentar un Walkthrough de Implementación.**  
> Queda terminantemente prohibido dar por concluida una tarea sin registrar la versión y su respectivo Walkthrough.

---

## 2. Esquema de Versionado Semántico (SemVer)

El proyecto utiliza el estándar `MAJOR.MINOR.PATCH` (ejemplo: `v1.2.0`):

```mermaid
graph LR
    A[Nueva Implementación] --> B{Tipo de Cambio}
    B -->|Breaking change o Módulo Completo| C[MAJOR: v2.0.0]
    B -->|Nueva Historia de Usuario / Endpoint| D[MINOR: v1.3.0]
    B -->|Fix de Bug / Refactor / Ajuste Zod| E[PATCH: v1.2.1]
```

### Criterios de Incremento:

| Nivel | Cuándo incrementar | Ejemplos |
| :--- | :--- | :--- |
| **MAJOR (`X.0.0`)** | Cambios estructurales de arquitectura, cierre de un sprint completo, o cambios incompatibles en contratos de API/Base de Datos. | Culminación total del módulo `M04 Cuentas` con login, registro y aprobación empresarial integrados. |
| **MINOR (`0.X.0`)** | Implementación completa de una nueva Historia de Usuario (HU), nueva ruta/controlador funcional o nuevo caso de uso. | Implementación exitosa de `HU-CUE-01` (Registro con verificación de correo). |
| **PATCH (`0.0.X`)** | Corrección de defectos (bugs), mejoras en esquemas de validación Zod, ajustes menores de seguridad o refactorización interna sin alterar contratos. | Fix en regex de contraseña en Zod, ajuste de mensajes de error genéricos `HU-SEG-06`. |

> 🔄 **Regla Obligatoria del Reinicio a Cero (Efecto Odómetro en SemVer):**  
> Cada vez que se incrementa un dígito a la izquierda, **todos los dígitos situados a su derecha se reinician obligatoriamente a `0`**:  
> - **Al subir `PATCH`:** Solo se suma al parche $\rightarrow$ Ej: `1.5.4` pasa a **`1.5.5`**.  
> - **Al subir `MINOR`:** Se suma a `MINOR` y el `PATCH` se reinicia a cero $\rightarrow$ Ej: `1.5.4` pasa a **`1.6.0`** *(nunca `1.6.4` ni `1.6.1`)*.  
> - **Al subir `MAJOR`:** Se suma a `MAJOR` y tanto `MINOR` como `PATCH` se reinician a cero $\rightarrow$ Ej: `1.5.4` pasa a **`2.0.0`**.

---

## 3. Registro Central: `CHANGELOG.md` (Principio DRY y Regla de Punteros)

El archivo central `docs/CHANGELOG.md` es el **resumen ejecutivo de producto** para toda la organización (gerencia, tech leads, frontend, backend y QA).

> 🚫 **PROHIBICIÓN DE DUPLICACIÓN (PRINCIPIO DRY):**  
> Queda terminantemente **prohibido transcribir DDL SQL, tablas completas, esquemas extensos o código duplicado** en `CHANGELOG.md`.  
> La **fuente única de la verdad técnica** es el **Walkthrough de Implementación**. El Changelog debe actuar como un **puntero de alto nivel**:
> 1. Resumir en 2 a 4 líneas el alcance funcional y módulos afectados.
> 2. Listar únicamente los hitos clave o cambios breaking.
> 3. Incluir obligatoriamente el **enlace directo (puntero)** hacia el Walkthrough técnico detallado (`docs/walkthroughs/M[XX]/...` o `bd/docs/WALKTHROUGH_DATABASE.md`).

### Formato Estándar Oficial:

```markdown
## [vX.Y.Z] - AAAA-MM-DD
### Módulo: M[XX] [Nombre del Módulo]
- **Alcance:** Resumen conciso de 1 a 2 líneas de la funcionalidad entregada o corregida.
- **Hitos Clave:** Breve lista de 2 a 3 puntos principales (endpoints nuevos, tablas clave o políticas).
- **Estado de Calidad:** Resultado de `tsc --noEmit`, linters y pruebas.
- 🔗 **Walkthrough Técnico Oficial:** [walkthroughs/M[XX]/walkthrough_vX.Y.Z.md](./walkthroughs/M[XX]/walkthrough_vX.Y.Z.md)
```

---

## 4. Estructura Obligatoria del Walkthrough de Implementación

Cada implementación debe acompañarse de un archivo de Walkthrough detallado guardado en `walkthroughs/M[XX]/walkthrough_v[X.X.X]_[descripcion].md` (o documentado formalmente en el reporte de entrega).

El Walkthrough debe contener obligatoriamente las siguientes 6 secciones:

### 1. Metadatos de la Implementación
- **Versión:** `vX.X.X`
- **Módulo de Origen:** Código y nombre (ej: `M04 Cuentas, Autenticación y Perfil`).
- **Fecha y Autor:** Fecha exacta y responsable (Developer / Agente IA).

### 2. Historias de Usuario (HUs) Cubiertas
- Lista de IDs y títulos exactos de las HUs implementadas en esta entrega.
- Alcance funcional alcanzado.

### 3. Reglas de Negocio y Políticas de Seguridad Aplicadas
- Reglas específicas del módulo implementadas.
- Políticas transversales validadas:
  - 🔒 `HU-SEG-01` (Hashing seguro).
  - 🛡️ `HU-ADM-03` (Verificación de permisos en servidor).
  - 📧 `HU-NOT-01` (Despacho de eventos SMTP).
  - 🆔 `HU-CUE-08` (Unicidad de cuentas).

### 4. Criterios de Aceptación Cumplidos (Matriz de Verificación)
- Tabla o lista detallando cada Criterio de Aceptación (Gherkin: *Dado / Cuando / Entonces*) y cómo fue probado y superado.

### 5. Resumen Conceptual de Dependencias Externas (¡Crítico!)
- Análisis de dependencias hacia adelante y hacia atrás:
  - **¿Qué necesita este código para operar al 100% en producción?** (Ej: *Requiere que el módulo M18 configure el servidor SMTP real de producción y que Google Identity configure el Client ID en las variables de entorno*).
  - **¿A qué otros módulos habilita?** (Ej: *Habilita al módulo M07 Checkout para autenticar usuarios antes del pago*).

### 6. Registro de Archivos Modificados / Creados
- Lista estricta de archivos creados o modificados, confirmando que **todos pertenecen al módulo asignado** sin haber tocado archivos de otros equipos.
