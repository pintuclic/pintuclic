# WALKTHROUGH DE IMPLEMENTACIÓN

## 1. METADATOS DE LA IMPLEMENTACIÓN

* **Versión Generada:** `v0.4.8.0`
* **Módulo de Origen:** `Core / Infraestructura (CI - versionado y releases)`
* **Fecha de Entrega:** `14/10/2026`
* **Autor / Responsable:** `Mapachuelo (@Mapachuelo)`
* **Estado de la Implementación:** `✅ COMPLETO`

---

## 2. HISTORIAS DE USUARIO CUBIERTAS EN ESTA VERSIÓN

| ID Historia | Título de la Historia de Usuario | Estado de Cobertura | Endpoints / Componentes Desarrollados |
| :--- | :--- | :---: | :--- |
| **N/A (infraestructura)** | Publicación automática de tag y Release a partir de la versión declarada en el título de la PR fusionada | **100% Cumplida** | `.github/workflows/pr-title-lint.yml`, `.github/workflows/version.yml`, `.github/scripts/versioning.mjs` |

### Descripción del Alcance de la Versión
La versión del proyecto se declara ahora en el **título de la PR** con el formato
`tipo(scope) [X.Y.Z.W]: mensaje`; la PR debe actualizar `.github/version.txt` con el mismo
número y agregar la entrada `## [vX.Y.Z.W]` en `docs/CHANGELOG.md`. Un lint bloqueante valida
todo antes del merge. Al fusionar, el bot resuelve la PR del commit, revalida la coincidencia y
publica el tag anotado `vX.Y.Z.W` y el Release con notas basadas **solo en PRs**.

Además se corrigió la duplicación reportada: antes cada merge disparaba dos ejecuciones
(`push` + `pull_request`), las notas listaban la PR dos veces (sección Pull Request + lista de
commits de `### Cambios`) y el cuerpo repetía la versión del título.

---

## 3. REGLAS DE NEGOCIO Y POLÍTICAS DE SEGURIDAD APLICADAS

### A. Reglas de Negocio Específicas
- **Tabla de versiones (`CONTRIBUTING.md`):** solo se avanza un segmento por PR.
  - `[1.0.0.0]` → Mayor (1º) · `[0.5.0.0]` → Minior estable (2º) · `[0.4.8.0]` → Minior-feat (3º) · `[0.4.7.4]` → Patch (4º) — ejemplos partiendo de `0.4.7.3`.
- **Coincidencia obligatoria:** versión del título = `.github/version.txt` = entrada del CHANGELOG. El bot no publica si el commit fusionado no cumple (protege la fuente única).
- **Autoría y fecha:** la entrada debe ser `## [vX.Y.Z.W] - AAAA-MM-DD` con la línea `- **Autor:** Nombre (@usuario)` de la persona real que realiza la entrega; la IA nunca se registra como autora ni se menciona en el CHANGELOG.
- **Lint bloqueante:** `pr-title-lint.yml` rechaza títulos fuera de formato, saltos de versión, archivo desajustado, CHANGELOG ausente, fecha inválida o autor faltante; también ejecuta las pruebas del motor.
- **Un solo disparo por merge:** el bot escucha `push` a `main`/`develop` (se eliminó el evento `pull_request`), resuelve la PR del commit vía API (squash, rebase o forks) y publica una única vez.
- **Canales:** `develop` publica pre-release; `main` publica estable o promueve el pre-release del mismo tag. La ejecución manual (`workflow_dispatch`) solo republica la versión vigente de `version.txt` (reintentos/recuperación).
- **Idempotencia:** reruns, tags y Releases existentes no se duplican; se omiten o se promueven.
- **Rulesets como restricción de diseño:** `develop` exige PR con 1 aprobación y solo permite squash; `main` exige 2 aprobaciones y squash. Por eso el bot **no crea commits**: únicamente etiqueta el commit fusionado y publica, que sí está permitido.

### B. Políticas de Seguridad Aplicadas
- 🔐 **Permisos mínimos:** `contents: write` + `pull-requests: read`; el lint solo usa `contents: read`. No se agregaron secretos: se usa el `GITHUB_TOKEN` del repositorio.
- 🧱 **Prevención de inyección:** el título de la PR se pasa por `env:` y se valida con una expresión regular numérica; nunca se interpola como comando.
- 🛡️ **PRs desde forks:** al ejecutarse en `push` (token de escritura del repositorio base), la creación del tag y del Release funciona también para ramas externas.
- 🧾 **Trazabilidad:** el tag anotado y las notas del Release referencian `#PR`, el título y `@autor` (una sola vez).

---

## 4. MATRIZ DE CRITERIOS DE ACEPTACIÓN CUMPLIDOS

| ID Criterio | Criterio de Aceptación | Método de Validación | Resultado |
| :--- | :--- | :--- | :---: |
| **CA-INF-01** | **Dado** el formato `tipo(scope) [X.Y.Z.W]: mensaje`, **Cuando** se valida el título, **Entonces** se extrae tipo, scope, versión y mensaje. | 10 pruebas `node --test` del motor | ✅ **CUMPLIDO** |
| **CA-INF-02** | **Dado** `0.4.7.3`, **Cuando** se declara `0.4.8.0`, **0.4.7.4**, `0.5.0.0` o `1.0.0.0`, **Entonces** se clasifica como Minior-feat, Patch, Minior estable o Mayor. | `classifyStep` con las cuatro filas | ✅ **CUMPLIDO** |
| **CA-INF-03** | **Dado** un salto (`0.4.9.0`, `0.4.8.1`), repetición o versión menor, **Cuando** se valida, **Entonces** el lint bloquea la PR. | Casos negativos de `classifyStep` y `validateInput` | ✅ **CUMPLIDO** |
| **CA-INF-04** | **Dado** un desajuste entre título y `version.txt` o CHANGELOG ausente, **Cuando** se valida, **Entonces** se reportan ambos errores y la PR no puede fusionarse. | CLI `validate` con casos reales | ✅ **CUMPLIDO** |
| **CA-INF-05** | **Dado** una PR fusionada con versión válida, **Cuando** corre el bot, **Entonces** crea el tag `vX.Y.Z.W` sobre el commit fusionado y publica el Release con notas que listan la PR una sola vez. | Revisión del flujo + notas generadas por `releaseNotes` | ✅ **CUMPLIDO** |
| **CA-INF-06** | **Dado** un rerun, un tag existente o un Release ya publicado, **Cuando** corre el bot, **Entonces** no duplica nada y asegura/promueve el Release. | Ramas de idempotencia en `release` + `tagExists`/`releaseExists` | ✅ **CUMPLIDO** |
| **CA-INF-07** | **Dado** un push sin PR asociada (push directo), **Cuando** corre el bot, **Entonces** se omite con advertencia y sin fallar. | `resolvePrs` + resumen del workflow | ✅ **CUMPLIDO** |
| **CA-INF-09** | **Dado** una entrada sin `- **Autor:**` o con fecha fuera de `AAAA-MM-DD`, **Cuando** corre el lint, **Entonces** el merge queda bloqueado; el bot avisa si el commit fusionado no los trae. | `validateChangelogEntry` + CLI `validate` | ✅ **CUMPLIDO** |
| **CA-INF-08** | **Dado** el merge de esta misma entrega, **Cuando** llegue a `develop`, **Entonces** se crea el pre-release `v0.4.8.0` sin commits adicionales. | ⏳ **PENDIENTE (primera corrida real)** | ⏳ **PENDIENTE** |

---

## 5. RESUMEN CONCEPTUAL DE DEPENDENCIAS EXTERNAS E INTEGRACIÓN

### A. Dependencias Hacia Atrás (¿De qué requiere para operar al 100% en Producción?)
- **Rulesets de GitHub:** `develop`/`main` bloquean pushes directos (incluido el bot); los tags y Releases sí están permitidos. Si algún día se habilita un actor de bypass o un PAT, el bot podría además escribir archivos, pero el diseño actual no lo necesita.
- **Permisos del `GITHUB_TOKEN`:** `contents: write` (tags y Releases) y `pull-requests: read` (resolver la PR del commit). El evento `push` ejecuta el workflow del commit fusionado, por lo que no depende del default branch.
- **Runner `ubuntu-latest`:** requiere `node` (>= 18), `git` y la CLI `gh` autenticada; el script no usa dependencias npm.
- **`workflow_dispatch`:** al no existir todavía el workflow en el default branch (`main` está desactualizado), la ejecución manual quedará disponible cuando `main` reciba este cambio.

### B. Dependencias Hacia Adelante (¿A qué otros módulos habilita este desarrollo?)
- **Todos los módulos (M01–M20):** sus PRs obtienen tag, Release y notas con trazabilidad sin trabajo manual, siempre que declaren la versión en el título y actualicen `version.txt` + CHANGELOG.
- **Gobernanza de versiones:** el lint elimina las versiones duplicadas o saltadas (casos históricos como `v0.4.7.2` sin tag o dos entradas `v0.4.7.0`) y garantiza la coincidencia título/archivo/tag/Release.

---

## 6. REGISTRO DE ARCHIVOS MODIFICADOS Y CREADOS

> ⚠️ **Verificación de Límites de Módulo:** no se modificó código de `backend/src` ni
> `frontend/src`, ni archivos de módulos funcionales. Alcance exclusivamente de infraestructura,
> documentación y versionado.

| Tipo de Acción | Ruta Relativa del Archivo | Descripción del Contenido |
| :---: | :--- | :--- |
| **[NUEVO]** | `.github/scripts/versioning.mjs` | Motor de versionado: parseo del título, tabla de segmentos, validaciones, notas del Release y orquestación de tag/Release (sin dependencias). |
| **[NUEVO]** | `.github/scripts/versioning.test.mjs` | 10 pruebas `node --test` del motor. |
| **[NUEVO]** | `.github/workflows/pr-title-lint.yml` | Lint bloqueante del título, `version.txt`, CHANGELOG (fecha y autor reales) y pruebas del motor. |
| **[MODIFICADO]** | `.github/workflows/version.yml` | Disparo único por `push` a `main`/`develop`; tag + Release desde el motor; sin commits. |
| **[MODIFICADO]** | `.github/version.txt` | Declara `0.4.8.0`. |
| **[MODIFICADO]** | `docs/CHANGELOG.md` | Entrada `## [v0.4.8.0]`. |
| **[MODIFICADO]** | `CONTRIBUTING.md` | Nuevo formato de título, tabla de avance y coincidencia obligatoria. |
| **[MODIFICADO]** | `docs/00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md` | Secciones 1.1, 1.2 y 1.3 actualizadas al flujo automático. |
| **[MODIFICADO]** | `AGENTS.md` | Regla de versión: se declara en el título de la PR; prohibido crear tag/Release a mano. |
| **[NUEVO]** | `docs/walkthroughs/core/walkthrough_v0.4.8.0_core_versionado_por_pr.md` | Este documento. |

---

## 7. DICTAMEN FINAL

* **Pruebas de Calidad Superadas (QA Gate):** `✅ SÍ` — 11/11 pruebas del motor en verde (incluye autor y fecha del CHANGELOG); casos reales del CLI `validate` verificados (válido y bloqueantes); YAML validado.
* **Apego al Diagrama de Flujo:** `N/A — cambio de infraestructura CI, sin diagrama funcional asociado`
