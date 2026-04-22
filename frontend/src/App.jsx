import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import FiltrosPage from './pages/FiltrosPage';
import DetalleIncidentePage from './pages/DetalleIncidentePage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import Inicio from './pages/Inicio';
import './App.css';

function App() {
  const navigate = useNavigate();
  const [vista, setVista] = useState('vistas');
  const [tema, setTema] = useState('dark');
  const [sidebarAbierta, setSidebarAbierta] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
  }, [tema]);

  const toggleTema = () => setTema((current) => (current === 'dark' ? 'light' : 'dark'));

  const renderLayout = (children, sidebarProps = {}) => (
    <div className={`app-layout ${sidebarAbierta ? '' : 'sidebar-oculta'}`}>
      <div className={`sidebar-container ${sidebarAbierta ? '' : 'cerrada'}`}>
        <Sidebar
          vistaActiva={vista}
          onChangeVista={setVista}
          tema={tema}
          onToggleTema={toggleTema}
          {...sidebarProps}
        />
      </div>

      <main className="app-main">
        <div className="toggle-container">
          <button className="btn-toggle-sidebar" onClick={() => setSidebarAbierta(!sidebarAbierta)}>
            {sidebarAbierta ? '◀ Ocultar Menú' : '☰ Mostrar Menú'}
          </button>
        </div>

        {children}
      </main>
    </div>
  );

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={(
          <ProtectedRoute>
            {renderLayout(
              <>
                {vista === 'vistas' && <FiltrosPage />}
                {vista === 'inicio' && <Inicio />}
              </>,
            )}
          </ProtectedRoute>
        )}
      />

      <Route
        path="/incidente/:id"
        element={(
          <ProtectedRoute>
            {renderLayout(
              <DetalleIncidentePage />,
              { onChangeVista: (nextVista) => { setVista(nextVista); navigate('/'); } },
            )}
          </ProtectedRoute>
        )}
      />
    </Routes>
  );
}

export default App;
