import { Navigate } from 'react-router-dom';

// Envuelve cualquier página que requiera autenticación.
// Si no hay token en localStorage → redirige a /login.
// Si hay token → muestra el contenido normalmente.
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
