import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { assignmentsService } from '../services/api';
import './MisCasosPage.css';

const formatDateTime = (value) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
};

const MisCasosPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('asignado');
  const [casos, setCasos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
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

  return (
    <div className="mis-casos-page">
      <div className="mis-casos-header">
        <h1 className="mis-casos-title">Mis Casos</h1>
        <p className="mis-casos-subtitle">Casos asignados a tu usuario.</p>
      </div>

      <div className="tabs-bar">
        <button
          className={`tab-btn ${tab === 'asignado' ? 'active' : ''}`}
          onClick={() => setTab('asignado')}
        >
          Asignados
        </button>
        <button
          className={`tab-btn ${tab === 'visto' ? 'active' : ''}`}
          onClick={() => setTab('visto')}
        >
          Vistos
        </button>
      </div>

      {loading && <p className="mis-casos-estado">Cargando casos...</p>}
      {error && <p className="mis-casos-error">Error: {error}</p>}

      {!loading && !error && casos.length === 0 && (
        <p className="mis-casos-estado">No hay casos {tab === 'asignado' ? 'asignados' : 'vistos'}.</p>
      )}

      <div className="casos-lista">
        {casos.map((caso) => (
          <article
            key={caso.id}
            className="caso-card"
            onClick={() => navigate(`/incidente/${caso.id_conv}`, tab === 'asignado' ? { state: { assignmentId: caso.id } } : {})}
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
    </div>
  );
};

export default MisCasosPage;
