import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentsService } from '../services/api';
import SidePreviewPanel from '../components/SidePreviewPanel/SidePreviewPanel';
import './MisCasosPage.css';

const formatDateTime = (value) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
};

const MisCasosPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(() => sessionStorage.getItem('miscasos_tab') || 'asignado');
  const [panelVisible, setPanelVisible] = useState(
    () => sessionStorage.getItem('miscasos_panel') !== 'false'
  );
  const [previewId, setPreviewId] = useState(
    () => sessionStorage.getItem('miscasos_preview_id') || null
  );

  const handleTabChange = (newTab) => {
    if (newTab !== tab) {
      setPreviewId(null);
      sessionStorage.removeItem('miscasos_preview_id');
    }
    setTab(newTab);
  };

  useEffect(() => { sessionStorage.setItem('miscasos_tab', tab); }, [tab]);

  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setPreviewId(null);
    sessionStorage.removeItem('miscasos_preview_id');
    const fetchCasos = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await assignmentsService.getMine(tab);
        if (active) setCasos(data);
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchCasos();
    return () => { active = false; };
  }, [tab]);

  const handleVerDetalle = (idConv) => {
    const caso = casos.find((c) => c.id_conv === idConv);
    const state = tab === 'asignado' && caso ? { assignmentId: caso.id } : {};
    navigate(`/incidente/${idConv}`, state);
  };

  return (
    <div className="mis-casos-page">
      <div className="mis-casos-header">
        <h1 className="mis-casos-title">Mis Casos</h1>
        <p className="mis-casos-subtitle">Casos asignados a tu usuario.</p>
      </div>

      <div className="miscasos-tabs-row">
        <div className="tabs-bar">
          <button
            className={`tab-btn ${tab === 'asignado' ? 'active' : ''}`}
            onClick={() => handleTabChange('asignado')}
          >
            Asignados
          </button>
          <button
            className={`tab-btn ${tab === 'visto' ? 'active' : ''}`}
            onClick={() => handleTabChange('visto')}
          >
            Vistos
          </button>
        </div>
        {casos.length > 0 && (
          <button
            className={`btn-toggle-panel${panelVisible ? ' btn-toggle-panel--activo' : ''}`}
            onClick={() => {
              const next = !panelVisible;
              setPanelVisible(next);
              sessionStorage.setItem('miscasos_panel', String(next));
              if (!next) { setPreviewId(null); sessionStorage.removeItem('miscasos_preview_id'); }
            }}
            title={panelVisible ? 'Ocultar panel de vista previa' : 'Mostrar panel de vista previa'}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.4" fill="none" />
              <line x1="9" y1="1.5" x2="9" y2="13.5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            {panelVisible ? 'Ocultar preview' : 'Mostrar preview'}
          </button>
        )}
      </div>

      {loading && <p className="mis-casos-estado">Cargando casos...</p>}
      {error && <p className="mis-casos-error">Error: {error}</p>}

      {!loading && !error && casos.length === 0 && (
        <p className="mis-casos-estado">No hay casos {tab === 'asignado' ? 'asignados' : 'vistos'}.</p>
      )}

      {casos.length > 0 && (() => {
        const previewData = casos.find((c) => c.id_conv === previewId) ?? null;
        return (
          <div className={`miscasos-layout${panelVisible ? ' con-panel' : ''}`}>
            <div className="casos-lista">
              {casos.map((caso) => (
                <article
                  key={caso.id}
                  className={`caso-card${panelVisible && previewId === caso.id_conv ? ' caso-card--preview-activo' : ''}`}
                  onClick={() => {
                    if (panelVisible) {
                      setPreviewId(caso.id_conv);
                      sessionStorage.setItem('miscasos_preview_id', caso.id_conv);
                    } else {
                      navigate(
                        `/incidente/${caso.id_conv}`,
                        tab === 'asignado' ? { state: { assignmentId: caso.id } } : {},
                      );
                    }
                  }}
                >
                  <div className="caso-meta">
                    <span className="caso-tag">{caso.extortion_name || 'Sin tipo'}</span>
                    <span className="caso-fecha">{formatDateTime(caso.event_ts)}</span>
                  </div>

                  <h3 className="caso-title">{caso.title || caso.id_conv}</h3>

                  <div className="caso-footer">
                    <span>Folio: {caso.folio || '—'}</span>
                    <span>Asignado por: {caso.assigned_by_username}</span>
                    <span>{formatDateTime(caso.assigned_at)}</span>
                  </div>
                </article>
              ))}
            </div>
            {panelVisible && (
              <SidePreviewPanel
                data={previewData}
                onClose={() => { setPreviewId(null); sessionStorage.removeItem('miscasos_preview_id'); }}
                onVerDetalle={handleVerDetalle}
              />
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default MisCasosPage;
