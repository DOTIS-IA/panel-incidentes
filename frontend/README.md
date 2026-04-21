# Panel Incidentes — Frontend

Interfaz React para el panel operativo de incidentes de extorsión. Consume la API FastAPI del directorio `backend/api/`.

## Stack

- **React 19** + **Vite 8**
- **react-router-dom 7** para navegación
- Autenticación JWT guardada en `localStorage`

## Requisitos

- Node.js 20.19+ ó 22 LTS
- API corriendo en `http://localhost:8000` (ver `backend/api/`)

## Configuración

Crea `frontend/.env` antes de arrancar:

```
VITE_API_URL=http://localhost:8000
```

Sin este archivo el frontend apunta a `http://localhost:8003` y todas las peticiones fallarán.

## Comandos

```bash
npm install       # instalar dependencias
npm run dev       # servidor de desarrollo → http://localhost:5173
npm run build     # build de producción
npm run lint      # ESLint
npm run preview   # previsualizar build
```

## Estructura relevante

```
src/
├── App.jsx                  # Rutas y estado compartido (vista, tema, sidebar)
├── components/
│   ├── Sidebar/             # Navegación lateral
│   └── ProtectedRoute.jsx   # Redirige a /login si no hay token
├── pages/
│   ├── LoginPage.jsx
│   ├── FiltrosPage.jsx      # Vista principal con filtros y tabla
│   └── DetalleIncidentePage.jsx
├── hooks/
│   └── useIncidentes.js     # Estado de carga/error para listado
└── services/
    └── api.js               # Todas las llamadas al backend
```

## Rutas

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/login` | `LoginPage` | Formulario de acceso |
| `/` | `FiltrosPage` | Panel principal con filtros |
| `/incidente/:id` | `DetalleIncidentePage` | Detalle de un incidente |

## Sesión

El token se guarda en `localStorage` con la clave `token`. Para cerrar sesión manualmente desde devtools:

```js
localStorage.clear()
```
