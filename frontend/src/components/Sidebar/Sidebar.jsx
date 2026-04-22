import { useState } from 'react';
import './Sidebar.css';
import logoImg from '../../assets/escudo-hd.png';

const Sidebar = ({ vistaActiva = 'vistas', onChangeVista, tema, onToggleTema }) => {
  const [mostrarMenuSalir, setMostrarMenuSalir] = useState(false);

  const role = localStorage.getItem('role') || '—';
  let username = localStorage.getItem('username');

  if (!username) {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      username = payload.sub || '—';
    } catch {
      username = '—';
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('access_token');

    window.location.href = '/login';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <img src={logoImg} alt="Logo" width="160" height="160" />
        </div>
        <span className="logo-text">Panel de Incidentes de Extorsión</span>

        <button className="tema-btn" onClick={onToggleTema} title="Cambiar tema">
          {tema === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${vistaActiva === 'vistas' ? 'active' : ''}`}
          onClick={() => onChangeVista?.('vistas')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
          Vistas
        </button>

        <button
          className={`nav-item ${vistaActiva === 'inicio' ? 'active' : ''}`}
          onClick={() => onChangeVista?.('inicio')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 6L8 1L14 6V14H10V10H6V14H2V6Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
          Registros
        </button>
      </nav>

      <div className="sidebar-user-container">
        {mostrarMenuSalir && (
          <div className="logout-popover">
            <button className="logout-btn" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Cerrar Sesión
            </button>
          </div>
        )}

        <div
          className="sidebar-user"
          onClick={() => setMostrarMenuSalir(!mostrarMenuSalir)}
        >
          <div className="user-avatar">{username && username !== '—' ? username[0].toUpperCase() : 'A'}</div>
          <div className="user-info">
            <span className="user-name">{username}</span>
            <span className="user-email">{role}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
