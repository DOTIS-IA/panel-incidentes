import { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ archivos = [], vistaActiva = 'vistas', onChangeVista, tema, onToggleTema }) => {
  const [carpeta, setCarpeta] = useState('Archivos');

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="0" y="0" width="12" height="12" rx="3" fill="var(--color-primary)"/>
            <rect x="16" y="0" width="12" height="12" rx="3" fill="var(--color-primary)" opacity="0.5"/>
            <rect x="0" y="16" width="12" height="12" rx="3" fill="var(--color-primary)" opacity="0.5"/>
            <rect x="16" y="16" width="12" height="12" rx="3" fill="var(--color-primary)"/>
          </svg>
        </div>
        <span className="logo-text">Logo</span>

        {/* Botón tema */}
        <button className="tema-btn" onClick={onToggleTema} title="Cambiar tema">
          {tema === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav">
        <button
          className={`nav-item ${vistaActiva === 'inicio' ? 'active' : ''}`}
          onClick={() => onChangeVista?.('inicio')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 6L8 1L14 6V14H10V10H6V14H2V6Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
          Inicio
        </button>

        <button
          className={`nav-item ${vistaActiva === 'explorador' ? 'active' : ''}`}
          onClick={() => onChangeVista?.('explorador')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="3" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M1 7H15" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 3V1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M11 3V1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Explorador de datos
        </button>

        <button
          className={`nav-item ${vistaActiva === 'vistas' ? 'active' : ''}`}
          onClick={() => onChangeVista?.('vistas')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
          Vistas
        </button>
      </nav>

      {/* Selector carpeta */}
      <div className="sidebar-folder">
        <select
          className="folder-select"
          value={carpeta}
          onChange={(e) => setCarpeta(e.target.value)}
        >
          <option>Archivos</option>
          <option>Reportes</option>
          <option>Exportados</option>
        </select>
      </div>

      {/* Lista archivos */}
      <ul className="sidebar-files">
        {archivos.length === 0
          ? ['Archivo_ejemplo', 'Archivo_ejemplo', 'Archivo_ejemplo', 'Archivo_ejemplo'].map((a, i) => (
              <li key={i} className="file-item">{a}</li>
            ))
          : archivos.map((archivo, i) => (
              <li key={i} className="file-item">{archivo}</li>
            ))
        }
      </ul>

      {/* Usuario */}
      <div className="sidebar-user">
        <div className="user-avatar">A</div>
        <div className="user-info">
          <span className="user-name">admin</span>
          <span className="user-email">company@example.com</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;