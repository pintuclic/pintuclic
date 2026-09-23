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

### Marca de versión en los commits (obligatoria)
Cada commit debe indicar el **nivel** del cambio entre corchetes en el asunto. La marca NO es la versión destino, es el tipo de incremento:

| Marca | Nivel | Cuándo usarla | Sobre `3.28.0` da |
| :--- | :--- | :--- | :--- |
| `[0.0.1]` | PATCH | Arreglos de problemas, refactors y ajustes sin cambiar contratos | `3.28.1` |
| `[0.1.0]` | MINOR | Cambios pequeños, nueva funcionalidad o HU | `3.29.0` |
| `[1.0.0]` | MAJOR | Versionamiento grande, cambio estructural o breaking | `4.0.0` |

Ejemplo:
```bash
git commit -m "feat(M01): [0.1.0] implementar consulta publica de catalogo"
```

### Flujo automático (bot de versionado)
- Push/merge a `release`: el bot calcula la versión, crea el tag `vX.Y.Z` y publica un **pre-release** con el zip. No edita el CHANGELOG.
- Merge `release` → `main`: el bot publica la versión **estable**, escribe la entrada final en `docs/CHANGELOG.md` y marca el Release como latest.
- Si ningún commit del rango trae marca `[X.Y.Z]`, no se genera versión.
- Los PRs hacia `main` y `release` se validan automáticamente: sin marca en el título o en algún commit, el check falla.
- El CHANGELOG, los tags y los Releases los gestiona el bot: no se editan a mano.

Detalle completo: [GUIA_VERSIONADO_Y_WALKTHROUGHS.md](docs/00_SISTEMA/02_GUIAS_Y_ESTANDARES/GUIA_VERSIONADO_Y_WALKTHROUGHS.md) (Sección 5) y script `scripts/version-bump.mjs`.
