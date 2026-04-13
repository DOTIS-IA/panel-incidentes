# PULL_REQUEST_TEMPLATE.md

## ¿Qué hace este PR?

<!-- Describe brevemente qué cambia o agrega -->

## Tipo de cambio

- [ ] `feat` — Nueva funcionalidad
- [ ] `fix` — Corrección de bug
- [ ] `refactor` — Reestructuración sin cambios funcionales
- [ ] `docs` — Documentación
- [ ] `chore` — Mantenimiento (dependencias, config)
- [ ] Migración de base de datos

## ¿Cómo probarlo?

<!-- Pasos concretos para verificar que funciona -->

1.
2.
3.

## Checklist

- [ ] El código corre sin errores (`uvicorn main:app --reload`)
- [ ] Los endpoints nuevos responden correctamente en `/docs`
- [ ] Si hay migración SQL: sigue el formato `YYYYMMDD_NNN_descripcion.sql`
- [ ] Sin `.env`, credenciales ni claves en el código
- [ ] `CLAUDE.md` actualizado si se agregaron endpoints o cambió la arquitectura
- [ ] El PR apunta a `main`

## Notas adicionales

<!-- Decisiones técnicas, contexto o cosas a revisar -->


---

## Referencia rápida — Convenciones de commits

### Formato

```
<tipo>(<alcance>): <descripción corta en imperativo>
```

### Tipos

| Tipo | Cuándo usarlo |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Documentación |
| `refactor` | Reestructuración sin cambios funcionales |
| `chore` | Mantenimiento, dependencias |
| `style` | Formateo de código |

### Ejemplos

```bash
feat(api): agregar endpoint de tipos de extorsión
fix(auth): corregir validación de token expirado
docs(claude): actualizar endpoints en CLAUDE.md
chore(deps): agregar bcrypt y python-jose
refactor(main): separar routers en archivos independientes
```

### Reglas

- Usar imperativo: `agregar` no `agregué` ni `agregando`
- Máximo 72 caracteres en la primera línea
- Sin punto final
- Un commit por cambio lógico — no mezclar features con fixes

---

## Proceso completo para hacer un PR

```bash
# 1. Asegúrate de estar actualizado
git checkout main
git pull origin main

# 2. Crea tu rama
git checkout -b feature/nombre-descriptivo

# 3. Desarrolla y haz commits atómicos
git add backend/api/main.py
git commit -m "feat(api): agregar endpoint /extortion-types"

# 4. Sube tu rama
git push origin feature/nombre-descriptivo

# 5. Abre el PR en GitHub
#    → Ve a tu repo en GitHub
#    → Aparece el botón "Compare & pull request"
#    → Llena el template y asigna revisores

# 6. Después de aprobación → merge a main
```

### Ramas de trabajo

```
main                  → producción, siempre estable
feature/nombre        → nueva funcionalidad
fix/nombre            → corrección de bug
refactor/nombre       → refactoring
docs/nombre           → documentación
```
