import { useEffect, useState } from 'react';
import { usersService, assignmentsService } from '../../services/api';
import './AsignarModal.css';

const AsignarModal = ({ idConvs, onClose, onSuccess }) => {
  const [monitoristas, setMonitoristas] = useState([]);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [asignados, setAsignados] = useState(null);
  const [saltadas, setSaltadas] = useState([]);

  useEffect(() => {
    let active = true;
    usersService.getMonitoristas()
      .then((data) => { if (active) setMonitoristas(data); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setCargando(false); });
    return () => { active = false; };
  }, []);

  const toggle = (username) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(username) ? next.delete(username) : next.add(username);
      return next;
    });
  };

  const handleConfirmar = async () => {
    if (seleccionados.size === 0) return;
    setGuardando(true);
    setError(null);
    try {
      const usernames = [...seleccionados];
      const resultados = await Promise.all(
        idConvs.map((id_conv) => assignmentsService.create(id_conv, usernames)),
      );
      const creadas = resultados.flat();

      // Detectar combinaciones que el backend omitió (ya existían)
      const omitidas = [];
      for (const id_conv of idConvs) {
        for (const username of usernames) {
          const fueCreada = creadas.some(
            (r) => r.id_conv === id_conv && r.assigned_to_username === username,
          );
          if (!fueCreada) omitidas.push({ id_conv, username });
        }
      }

      setAsignados(creadas.length);
      setSaltadas(omitidas);
      onSuccess?.(creadas);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  };

  const plural = idConvs.length > 1;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h2 className="modal-titulo">
            Asignar {plural ? `${idConvs.length} casos` : 'caso'}
          </h2>
          <button className="modal-cerrar" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="modal-body">
          {cargando && <p className="modal-estado">Cargando monitoristas...</p>}
          {error && <p className="modal-error">Error: {error}</p>}
          {asignados !== null && asignados > 0 && (
            <p className="modal-exito">
              {asignados} asignación{asignados !== 1 ? 'es' : ''} creada{asignados !== 1 ? 's' : ''} correctamente.
            </p>
          )}

          {saltadas.length > 0 && (
            <div className="modal-advertencia">
              <p className="modal-advertencia-titulo">
                {saltadas.length} asignación{saltadas.length !== 1 ? 'es' : ''} omitida{saltadas.length !== 1 ? 's' : ''} — ya existía{saltadas.length !== 1 ? 'n' : ''}:
              </p>
              <ul className="modal-advertencia-lista">
                {saltadas.map(({ id_conv, username }) => (
                  <li key={`${id_conv}-${username}`}>
                    <span className="adv-username">{username}</span>
                    <span className="adv-sep">→</span>
                    <span className="adv-conv">{id_conv}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!cargando && !error && monitoristas.length === 0 && (
            <p className="modal-estado">No hay monitoristas disponibles.</p>
          )}

          {monitoristas.length > 0 && (
            <ul className="monitoristas-lista">
              {monitoristas.map((m) => (
                <li key={m.id} className="monitorista-item">
                  <label className="monitorista-label">
                    <input
                      type="checkbox"
                      checked={seleccionados.has(m.username)}
                      onChange={() => toggle(m.username)}
                      disabled={guardando || asignados !== null}
                    />
                    <span className="monitorista-nombre">{m.username}</span>
                    {m.email && <span className="monitorista-email">{m.email}</span>}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-modal-cancelar" onClick={onClose} disabled={guardando}>
            {asignados !== null ? 'Cerrar' : 'Cancelar'}
          </button>
          {asignados === null && (
            <button
              className="btn-modal-confirmar"
              onClick={handleConfirmar}
              disabled={seleccionados.size === 0 || guardando}
            >
              {guardando
                ? 'Asignando...'
                : `Asignar a ${seleccionados.size} monitorista${seleccionados.size !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default AsignarModal;
