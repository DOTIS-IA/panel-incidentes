import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TimePicker from '../components/Filters/TimePicker';
import DateRangePicker from '../components/Filters/DateRangePicker';
import TipoExtorsion from '../components/Filters/TipoExtorsion';
import { useIncidentes } from '../hooks/useIncidentes';
import { incidentesService } from '../services/api';
import { guardarReporteEnCache } from '../utils/Reportescache';
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
  const navigate = useNavigate();
  const { loading, error, generarReporte } = useIncidentes();
  const [resultados, setResultados] = useState([]);
  const [consultado, setConsultado] = useState(false);
  const [tiposExtorsion, setTiposExtorsion] = useState([]);

  const [filtros, setFiltros] = useState({
    horaInicio: '09',
    minutosInicio: '00',
    horaFin: '14',
    minutosFin: '00',
    fechaInicio: '',
    fechaFin: '',
    id: '',
    tipoExtorsion: null,
  });

  const set = (key, val) => setFiltros((current) => ({ ...current, [key]: val }));
  const rangoInicioTotal = Number(filtros.horaInicio) * 60 + Number(filtros.minutosInicio);
  const rangoFinTotal = Number(filtros.horaFin) * 60 + Number(filtros.minutosFin);
  const rangoHoraInvalido = rangoFinTotal < rangoInicioTotal;

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

  const limpiarFiltros = () => {
    setFiltros({
      horaInicio: '09',
      minutosInicio: '00',
      horaFin: '14',
      minutosFin: '00',
      fechaInicio: '',
      fechaFin: '',
      id: '',
      tipoExtorsion: null,
    });
    setResultados([]);
    setConsultado(false);
  };

  const handleGenerar = async () => {
    const resultado = await generarReporte(filtros);
    const resultadosGenerados = Array.isArray(resultado) ? resultado : [];
    setResultados(resultadosGenerados);
    setConsultado(true);
    guardarReporteEnCache(filtros, resultadosGenerados);
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
        
        {/* NUEVA DISTRIBUCIÓN 80% / 20% */}
        <div className="filtros-layout-grid">
          
          {/* COLUMNA IZQUIERDA (80%) */}
          <div className="filtros-left-column">
            <div className="filtros-group filtros-panel-card">
              <label className="group-label">Seleccionar hora</label>
              <p className="group-helper">
                Define un rango puntual o usa uno de los horarios sugeridos para acelerar la consulta.
              </p>
              <TimePicker
                horaInicio={filtros.horaInicio}
                minutosInicio={filtros.minutosInicio}
                horaFin={filtros.horaFin}
                minutosFin={filtros.minutosFin}
                onChangeHoraInicio={(h) => set('horaInicio', h)}
                onChangeMinutosInicio={(m) => set('minutosInicio', m)}
                onChangeHoraFin={(h) => set('horaFin', h)}
                onChangeMinutosFin={(m) => set('minutosFin', m)}
              />
            </div>

            <div className="filtros-row">
              <TipoExtorsion
                tipos={tiposExtorsion}
                seleccionado={filtros.tipoExtorsion}
                onSelect={(tipo) => set('tipoExtorsion', tipo)}
              />
            </div>
          </div>

          {/* COLUMNA DERECHA (20%) */}
          <div className="filtros-right-column">
            <div className="filtros-group filtros-group-date filtros-panel-card">
              <label className="group-label">Fecha</label>
              <DateRangePicker
                fechaInicio={filtros.fechaInicio}
                fechaFin={filtros.fechaFin}
                onChangeFechaInicio={(f) => set('fechaInicio', f)}
                onChangeFechaFin={(f) => set('fechaFin', f)}
              />
            </div>
          </div>

        </div>

        {error && <p className="filtros-error">Aviso: {error}</p>}
      </div>

      <div className="filtros-footer">
        <button className="btn-limpiar" onClick={limpiarFiltros} disabled={loading}>
          Limpiar filtros
        </button>
        <button
          className="btn-generar"
          onClick={handleGenerar}
          disabled={loading || rangoHoraInvalido}
        >
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
              <article
                key={item.id_conv_eleven}
                className="resultado-card"
                onClick={() => navigate(`/incidente/${item.id_conv_eleven}`)}
                style={{ cursor: 'pointer' }}
              >
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