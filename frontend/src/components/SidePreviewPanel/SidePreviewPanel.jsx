import './SidePreviewPanel.css';

const fmt = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });

const SidePreviewPanel = ({ data, onClose, onVerDetalle }) => {
  if (!data) {
    return (
      <aside className="side-preview-panel">
        <div className="spp-empty">
          <span className="spp-empty-icon">📋</span>
          <p>Selecciona un caso para ver su preview</p>
        </div>
      </aside>
    );
  }

  const idConv = data.id_conv_eleven ?? data.id_conv ?? '—';
  const tipo = data.extortion_name ?? 'Sin tipo';
  const titulo = data.title ?? idConv;
  const resumen = data.summary ?? 'Sin resumen disponible.';
  const folio = data.folio ?? null;
  const agente = data.agent_name ?? data.id_agent ?? null;

  let fechaStr = '—';
  if (data.event_ts) {
    try {
      fechaStr = fmt.format(new Date(data.event_ts));
    } catch {
      fechaStr = data.event_ts;
    }
  }

  return (
    <aside className="side-preview-panel">
      <div className="spp-header">
        <div className="spp-header-top">
          <span className="spp-badge">{tipo}</span>
          <span className="spp-fecha">{fechaStr}</span>
        </div>
        <button className="spp-close" onClick={onClose} aria-label="Cerrar panel">✕</button>
      </div>

      <div className="spp-body">
        <p className="spp-id">{idConv}</p>
        <h3 className="spp-titulo">{titulo}</h3>
        <p className="spp-resumen">{resumen}</p>
        {folio && (
          <p className="spp-meta"><span className="spp-meta-label">Folio:</span> {folio}</p>
        )}
        {agente && (
          <p className="spp-meta"><span className="spp-meta-label">Agente:</span> {agente}</p>
        )}
      </div>

      <div className="spp-footer">
        <button className="spp-btn-detalle" onClick={() => onVerDetalle(idConv)}>
          Ver detalle completo →
        </button>
      </div>
    </aside>
  );
};

export default SidePreviewPanel;
