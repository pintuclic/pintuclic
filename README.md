



## Docker
Ejecutar docker compose para su lanzamiento
```bash
cp example-docker-compose.yml docker-compose.yml
```

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
- Logs: `docker compose -f container/docker-compose.yml logs -f`

