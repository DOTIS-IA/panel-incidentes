Revisa si el README.md necesita actualizarse a partir de los cambios recientes en el repositorio.

Pasos:
1. Ejecuta `git log --oneline -5` para ver el contexto reciente.
2. Ejecuta `git diff HEAD~1 HEAD --name-only` para ver qué archivos cambiaron.
3. Si hay cambios en `backend/api/main.py`, `backend/db/migrations/`, o `frontend/src/pages/Inicio.jsx`, ejecuta `git diff HEAD~1 HEAD -- <archivos relevantes>` para ver el diff.
4. Lee el `README.md` actual.
5. Propón qué secciones actualizar mostrando el texto nuevo sugerido para cada una.

Criterios para la propuesta:
- El README es en español, para el equipo interno
- Describe qué tiene el sistema, no cómo funciona cada módulo
- Solo propón cambios si los archivos relevantes modificaron el comportamiento o la estructura del sistema
- Si no hace falta cambiar nada, dilo en una línea
- No apliques los cambios, solo propón
