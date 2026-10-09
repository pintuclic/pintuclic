# WALKTHROUGH DE IMPLEMENTACIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.7.1`
* **Módulo de Origen:** `Core / Infraestructura (CI - versionamiento y releases)`
* **Fecha de Entrega:** `09/10/2026`
* **Autor / Responsable:** `Agente de IA`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **N/A (infraestructura)** | Publicar tag y Release a partir de la versión solicitada en la PR fusionada, mencionando (@) al autor | **100% Cumplida** | Trigger `pull_request` + jobs `bump`/`package` en `.github/workflows/version.yml` |

### Descripción del Alcance de la Versión
El workflow `Version` ahora también se dispara cuando una PR se fusiona hacia `main` o `develop`
(evento `pull_request` con `types: [closed]` y verificación `merged == true`). La versión del tag se
resuelve con prioridad desde el **título de la PR** (`vX.Y.Z.W`); si el título difiere de
`.github/version.txt` se publica la del título y se emite una advertencia. El tag se crea sobre el
commit de merge (`merge_commit_sha`) y las notas del Release incorporan el número de PR, su enlace y
la mención `@usuario` de quien abrió la PR. El camino `push` (cambio de `version.txt`) se conserva y
ahora resuelve la PR asociada al commit vía API para incluir la misma mención, lo que cubre también
PRs provenientes de forks (donde el token del evento `pull_request` es de solo lectura).

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas
- **Prioridad del título:** si el título de la PR contiene `vX.Y.Z.W` (o `X.Y.Z.W`), esa es la versión a publicar; `.github/version.txt` se usa solo como respaldo y como control de coincidencia.
- **Advertencia por discrepancia:** si el título y `version.txt` difieren, se publica la del título y se registra `::warning::` + nota en el resumen del workflow.
- **Protección de integridad:** si la versión pedida es menor que la vigente en `version.txt`, se omite la publicación (evita degradar el release).
- **PR sin versión en el título:** en evento `pull_request` se omite la publicación (el push de `version.txt` la cubre si el archivo cambió), evitando dobles corridas ruidosas.
- **Idempotencia:** tag y Release existentes no se duplican; `develop` publica pre-release y `main` publica o promueve el Release estable, igual que antes.
- **Fuente única:** la versión sigue residiendo en `.github/version.txt`; el workflow no la duplica en otros archivos.
- **`workflow_dispatch`:** el bump manual (`build`/`patch`/`minor`/`major` o versión exacta) conserva su comportamiento sin cambios.
- **Concurrencia:** el job `package` mantiene `concurrency: version-package`, por lo que las corridas `push` y `pull_request` del mismo merge se serializan y la segunda es idempotente.

### B. Políticas de Seguridad Aplicadas
- 🔐 **Permisos mínimos:** `permissions: contents: write` + `pull-requests: read`; no se usan secretos adicionales al `GITHUB_TOKEN`.
- 🧱 **Prevención de inyección:** el título de la PR se pasa por `env:` y solo se extrae mediante regex numérica; nunca se interpola dentro del script ni se usa como comando.
- 🛡️ **PRs desde forks:** el evento `pull_request` de un fork recibe token de solo lectura y no puede crear tags; en ese caso el `push` a `main`/`develop` (token de escritura) publica el tag y resuelve al autor vía API.
- 🔎 **Trazabilidad:** el tag anotado y las notas del Release referencian `#PR` y `@autor` (auditoría de quién solicitó cada versión).

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-INF-01** | **Dado** una PR fusionada a `main`/`develop` con versión en el título, **Cuando** corre el workflow, **Entonces** se crea el tag `vX.Y.Z.W` en el commit de merge. | Inspección del trigger `pull_request` + `ref: merge_commit_sha` | ✅ **CUMPLIDO** |
| **CA-INF-02** | **Dado** un título con `v0.4.8.0` y `version.txt` con `0.4.7.0`, **Cuando** se resuelve la versión, **Entonces** se publica `0.4.8.0` con advertencia. | Caso 1 de la prueba de lógica (6 casos) | ✅ **CUMPLIDO** |
| **CA-INF-03** | **Dado** una PR sin versión en el título, **Cuando** el evento es `pull_request`, **Entonces** la publicación se omite sin error. | Caso 2 de la prueba de lógica | ✅ **CUMPLIDO** |
| **CA-INF-04** | **Dado** una versión pedida menor que la vigente, **Cuando** se resuelve, **Entonces** se omite la publicación. | Caso 4 de la prueba de lógica | ✅ **CUMPLIDO** |
| **CA-INF-05** | **Dado** un Release publicado, **Cuando** se generan las notas, **Entonces** incluyen `#PR por @autor` y el enlace. | Parseo de PR asociada simulado (payload real y `[]`) | ✅ **CUMPLIDO** |
| **CA-INF-06** | **Dado** el mismo merge disparando `push` y `pull_request`, **Cuando** corren ambos jobs, **Entonces** no se duplican tag ni Release. | `concurrency: version-package` + checks de existencia | ✅ **CUMPLIDO** |
| **CA-INF-07** | **Dado** un PR de prueba en `develop`, **Cuando** se fusione, **Entonces** el Release pre-release aparece con la mención del autor. | ⏳ **PENDIENTE (validar con la primera PR fusionada tras el merge)** | ⏳ **PENDIENTE** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (¿De qué requiere para operar al 100% en Producción?)
- **Repositorio GitHub:** el workflow debe existir en `main`; el ajuste aplica a las PRs fusionadas posteriores al merge de esta entrega.
- **Permisos del `GITHUB_TOKEN`:** requiere `contents: write` (tags/Releases/commits) y `pull-requests: read` (resolver la PR asociada en eventos `push`).
- **Runner `ubuntu-latest`:** usa `gh` (preinstalado) y `jq` (preinstalado) para consultar la PR del commit.
- **Convención de títulos de PR:** el título debe incluir `vX.Y.Z.W` (ya exigido por `CONTRIBUTING.md`) para que el tag use la versión solicitada.

### B. Dependencias Hacia Adelante (¿A qué otros módulos habilita este desarrollo?)
- **Todos los módulos (M01–M20):** sus entregas obtienen tag, Release y notas con trazabilidad de PR y autor sin trabajo manual adicional.
- **Auditoría y gobernanza:** facilita verificar que la versión publicada coincide con la solicitada en la PR y quién la abrió.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ **Verificación de Límites de Módulo:** no se modificó código de `backend/src` ni
> `frontend/src`, ni archivos de módulos funcionales. Alcance exclusivamente de infraestructura,
> documentación y versionado.

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[MODIFICADO]** | `.github/workflows/version.yml` | Trigger `pull_request` (closed/merged), resolución de versión por título de PR, mención `@autor` en notas/tag, checkout del commit de merge y permisos `pull-requests: read`. |
| **[MODIFICADO]** | `.github/version.txt` | Bump a `0.4.7.1`. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada de la versión `v0.4.7.1`. |
| **[MODIFICADO]** | `docs/00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md` | Nueva sección §1.2: disparo por PR fusionada, prioridad del título y mención del autor. |
| **[MODIFICADO]** | `CONTRIBUTING.md` | Aclaración del flujo de tag/Release por PR y mención del autor. |
| **[NUEVO]** | `docs/walkthroughs/core/walkthrough_v0.4.7.1_core_tag_release_desde_pr.md` | Este documento. |

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` — YAML validado con parser; lógica de versión probada con 6 casos; parseo de PR asociada simulado con `[]` y payload real.
* **Apego al Diagrama de Flujo:** `N/A — cambio de infraestructura CI, sin diagrama funcional asociado`
