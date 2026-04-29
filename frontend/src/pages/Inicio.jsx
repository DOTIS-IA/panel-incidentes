import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  obtenerReportes, eliminarReporte, limpiarReportes,
  obtenerHistorial, eliminarDelHistorial, limpiarHistorial,
} from '../utils/Reportescache';
import './Inicio.css';

const formatDateTime = (value) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(parsed);
};

const formatHourRange = (filtros) => {
  if (!filtros?.horaInicio || !filtros?.horaFin) return null;
  return `Hora: ${filtros.horaInicio}:${filtros.minutosInicio || '00'} - ${filtros.horaFin}:${filtros.minutosFin || '00'}`;
};

const formatFiltros = (filtros) => {
  if (!filtros) return 'Sin filtros específicos';
  const partes = [];
  if (filtros.fechaInicio) partes.push(`Desde: ${filtros.fechaInicio}`);
  if (filtros.fechaFin) partes.push(`Hasta: ${filtros.fechaFin}`);
  if (formatHourRange(filtros)) partes.push(formatHourRange(filtros));
  if (filtros.tipoExtorsion) partes.push(filtros.tipoExtorsion);
  if (filtros.id) partes.push(`ID: ${filtros.id}`);
  return partes.length > 0 ? partes.join(' · ') : 'Sin filtros específicos';
};

const EmptyState = ({ mensaje, descripcion }) => (
  <div className="inicio-empty">
    <div className="empty-icon">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <rect x="6" y="8" width="24" height="22" rx="4" stroke="#4B5563" strokeWidth="1.8" fill="none" />
        <path d="M12 14h12M12 19h8M12 24h6" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
    <p className="empty-title">{mensaje}</p>
    <p className="empty-desc">{descripcion}</p>
  </div>
);

const Inicio = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('busquedas');
  const [reportes, setReportes] = useState(() => obtenerReportes());
  const [historial, setHistorial] = useState(() => obtenerHistorial());
  const [expandido, setExpandido] = useState(null);

  const handleEliminarReporte = (id, event) => {
    event.stopPropagation();
    setReportes(eliminarReporte(id));
    if (expandido === id) setExpandido(null);
  };

  const handleLimpiarReportes = () => {
    limpiarReportes();
    setReportes([]);
    setExpandido(null);
  };

  const handleEliminarVisita = (id_conv_eleven, event) => {
    event.stopPropagation();
    setHistorial(eliminarDelHistorial(id_conv_eleven));
  };

  const handleLimpiarHistorial = () => {
    limpiarHistorial();
    setHistorial([]);
  };

  const toggleExpandir = (id) => setExpandido((current) => (current === id ? null : id));

  return (
    <div className="inicio-page">
      <div className="inicio-header">
        <div>
          <h1 className="inicio-title">Registros</h1>
          <p className="inicio-subtitle">
            Caché local de búsquedas e incidentes visitados en este dispositivo.
          </p>
        </div>

        {tab === 'busquedas' && reportes.length > 0 && (
          <button className="btn-limpiar" onClick={handleLimpiarReportes}>Limpiar búsquedas</button>
        )}
        {tab === 'visitados' && historial.length > 0 && (
          <button className="btn-limpiar" onClick={handleLimpiarHistorial}>Limpiar historial</button>
        )}
      </div>

      <div className="inicio-tabs">
        <button
          className={`inicio-tab ${tab === 'busquedas' ? 'is-active' : ''}`}
          onClick={() => setTab('busquedas')}
        >
          Búsquedas
          {reportes.length > 0 && <span className="tab-badge">{reportes.length}</span>}
        </button>
        <button
          className={`inicio-tab ${tab === 'visitados' ? 'is-active' : ''}`}
          onClick={() => setTab('visitados')}
        >
          Visitados
          {historial.length > 0 && <span className="tab-badge">{historial.length}</span>}
        </button>
      </div>

      {tab === 'busquedas' && (
        <>
          {reportes.length === 0 && (
            <EmptyState
              mensaje="Sin búsquedas guardadas"
              descripcion="Ve a Vistas, selecciona filtros y presiona Generar para guardar la búsqueda."
            />
          )}
          {reportes.length > 0 && (
            <div className="inicio-grid">
              {reportes.map((reporte) => {
                const abierto = expandido === reporte.id;
                const resultados = Array.isArray(reporte.resultados) ? reporte.resultados : [];
                return (
                  <article key={reporte.id} className={`reporte-card ${abierto ? 'reporte-card--abierto' : ''}`}>
                    <div
                      className="reporte-card-header"
                      onClick={() => toggleExpandir(reporte.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && toggleExpandir(reporte.id)}
                    >
                      <div className="reporte-meta-left">
                        <span className="reporte-badge">{reporte.total} incidente{reporte.total !== 1 ? 's' : ''}</span>
                        <span className="reporte-fecha">{formatDateTime(reporte.generadoEn)}</span>
                      </div>
                      <div className="reporte-actions">
                        <button className="btn-icon btn-delete" onClick={(e) => handleEliminarReporte(reporte.id, e)} title="Eliminar">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 3.5h10M5.5 3.5V2.5a1 1 0 012 0v1M6 6v4M8 6v4M3 3.5l.7 8a1 1 0 001 .9h4.6a1 1 0 001-.9l.7-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <span className={`chevron ${abierto ? 'chevron--up' : ''}`}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>
                    </div>
                    <p className="reporte-filtros">{formatFiltros(reporte.filtros)}</p>
                    {abierto && resultados.length > 0 && (
                      <div className="reporte-incidentes">
                        {resultados.map((item) => (
                          <div
                            key={item.id_conv_eleven}
                            className="incidente-row"
                            onClick={() => navigate(`/incidente/${item.id_conv_eleven}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && navigate(`/incidente/${item.id_conv_eleven}`)}
                          >
                            <div className="incidente-row-top">
                              <span className="resultado-tag">{item.extortion_name || 'Sin tipo'}</span>
                              <span className="resultado-fecha">{formatDateTime(item.event_ts)}</span>
                            </div>
                            <p className="incidente-titulo">{item.title || item.id_conv_eleven}</p>
                            <p className="incidente-summary">{item.summary || 'Sin resumen disponible.'}</p>
                            <div className="incidente-foot">
                              <span>ID: {item.id_conv_eleven}</span>
                              <span>Agente: {item.agent_name || item.id_agent || 'N/A'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {abierto && resultados.length === 0 && (
                      <p className="reporte-sin-incidentes">Esta búsqueda no encontró incidentes.</p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'visitados' && (
        <>
          {historial.length === 0 && (
            <EmptyState
              mensaje="Sin incidentes visitados"
              descripcion="Los incidentes que abras desde Vistas aparecerán aquí automáticamente."
            />
          )}
          {historial.length > 0 && (
            <div className="inicio-grid">
              {historial.map((item) => (
                <div
                  key={item.id_conv_eleven}
                  className="incidente-row incidente-row--standalone"
                  onClick={() => navigate(`/incidente/${item.id_conv_eleven}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/incidente/${item.id_conv_eleven}`)}
                >
                  <div className="incidente-row-top">
                    <span className="resultado-tag">{item.extortion_name || 'Sin tipo'}</span>
                    <div className="incidente-row-actions">
                      <span className="resultado-fecha">{formatDateTime(item.visitadoEn)}</span>
                      <button
                        className="btn-icon btn-delete"
                        onClick={(e) => handleEliminarVisita(item.id_conv_eleven, e)}
                        title="Eliminar del historial"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 3.5h10M5.5 3.5V2.5a1 1 0 012 0v1M6 6v4M8 6v4M3 3.5l.7 8a1 1 0 001 .9h4.6a1 1 0 001-.9l.7-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="incidente-titulo">{item.title || item.id_conv_eleven}</p>
                  <p className="incidente-summary">{item.summary || 'Sin resumen disponible.'}</p>
                  <div className="incidente-foot">
                    <span>ID: {item.id_conv_eleven}</span>
                    <span>Agente: {item.agent_name || item.id_agent || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Inicio;
