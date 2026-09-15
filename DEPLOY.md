# Despliegue de Pintu Clic — Aplicación modular

Esta entrega usa Vue, Express y PostgreSQL. Su destino autorizado es el repositorio `pintuclic/pintuclic`, rama `feature/m17-permisos-roles`. La carpeta `frontend/` forma parte del stack completo; el servidor se despliega con el compose de la raíz.

## 1. Entrega mediante Git

1. Preparar la entrega contra `feature/m17-permisos-roles` y registrar únicamente código, recursos y documentación del alcance aprobado.
2. Ejecutar las validaciones indicadas abajo y sincronizar versión, lockfile, CHANGELOG y walkthrough.
3. El usuario autorizó publicar en esa rama después del informe de preparación. Integrar a main o desplegar el servidor sigue siendo una operación separada.
4. Publicar únicamente la referencia de destino, sin `--force`. `equipo` debe apuntar a `https://github.com/pintuclic/pintuclic.git`:

```bash
git push equipo HEAD:refs/heads/feature/m17-permisos-roles
```

5. Revisar la propuesta de integración contra `main` antes de desplegar el servidor.

La base remota de M17, `864c9e2`, es ancestro de la entrega. Se incluyen los seis commits existentes de layouts/core hasta `81504da`, necesarios para las vistas de M17, y los commits `41bcc88` y `6081037` de integración y preparación. No se incorpora el merge `b02d13f` ni el historial del repositorio personal. No se reescribe main ni se fuerza la rama remota.

## 2. Validaciones

Usar Node 22, como en los Dockerfiles y los workflows.

```bash
node .github/scripts/check-release.mjs
cd frontend
npm ci
npm run lint -- --max-warnings=0
npm run test:m17
npm run build
cd ../backend
npm ci
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run build
```

El script `backend/npm test` es un marcador sin suite configurada. Después de compilar, CI ejecuta las suites existentes M04 y M18 desde `dist/modules/`. Como M04 no devuelve error de proceso por cada aserción fallida, CI también comprueba su resumen y rechaza cualquier `[FAIL]`. M18 utiliza su transporte SMTP simulado, sin envío externo.

El workflow `quality.yml` instala dependencias desde lockfiles, usa Node 22, ejecuta las comprobaciones anteriores y construye ambas imágenes Docker. Se ejecuta en ramas de trabajo y PR a main, y es requisito de Deploy y Zip Release.

## 3. Configuración y base de datos

- Crear `.env` en el servidor a partir de `.env.example`, con credenciales reales. No incluirlo en Git ni en imágenes.
- Configurar PostgreSQL, JWT, orígenes HTTP permitidos, SMTP y Google Identity según el entorno. El valor `VITE_GOOGLE_CLIENT_ID` se incorpora durante el build.
- Preparar el esquema y la cuenta administradora mediante los procedimientos de base de datos del equipo antes de habilitar el acceso. `docker-compose.yml` no crea el esquema ni aplica el seed automáticamente.
- Usar `npm run db:seed` únicamente en entornos de prueba y conforme a `bd/docs/GUIA_MOCKS_Y_DATOS_PRUEBA.md`. El frontend no incorpora cuentas ni catálogos de demostración.
- Conservar el volumen PostgreSQL y hacer respaldo antes de cualquier migración. No usar `down -v` como procedimiento de actualización.

## 4. Despliegue con Docker Compose

Desde la raíz del checkout que se vaya a desplegar:

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Frontend: puerto `FRONTEND_PORT` (80 por defecto). Backend: `BACKEND_PORT` (3000 por defecto). Nginx resuelve rutas SPA como `/admin` y dirige `/api/` al servicio backend. Verificar `/admin` y `/api/health` por el puerto del frontend, además de `/api/health` por el puerto backend.

El workflow Deploy se limita a `main`, también al iniciarlo manualmente, y requiere runner propio Linux x64 con Docker Compose y `.env` provisionado. Primero pasa Calidad; después construye, levanta y comprueba backend, frontend y proxy. No aprovisiona secretos, dominio, TLS, esquema ni datos iniciales.

## 5. Si se utiliza Dokploy

Crear/configurar una aplicación de tipo **Docker Compose** que use el compose de este proyecto y su `.env`; no reutilizar la aplicación estática con build del Dockerfile raíz. Verificar dominio, puerto interno 80 del frontend y HTTPS en esa aplicación.

Elegir un solo responsable del despliegue: workflow con runner o Dokploy. Si Dokploy administra el stack, deshabilitar el workflow Deploy en la configuración del repositorio antes de integrar a main; el build de Dokploy debe iniciarse después de que Calidad termine correctamente. No habilitar dos despliegues automáticos sobre el mismo entorno. Esta tarea solo prepara los archivos; no modifica Dokploy ni GitHub.

## 6. Release

Zip Release usa exactamente `frontend/package.json`, exige coincidencia con package-lock, la primera entrada del changelog y su walkthrough, y genera la etiqueta `vX.Y.Z`. Una etiqueta existente de otro commit detiene la publicación. El ZIP usa `git archive` del commit validado; no incluye archivos ignorados ni temporales sin seguimiento. La ejecución manual fuera de main no publica ni despliega.

## 7. Reversión

Seleccionar el commit conocido anterior, restaurar su configuración compatible y reconstruir el stack tras revisar compatibilidad del esquema. Un cambio de Git no revierte por sí mismo una migración de base de datos. Publicar esta rama solo ejecuta Calidad; no inicia el workflow Deploy, limitado a main.
