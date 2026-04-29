import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../services/api';
import './LoginPage.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 > Date.now()) {
        navigate('/', { replace: true });
        return;
      }
    } catch {
      // Token corrupto: limpiar sesion y permitir que aparezca el login.
    }

    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('authToken');
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // OAuth2 espera form-data, no JSON
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Error al iniciar sesión');
      }

      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('username', username);

      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <main className="split-container">
        
        <section className="hero-column">
          <div className="hero-content">
            <h2 className="hero-title">Plataforma de Incidentes</h2>
            <p className="hero-description">
              Un visor integral para analizar incidentes de seguridad y visualizar la actividad de datos críticos.
            </p>
          </div>
        </section>

        <section className="login-column">
          <div className="login-card">
            <div className="login-header">
              <h1 className="login-title">Iniciar sesión</h1>
              <p className="login-subtitle">Acceso a la Plataforma Centralizada de Reportes e Incidentes.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-group">
                <label className="login-label">Usuario</label>
                <input
                  type="text"
                  className="login-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  required
                />
              </div>

              <div className="login-group">
                <label className="login-label">Contraseña</label>
                <input
                  type="password"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <div className="login-error">{error}</div>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </section>

      </main>

      <footer className="bottom-bar">
        <p>© 2026 Plataforma Centralizada. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default LoginPage;
