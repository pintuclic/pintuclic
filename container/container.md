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

`docker-compose.yml` no se versiona (ver `container/.gitignore`) para evitar
publicar credenciales. Crearlo desde la plantilla si no existe:

```bash
cp container/example-docker-compose.yml container/docker-compose.yml
```

Configurar las credenciales (obligatorias):

```bash
cp container/.env.example container/.env
# editar container/.env con credenciales fuertes
```

Levantar el stack (`.env` se carga automáticamente al estar junto al compose):

```bash
docker compose -f container/docker-compose.yml up --build -d
```

- Frontend: http://localhost:80
- Backend (API): http://localhost:3000/api
- Logs: `docker compose -f container/docker-compose.yml logs -f`

## Variables de entorno

No existen credenciales por defecto: si `POSTGRES_USER`, `POSTGRES_PASSWORD` o
`POSTGRES_DB` no están definidas, `docker compose` aborta el arranque.

| Variable           | Requerida | Descripción                                  |
| ------------------ | --------- | -------------------------------------------- |
| `POSTGRES_USER`    | Sí        | Usuario de PostgreSQL                        |
| `POSTGRES_PASSWORD`| Sí        | Contraseña (alfanumérica, sin `@ : / #`, por ir embebida en `DATABASE_URL`) |
| `POSTGRES_DB`      | Sí        | Base de datos                                |
| `BACKEND_PORT`     | No        | Puerto expuesto del backend (default `3000`) |
| `FRONTEND_PORT`    | No        | Puerto expuesto del frontend (default `80`)  |

Se definen en `container/.env` (no versionado). Nunca se publican en el repo:
`container/.gitignore` excluye `.env` y `docker-compose.yml`.

## Notas

- El backend usa ts-node porque `backend/package.json` no define script de
  build y `backend/src/index.ts` aún no arranca Express. Cuando exista un
  script de build, se recomienda migrar el Dockerfile a compilación `tsc`
  (etapa de build + imagen de runtime sin devDependencies).
- `VITE_API_URL=/api` en build-time + proxy nginx eliminan problemas de CORS.
- No hay bind mounts: el código se copia en las imágenes en build-time.
