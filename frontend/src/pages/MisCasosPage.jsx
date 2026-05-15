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
  const [marcando, setMarcando] = useState(new Set());

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

  const handleMarcarVisto = async (e, assignmentId) => {
    e.stopPropagation();
    setMarcando((prev) => new Set(prev).add(assignmentId));
    try {
      await assignmentsService.markAsVisto(assignmentId);
      setCasos((prev) => prev.filter((c) => c.id !== assignmentId));
    } catch (e) {
      setError(e.message);
    } finally {
      setMarcando((prev) => {
        const next = new Set(prev);
        next.delete(assignmentId);
        return next;
      });
    }
  };

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
            onClick={() => navigate(`/incidente/${caso.id_conv}`)}
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

            {tab === 'asignado' && (
              <button
                className="btn-marcar-visto"
                onClick={(e) => handleMarcarVisto(e, caso.id)}
                disabled={marcando.has(caso.id)}
              >
                {marcando.has(caso.id) ? 'Guardando...' : 'Marcar como visto'}
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};

export default MisCasosPage;
