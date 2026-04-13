import './TipoExtorsion.css';

// =============================================
// SELECTOR TIPO DE EXTORSIÓN
// Props:
//   - tipos: array de strings (puede venir del fetch)
//   - seleccionado: string
//   - onSelect: fn(tipo)
// =============================================

// Tipos por defecto — reemplaza con los que devuelva tu API
const TIPOS_DEFAULT = [
  'Extorsión presencial',
  'Extorsión por secuestro virtual',
  'Extorsión telefónica o virtual',
];

const TipoExtorsion = ({ tipos = TIPOS_DEFAULT, seleccionado, onSelect }) => {
  return (
    <div className="tipo-extorsion">
      <label className="tipo-label">Tipo de extorsión</label>
      <div className="tipo-lista">
        {tipos.map((tipo) => (
          <button
            key={tipo}
            className={`tipo-btn ${seleccionado === tipo ? 'selected' : ''}`}
            onClick={() => onSelect?.(tipo === seleccionado ? null : tipo)}
          >
            {tipo}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TipoExtorsion;