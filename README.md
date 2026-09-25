## Docker
Configurar las credenciales (obligatorias):
```bash
cp .env.example .env
# editar .env con sus credenciales
```
Levantar el stack (`.env` se carga automáticamente al estar junto al compose):

```bash
docker compose -f docker-compose.yml up --build -d
```

- Frontend: http://localhost:8080
- Backend (API): http://localhost:3000/api
- Logs: `docker compose -f docker-compose.yml logs -f`

### Version dev
El versión dev para probar de test debe ser con
```bash
docker compose -f docker-compose.dev.yml up --build -d
```

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

### Recomendaciones
- El dato `X` en la tabla versión no significa que es literalmente `1.X.3` eso es erroneo, la `X` solo es un ejemplo como van separadas los datos de las versiones. 
- El nombre de pull request debe tener lo siguiente:
    - Nombre de implementación y versión(Obligaorio).
    - Dentro de la descripción va detalladamente y el por qué hace un cambio de versión, por ejemplo, hago un arreglo de carrusel que dañaba la web, entonces ve la versión que se esta utilizando en la rama Develop y es la `0.3.28.0`, entonces corresponde un arreglo pequeño que utiliza `Patch` un parche de error, con lo mencionado la versión que se va utilizar es la `0.3.28.1` el dato cambiado fue del `0` al `1` porque es un parche(fix). 

#### Recomendaciones para pull request
- Ver el codigo y que se implementa.
- Si hay errores hacerlo mencionar al usuario que abrio el pull request.
- Verificar si cumple con el cambio de versión, si es un parche, un logro(feat), entre otros.
- Si no cumple acorde al numero de versión del parche no se le acepta la fusión de la rama contribuyente a la rama develop.
