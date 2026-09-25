# Guía Estándar de Versionado y Walkthroughs de Implementación - PINTU CLIC

Este documento establece la **normativa obligatoria de versionado semántico y de documentación post-implementación (Walkthroughs)** para la plataforma **Pintu Clic**.

Aplica de forma estricta tanto a **desarrolladores humanos** como a **Agentes de Inteligencia Artificial (IA)**.

---

## 1. Versionado Semántico del Proyecto

El tipo de versión que se utiliza es semántica y está conformado por cuatro segmentos, según [CONTRIBUTING.md](../../../CONTRIBUTING.md):

| Versión | Nombre | Descripción |
| :--- | :--- | :--- |
| `1.X.X.X` | **Mayor** | Versión estable, todo funcional |
| `X.1.X.X` | **Minior estable** | Versión estable de minior-feat; agrupa los cambios grandes que se enviarán después a la rama main (estable) |
| `X.X.1.X` | **Minior-feat** | Cambios que aportan a la web |
| `X.X.X.1` | **Patch** | Arreglos pequeños para el funcionamiento de la web |

> **Transición de esquema:** la versión antigua de tres segmentos (ej: `3.28.0`) se reemplaza por la nueva de cuatro segmentos (ej: `0.3.28.0`); el último registro antiguo `3.29.0` equivale a `0.3.29.0`. La línea nueva arranca en `0.3.29.1`.

### 1.1 Fuente Única de Verdad

- La versión del proyecto reside exclusivamente en `.github/version.txt`, en una sola línea con formato `X.Y.Z.W` (cuatro números separados por punto, sin prefijo `v`).
- Ningún otro archivo, documento o commit define la versión del proyecto. La metadata `version` de cada `package.json` es de npm y no representa la versión del release.
- **Excepción vigente (`backend/`):** el backend no se modifica en esta migración; el campo informativo `version` de su respuesta raíz (`backend/src/index.ts`) no representa la versión del release y se conserva tal cual.

### 1.2 Empaquetado Automático con GitHub Actions

Para crear un Release y separar las versiones por paquetes, GitHub Actions requiere el cambio de valor de `.github/version.txt` y utiliza los servidores de GitHub para su respectivo empaquetado. El workflow `.github/workflows/version.yml` crea el tag `vX.Y.Z.W` y el Release, que adjunta automáticamente el zip del código fuente.

- **Bump manual:** `Actions > Version > Run workflow`, con dos entradas:
  - `bump`: segmento a incrementar (`build` por defecto).
  - `version`: versión exacta opcional `X.Y.Z.W`; si se indica, tiene prioridad sobre `bump`.
- **Disparo por llegada a `main`/`develop`:** cualquier cambio de `.github/version.txt` que llegue a `main` o `develop` (merge o push) dispara el empaquetado.
- **Canales de publicación:**
  - `develop`: publica el Release como **pre-release**.
  - `main`: publica el Release **estable** (`latest`) o promueve a estable el pre-release existente del mismo tag.
- **Idempotencia:** los reruns no duplican tag ni Release; se omiten o se promueven.
- En ramas distintas de `main`/`develop`, el bump solo actualiza `version.txt`, sin tag ni Release.

#### Equivalencia entre el nombre del segmento y el input del workflow

| Posición | Nombre del segmento | Input `bump` |
| :--- | :--- | :--- |
| 1º | Mayor | `major` |
| 2º | Minior estable | `minor` |
| 3º | Minior-feat | `patch` |
| 4º | Patch | `build` |

### 1.3 Reglas Obligatorias

- **Fuente única:** toda versión se deriva de `.github/version.txt`; queda prohibido declarar la versión del proyecto en otros archivos de código o documentación.
- **Actualización obligatoria:** cada entrega DEBE actualizar `.github/version.txt` con la nueva versión de cuatro segmentos y registrar la entrada correspondiente en [docs/CHANGELOG.md](../../CHANGELOG.md) con el mismo `vX.Y.Z.W`; los registros históricos no se reescriben.
- **Agentes IA:** los agentes de IA SÍ actualizan `.github/version.txt` y el CHANGELOG en cada entrega, aplicando el esquema de [CONTRIBUTING.md](../../../CONTRIBUTING.md) (antes solo lo notificaban al usuario).
- **Publicación:** el tag y el Release con el zip se generan automáticamente con `.github/workflows/version.yml` cuando el cambio de `.github/version.txt` llega a `main` o `develop`; la versión no se duplica en otros archivos ni se crean commits manuales de versión.

---

## 2. Estructura y Nomenclatura Obligatoria del Walkthrough de Implementación

Cada implementación debe acompañarse de un archivo de Walkthrough detallado guardado en:
`docs/walkthroughs/M[XX]/walkthrough_v[X.Y.Z.W]_[MXX]_[descripcion]_[backend|frontend].md`

> 🏷️ **SUFIJO OBLIGATORIO DE CAPA (`_backend` o `_frontend`):**  
> Para evitar colisiones, sobreescrituras y ambigüedades cuando frontend y backend se desarrollan de forma desacoplada dentro del mismo módulo funcional, el nombre de CADA archivo de Walkthrough **DEBE terminar obligatoriamente con el sufijo de su capa técnica al final del nombre**:
> - **Entregas de Backend:** `walkthrough_v[X.Y.Z.W]_[MXX]_[descripcion]_backend.md`  
>   *(Ejemplo: `docs/walkthroughs/M20/walkthrough_v0.3.28.0_M20_seguridad_backend.md`)*
> - **Entregas de Frontend:** `walkthrough_v[X.Y.Z.W]_[MXX]_[descripcion]_frontend.md`  
>   *(Ejemplo: `docs/walkthroughs/M17/walkthrough_v0.3.29.0_M17_auth_simulation_frontend.md`)*

El Walkthrough debe contener obligatoriamente las siguientes 6 secciones:

### 2.1 Metadatos de la Implementación
- **Versión:** `vX.Y.Z.W`
- **Módulo de Origen:** Código y nombre (ej: `M04 Cuentas, Autenticación y Perfil`).
- **Fecha y Autor:** Fecha exacta y responsable (Developer / Agente IA).

### 2.2 Historias de Usuario (HUs) Cubiertas
- Lista de IDs y títulos exactos de las HUs implementadas en esta entrega.
- Alcance funcional alcanzado.

### 2.3 Reglas de Negocio y Políticas de Seguridad Aplicadas
- Reglas específicas del módulo implementadas.
- Políticas transversales validadas:
  - 🔒 `HU-SEG-01` (Hashing seguro).
  - 🛡️ `HU-ADM-03` (Verificación de permisos en servidor).
  - 📧 `HU-NOT-01` (Despacho de eventos SMTP).
  - 🆔 `HU-CUE-08` (Unicidad de cuentas).

### 2.4 Criterios de Aceptación Cumplidos (Matriz de Verificación)
- Tabla o lista detallando cada Criterio de Aceptación (Gherkin: *Dado / Cuando / Entonces*) y cómo fue probado y superado.

### 2.5 Resumen Conceptual de Dependencias Externas (¡Crítico!)
- Análisis de dependencias hacia adelante y hacia atrás:
  - **¿Qué necesita este código para operar al 100% en producción?** (Ej: *Requiere que el módulo M18 configure el servidor SMTP real de producción y que Google Identity configure el Client ID en las variables de entorno*).
  - **¿A qué otros módulos habilita?** (Ej: *Habilita al módulo M07 Checkout para autenticar usuarios antes del pago*).

### 2.6 Registro de Archivos Modificados / Creados
- Lista estricta de archivos creados o modificados, confirmando que **todos pertenecen al módulo asignado** sin haber tocado archivos de otros equipos.
