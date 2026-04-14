import { useEffect, useState } from 'react';
import TimePicker from '../components/Filters/TimePicker';
import DateRangePicker from '../components/Filters/DateRangePicker';
import TipoExtorsion from '../components/Filters/TipoExtorsion';
import { useIncidentes } from '../hooks/useIncidentes';
import { incidentesService } from '../services/api';
import './FiltrosPage.css';

const formatDateTime = (value) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const FiltrosPage = () => {
  const { loading, error, generarReporte } = useIncidentes();
  const [resultados, setResultados] = useState([]);
  const [consultado, setConsultado] = useState(false);
  const [tiposExtorsion, setTiposExtorsion] = useState([]);

  const [filtros, setFiltros] = useState({
    hora: '09',
    minutos: '00',
    fechaInicio: '',
    fechaFin: '',
    id: '',
    tipoExtorsion: null,
  });

  const set = (key, val) => setFiltros((current) => ({ ...current, [key]: val }));

  useEffect(() => {
    let active = true;

    const loadTiposExtorsion = async () => {
      try {
        const tipos = await incidentesService.getTiposExtorsion();
        if (active) {
          setTiposExtorsion(tipos);
        }
      } catch {
        if (active) {
          setTiposExtorsion([]);
        }
      }
    };

    loadTiposExtorsion();

    return () => {
      active = false;
    };
  }, []);

  const handleGenerar = async () => {
    const resultado = await generarReporte(filtros);
    setResultados(Array.isArray(resultado) ? resultado : []);
    setConsultado(true);
  };

  return (
    <div className="filtros-page">
      <div className="filtros-header">
        <div>
          <h1 className="filtros-title">Filtros</h1>
          <p className="filtros-subtitle">
            Genera el reporte y revisa los incidentes encontrados sin salir de esta vista.
          </p>
        </div>

        <div className="buscar-id">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="5" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
            <path d="M10 10L13 13" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Buscar ID"
            value={filtros.id}
            onChange={(e) => set('id', e.target.value)}
            className="buscar-input"
          />
        </div>
      </div>

      <div className="filtros-body">
        <div className="filtros-row">
          <div className="filtros-group">
            <label className="group-label">Seleccionar hora</label>
            <TimePicker
              hora={filtros.hora}
              minutos={filtros.minutos}
              onChangeHora={(h) => set('hora', h)}
              onChangeMinutos={(m) => set('minutos', m)}
            />
          </div>

          <div className="filtros-group filtros-group-date">
            <label className="group-label">Fecha</label>
            <DateRangePicker
              fechaInicio={filtros.fechaInicio}
              fechaFin={filtros.fechaFin}
              onChangeFechaInicio={(f) => set('fechaInicio', f)}
              onChangeFechaFin={(f) => set('fechaFin', f)}
            />
          </div>

          <div className="filtros-group filtros-group-id">
            <label className="group-label">ID</label>
            <div className="id-badge">{filtros.id || 'Todos'}</div>
          </div>
        </div>

        <div className="filtros-row">
          <TipoExtorsion
            tipos={tiposExtorsion}
            seleccionado={filtros.tipoExtorsion}
            onSelect={(tipo) => set('tipoExtorsion', tipo)}
          />
        </div>

        {error && <p className="filtros-error">Aviso: {error}</p>}
      </div>

      <div className="filtros-footer">
        <button className="btn-generar" onClick={handleGenerar} disabled={loading}>
          {loading ? 'Generando...' : 'Generar'}
        </button>
      </div>

      {consultado && (
        <section className="resultados-panel">
          <div className="resultados-header">
            <div>
              <h2 className="resultados-title">Resultados</h2>
              <p className="resultados-subtitle">
                {resultados.length > 0
                  ? `${resultados.length} incidente(s) encontrado(s)`
                  : 'No se encontraron incidentes con los filtros actuales'}
              </p>
            </div>
          </div>

          <div className="resultados-lista">
            {resultados.map((item) => (
              <article key={item.id_conv_eleven} className="resultado-card">
                <div className="resultado-meta">
                  <span className="resultado-tag">{item.extortion_name || 'Sin tipo'}</span>
                  <span className="resultado-fecha">{formatDateTime(item.event_ts)}</span>
                </div>

                <h3 className="resultado-title">
                  {item.title || item.id_conv_eleven}
                </h3>

                <p className="resultado-summary">
                  {item.summary || 'Sin resumen disponible para este incidente.'}
                </p>

                <div className="resultado-footer">
                  <span>ID: {item.id_conv_eleven}</span>
                  <span>Agente: {item.agent_name || item.id_agent || 'N/A'}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default FiltrosPage;
