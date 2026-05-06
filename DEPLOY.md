# Actualizar producción

## Requisitos previos

- Acceso SSH al servidor
- El PR ya fue mergeado a `main`
- Estar ubicado en el directorio del proyecto en el servidor

## Procedimiento

```bash
# 1. Traer los cambios de main
git pull origin main

# 2. Reconstruir imágenes y reiniciar contenedores
docker compose up -d --build
```

## Verificar el despliegue

```bash
# Ver estado de los contenedores (deben aparecer como healthy / running)
docker compose ps

# Seguir los logs del backend en tiempo real
docker compose logs -f api

# Seguir los logs del frontend en tiempo real
docker compose logs -f frontend
```

## Notas

- `--build` es obligatorio: sin él Docker usa las imágenes cacheadas y los cambios no se reflejan.
- El frontend solo levanta una vez que el `api` pasa el healthcheck (`/health`).
- El archivo `.env` vive únicamente en el servidor y **no** se versiona en el repositorio.
- Si el build falla, revisar los logs con `docker compose logs <servicio>`.
