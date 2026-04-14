import './TipoExtorsion.css';

// =============================================
// SELECTOR TIPO DE EXTORSION
// Props:
//   - tipos: array de strings (puede venir del fetch)
//   - seleccionado: string
//   - onSelect: fn(tipo)
// =============================================

const TIPOS_DEFAULT = [
  'Extorsion presencial',
  'Extorsion por secuestro virtual',
  'Extorsion telefonica o virtual',
];

const TipoExtorsion = ({ tipos = TIPOS_DEFAULT, seleccionado, onSelect }) => {
  const opciones = Array.isArray(tipos) && tipos.length > 0 ? tipos : TIPOS_DEFAULT;

  return (
    <div className="tipo-extorsion">
      <label className="tipo-label">Tipo de extorsion</label>
      <div className="tipo-lista">
        {opciones.map((tipo) => (
          <button
            key={tipo}
            type="button"
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
