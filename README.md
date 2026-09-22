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

- Frontend: http://localhost:80
- Backend (API): http://localhost:3000/api
- Logs: `docker compose -f docker-compose.yml logs -f`


## Versionamiento
El versionamiento de la web se va requerir de la siguiente forma:
### Ejemplo
- 3.28.0
Se requiere tomar estos puntos para su versionamiento.
- 3 -> versionamiento grande nueva
- 28 -> Cambios pequeños de la versión
- 0 -> Arreglos de problemas que presenta la web
