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

La antigua version utilizada `3.28.0`, se va cambiar por la nueva versión `0.3.28.0`.
Esos cambios se hacen al archivo `.github/version.txt`.
Un ejemplo de contenido y editar:
```
0.3.28.0
```
Si es un parche(fix) debe ir como:
```
0.3.28.1
```

## Recomendaciones
- El dato `X` en la tabla versión no significa que es literalmente `1.X.3` eso es erroneo, la `X` solo es un ejemplo como van separadas los datos de las versiones. 
- El nombre de pull request debe tener lo siguiente:
    - Nombre de implementación y versión(Obligaorio).
    - Dentro de la descripción va detalladamente y el por qué hace un cambio de versión, por ejemplo, hago un arreglo de carrusel que dañaba la web, entonces ve la versión que se esta utilizando en la rama Develop y es la `0.3.28.0`, entonces corresponde un arreglo pequeño que utiliza `Patch` un parche de error, con lo mencionado la versión que se va utilizar es la `0.3.28.1` el dato cambiado fue del `0` al `1` porque es un parche(fix). 

#### Recomendaciones para pull request

### Reglas de contribución
- Al hacer pull request en la plataforma github debe saber que versión esta la rama `develop`, si no coincide la versión que estaba y con la nueva implementación no se acepta los cambios.

## Moderadores
- Todo aquel que tiene acceso pull request y acepte sin visualizar el codigo e versión correspodiente acorde al [README.md](README.md), se le quita la posibilidad aceptar pull request a su grupo y a otros.
- Ver el codigo y que se implementa.
- Si hay errores hacerlo mencionar al usuario que abrio el pull request.
- Verificar si cumple con el cambio de versión, si es un parche, un logro(feat), entre otros.
- Si no cumple acorde al numero de versión del parche no se le acepta la fusión de la rama contribuyente a la rama develop.
- Leer antes de aceptar o enviar algo.
