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
Automatizar el versionado del proyecto para que ya no dependamos de que alguien actualice el número de versión a mano. La versión se calcula automáticamente a partir de lo que cada desarrollador escriba en su mensaje de commit.

### Formato del commit
A partir de ahora, cada commit debe seguir esta estructura:

```
tipo(módulo): [X.Y.Z] descripción del cambio
```

Ejemplo:
```bash
git commit -m "feat(M01): [0.1.0] agregar validación de formulario de login"
```

- **tipo:** qué clase de cambio es (feat, fix, refactor, etc.)
- **módulo:** la parte del sistema afectada (ej. M01, auth, payments)
- **[X.Y.Z]:** el indicador de versión — esto es lo que el bot va a leer para decidir cómo subir la versión del proyecto
- **descripción:** el detalle normal del commit, como siempre

### Cómo se interpreta el número entre corchetes
El bot no toma el número tal cual, lo usa solo como señal de qué tipo de cambio es:

| Lo que escribes | Qué significa | Qué hace el bot |
| :--- | :--- | :--- |
| `[0.x.x]` | Cambio normal (feature, mejora, fix) | Sube el **minor** de la versión actual del proyecto. Ej: `3.12.4 → 3.13.0` |
| `[1.0.0]` o mayor | Cambio grande / breaking change | Sube el **major** de la versión actual. Ej: `3.13.0 → 4.0.0` |

Es decir: el `[0.1.0]` o `[1.0.0]` que escribe el desarrollador no es la versión final del proyecto, es solo una bandera para decirle al bot "esto es un cambio chico" o "esto es un cambio grande".

### Qué pasa automáticamente
1. El desarrollador hace push con un commit en ese formato.
2. El bot de GitHub Actions ([.github/workflows/version-bot.yml](.github/workflows/version-bot.yml)) lee el mensaje del último commit.
3. Detecta el número entre corchetes y calcula la nueva versión del proyecto (efecto odómetro).
4. Actualiza el archivo de versión `docs/CHANGELOG.md` y sube ese cambio con su propio commit.

El bot corre en cada push a `main` y `release`.

### Por qué lo hacemos así
- Evita errores humanos al actualizar versiones a mano.
- Da trazabilidad clara: cualquiera puede ver en el historial de commits por qué subió la versión.
- Estandariza cómo describimos nuestros cambios, lo cual también ayuda a generar changelogs más adelante.

### Importante
Si el commit no trae el tag `[X.Y.Z]`, el bot simplemente no toca la versión — así que si un cambio no debe afectar el versionado (como un ajuste de documentación menor), basta con omitir el corchete.

> El CHANGELOG lo gestiona el bot: no se edita a mano. Detalle completo: [GUIA_VERSIONADO_Y_WALKTHROUGHS.md](docs/00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md) (Sección 5).
