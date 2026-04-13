import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import FiltrosPage from './pages/FiltrosPage';
import './App.css';

function App() {
  const [vista, setVista] = useState('vistas');
  const [tema, setTema]   = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
  }, [tema]);

  const toggleTema = () => setTema(t => t === 'dark' ? 'light' : 'dark');

  return (
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
  );
}

export default App;