# Contribución
Para contribuir en el codigo del respositorio debe saber el funcionamiento del versionamiento que se utilizara.

## Version
El tipo de datos para la versión es semantica y se va utilizar por:

| Versión | Nombre | descripción |
|:-----|:------|:------|
| `1.X.X.X` | **Mayor** | Versión estable todo funcional |
| `X.1.X.X` | **Minior estable** | Versión estable de minior-feat |
| `X.X.1.X` | **Minior-feat** | Cambios que aporta a la web|
| `X.X.X.1` | **Patch** | Arreglos de pequeños para el funcionamiento de la web|

La antigua version utilizada `3.28.0` se va cambiar por la nueva versión `0.3.28.0`.
La versión se declara en el **título de la PR** con el formato `tipo(scope) [X.Y.Z.W]: mensaje` y debe coincidir con el contenido de `.github/version.txt` (el mismo número en ambos).

Ejemplo de título y de archivo para un Minior-feat, partiendo de `0.4.7.3`:
```
feat(carrito) [0.4.8.0]: agregar panel lateral del carrito
```
```
0.4.8.0
```
Si es un parche(fix) desde `0.4.7.3`, el título y el archivo llevan `0.4.7.4`.

| Si el cambio es | Avanza el segmento | Ejemplo desde `0.4.7.3` |
|:-----|:------|:------|
| **Mayor** | 1º (`1.X.X.X`) | `1.0.0.0` |
| **Minior estable** | 2º (`X.1.X.X`) | `0.5.0.0` |
| **Minior-feat** | 3º (`X.X.1.X`) | `0.4.8.0` |
| **Patch** | 4º (`X.X.X.1`) | `0.4.7.4` |

Solo se avanza **un** segmento por PR; los saltos (ej. `0.4.9.0` o `0.4.8.1` desde `0.4.7.3`) los bloquea el lint.

## Recomendaciones
- El dato `X` en la tabla versión no significa que es literalmente `1.X.3` eso es erroneo, la `X` solo es un ejemplo como van separadas los datos de las versiones. 
- El nombre de pull request debe tener el formato `tipo(scope) [X.Y.Z.W]: mensaje` (Obligatorio), por ejemplo `fix(carrito) [0.4.7.4]: corregir cálculo del envío`. La versión declarada debe ser el siguiente paso exacto de la tabla de versiones.
- Dentro de la descripción va detalladamente el por qué del cambio de versión, por ejemplo: hago un arreglo de carrusel que dañaba la web, veo que en `develop` la versión vigente es `0.4.7.3`, entonces corresponde un `Patch` y la versión será `0.4.7.4` (solo cambia el cuarto segmento).
- La PR debe actualizar `.github/version.txt` con el mismo número del título y agregar la entrada `## [vX.Y.Z.W]` en `docs/CHANGELOG.md`; el workflow `PR Title Lint` bloquea el merge si algo no coincide.

#### Recomendaciones para pull request
- Al hacer pull request debes partir de la versión que está en la rama `develop` (`.github/version.txt`); si el número del título no es el siguiente paso exacto de la tabla, el lint rechaza la PR.
- Todo aquel que tiene acceso pull request y acepte sin visualizar el codigo e versión correspodiente, se le quita la posibilidad aceptar pull request a su grupo y a otros.
- Ver el codigo y que se implementa.
- Si hay errores, mencionar al usuario que abrio el pull request.
- Verificar si cumple con el cambio de versión, si es un parche, un logro(feat), entre otros.
- Leer antes de aceptar del pull request.
- Al fusionar la PR, el workflow `Version` revalida el título y `.github/version.txt`, crea el tag anotado `vX.Y.Z.W` sobre el commit fusionado y publica el Release (pre-release en `develop`, estable en `main`) con notas que mencionan a quien abrió la PR. El bot no crea commits: las ramas están protegidas por rulesets.
- Tener en cuenta git flow.
