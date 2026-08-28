# Plan de Despliegue — Pintuclic (Docker)

Despliegue completo del proyecto Pintuclic en contenedores Docker. Todo se construye
dentro de los contenedores: el host solo necesita Docker y Docker Compose.

## Arquitectura

```text
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   frontend  │─────▶│   backend   │─────▶│      db     │
│ nginx:alpine│ /api │ node+ts-node│      │ postgres:15 │
│    :80      │      │    :3000    │      │    :5432    │
└─────────────┘      └─────────────┘      └─────────────┘
```

- **frontend** (`container/frontend/Dockerfile`): build multi-stage. Etapa 1
  instala dependencias y compila con Vite (`VITE_API_URL=/api`); etapa 2 sirve
  el `dist/` con nginx. `nginx.conf` redirige `/api/*` al backend (mismo
  origen, sin CORS).
- **backend** (`container/backend/Dockerfile`): `node:22-alpine`, instala
  dependencias con `npm ci` (incluye devDependencies para ts-node) y ejecuta
  `src/index.ts` con ts-node.
- **db**: `postgres:15-alpine` con volumen persistente `pgdata` y healthcheck.

## Uso

```bash
# Desde la raíz del proyecto
docker compose -f container/docker-compose.yml up --build -d
```

- Frontend: http://localhost:80
- Backend (API): http://localhost:3000/api
- Logs: `docker compose -f container/docker-compose.yml logs -f`

## Variables de entorno

| Variable           | Default     | Descripción                          |
| ------------------ | ----------- | ------------------------------------ |
| `POSTGRES_USER`    | `pintuclic` | Usuario de PostgreSQL                |
| `POSTGRES_PASSWORD`| `pintuclic` | Contraseña de PostgreSQL             |
| `POSTGRES_DB`      | `pintuclic` | Base de datos                        |
| `BACKEND_PORT`     | `3000`      | Puerto expuesto del backend          |
| `FRONTEND_PORT`    | `80`        | Puerto expuesto del frontend         |

Se pueden sobrescribir desde un archivo `.env` (no versionado) en el directorio
`container/` o inline:

```bash
POSTGRES_PASSWORD=secreto BACKEND_PORT=8080 docker compose -f container/docker-compose.yml up --build -d
```

## Notas

- El backend usa ts-node porque `backend/package.json` no define script de
  build y `backend/src/index.ts` aún no arranca Express. Cuando exista un
  script de build, se recomienda migrar el Dockerfile a compilación `tsc`
  (etapa de build + imagen de runtime sin devDependencies).
- `VITE_API_URL=/api` en build-time + proxy nginx eliminan problemas de CORS.
- No hay bind mounts: el código se copia en las imágenes en build-time.