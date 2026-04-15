import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { incidentesService } from '../services/api';
import './DetalleIncidentePage.css';

const fmt = (value) => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  const d = new Date(value);
  if (!isNaN(d.getTime()) && typeof value === 'string' && value.includes('T')) {
    return new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  }
  return String(value);
};

const fmtDate = (value) => {
  if (!value) return '—';
  const d = new Date(value + 'T00:00:00');
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' }).format(d);
};

const fmtDuration = (secs) => {
  if (secs === null || secs === undefined) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
};

const Campo = ({ label, value }) => (
  <div className="detalle-campo">
    <span className="campo-label">{label}</span>
    <span className="campo-value">{value ?? '—'}</span>
  </div>
);

const Seccion = ({ titulo, children }) => (
  <section className="detalle-seccion">
    <h2 className="seccion-titulo">{titulo}</h2>
    <div className="seccion-grid">{children}</div>
  </section>
);

const DetalleIncidentePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incidente, setIncidente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transcripcionAbierta, setTranscripcionAbierta] = useState(false);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    incidentesService.getById(id)
      .then((data) => { if (active) setIncidente(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="detalle-estado">Cargando incidente...</div>;
  if (error)   return <div className="detalle-estado detalle-error">Error: {error}</div>;
  if (!incidente) return null;

  const i = incidente;

  return (
    <div className="detalle-page">

      {/* Encabezado */}
      <div className="detalle-header">
        <button className="btn-volver" onClick={() => navigate(-1)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M8.5 2L3.5 7L8.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver
        </button>

        <div className="detalle-header-info">
          <div className="detalle-badges">
            {i.extortion_name && (
              <span className="badge badge-tipo">{i.extortion_name}</span>
            )}
            {i.is_actionable !== null && (
              <span className={`badge ${i.is_actionable ? 'badge-accionable' : 'badge-no-accionable'}`}>
                {i.is_actionable ? 'Procedente' : 'No Procedente'}
              </span>
            )}
          </div>
          <h1 className="detalle-titulo">{i.title || i.id_conv_eleven}</h1>
          {i.folio && <p className="detalle-folio">Folio: {i.folio}</p>}
        </div>
      </div>

      {/* Resumen */}
      {i.summary && (
        <section className="detalle-seccion">
          <h2 className="seccion-titulo">Resumen</h2>
          <p className="detalle-resumen">{i.summary}</p>
        </section>
      )}

      {/* Identificadores */}
      <Seccion titulo="Identificadores">
        <Campo label="ID conversación"  value={i.id_conv_eleven} />
        <Campo label="ID agente"        value={i.id_agent} />
        <Campo label="Nombre agente"    value={i.agent_name} />
        <Campo label="ID extorsión"     value={i.id_extortion} />
      </Seccion>

      {/* Tiempos */}
      <Seccion titulo="Tiempos">
        <Campo label="Fecha del evento"  value={fmt(i.event_ts)} />
        <Campo label="Inicio"            value={fmt(i.start_time)} />
        <Campo label="Fin"               value={fmt(i.end_time)} />
        <Campo label="Duración"          value={fmtDuration(i.duration_secs)} />
      </Seccion>

      {/* Datos del reporte */}
      <Seccion titulo="Datos del reporte">
        <Campo label="Fecha de reporte"  value={fmtDate(i.report_date)} />
        <Campo label="Modalidad"         value={i.mode} />
        <Campo label="Hora del reporte"  value={i.time_rep} />
        <Campo label="Lugar"             value={i.place} />
        <Campo label="Teléfono"          value={i.phone} />
        <Campo label="Rol del llamante"  value={i.caller_role} />
        <Campo label="Vía de contacto"   value={i.contact_via} />
        <Campo label="Tipo de demanda"   value={i.demand_type} />
      </Seccion>

      {/* Montos */}
      <Seccion titulo="Montos y cuentas">
        <Campo
          label="Monto(s) exigido(s)"
          value={i.required_amount?.length ? i.required_amount.map(a => `$${a}`).join(', ') : null}
        />
        <Campo
          label="Monto(s) depositado(s)"
          value={i.deposited_amount?.length ? i.deposited_amount.map(a => `$${a}`).join(', ') : null}
        />
        <Campo
          label="No. de cuenta(s)"
          value={i.acc_numbers?.length ? i.acc_numbers.join(', ') : null}
        />
        <Campo
          label="Titular(es)"
          value={i.acc_holders?.length ? i.acc_holders.join(', ') : null}
        />
      </Seccion>

      {/* Transcripción */}
      {i.transcription && (
        <section className="detalle-seccion">
          <button
            className="seccion-titulo seccion-titulo-toggle"
            onClick={() => setTranscripcionAbierta(v => !v)}
          >
            Transcripción {transcripcionAbierta ? '▲' : '▼'}
          </button>

          {transcripcionAbierta && (
            Array.isArray(i.transcription) ? (
              <div className="transcripcion-dialogo">
                {i.transcription.map((turno, idx) => {
                  const esAgente = turno.role === 'agent';
                  const mins = Math.floor((turno.time_in_call_secs ?? 0) / 60);
                  const secs = String((turno.time_in_call_secs ?? 0) % 60).padStart(2, '0');
                  const tiempo = `${mins}:${secs}`;
                  return (
                    <div key={idx} className={`turno ${esAgente ? 'turno-agente' : 'turno-usuario'}`}>
                      <span className="turno-hablante">{esAgente ? 'Agente' : 'Víctima'}</span>
                      <p className="turno-mensaje">{turno.message}</p>
                      <span className="turno-tiempo">{tiempo}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <pre className="detalle-transcripcion">
                {JSON.stringify(i.transcription, null, 2)}
              </pre>
            )
          )}
        </section>
      )}

    </div>
  );
};

export default DetalleIncidentePage;
