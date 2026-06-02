import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { incidentesService, assignmentsService } from '../services/api';
import AsignarModal from '../components/AsignarModal/AsignarModal';
import './AsignacionesPage.css';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
};

const AsignacionesPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(() => sessionStorage.getItem('asig_tab') || 'casos');

  useEffect(() => {
    sessionStorage.setItem('asig_tab', tab);
  }, [tab]);

  // ── Tab Casos ────────────────────────────────────────────────────────────────
  const [incidentes, setIncidentes] = useState([]);
  const [loadingCasos, setLoadingCasos] = useState(false);
  const [errorCasos, setErrorCasos] = useState(null);
  const [buscado, setBuscado] = useState(false);
  const [folio, setFolio] = useState('');
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [modalAbierto, setModalAbierto] = useState(false);
  const [folioError, setFolioError] = useState(null);

  // Restaura la última búsqueda al volver del detalle del caso
  useEffect(() => {
    try {
      const cache = sessionStorage.getItem('asig_casos_cache');
      if (cache) {
        const { incidentes: inc, folio: f } = JSON.parse(cache);
        setIncidentes(inc);
        setFolio(f || '');
        setBuscado(true);
      }
    } catch { /* sessionStorage no disponible o dato corrupto */ }
  }, []);

  // ── Tab Resumen ──────────────────────────────────────────────────────────────
  const [asignaciones, setAsignaciones] = useState([]);
  const [loadingResumen, setLoadingResumen] = useState(false);
  const [errorResumen, setErrorResumen] = useState(null);
  const [filtroMonitorista, setFiltroMonitorista] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const buscarCasos = async () => {
    if (!folio.trim()) {
      setFolioError('Primero introduce el folio a buscar.');
      return;
    }
    setFolioError(null);
    setLoadingCasos(true);
    setErrorCasos(null);
    setBuscado(true);
    setSeleccionados(new Set());
    try {
      const data = await incidentesService.getAll({ folio: folio.trim() });
      sessionStorage.setItem('asig_casos_cache', JSON.stringify({ incidentes: data, folio }));
      setIncidentes(data);
    } catch (e) {
      setErrorCasos(e.message);
    } finally {
      setLoadingCasos(false);
    }
  };

  const limpiarBusqueda = () => {
    setIncidentes([]);
    setFolio('');
    setBuscado(false);
    setFolioError(null);
    setErrorCasos(null);
    setSeleccionados(new Set());
    sessionStorage.removeItem('asig_casos_cache');
  };

  const cargarResumen = async () => {
    setLoadingResumen(true);
    setErrorResumen(null);
    try {
      const data = await assignmentsService.getAll({
        status: filtroStatus || null,
        monitorista: filtroMonitorista || null,
      });
      setAsignaciones(data);
    } catch (e) {
      setErrorResumen(e.message);
    } finally {
      setLoadingResumen(false);
    }
  };

  useEffect(() => {
    if (tab === 'resumen') cargarResumen();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const toggleSeleccion = (id_conv, e) => {
    e.stopPropagation();
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id_conv) ? next.delete(id_conv) : next.add(id_conv);
      return next;
    });
  };

  const handleAsignacionExitosa = () => {
    setSeleccionados(new Set());
  };

  return (
    <div className="asignaciones-page">
      <div className="asig-header">
        <h1 className="asig-titulo">Asignaciones</h1>
        <p className="asig-subtitulo">Asigna casos a monitoristas y revisa el estado de las asignaciones.</p>
      </div>

      <div className="asig-tabs">
        <button
          className={`asig-tab-btn ${tab === 'casos' ? 'active' : ''}`}
          onClick={() => setTab('casos')}
        >
          Casos
        </button>
        <button
          className={`asig-tab-btn ${tab === 'resumen' ? 'active' : ''}`}
          onClick={() => setTab('resumen')}
        >
          Resumen
        </button>
      </div>

      {/* ── Tab Casos ─────────────────────────────────────────────────────────── */}
      {tab === 'casos' && (
        <>
          <div className="asig-filtros">
            <div className="asig-filtro-grupo">
              <label className="asig-filtro-label">Folio</label>
              <input
                type="text"
                className={`asig-filtro-input${folioError ? ' asig-filtro-input--error' : ''}`}
                placeholder="Ej. EXT-2024-001"
                value={folio}
                onChange={(e) => { setFolio(e.target.value); if (folioError) setFolioError(null); }}
                onKeyDown={(e) => e.key === 'Enter' && buscarCasos()}
              />
              {folioError && <p className="asig-folio-error">{folioError}</p>}
            </div>
            <button className="btn-buscar-casos" onClick={buscarCasos} disabled={loadingCasos}>
              {loadingCasos ? 'Buscando...' : 'Buscar'}
            </button>
            {buscado && (
              <button className="btn-limpiar-casos" onClick={limpiarBusqueda}>
                Limpiar
              </button>
            )}
          </div>

          {errorCasos && <p className="asig-error">Error: {errorCasos}</p>}

          {!loadingCasos && !errorCasos && incidentes.length === 0 && (
            <p className="asig-estado">
              {buscado ? 'No se encontraron casos.' : 'Usa los filtros para buscar casos.'}
            </p>
          )}

          <div className="casos-asig-lista">
            {incidentes.map((inc) => {
              const seleccionado = seleccionados.has(inc.id_conv_eleven);
              return (
                <article
                  key={inc.id_conv_eleven}
                  className={`caso-asig-card ${seleccionado ? 'seleccionado' : ''}`}
                  onClick={() => navigate(`/incidente/${inc.id_conv_eleven}`)}
                >
                  <input
                    type="checkbox"
                    className="caso-checkbox"
                    checked={seleccionado}
                    onChange={(e) => toggleSeleccion(inc.id_conv_eleven, e)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="caso-asig-info">
                    <div className="caso-asig-meta">
                      <span className="asig-tag">{inc.extortion_name || 'Sin tipo'}</span>
                      <span className="asig-fecha">{formatDate(inc.event_ts)}</span>
                    </div>
                    <p className="caso-asig-titulo">{inc.title || inc.id_conv_eleven}</p>
                    {inc.folio && <span className="caso-asig-folio">Folio: {inc.folio}</span>}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* ── Tab Resumen ───────────────────────────────────────────────────────── */}
      {tab === 'resumen' && (
        <>
          <div className="asig-filtros">
            <div className="asig-filtro-grupo">
              <label className="asig-filtro-label">Monitorista</label>
              <input
                type="text"
                className="asig-filtro-input"
                placeholder="Nombre de usuario"
                value={filtroMonitorista}
                onChange={(e) => setFiltroMonitorista(e.target.value)}
              />
            </div>
            <div className="asig-filtro-grupo">
              <label className="asig-filtro-label">Estado</label>
              <select
                className="asig-filtro-input"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="asignado">Asignado</option>
                <option value="visto">Visto</option>
              </select>
            </div>
            <button className="btn-buscar-casos" onClick={cargarResumen} disabled={loadingResumen}>
              {loadingResumen ? 'Cargando...' : 'Filtrar'}
            </button>
          </div>

          {errorResumen && <p className="asig-error">Error: {errorResumen}</p>}
          {loadingResumen && <p className="asig-estado">Cargando asignaciones...</p>}

          {!loadingResumen && !errorResumen && asignaciones.length === 0 && (
            <p className="asig-estado">No hay asignaciones.</p>
          )}

          {asignaciones.length > 0 && (
            <div className="resumen-tabla-wrapper">
              <table className="resumen-tabla">
                <thead>
                  <tr>
                    <th>Caso</th>
                    <th>Monitorista</th>
                    <th>Asignado por</th>
                    <th>Fecha asignación</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {asignaciones.map((a) => (
                    <tr
                      key={a.id}
                      className="resumen-fila"
                      onClick={() => navigate(`/incidente/${a.id_conv}`)}
                    >
                      <td>
                        <span className="resumen-caso-titulo">{a.title || a.id_conv}</span>
                        {a.folio && <span className="resumen-folio"> · {a.folio}</span>}
                      </td>
                      <td>{a.assigned_to_username}</td>
                      <td>{a.assigned_by_username}</td>
                      <td>{formatDate(a.assigned_at)}</td>
                      <td>
                        <span className={`badge-asig-status ${a.status}`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Toolbar flotante ──────────────────────────────────────────────────── */}
      {seleccionados.size > 0 && (
        <div className="toolbar-flotante">
          <span className="toolbar-count">
            {seleccionados.size} caso{seleccionados.size !== 1 ? 's' : ''} seleccionado{seleccionados.size !== 1 ? 's' : ''}
          </span>
          <button className="btn-toolbar-limpiar" onClick={() => setSeleccionados(new Set())}>
            Limpiar
          </button>
          <button className="btn-toolbar-asignar" onClick={() => setModalAbierto(true)}>
            Asignar seleccionados
          </button>
        </div>
      )}

      {modalAbierto && (
        <AsignarModal
          idConvs={[...seleccionados]}
          onClose={() => setModalAbierto(false)}
          onSuccess={handleAsignacionExitosa}
        />
      )}
    </div>
  );
};

export default AsignacionesPage;
