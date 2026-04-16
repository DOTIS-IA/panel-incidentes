import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import FiltrosPage from './pages/FiltrosPage';
import DetalleIncidentePage from './pages/DetalleIncidentePage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const [vista, setVista] = useState('vistas');
  const [tema, setTema]   = useState('dark');
  
  
  const [sidebarAbierta, setSidebarAbierta] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
  }, [tema]);

  const toggleTema = () => setTema(t => t === 'dark' ? 'light' : 'dark');

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={
        <ProtectedRoute>
          {/* Le agregamos una clase dinámica al layout para saber su estado */}
          <div className={`app-layout ${sidebarAbierta ? '' : 'sidebar-oculta'}`}>
            
            {/* Envolvemos el Sidebar en un contenedor que podamos animar */}
            <div className={`sidebar-container ${sidebarAbierta ? '' : 'cerrada'}`}>
              <Sidebar
                vistaActiva={vista}
                onChangeVista={setVista}
                archivos={[]}
                tema={tema}
                onToggleTema={toggleTema}
              />
            </div>

            <main className="app-main">
              {/* Botón para abrir/cerrar la barra lateral */}
              <div className="toggle-container">
                <button className="btn-toggle-sidebar" onClick={() => setSidebarAbierta(!sidebarAbierta)}>
                  {sidebarAbierta ? '◀ Ocultar Menú' : '☰ Mostrar Menú'}
                </button>
              </div>

              {vista === 'vistas'     && <FiltrosPage />}
              {vista === 'inicio'     && <div style={{padding:40}}>Inicio — en construcción</div>}
              {vista === 'explorador' && <div style={{padding:40}}>Explorador — en construcción</div>}
            </main>
          </div>
        </ProtectedRoute>
      } />

      <Route path="/incidente/:id" element={
        <ProtectedRoute>
          <div className={`app-layout ${sidebarAbierta ? '' : 'sidebar-oculta'}`}>
            <div className={`sidebar-container ${sidebarAbierta ? '' : 'cerrada'}`}>
              <Sidebar
                archivos={[]}
                tema={tema}
                onToggleTema={toggleTema}
                onChangeVista={() => {}}
              />
            </div>
            <main className="app-main">
              <div className="toggle-container">
                <button className="btn-toggle-sidebar" onClick={() => setSidebarAbierta(!sidebarAbierta)}>
                  {sidebarAbierta ? '◀ Ocultar Menú' : '☰ Mostrar Menú'}
                </button>
              </div>
              <DetalleIncidentePage />
            </main>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;