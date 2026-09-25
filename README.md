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
Ya teniendo `docker` como despliegue configurar las variables de entorno `.env`(obligatorio):
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

## Contribución
Leer el [CONTRIBUTING.md].
