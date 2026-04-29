import { Navigate } from 'react-router-dom';

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('authToken');
};

const isValidToken = (token) => {
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;

    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!isValidToken(token)) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
