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
    

## Versionamiento
El versionamiento de la web se va requerir de la siguiente forma:
### Ejemplo
- 3.28.0
Se requiere tomar estos puntos para su versionamiento.
- 3 -> versionamiento grande nueva
- 28 -> Cambios pequeños de la versión
- 0 -> Arreglos de problemas que presenta la web

### Objetivo
Automatizar el versionado del proyecto para que ya no dependamos de que alguien actualice el número de versión a mano. La versión se toma automáticamente de lo que cada desarrollador escriba en su mensaje de commit, se registra en el CHANGELOG y se publica como Release.

### Formato del commit
A partir de ahora, cada commit debe seguir esta estructura:

```
tipo(módulo): [X.Y.Z] descripción del cambio
```

Ejemplo:
```bash
git commit -m "feat(M01): [3.28.0] agregar validación de formulario de login"
```

- **tipo:** qué clase de cambio es (feat, fix, refactor, etc.)
- **módulo:** la parte del sistema afectada (ej. M01, auth, payments)
- **[X.Y.Z]:** la nueva versión del proyecto — el bot la lee y publica el Release con ese nombre
- **descripción:** el detalle normal del commit, como siempre

### Cómo se elige el número entre corchetes
La marca es la **versión nueva** del proyecto. Se sube el dígito según el tipo de cambio:

| Nivel | Qué dígito sube | Ejemplo desde `3.27.0` |
| :--- | :--- | :--- |
| **Patch** (fix puntual) | el tercero | `[3.27.1]` |
| **Menor (minor)** (feature o mejora) | el segundo | `[3.28.0]` |
| **Mayor (major)** (cambio grande / breaking) | el primero | `[4.0.0]` |

Es decir: el número entre corchetes es la versión con la que queda el proyecto, y el bot la usa tal cual (no la recalcula).

### Qué pasa automáticamente
1. El desarrollador hace push con un commit en ese formato.
2. El bot de GitHub Actions ([.github/workflows/version-bot.yml](.github/workflows/version-bot.yml)) lee el mensaje del último commit.
3. Toma la versión entre corchetes y la registra en `docs/CHANGELOG.md` con su propio commit.
4. Crea el tag y el **GitHub Release `vX.Y.Z`** con el nombre de la versión dada.

El bot corre en cada push a `main` y `release`.
    
### Por qué lo hacemos así
- Evita errores humanos al actualizar versiones a mano.
- Da trazabilidad clara: cualquiera puede ver en el historial de commits por qué subió la versión.
- Estandariza cómo describimos nuestros cambios, lo cual también ayuda a generar changelogs más adelante.

### Importante
Si el commit no trae la marca `[X.Y.Z]`, el bot no toca la versión ni publica Release — así que si un cambio no debe afectar el versionado (como un ajuste de documentación menor), basta con omitir el corchete.

> El CHANGELOG lo gestiona el bot: no se edita a mano. Detalle completo: [GUIA_VERSIONADO_Y_WALKTHROUGHS.md](docs/00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md) (Sección 5).
