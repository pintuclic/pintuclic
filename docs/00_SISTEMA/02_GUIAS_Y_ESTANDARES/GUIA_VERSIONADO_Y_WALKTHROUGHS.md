# Guía Estándar de Walkthroughs de Implementación - PINTU CLIC

Este documento establece la **normativa obligatoria de documentación post-implementación (Walkthroughs)** para la plataforma **Pintu Clic**.

Aplica de forma estricta tanto a **desarrolladores humanos** como a **Agentes de Inteligencia Artificial (IA)**.

---

## 1. Estructura y Nomenclatura Obligatoria del Walkthrough de Implementación

Cada implementación debe acompañarse de un archivo de Walkthrough detallado guardado en:
`docs/walkthroughs/M[XX]/walkthrough_v[X.Y.Z]_[MXX]_[descripcion]_[backend|frontend].md`

> 🏷️ **SUFIJO OBLIGATORIO DE CAPA (`_backend` o `_frontend`):**  
> Para evitar colisiones, sobreescrituras y ambigüedades cuando frontend y backend se desarrollan de forma desacoplada dentro del mismo módulo funcional, el nombre de CADA archivo de Walkthrough **DEBE terminar obligatoriamente con el sufijo de su capa técnica al final del nombre**:
> - **Entregas de Backend:** `walkthrough_v[X.Y.Z]_[MXX]_[descripcion]_backend.md`  
>   *(Ejemplo: `docs/walkthroughs/M20/walkthrough_v1.5.0_M20_seguridad_backend.md`)*
> - **Entregas de Frontend:** `walkthrough_v[X.Y.Z]_[MXX]_[descripcion]_frontend.md`  
>   *(Ejemplo: `docs/walkthroughs/M17/walkthrough_v1.6.0_M17_auth_simulation_frontend.md`)*

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
