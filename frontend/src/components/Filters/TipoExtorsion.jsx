import { useState } from 'react';
import './TipoExtorsion.css';

const TIPOS_DEFAULT = [
  'Extorsión presencial-exigencia de pago o bienes (Directa)',
  'Extorsión por secuestro virtual',
  'Extorsión telefónica-virtual-exigencia de pago o bienes (Indirecta)',
  'Extorsión escrita-otros medios exigencia de pago o bienes (Indirecta)',
  'Fraude-engaño telefónico-virtual',
  'Denuncia de localización y operación del probable extorsionador o grupo delictivo',
  'Extorsión por invasión-despojo de predio',
  'Extorsión por contenido sexual o íntimo',
];

const normalizeLabel = (tipo) =>
  String(tipo || '')
    .replace(/Extorsi\?n/gi, 'Extorsión')
    .replace(/Extorsion/gi, 'Extorsión')
    .replace(/telef\?nica/gi, 'telefónica')
    .replace(/telefonica/gi, 'telefónica')
    .replace(/engano/gi, 'engaño')
    .replace(/localizacion/gi, 'localización')
    .replace(/operacion/gi, 'operación')
    .replace(/invasion/gi, 'invasión')
    .replace(/intimo/gi, 'íntimo');

const TipoExtorsion = ({ tipos = TIPOS_DEFAULT, seleccionado, onSelect }) => {
  const [abierto, setAbierto] = useState(false);
  const opciones = Array.isArray(tipos) && tipos.length > 0 ? tipos : TIPOS_DEFAULT;

  return (
    <section className="tipo-extorsion">
      <button
        type="button"
        className="tipo-toggle"
        onClick={() => setAbierto((v) => !v)}
      >
        <div className="tipo-toggle-left">
          <span className="tipo-label">Tipo de extorsión</span>
          <span className="tipo-helper">
            {seleccionado
              ? normalizeLabel(seleccionado)
              : 'Selecciona una categoría para enfocar la consulta.'}
          </span>
        </div>
        <svg
          className={`tipo-chevron ${abierto ? 'abierto' : ''}`}
          width="16" height="16" viewBox="0 0 16 16" fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="#9fb3d1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className={`tipo-lista-wrapper ${abierto ? 'abierto' : ''}`}>
        <div className="tipo-lista">
          {opciones.map((tipo, index) => {
            const label = normalizeLabel(tipo);
            return (
              <button
                key={`${index}-${label}`}
                type="button"
                className={`tipo-btn ${seleccionado === tipo ? 'selected' : ''}`}
                onClick={() => {
                  onSelect?.(tipo === seleccionado ? null : tipo);
                  setAbierto(false);
                }}
                title={label}
              >
                <span className="tipo-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="tipo-texto">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TipoExtorsion;