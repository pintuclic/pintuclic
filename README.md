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
El tipo de versión que se va utilizar es semantica y va estar conformado por:

| Versión | Nombre | descripción |
|:-----|:------|:------|
| `1.X.X.X` | **Mayor** | Versión estable todo funcional |
| `X.1.X.X` | **Version minior estable** | Versión estable de minior, separar los cambios grandes que se ha hecho para después enviarlo a la rama mian (estable) |
| `X.X.1.X` | **Minior** | Cambios pequeños que aporta a la web|
| `X.X.X.1` | **Patch** | Arreglos de pequeños para el funcionamiento de la web|

la versión se estaría utilizando la antigua, ej: `3.28.0`, se va cambiar por la nueva versión `0.3.28.0`.

### Empaquetado
Para crear un realse y separar las versiones por paquetes de github actions requiere editar el archivo `.github/version.txt` para aplicar y utilizar los servidores de github para su respectivo empaquetado.


