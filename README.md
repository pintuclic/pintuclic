# Pintuclic
Es un proyecto elaborado por aprendices del SENA para la creación de una pagina web.
Todo codigo contributivo se acepta solo aprendices hasta que haya un cambio de dueño.

## Despliegue
Para alojar la web se requiere la herramiento `docker` y `docker-compose`.

### Instalación 
- Arch linux
```
sudo pacman -Sy docker docker-compose
```
- Debian 
```
sudo apt update
sudo apt install docker.io docker-compose-v2
```
- Fedora 
```
sudo dnf install docker docker-compose
```

### Levantar contenedor
Para desarrollo local, configurar las variables de entorno `.env` (obligatorio):
```bash
cp .env.example .env
# editar .env con sus credenciales
```
Levantar el stack (`.env` se carga automáticamente al estar junto al compose):

```bash
docker compose -f docker-compose.yml up --build -d
```

- Frontend: http://localhost:80
- Backend (API): http://localhost:3000
- Logs: `docker compose -f docker-compose.yml logs -f`

### Version dev
El versión dev para probar de test debe ser con
```bash
docker compose -f docker-compose.dev.yml up --build -d
```

### Despliegue automatizado (GitHub Actions)
El workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) corre en el runner
*self-hosted* instalado en el VPS y genera el `.env` en tiempo de despliegue a partir de los
**Secrets** y **Variables** del repositorio (`Settings > Secrets and variables > Actions`),
por lo que **no se versiona ni se crea a mano** en el servidor.

- Se dispara automáticamente con cada push a `develop` y manualmente desde
  `Actions > Deploy > Run workflow`.
- Los secretos (`POSTGRES_PASSWORD`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SMTP_PASS`) van en
  *Secrets*; el resto de configuración (`POSTGRES_USER`, puertos, `SMTP_*`, `GOOGLE_CLIENT_ID`,
  etc.) en *Variables*. El catálogo exacto son las 17 variables de `.env.example`.

## Contribución
Leer el [CONTRIBUTING.md](CONTRIBUTING.md).
