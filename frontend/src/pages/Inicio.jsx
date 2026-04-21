import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerReportes, eliminarReporte, limpiarReportes } from '../utils/reportesCache';
import './Inicio.css';

// Formatea una fecha ISO a formato legible en español
const formatDateTime = (value) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

// Convierte los filtros aplicados en un texto legible
const formatFiltros = (filtros) => {
  if (!filtros) return '—';
  const partes = [];
  if (filtros.fechaInicio)   partes.push(`Desde: ${filtros.fechaInicio}`);
  if (filtros.fechaFin)      partes.push(`Hasta: ${filtros.fechaFin}`);
  if (filtros.tipoExtorsion) partes.push(filtros.tipoExtorsion);
  if (filtros.id)            partes.push(`ID: ${filtros.id}`);
  return partes.length > 0 ? partes.join(' · ') : 'Sin filtros específicos';
};

const Inicio = () => {
  const navigate = useNavigate();
  const [reportes, setReportes]   = useState([]);
  const [expandido, setExpandido] = useState(null);

  // Carga los reportes guardados al entrar a la página
  useEffect(() => {
    setReportes(obtenerReportes());
  }, []);

  const handleEliminar = (id, e) => {
    e.stopPropagation();
    setReportes(eliminarReporte(id));
    if (expandido === id) setExpandido(null);
  };

  const handleLimpiar = () => {
    limpiarReportes();
    setReportes([]);
    setExpandido(null);
  };

  const toggleExpandir = (id) => {
    setExpandido((prev) => (prev === id ? null : id));
  };

  return (
    <div className="inicio-page">

      {/* Encabezado */}
      <div className="inicio-header">
        <div>
          <h1 className="inicio-title">Inicio</h1>
          <p className="inicio-subtitle">
            Reportes generados recientemente, guardados en este dispositivo.
          </p>
        </div>

        {reportes.length > 0 && (
          <button className="btn-limpiar" onClick={handleLimpiar}>
            Limpiar historial
          </button>
        )}
      </div>

      {/* Mensaje cuando no hay reportes */}
      {reportes.length === 0 && (
        <div className="inicio-empty">
          <div className="empty-icon">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect x="6" y="8" width="24" height="22" rx="4" stroke="#4B5563" strokeWidth="1.8" fill="none" />
              <path d="M12 14h12M12 19h8M12 24h6" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="empty-title">Sin reportes guardados</p>
          <p className="empty-desc">
            Ve a Vistas, aplica los filtros y presiona Generar para ver los reportes aquí.
          </p>
        </div>
      )}

      {/* Lista de reportes */}
      {reportes.length > 0 && (
        <div className="inicio-grid">
          {reportes.map((reporte) => {
            const abierto = expandido === reporte.id;

            return (
              <article
                key={reporte.id}
                className={`reporte-card ${abierto ? 'reporte-card--abierto' : ''}`}
              >
                {/* Cabecera: badge + fecha + botones */}
                <div
                  className="reporte-card-header"
                  onClick={() => toggleExpandir(reporte.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && toggleExpandir(reporte.id)}
                >
                  <div className="reporte-meta-left">
                    <span className="reporte-badge">
                      {reporte.total} incidente{reporte.total !== 1 ? 's' : ''}
                    </span>
                    <span className="reporte-fecha">{formatDateTime(reporte.generadoEn)}</span>
                  </div>

                  <div className="reporte-actions">
                    <button
                      className="btn-icon btn-delete"
                      onClick={(e) => handleEliminar(reporte.id, e)}
                      title="Eliminar reporte"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M2 3.5h10M5.5 3.5V2.5a1 1 0 012 0v1M6 6v4M8 6v4M3 3.5l.7 8a1 1 0 001 .9h4.6a1 1 0 001-.9l.7-8"
                          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    <span className={`chevron ${abierto ? 'chevron--up' : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Filtros usados en este reporte */}
                <p className="reporte-filtros">{formatFiltros(reporte.filtros)}</p>

                {/* Incidentes (se muestran al expandir) */}
                {abierto && reporte.resultados.length > 0 && (
                  <div className="reporte-incidentes">
                    {reporte.resultados.map((item) => (
                      <div
                        key={item.id_conv_eleven}
                        className="incidente-row"
                        onClick={() => navigate(`/incidente/${item.id_conv_eleven}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && navigate(`/incidente/${item.id_conv_eleven}`)
                        }
                      >
                        <div className="incidente-row-top">
                          <span className="resultado-tag">
                            {item.extortion_name || 'Sin tipo'}
                          </span>
                          <span className="resultado-fecha">
                            {formatDateTime(item.event_ts)}
                          </span>
                        </div>

                        <p className="incidente-titulo">
                          {item.title || item.id_conv_eleven}
                        </p>

                        <p className="incidente-summary">
                          {item.summary || 'Sin resumen disponible.'}
                        </p>

                        <div className="incidente-foot">
                          <span>ID: {item.id_conv_eleven}</span>
                          <span>Agente: {item.agent_name || item.id_agent || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mensaje si el reporte no tuvo resultados */}
                {abierto && reporte.resultados.length === 0 && (
                  <p className="reporte-sin-incidentes">
                    Este reporte no encontró incidentes con los filtros aplicados.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Inicio;