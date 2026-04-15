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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
  }, [tema]);

  const toggleTema = () => setTema(t => t === 'dark' ? 'light' : 'dark');

  return (
    <Routes>
      {/* Ruta pública — no requiere token */}
      <Route path="/login" element={<LoginPage />} />

      {/* Ruta protegida — redirige a /login si no hay token */}
      <Route path="/" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar
              vistaActiva={vista}
              onChangeVista={setVista}
              archivos={[]}
              tema={tema}
              onToggleTema={toggleTema}
            />
            <main className="app-main">
              {vista === 'vistas'     && <FiltrosPage />}
              {vista === 'inicio'     && <div style={{padding:40}}>Inicio — en construcción</div>}
              {vista === 'explorador' && <div style={{padding:40}}>Explorador — en construcción</div>}
            </main>
          </div>
        </ProtectedRoute>
      } />

      <Route path="/incidente/:id" element={
        <ProtectedRoute>
          <div className="app-layout">
            <Sidebar
              archivos={[]}
              tema={tema}
              onToggleTema={toggleTema}
              onChangeVista={() => {}}
            />
            <main className="app-main">
              <DetalleIncidentePage />
            </main>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;